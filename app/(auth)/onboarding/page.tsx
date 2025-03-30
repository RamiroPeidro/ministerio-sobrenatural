"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/sanity/lib/client";

interface Category {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export default function OnboardingPage() {
  const { isLoaded, userId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await client.fetch(`
          *[_type == "category"] {
            _id,
            name,
            description,
            color,
            icon
          } | order(name asc)
        `);
        setCategories(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading categories:", error);
        setError("Failed to load categories. Please try again.");
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !userId) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/assign-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, categoryId: selectedCategory }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign category");
      }

      // Redireccionar a la página principal
      router.push("/my-courses");
    } catch (error) {
      console.error("Error assigning category:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign category. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  // Si no se ha cargado la autenticación o no hay userId, mostrar mensaje
  if (!isLoaded || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Bienvenido a Ministerio Sobrenatural
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          Selecciona la categoría a la que perteneces para acceder a tus cursos
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="mb-6 rounded-md bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 grid gap-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`flex cursor-pointer items-center justify-between rounded-md border p-4 transition-all hover:border-primary/50 ${
                    selectedCategory === category._id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {selectedCategory === category._id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedCategory || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
