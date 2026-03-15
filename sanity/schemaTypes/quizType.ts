import { defineField, defineType } from "sanity";

export const quizType = defineType({
  name: "quiz",
  title: "Quiz",
  type: "document",
  fields: [
    defineField({
      name: "lesson",
      title: "Lesson",
      type: "reference",
      to: [{ type: "lesson" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      of: [{ type: "reference", to: { type: "question" } }],
      validation: (rule) =>
        rule
          .required()
          .min(5)
          .custom((questions) => {
            if (!questions) return true;
            if (questions.length < 20) {
              return "Quiz should have at least 20 questions for proper randomization (5 will be shown per attempt)";
            }
            return true;
          }),
    }),
    defineField({
      name: "passingScore",
      title: "Passing Score (%)",
      type: "number",
      initialValue: 80,
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      description: "Only active quizzes will be shown to students",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      lessonTitle: "lesson.title",
      questionCount: "questions.length",
      isActive: "isActive",
    },
    prepare(selection) {
      const { lessonTitle, questionCount, isActive } = selection;
      return {
        title: lessonTitle || "Untitled Quiz",
        subtitle: `${questionCount || 0} questions ${isActive ? "(Active)" : "(Inactive)"}`,
      };
    },
  },
});
