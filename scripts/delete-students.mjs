import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configurar cliente de Sanity
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_ADMIN_TOKEN, // Usar el token con acceso completo
  apiVersion: '2023-05-03', // Usa la versión de la API que estés utilizando
  useCdn: false
});

async function deleteAllData() {
  try {
    console.log('🔄 Iniciando proceso de eliminación...');
    
    // 1. Primero borrar todas las inscripciones a cursos (enrollments)
    console.log('🔄 Buscando inscripciones a cursos...');
    const enrollments = await client.fetch('*[_type == "enrollment"]._id');
    console.log(`✅ Encontradas ${enrollments.length} inscripciones para eliminar`);
    
    if (enrollments.length > 0) {
      console.log('🔄 Eliminando inscripciones...');
      // Eliminación en lotes para mayor eficiencia
      const batchSize = 50;
      for (let i = 0; i < enrollments.length; i += batchSize) {
        const batch = enrollments.slice(i, i + batchSize);
        const transaction = client.transaction();
        
        batch.forEach(id => {
          transaction.delete(id);
        });
        
        await transaction.commit();
        console.log(`✅ Eliminado lote ${i/batchSize + 1}/${Math.ceil(enrollments.length/batchSize)}`);
      }
      console.log('✅ Todas las inscripciones han sido eliminadas');
    }
    
    // 2. Eliminar todas las finalizaciones de lecciones
    console.log('🔄 Buscando registros de lecciones completadas...');
    const completions = await client.fetch('*[_type == "lessonCompletion"]._id');
    console.log(`✅ Encontrados ${completions.length} registros de lecciones completadas para eliminar`);
    
    if (completions.length > 0) {
      console.log('🔄 Eliminando registros de lecciones completadas...');
      const batchSize = 50;
      for (let i = 0; i < completions.length; i += batchSize) {
        const batch = completions.slice(i, i + batchSize);
        const transaction = client.transaction();
        
        batch.forEach(id => {
          transaction.delete(id);
        });
        
        await transaction.commit();
        console.log(`✅ Eliminado lote ${i/batchSize + 1}/${Math.ceil(completions.length/batchSize)}`);
      }
      console.log('✅ Todos los registros de lecciones completadas han sido eliminados');
    }
    
    // 3. Eliminar registros de asistencia
    console.log('🔄 Buscando registros de asistencia...');
    const attendances = await client.fetch('*[_type == "attendance"]._id');
    console.log(`✅ Encontrados ${attendances.length} registros de asistencia para eliminar`);
    
    if (attendances.length > 0) {
      console.log('🔄 Eliminando registros de asistencia...');
      const batchSize = 50;
      for (let i = 0; i < attendances.length; i += batchSize) {
        const batch = attendances.slice(i, i + batchSize);
        const transaction = client.transaction();
        
        batch.forEach(id => {
          transaction.delete(id);
        });
        
        await transaction.commit();
        console.log(`✅ Eliminado lote ${i/batchSize + 1}/${Math.ceil(attendances.length/batchSize)}`);
      }
      console.log('✅ Todos los registros de asistencia han sido eliminados');
    }
    
    // 4. Finalmente, borrar todos los estudiantes
    console.log('🔄 Buscando estudiantes...');
    const students = await client.fetch('*[_type == "student"]._id');
    console.log(`✅ Encontrados ${students.length} estudiantes para eliminar`);
    
    if (students.length > 0) {
      console.log('🔄 Eliminando estudiantes...');
      const batchSize = 50;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const transaction = client.transaction();
        
        batch.forEach(id => {
          transaction.delete(id);
        });
        
        await transaction.commit();
        console.log(`✅ Eliminado lote ${i/batchSize + 1}/${Math.ceil(students.length/batchSize)}`);
      }
      console.log('✅ Todos los estudiantes han sido eliminados');
    }
    
    console.log('✅ Proceso de eliminación completado con éxito');
    
  } catch (error) {
    console.error('❌ Error durante el proceso de eliminación:', error);
  }
}

// Ejecutar la función
deleteAllData();
