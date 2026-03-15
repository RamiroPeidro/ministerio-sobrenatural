import { defineField, defineType } from "sanity";

export const quizAttemptType = defineType({
  name: "quizAttempt",
  title: "Quiz Attempt",
  type: "document",
  fields: [
    defineField({
      name: "student",
      title: "Student",
      type: "reference",
      to: [{ type: "student" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "quiz",
      title: "Quiz",
      type: "reference",
      to: [{ type: "quiz" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lesson",
      title: "Lesson",
      type: "reference",
      to: [{ type: "lesson" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "attemptNumber",
      title: "Attempt Number",
      type: "number",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "score",
      title: "Score (%)",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "totalQuestions",
      title: "Total Questions",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "correctAnswers",
      title: "Correct Answers",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "answers",
      title: "Answers",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "questionId",
              title: "Question ID",
              type: "string",
            },
            {
              name: "selectedOption",
              title: "Selected Option Index",
              type: "number",
            },
            {
              name: "isCorrect",
              title: "Is Correct",
              type: "boolean",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "passed",
      title: "Passed",
      type: "boolean",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "completedAt",
      title: "Completed At",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      studentName: "student.fullName",
      lessonTitle: "lesson.title",
      score: "score",
      passed: "passed",
      attemptNumber: "attemptNumber",
    },
    prepare(selection) {
      const { studentName, lessonTitle, score, passed, attemptNumber } = selection;
      return {
        title: `${studentName} - Attempt #${attemptNumber}`,
        subtitle: `${lessonTitle} | ${score}% ${passed ? "✓ Passed" : "✗ Failed"}`,
      };
    },
  },
});
