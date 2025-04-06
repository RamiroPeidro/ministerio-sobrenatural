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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { Search, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Definición de tipos para los datos
type StudentBasic = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  enrolledCourses: number;
  completedLessons: number;
  totalAvailableLessons?: number;
  completionPercentage?: number;
  enrollmentData?: { courseId: string }[];
}

type Lesson = {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

type Module = {
  _id: string;
  title: string;
  description?: string;
  lessonsCount: number;
  lessons: Lesson[];
}

type Course = {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  modulesCount: number;
  modules: Module[];
}

type Enrollment = {
  _id: string;
  enrolledAt: string;
  course: Course;
}

type CompletedLesson = {
  _id: string;
  completedAt: string;
  lessonTitle: string;
  courseTitle: string;
}

type StudentProgress = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  enrolledCourses: Enrollment[];
  completedLessonsCount: number;
  lastCompletedLesson?: CompletedLesson;
}

type CourseStats = {
  _id: string;
  title: string;
  completions: number;
}

type StudentStats = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  completedLessons: number;
}

type ProgressStats = {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalLessonsCompleted: number;
  topStudents: StudentStats[];
  topCourses: CourseStats[];
}

type StudentProgressData = {
  student: StudentProgress;
}

// Obtener lista de estudiantes con información básica para el selector
async function getStudentsList() {
  return await adminClient.fetch<StudentBasic[]>(
    `*[_type == "student"] | order(firstName asc) {
      _id,
      firstName,
      lastName,
      fullName,
      email,
      "enrolledCourses": count(*[_type == "enrollment" && student._ref == ^._id]),
      "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id]),
      "enrollmentData": *[_type == "enrollment" && student._ref == ^._id] {
        "courseId": course._ref
      },
      "totalAvailableLessons": 0
    }`
  ).then(async students => {
    // Para cada estudiante, obtener el total de lecciones disponibles en sus cursos
    const studentsWithLessons = await Promise.all(
      students.map(async student => {
        // Obtener todos los IDs de cursos en los que está inscrito
        const courseIds = student.enrollmentData?.map((enrollment: { courseId: string }) => enrollment.courseId) || [];
        
        if (courseIds.length === 0) {
          return {
            ...student,
            totalAvailableLessons: 0,
            completionPercentage: 0
          };
        }
        
        // Obtener el total de lecciones de todos los cursos
        const coursesData = await adminClient.fetch(
          `*[_type == "course" && _id in $courseIds] {
            "lessonCount": count(modules[]->.lessons[])
          }`,
          { courseIds }
        );
        
        // Sumar el total de lecciones disponibles
        const totalLessons = coursesData.reduce((total: number, course: { lessonCount?: number }) => total + (course.lessonCount || 0), 0);
        
        // Calcular el porcentaje de completitud
        const completionPercentage = totalLessons > 0 
          ? Math.round((student.completedLessons / totalLessons) * 100) 
          : 0;
        
        return {
          ...student,
          totalAvailableLessons: totalLessons,
          completionPercentage
        };
      })
    );
    
    return studentsWithLessons;
  });
}

// Obtener datos detallados de progreso para un estudiante específico
async function getStudentProgress(studentId: string) {
  return await adminClient.fetch<StudentProgressData>(
    `{
      "student": *[_type == "student" && _id == $studentId][0] {
        _id,
        firstName,
        lastName,
        fullName,
        email,
        "enrolledCourses": *[_type == "enrollment" && student._ref == ^._id] {
          _id,
          enrolledAt,
          "course": course-> {
            _id,
            title,
            description,
            "slug": slug.current,
            "imageUrl": image.asset->url,
            "modulesCount": count(modules),
            "modules": modules[]-> {
              _id,
              title,
              description,
              "lessonsCount": count(lessons),
              "lessons": lessons[]-> {
                _id,
                title,
                "isCompleted": count(*[_type == "lessonCompletion" && student._ref == $studentId && lesson._ref == ^._id]) > 0,
                "completedAt": *[_type == "lessonCompletion" && student._ref == $studentId && lesson._ref == ^._id][0].completedAt
              }
            }
          }
        },
        "completedLessonsCount": count(*[_type == "lessonCompletion" && student._ref == ^._id]),
        "lastCompletedLesson": *[_type == "lessonCompletion" && student._ref == ^._id] | order(completedAt desc)[0] {
          _id,
          completedAt,
          "lessonTitle": lesson->title,
          "courseTitle": course->title
        }
      }
    }`,
    { studentId }
  );
}

// Obtener estadísticas generales
async function getProgressStats() {
  return await adminClient.fetch<ProgressStats>(
    `{
      "totalStudents": count(*[_type == "student"]),
      "totalCourses": count(*[_type == "course"]),
      "totalEnrollments": count(*[_type == "enrollment"]),
      "totalLessonsCompleted": count(*[_type == "lessonCompletion"]),
      "topStudents": *[_type == "student"] | order(count(*[_type == "lessonCompletion" && student._ref == ^._id]) desc)[0...5] {
        _id,
        firstName,
        lastName,
        fullName,
        "completedLessons": count(*[_type == "lessonCompletion" && student._ref == ^._id])
      },
      "topCourses": *[_type == "course"] | order(count(*[_type == "lessonCompletion" && course._ref == ^._id]) desc)[0...5] {
        _id,
        title,
        "completions": count(*[_type == "lessonCompletion" && course._ref == ^._id])
      }
    }`
  );
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: { studentId?: string };
}) {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/progress");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  // Obtener la lista de estudiantes
  const studentsList = await getStudentsList();
  
  // Obtener estadísticas generales
  const stats = await getProgressStats();
  
  // Si hay un ID de estudiante en los parámetros, mostrar detalles de ese estudiante
  const selectedStudentId = searchParams.studentId || (studentsList[0]?._id || "");
  const studentProgress = selectedStudentId 
    ? await getStudentProgress(selectedStudentId)
    : null;
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Progreso Académico</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Estudiantes</CardDescription>
            <CardTitle className="text-4xl">{stats.totalStudents}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cursos</CardDescription>
            <CardTitle className="text-4xl">{stats.totalCourses}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inscripciones</CardDescription>
            <CardTitle className="text-4xl">{stats.totalEnrollments}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lecciones Completadas</CardDescription>
            <CardTitle className="text-4xl">{stats.totalLessonsCompleted}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Tabs defaultValue="student-progress" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="student-progress">Progreso por Estudiante</TabsTrigger>
          <TabsTrigger value="course-progress">Progreso por Curso</TabsTrigger>
          <TabsTrigger value="global-progress">Vista Global</TabsTrigger>
        </TabsList>
        
        <TabsContent value="student-progress">
          <Card>
            <CardHeader>
              <CardTitle>Selecciona un Estudiante</CardTitle>
              <CardDescription>
                Visualiza el progreso detallado de cada estudiante en sus cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="w-full md:w-1/3">
                  <form action="/admin/progress" className="space-y-4">
                    <div className="flex gap-2">
                      <select 
                        name="studentId" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={selectedStudentId}
                      >
                        <option value="">Seleccionar estudiante...</option>
                        {studentsList.map((student: StudentBasic) => (
                          <option key={student._id} value={student._id}>
                            {student.firstName || student.fullName} ({student.email})
                          </option>
                        ))}
                      </select>
                      <Button type="submit" className="shrink-0">
                        Ver Progreso
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
              
              {studentProgress?.student && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{studentProgress.student.fullName}</h2>
                      <p className="text-sm text-muted-foreground">{studentProgress.student.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">
                          {studentProgress.student.enrolledCourses.length} Cursos
                        </Badge>
                        <Badge variant="outline">
                          {studentProgress.student.completedLessonsCount} Lecciones Completadas
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {studentProgress.student.lastCompletedLesson && (
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardDescription>Última lección completada</CardDescription>
                        <CardTitle className="text-lg">{studentProgress.student.lastCompletedLesson.lessonTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Curso: {studentProgress.student.lastCompletedLesson.courseTitle} | 
                          Completada: {formatDate(studentProgress.student.lastCompletedLesson.completedAt)}
                        </p>
                      </CardHeader>
                    </Card>
                  )}
                  
                  <h3 className="text-lg font-medium mb-4">Progreso por Curso</h3>
                  
                  {studentProgress.student.enrolledCourses.length === 0 ? (
                    <p className="text-muted-foreground">No hay cursos asignados a este estudiante.</p>
                  ) : (
                    <div className="space-y-6">
                      {studentProgress.student.enrolledCourses.map((enrollment: Enrollment) => {
                        const course = enrollment.course;
                        
                        // Calcular el progreso total del curso
                        let totalLessons = 0;
                        let completedLessons = 0;
                        
                        course.modules.forEach((module: Module) => {
                          totalLessons += module.lessons.length;
                          module.lessons.forEach((lesson: Lesson) => {
                            if (lesson.isCompleted) completedLessons++;
                          });
                        });
                        
                        const progressPercentage = totalLessons > 0 
                          ? Math.round((completedLessons / totalLessons) * 100) 
                          : 0;
                        
                        return (
                          <Card key={enrollment._id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{course.title}</CardTitle>
                                  <CardDescription>
                                    Inscrito: {formatDate(enrollment.enrolledAt)}
                                  </CardDescription>
                                </div>
                                <Badge>{completedLessons}/{totalLessons} lecciones</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">{progressPercentage}% completado</span>
                                </div>
                                <Progress value={progressPercentage} />
                              </div>
                              
                              <Accordion type="single" collapsible className="w-full">
                                {course.modules.map((module: Module) => {
                                  // Calcular progreso del módulo
                                  const moduleTotalLessons = module.lessons.length;
                                  const moduleCompletedLessons = module.lessons.filter((l: Lesson) => l.isCompleted).length;
                                  const moduleProgress = moduleTotalLessons > 0 
                                    ? Math.round((moduleCompletedLessons / moduleTotalLessons) * 100) 
                                    : 0;
                                  
                                  return (
                                    <AccordionItem key={module._id} value={module._id}>
                                      <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                          <span>{module.title}</span>
                                          <Badge variant={moduleProgress === 100 ? "default" : "outline"}>
                                            {moduleCompletedLessons}/{moduleTotalLessons}
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="mb-2">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm">{moduleProgress}% completado</span>
                                          </div>
                                          <Progress value={moduleProgress} className="h-2" />
                                        </div>
                                        
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Lección</TableHead>
                                              <TableHead className="w-[100px]">Estado</TableHead>
                                              <TableHead className="w-[200px]">Completada</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {module.lessons.map((lesson: Lesson) => (
                                              <TableRow key={lesson._id}>
                                                <TableCell>{lesson.title}</TableCell>
                                                <TableCell>
                                                  {lesson.isCompleted ? (
                                                    <Badge>Completada</Badge>
                                                  ) : (
                                                    <Badge variant="outline">Pendiente</Badge>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {lesson.completedAt ? formatDate(lesson.completedAt) : "-"}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="course-progress">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Cursos</CardTitle>
              <CardDescription>
                Estadísticas de completado por curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-medium mb-4">Cursos con más lecciones completadas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-right">Lecciones Completadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topCourses.map((course: CourseStats) => (
                    <TableRow key={course._id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell className="text-right">{course.completions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <h3 className="text-lg font-medium mt-8 mb-4">Estudiantes con más progreso</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="text-right">Lecciones Completadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topStudents.map((student: StudentStats) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/admin/progress?studentId=${student._id}`}
                          className="hover:underline"
                        >
                          {student.firstName || student.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{student.completedLessons}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="global-progress">
          <Card>
            <CardHeader>
              <CardTitle>Progreso General de Estudiantes</CardTitle>
              <CardDescription>
                Vista global del porcentaje de completitud de cada estudiante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead>Lecciones</TableHead>
                    <TableHead className="w-[180px]">Progreso</TableHead>
                    <TableHead className="text-right">Completitud</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsList.map((student: StudentBasic) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/admin/progress?studentId=${student._id}`}
                          className="hover:underline"
                        >
                          {student.firstName || student.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.enrolledCourses}</TableCell>
                      <TableCell>
                        {student.completedLessons}/{student.totalAvailableLessons || 0}
                      </TableCell>
                      <TableCell>
                        <Progress value={student.completionPercentage || 0} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={student.completionPercentage === 100 ? "default" : 
                                  (student.completionPercentage || 0) > 50 ? "secondary" : "outline"}
                        >
                          {student.completionPercentage || 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
