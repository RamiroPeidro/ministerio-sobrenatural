import { adminClient } from "../adminClient";

interface CreateEnrollmentParams {
  studentId: string;
  courseId: string;
}

export async function createEnrollment({
  studentId,
  courseId,
}: CreateEnrollmentParams) {
  return adminClient.create({
    _type: "enrollment",
    student: {
      _type: "reference",
      _ref: studentId,
    },
    course: {
      _type: "reference",
      _ref: courseId,
    },
    enrolledAt: new Date().toISOString(),
  });
}
