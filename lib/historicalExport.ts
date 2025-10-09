import { adminClient } from "@/sanity/lib/adminClient";
import { formatDate } from "@/lib/utils";

// Tipos para los datos de exportación
export type AttendanceRecord = {
  _id: string;
  date: string;
  attended: boolean;
  studentFirstName?: string;
  studentFullName?: string;
  studentEmail?: string;
  categoryName?: string;
  meetingTitle?: string;
  meetingType?: string;
  ip?: string;
  userAgent?: string;
};

export type LessonCompletionRecord = {
  _id: string;
  completedAt: string;
  studentFirstName?: string;
  studentFullName?: string;
  studentEmail?: string;
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  enrolledAt?: string;
};

export type ConsolidatedStudentRecord = {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  categoryName?: string;
  registrationDate?: string;
  lastActive?: string;
  totalMeetings: number;
  attendedMeetings: number;
  attendanceRate: number;
  enrolledCourses: number;
  completedLessons: number;
  lastLessonCompleted?: string;
  lastAttendanceDate?: string;
};

// Función para convertir datos a CSV
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return headers.join(',') + '\n';

  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // Escapar comillas dobles y envolver en comillas si contiene comas, saltos de línea o comillas
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

// Función para descargar CSV
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Función para generar nombre de archivo con fecha
export const generateFilename = (prefix: string, extension: string = 'csv'): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${dateStr}.${extension}`;
};

// Exportar TODO el historial de asistencias
export const exportAllAttendanceHistory = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    // Primero obtener el conteo total para mostrar progreso
    const totalCount = await adminClient.fetch<number>(
      `count(*[_type == "attendance"])`
    );

    if (onProgress) onProgress(0, totalCount);

    // Obtener todos los registros de asistencia sin límite
    const attendanceData = await adminClient.fetch<AttendanceRecord[]>(`
      *[_type == "attendance"] | order(date desc) {
        _id,
        date,
        attended,
        "studentFirstName": student->firstName,
        "studentFullName": student->fullName,
        "studentEmail": student->email,
        "categoryName": category->name,
        "meetingTitle": meeting->title,
        "meetingType": meeting->isVirtual ? "Virtual" : "Presencial",
        ip,
        userAgent
      }
    `);

    if (onProgress) onProgress(totalCount, totalCount);

    // Formatear datos para CSV
    const formattedData = attendanceData.map(record => ({
      Estudiante: record.studentFullName || record.studentFirstName || 'N/A',
      Email: record.studentEmail || 'N/A',
      Categoría: record.categoryName || 'N/A',
      Reunión: record.meetingTitle || 'N/A',
      Tipo: record.meetingType || 'N/A',
      Fecha: record.date ? formatDate(record.date) : 'N/A',
      Asistió: record.attended ? 'Sí' : 'No',
      IP: record.ip || 'N/A',
      UserAgent: record.userAgent || 'N/A'
    }));

    const headers = ['Estudiante', 'Email', 'Categoría', 'Reunión', 'Tipo', 'Fecha', 'Asistió', 'IP', 'UserAgent'];
    const csvContent = convertToCSV(formattedData, headers);
    const filename = generateFilename('asistencias-historico-completo');

    downloadCSV(csvContent, filename);

  } catch (error) {
    console.error('Error al exportar historial de asistencias:', error);
    throw new Error('Error al exportar historial de asistencias');
  }
};

// Exportar TODO el historial de progreso académico
export const exportAllAcademicProgress = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    // Obtener conteo total
    const totalCount = await adminClient.fetch<number>(
      `count(*[_type == "lessonCompletion"])`
    );

    if (onProgress) onProgress(0, totalCount);

    // Obtener todos los registros de completación de lecciones
    const progressData = await adminClient.fetch<LessonCompletionRecord[]>(`
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

    if (onProgress) onProgress(totalCount, totalCount);

    // Formatear datos para CSV
    const formattedData = progressData.map(record => ({
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
    const filename = generateFilename('progreso-academico-historico-completo');

    downloadCSV(csvContent, filename);

  } catch (error) {
    console.error('Error al exportar historial de progreso académico:', error);
    throw new Error('Error al exportar historial de progreso académico');
  }
};

// Exportar reporte consolidado por estudiante
export const exportConsolidatedStudentReport = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    // Obtener conteo total de estudiantes
    const totalCount = await adminClient.fetch<number>(
      `count(*[_type == "student"])`
    );

    if (onProgress) onProgress(0, totalCount);

    // Obtener datos consolidados de todos los estudiantes
    const consolidatedData = await adminClient.fetch<ConsolidatedStudentRecord[]>(`
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

    if (onProgress) onProgress(totalCount, totalCount);

    // Formatear datos para CSV
    const formattedData = consolidatedData.map(record => ({
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
    const filename = generateFilename('reporte-consolidado-estudiantes');

    downloadCSV(csvContent, filename);

  } catch (error) {
    console.error('Error al exportar reporte consolidado:', error);
    throw new Error('Error al exportar reporte consolidado');
  }
};

// Función para exportar con filtros de fecha
export const exportAttendanceByDateRange = async (
  startDate: string,
  endDate: string,
  categoryId?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
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

    const attendanceData = await adminClient.fetch<AttendanceRecord[]>(query, params);

    if (onProgress) onProgress(attendanceData.length, attendanceData.length);

    // Formatear datos para CSV
    const formattedData = attendanceData.map(record => ({
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
    const filename = generateFilename(`asistencias-${startDate}-a-${endDate}`);

    downloadCSV(csvContent, filename);

  } catch (error) {
    console.error('Error al exportar asistencias por rango de fechas:', error);
    throw new Error('Error al exportar asistencias por rango de fechas');
  }
};