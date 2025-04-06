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
import { Student } from "@/types/sanity";
import { formatDate } from "@/lib/utils";
import { User, Mail, Calendar, CheckCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener todos los estudiantes
async function getAllStudents() {
  return await adminClient.fetch<Student[]>(
    `*[_type == "student"] | order(registrationDate desc) {
      _id,
      firstName,
      lastName,
      fullName,
      email,
      role,
      registrationDate,
      lastActive,
      clerkId,
      "category": category._ref,
      "totalAttendance": count(*[_type == "meeting" && references(^.category._ref)]),
      "attendedCount": count(*[_type == "attendance" && student._ref == ^._id && attended == true]),
      "attendanceRate": count(*[_type == "attendance" && student._ref == ^._id && attended == true]) / count(*[_type == "meeting" && references(^.category._ref)]) * 100,
      "enrolledCourses": count(*[_type == "enrollment" && student._ref == ^._id]),
      "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id])
    }`
  );
}

// Obtener estadísticas de estudiantes
async function getStudentStats() {
  return await adminClient.fetch(`{
    "totalStudents": count(*[_type == "student"]),
    "activeStudents": count(*[_type == "student" && dateTime(lastActive) > dateTime(now()) - 60*60*24*30]),
    "inactiveStudents": count(*[_type == "student" && (dateTime(lastActive) < dateTime(now()) - 60*60*24*30 || lastActive == null)]),
    "administrators": count(*[_type == "student" && (role == "admin" || role == "superadmin")]),
    "totalEnrollments": count(*[_type == "enrollment"]),
    "totalCompletedLessons": count(*[_type == "lessonCompletion"])
  }`);
}

export default async function StudentsPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/students");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  // Obtener datos de estudiantes
  const students = await getAllStudents();
  const stats = await getStudentStats();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Estudiantes</h1>
        <Link 
          href="https://ministerio-sobrenatural.sanity.studio/studio/structure/userManagement;students" 
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
            <CardDescription>Estudiantes Totales</CardDescription>
            <CardTitle className="text-4xl">{stats.totalStudents}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos (último mes)</CardDescription>
            <CardTitle className="text-4xl">{stats.activeStudents}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inactivos</CardDescription>
            <CardTitle className="text-4xl">{stats.inactiveStudents}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-4xl">{stats.administrators}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
          <CardDescription>
            Todos los estudiantes registrados en el sistema
          </CardDescription>
          <div className="mt-4">
            <Input 
              placeholder="Buscar estudiante..." 
              className="max-w-sm"
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nota: La búsqueda se realiza mejor desde Sanity Studio
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Asistencia</TableHead>
                <TableHead>Cursos Inscritos</TableHead>
                <TableHead>Lecciones Completadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {student.fullName || `${student.firstName} ${student.lastName || ""}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {student.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {student.registrationDate ? formatDate(student.registrationDate) : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.role === "admin" || student.role === "superadmin" ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">
                          {student.role === "superadmin" ? "Super Admin" : "Admin"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Estudiante</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${student.attendanceRate || 0}%` }}
                        />
                      </div>
                      <span>
                        {student.attendedCount || 0}/{student.totalAttendance || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{student.enrolledCourses || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span>{student.completedLessons || 0}</span>
                  </TableCell>
                </TableRow>
              ))}
              
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay estudiantes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <p className="text-muted-foreground text-sm">
          Para una gestión más detallada de estudiantes, utilice Sanity Studio donde puede crear, 
          editar y eliminar perfiles de estudiantes, así como gestionar sus roles y permisos.
        </p>
      </div>
    </div>
  );
}
