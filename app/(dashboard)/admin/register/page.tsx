"use client"

import { SignUp } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminRegisterPage() {
  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registrar Nuevo Usuario</CardTitle>
          <CardDescription>
            Complete el formulario para registrar un nuevo estudiante en la plataforma.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="mt-6 bg-card rounded-lg shadow p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-medium">Instrucciones</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete la información del nuevo usuario. Después del registro, el estudiante
            será dirigido automáticamente al proceso de selección de categoría, donde podrá
            acceder a los cursos correspondientes.
          </p>
        </div>
        
        <div className="bg-background rounded-md p-4">
          <SignUp
            routing="hash"
            afterSignUpUrl="/onboarding"
            redirectUrl="/onboarding"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground transition-all",
                card: "bg-transparent shadow-none",
                headerTitle: "text-xl font-semibold",
                headerSubtitle: "text-sm text-muted-foreground",
                formFieldLabel: "text-sm font-medium",
                formFieldInput:
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:outline-none",
                footerActionLink: "text-primary hover:text-primary/90 font-medium",
                dividerLine: "bg-border/50",
                dividerText: "text-xs text-muted-foreground",
                footerAction__signIn: "hidden", // Ocultar enlaces a inicio de sesión
                footer: "hidden", // Ocultar el footer por completo
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
