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
import { AttendanceLink } from "@/components/AttendanceLink";
import { getUpcomingMeetingsByCategory } from "@/sanity/lib/meetings/getMeetingsByCategory";
import { MeetingsList } from "@/components/MeetingsList";

export default async function MyCoursesPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/sign-in?redirectUrl=/my-courses");
  }

  const enrolledCourses = await getEnrolledCourses(user.id);

  // Obtener la categoría del estudiante
  const studentCategory = await getStudentCategory(user.id);

  // Obtener próximas reuniones programadas para la categoría del estudiante
  const upcomingMeetings = studentCategory?._id 
    ? await getUpcomingMeetingsByCategory(studentCategory._id, 5)
    : [];

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

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Hola, {user.username || 'Usuario'}</h1>
          <p className="text-muted-foreground">
            Bienvenido al Ministerio Sobrenatural. Acá puedes ver todos tus cursos y próximos encuentros.
          </p>
        </div>

        {/* Mostrar el nuevo componente de reuniones */}
        {studentCategory?._id && (
          <MeetingsList 
            meetings={upcomingMeetings} 
            categoryId={studentCategory._id} 
          />
        )}

        {/* Mostrar el componente antiguo como fallback si no hay reuniones programadas */}
        {upcomingMeetings.length === 0 && studentCategory?.zoomLink && (
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
                <AttendanceLink 
                  zoomLink={studentCategory.zoomLink} 
                  zoomPassword={studentCategory.zoomPassword}
                  meetingId={studentCategory.name ? `${studentCategory.name.toLowerCase().replace(/\s+/g, '-')}-meeting` : undefined}
                  nextMeetingDate={studentCategory.nextMeetingDate}
                  meetingDuration={studentCategory.meetingDuration}
                  isPresential={studentCategory.isPresential}
                />
              </div>
            </CardContent>
          </Card>
        )}

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

                // Obtenemos el ID del curso para la ruta del dashboard
                const courseId = item.course._id;
                
                // Ruta para el dashboard del curso (contenido/lecciones)
                const dashboardUrl = `/dashboard/courses/${courseId}`;
                
                // URL de detalles del curso - usa el slug directamente
                // El campo slug en Sanity ya viene con formato "derribando-fortalezas"
                const slug = item.course.slug || courseId;
                const detailsUrl = `/courses/${slug}`;

                return (
                  <CourseCard
                    key={courseId}
                    course={item.course}
                    progress={item.progress}
                    href={dashboardUrl}
                    showViewButton={true}
                    buttonText="Ver más información"
                    buttonHref={detailsUrl}
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
