"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import { BookOpen, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function AuthPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Este efecto verifica si el usuario está autenticado y redirige a /my-courses
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("Usuario autenticado, redirigiendo a /my-courses");
      router.push("/my-courses");
    }
  }, [isLoaded, isSignedIn, router]);

  // Si ya está autenticado, no mostramos nada mientras se hace la redirección
  if (isSignedIn) return null;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5 overflow-hidden">
      {/* Decorative elements - adjusted for better mobile display */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 sm:w-80 sm:h-80 sm:-top-40 sm:-right-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 sm:w-80 sm:h-80 sm:-left-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 w-60 h-60 sm:w-80 sm:h-80 sm:-bottom-40 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative flex flex-col items-center justify-center px-4 py-2 sm:py-6 sm:px-6 mx-auto w-full">
        {mounted && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:gap-8"
          >
            {/* Auth form - Now comes first on ALL screen sizes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full max-w-[340px] sm:max-w-md mx-auto md:flex-1 md:order-2"
            >
              <div
                className={cn(
                  "bg-card/80 backdrop-blur-sm p-3 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-border/50",
                  "transition-all duration-300 ease-in-out",
                  "hover:shadow-xl hover:border-primary/20",
                )}
              >
                <div className="relative">
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SignIn
                      routing="hash"
                      afterSignInUrl="/my-courses"
                      redirectUrl="/my-courses"
                      appearance={{
                        elements: {
                          formButtonPrimary:
                            "bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200",
                          card: "bg-transparent shadow-none",
                          headerTitle: "text-base sm:text-lg md:text-xl font-semibold text-center",
                          headerSubtitle: "text-xs sm:text-sm text-muted-foreground text-center",
                          formFieldLabel: "text-xs sm:text-sm font-medium",
                          formFieldInput:
                            "flex h-9 sm:h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-xs sm:text-sm ring-offset-background focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:outline-none transition-all duration-200",
                          footerActionLink: "text-primary hover:text-primary/90 font-medium",
                          dividerLine: "bg-border/50",
                          dividerText: "text-xs text-muted-foreground",
                          formFieldAction__forgotPassword: "text-xs text-primary hover:text-primary/90 font-medium",
                          identityPreviewEditButton: "text-primary hover:text-primary/90",
                          socialButtonsBlockButton:
                            "border border-border hover:border-primary/20 transition-all duration-200 text-xs",
                          footerAction__signUp: "!hidden !opacity-0 !w-0 !h-0 !overflow-hidden !m-0 !p-0", // Ocultar el botón de registro interno de Clerk con fuerza
                          footer: "!pb-0", // Reducir el espacio inferior
                          formField: "mb-2 sm:mb-4", // Reduce spacing between form fields on mobile
                          main: "gap-1 sm:gap-2 md:gap-4", // Reduce spacing in the main container on mobile
                        },
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Contenido de la izquierda - Ahora viene de segundo en móvil */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="md:flex-1 md:order-1 mt-12 md:mt-0 text-center md:text-left space-y-2 md:space-y-4"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex justify-center md:justify-start mb-0"
              >
                {/* Reemplazar texto por logo */}
                <div className="w-48 sm:w-56 md:w-64 relative">
                  <img 
                    src="/images/logo-msn.png" 
                    alt="Logo Ministerio Sobrenatural" 
                    className="w-full h-auto" 
                  />
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-2 sm:space-y-3 -mt-2 sm:-mt-4"
              >
                <h2 className="text-xl sm:text-2xl font-semibold leading-tight">
                  Escuela de Ministerio Sobrenatural
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
                  Campus Virtual de la Escuela de Ministerio Sobrenatural de la Iglesia del Centro.
                </p>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start"
              >
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span>Cursos exclusivos</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span>Contenido inspirador</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Simple branding for smallest screens (only shows on xs screens) */}
            <div className="sm:hidden mt-5 text-center">
              <div className="inline-flex items-center space-x-2 justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  M. Sobrenatural
                </h1>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
