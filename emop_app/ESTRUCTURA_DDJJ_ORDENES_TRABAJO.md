# Estructura DDJJ - Órdenes de Trabajo

## Resumen del Cambio

Se ha modificado la estructura de la base de datos para permitir que **una Declaración Jurada (DDJJ) pueda contener una o más órdenes de trabajo**, estableciendo una relación **1:N** (uno a muchos).

## Estructura Anterior vs Nueva

### ❌ Estructura Anterior (1:1)
```
orden_trabajo (DDJJ)
    └── Una orden de trabajo = Una DDJJ
```

### ✅ Estructura Nueva (1:N)
```
declaracion_jurada (DDJJ)
    ├── orden_trabajo 1
    ├── orden_trabajo 2
    ├── orden_trabajo 3
    └── ...
```

## Tablas Modificadas y Creadas

### 1. Nueva Tabla: `declaracion_jurada`

**Propósito**: Representa la Declaración Jurada principal que puede contener múltiples órdenes de trabajo.

**Campos principales**:
- `id_ddjj` (PK): Identificador único de la DDJJ
- `numero_ddjj` (UNIQUE): Número único de la Declaración Jurada
- `id_empresa` (FK): Empresa a la que pertenece la DDJJ
- `fecha_creacion`: Fecha de creación
- `fecha_vencimiento`: Fecha de vencimiento
- `estado`: Estado (Pendiente, En Proceso, Completada, Cancelada)
- `observaciones`: Observaciones generales

### 2. Tabla Modificada: `orden_trabajo`

**Cambio**: Se agregó la columna `id_ddjj` (FK a `declaracion_jurada`).

**Relación**:
- Una orden de trabajo **pertenece a** una DDJJ (opcional, nullable para compatibilidad)
- Una DDJJ **tiene** múltiples órdenes de trabajo

**Campos relevantes**:
- `id_orden` (PK): Identificador único de la orden
- `id_ddjj` (FK, nullable): ID de la DDJJ a la que pertenece
- `id_vehiculo`, `id_conductor`, `nro_orden_trabajo`, etc. (campos existentes)

### 3. Tabla Modificada: `inspeccion_ddjj`

**Cambio**: Se agregó la columna `id_ddjj` (FK a `declaracion_jurada`).

**Relación**:
- Una inspección puede referenciar:
  - **Directamente a la DDJJ** (`id_ddjj`) - Referencia principal
  - **A una orden específica** (`id_orden_trabajo`) - Para granularidad

**Campos relevantes**:
- `id_inspeccion` (PK)
- `id_ddjj` (FK, nuevo): Referencia a la DDJJ inspeccionada
- `id_orden_trabajo` (FK, existente): Referencia a la orden específica (opcional)

### 4. Tabla Modificada: `reporte_auditoria_ddjj`

**Cambio**: Se agregó la columna `id_ddjj` (FK a `declaracion_jurada`).

**Relación**: Similar a `inspeccion_ddjj`, puede referenciar tanto la DDJJ como una orden específica.

**Campos relevantes**:
- `id_reporte` (PK)
- `id_ddjj` (FK, nuevo): Referencia a la DDJJ auditada
- `id_orden_trabajo` (FK, existente): Referencia a la orden específica (opcional)

### 5. Nueva Tabla: `ddjj_x_usuario`

**Propósito**: Relación entre DDJJ y usuarios (inspectores/auditores).

**Relación**:
- Una DDJJ puede tener múltiples usuarios asignados
- Un usuario puede estar asignado a múltiples DDJJ
- Relación **N:M** con tipo de asignación (Inspector/Auditor)

**Campos**:
- `id` (PK)
- `id_ddjj` (FK): ID de la DDJJ
- `id_usuario` (FK): ID del usuario
- `tipo_asignacion`: 'Inspector' o 'Auditor'
- Constraint UNIQUE: `(id_ddjj, id_usuario, tipo_asignacion)`

## Diagrama de Relaciones

```
declaracion_jurada (1)
    │
    ├── orden_trabajo (N) [id_ddjj]
    │       │
    │       ├── orden_x_mecanico (N:M)
    │       ├── detalle_insumo (1:N)
    │       └── orden_x_usuario (N:M) [legacy, puede migrarse a ddjj_x_usuario]
    │
    ├── inspeccion_ddjj (N) [id_ddjj]
    │       └── id_orden_trabajo (FK opcional)
    │
    ├── reporte_auditoria_ddjj (N) [id_ddjj]
    │       └── id_orden_trabajo (FK opcional)
    │
    └── ddjj_x_usuario (N:M)
            └── tipo_asignacion (Inspector/Auditor)
```

## Flujo de Trabajo Propuesto

### 1. Creación de DDJJ
1. Se crea una nueva `declaracion_jurada` con número único
2. Se asigna a una empresa
3. Estado inicial: "Pendiente"

### 2. Agregar Órdenes de Trabajo a la DDJJ
1. Al crear una orden de trabajo, se asigna a una DDJJ existente (`id_ddjj`)
2. Una DDJJ puede tener múltiples órdenes de trabajo
3. Cada orden mantiene su información específica (vehículo, conductor, etc.)

### 3. Asignación de Inspectores/Auditores
1. Se asignan usuarios a la DDJJ mediante `ddjj_x_usuario`
2. Se especifica el tipo: "Inspector" o "Auditor"
3. Los usuarios pueden ver todas las órdenes de trabajo de la DDJJ asignada

### 4. Inspección
1. El inspector realiza la inspección de la DDJJ
2. Se registra en `inspeccion_ddjj` con referencia a `id_ddjj`
3. Opcionalmente, puede especificar `id_orden_trabajo` para inspecciones granulares

### 5. Auditoría
1. El auditor revisa la DDJJ completa
2. Se registra en `reporte_auditoria_ddjj` con referencia a `id_ddjj`
3. Puede comparar todas las órdenes de trabajo de la DDJJ

## Migración de Datos Existentes

El script SQL incluye secciones opcionales (comentadas) para migrar datos existentes:

1. **Migración de órdenes de trabajo**: Crea DDJJ individuales para cada orden existente
2. **Migración de inspecciones**: Actualiza `inspeccion_ddjj` para referenciar la DDJJ
3. **Migración de reportes**: Actualiza `reporte_auditoria_ddjj` para referenciar la DDJJ
4. **Migración de asignaciones**: Migra asignaciones de `orden_x_usuario` a `ddjj_x_usuario`

**Nota**: Estas migraciones son opcionales y deben ejecutarse según necesidad.

## Consideraciones Importantes

### Compatibilidad hacia atrás
- La columna `id_ddjj` en `orden_trabajo` es **nullable**, permitiendo órdenes sin DDJJ durante la transición
- Las tablas `inspeccion_ddjj` y `reporte_auditoria_ddjj` mantienen `id_orden_trabajo` para compatibilidad

### Integridad Referencial
- `ON DELETE SET NULL`: Si se elimina una DDJJ, las órdenes de trabajo no se eliminan, solo se desvinculan
- `ON DELETE CASCADE`: Si se elimina una DDJJ, se eliminan las inspecciones y reportes asociados

### Consultas Recomendadas

**Obtener todas las órdenes de una DDJJ**:
```sql
SELECT ot.*
FROM orden_trabajo ot
WHERE ot.id_ddjj = :id_ddjj;
```

**Obtener la DDJJ de una orden**:
```sql
SELECT dj.*
FROM declaracion_jurada dj
INNER JOIN orden_trabajo ot ON dj.id_ddjj = ot.id_ddjj
WHERE ot.id_orden = :id_orden;
```

**Obtener todas las DDJJ asignadas a un usuario**:
```sql
SELECT dj.*
FROM declaracion_jurada dj
INNER JOIN ddjj_x_usuario dxu ON dj.id_ddjj = dxu.id_ddjj
WHERE dxu.id_usuario = :id_usuario;
```

## Próximos Pasos

1. ✅ Ejecutar el script SQL `restructurar_ddjj_ordenes_trabajo.sql`
2. ⏳ Actualizar el código de la aplicación para trabajar con la nueva estructura
3. ⏳ Migrar datos existentes (opcional)
4. ⏳ Actualizar formularios y vistas para reflejar la nueva relación
5. ⏳ Actualizar reportes y consultas

