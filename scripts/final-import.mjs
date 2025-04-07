// Script final para importar estudiantes a Clerk según la documentación oficial
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar csv-parser con require
const csv = require('csv-parser');

// Configuración
const CLERK_SECRET_KEY = 'sk_test_d3xnU1ZsyNaIR0CpT7DftqLvjl5TdNM874sFi9RePW';
const API_BASE_URL = 'http://localhost:3000/api';
const CSV_PATH = path.join(__dirname, 'estudiantes.csv');

// Mapeo de nombres de año a IDs de categorías en Sanity
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
 * Crea un usuario en Clerk usando el endpoint según documentación oficial
 */
async function createClerkUser(firstName, lastName, email, password) {
  try {
    console.log(`Intentando crear usuario para: ${email}`);
    
    // Usar una contraseña segura única para todos los estudiantes
    const securePassword = "Ministerio+123";
    
    // Generar un nombre de usuario basado en nombre y apellido (solo caracteres permitidos)
    const normalizedFirstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedLastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const username = `${normalizedFirstName}_${normalizedLastName}`.replace(/\s+/g, "").replace(/[^a-z0-9_-]/g, "");
    
    console.log(`   Generando username: ${username}`);
    
    // Crear usuario con la estructura exacta de la documentación
    const userData = {
      username: username,
      password: securePassword,
      first_name: firstName,
      last_name: lastName,
      email_address: [email],  // Según la documentación: email_address como array de strings
      skip_password_checks: true
    };
    
    console.log("Datos a enviar:", JSON.stringify(userData, null, 2));
    
    const response = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Respuesta completa:", JSON.stringify(data, null, 2));
      throw new Error(`Error de Clerk: ${JSON.stringify(data)}`);
    }
    
    console.log(`✅ Usuario creado en Clerk: ${email} (ID: ${data.id})`);
    console.log(`   Username: ${username}`);
    console.log(`   ⚠️ NOTA: La contraseña es "${securePassword}"`);
    return data;
  } catch (error) {
    console.error(`❌ Error al crear usuario ${email} en Clerk:`, error.message);
    return null;
  }
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
 * Procesa un estudiante: crea el usuario en Clerk y asigna la categoría
 */
async function processStudent(student) {
  console.log(`\nProcesando estudiante: ${student.Nombre} ${student.Apellido} (${student.Email})`);
  
  // 1. Verificar que el año esté mapeado a una categoría
  const categoryId = CATEGORY_MAPPING[student.Año];
  if (!categoryId) {
    console.error(`❌ No se encontró mapeo para el año: ${student.Año}`);
    return null;
  }
  
  // 2. Crear usuario en Clerk
  const user = await createClerkUser(
    student.Nombre,
    student.Apellido,
    student.Email,
    student.Contraseña
  );
  
  if (!user) return null;
  
  // 3. Esperar un breve tiempo para que el webhook de Clerk->Sanity se complete
  console.log(`⏳ Esperando 3 segundos para que el webhook cree el estudiante en Sanity...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 4. Asignar categoría y matricular en cursos
  const result = await assignCategory(user.id, categoryId);
  
  if (result) {
    console.log(`✅ Estudiante procesado completamente: ${student.Email}`);
    return user;
  }
  
  return null;
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔍 Leyendo archivo CSV...');
    const students = await readCsvFile(CSV_PATH);
    console.log(`📋 Se encontraron ${students.length} estudiantes en el CSV`);
    
    console.log('\n===== INICIO DEL PROCESAMIENTO =====');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar estudiantes en secuencia (no en paralelo para evitar problemas)
    for (const student of students) {
      const result = await processStudent(student);
      
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

// Ejecutar script
main().catch(console.error);
