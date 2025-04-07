import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { currentUser } from "@clerk/nextjs/server";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";

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
    const { meetingIds, categoryId = null } = body;

    if (!meetingIds || !Array.isArray(meetingIds) || meetingIds.length === 0) {
      return NextResponse.json(
        { error: "IDs de reuniones no proporcionados correctamente" },
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

    // Consultar la base de datos para encontrar todas las asistencias registradas 
    // para este estudiante en las reuniones proporcionadas
    const registeredAttendance = await adminClient.fetch(
      `*[_type == "attendance" && student._ref == $studentId && meeting._ref in $meetingIds]{
        _id,
        "meetingId": meeting._ref,
        attended
      }`,
      { 
        studentId: student._id,
        meetingIds
      }
    );

    // Extraer solo los IDs de las reuniones a las que el estudiante ha asistido
    const attendedMeetings = registeredAttendance
      .filter((record: any) => record.attended)
      .map((record: any) => record.meetingId);

    return NextResponse.json({
      success: true,
      attendedMeetings,
      studentId: student._id
    });

  } catch (error) {
    console.error("Error al verificar asistencia existente:", error);
    return NextResponse.json(
      { error: "Error al verificar asistencia" },
      { status: 500 }
    );
  }
}
