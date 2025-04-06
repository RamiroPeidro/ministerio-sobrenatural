import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/sanity/lib/adminClient';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado y es admin
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si el usuario es administrador
    const isAdmin = await adminClient.fetch(
      `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
      { userId: user.id }
    );

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener los datos de la solicitud
    const { meetingId, status } = await request.json();

    // Validar los datos
    if (!meetingId || !status) {
      return NextResponse.json(
        { success: false, error: 'Faltan los parámetros requeridos' },
        { status: 400 }
      );
    }

    // Validar que el estado sea uno de los valores permitidos
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la reunión en Sanity
    await adminClient
      .patch(meetingId)
      .set({ status })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar el estado de la reunión:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
