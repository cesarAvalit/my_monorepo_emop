# ✅ Solución: Error "duplicate key value violates unique constraint auditoria_pkey"

## 🐛 Problema

Al intentar registrar una auditoría, se producía el error:

```
Error de conexión al registrar auditoría: error: duplicate key value violates unique constraint "auditoria_pkey"
detail: 'Key (id_auditoria)=(1) already exists.'
```

## 🔍 Causa

El problema tenía dos causas:

1. **Secuencia desincronizada**: La secuencia `auditoria_id_auditoria_seq` estaba en el valor `1`, pero la tabla ya tenía registros con IDs hasta `37`. Esto causaba que la secuencia intentara generar el ID `1` que ya existía.

2. **Código no eliminaba `id_auditoria`**: El código en `insertIntoTable` no estaba eliminando `id_auditoria` de los datos antes de insertar, lo que podría causar conflictos si el ID viene en los datos.

## ✅ Solución

### 1. Sincronización de Secuencias

Se sincronizó la secuencia con el valor máximo actual:

```sql
-- Sincronizar la secuencia con el MAX actual
SELECT setval('auditoria_id_auditoria_seq', 
    COALESCE((SELECT MAX(id_auditoria) FROM auditoria), 0) + 1, 
    false);
```

### 2. Actualización del Código

Se actualizó `dbHelpers.js` para eliminar `id_auditoria` antes de insertar:

```javascript
// Ahora elimina id_auditoria si viene en los datos
if (tableName === 'auditoria' && dataToInsert.id_auditoria !== undefined) {
  delete dataToInsert.id_auditoria;
}
```

Además, se agregaron las eliminaciones para otras tablas con secuencias:
- `auditoria.id_auditoria`
- `vehiculo.id_vehiculo`
- `mecanico.id_mecanico`
- `orden_trabajo.id_orden`
- `tipo_mantenimiento.id_tipo`
- `insumo_catalogo.id_insumo`
- `linea_servicio.id_linea_servicio`
- `rol.id_rol`
- `rto_registro.id_rto`

## 🛠️ Script de Sincronización

Se creó un script para sincronizar todas las secuencias automáticamente:

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/sincronizar_secuencias.sh
```

Este script:
1. Encuentra todas las columnas con secuencias (DEFAULT con `nextval`)
2. Obtiene el valor máximo actual de cada tabla
3. Sincroniza cada secuencia con su valor máximo
4. Evita errores de claves duplicadas

## 📝 Verificación

Para verificar que las secuencias están sincronizadas:

```sql
-- Ver el estado de la secuencia de auditoría
SELECT last_value, is_called 
FROM auditoria_id_auditoria_seq;

-- Ver el siguiente ID que se generará
SELECT nextval('auditoria_id_auditoria_seq');

-- Comparar con el MAX actual
SELECT 
    (SELECT last_value FROM auditoria_id_auditoria_seq) as secuencia,
    (SELECT MAX(id_auditoria) FROM auditoria) as max_actual;
```

## 🎯 Resultado

Ahora cuando se registra una auditoría:

```javascript
// El código elimina id_auditoria si viene en los datos
delete dataToInsert.id_auditoria;

// PostgreSQL genera automáticamente el siguiente ID disponible (38, 39, etc.)
await insertIntoTable('auditoria', auditoriaData);
```

El registro se inserta correctamente con un `id_auditoria` automático generado por la secuencia sincronizada.

## ⚠️ Notas Importantes

1. **Sincronización periódica**: Si se importan datos o se hacen cambios manuales, ejecuta el script de sincronización:
   ```bash
   ./scripts/sincronizar_secuencias.sh
   ```

2. **Tablas con PRIMARY KEY compuestas**: Las tablas con PRIMARY KEY compuestas (como `detalle_insumo`, `orden_x_mecanico`) no necesitan secuencias porque todos los valores de la clave deben proporcionarse.

3. **Prevención futura**: El código ahora elimina automáticamente los IDs de las tablas con secuencias, evitando conflictos.

## ✅ Estado Final

- ✅ Secuencia `auditoria_id_auditoria_seq` sincronizada con MAX(id_auditoria) = 37
- ✅ El siguiente ID disponible es 38
- ✅ Código actualizado para eliminar `id_auditoria` antes de insertar
- ✅ Script de sincronización creado para todas las secuencias
- ✅ Las inserciones ahora funcionan correctamente sin errores de clave duplicada

