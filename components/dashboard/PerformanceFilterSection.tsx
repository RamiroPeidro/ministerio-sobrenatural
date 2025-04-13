"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  BookOpen, 
  X,
  SearchIcon,
  ArrowUpDown,
  Filter
} from "lucide-react";

type StudentPerformance = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  categoryId: string;
  categoryName: string;
  totalMeetings: number;
  attendedCount: number;
  attendanceRate: number;
  totalLessons: number;
  completedLessons: number;
  academicProgress: number;
};

type Category = {
  _id: string;
  name: string;
  description?: string;
};

type PerformanceFilterSectionProps = {
  studentsData: StudentPerformance[];
  categories: Category[];
};

export default function PerformanceFilterSection({ 
  studentsData,
  categories 
}: PerformanceFilterSectionProps) {
  // Estados para filtros
  const [minAttendance, setMinAttendance] = useState(0);
  const [maxAttendance, setMaxAttendance] = useState(100);
  const [minProgress, setMinProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado para estudiantes filtrados
  const [filteredStudents, setFilteredStudents] = useState<StudentPerformance[]>(studentsData);
  
  // Estado para ordenamiento
  const [sortField, setSortField] = useState<string>("fullName");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    let filtered = [...studentsData];
    
    // Filtrar por rango de asistencia
    filtered = filtered.filter(
      student => student.attendanceRate >= minAttendance && 
                student.attendanceRate <= maxAttendance
    );
    
    // Filtrar por rango de progreso académico
    filtered = filtered.filter(
      student => student.academicProgress >= minProgress && 
                student.academicProgress <= maxProgress
    );
    
    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(student => student.categoryId === selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        student => 
          student.fullName?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query)
      );
    }
    
    // Ordenar resultados
    filtered = filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof StudentPerformance];
      let bValue: any = b[sortField as keyof StudentPerformance];
      
      // Manejar valores nulos
      if (aValue === null) aValue = sortField === 'fullName' ? '' : 0;
      if (bValue === null) bValue = sortField === 'fullName' ? '' : 0;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredStudents(filtered);
  }, [
    studentsData, 
    minAttendance, 
    maxAttendance, 
    minProgress, 
    maxProgress,
    selectedCategory,
    searchQuery,
    sortField,
    sortDirection
  ]);
  
  // Función para cambiar el orden
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Obtener la cantidad de estudiantes filtrados y activos
  const activeStudents = studentsData.filter(student => student.totalMeetings > 0);
  const filteredCount = filteredStudents.length;
  const totalCount = activeStudents.length;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Rendimiento</CardTitle>
          <CardDescription>
            Ajusta los filtros para encontrar estudiantes según su desempeño
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Asistencia ({minAttendance}% - {maxAttendance}%)
                </label>
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="pt-4">
                <Slider 
                  value={[minAttendance, maxAttendance]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => {
                    setMinAttendance(value[0]);
                    setMaxAttendance(value[1]);
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Progreso Académico ({minProgress}% - {maxProgress}%)
                </label>
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="pt-4">
                <Slider 
                  value={[minProgress, maxProgress]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => {
                    setMinProgress(value[0]);
                    setMaxProgress(value[1]);
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-medium">Categoría / Año</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="pt-2 relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <span>Mostrando {filteredCount} de {totalCount} estudiantes activos</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={minAttendance > 0 || maxAttendance < 100 ? "default" : "outline"}>
                Asistencia
              </Badge>
              <Badge variant={minProgress > 0 || maxProgress < 100 ? "default" : "outline"}>
                Progreso
              </Badge>
              <Badge variant={selectedCategory !== "all" ? "default" : "outline"}>
                Año
              </Badge>
              <Badge variant={searchQuery ? "default" : "outline"}>
                Búsqueda
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleSort('fullName')}
                >
                  <div className="flex items-center">
                    Estudiante
                    {sortField === 'fullName' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Año</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/30 text-right"
                  onClick={() => toggleSort('attendanceRate')}
                >
                  <div className="flex items-center justify-end">
                    Asistencia
                    {sortField === 'attendanceRate' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/30 text-right"
                  onClick={() => toggleSort('academicProgress')}
                >
                  <div className="flex items-center justify-end">
                    Progreso
                    {sortField === 'academicProgress' && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.fullName}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{student.categoryName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{Math.round(student.attendanceRate)}%</span>
                      <span className="text-sm text-muted-foreground">
                        ({student.attendedCount}/{student.totalMeetings})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{Math.round(student.academicProgress)}%</span>
                      <span className="text-sm text-muted-foreground">
                        ({student.completedLessons}/{student.totalLessons})
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No se encontraron estudiantes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Función auxiliar para obtener colores según porcentaje
function getColorForRate(rate: number): string {
  if (rate >= 75) return 'text-green-600 dark:text-green-400';
  if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}
