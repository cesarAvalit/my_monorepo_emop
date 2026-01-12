# Solución: Error "Failed to fetch" en Supabase

## Problema
Al ejecutar scripts SQL en Supabase SQL Editor, aparece el error:
```
Error running SQL query
Failed to fetch (api.supabase.com)
```

## Posibles Causas

1. **Problemas de conexión a internet**
2. **Timeout en la consulta** (muy común con tablas grandes)
3. **Problemas temporales con la API de Supabase**
4. **Script demasiado complejo o largo**

## Soluciones

### Solución 1: Ejecutar el Script en Partes

En lugar de ejecutar todo el script de una vez, ejecuta cada parte por separado:

#### Parte 1: Agregar la columna
```sql
ALTER TABLE insumo_catalogo 
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;
```

Espera a que termine y verifica que funcionó.

#### Parte 2: Actualizar valores
```sql
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
)
WHERE costo_unitario IS NULL OR costo_unitario = 0.00;
```

#### Parte 3: Verificar (opcional)
```sql
SELECT 
    id_insumo,
    codigo_inventario,
    descripcion,
    costo_unitario
FROM insumo_catalogo
ORDER BY id_insumo
LIMIT 10;
```

### Solución 2: Actualizar en Lotes (Si tienes muchos insumos)

Si tienes muchos registros y el UPDATE falla, actualiza en lotes:

```sql
-- Lote 1: Primeros 50 insumos
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
)
WHERE (costo_unitario IS NULL OR costo_unitario = 0.00)
  AND id_insumo <= 50;

-- Lote 2: Siguientes 50 insumos
UPDATE insumo_catalogo 
SET costo_unitario = ROUND(
    (random() * (5000.00 - 10.00) + 10.00)::NUMERIC, 
    2
)
WHERE (costo_unitario IS NULL OR costo_unitario = 0.00)
  AND id_insumo > 50 AND id_insumo <= 100;

-- Continuar con más lotes según sea necesario...
```

### Solución 3: Verificar Conexión

1. **Refresca la página** de Supabase
2. **Verifica tu conexión a internet**
3. **Intenta desde otro navegador** o en modo incógnito
4. **Espera unos minutos** y vuelve a intentar (puede ser un problema temporal de Supabase)

### Solución 4: Usar la Consola de Supabase (Alternativa)

Si el SQL Editor sigue fallando, puedes usar la consola de Supabase directamente:

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `insumo_catalogo`
3. Agrega manualmente la columna desde la interfaz
4. O usa la pestaña **SQL** en lugar del SQL Editor

### Solución 5: Script Simplificado

Usa los scripts `_v2.sql` que he creado, que son versiones simplificadas sin las consultas de verificación que pueden causar timeouts.

## Verificación Paso a Paso

### 1. Verificar que la columna existe
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'insumo_catalogo' 
  AND column_name = 'costo_unitario';
```

Si devuelve resultados, la columna existe.

### 2. Verificar valores actuales
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN costo_unitario = 0.00 THEN 1 END) as con_cero,
       COUNT(CASE WHEN costo_unitario > 0 THEN 1 END) as con_valor
FROM insumo_catalogo;
```

### 3. Actualizar solo los que necesitan actualización
```sql
-- Ver cuántos necesitan actualización
SELECT COUNT(*) 
FROM insumo_catalogo 
WHERE costo_unitario IS NULL OR costo_unitario = 0.00;

-- Si el número es razonable (< 1000), ejecutar el UPDATE
-- Si es muy grande, usar la solución de lotes
```

## Prevención de Errores Futuros

1. **Ejecuta scripts simples primero** antes de hacer operaciones complejas
2. **Usa transacciones** para operaciones críticas:
   ```sql
   BEGIN;
   -- Tu código aquí
   COMMIT;
   ```
3. **Haz backups** antes de operaciones masivas
4. **Ejecuta en horarios de menor carga** si es posible

## Si Nada Funciona

1. **Contacta al soporte de Supabase** si el problema persiste
2. **Verifica el estado de Supabase** en su página de estado: https://status.supabase.com
3. **Revisa los logs** en Supabase Dashboard > Logs

## Nota Importante

El error "Failed to fetch" es generalmente un problema de **infraestructura/conexión**, no un problema con el código SQL. El script SQL en sí está correcto, pero puede necesitar ejecutarse de manera diferente debido a limitaciones de red o timeout.

