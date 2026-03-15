import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface AttendanceWidgetProps {
    percentage: number;
    attendedCount: number;
    totalMeetings: number;
}

export function AttendanceWidget({
    percentage,
    attendedCount,
    totalMeetings,
}: AttendanceWidgetProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Mi Asistencia
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                        {percentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {attendedCount} de {totalMeetings} asistencias
                    </p>
                </div>
                <Link href="/asistencia" className="block">
                    <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                    >
                        Ver detalle
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
