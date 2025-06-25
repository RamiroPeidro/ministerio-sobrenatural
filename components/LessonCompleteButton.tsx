"use client";

import { CheckCircle, Loader2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeLessonAction } from "@/app/actions/completeLessonAction";
import { uncompleteLessonAction } from "@/app/actions/uncompleteLessonAction";
import { getLessonCompletionStatusAction } from "@/app/actions/getLessonCompletionStatusAction";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface LessonCompleteButtonProps {
  lessonId: string;
  clerkId: string;
}

// Definición del tipo para el evento de video completado
interface VideoCompletedEvent extends CustomEvent {
  detail: {
    lessonId: string;
  };
}

export function LessonCompleteButton({
  lessonId,
  clerkId,
}: LessonCompleteButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isPendingTransition, startTransition] = useTransition();
  const [videoWatched, setVideoWatched] = useState(false);
  const [isLowHeight, setIsLowHeight] = useState(false);
  const router = useRouter();

  // Detectar altura de pantalla para UI adaptativa
  useEffect(() => {
    const checkHeight = () => {
      // Pantallas con menos de 700px de altura son consideradas "bajas"
      setIsLowHeight(window.innerHeight < 700);
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  // Verificar si el video ha sido visto completamente
  useEffect(() => {
    // Verificar en localStorage si el video ya ha sido visto
    const completedVideos = JSON.parse(localStorage.getItem("completedVideos") || "{}");
    setVideoWatched(!!completedVideos[lessonId]);

    // Escuchar el evento de video completado
    const handleVideoCompleted = (event: VideoCompletedEvent) => {
      if (event.detail.lessonId === lessonId) {
        setVideoWatched(true);
      }
    };

    window.addEventListener("videoCompleted", handleVideoCompleted as EventListener);
    return () => {
      window.removeEventListener("videoCompleted", handleVideoCompleted as EventListener);
    };
  }, [lessonId]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const status = await getLessonCompletionStatusAction(lessonId, clerkId);
        setIsCompleted(status);
      } catch (error) {
        console.error("Error checking lesson completion status:", error);
        setIsCompleted(false);
      }
    });
  }, [lessonId, clerkId]);

  const handleToggle = async () => {
    try {
      setIsPending(true);
      if (isCompleted) {
        await uncompleteLessonAction(lessonId, clerkId);
      } else {
        await completeLessonAction(lessonId, clerkId);
      }

      startTransition(async () => {
        const newStatus = await getLessonCompletionStatusAction(
          lessonId,
          clerkId
        );
        setIsCompleted(newStatus);
      });

      router.refresh();
    } catch (error) {
      console.error("Error toggling lesson completion:", error);
    } finally {
      setIsPending(false);
    }
  };

  const isLoading = isCompleted === null || isPendingTransition;
  const canMarkComplete = videoWatched || isCompleted;

  // Configuración adaptativa según altura de pantalla
  const containerClasses = cn(
    "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50 lg:left-[60px] xl:left-96",
    isLowHeight ? "p-1" : "p-2 sm:p-4"
  );

  const contentClasses = cn(
    "max-w-4xl mx-auto flex items-center justify-between",
    isLowHeight ? "gap-2" : "gap-2 sm:gap-4",
    isLowHeight ? "flex-row" : "flex-col sm:flex-row"
  );

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className={cn("flex-1 min-w-0", isLowHeight && "max-w-[60%]")}>
          <p className={cn("font-medium truncate", isLowHeight ? "text-xs" : "text-xs sm:text-sm")}>
            {isCompleted
              ? "Lección completada!"
              : videoWatched
              ? "¿Listo para completar?"
              : isLowHeight
              ? "Ver video completo"
              : "Necesitas ver el video completamente"}
          </p>
          {!isLowHeight && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {isCompleted
                ? "Puedes marcarla como incompleta si necesitas revisarla."
                : videoWatched
                ? "Marca como completada cuando hayas terminado."
                : "Mira el video hasta el final para poder marcar la lección como completada."}
            </p>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(isLowHeight && "flex-shrink-0")}>
                <Button
                  onClick={handleToggle}
                  disabled={isPending || isLoading || !canMarkComplete}
                  size={isLowHeight ? "sm" : "sm"}
                  variant="default"
                  className={cn(
                    "transition-all duration-200 ease-in-out",
                    isLowHeight 
                      ? "px-3 py-1 text-xs min-w-[100px]" 
                      : "w-full sm:min-w-[160px] sm:w-auto text-xs sm:text-sm",
                    isCompleted
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : videoWatched
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {isLowHeight ? "..." : "Actualizando..."}
                    </>
                  ) : isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {isLowHeight ? "..." : isCompleted ? "Desmarcando..." : "Completando..."}
                    </>
                  ) : isCompleted ? (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      {isLowHeight ? "Desmarcar" : "Marcar como No Completada"}
                    </>
                  ) : videoWatched ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isLowHeight ? "Completar" : "Marcar como Completada"}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {isLowHeight ? "Ver video" : "Primero completa el video"}
                    </>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!videoWatched && !isCompleted 
                  ? "Debes ver el video completo antes de marcar la lección como completada"
                  : isCompleted
                  ? "Marcar lección como incompleta"
                  : "Marcar lección como completada"
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
