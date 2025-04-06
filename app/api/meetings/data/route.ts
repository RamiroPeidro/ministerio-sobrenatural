import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/sanity/lib/adminClient';
import { currentUser } from '@clerk/nextjs/server';
import { Meeting, Attendance, Student, Category } from "@/types/sanity";

export async function GET(request: NextRequest) {
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

    // Obtener todas las categorías
    const categories = await adminClient.fetch<Category[]>(
      `*[_type == "category"] | order(name asc) {
        _id,
        name,
        zoomLink
      }`
    );

    // Obtener las reuniones programadas
    const upcomingMeetings = await adminClient.fetch<Meeting[]>(
      `*[_type == "meeting" && date >= now()] | order(date asc) {
        _id,
        title,
        date,
        duration,
        status,
        isVirtual,
        "categoryInfo": category->{
          _id,
          name
        }
      }[0...10]`
    );

    // Obtener las últimas reuniones finalizadas
    const recentMeetings = await adminClient.fetch<Meeting[]>(
      `*[_type == "meeting"] | order(date desc) {
        _id,
        title,
        date,
        status,
        isVirtual,
        "categoryInfo": category->{
          _id,
          name
        },
        "attendanceCount": count(*[_type == "attendance" && meeting._ref == ^._id])
      }[0...20]`
    );

    // Obtener estadísticas de asistencia por categoría
    const stats = await Promise.all(
      categories.map(async (category) => {
        const totalMeetings = await adminClient.fetch<number>(
          `count(*[_type == "meeting" && references($categoryId)])`,
          { categoryId: category._id }
        );

        const totalStudents = await adminClient.fetch<number>(
          `count(*[_type == "student" && references($categoryId)])`,
          { categoryId: category._id }
        );
        
        const totalAttendances = await adminClient.fetch<number>(
          `count(*[_type == "attendance" && references($categoryId)])`,
          { categoryId: category._id }
        );

        // Cálculo de la tasa de asistencia
        const possibleAttendances = totalMeetings * totalStudents;
        const attendanceRate = possibleAttendances > 0 
          ? Math.round((totalAttendances / possibleAttendances) * 100) 
          : 0;

        const averageAttendance = totalMeetings > 0 
          ? Math.round(totalAttendances / totalMeetings) 
          : 0;

        const completedMeetings = await adminClient.fetch<number>(
          `count(*[_type == "meeting" && references($categoryId) && status == "completed"])`,
          { categoryId: category._id }
        );

        const inProgressMeetings = await adminClient.fetch<number>(
          `count(*[_type == "meeting" && references($categoryId) && status == "in-progress"])`,
          { categoryId: category._id }
        );

        const scheduledMeetings = await adminClient.fetch<number>(
          `count(*[_type == "meeting" && references($categoryId) && status == "scheduled"])`,
          { categoryId: category._id }
        );

        return {
          category,
          totalMeetings: totalMeetings || 0,
          totalStudents: totalStudents || 0,
          totalAttendances: totalAttendances || 0,
          averageAttendance,
          attendanceRate,
          possibleAttendances,
          completedMeetings: completedMeetings || 0,
          inProgressMeetings: inProgressMeetings || 0,
          scheduledMeetings: scheduledMeetings || 0
        };
      })
    );
    
    // Calcular estadísticas generales
    const generalStats = {
      totalMeetings: stats.reduce((sum, stat) => sum + stat.totalMeetings, 0),
      totalStudents: stats.reduce((sum, stat) => sum + stat.totalStudents, 0),
      totalAttendances: stats.reduce((sum, stat) => sum + stat.totalAttendances, 0),
      possibleAttendances: stats.reduce((sum, stat) => sum + stat.possibleAttendances, 0),
      attendanceRate: 0
    };

    generalStats.attendanceRate = generalStats.possibleAttendances > 0 
      ? Math.round((generalStats.totalAttendances / generalStats.possibleAttendances) * 100) 
      : 0;

    // Obtener las últimas asistencias registradas
    const recentAttendances = await adminClient.fetch<
      Array<Attendance & { studentInfo: Student; meetingInfo: Meeting }>
    >(
      `*[_type == "attendance"] | order(date desc) {
        _id,
        date,
        "studentInfo": student->{
          _id,
          firstName,
          lastName,
          fullName,
          username,
          email
        },
        "meetingInfo": meeting->{
          _id,
          title,
          date
        }
      }[0...20]`
    );

    return NextResponse.json({
      success: true,
      upcomingMeetings,
      recentMeetings,
      categoryStats: stats,
      generalStats,
      recentAttendances
    });
  } catch (error) {
    console.error('Error al obtener datos de reuniones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
