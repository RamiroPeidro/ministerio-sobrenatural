import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { adminClient } from "@/sanity/lib/adminClient";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const lessonId = formData.get("lessonId") as string;

  if (!file || !lessonId) {
    return NextResponse.json({ error: "File and lessonId required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  const questions = parseQuizText(result.value);

  if (questions.length === 0) {
    return NextResponse.json({ error: "No questions found" }, { status: 400 });
  }

  try {
    const questionRefs = [];
    for (const q of questions) {
      const questionDoc = await adminClient.create({
        _type: "question",
        text: q.text,
        options: q.options,
        order: q.order,
      });
      questionRefs.push({ _type: "reference", _ref: questionDoc._id });
    }

    const existingQuiz = await adminClient.fetch(
      `*[_type == "quiz" && lesson._ref == $lessonId][0]._id`,
      { lessonId }
    );

    if (existingQuiz) {
      await adminClient.patch(existingQuiz).set({ questions: questionRefs }).commit();
    } else {
      await adminClient.create({
        _type: "quiz",
        lesson: { _type: "reference", _ref: lessonId },
        questions: questionRefs,
        passingScore: 80,
        isActive: true,
      });
    }

    return NextResponse.json({ success: true, questionsCreated: questions.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

function parseQuizText(text: string) {
  const lines = text.split("\n").filter(line => line.trim());
  const questions = [];
  let currentQuestion: any = null;
  let questionCounter = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const questionMatch = trimmed.match(/^(\d+)\.\s*(.+)/);

    if (questionMatch) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      questionCounter++;
      currentQuestion = { text: questionMatch[2], options: [], order: questionCounter };
      continue;
    }

    const optionMatch = trimmed.match(/^([a-d])\)\s*(.+?)\s*-\s*(.+)/);
    if (optionMatch && currentQuestion) {
      const isCorrect = optionMatch[3].toLowerCase().startsWith("sí,") ||
                       optionMatch[3].toLowerCase().startsWith("si,");
      currentQuestion.options.push({
        text: optionMatch[2],
        isCorrect,
        explanation: optionMatch[3],
      });
    }
  }

  if (currentQuestion && currentQuestion.options.length === 4) {
    questions.push(currentQuestion);
  }

  return questions;
}
