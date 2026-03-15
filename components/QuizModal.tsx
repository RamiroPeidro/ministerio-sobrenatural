"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizResults } from "@/components/quiz/QuizResults";
import { getQuizForLesson, submitQuizAttempt } from "@/actions/quiz";
import { Loader2 } from "lucide-react";

interface QuizModalProps {
  lessonId: string;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizPassed: () => void;
}

interface Question {
  _id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

interface QuizData {
  _id: string;
  passingScore: number;
  questions: Question[];
}

export function QuizModal({
  lessonId,
  studentId,
  isOpen,
  onClose,
  onQuizPassed,
}: QuizModalProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  useEffect(() => {
    if (isOpen && lessonId) {
      loadQuiz();
    }
  }, [isOpen, lessonId]);

  async function loadQuiz() {
    setLoadingQuiz(true);
    try {
      const quizData = await getQuizForLesson(lessonId);
      setQuiz(quizData);
      setAnswers({});
      setShowResults(false);
      setResult(null);
    } catch (error) {
      console.error("Error loading quiz:", error);
    } finally {
      setLoadingQuiz(false);
    }
  }

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => answers[q._id] === undefined);
    if (unanswered.length > 0) {
      alert("Por favor responde todas las preguntas antes de enviar.");
      return;
    }

    setLoading(true);
    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })
      );

      const attemptResult = await submitQuizAttempt(
        lessonId,
        quiz._id,
        studentId,
        formattedAnswers
      );

      setResult(attemptResult);
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Error al enviar el cuestionario. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadQuiz();
  };

  const handleContinue = () => {
    onQuizPassed();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluación de la Lección</DialogTitle>
        </DialogHeader>

        {loadingQuiz ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !quiz ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay cuestionario disponible para esta lección.
            </p>
            <Button onClick={onClose} className="mt-4">
              Cerrar
            </Button>
          </div>
        ) : !showResults ? (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
              Responde las siguientes preguntas. Necesitas al menos {quiz.passingScore}% para aprobar.
            </p>

            {quiz.questions.map((question, index) => (
              <QuizQuestion
                key={question._id}
                questionNumber={index + 1}
                questionText={question.text}
                options={question.options}
                selectedOption={answers[question._id]}
                onSelectOption={(optionIndex) =>
                  handleAnswerChange(question._id, optionIndex)
                }
              />
            ))}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar respuestas"
              )}
            </Button>
          </div>
        ) : result ? (
          <QuizResults
            score={result.score}
            correctAnswers={result.correctAnswers}
            totalQuestions={quiz.questions.length}
            passed={result.passed}
            onRetry={handleRetry}
            onContinue={handleContinue}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
