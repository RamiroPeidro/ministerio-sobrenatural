import { definePlugin } from 'sanity';

export const meetingsDashboard = definePlugin(() => {
  return {
    name: 'meetings-dashboard',
    studio: {
      components: {
        // Componentes personalizados si son necesarios
      },
      tools: [
        {
          name: 'meetingsManager',
          title: 'Gestor de Clases',
          component: async () => {
            // Importación dinámica para evitar errores de compilación
            const { default: MeetingsManager } = await import('./MeetingsManagerComponent');
            return MeetingsManager();
          },
        },
      ],
    },
  };
});

export default meetingsDashboard;
