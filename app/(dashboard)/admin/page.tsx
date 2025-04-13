import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Meeting, Attendance, Student, Category } from "@/types/sanity";
import { CalendarPlus, Users, CheckCircle, Calendar, BarChart, BookOpen, FilterX } from "lucide-react";
import PerformanceFilterSection from "@/components/dashboard/PerformanceFilterSection";

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

// Obtener todas las categorías para filtros
async function getCategories() {
  return await adminClient.fetch<Category[]>(
    `*[_type == "category"] | order(name) { _id, name, description }`
  );
}

// Obtener datos estructurados de estudiantes
async function getStudentPerformanceData() {
  // Obtener el número total de reuniones virtuales por categoría
  const categoriesResult = await adminClient.fetch<{categories: Array<{_id: string, meetingCount: number}>}>(
    `{
      "categories": *[_type == "category"] {
        _id,
        "meetingCount": count(*[_type == "meeting" && references(^._id) && modality == "virtual"])
      }
    }`
  );
  
  const categoriesMap = new Map<string, number>();
  if (categoriesResult && categoriesResult.categories) {
    categoriesResult.categories.forEach((cat: {_id: string, meetingCount: number}) => {
      if (cat._id) {
        categoriesMap.set(cat._id, cat.meetingCount || 0);
      }
    });
  }
  
  // Obtener el número total de lecciones por categoría
  const lessonsResult = await adminClient.fetch<{categories: Array<{_id: string, lessonCount: number}>}>(
    `{
      "categories": *[_type == "category"] {
        _id,
        "lessonCount": count(*[_type == "course" && references(^._id)].modules[]->lessons[])
      }
    }`
  );
  
  const lessonsMap = new Map<string, number>();
  if (lessonsResult && lessonsResult.categories) {
    lessonsResult.categories.forEach((cat: {_id: string, lessonCount: number}) => {
      if (cat._id) {
        lessonsMap.set(cat._id, cat.lessonCount || 0);
      }
    });
  }
  
  // Obtener datos de estudiantes
  const students = await adminClient.fetch<any[]>(
    `*[_type == "student"] {
      _id,
      firstName,
      lastName,
      fullName,
      email,
      "categoryId": category._ref,
      "categoryName": category->name,
      "attendedCount": count(*[_type == "attendance" && student._ref == ^._id && attended == true && meeting->modality == "virtual"]),
      "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id])
    }`
  );
  
  // Calcular los porcentajes nosotros mismos para evitar el uso de max()
  return students.map((student: any) => {
    const totalMeetings = categoriesMap.get(student.categoryId) || 1; // Evitar división por cero
    const totalLessons = lessonsMap.get(student.categoryId) || 1; // Evitar división por cero
    
    const attendanceRate = (student.attendedCount / totalMeetings) * 100;
    const academicProgress = (student.completedLessons / totalLessons) * 100;
    
    return {
      ...student,
      totalMeetings,
      attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate,
      totalLessons,
      academicProgress: isNaN(academicProgress) ? 0 : academicProgress
    };
  });
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
  
  // Obtener categorías para filtros
  const categories = await getCategories();
  
  // Obtener datos de rendimiento de estudiantes
  const studentsPerformance = await getStudentPerformanceData();
  
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
      
      {/* Nueva sección de filtrado y visualización de rendimiento */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Rendimiento de Estudiantes</h2>
          <div className="flex items-center text-muted-foreground">
            <FilterX className="h-4 w-4 mr-2" />
            <span>Filtra por asistencia, progreso académico y año</span>
          </div>
        </div>
        
        <PerformanceFilterSection 
          studentsData={studentsPerformance}
          categories={categories}
        />
      </div>
    </div>
  );
}
