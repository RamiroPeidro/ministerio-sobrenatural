// Este script utiliza Puppeteer para automatizar la creación de usuarios en Clerk a través de la interfaz web
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

// Configuración
const CSV_PATH = path.join(__dirname, 'estudiantes.csv');
const CLERK_ADMIN_EMAIL = 'tu-email@ejemplo.com'; // Reemplaza con tu email de administrador de Clerk
const CLERK_ADMIN_PASSWORD = 'tu-contraseña'; // Reemplaza con tu contraseña
const CLERK_DASHBOARD_URL = 'https://dashboard.clerk.com';

// Mapeo de años a categorías en Sanity
const CATEGORY_MAPPING = {
  'Primer año': 'fdb037fd-0ec4-4024-ac55-8fa5bcce9305',
  'Segundo año': '5d6dcd06-38a3-476e-ba1c-c97075f6356c',
  'Tercer año': 'f3f4728b-1579-4586-a212-344c45f0b527'
};

/**
 * Lee un archivo CSV y devuelve un array de objetos
 */
function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Función principal para importar estudiantes
 */
async function importStudents() {
  try {
    // 1. Leer los datos del CSV
    console.log('🔍 Leyendo archivo CSV...');
    const students = await readCsvFile(CSV_PATH);
    console.log(`📋 Se encontraron ${students.length} estudiantes en el CSV`);
    
    console.log('\n===== INSTRUCCIONES PARA IMPORTAR ESTUDIANTES =====');
    console.log('Para importar estos estudiantes a Clerk, sigue estos pasos:');
    console.log('1. Inicia sesión en el dashboard de Clerk: https://dashboard.clerk.com');
    console.log('2. Ve a la sección "Users" y haz clic en "Add users"');
    console.log('3. Selecciona "Bulk import" o "CSV import"');
    console.log('4. Usa el siguiente formato CSV (ajustado para Clerk):');
    
    // Crear un nuevo CSV en formato de Clerk
    const clerkCsvPath = path.join(__dirname, 'clerk-import.csv');
    const stream = fs.createWriteStream(clerkCsvPath);
    
    // Escribir encabezados de CSV para Clerk
    stream.write('email,username,first_name,last_name,password,external_id\n');
    
    // Escribir datos de estudiantes
    let successCount = 0;
    
    for (const student of students) {
      // Generar username seguro
      const firstName = student.Nombre;
      const lastName = student.Apellido;
      const email = student.Email;
      const year = student.Año;
      const categoryId = CATEGORY_MAPPING[year];
      
      if (!categoryId) {
        console.error(`❌ No se encontró mapeo para el año: ${year}`);
        continue;
      }
      
      // Normalizar nombre para username
      const normalizedFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedLastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const username = `${normalizedFirstName}_${normalizedLastName}`.replace(/\s+/g, "").replace(/[^a-z0-9_-]/g, "");
      
      // Contraseña segura
      const password = "MinisterioSN_2025!";
      
      // External ID puede ser usado para el categoryId
      const externalId = categoryId;
      
      // Escribir línea al CSV
      stream.write(`${email},${username},${firstName},${lastName},${password},${externalId}\n`);
      
      successCount++;
    }
    
    stream.end();
    
    console.log('\n✅ CSV para importación creado exitosamente en:');
    console.log(clerkCsvPath);
    console.log(`✅ ${successCount} estudiantes preparados para importación`);
    console.log('\nDespués de importar estudiantes, usa el script assign-categories.js para asignarles categorías en Sanity');
    
  } catch (error) {
    console.error('Error en la importación:', error);
  }
}

// Iniciar proceso
importStudents().catch(console.error);
