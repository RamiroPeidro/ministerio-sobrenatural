import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lock, Calendar } from "lucide-react";
import EnrollButton from "@/components/EnrollButton";
import getCourseBySlug from "@/sanity/lib/courses/getCourseBySlug";
import { isEnrolledInCourse } from "@/sanity/lib/student/isEnrolledInCourse";
import { auth } from "@clerk/nextjs/server";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Interfaz extendida para el tipo Lesson con las nuevas propiedades
interface Lesson {
  _id: string;
  title?: string;
  slug?: { current: string };
  description?: string;
  videoUrl?: string;
  activationDate?: string;     // Nueva propiedad añadida al esquema
  isAlwaysAccessible?: boolean; // Nueva propiedad añadida al esquema
  [key: string]: any;
}

// Función para verificar si una lección está disponible según su fecha de activación
function isLessonAvailable(lesson: Lesson): boolean {
  console.log("estoy entrando a la fucion isLessonAvailable");
  // Si la lección está marcada como siempre accesible, retornar true
  if (lesson.isAlwaysAccessible) {
    return true;
  }

  // Si no tiene fecha de activación, por defecto es accesible
  if (!lesson.activationDate) {
    return true;
  }

  // Comparar la fecha actual con la fecha de activación
  const now = new Date();
  const activationDate = new Date(lesson.activationDate);
  console.log(now, activationDate);

  // La lección está disponible si la fecha actual es posterior a la fecha de activación
  return now >= activationDate;
}

// Función para formatear la fecha en formato legible
function formatDate(dateString: string): string {
  if (!dateString) return "";
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  const { userId } = await auth();

  const isEnrolled =
    userId && course?._id
      ? await isEnrolledInCourse(userId, course._id)
      : false;

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold">Course not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        {course.image && (
          <Image
            src={urlFor(course.image).url() || ""}
            alt={course.title || "Course Title"}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-black/60" />
        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-12">
          <Link
            href="/"
            prefetch={false}
            className="text-white mb-8 flex items-center hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Courses
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                  {course.category?.name || "Uncategorized"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                {course.description}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 md:min-w-[300px]">
              <div className="text-3xl font-bold text-white mb-4">
                {course.price === 0 ? "Free" : `$${course.price}`}
              </div>
              <EnrollButton courseId={course._id} isEnrolled={isEnrolled} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6 mb-8 border border-border">
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              <div className="space-y-4">
                {course.modules?.map((module, index) => (
                  <div
                    key={module._id}
                    className="border border-border rounded-lg"
                  >
                    <div className="p-4 border-b border-border">
                      <h3 className="font-medium">
                        Module {index + 1}: {module.title}
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        // Usamos el tipo extendido para la lección
                        const typedLesson = lesson as Lesson;
                        // Determinar si la lección está disponible
                        const isAvailable = isLessonAvailable(typedLesson);
                        console.log("isAvailable", isAvailable);
                        
                        return (
                          <div
                            key={typedLesson._id}
                            className={`p-4 transition-colors ${
                              isAvailable 
                                ? "hover:bg-muted/50 cursor-pointer" 
                                : "bg-muted/20 cursor-not-allowed opacity-70"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                                isAvailable 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 text-foreground">
                                  {isAvailable ? (
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="font-medium">
                                    {typedLesson.title}
                                  </span>
                                </div>
                                
                                {!isAvailable && typedLesson.activationDate && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Disponible a partir del {formatDate(typedLesson.activationDate)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Botón de acceso condicionado al estado de inscripción y disponibilidad */}
                              {isEnrolled && (
                                <Link
                                  href={
                                    isAvailable 
                                      ? `/courses/${slug}/lessons/${typedLesson.slug?.current}` 
                                      : "#"
                                  }
                                  onClick={(e) => !isAvailable && e.preventDefault()}
                                  className={`text-xs px-3 py-1 rounded ${
                                    isAvailable 
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {isAvailable ? "Ver lección" : "Bloqueada"}
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-card rounded-lg p-6 sticky top-4 border border-border">
              <h2 className="text-xl font-bold mb-4">Instructor</h2>
              {course.instructor && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {course.instructor.photo && (
                      <div className="relative h-12 w-12">
                        <Image
                          src={urlFor(course.instructor.photo).url() || ""}
                          alt={course.instructor.name || "Course Instructor"}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {course.instructor.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Instructor
                      </div>
                    </div>
                  </div>
                  {course.instructor.bio && (
                    <p className="text-muted-foreground">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
