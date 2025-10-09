import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { formatDate } from "@/lib/utils";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Función para convertir datos a CSV
const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return headers.join(',') + '\n';

  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const keys = header.split('.');
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      return escapeCSVField(value);
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si el usuario es administrador
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Acceso restringido. Solo administradores" }, { status: 403 });
    }

    // Obtener datos consolidados de todos los estudiantes
    const consolidatedData = await adminClient.fetch(`
      *[_type == "student"] | order(firstName asc) {
        _id,
        firstName,
        lastName,
        fullName,
        email,
        "categoryName": category->name,
        registrationDate,
        lastActive,
        "totalMeetings": count(*[_type == "meeting" && references(^.category._ref) && isVirtual == true]),
        "attendedMeetings": count(*[_type == "attendance" && student._ref == ^._id && attended == true]),
        "attendanceRate": count(*[_type == "attendance" && student._ref == ^._id && attended == true]) / count(*[_type == "meeting" && references(^.category._ref) && isVirtual == true]) * 100,
        "enrolledCourses": count(*[_type == "enrollment" && student._ref == ^._id]),
        "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id]),
        "lastLessonCompleted": *[_type == "lessonCompletion" && student._ref == ^._id] | order(completedAt desc)[0].completedAt,
        "lastAttendanceDate": *[_type == "attendance" && student._ref == ^._id] | order(date desc)[0].date
      }
    `);

    // Formatear datos para CSV
    const formattedData = consolidatedData.map((record: any) => ({
      Estudiante: record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A',
      Email: record.email || 'N/A',
      Categoría: record.categoryName || 'Sin categoría',
      'Fecha Registro': record.registrationDate ? formatDate(record.registrationDate) : 'N/A',
      'Última Actividad': record.lastActive ? formatDate(record.lastActive) : 'N/A',
      'Total Reuniones': record.totalMeetings || 0,
      'Asistencias': record.attendedMeetings || 0,
      'Tasa Asistencia (%)': record.attendanceRate ? Math.round(record.attendanceRate) : 0,
      'Cursos Inscritos': record.enrolledCourses || 0,
      'Lecciones Completadas': record.completedLessons || 0,
      'Última Lección': record.lastLessonCompleted ? formatDate(record.lastLessonCompleted) : 'N/A',
      'Última Asistencia': record.lastAttendanceDate ? formatDate(record.lastAttendanceDate) : 'N/A'
    }));

    const headers = [
      'Estudiante', 'Email', 'Categoría', 'Fecha Registro', 'Última Actividad',
      'Total Reuniones', 'Asistencias', 'Tasa Asistencia (%)',
      'Cursos Inscritos', 'Lecciones Completadas', 'Última Lección', 'Última Asistencia'
    ];

    const csvContent = convertToCSV(formattedData, headers);

    // Generar nombre de archivo con fecha
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `reporte-consolidado-estudiantes-${dateStr}.csv`;

    // Retornar CSV como descarga
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error al exportar reporte consolidado:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}