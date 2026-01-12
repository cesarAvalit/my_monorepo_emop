# Diagrama de Entidad-Relación (DER) - Sistema EMOP

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
    USUARIO ||--o{ ORDEN_X_USUARIO : "asignado"
    
    MECANICO ||--o{ ORDEN_X_MECANICO : "trabaja"
    
    INSUMO_CATALOGO ||--o{ DETALLE_INSUMO : "referenciado"
    
    ROL ||--o{ USUARIO : "asignado"
    
    USUARIO ||--o{ AUDITORIA : "genera"
    
    LINEA_SERVICIO ||--o{ VEHICULO : "asignada"

    EMPRESA {
        int id_empresa PK
        string nombre_empresa
        string cuit
        int id_grupo
    }

    VEHICULO {
        int id PK
        int id_vehiculo PK
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
        date fecha_vencimiento_seguro
        date fecha_ultima_rto
        int id_conductor_activo FK
        boolean activo
        boolean posee_ac
        boolean posee_camara
        json equipamiento_atributos
    }

    CONDUCTOR {
        int id_conductor PK
        int id_empresa FK
        string nombre
        string apellido
        string numero_licencia
        date fecha_vencimiento_licencia
        string dni
        string telefono
        boolean activo
    }

    ORDEN_TRABAJO {
        int id_orden PK
        int id_vehiculo FK
        int id_conductor FK
        int id_tipo_mantenimiento FK
        string nro_orden_trabajo
        date fecha_generacion
        date fecha_egreso
        int odometro
        int horometro
        string estado
    }

    TIPO_MANTENIMIENTO {
        int id_tipo_mantenimiento PK
        string nombre
        string descripcion
    }

    MECANICO {
        int id_mecanico PK
        int id_empresa FK
        string nombre
        string apellido
        string especialidad
        boolean activo
    }

    ORDEN_X_MECANICO {
        int id_orden FK
        int id_mecanico FK
    }

    ORDEN_X_USUARIO {
        int id PK
        int id_orden_trabajo FK
        int id_usuario FK
    }

    INSUMO_CATALOGO {
        int id_insumo PK
        string codigo_inventario
        string descripcion
    }

    DETALLE_INSUMO {
        int id_detalle PK
        int id_orden FK
        int id_insumo FK
        int cantidad
        decimal precio_unitario
    }

    ROL {
        int id_rol PK
        string nombre
    }

    USUARIO {
        int id_usuario PK
        string username
        string email
        string password_hash
        boolean activo
        int id_rol FK
        int id_empresa FK "nullable"
        string nombre_completo
        string dni
        string telefono
    }

    RTO_REGISTRO {
        int id_rto PK
        int id_vehiculo FK
        date fecha_vencimiento
        date fecha_emision
        string numero_certificado
    }

    LINEA_SERVICIO {
        int id_linea PK
        string nombre_linea
        string descripcion
    }

    AUDITORIA {
        int id_auditoria PK
        datetime fecha_hora
        string usuario_nombre
        int id_registro
        string tipo_registro
        string accion
        string detalle
        int id_usuario_ref FK
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

5. **CONDUCTOR → VEHICULO** (1:N)
   - Un conductor puede estar asignado a múltiples vehículos (conductor activo)
   - Clave foránea: `vehiculo.id_conductor_activo`

7. **CONDUCTOR → ORDEN_TRABAJO** (1:N)
   - Un conductor puede tener múltiples órdenes de trabajo asignadas
   - Clave foránea: `orden_trabajo.id_conductor`

8. **VEHICULO → ORDEN_TRABAJO** (1:N)
   - Un vehículo puede tener múltiples órdenes de trabajo
   - Clave foránea: `orden_trabajo.id_vehiculo`

9. **VEHICULO → RTO_REGISTRO** (1:N)
   - Un vehículo puede tener múltiples registros RTO
   - Clave foránea: `rto_registro.id_vehiculo`

10. **TIPO_MANTENIMIENTO → ORDEN_TRABAJO** (1:N)
    - Un tipo de mantenimiento puede clasificar múltiples órdenes
    - Clave foránea: `orden_trabajo.id_tipo_mantenimiento`

11. **ORDEN_TRABAJO → ORDEN_X_MECANICO** (1:N)
    - Una orden de trabajo puede tener múltiples mecánicos asignados (relación muchos a muchos)
    - Tabla intermedia: `orden_x_mecanico`

12. **MECANICO → ORDEN_X_MECANICO** (1:N)
    - Un mecánico puede trabajar en múltiples órdenes (relación muchos a muchos)
    - Tabla intermedia: `orden_x_mecanico`

13. **ORDEN_TRABAJO → DETALLE_INSUMO** (1:N)
    - Una orden de trabajo puede utilizar múltiples insumos
    - Clave foránea: `detalle_insumo.id_orden`

14. **INSUMO_CATALOGO → DETALLE_INSUMO** (1:N)
    - Un insumo del catálogo puede ser utilizado en múltiples detalles
    - Clave foránea: `detalle_insumo.id_insumo`

15. **ROL → USUARIO** (1:N)
    - Un rol puede ser asignado a múltiples usuarios
    - Clave foránea: `usuario.id_rol`

16. **USUARIO → AUDITORIA** (1:N)
    - Un usuario puede generar múltiples registros de auditoría
    - Clave foránea: `auditoria.id_usuario_ref`

17. **ORDEN_TRABAJO → AUDITORIA** (1:N)
    - Una orden de trabajo puede tener múltiples registros de auditoría
    - Clave foránea: `auditoria.id_mantenimiento_ref` (nullable)

18. **LINEA_SERVICIO → VEHICULO** (1:N)
    - Una línea de servicio puede tener múltiples vehículos asignados
    - Relación implícita a través de atributos del vehículo

19. **ORDEN_TRABAJO → ORDEN_X_USUARIO** (1:N)
    - Una orden de trabajo puede tener múltiples usuarios asignados (inspector, auditor, etc.)
    - Tabla intermedia: `orden_x_usuario`
    - Clave foránea: `orden_x_usuario.id_orden_trabajo`
    - Cada registro representa la asignación de un usuario específico a una orden de trabajo
    - El rol del usuario (inspector, auditor, etc.) se determina por su `id_rol` en la tabla `USUARIO`

20. **USUARIO → ORDEN_X_USUARIO** (1:N)
    - Un usuario puede ser asignado a múltiples órdenes de trabajo
    - Clave foránea: `orden_x_usuario.id_usuario`
    - La relación permite que un mismo usuario pueda tener diferentes roles en diferentes órdenes
    - El rol específico (inspector, auditor) se identifica mediante la relación del usuario con su `ROL` correspondiente

## Notas Importantes:

- **Claves Primarias (PK)**: Identificadores únicos de cada entidad
- **Claves Foráneas (FK)**: Referencias a otras entidades
- **Nullable**: Campos que pueden ser nulos (opcionales)
- **Relación Muchos a Muchos**: 
  - `ORDEN_TRABAJO` y `MECANICO` se relacionan a través de la tabla intermedia `ORDEN_X_MECANICO`
  - `ORDEN_TRABAJO` y `USUARIO` se relacionan a través de la tabla intermedia `ORDEN_X_USUARIO`
- **Asignación de Usuarios a Órdenes**: 
  - La tabla `ORDEN_X_USUARIO` permite asignar múltiples usuarios a una misma orden de trabajo
  - Cada registro representa una asignación individual (por ejemplo, un inspector y un auditor pueden estar asignados a la misma orden mediante dos registros separados)
  - El rol del usuario (inspector con `id_rol = 3`, auditor con `id_rol = 4`) se determina consultando la tabla `USUARIO` y su relación con `ROL`

## Cómo visualizar este diagrama:

1. **Online**: Copia el código Mermaid y pégalo en [Mermaid Live Editor](https://mermaid.live/)
2. **VS Code**: Instala la extensión "Markdown Preview Mermaid Support"
3. **GitHub/GitLab**: Se renderiza automáticamente en archivos `.md`
4. **Exportar**: Desde Mermaid Live Editor puedes exportar como PNG, SVG o PDF
