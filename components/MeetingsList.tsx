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
}

export function MeetingsList({ meetings, categoryId }: MeetingsListProps) {
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [now, setNow] = useState(new Date());
  
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
  
  const handleAttendance = async (meeting: Meeting) => {
    try {
      // Si la reunión es virtual, abrir el enlace de Zoom
      if (meeting.isVirtual) {
        // Determinar qué enlace de Zoom usar
        const zoomLink = meeting.useCustomZoomLink 
          ? meeting.zoomLink 
          : meeting.categoryInfo?.zoomLink;
          
        if (zoomLink) {
          window.open(zoomLink, "_blank");
        } else {
          toast.error("No se encontró un enlace de Zoom válido para esta reunión");
          return;
        }
      }
      
      // Registrar asistencia
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: meeting._id,
          categoryId: meeting.category?._ref || categoryId,
        }),
      });
      
      if (response.ok) {
        // Eliminamos el toast de éxito para hacer el proceso transparente
        // toast.success("¡Asistencia registrada correctamente!");
      } else {
        const error = await response.json();
        toast.error(`Error al registrar asistencia: ${error.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      toast.error("Ocurrió un error al registrar tu asistencia");
    }
  };
  
  // Si no hay reuniones programadas
  if (meetings.length === 0) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Clases programadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay clases programadas actualmente
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
            Próxima clase: {nextMeeting.title}
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
                Duración: {nextMeeting.duration || 2} horas
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
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => handleAttendance(nextMeeting)}
                >
                  {nextMeeting.isVirtual ? (
                    <>
                      <VideoIcon className="mr-2 h-4 w-4" />
                      Unirse a Zoom
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="mr-2 h-4 w-4" />
                      Registrar asistencia
                    </>
                  )}
                </Button>
              </div>
            ) : isInFuture ? (
              <div className="flex items-center">
                <CalendarClock className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm">La clase aún no ha comenzado</span>
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
