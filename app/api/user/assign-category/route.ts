import { NextResponse } from "next/server";
import { createEnrollment } from "@/sanity/lib/student/createEnrollment";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";
import { adminClient } from "@/sanity/lib/adminClient";

// Interfaz para el tipo de estudiante
interface Student {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  clerkId?: string;
  imageUrl?: string;
  category?: {
    _ref: string;
    _type: string;
  };
}

// Interfaz para un curso
interface Course {
  _id: string;
  title: string;
  [key: string]: any;
}

// Función para obtener cursos por categoría
async function getCoursesByCategory(categoryId: string): Promise<Course[]> {
  return adminClient.fetch(`
    *[_type == "course" && category._ref == $categoryId] {
      _id,
      title
    }
  `, { categoryId });
}

// Función para asignar categoría a un estudiante
async function assignCategoryToStudent(clerkId: string, categoryId: string): Promise<Student> {
  const studentResponse = await getStudentByClerkId(clerkId);
  const student = studentResponse?.data as Student | null;
  
  if (!student) {
    throw new Error(`Student with Clerk ID ${clerkId} not found`);
  }
  
  // Actualizar el estudiante con la categoría
  await adminClient
    .patch(student._id)
    .set({ category: { _type: 'reference', _ref: categoryId } })
    .commit();
  
  return student;
}

export async function POST(req: Request) {
  try {
    const { userId, categoryId } = await req.json();
    
    if (!userId || !categoryId) {
      return NextResponse.json(
        { error: "Missing userId or categoryId" },
        { status: 400 }
      );
    }
    
    // Asignar la categoría al estudiante
    const student = await assignCategoryToStudent(userId, categoryId);
    
    // Obtener todos los cursos de la categoría
    const courses = await getCoursesByCategory(categoryId);
    
    // Inscribir al estudiante en todos los cursos de la categoría
    const enrollments = await Promise.all(
      courses.map(async (course: Course) => {
        try {
          // Llamar a createEnrollment con los parámetros actualizados
          return await createEnrollment({
            studentId: student._id,
            courseId: course._id
          });
        } catch (error) {
          console.error(`Error enrolling in course ${course.title}:`, error);
          return null;
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      student,
      enrollments: enrollments.filter(Boolean), // Filtrar posibles nulos
    });
  } catch (error) {
    console.error("Error in assign-category:", error);
    return NextResponse.json(
      { error: "Failed to assign category" },
      { status: 500 }
    );
  }
}
