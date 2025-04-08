import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  try {
    const user = await adminClient.fetch(
      `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
      { userId }
    );
    return Boolean(user);
  } catch (error) {
    console.error("Error al verificar admin:", error);
    return false;
  }
}

// Handler para POST
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar que el solicitante sea un administrador
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    
    const adminStatus = await isAdmin(user.id);
    
    if (!adminStatus) {
      return NextResponse.json(
        { error: "Solo administradores pueden crear usuarios" },
        { status: 403 }
      );
    }
    
    // 2. Obtener los datos del cuerpo de la solicitud
    const userData = await req.json();
    
    // 3. Validar datos mínimos requeridos
    if (!userData.username || !userData.password || !userData.email_address) {
      return NextResponse.json(
        { error: "Datos de usuario incompletos" },
        { status: 400 }
      );
    }
    
    // 4. Crear usuario en Clerk usando la API de Clerk
    const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const clerkData = await clerkResponse.json();
    
    if (!clerkResponse.ok) {
      console.error("Error de Clerk:", JSON.stringify(clerkData, null, 2));
      return NextResponse.json(
        { error: `Error de Clerk: ${clerkData.errors?.[0]?.message || JSON.stringify(clerkData)}` },
        { status: clerkResponse.status }
      );
    }
    
    // 5. Devolver respuesta exitosa con ID del usuario creado
    return NextResponse.json({ 
      id: clerkData.id,
      message: "Usuario creado exitosamente"
    });
    
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    );
  }
}
