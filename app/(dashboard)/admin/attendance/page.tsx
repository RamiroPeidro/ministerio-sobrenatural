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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Attendance, Meeting, Student } from "@/types/sanity";

// Tipos extendidos para los datos que recibimos
type ExtendedAttendance = Attendance & {
  studentName?: string;
  studentEmail?: string;
  meetingTitle?: string;
  categoryName?: string;
  studentId?: string;
  meetingId?: string;
  categoryId?: string;
};

type ExtendedMeeting = {
  _id: string;
  title: string;
  date: string;
  totalAttendance: number;
  attended: number;
  attendanceRate: number;
};

type StudentAttendance = {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  category?: string;
  totalMeetings: number;
  attendedMeetings: number;
  missedMeetings: number;
  attendanceRate: number;
};

import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Calendar, User, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener los últimos registros de asistencia
async function getRecentAttendance() {
  return await adminClient.fetch<ExtendedAttendance[]>(
    `*[_type == "attendance"] | order(date desc)[0...50] {
      _id,
      date,
      attended,
      "studentId": student->_id,
      "studentName": student->firstName,
      "studentEmail": student->email,
      "meetingId": meeting->_id,
      "meetingTitle": meeting->title,
      "categoryId": category->_id,
      "categoryName": category->name
    }`
  );
}

// Obtener estadísticas de asistencia
async function getAttendanceStats() {
  const result = await adminClient.fetch<{
    total: number;
    attended: number;
    missed: number;
    attendanceRate: number;
    meetingStats: ExtendedMeeting[];
  }>(`{
    "total": count(*[_type == "attendance"]),
    "attended": count(*[_type == "attendance" && attended == true]),
    "missed": count(*[_type == "attendance" && attended == false]),
    "attendanceRate": count(*[_type == "attendance" && attended == true]) / count(*[_type == "attendance"]) * 100,
    "meetingStats": *[_type == "meeting" && isVirtual == true] | order(date desc)[0...20] {
      _id,
      title,
      date,
      "totalAttendance": count(*[_type == "student" && references(^.category._ref)]),
      "attended": count(*[_type == "attendance" && meeting._ref == ^._id && attended == true]),
      "attendanceRate": count(*[_type == "attendance" && meeting._ref == ^._id && attended == true]) / count(*[_type == "student" && references(^.category._ref)]) * 100
    }
  }`);
  
  return result;
}

// Obtener estadísticas de asistencia por estudiante
async function getStudentAttendanceStats() {
  return await adminClient.fetch<StudentAttendance[]>(`*[_type == "student"] | order(firstName asc) {
    _id,
    firstName,
    lastName,
    fullName,
    email,
    "category": category->name,
    "totalMeetings": count(*[_type == "meeting" && references(^.category._ref) && isVirtual == true]),
    "attendedMeetings": count(*[_type == "attendance" && student._ref == ^._id && attended == true]),
    "missedMeetings": count(*[_type == "attendance" && student._ref == ^._id && attended == false]),
    "attendanceRate": count(*[_type == "attendance" && student._ref == ^._id && attended == true]) / count(*[_type == "meeting" && references(^.category._ref) && isVirtual == true]) * 100
  }`);
}

export default async function AttendancePage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/attendance");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  // Obtener datos de asistencia
  const attendanceRecords = await getRecentAttendance();
  const stats = await getAttendanceStats();
  const studentAttendanceStats = await getStudentAttendanceStats();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Asistencia</h1>
        <Link 
          href="https://ministerio-sobrenatural.sanity.studio/studio/attendance-export" 
          target="_blank"
        >
          <Button>
            Exportar Registros a CSV
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de registros</CardDescription>
            <CardTitle className="text-4xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de asistencia</CardDescription>
            <CardTitle className="text-4xl">{stats.attendanceRate ? Math.round(stats.attendanceRate) : 0}%</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Tabs defaultValue="recent">
        <TabsList className="mb-4">
          <TabsTrigger value="recent">Registros Recientes</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas por Clase</TabsTrigger>
          <TabsTrigger value="students">Asistencia por Estudiante</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Últimos registros de asistencia</CardTitle>
              <CardDescription>
                Mostrando los últimos 50 registros de asistencia en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Clase/Reunión</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Asistió</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(record.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {record.studentName || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{record.meetingTitle || "N/A"}</TableCell>
                      <TableCell>{record.categoryName || "N/A"}</TableCell>
                      <TableCell>
                        {record.attended ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {attendanceRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay registros de asistencia disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas por Clase</CardTitle>
              <CardDescription>
                Tasas de asistencia por cada clase o reunión reciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clase/Reunión</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asistencias</TableHead>
                    <TableHead>Tasa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.meetingStats.map((meeting: ExtendedMeeting) => (
                    <TableRow key={meeting._id}>
                      <TableCell>{meeting.title || "N/A"}</TableCell>
                      <TableCell>{formatDate(meeting.date)}</TableCell>
                      <TableCell>
                        {meeting.attended} / {meeting.totalAttendance}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${meeting.attendanceRate || 0}%` }}
                            />
                          </div>
                          <span>{meeting.attendanceRate ? Math.round(meeting.attendanceRate) : 0}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {stats.meetingStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay datos de reuniones disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Asistencia por Estudiante</CardTitle>
              <CardDescription>
                Vista global del porcentaje de asistencia de cada estudiante
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabla de asistencia por estudiante */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Asistencia</TableHead>
                    <TableHead className="w-[180px]">Progreso</TableHead>
                    <TableHead className="text-right">Porcentaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentAttendanceStats.map((student: StudentAttendance) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.firstName || student.fullName}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.category || "Sin categoría"}</TableCell>
                      <TableCell>
                        {student.attendedMeetings}/{student.totalMeetings}
                      </TableCell>
                      <TableCell>
                        <Progress 
                          value={student.attendanceRate ? Math.round(student.attendanceRate) : 0} 
                          className="h-2" 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={
                            (student.attendanceRate || 0) >= 90 ? "default" : 
                            (student.attendanceRate || 0) >= 75 ? "secondary" : 
                            (student.attendanceRate || 0) >= 50 ? "outline" : 
                            "destructive"
                          }
                        >
                          {student.attendanceRate ? Math.round(student.attendanceRate) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!studentAttendanceStats.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay datos de asistencia de estudiantes disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <p className="text-muted-foreground text-sm">
          Para una gestión más detallada de la asistencia, utilice Sanity Studio donde puede crear, 
          editar y eliminar registros de asistencia, así como exportar datos para análisis.
        </p>
      </div>
    </div>
  );
}
