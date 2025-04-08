import { defineQuery } from "groq";
import { sanityFetch } from "../live";
import { CommentDisabledIcon } from "sanity";

// Definiciones de tipos para los objetos de Sanity
interface Lesson {
  _id: string;
  activationDate?: string;
  [key: string]: any;
}

interface Module {
  _id: string;
  lessons?: Lesson[];
  [key: string]: any;
}

interface Course {
  _id: string;
  slug: string;
  modules?: Module[];
  [key: string]: any;
}

interface Enrollment {
  _id: string;
  course: Course;
  [key: string]: any;
}

export async function getEnrolledCourses(clerkId: string) {
  const getEnrolledCoursesQuery =
    defineQuery(`*[_type == "student" && clerkId == $clerkId][0] {
    "enrolledCourses": *[_type == "enrollment" && student._ref == ^._id] {
      ...,
      "course": course-> {
        ...,
        "slug": slug.current,
        "category": category->{...},
        "instructor": instructor->{...},
        "modules": modules[]-> {
          ...,
          "lessons": lessons[]-> {
            ...,
            activationDate
          }
        }
      }
    }
  }`);

  const result = await sanityFetch({
    query: getEnrolledCoursesQuery,
    params: { clerkId },
  });

  const enrolledCourses = result?.data?.enrolledCourses as Enrollment[] || [];
  
  // Ordenar los cursos por la fecha de activación más temprana de sus lecciones
  return enrolledCourses.sort((a: Enrollment, b: Enrollment) => {
    // Función para encontrar la fecha de activación más temprana en un curso
    const getEarliestDate = (course: Course): Date => {
      if (!course || !course.modules || course.modules.length === 0) return new Date(9999, 11, 31); // Fecha futura lejana por defecto
      
      let earliestDate = new Date(9999, 11, 31);
      
      course.modules.forEach((module: Module) => {
        if (module && module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson: Lesson) => {
            if (lesson && lesson.activationDate) {
              const lessonDate = new Date(lesson.activationDate);
              if (!isNaN(lessonDate.getTime()) && lessonDate < earliestDate) {
                earliestDate = lessonDate;
              }
            }
          });
        }
      });
      
      return earliestDate;
    };
    
    const dateA = getEarliestDate(a.course);
    const dateB = getEarliestDate(b.course);
    
    return dateA.getTime() - dateB.getTime();
  });
}




