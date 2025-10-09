"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileText,
  Users,
  BookOpen,
  BarChart3,
  Loader2
} from 'lucide-react';
import {
  exportAllAttendanceHistory,
  exportAllAcademicProgress,
  exportConsolidatedStudentReport,
  exportAttendanceByDateRange
} from '@/lib/historicalExport';

export type ExportType =
  | 'attendance-history'
  | 'academic-progress'
  | 'consolidated-report'
  | 'attendance-range';

interface HistoricalExportButtonProps {
  type: ExportType;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  children?: React.ReactNode;
}

const exportConfigs = {
  'attendance-history': {
    label: 'Exportar Asistencias Históricas',
    description: 'Todos los registros de asistencia del sistema',
    icon: Users,
    action: exportAllAttendanceHistory
  },
  'academic-progress': {
    label: 'Exportar Progreso Académico',
    description: 'Todas las lecciones completadas por estudiantes',
    icon: BookOpen,
    action: exportAllAcademicProgress
  },
  'consolidated-report': {
    label: 'Exportar Reporte Consolidado',
    description: 'Vista integral del rendimiento de cada estudiante',
    icon: BarChart3,
    action: exportConsolidatedStudentReport
  },
  'attendance-range': {
    label: 'Exportar por Fechas',
    description: 'Asistencias en rango de fechas específico',
    icon: FileText,
    action: exportAttendanceByDateRange
  }
};

export const HistoricalExportButton: React.FC<HistoricalExportButtonProps> = ({
  type,
  variant = 'default',
  size = 'default',
  className = '',
  startDate,
  endDate,
  categoryId,
  children
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const config = exportConfigs[type];
  const Icon = config.icon;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setTotal(0);

      const onProgress = (current: number, totalRecords: number) => {
        setProgress(current);
        setTotal(totalRecords);
      };

      if (type === 'attendance-range') {
        if (!startDate || !endDate) {
          alert('Por favor, selecciona un rango de fechas válido');
          return;
        }
        await exportAttendanceByDateRange(startDate, endDate, categoryId, onProgress);
      } else {
        await config.action(onProgress);
      }

      // Mostrar mensaje de éxito
      alert('¡Exportación completada exitosamente!');

    } catch (error) {
      console.error('Error durante la exportación:', error);
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
      setProgress(0);
      setTotal(0);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {isExporting ? 'Exportando...' : (children || config.label)}
        {!isExporting && <Download className="ml-2 h-4 w-4" />}
      </Button>

      {isExporting && total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Procesando registros...</span>
            <span>{progress.toLocaleString()} / {total.toLocaleString()}</span>
          </div>
          <Progress
            value={total > 0 ? (progress / total) * 100 : 0}
            className="h-2"
          />
        </div>
      )}

      {!children && (
        <p className="text-xs text-muted-foreground">
          {config.description}
        </p>
      )}
    </div>
  );
};

// Componente específico para exportación con filtros de fecha
interface DateRangeExportProps {
  startDate: string;
  endDate: string;
  categoryId?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  categories?: Array<{ _id: string; name: string }>;
  className?: string;
}

export const DateRangeExport: React.FC<DateRangeExportProps> = ({
  startDate,
  endDate,
  categoryId = 'all',
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  categories = [],
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Fecha Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Fecha Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
        </div>
      </div>

      {categories.length > 0 && onCategoryChange && (
        <div>
          <label className="text-sm font-medium mb-1 block">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <HistoricalExportButton
        type="attendance-range"
        startDate={startDate}
        endDate={endDate}
        categoryId={categoryId}
        variant="outline"
      />
    </div>
  );
};