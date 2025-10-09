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
import { HistoricalExportButton, DateRangeExport } from "@/components/HistoricalExportButton";
import {
  FileSpreadsheet,
  Database,
  TrendingUp,
  Calendar,
  Users,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  const user = await adminClient.fetch(
    `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`,
    { userId }
  );
  return Boolean(user);
}

// Obtener estadísticas para mostrar estimaciones
async function getExportStats() {
  return await adminClient.fetch(`{
    "totalAttendance": count(*[_type == "attendance"]),
    "totalLessonCompletions": count(*[_type == "lessonCompletion"]),
    "totalStudents": count(*[_type == "student"]),
    "totalCourses": count(*[_type == "course"]),
    "totalEnrollments": count(*[_type == "enrollment"]),
    "oldestAttendance": *[_type == "attendance"] | order(date asc)[0].date,
    "latestAttendance": *[_type == "attendance"] | order(date desc)[0].date,
    "oldestCompletion": *[_type == "lessonCompletion"] | order(completedAt asc)[0].completedAt,
    "latestCompletion": *[_type == "lessonCompletion"] | order(completedAt desc)[0].completedAt
  }`);
}

// Obtener categorías para filtros
async function getCategories() {
  return await adminClient.fetch(`
    *[_type == "category"] | order(name asc) {
      _id,
      name
    }
  `);
}

export default async function ExportPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin/export");
  }

  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);

  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }

  // Obtener datos para la página
  const stats = await getExportStats();
  const categories = await getCategories();

  // Formatear fechas para mostrar rango
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7" />
            Exportación Histórica
          </h1>
          <p className="text-muted-foreground mt-1">
            Exporta todos los datos históricos del sistema a archivos CSV
          </p>
        </div>
      </div>

      {/* Estadísticas del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registros de Asistencia</CardDescription>
            <CardTitle className="text-3xl">{stats.totalAttendance?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Desde {formatDate(stats.oldestAttendance)} hasta {formatDate(stats.latestAttendance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lecciones Completadas</CardDescription>
            <CardTitle className="text-3xl">{stats.totalLessonCompletions?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Desde {formatDate(stats.oldestCompletion)} hasta {formatDate(stats.latestCompletion)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estudiantes Registrados</CardDescription>
            <CardTitle className="text-3xl">{stats.totalStudents?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inscripciones a Cursos</CardDescription>
            <CardTitle className="text-3xl">{stats.totalEnrollments?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alerta informativa */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Exportaciones históricas completas:</strong> Estas exportaciones incluyen TODOS los datos históricos del sistema sin límites.
          Los archivos grandes pueden tardar varios minutos en generarse y descargarse.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exportaciones históricas completas */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Exportaciones Históricas Completas
          </h2>

          {/* Asistencias históricas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Asistencias Históricas</CardTitle>
              </div>
              <CardDescription>
                Exporta TODOS los registros de asistencia a reuniones y clases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Incluye:</strong> Nombre del estudiante, email, categoría, reunión, tipo (virtual/presencial), fecha, asistencia, IP, user agent
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Estimado: ~{stats.totalAttendance?.toLocaleString() || 0} registros
                  </p>
                </div>
                <HistoricalExportButton type="attendance-history" />
              </div>
            </CardContent>
          </Card>

          {/* Progreso académico histórico */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <CardTitle>Progreso Académico Histórico</CardTitle>
              </div>
              <CardDescription>
                Exporta TODAS las lecciones completadas por los estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Incluye:</strong> Nombre del estudiante, email, curso, módulo, lección, fecha de completación, fecha de inscripción
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Estimado: ~{stats.totalLessonCompletions?.toLocaleString() || 0} registros
                  </p>
                </div>
                <HistoricalExportButton type="academic-progress" />
              </div>
            </CardContent>
          </Card>

          {/* Reporte consolidado */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Reporte Consolidado por Estudiante</CardTitle>
              </div>
              <CardDescription>
                Vista integral del rendimiento histórico de cada estudiante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Incluye:</strong> Datos del estudiante, estadísticas de asistencia, progreso académico, fechas de última actividad
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Estimado: ~{stats.totalStudents?.toLocaleString() || 0} estudiantes
                  </p>
                </div>
                <HistoricalExportButton type="consolidated-report" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exportaciones con filtros */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exportaciones con Filtros
          </h2>

          {/* Exportación por rango de fechas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Asistencias por Rango de Fechas</CardTitle>
              </div>
              <CardDescription>
                Exporta asistencias filtradas por período específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportByDateRangeComponent categories={categories} />
            </CardContent>
          </Card>

          {/* Instrucciones de uso */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>1. Exportaciones Completas:</strong> Incluyen TODO el historial sin límites de fecha.</p>
                <p><strong>2. Filtros por Fecha:</strong> Útiles para períodos específicos o reportes mensuales.</p>
                <p><strong>3. Archivos Grandes:</strong> Las exportaciones completas pueden tomar varios minutos.</p>
                <p><strong>4. Formato CSV:</strong> Compatible con Excel, Google Sheets y herramientas de análisis.</p>
                <p><strong>5. Codificación:</strong> Los archivos usan UTF-8 para caracteres especiales.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente cliente para manejar el rango de fechas
"use client";

import { useState, useEffect } from 'react';

function ExportByDateRangeComponent({ categories }: { categories: Array<{ _id: string; name: string }> }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  // Establecer fechas predeterminadas (último mes)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  return (
    <DateRangeExport
      startDate={startDate}
      endDate={endDate}
      categoryId={categoryId}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onCategoryChange={setCategoryId}
      categories={categories}
    />
  );
}