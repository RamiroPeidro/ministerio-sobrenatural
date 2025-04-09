import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";

// Verificar si un usuario es superadmin
async function isSuperAdmin(userId: string) {
  try {
    const user = await adminClient.fetch(
      `*[_type == "student" && clerkId == $userId && role == "superadmin"][0]`,
      { userId }
    );
    return Boolean(user);
  } catch (error) {
    console.error("Error al verificar superadmin:", error);
    return false;
  }
}

// Handler para POST
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar que el solicitante sea un superadmin
    const currentUserData = await currentUser();
    
    if (!currentUserData?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    const superAdminStatus = await isSuperAdmin(currentUserData.id);
    
    if (!superAdminStatus) {
      return NextResponse.json(
        { error: "Solo superadministradores pueden asignar roles" },
        { status: 403 }
      );
    }
    
    // 2. Obtener los datos del cuerpo de la solicitud
    const data = await req.json();
    const { userId, role } = data;
    
    // 3. Validar datos mínimos requeridos
    if (!userId || !role) {
      return NextResponse.json(
        { error: "Faltan parámetros: userId y role son requeridos" },
        { status: 400 }
      );
    }
    
    // 4. Verificar que el rol sea válido
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.json(
        { error: "Rol inválido: debe ser 'admin' o 'superadmin'" },
        { status: 400 }
      );
    }
    
    // 5. Buscar el documento del estudiante en Sanity
    const student = await adminClient.fetch(
      `*[_type == "student" && clerkId == $userId][0]`,
      { userId }
    );
    
    if (!student) {
      return NextResponse.json(
        { error: "Estudiante no encontrado en Sanity" },
        { status: 404 }
      );
    }
    
    // 6. Actualizar el rol del estudiante
    const result = await adminClient.patch(student._id)
      .set({ role })
      .commit();
    
    // 7. Devolver respuesta exitosa
    return NextResponse.json({ 
      message: `Rol asignado exitosamente: ${role}`,
      studentId: student._id
    });
    
  } catch (error: any) {
    console.error("Error al asignar rol:", error);
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    );
  }
}
