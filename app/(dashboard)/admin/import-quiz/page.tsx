"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportQuizPage() {
  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      const response = await fetch("/api/lessons");
      const data = await response.json();
      setLessons(data);
    }
    fetchLessons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !lessonId) {
      setResult({ success: false, message: "Selecciona un archivo y una lección" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonId", lessonId);

      const response = await fetch("/api/admin/import-quiz", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: `✅ ${data.questionsCreated} preguntas creadas` });
        setFile(null);
        setLessonId("");
      } else {
        setResult({ success: false, message: `❌ ${data.error}` });
      }
    } catch {
      setResult({ success: false, message: "❌ Error al subir archivo" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Importar Preguntas desde Word</CardTitle>
          <CardDescription>
            Sube un archivo .docx con el formato especificado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="lesson">Lección</Label>
              <Select value={lessonId} onValueChange={setLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una lección" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson: any) => (
                    <SelectItem key={lesson._id} value={lesson._id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">Archivo Word (.docx)</Label>
              <Input
                id="file"
                type="file"
                accept=".docx"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
              {file && <p className="text-sm text-muted-foreground mt-2">{file.name}</p>}
            </div>

            <Alert>
              <AlertDescription>
                <strong>Formato:</strong>
                <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`1. ¿Pregunta?
a) Opción - No, porque...
b) Opción - Sí, porque...`}
                </pre>
              </AlertDescription>
            </Alert>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription className="flex items-center gap-2">
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.message}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading || !file || !lessonId} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
