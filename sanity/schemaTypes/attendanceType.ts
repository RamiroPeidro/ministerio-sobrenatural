import { defineField, defineType } from "sanity";

export const attendanceType = defineType({
  name: "attendance",
  title: "Attendance",
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
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "meeting",
      title: "Reunión",
      type: "reference",
      to: [{ type: "meeting" }],
      description: "Referencia a la reunión a la que asistió el estudiante",
    }),
    defineField({
      name: "meetingId",
      title: "Meeting ID",
      type: "string",
      description: "Zoom meeting ID o identificador único (para compatibilidad)",
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "attended",
      title: "Attended",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "ip",
      title: "IP Address",
      type: "string",
      description: "IP address of the student when registered (for verification)",
    }),
    defineField({
      name: "userAgent",
      title: "User Agent",
      type: "string",
      description: "Browser information",
    }),
  ],
  preview: {
    select: {
      studentName: "student.firstName",
      studentEmail: "student.email",
      studentUsername: "student.username",
      studentFullName: "student.fullName",
      date: "date",
      meetingTitle: "meeting.title",
    },
    prepare({ studentName, studentEmail, studentUsername, studentFullName, date, meetingTitle }) {
      // Intentar usar el nombre del estudiante en el siguiente orden: fullName, name, username, email
      const title = studentFullName || studentName || studentUsername || studentEmail || "Estudiante";
      const meetingInfo = meetingTitle ? ` - ${meetingTitle}` : '';
      return {
        title,
        subtitle: `Asistió el ${new Date(date).toLocaleString()}${meetingInfo}`,
      };
    },
  },
});
