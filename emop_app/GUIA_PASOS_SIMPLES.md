# 🚀 Guía Simple: Pasos para Migrar DDJJ

## ⚠️ IMPORTANTE: Hacer Backup Primero

**ANTES DE CUALQUIER COSA**, haz un backup de tu base de datos:

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Ve a tu proyecto
3. Ve a **Database** → **Backups**
4. Haz clic en **"Create backup"** o **"New backup"**
5. Espera a que termine

---

## 📋 PASO 1: Ejecutar Script de Estructura

### ¿Qué hace?
Crea las nuevas tablas y columnas necesarias para la nueva estructura.

### ¿Cómo hacerlo?

1. **Abre Supabase Dashboard**
   - Ve a [app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, haz clic en **"SQL Editor"**
   - O ve directamente a: `https://app.supabase.com/project/[TU_PROYECTO]/sql/new`

3. **Crea una nueva query**
   - Haz clic en el botón **"New query"** o **"+"**

4. **Copia el contenido del archivo**
   - Abre el archivo: `restructurar_ddjj_ordenes_trabajo.sql`
   - Selecciona TODO el contenido (Ctrl+A / Cmd+A)
   - Copia (Ctrl+C / Cmd+C)

5. **Pega en el SQL Editor**
   - Pega el contenido en el editor (Ctrl+V / Cmd+V)

6. **Ejecuta el script**
   - Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter`)
   - Espera a que termine (1-2 minutos)

7. **Verifica que no haya errores**
   - Revisa la consola de resultados
   - Debe decir "Success" o mostrar mensajes de éxito
   - Si hay errores en rojo, detente y avísame

### ✅ Verificación rápida

Después de ejecutar, ejecuta esta query para verificar:

```sql
SELECT COUNT(*) FROM declaracion_jurada;
```

Debe retornar `0` (cero) - la tabla está vacía pero existe.

---

## 📋 PASO 2: Ejecutar Script de Migración de Datos

### ¿Qué hace?
Toma todas tus órdenes de trabajo existentes y crea una DDJJ para cada una.

### ¿Cómo hacerlo?

1. **En el mismo SQL Editor de Supabase**
   - Crea una **nueva query** (botón "New query" o "+")

2. **Copia el contenido del archivo**
   - Abre el archivo: `migracion_datos_ddjj.sql`
   - Selecciona TODO el contenido (Ctrl+A)
   - Copia (Ctrl+C)

3. **Pega en el SQL Editor**
   - Pega el contenido en el editor (Ctrl+V)

4. **Ejecuta el script**
   - Haz clic en **"Run"** (o `Ctrl+Enter`)
   - **Espera** - puede tardar varios minutos si tienes muchos datos
   - **NO CIERRES LA VENTANA** mientras se ejecuta

5. **Revisa los mensajes**
   - En la consola verás mensajes como:
     - "Iniciando migración de órdenes de trabajo a DDJJ..."
     - "Migración de órdenes de trabajo completada. Total procesadas: X"
     - "Inspecciones actualizadas: X"
     - "Reportes de auditoría actualizados: X"
   - Si ves errores en rojo, detente y avísame

### ✅ Verificación rápida

Después de ejecutar, ejecuta esta query:

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
WHERE id_ddjj IS NOT NULL;
```

**Resultado esperado:**
- El número de "DDJJ creadas" debe ser igual al número de "Órdenes con DDJJ"
- Ambos números deben ser iguales al total de órdenes de trabajo que tenías

---

## 📋 PASO 3: Verificar que Todo Funcionó

Ejecuta estas queries una por una para verificar:

### Query 1: Verificar DDJJ creadas
```sql
SELECT COUNT(*) as total_ddjj FROM declaracion_jurada;
```
**Debe mostrar:** Un número mayor a 0

### Query 2: Verificar órdenes con DDJJ
```sql
SELECT COUNT(*) as ordenes_con_ddjj 
FROM orden_trabajo 
WHERE id_ddjj IS NOT NULL;
```
**Debe mostrar:** El mismo número que el anterior (o muy cercano)

### Query 3: Verificar órdenes sin DDJJ (debe ser 0)
```sql
SELECT COUNT(*) as ordenes_sin_ddjj 
FROM orden_trabajo 
WHERE id_ddjj IS NULL;
```
**Debe mostrar:** 0 (o un número muy pequeño si hay órdenes problemáticas)

### Query 4: Ver una muestra de DDJJ
```sql
SELECT 
    id_ddjj,
    numero_ddjj,
    id_empresa,
    estado,
    fecha_creacion
FROM declaracion_jurada
ORDER BY fecha_creacion DESC
LIMIT 10;
```
**Debe mostrar:** Una lista de 10 DDJJ con sus datos

### Query 5: Verificar relación DDJJ-Órdenes
```sql
SELECT 
    dj.numero_ddjj,
    COUNT(ot.id_orden) as cantidad_ordenes
FROM declaracion_jurada dj
LEFT JOIN orden_trabajo ot ON dj.id_ddjj = ot.id_ddjj
GROUP BY dj.id_ddjj, dj.numero_ddjj
ORDER BY cantidad_ordenes DESC
LIMIT 10;
```
**Debe mostrar:** DDJJ con la cantidad de órdenes asociadas (por ahora, cada DDJJ debería tener 1 orden)

---

## ✅ Checklist Final

Marca cada paso cuando lo completes:

- [ ] **Backup creado** antes de empezar
- [ ] **PASO 1 ejecutado** sin errores
- [ ] **PASO 1 verificado** (tabla declaracion_jurada existe)
- [ ] **PASO 2 ejecutado** sin errores
- [ ] **PASO 2 verificado** (DDJJ creadas = órdenes con DDJJ)
- [ ] **PASO 3 completado** (todas las verificaciones pasaron)

---

## 🆘 Si Algo Sale Mal

### Si hay errores en el PASO 1:
- **NO continúes** al PASO 2
- Copia el mensaje de error completo
- Avísame y te ayudo a solucionarlo

### Si hay errores en el PASO 2:
- **NO te preocupes**, los datos originales están seguros
- Copia el mensaje de error completo
- Avísame y te ayudo a solucionarlo
- Podemos ejecutar el script de rollback si es necesario

### Si las verificaciones fallan:
- Revisa los mensajes de error
- Compara los números obtenidos
- Avísame qué query falló y qué resultado obtuviste

---

## 📞 Resumen Visual

```
┌─────────────────────────────────────┐
│  1. HACER BACKUP                    │
│     (Database → Backups)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. EJECUTAR                        │
│     restructurar_ddjj_ordenes_     │
│     trabajo.sql                     │
│     (SQL Editor → New query)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. VERIFICAR PASO 1                │
│     SELECT COUNT(*) FROM            │
│     declaracion_jurada;             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. EJECUTAR                        │
│     migracion_datos_ddjj.sql        │
│     (SQL Editor → New query)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. VERIFICAR PASO 2                │
│     (Queries de verificación)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ✅ MIGRACIÓN COMPLETA              │
└─────────────────────────────────────┘
```

---

## 🎯 Siguiente Paso (Después de la Migración)

Una vez que la migración esté completa y verificada, necesitarás:

1. Actualizar el código de la aplicación para trabajar con la nueva estructura
2. Probar que todo funciona correctamente
3. (Opcional) Agrupar múltiples órdenes en una misma DDJJ

Pero primero, **completa la migración de la base de datos** siguiendo estos pasos.

---

¿Listo para empezar? 🚀

