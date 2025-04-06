"use client";

import { redirect, useRouter } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import React, { useState } from "react";
import { Meeting, Attendance, Student, Category } from "@/types/sanity";
import { CalendarClock, CheckCircle, Clock, Users, Calendar, VideoIcon, MapPin, BarChart, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Utilidad para obtener el color y el texto según el estado
function getMeetingStatusInfo(status: string) {
  switch (status) {
    case 'completed':
      return { color: 'bg-green-100 text-green-800', text: 'Finalizada', icon: CheckCircle };
    case 'in-progress':
      return { color: 'bg-blue-100 text-blue-800', text: 'En curso', icon: Clock };
    case 'scheduled':
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Programada', icon: Calendar };
    case 'cancelled':
      return { color: 'bg-red-100 text-red-800', text: 'Cancelada', icon: AlertCircle };
    default:
      return { color: 'bg-gray-100 text-gray-800', text: 'Desconocido', icon: AlertCircle };
  }
}

// Componente de cliente para las tarjetas de reuniones
function MeetingCard({ meeting, onStatusChange }: { 
  meeting: Meeting; 
  onStatusChange: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Función para actualizar el estado mediante la API
  const updateStatus = async (meetingId: string, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/meetings/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId, status }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`La reunión ahora está en estado "${status}"`);
        onStatusChange(); // Recargar datos
      } else {
        toast.error(data.error || "No se pudo actualizar el estado");
      }
    } catch (error) {
      toast.error("Error de conexión. Intente nuevamente.");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = getMeetingStatusInfo(meeting.status || 'scheduled');

  return (
    <Card key={meeting._id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{meeting.title}</CardTitle>
          {meeting.status && (
            <Badge 
              className={statusInfo.color}
              variant="outline"
            >
              <span className="flex items-center gap-1">
                {React.createElement(statusInfo.icon, { className: "h-3 w-3" })}
                {statusInfo.text}
              </span>
            </Badge>
          )}
        </div>
        <CardDescription>
          {meeting.categoryInfo?.name || 'Sin categoría'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm">
          <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{formatDate(meeting.date)}</span>
        </div>
        <div className="flex items-center text-sm">
          {meeting.isVirtual ? (
            <VideoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          ) : (
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{meeting.isVirtual ? 'Virtual' : 'Presencial'}</span>
        </div>
        <div className="flex items-center text-sm">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Asistencia: {meeting.attendanceCount || 0} estudiantes</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-4">
        <div className="text-sm">
          <span className="block text-xs text-muted-foreground mb-1">Cambiar estado:</span>
          <div className="flex gap-1">
            {meeting.status !== 'scheduled' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                disabled={isUpdating}
                onClick={() => updateStatus(meeting._id, 'scheduled')}
              >
                Programada
              </Button>
            )}
            {meeting.status !== 'in-progress' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs bg-blue-50 hover:bg-blue-100"
                disabled={isUpdating}
                onClick={() => updateStatus(meeting._id, 'in-progress')}
              >
                En curso
              </Button>
            )}
            {meeting.status !== 'completed' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs bg-green-50 hover:bg-green-100"
                disabled={isUpdating}
                onClick={() => updateStatus(meeting._id, 'completed')}
              >
                Finalizada
              </Button>
            )}
            {meeting.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs bg-red-50 hover:bg-red-100"
                disabled={isUpdating}
                onClick={() => updateStatus(meeting._id, 'cancelled')}
              >
                Cancelada
              </Button>
            )}
          </div>
        </div>
        <div>
          <Link 
            href={`https://ministerio-sobrenatural.sanity.studio/desk/meeting;${meeting._id}`}
            target="_blank" 
            className="text-sm text-primary hover:underline"
          >
            Editar en Sanity
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

// Página principal con patrón de carga de datos
export default function MeetingsDashboardPage() {
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [generalStats, setGeneralStats] = useState<any>({});
  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Función para cargar los datos
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meetings/data');
      const data = await response.json();
      
      if (data.success) {
        setUpcomingMeetings(data.upcomingMeetings || []);
        setRecentMeetings(data.recentMeetings || []);
        setCategoryStats(data.categoryStats || []);
        setGeneralStats(data.generalStats || {});
        setRecentAttendances(data.recentAttendances || []);
      } else {
        if (data.error === 'No autorizado') {
          router.push('/dashboard');
        }
        toast.error(data.error || "No se pudieron cargar los datos");
      }
    } catch (error) {
      toast.error("Error de conexión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar
  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Clases y Asistencia</h1>
          <p className="text-muted-foreground mt-2">
            Administra las clases programadas y monitorea la asistencia de los estudiantes
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Cargando datos...</p>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Próximas Clases</TabsTrigger>
              <TabsTrigger value="recent">Clases Recientes</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="attendance">Registro de Asistencia</TabsTrigger>
            </TabsList>
            
            {/* Próximas Clases */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => (
                    <MeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                      onStatusChange={loadData}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">No hay clases programadas próximamente</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Clases Recientes */}
            <TabsContent value="recent" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentMeetings.length > 0 ? (
                  recentMeetings.map((meeting) => (
                    <MeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                      onStatusChange={loadData}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">No hay clases recientes registradas</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Estadísticas */}
            <TabsContent value="stats" className="space-y-6">
              {/* Resumen general */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resumen General de Asistencia</CardTitle>
                  <CardDescription>
                    Estadísticas consolidadas de todas las categorías
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Total de Clases</p>
                      <div className="text-2xl font-bold">{generalStats.totalMeetings}</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Total de Estudiantes</p>
                      <div className="text-2xl font-bold">{generalStats.totalStudents}</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Asistencias Registradas</p>
                      <div className="text-2xl font-bold">{generalStats.totalAttendances}</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tasa de Asistencia General</p>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">{generalStats.attendanceRate}%</div>
                        <Badge 
                          variant={
                            generalStats.attendanceRate >= 90 ? "default" : 
                            generalStats.attendanceRate >= 75 ? "secondary" : 
                            generalStats.attendanceRate >= 50 ? "outline" : "destructive"
                          }
                        >
                          {generalStats.attendanceRate >= 90 ? "Excelente" : 
                           generalStats.attendanceRate >= 75 ? "Buena" : 
                           generalStats.attendanceRate >= 50 ? "Regular" : "Baja"}
                        </Badge>
                      </div>
                      <Progress value={generalStats.attendanceRate} className="h-2 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-lg font-medium mb-4">Estadísticas por Categoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryStats.map((stat) => (
                  <Card key={stat.category._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{stat.category.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total de Clases:</span>
                          <span className="font-medium">{stat.totalMeetings}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center">
                              <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                              <span>Finalizadas:</span>
                            </span>
                          </span>
                          <span className="font-medium">{stat.completedMeetings || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center">
                              <span className="h-2 w-2 bg-blue-500 rounded-full mr-1"></span>
                              <span>En curso:</span>
                            </span>
                          </span>
                          <span className="font-medium">{stat.inProgressMeetings || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center">
                              <span className="h-2 w-2 bg-yellow-500 rounded-full mr-1"></span>
                              <span>Programadas:</span>
                            </span>
                          </span>
                          <span className="font-medium">{stat.scheduledMeetings || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Estudiantes:</span>
                          <span className="font-medium">{stat.totalStudents}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Promedio de Asistencia:</span>
                          <span className="font-medium">{stat.averageAttendance} estudiantes</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tasa de Asistencia:</span>
                          <Badge 
                            variant={
                              stat.attendanceRate >= 90 ? "default" : 
                              stat.attendanceRate >= 75 ? "secondary" : 
                              stat.attendanceRate >= 50 ? "outline" : "destructive"
                            }
                          >
                            {stat.attendanceRate}%
                          </Badge>
                        </div>
                        <Progress value={stat.attendanceRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {categoryStats.length === 0 && (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">No hay categorías con datos de asistencia</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Registro de Asistencia */}
            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Últimas Asistencias Registradas</CardTitle>
                  <CardDescription>
                    Registro de las últimas asistencias de los estudiantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md divide-y">
                    {recentAttendances.length > 0 ? (
                      recentAttendances.map((attendance) => (
                        <div key={attendance._id} className="flex items-center justify-between p-4">
                          <div>
                            <div className="font-medium">
                              {attendance.studentInfo?.fullName || 
                               attendance.studentInfo?.firstName || 
                               attendance.studentInfo?.username || 
                               'Estudiante sin nombre'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {attendance.meetingInfo?.title || 'Reunión sin título'}
                            </div>
                          </div>
                          <div className="text-sm text-right">
                            <div className="flex items-center justify-end">
                              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                              <span className="text-green-600">Asistió</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(attendance.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">No hay registros de asistencia</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
