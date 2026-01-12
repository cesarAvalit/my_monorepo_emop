# Guía: Agregar y Llenar Campo Costo Unitario en Insumo Catálogo

## Objetivo
Agregar el campo `costo_unitario` a la tabla `insumo_catalogo` y llenarlo con valores aleatorios (precios monetarios) con exactamente 2 decimales.

## ⚠️ ADVERTENCIA IMPORTANTE

El script de llenado **modificará datos existentes**. Si ya tienes valores de costo que quieres conservar, **NO ejecutes el script de llenado** o modifícalo primero para excluir esos insumos.

## Pasos a Seguir

### Paso 1: Agregar el Campo
1. Abre Supabase SQL Editor
2. Copia y pega el contenido de `agregar_costo_unitario_insumo.sql`
3. Ejecuta el script
4. Verifica que la columna se agregó correctamente

**Resultado esperado:**
- Columna `costo_unitario` agregada
- Tipo: `numeric` (DECIMAL)
- Precisión: 10 dígitos totales, 2 decimales
- Valor por defecto: 0.00
- No permite NULL

### Paso 2: Verificar Estado Actual (Opcional)
Antes de llenar con valores aleatorios, puedes verificar cuántos insumos se actualizarán:

```sql
-- Ver cuántos insumos tienen costo_unitario = 0.00 o NULL
SELECT 
    COUNT(*) as total_insumos,
    COUNT(CASE WHEN costo_unitario = 0.00 OR costo_unitario IS NULL THEN 1 END) as a_actualizar,
    COUNT(CASE WHEN costo_unitario > 0 THEN 1 END) as con_valor
FROM insumo_catalogo;
```

### Paso 3: Hacer Backup (Recomendado)
Si quieres conservar los valores actuales:

```sql
-- Crear tabla de respaldo
CREATE TABLE insumo_catalogo_backup_costo AS
SELECT id_insumo, costo_unitario, updated_at
FROM insumo_catalogo;

-- Verificar el backup
SELECT COUNT(*) FROM insumo_catalogo_backup_costo;
```

### Paso 4: Llenar con Valores Aleatorios
1. Abre Supabase SQL Editor
2. Copia y pega el contenido de `llenar_costo_unitario_random.sql`
3. **Revisa el script** para asegurarte de que el rango es adecuado
4. Ejecuta el script

**Resultado esperado:**
- Todos los insumos con `costo_unitario = 0.00` o `NULL` actualizados
- Valores aleatorios entre 10.00 y 5000.00
- Todos los valores con exactamente 2 decimales
- Estadísticas mostradas al final

## Características del Campo

- **Nombre**: `costo_unitario`
- **Tipo**: `DECIMAL(10, 2)`
- **Rango de valores**: 10.00 a 5000.00 (en el script de ejemplo)
- **Decimales**: Exactamente 2 decimales
- **Valor por defecto**: 0.00
- **Permite NULL**: No

## Modificaciones Opcionales

### Cambiar el rango de precios
Si quieres un rango diferente, modifica los números en el script:

```sql
-- Ejemplo: Rango de 5.00 a 1000.00
SET costo_unitario = ROUND(
    (random() * (1000.00 - 5.00) + 5.00)::NUMERIC, 
    2
)
```

### Actualizar TODOS los insumos (incluso los que ya tienen valor)
Si quieres regenerar valores para todos los insumos:

```sql
-- Elimina la condición WHERE o usa WHERE 1=1
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
);
```

### Actualizar solo insumos específicos
Si quieres actualizar solo ciertos insumos:

```sql
-- Ejemplo: Solo insumos con ID mayor a 10
WHERE (costo_unitario IS NULL OR costo_unitario = 0.00)
  AND id_insumo > 10;
```

## Consultas Útiles Después de la Ejecución

### Ver distribución de costos
```sql
SELECT 
    CASE 
        WHEN costo_unitario BETWEEN 10.00 AND 100.00 THEN '10-100'
        WHEN costo_unitario BETWEEN 100.01 AND 500.00 THEN '100-500'
        WHEN costo_unitario BETWEEN 500.01 AND 1000.00 THEN '500-1000'
        WHEN costo_unitario BETWEEN 1000.01 AND 5000.00 THEN '1000-5000'
        ELSE 'Otro'
    END as rango_costo,
    COUNT(*) as cantidad
FROM insumo_catalogo
GROUP BY rango_costo
ORDER BY rango_costo;
```

### Ver insumos más caros
```sql
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario
FROM insumo_catalogo
ORDER BY costo_unitario DESC
LIMIT 10;
```

### Ver insumos más baratos
```sql
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario
FROM insumo_catalogo
ORDER BY costo_unitario ASC
LIMIT 10;
```

### Verificar formato de decimales
```sql
-- Verificar que todos tienen exactamente 2 decimales
SELECT 
    id_insumo,
    codigo_inventario,
    costo_unitario,
    LENGTH(SPLIT_PART(costo_unitario::TEXT, '.', 2)) as decimales
FROM insumo_catalogo
WHERE LENGTH(SPLIT_PART(costo_unitario::TEXT, '.', 2)) != 2;
```

## Solución de Problemas

### No se actualizaron todos los insumos
- **Causa**: El script solo actualiza insumos con `costo_unitario = 0.00` o `NULL`
- **Solución**: Si quieres actualizar todos, modifica la condición `WHERE` como se muestra en "Modificaciones Opcionales"

### Valores fuera del rango esperado
- **Causa**: Error en la fórmula de generación aleatoria
- **Solución**: Verifica que la fórmula sea correcta:
  ```sql
  ROUND((random() * (max - min) + min)::NUMERIC, 2)
  ```

### Valores sin 2 decimales
- **Causa**: No se usó `ROUND` o se usó incorrectamente
- **Solución**: Asegúrate de usar `ROUND(..., 2)` en la actualización

### Error de permisos
- **Causa**: No tienes permisos para modificar la tabla
- **Solución**: Verifica que estés usando una cuenta con permisos de administrador

## Restaurar Valores (Si hiciste backup)

Si creaste un backup y necesitas restaurar:

```sql
-- Restaurar desde backup
UPDATE insumo_catalogo ic
SET costo_unitario = b.costo_unitario
FROM insumo_catalogo_backup_costo b
WHERE ic.id_insumo = b.id_insumo;

-- Eliminar tabla de backup (después de verificar)
-- DROP TABLE insumo_catalogo_backup_costo;
```

## Notas Finales

- Los valores generados son **aleatorios** y **diferentes cada vez** que ejecutes el script
- Si ejecutas el script múltiples veces, los valores cambiarán cada vez
- Los valores están distribuidos uniformemente en el rango especificado
- Todos los valores tienen **exactamente 2 decimales** gracias a `ROUND(..., 2)`
- El script es **idempotente** para insumos con valores existentes (no los modifica si ya tienen un valor > 0.00)

## Ejemplos de Valores Generados

Los valores generados seguirán este formato:
- ✅ 125.50
- ✅ 2347.89
- ✅ 10.00
- ✅ 5000.00
- ✅ 1234.56

Todos con exactamente 2 decimales.

