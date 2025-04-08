"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mapeo de categorías (años) como en el script
const CATEGORIES = [
  { id: 'fdb037fd-0ec4-4024-ac55-8fa5bcce9305', name: 'Primer año' },
  { id: '5d6dcd06-38a3-476e-ba1c-c97075f6356c', name: 'Segundo año' },
  { id: 'f3f4728b-1579-4586-a212-344c45f0b527', name: 'Tercer año' }
];

export default function AdminRegisterPage() {
  // Estados para los campos del formulario
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [categoryId, setCategoryId] = useState("")
  
  // Estados para el proceso de registro
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Generar un nombre de usuario normalizado
  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_-]/g, "");
  };

  // Función para crear el usuario en Clerk
  const createClerkUser = async () => {
    try {
      // Contraseña por defecto como en el script
      const securePassword = "Ministerio+123";
      
      // Generar username normalizado
      const normalizedFirstName = normalizeText(firstName);
      const normalizedLastName = normalizeText(lastName);
      const username = `${normalizedFirstName}_${normalizedLastName}`;
      
      // Datos del usuario para Clerk
      const userData = {
        username,
        password: securePassword,
        first_name: firstName,
        last_name: lastName,
        email_address: [email],
        skip_password_checks: true
      };
      
      // Llamar a un endpoint propio para manejar la creación en Clerk
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error al crear usuario: ${response.status}`);
      }
      
      const data = await response.json();
      return data.id;
    } catch (error: any) {
      throw new Error(`Error al crear usuario en Clerk: ${error.message}`);
    }
  };

  // Función para asignar la categoría
  const assignCategory = async (userId: string, categoryId: string) => {
    try {
      const response = await fetch('/api/user/assign-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, categoryId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error al asignar categoría: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(`Error al asignar categoría: ${error.message}`);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reiniciar estados
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    
    try {
      // Validaciones básicas
      if (!firstName || !lastName || !email || !categoryId) {
        throw new Error('Todos los campos son obligatorios');
      }
      
      if (!email.includes('@')) {
        throw new Error('Email inválido');
      }
      
      // 1. Crear usuario en Clerk
      const newUserId = await createClerkUser();
      setUserId(newUserId);
      
      // 2. Esperar para que el webhook tenga tiempo de procesar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Asignar categoría
      await assignCategory(newUserId, categoryId);
      
      // Mostrar éxito
      setSuccess(true);
      
      // Reiniciar formulario
      setFirstName("");
      setLastName("");
      setEmail("");
      setCategoryId("");
      
    } catch (error: any) {
      setError(error.message);
      console.error('Error en el registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      <div className="max-w-xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Registro exitoso</AlertTitle>
            <AlertDescription className="text-green-600">
              Usuario registrado correctamente con ID: {userId}.
              <br />
              Se ha asignado la categoría seleccionada y el estudiante tendrá acceso a sus cursos.
              <br />
              Contraseña: <strong>Ministerio+123</strong>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información del estudiante</CardTitle>
              <CardDescription>
                Ingrese los datos del nuevo estudiante que desea registrar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    placeholder="Nombre del estudiante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    placeholder="Apellido del estudiante"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoría (Año)</Label>
                <Select 
                  value={categoryId} 
                  onValueChange={setCategoryId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  La categoría determina a qué cursos tendrá acceso el estudiante.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : "Registrar Estudiante"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Notas:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Todos los estudiantes se crean con la contraseña predeterminada: <strong>Ministerio+123</strong></li>
            <li>Se generará automáticamente un nombre de usuario basado en el nombre y apellido.</li>
            <li>El proceso asignará automáticamente los cursos correspondientes a la categoría seleccionada.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
