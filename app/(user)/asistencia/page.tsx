import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/lib/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";

// Helper for date formatting
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

async function getStudentAttendance(clerkId: string) {
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
    // We only count meetings that represent "classes" or "events" relevant for attendance percentage
    const totalMeetings = await client.fetch(
        `count(*[_type == "meeting" && category._ref == $categoryId && status == "completed"])`,
        { categoryId: student.categoryId }
    );

    // 3. Get student's attendance records
    // We explicitly look for "attended: true" to count presence
    // We fetch details for the list
    const attendanceRecords = await client.fetch(
        `*[_type == "attendance" && student._ref == $studentId] | order(date desc) {
      _id,
      date,
      attended,
      "meetingTitle": meeting->title,
      "meetingDate": meeting->date
    }`,
        { studentId: student._id }
    );

    const attendedCount = attendanceRecords.filter((r: any) => r.attended).length;

    return {
        percentage: totalMeetings > 0 ? (attendedCount / totalMeetings) * 100 : 0,
        history: attendanceRecords,
        totalMeetings,
        attendedCount,
    };
}

export default async function AttendancePage() {
    const user = await currentUser();

    if (!user?.id) {
        return redirect("/auth/sign-in");
    }

    const data = await getStudentAttendance(user.id);

    if (!data) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No se encontró información del estudiante</CardTitle>
                        <CardDescription>Contacta a administración si crees que esto es un error.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Asistencia</h1>
                    <p className="text-muted-foreground">Tu historial de participación en clases y eventos.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Porcentaje de Asistencia</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.percentage.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {data.attendedCount} asistencias de {data.totalMeetings} eventos totales
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial Detallado</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Evento / Clase</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                        No hay registros de asistencia aún.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.history.map((record: any) => (
                                    <TableRow key={record._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                {formatDate(record.date || record.meetingDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.meetingTitle || "Reunión sin título"}</TableCell>
                                        <TableCell>
                                            {record.attended ? (
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                    Presente
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Ausente</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
