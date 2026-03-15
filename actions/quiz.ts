"use server";

import { client } from "@/sanity/lib/client";
import { adminClient } from "@/sanity/lib/adminClient";
import { completeLessonAction } from "@/app/actions/completeLessonAction";

interface Answer {
  questionId: string;
  selectedOption: number;
}

export async function getQuizForLesson(lessonId: string) {
  const quiz = await client.fetch(
    `*[_type == "quiz" && lesson._ref == $lessonId && isActive == true][0]{
      _id,
      passingScore,
      questions[]->{
        _id,
        text,
        options,
        order
      }
    }`,
    { lessonId }
  );

  if (!quiz) {
    throw new Error("No quiz found for this lesson");
  }

  // Randomizar 5 de las preguntas disponibles
  const shuffledQuestions = quiz.questions
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(5, quiz.questions.length));

  return { ...quiz, questions: shuffledQuestions };
}

export async function submitQuizAttempt(
  lessonId: string,
  quizId: string,
  studentId: string,
  answers: Answer[]
) {
  // 1. Obtener preguntas para validar respuestas
  const questionIds = answers.map((a) => a.questionId);
  const questions = await client.fetch(
    `*[_type == "question" && _id in $questionIds]{
      _id,
      options
    }`,
    { questionIds }
  );

  // 2. Calcular puntaje
  let correctCount = 0;
  const validatedAnswers = answers.map((answer) => {
    const question = questions.find((q) => q._id === answer.questionId);
    if (!question) {
      throw new Error(`Question ${answer.questionId} not found`);
    }

    const isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
    if (isCorrect) correctCount++;

    return {
      ...answer,
      isCorrect,
    };
  });

  const totalQuestions = answers.length;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= 80;

  // 3. Obtener número de intento
  const attemptCount = await client.fetch(
    `count(*[_type == "quizAttempt" && student._ref == $studentId && quiz._ref == $quizId])`,
    { studentId, quizId }
  );

  // 4. Guardar intento
  await adminClient.create({
    _type: "quizAttempt",
    student: { _type: "reference", _ref: studentId },
    quiz: { _type: "reference", _ref: quizId },
    lesson: { _type: "reference", _ref: lessonId },
    attemptNumber: attemptCount + 1,
    score,
    totalQuestions,
    correctAnswers: correctCount,
    answers: validatedAnswers,
    passed,
    completedAt: new Date().toISOString(),
  });

  // 5. Si aprobó, marcar lección como completada
  if (passed) {
    await completeLessonAction(lessonId, studentId);
  }

  return {
    score,
    passed,
    correctAnswers: correctCount,
  };
}

export async function getQuizAttempts(lessonId: string, studentId: string) {
  return await client.fetch(
    `*[_type == "quizAttempt" && lesson._ref == $lessonId && student._ref == $studentId]
    | order(completedAt desc)
    {
      _id,
      attemptNumber,
      score,
      correctAnswers,
      totalQuestions,
      passed,
      completedAt
    }`,
    { lessonId, studentId }
  );
}
