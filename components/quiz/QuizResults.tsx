import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizResultsProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResults({
  score,
  correctAnswers,
  totalQuestions,
  passed,
  onRetry,
  onContinue,
}: QuizResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {passed ? "¡Felicitaciones!" : "Casi lo logras"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold mb-4">
            {score.toFixed(0)}%
          </div>
          <p className="text-lg">
            {correctAnswers} de {totalQuestions} correctas
          </p>

          {passed ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto my-4" />
              <p className="text-muted-foreground">
                Has aprobado la evaluación
              </p>
              <Button onClick={onContinue} className="w-full">
                Continuar
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto my-4" />
              <p className="text-muted-foreground">
                Necesitas al menos {Math.ceil(totalQuestions * 0.8)} de{" "}
                {totalQuestions} correctas (80%)
              </p>
              <Button onClick={onRetry} className="w-full">
                Reintentar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
