# Guía Paso a Paso: Actualizar Tabla tipo_mantenimiento

## Objetivo
Actualizar la tabla `tipo_mantenimiento` para que solo contenga 3 tipos:
- **ID 1**: Preventivo
- **ID 2**: Correctivo  
- **ID 3**: Operativo

---

## PASO 1: Acceder a Supabase SQL Editor

1. Abre tu navegador y ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tus credenciales
3. Selecciona tu proyecto EMOP
4. En el menú lateral izquierdo, haz clic en **"SQL Editor"** (ícono de base de datos o editor de código)
5. Haz clic en el botón **"New query"** o **"Nueva consulta"** para crear una nueva consulta SQL

---

## PASO 2: Verificar el Estado Actual (Opcional pero Recomendado)

Antes de hacer cambios, verifica qué datos tienes actualmente:

```sql
-- Ver todos los tipos de mantenimiento actuales
SELECT id_tipo, descripcion 
FROM tipo_mantenimiento 
ORDER BY id_tipo;

-- Ver cuántas órdenes de trabajo usan cada tipo
SELECT 
    tm.id_tipo,
    tm.descripcion,
    COUNT(ot.id_orden) as cantidad_ordenes
FROM tipo_mantenimiento tm
LEFT JOIN orden_trabajo ot ON tm.id_tipo = ot.id_tipo_mantenimiento
GROUP BY tm.id_tipo, tm.descripcion
ORDER BY tm.id_tipo;
```

**Copia y pega estas consultas en el SQL Editor y haz clic en "Run" o "Ejecutar"** para ver los resultados.

---

## PASO 3: Ejecutar el Script de Actualización

1. Abre el archivo `actualizar_tipo_mantenimiento.sql` en tu editor de código
2. **Copia TODO el contenido** del archivo (Ctrl+A, Ctrl+C o Cmd+A, Cmd+C)
3. Vuelve a Supabase SQL Editor
4. **Pega el contenido** en el editor (Ctrl+V o Cmd+V)
5. **Revisa el script** para asegurarte de que se copió correctamente
6. Haz clic en el botón **"Run"** o **"Ejecutar"** (generalmente está en la esquina inferior derecha o tiene un ícono de play ▶️)

---

## PASO 4: Verificar los Resultados

Después de ejecutar el script, deberías ver:

1. **Mensaje de éxito**: Debería aparecer un mensaje verde indicando que la consulta se ejecutó correctamente
2. **Resultados de la consulta final**: Deberías ver una tabla con 3 filas:
   ```
   id_tipo | descripcion
   --------|-------------
   1       | Preventivo
   2       | Correctivo
   3       | Operativo
   ```

---

## PASO 5: Verificar Órdenes de Trabajo con Tipos Inválidos

El script incluye una consulta que muestra las órdenes de trabajo que tienen tipos inválidos (si las hay).

**Si aparecen resultados en esta consulta**, significa que hay órdenes de trabajo que referencian tipos de mantenimiento que ya no existen.

### Opción A: Si NO hay órdenes con tipos inválidos
✅ **¡Perfecto!** No necesitas hacer nada más. El proceso está completo.

### Opción B: Si SÍ hay órdenes con tipos inválidos
Tienes dos opciones:

#### Opción B1: Asignar un tipo por defecto (Recomendado)
Ejecuta esta consulta para asignar "Preventivo" (ID 1) a todas las órdenes con tipos inválidos:

```sql
UPDATE orden_trabajo 
SET id_tipo_mantenimiento = 1  -- Asignar Preventivo como tipo por defecto
WHERE id_tipo_mantenimiento IS NOT NULL 
  AND id_tipo_mantenimiento NOT IN (1, 2, 3);
```

#### Opción B2: Eliminar la referencia (si no necesitas el tipo)
Ejecuta esta consulta para dejar sin tipo las órdenes con tipos inválidos:

```sql
UPDATE orden_trabajo 
SET id_tipo_mantenimiento = NULL 
WHERE id_tipo_mantenimiento IS NOT NULL 
  AND id_tipo_mantenimiento NOT IN (1, 2, 3);
```

---

## PASO 6: Verificación Final

Ejecuta estas consultas para confirmar que todo está correcto:

```sql
-- 1. Verificar que solo existen los 3 tipos
SELECT id_tipo, descripcion 
FROM tipo_mantenimiento 
ORDER BY id_tipo;
-- Debe mostrar exactamente 3 filas: 1-Preventivo, 2-Correctivo, 3-Operativo

-- 2. Verificar que no hay órdenes con tipos inválidos
SELECT COUNT(*) as ordenes_invalidas
FROM orden_trabajo
WHERE id_tipo_mantenimiento IS NOT NULL 
  AND id_tipo_mantenimiento NOT IN (1, 2, 3);
-- Debe mostrar 0 (cero)

-- 3. Ver distribución de tipos en órdenes de trabajo
SELECT 
    tm.id_tipo,
    tm.descripcion,
    COUNT(ot.id_orden) as cantidad_ordenes
FROM tipo_mantenimiento tm
LEFT JOIN orden_trabajo ot ON tm.id_tipo = ot.id_tipo_mantenimiento
GROUP BY tm.id_tipo, tm.descripcion
ORDER BY tm.id_tipo;
-- Debe mostrar los 3 tipos con sus respectivas cantidades
```

---

## ⚠️ IMPORTANTE: Antes de Ejecutar

1. **Haz un backup**: Si tienes datos importantes, exporta la tabla antes de ejecutar:
   ```sql
   -- Exportar datos actuales (opcional)
   SELECT * FROM tipo_mantenimiento;
   -- Copia los resultados por si necesitas restaurarlos
   ```

2. **Verifica las dependencias**: El script usa `CASCADE` que eliminará automáticamente las referencias, pero es bueno saber qué se va a modificar.

3. **Horario adecuado**: Ejecuta este script en un momento de bajo tráfico si es posible.

---

## 🆘 Solución de Problemas

### Error: "relation tipo_mantenimiento does not exist"
- **Causa**: La tabla no existe o estás en la base de datos incorrecta
- **Solución**: Verifica que estás conectado al proyecto correcto en Supabase

### Error: "permission denied"
- **Causa**: No tienes permisos para modificar la tabla
- **Solución**: Contacta al administrador de la base de datos

### Error: "sequence does not exist"
- **Causa**: La secuencia tiene un nombre diferente
- **Solución**: Ejecuta primero: `SELECT pg_get_serial_sequence('tipo_mantenimiento', 'id_tipo');` para ver el nombre correcto

### Los datos no se actualizaron
- **Causa**: Puede haber un error en la ejecución
- **Solución**: Revisa los mensajes de error en Supabase y verifica la sintaxis SQL

---

## ✅ Checklist Final

- [ ] Accedí a Supabase SQL Editor
- [ ] Verifiqué el estado actual de los datos
- [ ] Ejecuté el script completo
- [ ] Verifiqué que solo existen los 3 tipos (1, 2, 3)
- [ ] Verifiqué que no hay órdenes con tipos inválidos
- [ ] Si había órdenes inválidas, las corregí
- [ ] Realicé la verificación final

---

## 📝 Notas Adicionales

- El script es **idempotente**: puedes ejecutarlo múltiples veces y siempre dejará la tabla en el mismo estado
- Los IDs son **fijos** (1, 2, 3) para mantener consistencia en todo el sistema
- Si necesitas agregar más tipos en el futuro, deberás modificar este script y la aplicación

---

¿Tienes dudas? Revisa cada paso cuidadosamente y si encuentras algún problema, consulta la sección de "Solución de Problemas".

