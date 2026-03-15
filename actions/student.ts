"use server";

import { adminClient } from "@/sanity/lib/adminClient";
import { revalidatePath } from "next/cache";

/**
 * Updates a student's category and automatically enrolls them in all courses
 * associated with the new category.
 */
export async function updateStudentCategory(studentId: string, newCategoryId: string) {
    try {
        // 0. Get old category to unenroll from old courses
        const student = await adminClient.fetch(
            `*[_type == "student" && _id == $studentId][0]{ "oldCategoryId": category._ref }`,
            { studentId }
        );

        // 1. Delete old enrollments
        if (student?.oldCategoryId) {
            const oldCourses = await adminClient.fetch(
                `*[_type == "course" && category._ref == $oldCategoryId]{_id}`,
                { oldCategoryId: student.oldCategoryId }
            );

            const enrollmentsToDelete = await adminClient.fetch(
                `*[_type == "enrollment" && student._ref == $studentId && course._ref in $courseIds]._id`,
                { studentId, courseIds: oldCourses.map((c: any) => c._id) }
            );

            for (const enrollmentId of enrollmentsToDelete) {
                await adminClient.delete(enrollmentId);
            }
        }

        // 2. Update the student's category in Sanity
        await adminClient
            .patch(studentId)
            .set({ category: { _type: "reference", _ref: newCategoryId } })
            .commit();

        // 3. Fetch all courses associated with the new category
        const courses = await adminClient.fetch(
            `*[_type == "course" && category._ref == $categoryId]{_id}`,
            { categoryId: newCategoryId }
        );

        // 3. For each course, check if enrollment exists, if not create it
        const enrollments = [];
        for (const course of courses) {
            // Check if already enrolled to avoid duplicates
            const existingEnrollment = await adminClient.fetch(
                `count(*[_type == "enrollment" && student._ref == $studentId && course._ref == $courseId])`,
                { studentId, courseId: course._id }
            );

            if (existingEnrollment === 0) {
                enrollments.push({
                    _type: "enrollment",
                    student: { _type: "reference", _ref: studentId },
                    course: { _type: "reference", _ref: course._id },
                    enrolledAt: new Date().toISOString(),
                });
            }
        }

        // Batch create enrollments if any needed
        if (enrollments.length > 0) {
            const transaction = adminClient.transaction();
            enrollments.forEach((enrollment) => transaction.create(enrollment));
            await transaction.commit();
        }

        revalidatePath("/admin/students");
        return { success: true, message: `Categoría actualizada y estudiante inscrito en ${enrollments.length} nuevos cursos.` };
    } catch (error) {
        console.error("Error updating student category:", error);
        return { success: false, message: "Error al actualizar la categoría." };
    }
}
