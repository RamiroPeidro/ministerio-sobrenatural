const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const nodeFetch = require('node-fetch');

// Configuración - Reemplaza estos valores con los tuyos
const CLERK_SECRET_KEY = 'sk_test_d3xnU1ZsyNaIR0CpT7DftqLvjl5TdNM874sFi9RePW'; // Reemplaza con tu API key de Clerk
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta si tu API está en otra URL
const CSV_PATH = path.join(__dirname, 'estudiantes.csv'); // Ruta al archivo CSV

// Mapeo de nombres de año a IDs de categorías en Sanity - Debes completar estos valores
const CATEGORY_MAPPING = {
  'Primer año': 'fdb037fd-0ec4-4024-ac55-8fa5bcce9305',
  'Segundo año': '5d6dcd06-38a3-476e-ba1c-c97075f6356c',
  'Tercer año': 'f3f4728b-1579-4586-a212-344c45f0b527'
  // Agrega más años según sea necesario
};

/**
 * Lee un archivo CSV y devuelve un array de objetos
 */
function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Especificamos el separador como ";"
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Crea un usuario en Clerk usando la API REST directamente
 */
async function createClerkUser(firstName, lastName, email, password) {
  try {
    const response = await nodeFetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email_address: [{email_address: email}],
        password,
        skip_password_checks: true,
        skip_password_requirement: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Clerk: ${JSON.stringify(errorData)}`);
    }
    
    const user = await response.json();
    console.log(`✅ Usuario creado en Clerk: ${email} (ID: ${user.id})`);
    return user;
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
    const response = await nodeFetch(`${API_BASE_URL}/user/assign-category`, {
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
