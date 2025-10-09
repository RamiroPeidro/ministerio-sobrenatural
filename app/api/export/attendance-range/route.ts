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

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Se requieren fechas de inicio y fin" }, { status: 400 });
    }

    // Construir query GROQ
    let query = `*[_type == "attendance" && date >= $startDate && date <= $endDate`;
    const params: any = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate + 'T23:59:59').toISOString()
    };

    if (categoryId && categoryId !== 'all') {
      query += ` && category._ref == $categoryId`;
      params.categoryId = categoryId;
    }

    query += `] | order(date desc) {
      _id,
      date,
      attended,
      "studentFirstName": student->firstName,
      "studentFullName": student->fullName,
      "studentEmail": student->email,
      "categoryName": category->name,
      "meetingTitle": meeting->title,
      "meetingType": meeting->isVirtual ? "Virtual" : "Presencial"
    }`;

    const attendanceData = await adminClient.fetch(query, params);

    // Formatear datos para CSV
    const formattedData = attendanceData.map((record: any) => ({
      Estudiante: record.studentFullName || record.studentFirstName || 'N/A',
      Email: record.studentEmail || 'N/A',
      Categoría: record.categoryName || 'N/A',
      Reunión: record.meetingTitle || 'N/A',
      Tipo: record.meetingType || 'N/A',
      Fecha: record.date ? formatDate(record.date) : 'N/A',
      Asistió: record.attended ? 'Sí' : 'No'
    }));

    const headers = ['Estudiante', 'Email', 'Categoría', 'Reunión', 'Tipo', 'Fecha', 'Asistió'];
    const csvContent = convertToCSV(formattedData, headers);

    // Generar nombre de archivo
    const filename = `asistencias-${startDate}-a-${endDate}.csv`;

    // Retornar CSV como descarga
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error al exportar asistencias por rango de fechas:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}