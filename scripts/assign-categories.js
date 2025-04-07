const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuración - Ajustar estos valores
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta si tu API está en otra URL
const CSV_PATH = path.join(__dirname, 'clerk-import.csv'); // CSV de importación

/**
 * Lee un archivo CSV y devuelve un array de objetos
 */
function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      const lines = data.split('\n');
      const headers = lines[0].split(',');
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const obj = {};
        
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = values[j];
        }
        
        results.push(obj);
      }
      
      resolve(results);
    });
  });
}

/**
 * Asigna una categoría (año) a un estudiante
 */
async function assignCategory(userId, categoryId) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/assign-category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        categoryId,
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ Categoría asignada para usuario: ${userId}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error al asignar categoría al usuario ${userId}:`, error.message);
    return null;
  }
}

/**
 * Función principal para asignar categorías
 */
async function assignCategories() {
  try {
    // 1. Leer los datos del CSV de importación
    console.log('🔍 Leyendo CSV de importación...');
    const students = await readCsvFile(CSV_PATH);
    console.log(`📋 Se encontraron ${students.length} estudiantes en el CSV`);
    
    console.log('\n===== INICIO DEL PROCESAMIENTO =====');
    
    let successCount = 0;
    let errorCount = 0;
    
    // 2. Para cada estudiante, asignar la categoría
    for (const student of students) {
      const userId = student.external_id; // El external_id debería ser el ID de Clerk
      const categoryId = student.external_id; // En nuestro caso, ya hemos usado el categoryId como external_id
      
      console.log(`\nProcesando estudiante: ${student.first_name} ${student.last_name} (${student.email})`);
      console.log(`   UserID: ${userId}, CategoryID: ${categoryId}`);
      
      // 3. Esperar un breve tiempo para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Asignar categoría y matricular en cursos
      const result = await assignCategory(userId, categoryId);
      
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n===== RESUMEN =====');
    console.log(`✅ Estudiantes procesados correctamente: ${successCount}`);
    console.log(`❌ Estudiantes con errores: ${errorCount}`);
    console.log(`📊 Total: ${students.length}`);
    
  } catch (error) {
    console.error('Error en el proceso principal:', error);
  }
}

// Solo ejecutar si se llama directamente (no si se importa como módulo)
if (require.main === module) {
  console.log('🔧 Ejecutando asignación de categorías...');
  assignCategories().catch(console.error);
}
