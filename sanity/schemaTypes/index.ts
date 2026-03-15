import { type SchemaTypeDefinition } from "sanity";
import { courseType } from "./courseType";
import { moduleType } from "./moduleType";
import { lessonType } from "./lessonType";
import { instructorType } from "./instructorType";
import { blockContent } from "./blockContent";
import { studentType } from "./studentType";
import { enrollmentType } from "./enrollmentType";
import { categoryType } from "./categoryType";
import { lessonCompletionType } from "./lessonCompletionType";
import { attendanceType } from "./attendanceType";
import { meetingType } from "./meetingType";
import { quizType } from "./quizType";
import { questionType } from "./questionType";
import { quizAttemptType } from "./quizAttemptType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    courseType,
    moduleType,
    lessonType,
    instructorType,
    blockContent,
    studentType,
    enrollmentType,
    categoryType,
    lessonCompletionType,
    attendanceType,
    meetingType,
    quizType,
    questionType,
    quizAttemptType,
  ],
};

export * from "./courseType";
export * from "./moduleType";
export * from "./lessonType";
export * from "./instructorType";
export * from "./blockContent";
export * from "./studentType";
export * from "./enrollmentType";
export * from "./categoryType";
export * from "./lessonCompletionType";
export * from "./attendanceType";
export * from "./meetingType";
export * from "./quizType";
export * from "./questionType";
export * from "./quizAttemptType";
