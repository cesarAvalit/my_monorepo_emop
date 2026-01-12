# Pasos para Migrar a la Nueva Estructura DDJJ

## 📋 Resumen

Esta guía te llevará paso a paso para migrar la base de datos a la nueva estructura donde **una DDJJ puede contener múltiples órdenes de trabajo**.

---

## ⚠️ IMPORTANTE: Antes de Empezar

### 1. Hacer Backup de la Base de Datos

**CRÍTICO**: Antes de ejecutar cualquier script, haz un backup completo de tu base de datos.

```bash
# Ejemplo para PostgreSQL/Supabase
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_antes_migracion_ddjj.sql
```

O desde Supabase Dashboard:
1. Ve a **Database** → **Backups**
2. Crea un backup manual antes de continuar

### 2. Verificar Acceso a la Base de Datos

Asegúrate de tener:
- Acceso de administrador a la base de datos
- Permisos para crear tablas, modificar columnas y crear índices
- Conexión estable a Supabase/PostgreSQL

---

## 📝 Pasos de Migración

### **PASO 1: Revisar los Scripts**

Asegúrate de tener estos archivos en tu proyecto:

1. ✅ `restructurar_ddjj_ordenes_trabajo.sql` - Crea la nueva estructura
2. ✅ `migracion_datos_ddjj.sql` - Migra los datos existentes
3. ✅ `rollback_migracion_ddjj.sql` - Script de reversión (si algo sale mal)

### **PASO 2: Ejecutar el Script de Estructura**

**Archivo**: `restructurar_ddjj_ordenes_trabajo.sql`

**Qué hace**:
- Crea la tabla `declaracion_jurada`
- Agrega columna `id_ddjj` a `orden_trabajo`
- Agrega columna `id_ddjj` a `inspeccion_ddjj`
- Agrega columna `id_ddjj` a `reporte_auditoria_ddjj`
- Crea la tabla `ddjj_x_usuario`
- Crea índices y triggers necesarios

**Cómo ejecutarlo**:

#### Opción A: Desde Supabase Dashboard (Recomendado)

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `restructurar_ddjj_ordenes_trabajo.sql`
5. **Revisa el script** antes de ejecutar
6. Haz clic en **Run** o presiona `Ctrl+Enter`
7. Verifica que no haya errores en la consola

#### Opción B: Desde línea de comandos (psql)

```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f restructurar_ddjj_ordenes_trabajo.sql
```

#### Opción C: Desde un cliente SQL (DBeaver, pgAdmin, etc.)

1. Abre tu cliente SQL
2. Conéctate a tu base de datos
3. Abre el archivo `restructurar_ddjj_ordenes_trabajo.sql`
4. Ejecuta el script completo

**Tiempo estimado**: 1-2 minutos

**Verificación**:
```sql
-- Verificar que la tabla existe
SELECT * FROM declaracion_jurada LIMIT 1;

-- Verificar que la columna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orden_trabajo' AND column_name = 'id_ddjj';
```

---

### **PASO 3: Verificar la Estructura Creada**

Antes de migrar datos, verifica que todo se creó correctamente:

```sql
-- 1. Verificar tabla declaracion_jurada
SELECT COUNT(*) as total_ddjj FROM declaracion_jurada;
-- Debe retornar 0 (vacía por ahora)

-- 2. Verificar columna en orden_trabajo
SELECT COUNT(*) as ordenes_sin_ddjj 
FROM orden_trabajo 
WHERE id_ddjj IS NULL;
-- Debe retornar el total de órdenes existentes

-- 3. Verificar tabla ddjj_x_usuario
SELECT COUNT(*) as asignaciones FROM ddjj_x_usuario;
-- Debe retornar 0 (vacía por ahora)
```

Si todo está correcto, continúa al siguiente paso.

---

### **PASO 4: Ejecutar el Script de Migración de Datos**

**Archivo**: `migracion_datos_ddjj.sql`

**Qué hace**:
- Crea una DDJJ para cada orden de trabajo existente
- Asigna cada orden a su DDJJ correspondiente
- Migra las inspecciones para que referencien la DDJJ
- Migra los reportes de auditoría para que referencien la DDJJ
- Migra las asignaciones de usuarios a nivel de DDJJ
- Muestra estadísticas de la migración

**Cómo ejecutarlo**:

#### Desde Supabase Dashboard:

1. Ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido de `migracion_datos_ddjj.sql`
4. **Revisa el script** (especialmente las secciones de migración)
5. Haz clic en **Run**
6. **Revisa los mensajes** en la consola (NOTICE y WARNING)

**Tiempo estimado**: 
- 1-5 minutos (dependiendo de la cantidad de datos)
- Para bases de datos grandes (>10,000 registros), puede tomar más tiempo

**⚠️ ADVERTENCIA**: Este script puede tardar varios minutos si tienes muchos registros. No cierres la ventana durante la ejecución.

---

### **PASO 5: Verificar la Migración**

Después de ejecutar el script de migración, verifica que todo se migró correctamente:

```sql
-- 1. Verificar DDJJ creadas
SELECT COUNT(*) as total_ddjj FROM declaracion_jurada;
-- Debe ser igual al número de órdenes de trabajo que tenías

-- 2. Verificar órdenes con DDJJ
SELECT COUNT(*) as ordenes_con_ddjj 
FROM orden_trabajo 
WHERE id_ddjj IS NOT NULL;
-- Debe ser igual al total de órdenes (o muy cercano)

-- 3. Verificar órdenes sin DDJJ (debe ser 0 o muy pocas)
SELECT COUNT(*) as ordenes_sin_ddjj 
FROM orden_trabajo 
WHERE id_ddjj IS NULL;

-- 4. Verificar inspecciones migradas
SELECT COUNT(*) as inspecciones_con_ddjj 
FROM inspeccion_ddjj 
WHERE id_ddjj IS NOT NULL;

-- 5. Verificar reportes migrados
SELECT COUNT(*) as reportes_con_ddjj 
FROM reporte_auditoria_ddjj 
WHERE id_ddjj IS NOT NULL;

-- 6. Verificar asignaciones
SELECT COUNT(*) as asignaciones FROM ddjj_x_usuario;

-- 7. Ver una muestra de DDJJ creadas
SELECT 
    id_ddjj,
    numero_ddjj,
    id_empresa,
    estado,
    fecha_creacion
FROM declaracion_jurada
ORDER BY fecha_creacion DESC
LIMIT 10;

-- 8. Verificar relación DDJJ - Órdenes
SELECT 
    dj.numero_ddjj,
    COUNT(ot.id_orden) as cantidad_ordenes
FROM declaracion_jurada dj
LEFT JOIN orden_trabajo ot ON dj.id_ddjj = ot.id_ddjj
GROUP BY dj.id_ddjj, dj.numero_ddjj
ORDER BY cantidad_ordenes DESC
LIMIT 10;
```

**Resultados esperados**:
- ✅ Todas las órdenes deben tener `id_ddjj` asignado
- ✅ Todas las inspecciones deben tener `id_ddjj` asignado
- ✅ Todos los reportes deben tener `id_ddjj` asignado
- ✅ Debe haber asignaciones en `ddjj_x_usuario`

---

### **PASO 6: Validar Integridad de Datos**

Ejecuta estas consultas para validar que no se perdieron datos:

```sql
-- 1. Verificar que no se perdieron órdenes
SELECT 
    (SELECT COUNT(*) FROM orden_trabajo) as total_ordenes,
    (SELECT COUNT(*) FROM orden_trabajo WHERE id_ddjj IS NOT NULL) as ordenes_con_ddjj;

-- 2. Verificar que no se perdieron inspecciones
SELECT 
    (SELECT COUNT(*) FROM inspeccion_ddjj) as total_inspecciones,
    (SELECT COUNT(*) FROM inspeccion_ddjj WHERE id_ddjj IS NOT NULL) as inspecciones_con_ddjj;

-- 3. Verificar que no se perdieron reportes
SELECT 
    (SELECT COUNT(*) FROM reporte_auditoria_ddjj) as total_reportes,
    (SELECT COUNT(*) FROM reporte_auditoria_ddjj WHERE id_ddjj IS NOT NULL) as reportes_con_ddjj;

-- 4. Verificar relaciones
SELECT 
    COUNT(DISTINCT ot.id_ddjj) as ddjj_con_ordenes,
    COUNT(ot.id_orden) as total_ordenes
FROM orden_trabajo ot
WHERE ot.id_ddjj IS NOT NULL;
```

---

### **PASO 7: Actualizar el Código de la Aplicación**

Una vez que la migración esté completa, necesitarás actualizar el código:

#### Archivos a modificar:

1. **`src/pages/NuevosDDJJ.jsx`**
   - Modificar para crear `declaracion_jurada` primero
   - Luego crear órdenes de trabajo asociadas a la DDJJ

2. **`src/pages/ExploradorAuditorias.jsx`**
   - Actualizar consultas para trabajar con `declaracion_jurada`
   - Modificar la lógica de comparación para trabajar a nivel de DDJJ

3. **`src/pages/DDJJRegistradas.jsx`**
   - Actualizar para mostrar DDJJ con sus órdenes asociadas

4. **`src/pages/AsignacionDDJJ.jsx`**
   - Modificar para asignar usuarios a DDJJ en lugar de órdenes individuales

5. **`src/config/supabase.js`**
   - Agregar funciones helper para trabajar con `declaracion_jurada`

#### Consultas a actualizar:

- Todas las consultas que buscan órdenes de trabajo deben considerar la relación con DDJJ
- Las inspecciones y auditorías deben referenciar la DDJJ principal

---

## 🔄 Rollback (Si algo sale mal)

Si necesitas revertir los cambios, ejecuta el script de rollback:

**Archivo**: `rollback_migracion_ddjj.sql` (se creará a continuación)

**⚠️ ADVERTENCIA**: El rollback eliminará las DDJJ creadas y desvinculará las órdenes. Las inspecciones y reportes perderán la referencia a DDJJ pero mantendrán la referencia a órdenes.

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [ ] Backup de la base de datos creado
- [ ] Script de estructura ejecutado sin errores
- [ ] Script de migración ejecutado sin errores
- [ ] Verificaciones de datos pasadas
- [ ] Integridad de datos validada
- [ ] Código de la aplicación actualizado
- [ ] Pruebas funcionales realizadas
- [ ] Documentación actualizada

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Revisa los mensajes de error** en la consola de Supabase
2. **Verifica los logs** en SQL Editor
3. **Compara los conteos** antes y después de la migración
4. **Ejecuta las consultas de verificación** paso a paso

---

## 📊 Estadísticas Post-Migración

Después de la migración, puedes ejecutar esta consulta para ver un resumen:

```sql
SELECT 
    'DDJJ creadas' as tipo,
    COUNT(*) as cantidad
FROM declaracion_jurada
UNION ALL
SELECT 
    'Órdenes con DDJJ',
    COUNT(*)
FROM orden_trabajo
WHERE id_ddjj IS NOT NULL
UNION ALL
SELECT 
    'Inspecciones migradas',
    COUNT(*)
FROM inspeccion_ddjj
WHERE id_ddjj IS NOT NULL
UNION ALL
SELECT 
    'Reportes migrados',
    COUNT(*)
FROM reporte_auditoria_ddjj
WHERE id_ddjj IS NOT NULL
UNION ALL
SELECT 
    'Asignaciones DDJJ-Usuario',
    COUNT(*)
FROM ddjj_x_usuario;
```

---

¡Buena suerte con la migración! 🚀

