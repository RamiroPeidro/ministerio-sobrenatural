"use client";

import { Meeting } from "@/types/sanity";
import { Button } from "@/components/ui/button";
import { 
  VideoIcon, 
  CalendarClock, 
  ClockIcon, 
  CheckCircleIcon, 
  MapPinIcon, 
  ExternalLink 
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface MeetingsListProps {
  meetings: Meeting[];
  categoryId: string;
  categoryName: string; // Agregamos una nueva propiedad para el nombre de la categoría
}

export function MeetingsList({ meetings, categoryId, categoryName }: MeetingsListProps) {
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [now, setNow] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceRegistered, setAttendanceRegistered] = useState<Record<string, boolean>>({});
  
  // Verificar la asistencia registrada al cargar el componente
  useEffect(() => {
    // Solo verificamos si hay reuniones
    if (meetings.length === 0) return;
    
    const checkExistingAttendance = async () => {
      try {
        const meetingIds = meetings.map(meeting => meeting._id);
        const response = await fetch("/api/attendance/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingIds,
            categoryId
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Almacenar qué reuniones ya tienen asistencia registrada
          const registeredMeetings: Record<string, boolean> = {};
          
          data.attendedMeetings.forEach((meetingId: string) => {
            registeredMeetings[meetingId] = true;
          });
          
          setAttendanceRegistered(registeredMeetings);
        }
      } catch (error) {
        console.error("Error al verificar asistencia existente:", error);
      }
    };
    
    checkExistingAttendance();
  }, [meetings, categoryId]);
  
  // Este efecto actualiza la hora actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Actualiza cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  // Este efecto determina qué reuniones están activas actualmente
  useEffect(() => {
    const checkActiveMeetings = () => {
      const currentTime = new Date();
      
      const active = meetings.filter(meeting => {
        if (meeting.status === 'completed') return false;
        
        const meetingDate = new Date(meeting.date);
        const meetingStartWindow = new Date(meetingDate);
        meetingStartWindow.setMinutes(meetingStartWindow.getMinutes() - 15); // 15 minutos antes
        
        const meetingEnd = new Date(meetingDate);
        meetingEnd.setHours(meetingEnd.getHours() + (meeting.duration || 2));
        
        // Una reunión está activa si ya comenzó su ventana y aún no ha terminado
        return currentTime >= meetingStartWindow && currentTime <= meetingEnd;
      });
      
      console.log('Reuniones activas:', active.map(m => m.title));
      setActiveMeetings(active);
    };
    
    // Verificar inmediatamente
    checkActiveMeetings();
  }, [meetings, now]); // Depende de now para que se actualice cada minuto
  
  // Función para verificar si se debe registrar la asistencia (solo en los primeros 30 minutos)
  const shouldRegisterAttendance = (meeting: Meeting) => {
    const currentTime = new Date();
    const meetingDate = new Date(meeting.date);
    
    // Ventana de asistencia (primeros 30 minutos)
    const attendanceWindow = new Date(meetingDate);
    attendanceWindow.setMinutes(attendanceWindow.getMinutes() + 30);
    
    return currentTime <= attendanceWindow;
  };
  
  const handleAttendance = async (meeting: Meeting) => {
    try {
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      
      // Si la reunión es virtual, abrir el enlace de Zoom
      if (meeting.isVirtual) {
        // Determinar qué enlace de Zoom usar
        const zoomLink = meeting.useCustomZoomLink 
          ? meeting.zoomLink 
          : meeting.categoryInfo?.zoomLink;
          
        if (zoomLink) {
          window.open(zoomLink, "_blank");
          
          // Si ya se registró la asistencia, solo mostrar mensaje informativo
          if (attendanceRegistered[meeting._id]) {
            toast.info("Ingresando nuevamente al LAMA");
            setIsSubmitting(false);
            return;
          }
        } else {
          toast.error("No se encontró un enlace de Zoom válido para esta reunión");
          setIsSubmitting(false);
          return;
        }
      }
      
      // Verificar si estamos dentro de la ventana para registrar asistencia
      const canRegisterAttendance = shouldRegisterAttendance(meeting);
      
      if (canRegisterAttendance) {
        // Registrar asistencia solo si estamos dentro de la ventana de tiempo permitida
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingId: meeting._id,
            categoryId: meeting.category?._ref || categoryId
          }),
        });
        
        if (response.ok) {
          // Actualizar el estado local para deshabilitar el botón
          setAttendanceRegistered(prev => ({
            ...prev,
            [meeting._id]: true
          }));
          toast.success("Asistencia registrada con éxito");
        } else {
          const data = await response.json();
          toast.error(data.error || "Error al registrar asistencia");
        }
      } else {
        // Si es tarde, solo notificar que se unió pero sin asistencia
        toast.info("Te has unido a la reunión. La asistencia solo se registra en los primeros 30 minutos.");
      }
      
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error registrando asistencia:", error);
      toast.error("Error al procesar la asistencia");
      setIsSubmitting(false);
    }
  };
  
  // Si no hay reuniones programadas
  if (meetings.length === 0) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Laboratorio de Activación, Ministración y Aplicación - {categoryName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay LAMA programados actualmente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Obtenemos la próxima reunión (la primera de la lista ordenada)
  const nextMeeting = meetings[0];
  const meetingDate = new Date(nextMeeting.date);
  const isInFuture = meetingDate > now;
  const isActive = activeMeetings.some(m => m._id === nextMeeting._id);
  const isCompleted = nextMeeting.status === 'completed';
  
  // Debug info
  console.log({
    meetingTitle: nextMeeting.title,
    meetingTime: meetingDate.toLocaleString(),
    currentTime: now.toLocaleString(),
    isInFuture,
    isActive,
    isCompleted
  });
  
  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Próximo LAMA: {nextMeeting.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Detalles de la próxima reunión */}
            <div className="flex items-center">
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {formatDate(nextMeeting.date)}
              </p>
            </div>
            
            <div className="flex items-center">
              <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Duración: {nextMeeting.duration || 2} {(nextMeeting.duration || 2) === 1 ? 'hora' : 'horas'}
              </p>
            </div>
            
            {nextMeeting.isVirtual ? (
              <div className="flex items-center">
                <VideoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clase virtual por Zoom
                  {nextMeeting.zoomPassword && (
                    <span className="ml-2 font-medium">
                      (Contraseña: {nextMeeting.zoomPassword || nextMeeting.categoryInfo?.zoomPassword})
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex items-center">
                <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clase presencial {nextMeeting.location ? `- ${nextMeeting.location}` : ''}
                </p>
              </div>
            )}
            
            {/* Botón de asistencia y estados */}
            {isCompleted ? (
              <div className="flex items-center">
                <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                <span className="text-sm">Clase finalizada</span>
              </div>
            ) : isActive ? (
              <div>
                {nextMeeting.isVirtual ? (
                  <Button 
                    className="w-full md:w-auto" 
                    onClick={() => handleAttendance(nextMeeting)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <VideoIcon className="mr-2 h-4 w-4" />
                        {attendanceRegistered[nextMeeting._id] ? 'Volver a Zoom' : 'Unirse a Zoom'}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center">
                    <MapPinIcon className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm">Clase presencial en {nextMeeting.location || 'la ubicación designada'}</span>
                  </div>
                )}
              </div>
            ) : isInFuture ? (
              <div className="flex items-center">
                <CalendarClock className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">La clase no comenzó</span>
              </div>
            ) : (
              <div className="flex items-center">
                <ClockIcon className="mr-2 h-4 w-4 text-amber-500" />
                <span className="text-sm">La clase ya ha finalizado</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
