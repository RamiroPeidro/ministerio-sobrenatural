import { defineField, defineType } from "sanity";

export const questionType = defineType({
  name: "question",
  title: "Question",
  type: "document",
  fields: [
    defineField({
      name: "text",
      title: "Question Text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "text",
              title: "Option Text",
              type: "string",
              validation: (rule) => rule.required(),
            },
            {
              name: "isCorrect",
              title: "Is Correct Answer",
              type: "boolean",
              initialValue: false,
            },
            {
              name: "explanation",
              title: "Explanation",
              type: "text",
              description: "Explain why this option is correct or incorrect",
            },
          ],
        },
      ],
      validation: (rule) =>
        rule.required().min(2).max(6).custom((options) => {
          if (!options) return true;
          const correctCount = options.filter(
            (opt: any) => opt.isCorrect
          ).length;
          if (correctCount === 0) {
            return "At least one option must be marked as correct";
          }
          if (correctCount > 1) {
            return "Only one option should be marked as correct";
          }
          return true;
        }),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Order of the question in the quiz",
    }),
  ],
});
