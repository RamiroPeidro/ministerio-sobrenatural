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
  const now = new Date().toISOString();

  try {
    // Filtramos reuniones futuras para esta categoría, ordenadas por fecha (más cercana primero)
    return await client.fetch(
      `*[_type == "meeting" && category._ref == $categoryId && date >= $now && status == "scheduled"]
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
      { categoryId, now, limit }
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
