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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { BookOpen, Users, Calendar, Eye, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener todos los cursos reales
async function getAllCourses() {
  return await adminClient.fetch(
    `*[_type == "course"] | order(title asc) {
      _id,
      title,
      description,
      "slug": slug.current,
      "imageUrl": image.asset->url,
      "category": category->name,
      "instructor": instructor->name,
      "enrolledStudents": count(*[_type == "enrollment" && course._ref == ^._id]),
      "totalLessons": count(modules[]->.lessons[]),
      "completedLessons": count(*[_type == "lessonCompletion" && course._ref == ^._id]),
      "createdAt": _createdAt,
      "isActive": true
    }`
  );
}

// Obtener estadísticas de cursos
async function getCourseStats() {
  return await adminClient.fetch(
    `{
      "totalCourses": count(*[_type == "course"]),
      "totalEnrollments": count(*[_type == "enrollment"]),
      "totalCompletedLessons": count(*[_type == "lessonCompletion"]),
      "totalStudents": count(*[_type == "student"])
    }`
  );
}

export default async function CoursesPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/courses");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  // Obtener datos de cursos
  const courses = await getAllCourses();
  const stats = await getCourseStats();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Cursos</h1>
        <Link 
          href="https://ministerio-sobrenatural.sanity.studio/studio/structure/courseContent" 
          target="_blank"
        >
          <Button>
            Gestionar en Sanity Studio
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cursos</CardDescription>
            <CardTitle className="text-4xl">{stats.totalCourses}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inscripciones Totales</CardDescription>
            <CardTitle className="text-4xl">{stats.totalEnrollments}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lecciones Completadas</CardDescription>
            <CardTitle className="text-4xl">{stats.totalCompletedLessons}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estudiantes Totales</CardDescription>
            <CardTitle className="text-4xl">{stats.totalStudents}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
          <CardDescription>
            Todos los cursos disponibles en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Estudiantes</TableHead>
                <TableHead>Lecciones Totales</TableHead>
                <TableHead>Lecciones Completadas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{course.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{course.category}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{course.instructor}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {course.enrolledStudents}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{course.totalLessons}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{course.completedLessons}</span>
                  </TableCell>
                  <TableCell>
                    {course.isActive ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" title="Ver curso">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link 
                        href={`https://ministerio-sobrenatural.sanity.studio/studio/structure/courseContent/${course._id}`} 
                        target="_blank"
                      >
                        <Button variant="ghost" size="icon" title="Editar en Sanity">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay cursos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <p className="text-muted-foreground text-sm">
          Para una gestión más detallada de cursos, utilice Sanity Studio donde puede crear,
          editar y eliminar cursos, así como gestionar su contenido y materiales.
        </p>
      </div>
    </div>
  );
}
