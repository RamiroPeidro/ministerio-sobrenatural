import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Icon identifier (e.g., for using with icon libraries)",
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
      description: "Color code for the category (e.g., #FF0000)",
    }),
    defineField({
      name: "zoomLink",
      title: "Zoom Link",
      type: "url",
      description: "Zoom meeting link for this category",
    }),
    defineField({
      name: "zoomPassword",
      title: "Zoom Password",
      type: "string",
      description: "Password for the Zoom meeting (if needed)",
    }),
    defineField({
      name: "nextMeetingDate",
      title: "Next Meeting Date",
      type: "datetime",
      description: "Fecha y hora de la próxima reunión de Zoom (el botón solo se mostrará este día)",
    }),
    defineField({
      name: "meetingDuration",
      title: "Meeting Duration (hours)",
      type: "number",
      description: "Duración de la reunión en horas (por defecto 2 horas)",
      initialValue: 2,
    }),
    defineField({
      name: "isPresential",
      title: "Es Presencial",
      type: "boolean",
      description: "Marcar si la próxima clase será presencial en lugar de virtual",
      initialValue: false,
    }),
  ],
});
