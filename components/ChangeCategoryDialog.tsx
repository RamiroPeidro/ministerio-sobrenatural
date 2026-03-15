"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateStudentCategory } from "@/actions/student";
import { toast } from "sonner";
import { Layers } from "lucide-react";

interface Category {
    _id: string;
    name: string;
}

interface ChangeCategoryDialogProps {
    studentId: string;
    studentName: string;
    currentCategoryId: string | null;
    categories: Category[];
}

export function ChangeCategoryDialog({
    studentId,
    studentName,
    currentCategoryId,
    categories,
}: ChangeCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(currentCategoryId || "");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!selectedCategory) return;

        // Prevent updating to the same category
        if (selectedCategory === currentCategoryId) {
            toast.info("El estudiante ya pertenece a esta categoría.");
            return;
        }

        setLoading(true);
        try {
            const result = await updateStudentCategory(studentId, selectedCategory);
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Layers className="h-4 w-4" />
                    <span className="sr-only">Cambiar Categoría</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Categoría / Año</DialogTitle>
                    <DialogDescription>
                        Esto moverá a <strong>{studentName}</strong> a otro año y l@ inscribirá automáticamente en todos los cursos correspondientes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpdate} disabled={loading || !selectedCategory}>
                        {loading ? "Actualizando..." : "Confirmar Cambio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
