"use client"

import { SignIn, SignUp, useUser } from "@clerk/nextjs"
import { BookOpen, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function AuthPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
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
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative flex flex-col items-center justify-center px-4 py-10 mx-auto">
        {mounted && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
              {/* Left side - Branding */}
              <div className="space-y-6 text-center md:text-left order-2 md:order-1">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center space-x-2"
                >
                  <div className="relative">
                    <BookOpen className="h-10 w-10 text-primary" />
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 3,
                        repeatType: "loop",
                      }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </motion.div>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    M. Sobrenatural
                  </h1>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-semibold leading-tight">
                    Plataforma de Aprendizaje del Ministerio Sobrenatural
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
                    Accede a tus cursos y mantente conectado con los encuentros virtuales semanales.
                  </p>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap gap-4 justify-center md:justify-start"
                >
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span>Cursos exclusivos</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span>Contenido inspirador</span>
                  </div>
                </motion.div>
              </div>

              {/* Right side - Auth form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-full max-w-md mx-auto order-1 md:order-2"
              >
                <div
                  className={cn(
                    "bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-border/50",
                    "transition-all duration-300 ease-in-out",
                    "hover:shadow-xl hover:border-primary/20",
                  )}
                >
                  <div className="relative">
                    {!isSignUp ? (
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
                              headerTitle: "text-xl font-semibold text-center",
                              headerSubtitle: "text-muted-foreground text-center",
                              formFieldLabel: "text-sm font-medium",
                              formFieldInput:
                                "flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:outline-none transition-all duration-200",
                              footerActionLink: "text-primary hover:text-primary/90 font-medium",
                              dividerLine: "bg-border/50",
                              dividerText: "text-muted-foreground",
                              formFieldAction__forgotPassword: "text-primary hover:text-primary/90 font-medium",
                              identityPreviewEditButton: "text-primary hover:text-primary/90",
                              socialButtonsBlockButton:
                                "border border-border hover:border-primary/20 transition-all duration-200",
                              footerAction__signUp: "!hidden !opacity-0 !w-0 !h-0 !overflow-hidden !m-0 !p-0", // Ocultar el botón de registro interno de Clerk con fuerza
                              footer: "!pb-0", // Reducir el espacio inferior
                            },
                          }}
                        />
                        <p className="text-sm text-muted-foreground text-center mt-6">
                          ¿No tienes una cuenta?{" "}
                          <button
                            onClick={() => setIsSignUp(true)}
                            className="text-primary hover:text-primary/90 hover:underline font-medium transition-colors"
                          >
                            Regístrate aquí
                          </button>
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SignUp
                          routing="hash"
                          afterSignUpUrl="/onboarding"
                          redirectUrl="/onboarding"
                          unsafeMetadata={{
                            redirect: "/onboarding" // Metadata adicional para asegurar la redirección
                          }}
                          appearance={{
                            elements: {
                              formButtonPrimary:
                                "bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200",
                              card: "bg-transparent shadow-none",
                              headerTitle: "text-xl font-semibold text-center",
                              headerSubtitle: "text-muted-foreground text-center",
                              formFieldLabel: "text-sm font-medium",
                              formFieldInput:
                                "flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:outline-none transition-all duration-200",
                              footerActionLink: "text-primary hover:text-primary/90 font-medium",
                              dividerLine: "bg-border/50",
                              dividerText: "text-muted-foreground",
                              socialButtonsBlockButton:
                                "border border-border hover:border-primary/20 transition-all duration-200",
                              footerAction__signIn: "hidden", // Ocultar el botón de inicio de sesión interno
                            },
                          }}
                        />
                        <p className="text-sm text-muted-foreground text-center mt-6">
                          ¿Ya tienes una cuenta?{" "}
                          <button
                            onClick={() => setIsSignUp(false)}
                            className="text-primary hover:text-primary/90 hover:underline font-medium transition-colors"
                          >
                            Inicia sesión aquí
                          </button>
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
