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
  const router = useRouter();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-background/95 backdrop-blur-sm border-t z-50 lg:left-[60px] xl:left-96">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate">
            {isCompleted
              ? "Lección completada!"
              : videoWatched
              ? "¿Listo para completar esta lección?"
              : "Necesitas ver el video completamente"}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {isCompleted
              ? "Puedes marcarla como incompleta si necesitas revisarla."
              : videoWatched
              ? "Marca como completada cuando hayas terminado."
              : "Mira el video hasta el final para poder marcar la lección como completada."}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={handleToggle}
                  disabled={isPending || isLoading || !canMarkComplete}
                  size="sm"
                  variant="default"
                  className={cn(
                    "w-full sm:min-w-[160px] sm:w-auto text-xs sm:text-sm transition-all duration-200 ease-in-out",
                    isCompleted
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : videoWatched
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isCompleted ? "Desmarcando..." : "Completando..."}
                    </>
                  ) : isCompleted ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Marcar como No Completada
                    </>
                  ) : videoWatched ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Completada
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Primero completa el video
                    </>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!videoWatched && !isCompleted && (
              <TooltipContent>
                <p>Debes ver el video completo antes de marcar la lección como completada</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
