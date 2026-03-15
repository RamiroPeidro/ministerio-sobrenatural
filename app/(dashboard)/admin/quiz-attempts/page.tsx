import { client } from "@/sanity/lib/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function QuizAttemptsPage() {
  const attempts = await client.fetch(`
    *[_type == "quizAttempt"] | order(completedAt desc) {
      _id,
      attemptNumber,
      score,
      correctAnswers,
      totalQuestions,
      passed,
      completedAt,
      "studentName": student->firstName + " " + student->lastName,
      "lessonTitle": lesson->title
    }
  `);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Intentos de Quiz</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estudiante</TableHead>
            <TableHead>Lección</TableHead>
            <TableHead>Intento #</TableHead>
            <TableHead>Puntaje</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt: any) => (
            <TableRow key={attempt._id}>
              <TableCell>{attempt.studentName}</TableCell>
              <TableCell>{attempt.lessonTitle}</TableCell>
              <TableCell>#{attempt.attemptNumber}</TableCell>
              <TableCell>
                {attempt.correctAnswers}/{attempt.totalQuestions} ({attempt.score}%)
              </TableCell>
              <TableCell>
                <Badge variant={attempt.passed ? "default" : "destructive"}>
                  {attempt.passed ? "Aprobado" : "Reprobado"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(attempt.completedAt).toLocaleDateString('es-ES')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
