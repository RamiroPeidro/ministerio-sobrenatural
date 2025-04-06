import React from 'react';
import { Stack, Card, Text, Button, Box, Flex } from '@sanity/ui';
import { useClient } from 'sanity';

function MeetingsManagerComponent() {
  const client = useClient({ apiVersion: '2023-03-01' });
  const [upcomingMeetings, setUpcomingMeetings] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    totalAttendance: 0,
    totalMeetings: 0,
    completedMeetings: 0
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Obtener próximas reuniones
        const meetings = await client.fetch(`
          *[_type == "meeting" && date >= now()] | order(date asc) {
            _id,
            title,
            date,
            status,
            isVirtual,
            "category": category->name
          }[0...5]
        `);
        
        // Obtener estadísticas
        const totalAttendance = await client.fetch(`count(*[_type == "attendance" && attended == true])`);
        const totalMeetings = await client.fetch(`count(*[_type == "meeting"])`);
        const completedMeetings = await client.fetch(`count(*[_type == "meeting" && status == "completed"])`);
        
        setUpcomingMeetings(meetings);
        setStats({
          totalAttendance,
          totalMeetings,
          completedMeetings
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [client]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Text size={3} weight="bold">
              Estadísticas de Asistencia
            </Text>
            <Flex gap={4}>
              <Card padding={3} radius={2} tone="positive" style={{ flex: 1 }}>
                <Stack space={2}>
                  <Text size={1} muted>Total de Asistencias</Text>
                  <Text size={4} weight="bold">{stats.totalAttendance}</Text>
                </Stack>
              </Card>
              <Card padding={3} radius={2} tone="primary" style={{ flex: 1 }}>
                <Stack space={2}>
                  <Text size={1} muted>Total de Clases</Text>
                  <Text size={4} weight="bold">{stats.totalMeetings}</Text>
                </Stack>
              </Card>
              <Card padding={3} radius={2} tone="default" style={{ flex: 1 }}>
                <Stack space={2}>
                  <Text size={1} muted>Clases Completadas</Text>
                  <Text size={4} weight="bold">{stats.completedMeetings}</Text>
                </Stack>
              </Card>
            </Flex>
          </Stack>
        </Card>

        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Text size={3} weight="bold">
              Próximas Clases
            </Text>
            {isLoading ? (
              <Text>Cargando...</Text>
            ) : upcomingMeetings.length > 0 ? (
              <Stack space={3}>
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting._id} padding={3} radius={2} border>
                    <Stack space={2}>
                      <Text size={2} weight="semibold">{meeting.title}</Text>
                      <Text size={1} muted>{meeting.category || 'Sin categoría'}</Text>
                      <Flex gap={2} align="center">
                        <Text size={1}>Fecha: {formatDate(meeting.date)}</Text>
                        <Text size={1}>•</Text>
                        <Text size={1}>Tipo: {meeting.isVirtual ? 'Virtual' : 'Presencial'}</Text>
                      </Flex>
                      <Flex gap={2} marginTop={3}>
                        <Button 
                          text="Ver Detalles" 
                          tone="primary"
                          mode="ghost"
                          onClick={() => {
                            window.location.href = `/desk/meeting;${meeting._id}`;
                          }}
                        />
                      </Flex>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text>No hay clases programadas próximamente</Text>
            )}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

export default MeetingsManagerComponent;
