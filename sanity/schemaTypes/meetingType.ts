import { defineField, defineType } from "sanity";
import { ConditionalPropertyCallbackContext } from "sanity";

export const meetingType = defineType({
  name: 'meeting',
  title: 'Reuniones',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'date',
      title: 'Fecha y hora',
      type: 'datetime',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'duration',
      title: 'Duración (horas)',
      type: 'number',
      initialValue: 2,
      validation: (rule) => rule.required().min(0.5).max(8)
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text'
    }),
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Programada', value: 'scheduled' },
          { title: 'En curso', value: 'in-progress' },
          { title: 'Finalizada', value: 'completed' },
          { title: 'Cancelada', value: 'cancelled' }
        ]
      },
      initialValue: 'scheduled'
    }),
    defineField({
      name: 'isVirtual',
      title: 'Es virtual',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'zoomLink',
      title: 'Enlace de Zoom',
      type: 'url',
      hidden: ({ document }: ConditionalPropertyCallbackContext) => !document?.isVirtual as boolean
    }),
    defineField({
      name: 'zoomPassword',
      title: 'Contraseña de Zoom',
      type: 'string',
      hidden: ({ document }: ConditionalPropertyCallbackContext) => !document?.isVirtual as boolean
    }),
    defineField({
      name: 'location',
      title: 'Ubicación (para reuniones presenciales)',
      type: 'string',
      hidden: ({ document }: ConditionalPropertyCallbackContext) => Boolean(document?.isVirtual)
    }),
    defineField({
      name: 'useCustomZoomLink',
      title: 'Usar enlace de Zoom personalizado',
      description: 'Si está desactivado, se utilizará el enlace de Zoom de la categoría',
      type: 'boolean',
      initialValue: false,
      hidden: ({ document }: ConditionalPropertyCallbackContext) => !document?.isVirtual as boolean
    })
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      category: 'category.name',
      status: 'status',
      isVirtual: 'isVirtual'
    },
    prepare(selection) {
      const { title, date, category, status, isVirtual } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
      
      const statusLabels: Record<string, string> = {
        'scheduled': '📅 Programada',
        'in-progress': '▶️ En curso',
        'completed': '✅ Finalizada',
        'cancelled': '❌ Cancelada'
      };
      
      const statusLabel = status && typeof status === 'string' ? statusLabels[status] || '' : '';
      const typeLabel = isVirtual ? '🖥️ Virtual' : '🏢 Presencial';
      
      return {
        title: `${title}`,
        subtitle: `${formattedDate} - ${category || 'Sin categoría'} - ${statusLabel} - ${typeLabel}`
      };
    }
  }
});
