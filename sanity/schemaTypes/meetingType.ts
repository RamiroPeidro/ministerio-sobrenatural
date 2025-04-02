import { defineField, defineType } from "sanity";

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
      name: 'isVirtual',
      title: 'Es virtual',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'zoomLink',
      title: 'Enlace de Zoom',
      type: 'url',
      hidden: ({ document }) => !document?.isVirtual
    })
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      category: 'category.name'
    },
    prepare(selection) {
      const { title, date, category } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('es-AR') : '';
      return {
        title: title,
        subtitle: `${formattedDate} - ${category || 'Sin categoría'}`
      };
    }
  }
});
