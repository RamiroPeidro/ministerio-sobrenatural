import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { currentUser } from "@clerk/nextjs/server";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";
import { getStudentCategory } from "@/sanity/lib/categories/getStudentCategory";
import { getMeetingById } from "@/sanity/lib/meetings/getMeetingsByCategory";
import { registerMeetingAttendance } from "@/sanity/lib/meetings/registerAttendance";

export async function POST(req: NextRequest) {
  try {
    // Verificar el usuario actual
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await req.json();
    const { meetingId, categoryId = null, late = false } = body;

    if (!meetingId) {
      return NextResponse.json(
        { error: "ID de reunión no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener información del estudiante
    const studentResponse = await getStudentByClerkId(user.id);
    if (!studentResponse?.data) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }
    
    const student = studentResponse.data;

    // Obtener información de la reunión
    const meeting = await adminClient.fetch(
      `*[_type == "meeting" && _id == $meetingId][0]{
        _id,
        title,
        date,
        duration,
        status,
        isVirtual,
        "categoryRef": category._ref
      }`,
      { meetingId }
    );

    if (!meeting) {
      return NextResponse.json(
        { error: "Reunión no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la reunión está activa (permitimos registrar asistencia desde 15 minutos antes hasta 30 minutos después del final)
    const meetingDate = new Date(meeting.date);
    const meetingStartWindow = new Date(meetingDate);
    meetingStartWindow.setMinutes(meetingStartWindow.getMinutes() - 15);
    
    const meetingEndWindow = new Date(meetingDate);
    meetingEndWindow.setHours(meetingEndWindow.getHours() + (meeting.duration || 2));
    meetingEndWindow.setMinutes(meetingEndWindow.getMinutes() + 30); // 30 minutos extra para registrar asistencia
    
    const now = new Date();
    
    console.log({
      meetingTitle: meeting.title,
      meetingTime: meetingDate.toISOString(),
      now: now.toISOString(),
      startWindow: meetingStartWindow.toISOString(),
      endWindow: meetingEndWindow.toISOString(),
      isInTimeWindow: now >= meetingStartWindow && now <= meetingEndWindow
    });

    // Si la reunión está marcada como completada o fuera del rango de tiempo, no permitimos registrar asistencia
    if (meeting.status === 'completed') {
      return NextResponse.json(
        { error: "La reunión ya ha finalizado" },
        { status: 400 }
      );
    }

    // Por ahora desactivamos esta validación para pruebas, pero luego se puede habilitar
    /*
    if (now < meetingStartWindow || now > meetingEndWindow) {
      return NextResponse.json(
        { error: "La reunión no está activa en este momento" },
        { status: 400 }
      );
    }
    */

    // Determinar la categoría
    let categoryRef = meeting.categoryRef || categoryId;
    
    if (!categoryRef) {
      // Si no tenemos la categoría, intentamos obtenerla del estudiante
      const categoryResponse = await getStudentCategory(user.id);
      if (!categoryResponse) {
        return NextResponse.json(
          { error: "No se pudo determinar la categoría del estudiante" },
          { status: 400 }
        );
      }
      categoryRef = categoryResponse._id;
    }

    // Metadatos para la asistencia
    const metadata = {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    };

    // Verificar si ya existe un registro de asistencia para este usuario y esta reunión
    const existingAttendance = await adminClient.fetch(
      `*[_type == "attendance" && student._ref == $studentId && meeting._ref == $meetingId][0]`,
      {
        studentId: student._id,
        meetingId: meeting._id,
      }
    );

    if (existingAttendance) {
      return NextResponse.json(
        { message: "Ya has registrado tu asistencia para esta reunión", attendance: existingAttendance },
        { status: 200 }
      );
    }

    // Crear un nuevo registro de asistencia
    const attendance = await adminClient.create({
      _type: "attendance",
      student: {
        _type: "reference",
        _ref: student._id,
      },
      category: {
        _type: "reference",
        _ref: categoryRef,
      },
      meeting: {
        _type: "reference",
        _ref: meeting._id,
      },
      date: new Date().toISOString(),
      attended: true,
      late: late, // Guardar si la asistencia fue tardía
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });

    // Si la reunión está cerca de finalizar, marcamos la reunión como completada
    const meetingNearEnd = new Date(meetingDate);
    meetingNearEnd.setHours(meetingNearEnd.getHours() + (meeting.duration || 2));
    meetingNearEnd.setMinutes(meetingNearEnd.getMinutes() - 10); // 10 minutos antes del final
    
    if (now >= meetingNearEnd && meeting.status !== 'completed') {
      await adminClient.patch(meeting._id)
        .set({ status: 'completed' })
        .commit();
    }

    return NextResponse.json(
      { message: "Asistencia registrada con éxito", attendance },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return NextResponse.json(
      { error: "Error al registrar asistencia: " + (error instanceof Error ? error.message : "Error desconocido") },
      { status: 500 }
    );
  }
}
