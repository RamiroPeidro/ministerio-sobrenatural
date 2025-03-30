"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// ReactPlayer para videos no-Bunny (YouTube, etc.)
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

// Declaración para Player.js
declare global {
  interface Window {
    playerjs: {
      Player: new (iframe: HTMLIFrameElement) => PlayerInstance;
    };
  }
}

// Interfaz para la instancia del reproductor
interface PlayerInstance {
  on: (event: string, callback: () => void) => void;
  off: (event: string) => void;
}

interface VideoPlayerProps {
  url: string;
  lessonId?: string;
}

export const VideoPlayer = ({ url, lessonId = "" }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerJsLoaded, setIsPlayerJsLoaded] = useState(false);
  
  // Detectar si es una URL de Bunny.net
  const isBunnyUrl = useMemo(() => {
    return url.includes('iframe.mediadelivery.net') || 
           url.includes('video.bunnycdn.com') || 
           /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(url);
  }, [url]);
  
  // Extraer información del video de Bunny
  const bunnyInfo = useMemo(() => {
    let videoId = url;
    let libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || "403286";
    
    // Caso 1: URL directa de iframe.mediadelivery.net
    if (url.includes('iframe.mediadelivery.net')) {
      const parts = url.split('/');
      const embedIndex = parts.findIndex(part => part === 'play' || part === 'embed');
      
      if (embedIndex !== -1 && parts.length > embedIndex + 2) {
        libraryId = parts[embedIndex + 1];
        videoId = parts[embedIndex + 2].split('?')[0]; // Eliminar parámetros
      }
    } 
    // Caso 2: URL de video.bunnycdn.com
    else if (url.includes('video.bunnycdn.com')) {
      const parts = url.split('/');
      const idIndex = parts.length - 1;
      if (idIndex > 0) {
        videoId = parts[idIndex].split('?')[0];
      }
    }
    // Caso 3: Es solo un ID de video
    else if (/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(url)) {
      videoId = url;
    }
    
    return { videoId, libraryId };
  }, [url]);

  // Función para marcar el video como completado
  const markAsCompleted = useCallback(() => {
    if (!lessonId) return;
    
    // Guardar en localStorage
    const completedVideos = JSON.parse(localStorage.getItem("completedVideos") || "{}");
    completedVideos[lessonId] = true;
    localStorage.setItem("completedVideos", JSON.stringify(completedVideos));
    
    // Disparar evento para notificar a otros componentes
    const event = new CustomEvent("videoCompleted", { detail: { lessonId } });
    window.dispatchEvent(event);
  }, [lessonId]);

  // Cargar Player.js
  useEffect(() => {
    if (!isBunnyUrl) return;

    // Verificar si ya está cargado
    if (window.playerjs) {
      setIsPlayerJsLoaded(true);
      return;
    }

    const loadPlayerJs = () => {
      const script = document.createElement('script');
      script.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
      script.async = true;
      script.onload = () => {
        setIsPlayerJsLoaded(true);
      };
      script.onerror = () => {
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadPlayerJs();
  }, [isBunnyUrl]);

  // Generar URL del iframe para Bunny
  const getBunnyEmbedUrl = () => {
    return `https://iframe.mediadelivery.net/embed/${bunnyInfo.libraryId}/${bunnyInfo.videoId}`;
  };

  // Inicializar el reproductor una vez que player.js esté disponible
  useEffect(() => {
    if (!isBunnyUrl || !isPlayerJsLoaded || !iframeRef.current) return;

    try {
      const player = new window.playerjs.Player(iframeRef.current);
      playerRef.current = player;

      player.on('ready', () => {
        setIsLoading(false);
        
        // Registramos solo el evento 'ended'
        player.on('ended', () => {
          // Solo registramos un log para el evento ended
          console.log("VIDEO TERMINADO - Bunny.net");
          markAsCompleted();
        });
      });
    } catch {
      setIsLoading(false);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.off('ready');
          playerRef.current.off('ended');
        } catch {
          // Ignorar errores al limpiar
        }
        playerRef.current = null;
      }
    };
  }, [isBunnyUrl, isPlayerJsLoaded, url, lessonId, markAsCompleted]);

  // Manejador para ReactPlayer
  const handleReactPlayerEnded = () => {
    console.log("VIDEO TERMINADO - ReactPlayer");
    markAsCompleted();
  };

  return (
    <div className="relative aspect-video">
      {isBunnyUrl ? (
        // Reproductor de Bunny usando iframe con Player.js
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={getBunnyEmbedUrl()}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ) : (
        // ReactPlayer para otros videos (YouTube, etc.)
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          playing={false}
          onEnded={handleReactPlayerEnded}
        />
      )}
    </div>
  );
};