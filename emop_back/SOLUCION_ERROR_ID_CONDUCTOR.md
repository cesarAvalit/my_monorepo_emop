# ✅ Solución: Error "null value in column id_conductor violates not-null constraint"

## 🐛 Problema

Al intentar insertar un registro en la tabla `conductor`, se producía el error:

```json
{
    "error": "null value in column \"id_conductor\" of relation \"conductor\" violates not-null constraint"
}
```

## 🔍 Causa

La tabla `conductor` tenía la columna `id_conductor` configurada como:
- `NOT NULL` (no puede ser nula)
- Sin valor `DEFAULT` (no tenía un valor por defecto)
- Sin secuencia (no tenía una secuencia automática)

El código en `dbHelpers.js` eliminaba `id_conductor` antes de insertar (para permitir que la base de datos genere el ID automáticamente), pero como no había una secuencia o DEFAULT, PostgreSQL no podía generar el ID automáticamente.

## ✅ Solución

Se creó una secuencia para `id_conductor` y se configuró como DEFAULT:

```sql
-- Crear secuencia
CREATE SEQUENCE IF NOT EXISTS conductor_id_conductor_seq;

-- Sincronizar con el valor máximo actual
SELECT setval('conductor_id_conductor_seq', 
    COALESCE((SELECT MAX(id_conductor) FROM conductor), 0), true);

-- Asignar como DEFAULT
ALTER TABLE conductor 
ALTER COLUMN id_conductor 
SET DEFAULT nextval('conductor_id_conductor_seq');
```

## 🛠️ Correcciones Aplicadas

Además de `conductor`, se crearon secuencias para todas las PRIMARY KEYS simples que no tenían DEFAULT:

- ✅ `empresa.id_empresa`
- ✅ `conductor.id_conductor`
- ✅ `vehiculo.id_vehiculo`
- ✅ `mecanico.id_mecanico`
- ✅ `orden_trabajo.id_orden`
- ✅ `tipo_mantenimiento.id_tipo`
- ✅ `insumo_catalogo.id_insumo`
- ✅ `linea_servicio.id_linea_servicio`

**Nota**: Las PRIMARY KEYS compuestas (como `detalle_insumo` y `orden_x_mecanico`) no necesitan secuencias porque siempre deben proporcionarse todos los valores de la clave.

## 📝 Verificación

Para verificar que la secuencia está funcionando:

```sql
-- Ver el DEFAULT de la columna
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'conductor' 
AND column_name = 'id_conductor';

-- Obtener el siguiente ID que se generará
SELECT nextval('conductor_id_conductor_seq');
```

## 🎯 Resultado

Ahora cuando se inserta un registro en `conductor` sin especificar `id_conductor`:

```javascript
// El código elimina id_conductor si existe
delete dataToInsert.id_conductor;

// PostgreSQL automáticamente genera el siguiente ID usando la secuencia
INSERT INTO conductor (nombre, apellido, ...) 
VALUES ('Juan', 'Pérez', ...)
RETURNING *;  // Retorna el registro con id_conductor generado
```

El registro se inserta correctamente con un `id_conductor` automático generado por la secuencia.

## 🔧 Script de Corrección

Se creó el script `/emop_back/scripts/fix_sequences.sql` que:

1. Identifica todas las PRIMARY KEYS simples sin DEFAULT
2. Crea secuencias para cada una
3. Sincroniza el valor de la secuencia con el MAX actual
4. Asigna la secuencia como DEFAULT

Para ejecutarlo manualmente:

```bash
cd /home/cesar/emop-my-back/emop_back
PGPASSWORD=123456 psql -h localhost -U postgres -d emop_db -f scripts/fix_sequences.sql
```

## ✅ Estado Final

- ✅ `conductor.id_conductor` tiene secuencia y DEFAULT configurado
- ✅ Todas las PRIMARY KEYS simples tienen secuencias
- ✅ Las inserciones ahora funcionan correctamente sin especificar el ID
- ✅ El código en `dbHelpers.js` puede eliminar los IDs antes de insertar sin problemas

