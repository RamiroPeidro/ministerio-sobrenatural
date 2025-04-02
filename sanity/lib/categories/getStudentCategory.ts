import { client } from "../client";
import { getStudentByClerkId } from "../student/getStudentByClerkId";

// Definir una interfaz para el tipo de estudiante
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

export async function getStudentCategory(clerkId: string) {
  // Primero obtenemos el estudiante
  const studentResponse = await getStudentByClerkId(clerkId);
  
  // Usamos la interfaz para tipar correctamente el objeto
  const student = studentResponse?.data as Student | null;
  
  if (!student || !student.category?._ref) {
    return null;
  }
  
  // Luego obtenemos los detalles de su categoría
  const category = await client.fetch(
    `*[_type == "category" && _id == $categoryId][0]{
      _id,
      name,
      description,
      "slug": slug.current,
      zoomLink,
      zoomPassword,
      nextMeetingDate,
      meetingDuration,
      isPresential
    }`,
    { categoryId: student.category._ref }
  );
  
  return category;
}
