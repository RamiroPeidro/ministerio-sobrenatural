import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha en formato legible en español
 * @param dateString - Fecha en formato ISO string o Date
 * @returns Fecha formateada
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Determina si una reunión está activa (dentro de su ventana de tiempo)
 * @param meetingDate - Fecha de la reunión
 * @param duration - Duración en horas
 * @param windowBefore - Minutos antes que se considera dentro de la ventana
 * @returns true si la reunión está activa
 */
export function isMeetingActive(meetingDate: string | Date, duration: number = 2, windowBefore: number = 10): boolean {
  const now = new Date();
  const meeting = typeof meetingDate === 'string' ? new Date(meetingDate) : meetingDate;
  
  // Ventana previa (10 min antes por defecto)
  const meetingStartWindow = new Date(meeting);
  meetingStartWindow.setMinutes(meetingStartWindow.getMinutes() - windowBefore);
  
  // Fin de la reunión
  const meetingEnd = new Date(meeting);
  meetingEnd.setHours(meetingEnd.getHours() + duration);
  
  // Activa si estamos entre (inicio - ventana) y fin
  return now >= meetingStartWindow && now <= meetingEnd;
}
