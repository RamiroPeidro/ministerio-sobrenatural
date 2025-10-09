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
    if (onProgress) onProgress(0, 1);

    // Llamar a la API route que maneja la exportación en el servidor
    const response = await fetch('/api/export/attendance');

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el archivo CSV como blob
    const blob = await response.blob();

    if (onProgress) onProgress(1, 1);

    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : generateFilename('asistencias-historico-completo');

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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
    if (onProgress) onProgress(0, 1);

    // Llamar a la API route que maneja la exportación en el servidor
    const response = await fetch('/api/export/progress');

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el archivo CSV como blob
    const blob = await response.blob();

    if (onProgress) onProgress(1, 1);

    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : generateFilename('progreso-academico-historico-completo');

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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
    if (onProgress) onProgress(0, 1);

    // Llamar a la API route que maneja la exportación en el servidor
    const response = await fetch('/api/export/consolidated');

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el archivo CSV como blob
    const blob = await response.blob();

    if (onProgress) onProgress(1, 1);

    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : generateFilename('reporte-consolidado-estudiantes');

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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
    if (onProgress) onProgress(0, 1);

    // Construir parámetros para la API
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (categoryId && categoryId !== 'all') {
      params.append('categoryId', categoryId);
    }

    // Llamar a la API route que maneja la exportación en el servidor
    const response = await fetch(`/api/export/attendance-range?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Obtener el archivo CSV como blob
    const blob = await response.blob();

    if (onProgress) onProgress(1, 1);

    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : generateFilename(`asistencias-${startDate}-a-${endDate}`);

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error al exportar asistencias por rango de fechas:', error);
    throw new Error('Error al exportar asistencias por rango de fechas');
  }
};