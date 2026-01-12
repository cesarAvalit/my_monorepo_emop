# Guía: Llenar Campo Horómetro con Valores Aleatorios

## Objetivo
Actualizar el campo `horometro` de todos los vehículos en la tabla `vehiculo` con valores aleatorios entre 20,000 y 100,000 horas.

## ⚠️ ADVERTENCIA IMPORTANTE

Este script **modificará datos existentes**. Si ya tienes valores de horómetro que quieres conservar, **NO ejecutes este script** o modifícalo primero para excluir esos vehículos.

## Pasos a Seguir

### Paso 1: Verificar Estado Actual
Antes de ejecutar, verifica cuántos vehículos se actualizarán:

```sql
-- Ver cuántos vehículos tienen horometro = 0 o NULL
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(CASE WHEN horometro = 0 OR horometro IS NULL THEN 1 END) as a_actualizar,
    COUNT(CASE WHEN horometro > 0 THEN 1 END) as con_valor
FROM vehiculo;
```

### Paso 2: Hacer Backup (Recomendado)
Si quieres conservar los valores actuales, puedes crear una tabla de respaldo:

```sql
-- Crear tabla de respaldo
CREATE TABLE vehiculo_backup_horometro AS
SELECT id_vehiculo, horometro, updated_at
FROM vehiculo;

-- Verificar el backup
SELECT COUNT(*) FROM vehiculo_backup_horometro;
```

### Paso 3: Ejecutar el Script
1. Abre Supabase SQL Editor
2. Copia todo el contenido del archivo `llenar_horometro_random.sql`
3. Pega el contenido en el editor SQL de Supabase
4. **Revisa el script** para asegurarte de que es lo que quieres hacer
5. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 4: Verificar los Resultados
Después de ejecutar, el script mostrará:

1. **Muestra de vehículos actualizados**: Los primeros 20 vehículos con sus nuevos valores de horómetro y validación
2. **Estadísticas**: 
   - Total de vehículos
   - Horómetro mínimo generado
   - Horómetro máximo generado
   - Horómetro promedio
   - Cantidad dentro del rango (20,000 - 100,000)
   - Cantidad fuera del rango (si hay algún error)

## Características del Script

- **Rango**: 20,000 a 100,000 horas
- **Distribución**: Valores aleatorios uniformemente distribuidos
- **Actualización**: Solo actualiza vehículos con `horometro = 0` o `NULL`
- **Seguridad**: No afecta vehículos que ya tienen un valor de horómetro mayor a 0

## Modificaciones Opcionales

### Actualizar TODOS los vehículos (incluso los que ya tienen valor)
Si quieres regenerar valores para todos los vehículos, cambia la línea:

```sql
-- Versión original (solo actualiza 0 o NULL)
WHERE horometro IS NULL OR horometro = 0;

-- Versión para actualizar TODOS
-- (elimina la línea WHERE o usa WHERE 1=1)
```

### Cambiar el rango de valores
Si quieres un rango diferente, modifica los números:

```sql
-- Ejemplo: Rango de 10,000 a 50,000
SET horometro = floor(random() * (50000 - 10000 + 1) + 10000)::INTEGER
```

### Actualizar solo vehículos específicos
Si quieres actualizar solo ciertos vehículos, agrega condiciones:

```sql
-- Ejemplo: Solo vehículos de una empresa específica
WHERE (horometro IS NULL OR horometro = 0)
  AND id_empresa = 1;

-- Ejemplo: Solo vehículos activos
WHERE (horometro IS NULL OR horometro = 0)
  AND activo = true;
```

## Consultas Útiles Después de la Ejecución

### Ver distribución de horómetros
```sql
SELECT 
    CASE 
        WHEN horometro BETWEEN 20000 AND 40000 THEN '20k-40k'
        WHEN horometro BETWEEN 40001 AND 60000 THEN '40k-60k'
        WHEN horometro BETWEEN 60001 AND 80000 THEN '60k-80k'
        WHEN horometro BETWEEN 80001 AND 100000 THEN '80k-100k'
        ELSE 'Otro'
    END as rango_horometro,
    COUNT(*) as cantidad
FROM vehiculo
GROUP BY rango_horometro
ORDER BY rango_horometro;
```

### Ver vehículos con horómetros más altos
```sql
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro
FROM vehiculo
ORDER BY horometro DESC
LIMIT 10;
```

### Ver vehículos con horómetros más bajos
```sql
SELECT 
    id_vehiculo,
    matricula,
    interno,
    kilometros,
    horometro
FROM vehiculo
ORDER BY horometro ASC
LIMIT 10;
```

## Solución de Problemas

### No se actualizaron todos los vehículos
- **Causa**: El script solo actualiza vehículos con `horometro = 0` o `NULL`
- **Solución**: Si quieres actualizar todos, modifica la condición `WHERE` como se muestra en "Modificaciones Opcionales"

### Valores fuera del rango esperado
- **Causa**: Error en la fórmula de generación aleatoria
- **Solución**: Verifica que la fórmula sea correcta:
  ```sql
  floor(random() * (max - min + 1) + min)
  ```

### Error de permisos
- **Causa**: No tienes permisos para actualizar la tabla
- **Solución**: Verifica que estés usando una cuenta con permisos de administrador

## Restaurar Valores (Si hiciste backup)

Si creaste un backup y necesitas restaurar:

```sql
-- Restaurar desde backup
UPDATE vehiculo v
SET horometro = b.horometro
FROM vehiculo_backup_horometro b
WHERE v.id_vehiculo = b.id_vehiculo;

-- Eliminar tabla de backup (después de verificar)
-- DROP TABLE vehiculo_backup_horometro;
```

## Notas Finales

- Los valores generados son **aleatorios** y **diferentes cada vez** que ejecutes el script
- Si ejecutas el script múltiples veces, los valores cambiarán cada vez
- Los valores están distribuidos uniformemente en el rango especificado
- El script es **idempotente** para vehículos con valores existentes (no los modifica si ya tienen un valor > 0)

