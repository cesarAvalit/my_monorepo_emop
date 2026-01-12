# Guía: Agregar Campo Horómetro a la Tabla Vehículo

## Objetivo
Agregar el campo `horometro` a la tabla `vehiculo` en Supabase para poder registrar y mostrar el horómetro de cada vehículo.

## Pasos a Seguir

### Paso 1: Acceder a Supabase SQL Editor
1. Inicia sesión en tu proyecto de Supabase
2. Ve a la sección **SQL Editor** en el menú lateral
3. Haz clic en **New query** para crear una nueva consulta

### Paso 2: Verificar Estado Actual (Opcional)
Antes de ejecutar el script, puedes verificar si la columna ya existe:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehiculo' 
  AND column_name = 'horometro';
```

Si no devuelve resultados, significa que la columna no existe y puedes continuar.

### Paso 3: Ejecutar el Script
1. Copia todo el contenido del archivo `agregar_horometro_vehiculo.sql`
2. Pega el contenido en el editor SQL de Supabase
3. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 4: Verificar la Ejecución
Después de ejecutar el script, deberías ver:

1. **Mensaje de éxito**: "Success. No rows returned" o similar
2. **Resultado de verificación**: Una tabla mostrando la información de la columna `horometro`:
   - `column_name`: horometro
   - `data_type`: integer
   - `column_default`: 0
   - `is_nullable`: NO

3. **Muestra de datos**: Una tabla con algunos registros de vehículos mostrando `kilometros` y `horometro`

### Paso 5: Verificar en la Tabla
Puedes verificar que la columna se agregó correctamente ejecutando:

```sql
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro
FROM vehiculo
LIMIT 10;
```

Todos los vehículos existentes deberían tener `horometro = 0` (valor por defecto).

## Características del Campo

- **Nombre**: `horometro`
- **Tipo**: `INTEGER`
- **Valor por defecto**: `0`
- **Permite NULL**: No
- **Ubicación**: Se agrega después de `kilometros` en la estructura de la tabla

## Notas Importantes

1. **No afecta datos existentes**: El script usa `IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces
2. **Valor por defecto**: Todos los vehículos existentes tendrán `horometro = 0` automáticamente
3. **Compatibilidad**: El campo es compatible con el código frontend que ya implementamos
4. **Sin pérdida de datos**: Esta operación no elimina ni modifica datos existentes

## Solución de Problemas

### Error: "column already exists"
- **Causa**: La columna ya existe en la tabla
- **Solución**: No es necesario hacer nada, el campo ya está disponible

### Error: "permission denied"
- **Causa**: No tienes permisos para modificar la estructura de la tabla
- **Solución**: Verifica que estés usando una cuenta con permisos de administrador

### No se ve la columna después de ejecutar
- **Causa**: Puede ser un problema de caché
- **Solución**: 
  1. Refresca la página de Supabase
  2. Verifica ejecutando el query de verificación del Paso 5

## Próximos Pasos

Después de agregar el campo en Supabase:

1. ✅ El campo ya está visible en la tabla de vehículos en el frontend
2. Puedes actualizar los valores de `horometro` para cada vehículo desde:
   - El formulario de edición de vehículos (si lo agregamos)
   - Directamente desde Supabase
   - A través de la carga masiva (si lo agregamos al Excel)

## Consultas Útiles

### Ver todos los vehículos con horómetro
```sql
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro
FROM vehiculo
ORDER BY id_vehiculo;
```

### Actualizar horómetro de un vehículo específico
```sql
UPDATE vehiculo 
SET horometro = 15000 
WHERE id_vehiculo = 1;
```

### Ver vehículos con horómetro mayor a cierto valor
```sql
SELECT 
    id_vehiculo,
    matricula,
    interno,
    horometro
FROM vehiculo
WHERE horometro > 10000
ORDER BY horometro DESC;
```

