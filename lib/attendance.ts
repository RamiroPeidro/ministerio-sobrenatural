import { client } from "@/sanity/lib/client";

interface AttendanceStats {
    percentage: number;
    totalMeetings: number;
    attendedCount: number;
}

export async function getStudentAttendanceStats(
    clerkId: string
): Promise<AttendanceStats | null> {
    try {
        // 1. Get student info including category
        const student = await client.fetch(
            `*[_type == "student" && clerkId == $clerkId][0]{
        _id,
        "categoryId": category._ref
      }`,
            { clerkId }
        );

        if (!student) return null;

        // 2. Get all completed meetings for this category
        const totalMeetings = await client.fetch(
            `count(*[_type == "meeting" && category._ref == $categoryId && status == "completed"])`,
            { categoryId: student.categoryId }
        );

        // 3. Get student's attendance records (attended: true)
        const attendedCount = await client.fetch(
            `count(*[_type == "attendance" && student._ref == $studentId && attended == true])`,
            { studentId: student._id }
        );

        const percentage =
            totalMeetings > 0 ? (attendedCount / totalMeetings) * 100 : 0;

        return {
            percentage,
            totalMeetings,
            attendedCount,
        };
    } catch (error) {
        console.error("Error getting attendance stats:", error);
        return null;
    }
}
