import { CalendarClock, ExternalLink, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getEnrolledCourses } from "@/sanity/lib/student/getEnrolledCourses";
import Link from "next/link";
import { getCourseProgress } from "@/sanity/lib/lessons/getCourseProgress";
import { CourseCard } from "@/components/CourseCard";
import { getStudentCategory } from "@/sanity/lib/categories/getStudentCategory";

// Constante de respaldo para los encuentros virtuales
const DEFAULT_MEETING_LINK = "https://tu-link-de-zoom.com";

function getNextTuesday(from: Date = new Date()): Date {
  const date = new Date(from);
  date.setHours(20, 0, 0, 0);
  
  while (date.getDay() !== 2 || date <= from) { // 2 = Martes
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

function isPresentialDate(date: Date): boolean {
  // Aquí puedes agregar las fechas de encuentros presenciales
  const presentialDates = [
    new Date("2025-04-09T20:00:00"),
    new Date("2025-06-11T20:00:00"),
  ];

  return presentialDates.some(presential => 
    presential.getDate() === date.getDate() &&
    presential.getMonth() === date.getMonth() &&
    presential.getFullYear() === date.getFullYear()
  );
}

export default async function MyCoursesPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/sign-in?redirectUrl=/my-courses");
  }

  const enrolledCourses = await getEnrolledCourses(user.id);

  // Obtener la categoría del estudiante y su enlace de Zoom
  const studentCategory = await getStudentCategory(user.id);

  // Get progress for each enrolled course
  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async ({ course }) => {
      if (!course) return null;
      const progress = await getCourseProgress(user.id, course._id);
      return {
        course,
        progress: progress.courseProgress,
      };
    })
  );

  // Obtener el próximo encuentro
  const nextTuesday = getNextTuesday();
  const isPresential = isPresentialDate(nextTuesday);
  const nextMeeting = {
    date: nextTuesday,
    title: isPresential ? "Encuentro Presencial" : "Encuentro Virtual",
    link: isPresential ? "ubicación-del-encuentro-presencial" : (studentCategory?.zoomLink || DEFAULT_MEETING_LINK),
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Hola, {user.username || 'Usuario'}</h1>
          <p className="text-muted-foreground">
            Bienvenido al Ministerio Sobrenatural. Acá puedes ver todos tus cursos y próximos encuentros.
          </p>
        </div>

        {/* Tarjeta de Zoom de la categoría */}
        {studentCategory?.zoomLink && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Clases en vivo - {studentCategory.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Accede a las clases en vivo de tu categoría
                </p>
                <Button className="w-full md:w-auto" asChild>
                  <a href={studentCategory.zoomLink} target="_blank" rel="noopener noreferrer">
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Unirse a Zoom
                    {studentCategory.zoomPassword && (
                      <span className="ml-2 text-xs">
                        (Contraseña: {studentCategory.zoomPassword})
                      </span>
                    )}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Próximo Encuentro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  <span className="font-medium">{formatDate(nextMeeting.date)}</span>
                </div>
                <h3 className="text-xl font-semibold">{nextMeeting.title}</h3>
              </div>
              <Button className="w-full md:w-auto" asChild>
                <a href={nextMeeting.link} target="_blank" rel="noopener noreferrer">
                  {isPresential ? 'Ver Ubicación' : 'Unirse al Encuentro'} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="container mx-auto px-4 py-8">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Aún no tenes cursos</h2>
              <p className="text-muted-foreground mb-8">
                Aun no te has inscrito a ningun curso. Navega por nuestros cursos
                para comenzar!
              </p>
              <Link
                href="/"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Explorar Cursos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coursesWithProgress.map((item) => {
                if (!item || !item.course) return null;

                return (
                  <CourseCard
                    key={item.course._id}
                    course={item.course}
                    progress={item.progress}
                    href={`/dashboard/courses/${item.course._id}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
