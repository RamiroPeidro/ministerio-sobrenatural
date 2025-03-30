import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getLessonById } from "@/sanity/lib/lessons/getLessonById";
import { PortableText } from "@portabletext/react";
import { LoomEmbed } from "@/components/LoomEmbed";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LessonCompleteButton } from "@/components/LessonCompleteButton";
import { Lock, Calendar } from "lucide-react";
import Link from "next/link";

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

// Interfaz extendida para incluir las nuevas propiedades
interface ExtendedLesson {
  _id: string;
  _type: "lesson";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title?: string;
  slug?: { current: string };
  description?: string;
  videoUrl?: string;
  loomUrl?: string;
  content?: any[];
  module: any;
  // Nuevas propiedades
  activationDate?: string;
  isAlwaysAccessible?: boolean;
  [key: string]: any;
}

// Función para verificar si una lección está disponible según su fecha de activación
function isLessonAvailable(lesson: ExtendedLesson): boolean {
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

export default async function LessonPage({ params }: LessonPageProps) {
  const user = await currentUser();
  const { courseId, lessonId } = await params;

  const lessonData = await getLessonById(lessonId);

  if (!lessonData) {
    return redirect(`/dashboard/courses/${courseId}`);
  }

  // Convertir a nuestro tipo extendido
  const lesson = lessonData as ExtendedLesson;

  // Verificar si la lección está disponible según su fecha de activación
  const isAvailable = isLessonAvailable(lesson);

  // Si la lección no está disponible, mostrar un mensaje indicando cuándo estará disponible
  if (!isAvailable) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-8 max-w-lg w-full text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Lección bloqueada</h1>
          <p className="text-muted-foreground mb-6">
            Esta lección estará disponible a partir del{" "}
            <span className="font-medium text-foreground">
              {formatDate(lesson.activationDate || "")}
            </span>
          </p>
          {lesson.activationDate && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="h-4 w-4" />
              <span>Faltan {Math.ceil((new Date(lesson.activationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días para acceder</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto pt-12 pb-20 px-4">
          <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>

          {lesson.description && (
            <p className="text-muted-foreground mb-8">{lesson.description}</p>
          )}

          <div className="space-y-8">
            {/* Video Section */}
            {lesson.videoUrl && <VideoPlayer url={lesson.videoUrl} lessonId={lesson._id} />}

            {/* Loom Embed Video if loomUrl is provided */}
            {lesson.loomUrl && <LoomEmbed shareUrl={lesson.loomUrl} />}

            {/* Lesson Content */}
            {lesson.content && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Lesson Notes</h2>
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  <PortableText value={lesson.content} />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <LessonCompleteButton lessonId={lesson._id} clerkId={user!.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
