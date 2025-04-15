import { adminClient } from "../adminClient";
import { Attendance, Meeting } from "@/types/sanity";
import { SanityDocument } from "next-sanity";

/**
 * Registra la asistencia de un estudiante a una reunión específica
 * 
 * @param studentId - ID del estudiante en Sanity
 * @param meetingId - ID de la reunión en Sanity
 * @param categoryId - ID de la categoría del estudiante
 * @param metadata - Metadatos adicionales para el registro de asistencia (IP, User Agent, etc.)
 * @returns La asistencia registrada o null si ocurrió un error
 */
export async function registerMeetingAttendance(
  studentId: string,
  meetingId: string,
  categoryId: string,
  metadata: {
    ip?: string;
    userAgent?: string;
  } = {}
): Promise<Attendance | null> {
  try {
    // Verificar si ya existe un registro de asistencia para este usuario y esta reunión
    const existingAttendance = await adminClient.fetch<Attendance | null>(
      `*[_type == "attendance" && student._ref == $studentId && meeting._ref == $meetingId][0]`,
      {
        studentId,
        meetingId,
      }
    );

    if (existingAttendance) {
      console.log("La asistencia ya ha sido registrada anteriormente");
      // En lugar de crear un nuevo registro, actualizamos el existente con la última hora de acceso
      const updatedAttendance = await adminClient
        .patch(existingAttendance._id)
        .set({
          lastAccessDate: new Date().toISOString(),
          ip: metadata.ip || "unknown",
          userAgent: metadata.userAgent || "unknown"
        })
        .commit();

      return {
        ...existingAttendance,
        lastAccessDate: updatedAttendance.lastAccessDate,
        ip: updatedAttendance.ip,
        userAgent: updatedAttendance.userAgent
      };
    }

    // Obtener información de la reunión
    const meeting: Meeting | null = await adminClient.fetch(
      `*[_type == "meeting" && _id == $meetingId][0]`,
      { meetingId }
    );

    if (!meeting) {
      console.error("Reunión no encontrada");
      return null;
    }

    // Registrar la asistencia
    const attendanceDoc = await adminClient.create({
      _type: "attendance",
      student: {
        _type: "reference",
        _ref: studentId,
      },
      category: {
        _type: "reference",
        _ref: categoryId,
      },
      meeting: {
        _type: "reference",
        _ref: meetingId,
      },
      meetingId: meeting.title ? `${meeting.title.toLowerCase().replace(/\s+/g, '-')}-${meetingId.slice(0, 6)}` : meetingId,
      date: new Date().toISOString(),
      attended: true,
      ip: metadata.ip || "unknown",
      userAgent: metadata.userAgent || "unknown",
    });

    // Convertir el documento de Sanity al tipo Attendance
    const attendance: Attendance = {
      _id: attendanceDoc._id,
      student: {
        _ref: studentId,
        _type: "reference"
      },
      category: {
        _ref: categoryId,
        _type: "reference"
      },
      meeting: {
        _ref: meetingId,
        _type: "reference"
      },
      meetingId: attendanceDoc.meetingId,
      date: attendanceDoc.date,
      attended: attendanceDoc.attended,
      ip: attendanceDoc.ip,
      userAgent: attendanceDoc.userAgent
    };

    return attendance;
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return null;
  }
}

/**
 * Obtiene las asistencias registradas para una reunión específica
 * 
 * @param meetingId - ID de la reunión
 * @returns Listado de asistencias a la reunión
 */
export async function getMeetingAttendances(meetingId: string): Promise<Attendance[]> {
  try {
    return await adminClient.fetch(
      `*[_type == "attendance" && meeting._ref == $meetingId] {
        _id,
        date,
        attended,
        "studentInfo": student->{
          _id,
          firstName,
          lastName,
          fullName,
          username,
          email,
          imageUrl
        }
      } | order(date asc)`,
      { meetingId }
    );
  } catch (error) {
    console.error("Error al obtener asistencias de la reunión:", error);
    return [];
  }
}

/**
 * Obtiene las asistencias de un estudiante a todas las reuniones de su categoría
 * 
 * @param studentId - ID del estudiante
 * @param categoryId - ID de la categoría
 * @returns Listado de asistencias del estudiante
 */
export async function getStudentAttendances(
  studentId: string,
  categoryId: string
): Promise<{ 
  attendances: Attendance[],
  totalMeetings: number,
  attendanceRate: number 
}> {
  try {
    // Obtener todas las asistencias del estudiante para esta categoría
    const attendances = await adminClient.fetch(
      `*[_type == "attendance" && student._ref == $studentId && category._ref == $categoryId] {
        _id,
        date,
        attended,
        "meetingInfo": meeting->{
          _id,
          title,
          date,
          isVirtual
        }
      } | order(date desc)`,
      { studentId, categoryId }
    );

    // Obtener el total de reuniones realizadas para esta categoría
    const totalMeetings = await adminClient.fetch(
      `count(*[_type == "meeting" && category._ref == $categoryId && (status == "completed" || status == "in-progress")])`,
      { categoryId }
    );

    // Calcular la tasa de asistencia
    const attendanceRate = totalMeetings > 0 
      ? Math.round((attendances.length / totalMeetings) * 100) 
      : 0;

    return {
      attendances,
      totalMeetings,
      attendanceRate
    };
  } catch (error) {
    console.error("Error al obtener asistencias del estudiante:", error);
    return {
      attendances: [],
      totalMeetings: 0,
      attendanceRate: 0
    };
  }
}
