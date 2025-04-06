import React, { useState, useEffect } from 'react';
import { Card, Box, Button, Flex, Stack, Text, Select, Label, Spinner, Radio } from '@sanity/ui';
import { DownloadIcon } from '@sanity/icons';
import { useClient } from 'sanity';

// Función para convertir datos a CSV
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  // Obtener encabezados actualizados con información de reuniones
  const headers = ['Nombre', 'Email', 'Categoría', 'Reunión', 'Tipo', 'Fecha', 'Asistió'];
  
  // Crear filas
  const rows = data.map(item => {
    // Formatear fecha sin comas para evitar problemas con el CSV
    const fecha = new Date(item.date);
    const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()} ${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
    
    return [
      item.studentFullName || item.studentFirstName || 'No disponible',
      item.studentEmail || 'No disponible',
      item.categoryName || 'No disponible',
      item.meetingTitle || 'No específica',
      item.meetingType || 'No específico',
      fechaFormateada,
      item.attended ? 'Sí' : 'No'
    ];
  });
  
  // Unir encabezados y filas
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// Función para descargar el CSV
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AttendanceExport = () => {
  const client = useClient({ apiVersion: '2023-05-03' });
  const [categories, setCategories] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'date' | 'meeting'>('date');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingMeetings, setIsFetchingMeetings] = useState<boolean>(false);
  
  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await client.fetch(`
          *[_type == "category"] {
            _id,
            name
          } | order(name asc)
        `);
        setCategories(result);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    
    fetchCategories();
  }, [client]);
  
  // Establecer fechas predeterminadas (último mes)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);
  
  // Cargar reuniones cuando cambia la categoría seleccionada
  useEffect(() => {
    const fetchMeetings = async () => {
      if (selectedCategory === 'all') {
        setMeetings([]);
        return;
      }
      
      setIsFetchingMeetings(true);
      try {
        const result = await client.fetch(`
          *[_type == "meeting" && category._ref == $categoryId] {
            _id,
            title,
            date,
            isVirtual,
            status
          } | order(date desc)
        `, { categoryId: selectedCategory });
        
        setMeetings(result);
      } catch (error) {
        console.error('Error al cargar reuniones:', error);
      } finally {
        setIsFetchingMeetings(false);
      }
    };
    
    fetchMeetings();
  }, [selectedCategory, client]);
  
  const handleExport = async () => {
    setIsLoading(true);
    try {
      let query = '';
      const params: Record<string, any> = {};
      
      if (filterMode === 'date') {
        // Consulta filtrando por fechas
        query = `
          *[_type == "attendance" && date >= $startDate && date <= $endDate
        `;
        
        // Añadir filtro de categoría si no es "todos"
        if (selectedCategory !== 'all') {
          query += ` && category._ref == $categoryId`;
        }
        
        query += `] {
          _id,
          date,
          attended,
          "studentFirstName": student->firstName,
          "studentFullName": student->fullName,
          "studentEmail": student->email,
          "categoryName": category->name,
          "meetingTitle": meeting->title,
          "meetingType": meeting->isVirtual ? "Virtual" : "Presencial",
          "meetingStatus": meeting->status
        } | order(date desc)`;
        
        // Configurar parámetros
        params.startDate = startDate ? new Date(startDate).toISOString() : new Date(0).toISOString();
        params.endDate = endDate ? new Date(endDate + 'T23:59:59').toISOString() : new Date().toISOString();
        
        if (selectedCategory !== 'all') {
          params.categoryId = selectedCategory;
        }
      } else {
        // Consulta filtrando por reunión específica
        query = `
          *[_type == "attendance"
        `;
        
        if (selectedMeeting !== 'all') {
          query += ` && meeting._ref == $meetingId`;
        } else if (selectedCategory !== 'all') {
          query += ` && category._ref == $categoryId`;
        }
        
        query += `] {
          _id,
          date,
          attended,
          "studentFirstName": student->firstName,
          "studentFullName": student->fullName,
          "studentEmail": student->email,
          "categoryName": category->name,
          "meetingTitle": meeting->title,
          "meetingType": meeting->isVirtual ? "Virtual" : "Presencial",
          "meetingStatus": meeting->status
        } | order(date desc)`;
        
        if (selectedMeeting !== 'all') {
          params.meetingId = selectedMeeting;
        } else if (selectedCategory !== 'all') {
          params.categoryId = selectedCategory;
        }
      }
      
      // Ejecutar consulta
      const attendanceData = await client.fetch(query, params);
      
      // Verificar si hay datos
      if (attendanceData.length === 0) {
        alert('No hay registros de asistencia para los filtros seleccionados');
        setIsLoading(false);
        return;
      }
      
      // Convertir a CSV y descargar
      const csvContent = convertToCSV(attendanceData);
      
      let filename = 'asistencia';
      
      if (filterMode === 'date') {
        const categoryName = selectedCategory === 'all' 
          ? 'todas-las-categorias' 
          : categories.find(c => c._id === selectedCategory)?.name.toLowerCase().replace(/\s+/g, '-') || 'categoria';
        
        filename = `asistencia-${categoryName}-${startDate}-a-${endDate}.csv`;
      } else {
        const meetingName = selectedMeeting === 'all'
          ? 'todas-las-reuniones'
          : meetings.find(m => m._id === selectedMeeting)?.title.toLowerCase().replace(/\s+/g, '-') || 'reunion';
        
        const categoryName = selectedCategory === 'all'
          ? ''
          : `-${categories.find(c => c._id === selectedCategory)?.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        filename = `asistencia-reunion-${meetingName}${categoryName}.csv`;
      }
      
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error al exportar asistencia:', error);
      alert('Error al exportar registros de asistencia');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={2} weight="semibold">Exportar Registros de Asistencia</Text>
        
        <Box>
          <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>Modo de Filtro</Text>
          <Flex gap={3}>
            <Radio
              id="filter-by-date"
              name="filter-mode"
              checked={filterMode === 'date'}
              onChange={() => setFilterMode('date')}
            />
            <Label htmlFor="filter-by-date" style={{ marginRight: '16px' }}>Por Fechas</Label>
            
            <Radio
              id="filter-by-meeting"
              name="filter-mode"
              checked={filterMode === 'meeting'}
              onChange={() => setFilterMode('meeting')}
            />
            <Label htmlFor="filter-by-meeting">Por Reunión</Label>
          </Flex>
        </Box>
        
        <Box>
          <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>Categoría</Text>
          <Select 
            value={selectedCategory} 
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedCategory(event.currentTarget.value);
              setSelectedMeeting('all'); // Resetear reunión seleccionada al cambiar de categoría
            }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Box>
        
        {filterMode === 'meeting' && (
          <Box>
            <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>
              Reunión
              {isFetchingMeetings && (
                <Spinner style={{ marginLeft: '8px' }} />
              )}
            </Text>
            <Select 
              value={selectedMeeting} 
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedMeeting(event.currentTarget.value)}
              disabled={isFetchingMeetings || selectedCategory === 'all'}
            >
              <option value="all">Todas las reuniones</option>
              {meetings.map(meeting => {
                const date = new Date(meeting.date);
                const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <option key={meeting._id} value={meeting._id}>
                    {meeting.title} ({dateFormatted})
                  </option>
                );
              })}
            </Select>
            {selectedCategory === 'all' && (
              <Text size={0} style={{ marginTop: '4px', color: 'orange' }}>
                Selecciona una categoría para ver las reuniones disponibles
              </Text>
            )}
          </Box>
        )}
        
        {filterMode === 'date' && (
          <Flex gap={2}>
            <Box flex={1}>
              <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>Fecha Inicio</Text>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px'
                }}
              />
            </Box>
            <Box flex={1}>
              <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>Fecha Fin</Text>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px'
                }}
              />
            </Box>
          </Flex>
        )}
        
        <Button
          icon={DownloadIcon}
          text={isLoading ? 'Exportando...' : 'Exportar a CSV'}
          tone="primary"
          onClick={handleExport}
          disabled={isLoading}
          style={{ marginTop: '8px' }}
        />
      </Stack>
    </Card>
  );
};
