# Diagrama de Entidad-Relación (DER) - Sistema EMOP - Supabase

Este diagrama refleja la estructura real de tablas en Supabase según `supabase_schema.sql`.

```mermaid
erDiagram
    EMPRESA ||--o{ VEHICULO : "tiene"
    EMPRESA ||--o{ CONDUCTOR : "emplea"
    EMPRESA ||--o{ MECANICO : "emplea"
    EMPRESA ||--o{ USUARIO : "tiene"
    
    CONDUCTOR ||--o{ VEHICULO : "conduce"
    CONDUCTOR ||--o{ ORDEN_TRABAJO : "asignado"
    
    VEHICULO ||--o{ ORDEN_TRABAJO : "requiere"
    VEHICULO ||--o{ RTO_REGISTRO : "tiene"
    
    TIPO_MANTENIMIENTO ||--o{ ORDEN_TRABAJO : "clasifica"
    
    ORDEN_TRABAJO ||--o{ ORDEN_X_MECANICO : "asignada"
    ORDEN_TRABAJO ||--o{ DETALLE_INSUMO : "utiliza"
    ORDEN_TRABAJO ||--o{ AUDITORIA : "registrada"
    ORDEN_TRABAJO ||--o{ ORDEN_X_USUARIO : "tiene"
    
    MECANICO ||--o{ ORDEN_X_MECANICO : "trabaja"
    
    INSUMO_CATALOGO ||--o{ DETALLE_INSUMO : "referenciado"
    
    ROL ||--o{ USUARIO : "asignado"
    
    USUARIO ||--o{ AUDITORIA : "genera"
    USUARIO ||--o{ ORDEN_X_USUARIO : "asignado"

    EMPRESA {
        int id_empresa PK
        string nombre_empresa
        string cuit UNIQUE
        int id_grupo
    }

    ROL {
        int id_rol PK
        string nombre UNIQUE
    }

    USUARIO {
        int id_usuario PK
        string username UNIQUE
        string email UNIQUE
        string password_hash
        boolean activo
        int id_rol FK
        int id_empresa FK "nullable"
        string nombre_completo
        string dni
        string telefono
        timestamp created_at
        timestamp updated_at
    }

    CONDUCTOR {
        int id_conductor PK
        int id_empresa FK
        string nombre
        string apellido
        string numero_licencia
        timestamp fecha_vencimiento_licencia
        string dni
        string telefono
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    VEHICULO {
        int id PK
        int id_vehiculo UNIQUE
        int id_empresa FK
        string interno
        string matricula
        string marca
        string modelo
        int anio
        int kilometros
        string tipo_servicio
        string nombre_seguro
        string tipo_seguro_cobertura
        timestamp fecha_vencimiento_seguro
        timestamp fecha_ultima_rto
        int id_conductor_activo FK "nullable"
        boolean activo
        boolean posee_ac
        boolean posee_camara
        jsonb equipamiento_atributos
        timestamp created_at
        timestamp updated_at
    }

    TIPO_MANTENIMIENTO {
        int id_tipo PK
        text descripcion
    }

    ORDEN_TRABAJO {
        int id_orden PK
        int id_vehiculo FK
        int id_conductor FK "nullable"
        int id_tipo_mantenimiento FK
        string nro_orden_trabajo UNIQUE
        timestamp fecha_generacion
        timestamp fecha_egreso "nullable"
        int odometro
        int horometro
        string estado
        timestamp created_at
        timestamp updated_at
    }

    MECANICO {
        int id_mecanico PK
        int id_empresa FK
        string nombre
        string apellido "nullable"
        string especialidad
        string dni
        string telefono
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    ORDEN_X_MECANICO {
        int id_orden FK PK
        int id_mecanico FK PK
    }

    INSUMO_CATALOGO {
        int id_insumo PK
        string codigo_inventario UNIQUE
        text descripcion
    }

    DETALLE_INSUMO {
        int id_detalle PK
        int id_detalle_insumo
        int id_orden FK
        int id_insumo FK
        int cantidad
        decimal costo_unitario_historico
        decimal costo_total
        timestamp created_at
    }

    LINEA_SERVICIO {
        int id_linea PK
        string nombre_linea
        text descripcion
    }

    RTO_REGISTRO {
        int id_rto PK
        int id_vehiculo FK
        timestamp fecha_vencimiento
        timestamp fecha_emision
        string numero_certificado
        boolean aprobado
        boolean activo
        timestamp created_at
    }

    ORDEN_X_USUARIO {
        int id PK
        int id_orden_trabajo FK
        int id_usuario FK
        timestamp created_at
        UNIQUE "id_orden_trabajo, id_usuario"
    }

    AUDITORIA {
        int id_auditoria PK
        timestamp fecha_hora
        string usuario_nombre
        int id_registro
        string tipo_registro
        string accion
        text detalle
        int id_usuario_ref FK "nullable"
        int id_mantenimiento_ref FK "nullable"
    }
```

## Descripción de Relaciones

### Relaciones Principales:

1. **EMPRESA → VEHICULO** (1:N)
   - Una empresa puede tener múltiples vehículos
   - Clave foránea: `vehiculo.id_empresa`

2. **EMPRESA → CONDUCTOR** (1:N)
   - Una empresa emplea múltiples conductores
   - Clave foránea: `conductor.id_empresa`

3. **EMPRESA → MECANICO** (1:N)
   - Una empresa emplea múltiples mecánicos
   - Clave foránea: `mecanico.id_empresa`

4. **EMPRESA → USUARIO** (1:N)
   - Una empresa puede tener múltiples usuarios (opcional, nullable)
   - Clave foránea: `usuario.id_empresa` (nullable)
   - Nota: Los usuarios ADMIN, Inspector y Auditor no tienen empresa asignada

5. **ROL → USUARIO** (1:N)
   - Un rol puede ser asignado a múltiples usuarios
   - Clave foránea: `usuario.id_rol`
   - Roles comunes: 1=ADMIN, 2=Empresa, 3=Inspector, 4=Auditor

6. **CONDUCTOR → VEHICULO** (1:N)
   - Un conductor puede estar asignado como conductor activo a múltiples vehículos
   - Clave foránea: `vehiculo.id_conductor_activo` (nullable)

7. **CONDUCTOR → ORDEN_TRABAJO** (1:N)
   - Un conductor puede tener múltiples órdenes de trabajo asignadas
   - Clave foránea: `orden_trabajo.id_conductor` (nullable)

8. **VEHICULO → ORDEN_TRABAJO** (1:N)
   - Un vehículo puede tener múltiples órdenes de trabajo
   - Clave foránea: `orden_trabajo.id_vehiculo`

9. **VEHICULO → RTO_REGISTRO** (1:N)
   - Un vehículo puede tener múltiples registros RTO
   - Clave foránea: `rto_registro.id_vehiculo`

10. **TIPO_MANTENIMIENTO → ORDEN_TRABAJO** (1:N)
    - Un tipo de mantenimiento puede clasificar múltiples órdenes
    - Clave foránea: `orden_trabajo.id_tipo_mantenimiento`
    - Nota: La PK es `id_tipo` (no `id_tipo_mantenimiento`)

11. **ORDEN_TRABAJO ↔ MECANICO** (N:M)
    - Una orden de trabajo puede tener múltiples mecánicos asignados
    - Un mecánico puede trabajar en múltiples órdenes
    - Tabla intermedia: `orden_x_mecanico`
    - Clave compuesta: `(id_orden, id_mecanico)` como PK

12. **ORDEN_TRABAJO → DETALLE_INSUMO** (1:N)
    - Una orden de trabajo puede utilizar múltiples insumos
    - Clave foránea: `detalle_insumo.id_orden`

13. **INSUMO_CATALOGO → DETALLE_INSUMO** (1:N)
    - Un insumo del catálogo puede ser utilizado en múltiples detalles
    - Clave foránea: `detalle_insumo.id_insumo`

14. **ORDEN_TRABAJO ↔ USUARIO** (N:M)
    - Una orden de trabajo puede tener múltiples usuarios asignados (inspector, auditor, etc.)
    - Un usuario puede ser asignado a múltiples órdenes
    - Tabla intermedia: `orden_x_usuario`
    - Constraint UNIQUE: `(id_orden_trabajo, id_usuario)`

15. **USUARIO → AUDITORIA** (1:N)
    - Un usuario puede generar múltiples registros de auditoría
    - Clave foránea: `auditoria.id_usuario_ref` (nullable)

16. **ORDEN_TRABAJO → AUDITORIA** (1:N)
    - Una orden de trabajo puede tener múltiples registros de auditoría
    - Clave foránea: `auditoria.id_mantenimiento_ref` (nullable)

## Notas Importantes:

### Campos Clave:
- **Claves Primarias (PK)**: Identificadores únicos de cada entidad
- **Claves Foráneas (FK)**: Referencias a otras entidades
- **Nullable**: Campos que pueden ser nulos (opcionales)
- **UNIQUE**: Campos con restricción de unicidad

### Relaciones Muchos a Muchos:
- **ORDEN_TRABAJO ↔ MECANICO**: A través de `orden_x_mecanico` (PK compuesta)
- **ORDEN_TRABAJO ↔ USUARIO**: A través de `orden_x_usuario` (con constraint UNIQUE)

### Diferencias con el esquema anterior:
1. `tipo_mantenimiento.id_tipo` es la PK (no `id_tipo_mantenimiento`)
2. `detalle_insumo` usa `costo_unitario_historico` y `costo_total` (no `precio_unitario`)
3. `rto_registro` incluye campos `aprobado` y `activo`
4. `linea_servicio` no tiene relación directa con `vehiculo` en el schema actual
5. `orden_x_usuario` tiene constraint UNIQUE en `(id_orden_trabajo, id_usuario)`

### Tablas Adicionales (Compatibilidad):
- `users`, `roles`, `companies`: Tablas opcionales para compatibilidad con autenticación personalizada

### Campos de Auditoría:
- Todas las tablas principales incluyen `created_at` y `updated_at` (excepto tablas pivot)
- Triggers automáticos actualizan `updated_at` en modificaciones

## Cómo visualizar este diagrama:

1. **Online**: Copia el código Mermaid y pégalo en [Mermaid Live Editor](https://mermaid.live/)
2. **VS Code**: Instala la extensión "Markdown Preview Mermaid Support"
3. **GitHub/GitLab**: Se renderiza automáticamente en archivos `.md`
4. **Exportar**: Desde Mermaid Live Editor puedes exportar como PNG, SVG o PDF

## Índices en Supabase:

El esquema incluye índices optimizados en:
- Claves foráneas principales
- Campos de búsqueda frecuente (matrícula, interno, email, username, etc.)
- Campos de estado y filtrado (estado de orden, activo, etc.)

