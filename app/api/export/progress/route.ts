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

    // Obtener todos los registros de completación de lecciones
    const progressData = await adminClient.fetch(`
      *[_type == "lessonCompletion"] | order(completedAt desc) {
        _id,
        completedAt,
        "studentFirstName": student->firstName,
        "studentFullName": student->fullName,
        "studentEmail": student->email,
        "courseTitle": course->title,
        "moduleTitle": module->title,
        "lessonTitle": lesson->title,
        "enrolledAt": *[_type == "enrollment" && student._ref == ^.student._ref && course._ref == ^.course._ref][0].enrolledAt
      }
    `);

    // Formatear datos para CSV
    const formattedData = progressData.map((record: any) => ({
      Estudiante: record.studentFullName || record.studentFirstName || 'N/A',
      Email: record.studentEmail || 'N/A',
      Curso: record.courseTitle || 'N/A',
      Módulo: record.moduleTitle || 'N/A',
      Lección: record.lessonTitle || 'N/A',
      'Fecha Completada': record.completedAt ? formatDate(record.completedAt) : 'N/A',
      'Fecha Inscripción': record.enrolledAt ? formatDate(record.enrolledAt) : 'N/A'
    }));

    const headers = ['Estudiante', 'Email', 'Curso', 'Módulo', 'Lección', 'Fecha Completada', 'Fecha Inscripción'];
    const csvContent = convertToCSV(formattedData, headers);

    // Generar nombre de archivo con fecha
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `progreso-academico-historico-completo-${dateStr}.csv`;

    // Retornar CSV como descarga
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error al exportar historial de progreso académico:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}