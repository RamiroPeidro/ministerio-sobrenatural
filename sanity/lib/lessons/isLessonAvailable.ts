import { client } from "../client";

interface Lesson {
  _id: string;
  title: string;
  activationDate?: string;
  isAlwaysAccessible?: boolean;
  [key: string]: any;
}

export async function isLessonAvailable(lessonId: string): Promise<boolean> {
  // Obtener la lección con sus datos de activación
  const lesson = await client.fetch<Lesson | null>(
    `*[_type == "lesson" && _id == $lessonId][0] {
      _id,
      title,
      activationDate,
      isAlwaysAccessible
    }`,
    { lessonId }
  );

  if (!lesson) {
    return false;
  }

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

// Función para obtener el estado de las lecciones en un módulo
export async function getLessonsAvailabilityForModule(moduleId: string) {
  const now = new Date().toISOString();
  
  const lessons = await client.fetch(
    `*[_type == "module" && _id == $moduleId][0] {
      "lessons": lessons[]-> {
        _id,
        title,
        "slug": slug.current,
        description,
        videoUrl,
        activationDate,
        isAlwaysAccessible
      }
    }.lessons`,
    { moduleId }
  );
  
  if (!lessons) {
    return [];
  }
  
  // Agregar flag de disponibilidad a cada lección
  return lessons.map((lesson: Lesson) => ({
    ...lesson,
    isLocked: !lesson.isAlwaysAccessible && lesson.activationDate && new Date(lesson.activationDate) > new Date(now)
  }));
}
