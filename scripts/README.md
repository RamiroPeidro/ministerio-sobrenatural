# Script para Registro Masivo de Estudiantes

Este script permite registrar múltiples estudiantes desde un archivo CSV, creando usuarios en Clerk y asignándolos automáticamente a sus respectivos años.

## Requisitos previos

1. Node.js instalado en tu sistema
2. Archivo CSV con la estructura correcta
3. Clerk API Key (Secret Key)
4. IDs de las categorías en Sanity

## Instalación

1. Instala las dependencias necesarias:

```bash
cd c:\Users\ramir\Desktop\prueba deploy\prueba2
npm install csv-parser @clerk/clerk-sdk-node node-fetch
```

## Preparación

1. Crea un archivo CSV llamado `estudiantes.csv` en la carpeta `scripts` con la siguiente estructura:

```
Nombre;Apellido;Email;Contraseña;Año
Eduardo Gabriel;Abraham;eduardogabraham@gmail.com;Escuela123;Primer año
```

2. Abre el archivo `scripts/bulk-register-students.js` y actualiza la configuración:

   - `CLERK_SECRET_KEY`: Tu API key de Clerk (desde el dashboard de Clerk)
   - `API_BASE_URL`: URL base de tu API (por defecto: http://localhost:3000/api)
   - `CATEGORY_MAPPING`: Mapeo entre los nombres de años y los IDs de categorías en Sanity

3. Para obtener los IDs de categorías, puedes ejecutar esta query en tu Sanity Studio:

```
*[_type == "category"]{_id, name}
```

## Uso

1. Ejecuta el script desde la terminal:

```bash
cd c:\Users\ramir\Desktop\prueba deploy\prueba2
node scripts/bulk-register-students.js
```

2. El script:
   - Leerá el archivo CSV
   - Creará cada usuario en Clerk
   - Esperará a que el webhook cree el estudiante en Sanity
   - Asignará la categoría correcta (año) al estudiante
   - Matriculará automáticamente al estudiante en los cursos de su año

## Resolución de problemas

- **Error al crear usuario en Clerk**: Verifica que el email no esté ya registrado
- **Error al asignar categoría**: Asegúrate de que los IDs de categorías son correctos
- **Webhook no funcionando**: Verifica la configuración del webhook en Clerk
