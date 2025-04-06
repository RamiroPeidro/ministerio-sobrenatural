import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Meeting, Attendance, Student, Category } from "@/types/sanity";
import { CalendarPlus, Users, CheckCircle, Calendar, BarChart, BookOpen } from "lucide-react";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener estadísticas básicas
async function getStatistics() {
  const totalStudents = await adminClient.fetch<number>(
    `count(*[_type == "student"])`
  );
  
  const totalCategories = await adminClient.fetch<number>(
    `count(*[_type == "category"])`
  );
  
  const totalMeetings = await adminClient.fetch<number>(
    `count(*[_type == "meeting"])`
  );
  
  const upcomingMeetings = await adminClient.fetch<number>(
    `count(*[_type == "meeting" && date >= now() && status == "scheduled"])`
  );
  
  const totalAttendances = await adminClient.fetch<number>(
    `count(*[_type == "attendance" && attended == true])`
  );
  
  return {
    totalStudents,
    totalCategories,
    totalMeetings,
    upcomingMeetings,
    totalAttendances
  };
}

export default async function AdminDashboardPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/sign-in?redirectUrl=/admin");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/dashboard");
  }
  
  // Obtener estadísticas
  const stats = await getStatistics();
  
  // Definir las tarjetas para cada sección del panel
  const adminSections = [
    {
      title: "Gestión de Estudiantes",
      description: "Administrar estudiantes, ver perfiles y asignar roles",
      icon: <Users className="h-10 w-10 text-primary" />,
      stats: `${stats.totalStudents} estudiantes registrados`,
      href: "/admin/students",
      color: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Gestión de Cursos",
      description: "Administrar cursos, módulos y lecciones",
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      stats: `${stats.totalCategories} categorías activas`,
      href: "/admin/courses",
      color: "bg-purple-50 dark:bg-purple-950"
    },
    {
      title: "Clases y Reuniones",
      description: "Programar y gestionar clases virtuales y presenciales",
      icon: <Calendar className="h-10 w-10 text-primary" />,
      stats: `${stats.upcomingMeetings} clases programadas`,
      href: "/admin/meetings",
      color: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Registro de Asistencia",
      description: "Ver y controlar la asistencia de estudiantes",
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      stats: `${stats.totalAttendances} asistencias registradas`,
      href: "/admin/attendance",
      color: "bg-amber-50 dark:bg-amber-950"
    },
    {
      title: "Sanity Studio",
      description: "Acceso directo al Sanity Studio para edición avanzada",
      icon: <BarChart className="h-10 w-10 text-primary" />,
      stats: "Editor completo",
      href: "https://ministerio-sobrenatural.sanity.studio/studio/structure",
      color: "bg-red-50 dark:bg-red-950",
      external: true
    },
    {
      title: "Crear Nueva Clase",
      description: "Programar una nueva clase virtual o presencial",
      icon: <CalendarPlus className="h-10 w-10 text-primary" />,
      stats: `${stats.totalMeetings} clases en total`,
      href: "https://ministerio-sobrenatural.sanity.studio/studio/structure/systemManagement;reuniones",
      color: "bg-indigo-50 dark:bg-indigo-950",
      external: true
    }
  ];
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido al panel de administración del Ministerio Sobrenatural
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section, index) => (
          <Link 
            key={index} 
            href={section.href}
            target={section.external ? "_blank" : undefined}
            className="block transition-transform duration-200 hover:scale-[1.02]"
          >
            <Card className={`h-full overflow-hidden ${section.color}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  {section.icon}
                </div>
                <CardDescription className="mt-2">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                <div className="text-sm font-medium">{section.stats}</div>
              </CardContent>
              <CardFooter className="pt-6">
                <div className="text-sm text-primary font-medium flex items-center">
                  {section.external ? (
                    <>Abrir en nueva ventana</>
                  ) : (
                    <>Ver detalles</>
                  )}
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
