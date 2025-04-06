import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener datos para depuración
async function getDebugData() {
  // 1. Obtener un estudiante de ejemplo para depuración
  const sampleStudent = await adminClient.fetch(
    `*[_type == "student"][0] {
      _id,
      firstName,
      lastName,
      fullName,
      email,
      clerkId
    }`
  );

  // 2. Obtener enrollments para ese estudiante
  const enrollments = await adminClient.fetch(
    `*[_type == "enrollment" && student._ref == $studentId] {
      _id,
      "courseId": course._ref,
      "courseName": course->title,
      "courseLessons": count(course->modules[]->.lessons[]),
      "completedLessons": count(*[_type == "lessonCompletion" && student._ref == $studentId && course._ref == ^.course._ref])
    }`,
    { studentId: sampleStudent._id }
  );

  // 3. Obtener datos generales para verificar estructura
  const lessonsData = await adminClient.fetch(
    `{
      "allEnrollments": count(*[_type == "enrollment"]),
      "allCompletedLessons": count(*[_type == "lessonCompletion"]),
      "allStudents": count(*[_type == "student"]),
      "courseStructure": *[_type == "course"][0...3] {
        _id,
        title,
        "moduleCount": count(modules),
        "lessonCount": count(modules[]->.lessons[])
      },
      "sampleLessonCompletions": *[_type == "lessonCompletion"][0...5] {
        _id,
        "studentName": student->fullName,
        "courseName": course->title,
        "lessonName": lesson->title
      },
      "sampleCourse": *[_type == "course"][0] {
        _id,
        title,
        "modules": modules[]-> {
          _id,
          title,
          "lessons": lessons[]-> {
            _id,
            title
          }
        }
      }
    }`
  );

  // 4. Datos específicos para el caso de uso actual
  const studentData = await adminClient.fetch(
    `*[_type == "student"] | order(_createdAt desc)[0...5] {
      _id,
      firstName,
      lastName,
      fullName,
      "enrolledCourses": count(*[_type == "enrollment" && student._ref == ^._id]),
      "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id]),
      "availableLessons": count(*[_type == "course" && _id in *[_type == "enrollment" && student._ref == ^._id].course._ref].modules[]->.lessons[]),
      "directAvailableLessonsTest": *[_type == "enrollment" && student._ref == ^._id].course->.modules[]->.lessons[]._id
    }`
  );

  return {
    sampleStudent,
    enrollments,
    lessonsData,
    studentData
  };
}

export default async function DebugPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/debug");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  // Obtener datos para depuración
  const debugData = await getDebugData();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Depuración de Datos</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estudiante de Ejemplo</CardTitle>
          <CardDescription>
            Información del estudiante seleccionado para depuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugData.sampleStudent, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inscripciones del Estudiante</CardTitle>
          <CardDescription>
            Cursos en los que está inscrito el estudiante y lecciones completadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugData.enrollments, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
          <CardDescription>
            Información general sobre cursos, lecciones y estructura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugData.lessonsData, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Datos de Estudiantes</CardTitle>
          <CardDescription>
            Información específica para solucionar el problema actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugData.studentData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
