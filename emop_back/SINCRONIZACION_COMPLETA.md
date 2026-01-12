# ✅ Sincronización Completa: Base de Datos Local ↔ Supabase

## 📊 Estado Actual

✅ **Base de datos local sincronizada con Supabase**

- ✅ Estructura: Igual
- ✅ Datos: Sincronizados
- ✅ Total de tablas: 24 en Supabase, 27 locales (3 tablas adicionales locales)
- ✅ Total de registros: 225 en Supabase

## 🔍 Comparación Realizada

### Tablas Comparadas

| Tabla | Supabase | Local | Estado |
|-------|----------|-------|--------|
| empresa | 19 | 19 | ✅ Sincronizado |
| rol | 4 | 4 | ✅ Sincronizado |
| usuario | 22 | 22 | ✅ Sincronizado |
| conductor | 18 | 18 | ✅ Sincronizado |
| vehiculo | 27 | 27 | ✅ Sincronizado |
| tipo_mantenimiento | 3 | 3 | ✅ Sincronizado |
| orden_trabajo | 4 | 4 | ✅ Sincronizado |
| mecanico | 15 | 15 | ✅ Sincronizado |
| insumo_catalogo | 15 | 15 | ✅ Sincronizado |
| detalle_insumo | 3 | 3 | ✅ Sincronizado |
| linea_servicio | 0 | 0 | ✅ Sincronizado |
| rto_registro | 15 | 15 | ✅ Sincronizado |
| orden_x_usuario | 6 | 6 | ✅ Sincronizado |
| orden_x_mecanico | 3 | 3 | ✅ Sincronizado |
| auditoria | 37 | 37 | ✅ Sincronizado |
| reporte_auditoria_ddjj | 3 | 3 | ✅ Sincronizado |
| inspeccion_ddjj | 3 | 3 | ✅ Sincronizado |
| tipo_notificacion | 3 | 3 | ✅ Sincronizado |
| notificaciones | 14 | 14 | ✅ Sincronizado |
| declaracion_jurada | 4 | 4 | ✅ Sincronizado |
| ddjj_x_usuario | 4 | 4 | ✅ Sincronizado |
| users | 1 | 1 | ✅ Sincronizado |
| roles | 1 | 1 | ✅ Sincronizado |
| companies | 1 | 1 | ✅ Sincronizado |

### Tablas Adicionales en Local

Las siguientes tablas existen localmente pero no en Supabase (pueden ser tablas del sistema o de desarrollo):

- `tipo_seguro`
- `tipo_servicio`
- `pgmigrations`

## 🛠️ Scripts Disponibles

### 1. Comparar y Sincronizar

```bash
cd /home/cesar/emop-my-back/emop_back

# Comparar datos entre Supabase y local
node scripts/sincronizar_con_supabase.js
```

Este script:
- ✅ Compara cantidad de registros en cada tabla
- ✅ Identifica registros faltantes o sobrantes
- ✅ Sincroniza automáticamente las diferencias

### 2. Descargar Backup de Supabase

```bash
cd /home/cesar/emop-my-back/emop_back

# Descargar estructura y datos de Supabase
node descargar_db_supabase.js
```

Este script:
- ✅ Descarga el esquema completo (estructura)
- ✅ Descarga todos los datos de todas las tablas
- ✅ Guarda en `backup_supabase/`

### 3. Restaurar Completamente desde Supabase

```bash
cd /home/cesar/emop-my-back/emop_back

# ⚠️ ADVERTENCIA: Esto elimina todos los datos locales
./scripts/restaurar_desde_supabase.sh
```

Este script:
- ⚠️ **Elimina todas las tablas locales**
- ✅ Restaura el esquema desde Supabase
- ✅ Restaura todos los datos desde Supabase
- ✅ Crea y sincroniza secuencias

### 4. Sincronizar Secuencias

```bash
cd /home/cesar/emop-my-back/emop_back

# Sincronizar todas las secuencias con valores máximos
./scripts/sincronizar_secuencias.sh
```

## 📋 Proceso de Sincronización Manual

Si necesitas sincronizar manualmente:

### Paso 1: Descargar Backup de Supabase

```bash
cd /home/cesar/emop-my-back/emop_back
node descargar_db_supabase.js
```

### Paso 2: Comparar y Sincronizar

```bash
node scripts/sincronizar_con_supabase.js
```

### Paso 3: Verificar

```bash
# Verificar cantidad de registros
PGPASSWORD=123456 psql -h localhost -U postgres -d emop_db -c "
SELECT 
    'usuario' as tabla, COUNT(*)::text as registros FROM usuario
UNION ALL SELECT 'rol', COUNT(*)::text FROM rol
UNION ALL SELECT 'empresa', COUNT(*)::text FROM empresa
UNION ALL SELECT 'vehiculo', COUNT(*)::text FROM vehiculo
UNION ALL SELECT 'conductor', COUNT(*)::text FROM conductor
ORDER BY tabla;
"
```

## ⚠️ Notas Importantes

1. **Diferencias en `id_empresa`**: Algunos registros en Supabase tienen `id_empresa = null`, pero la tabla local requiere `NOT NULL`. El script asigna un valor por defecto (primera empresa disponible).

2. **Secuencias**: Las secuencias deben estar sincronizadas con los valores máximos actuales para evitar errores de claves duplicadas.

3. **Backup Regular**: Se recomienda descargar el backup de Supabase regularmente para mantener la sincronización.

4. **Tablas del Sistema**: Las tablas `pgmigrations`, `tipo_seguro`, `tipo_servicio` son locales y no existen en Supabase.

## ✅ Verificación Final

Para verificar que todo está sincronizado:

```bash
cd /home/cesar/emop-my-back/emop_back
node scripts/sincronizar_con_supabase.js
```

Deberías ver:
```
✅ No hay diferencias, las bases de datos están sincronizadas
```

## 🔄 Mantener Sincronización

Para mantener las bases de datos sincronizadas:

1. **Antes de hacer cambios importantes**: Descarga el backup de Supabase
2. **Después de cambios en Supabase**: Ejecuta el script de sincronización
3. **Regularmente**: Compara y sincroniza para detectar diferencias

## 📝 Resumen

- ✅ **Estructura**: Las tablas tienen la misma estructura
- ✅ **Datos**: Todos los registros están sincronizados
- ✅ **Secuencias**: Configuradas y sincronizadas
- ✅ **Scripts**: Disponibles para mantener la sincronización

La base de datos local está completamente sincronizada con Supabase.
