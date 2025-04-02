import React, { useState, useEffect } from 'react';
import { Card, Box, Button, Flex, Stack, Text, Select } from '@sanity/ui';
import { DownloadIcon } from '@sanity/icons';
import { useClient } from 'sanity';

// Función para convertir datos a CSV
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  // Obtener encabezados
  const headers = ['Nombre', 'Email', 'Categoría', 'Fecha', 'Asistió'];
  
  // Crear filas
  const rows = data.map(item => [
    item.studentName || 'No disponible',
    item.studentEmail || 'No disponible',
    item.categoryName || 'No disponible',
    new Date(item.date).toLocaleString('es-AR'),
    item.attended ? 'Sí' : 'No'
  ]);
  
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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
  
  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Construir consulta según los filtros
      let query = `
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
        "studentName": student->username,
        "studentEmail": student->email,
        "studentFullName": student->fullName,
        "categoryName": category->name
      } | order(date desc)`;
      
      // Configurar parámetros
      const params: Record<string, any> = {
        startDate: startDate ? new Date(startDate).toISOString() : new Date(0).toISOString(),
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : new Date().toISOString()
      };
      
      if (selectedCategory !== 'all') {
        params.categoryId = selectedCategory;
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
      const categoryName = selectedCategory === 'all' 
        ? 'todas-las-categorias' 
        : categories.find(c => c._id === selectedCategory)?.name.toLowerCase().replace(/\s+/g, '-') || 'categoria';
      
      const filename = `asistencia-${categoryName}-${startDate}-a-${endDate}.csv`;
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
          <Text size={1} weight="semibold" style={{ marginBottom: '8px' }}>Categoría</Text>
          <Select 
            value={selectedCategory} 
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(event.currentTarget.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Box>
        
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
        
        <Button
          icon={DownloadIcon}
          text="Exportar a CSV"
          tone="primary"
          onClick={handleExport}
          disabled={isLoading}
          style={{ marginTop: '8px' }}
        >
          {isLoading ? 'Exportando...' : ''}
        </Button>
      </Stack>
    </Card>
  );
};
