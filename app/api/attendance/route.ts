import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { currentUser } from "@clerk/nextjs/server";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";
import { getStudentCategory } from "@/sanity/lib/categories/getStudentCategory";

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
    const { meetingId } = body;

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

    // Obtener la categoría del estudiante
    const categoryResponse = await getStudentCategory(user.id);
    if (!categoryResponse) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }
    
    const category = categoryResponse;

    // Verificar si ya existe un registro de asistencia para este usuario y esta reunión en la fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await adminClient.fetch(
      `*[_type == "attendance" && student._ref == $studentId && meetingId == $meetingId && date >= $today && date < $tomorrow][0]`,
      {
        studentId: student._id,
        meetingId,
        today: today.toISOString(),
        tomorrow: tomorrow.toISOString(),
      }
    );

    if (existingAttendance) {
      return NextResponse.json(
        { message: "Asistencia ya registrada", attendance: existingAttendance },
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
        _ref: category._id,
      },
      meetingId,
      date: new Date().toISOString(),
      attended: true,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      { message: "Asistencia registrada con éxito", attendance },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
