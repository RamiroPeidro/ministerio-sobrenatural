"use client";

import { Button } from "@/components/ui/button";
import { VideoIcon, CalendarClock, ClockIcon, CheckCircleIcon, MapPinIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AttendanceLinkProps {
  zoomLink: string;
  zoomPassword?: string;
  meetingId?: string; // ID opcional para identificar la reunión
  nextMeetingDate?: string; // Fecha de la próxima reunión
  meetingDuration?: number; // Duración de la reunión en horas
  isPresential?: boolean; // Indica si la reunión es presencial
}

export function AttendanceLink({ 
  zoomLink, 
  zoomPassword, 
  meetingId = "default",
  nextMeetingDate,
  meetingDuration = 2,
  isPresential = false
}: AttendanceLinkProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isSameDay, setIsSameDay] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [formattedMeetingTime, setFormattedMeetingTime] = useState<string>("");

  useEffect(() => {
    if (nextMeetingDate) {
      const meetingDate = new Date(nextMeetingDate);
      // Formatear la hora de la reunión
      setFormattedMeetingTime(formatMeetingDate(meetingDate));
      
      // Comprobar si es el mismo día
      const now = new Date();
      const sameDay = 
        now.getDate() === meetingDate.getDate() &&
        now.getMonth() === meetingDate.getMonth() &&
        now.getFullYear() === meetingDate.getFullYear();
      
      setIsSameDay(sameDay);
      
      // Comprobar si la clase ya terminó
      const meetingEnd = new Date(meetingDate);
      meetingEnd.setHours(meetingEnd.getHours() + meetingDuration);
      setHasEnded(now > meetingEnd);
    }
    
    // Decidir si mostrar el botón (sólo si no es presencial)
    setShouldShow(!isPresential && isMeetingTimeWindow());
  }, [nextMeetingDate, isPresential]);

  // Formatear la fecha de la reunión para mostrarla
  const formatMeetingDate = (date: Date): string => {
    // Formatear la fecha completa para mostrar
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('es-AR', dateOptions).format(date);
  };

  // Verificar si estamos en la ventana de tiempo para mostrar el botón (10 min antes hasta final)
  const isMeetingTimeWindow = (): boolean => {
    // Si no hay fecha, siempre mostrar (comportamiento anterior)
    if (!nextMeetingDate) {
      return true;
    }
    
    const now = new Date();
    const meetingDate = new Date(nextMeetingDate);
    
    // Crear una ventana de tiempo que comienza 10 minutos antes de la reunión
    const meetingStartWindow = new Date(meetingDate);
    meetingStartWindow.setMinutes(meetingStartWindow.getMinutes() - 10);
    
    // Verificar si es el mismo día
    const isSameDay = 
      now.getDate() === meetingDate.getDate() &&
      now.getMonth() === meetingDate.getMonth() &&
      now.getFullYear() === meetingDate.getFullYear();
    
    // Si es el mismo día, verificar si estamos dentro de la ventana de tiempo
    if (isSameDay) {
      const meetingEnd = new Date(meetingDate);
      meetingEnd.setHours(meetingEnd.getHours() + meetingDuration);
      
      // Mostrar el botón si estamos entre (hora de inicio - 10 minutos) y (hora de inicio + duración)
      return now >= meetingStartWindow && now <= meetingEnd;
    }
    
    return false;
  };

  const handleAttendance = async () => {
    try {
      // Abrir el enlace de Zoom en una nueva pestaña inmediatamente
      window.open(zoomLink, "_blank");
      
      // Extraer el ID de la reunión del enlace de Zoom si no se proporciona
      let actualMeetingId = meetingId;
      if (actualMeetingId === "default" && zoomLink) {
        // Intentar extraer el ID de la reunión del enlace de Zoom
        const match = zoomLink.match(/\/j\/(\d+)/);
        if (match && match[1]) {
          actualMeetingId = match[1];
        }
      }

      // Registrar asistencia en segundo plano sin mostrar estado al usuario
      await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: actualMeetingId,
        }),
      });
      
    } catch (error) {
      // Solo registramos el error en la consola sin mostrar nada al usuario
      console.error("Error al registrar asistencia:", error);
    }
  };

  // Renderizar el componente con información según el contexto
  return (
    <div className="space-y-2">
      {shouldShow ? (
        // Botón para unirse a Zoom (visible 10 min antes, solo si no es presencial)
        <Button 
          className="w-full md:w-auto" 
          onClick={handleAttendance}
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          Unirse a Zoom
          {zoomPassword && (
            <span className="ml-2 text-xs">
              (Contraseña: {zoomPassword})
            </span>
          )}
        </Button>
      ) : (
        // Mensaje informativo según la situación
        <div className="flex items-center text-sm text-muted-foreground">
          {nextMeetingDate && hasEnded ? (
            // Si la clase ya pasó
            <>
              <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
              <span>
                Clase {isPresential ? 'presencial' : 'virtual'} finalizada el {formattedMeetingTime}
              </span>
            </>
          ) : nextMeetingDate ? (
            // Si hay una fecha programada pero no es hora todavía
            isPresential ? (
              // Si es una clase presencial
              <>
                <MapPinIcon className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium text-primary">
                  {isSameDay 
                    ? `Clase presencial hoy a las ${new Date(nextMeetingDate).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs`
                    : `Próxima clase presencial: ${formattedMeetingTime}`
                  }
                </span>
              </>
            ) : (
              // Si es una clase virtual
              <>
                <CalendarClock className="mr-2 h-4 w-4" />
                {isSameDay ? (
                  <span>
                    Próxima clase virtual hoy a las {new Date(nextMeetingDate).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs
                  </span>
                ) : (
                  <span>
                    Próxima clase virtual: {formattedMeetingTime}
                  </span>
                )}
              </>
            )
          ) : (
            // Si no hay fecha programada
            <>
              <ClockIcon className="mr-2 h-4 w-4" />
              <span>No hay clases programadas</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
