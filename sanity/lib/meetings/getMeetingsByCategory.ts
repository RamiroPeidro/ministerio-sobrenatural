import { client } from "../client";
import { Meeting } from "@/types/sanity";

/**
 * Obtiene las próximas reuniones programadas para una categoría específica
 * 
 * @param categoryId - ID de la categoría
 * @param limit - Número máximo de reuniones a retornar
 * @returns Array de reuniones ordenadas por fecha (más cercana primero)
 */
export async function getUpcomingMeetingsByCategory(
  categoryId: string,
  limit: number = 5
): Promise<Meeting[]> {
  const now = new Date();
  const nowISOString = now.toISOString();
  
  // Calculamos la hora límite para reuniones que ya empezaron pero aún están activas
  // (consideramos reuniones que empezaron hace menos de 2 horas)
  const twoHoursAgo = new Date(now);
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
  const twoHoursAgoISOString = twoHoursAgo.toISOString();

  try {
    // Obtenemos tanto reuniones futuras como reuniones recientes que podrían estar en progreso
    return await client.fetch(
      `*[_type == "meeting" && category._ref == $categoryId && 
        ((date >= $nowISOString && status == "scheduled") || 
         (date >= $twoHoursAgoISOString && date < $nowISOString && status != "completed"))]
      | order(date asc)
      [0...$limit] {
        _id,
        title,
        date,
        duration,
        status,
        isVirtual,
        zoomLink,
        zoomPassword,
        useCustomZoomLink,
        location,
        "categoryInfo": category->{
          _id,
          name,
          zoomLink,
          zoomPassword
        }
      }`,
      { categoryId, nowISOString, twoHoursAgoISOString, limit }
    );
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    return [];
  }
}

/**
 * Obtiene la próxima reunión programada para una categoría específica
 * 
 * @param categoryId - ID de la categoría
 * @returns La próxima reunión o null si no hay reuniones programadas
 */
export async function getNextMeetingByCategory(
  categoryId: string
): Promise<Meeting | null> {
  const meetings = await getUpcomingMeetingsByCategory(categoryId, 1);
  return meetings.length > 0 ? meetings[0] : null;
}

/**
 * Obtiene una reunión específica por su ID
 * @param meetingId - ID de la reunión
 * @returns La reunión o null si no existe
 */
export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  try {
    return await client.fetch(
      `*[_type == "meeting" && _id == $meetingId][0] {
        _id,
        title,
        date,
        duration,
        status,
        isVirtual,
        zoomLink,
        zoomPassword,
        useCustomZoomLink,
        location,
        "categoryInfo": category->{
          _id,
          name,
          zoomLink,
          zoomPassword
        }
      }`,
      { meetingId }
    );
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return null;
  }
}
