import { definePlugin } from 'sanity';
import { AttendanceExport } from './components/AttendanceExport';
import { DownloadIcon } from '@sanity/icons';

/**
 * Plugin para exportar registros de asistencia en formato CSV desde Sanity Studio
 */
export const attendanceExport = definePlugin({
  name: 'attendance-export',
  tools: [
    {
      name: 'attendance-export',
      title: 'Exportar Asistencia',
      icon: DownloadIcon,
      component: AttendanceExport,
    },
  ],
});
