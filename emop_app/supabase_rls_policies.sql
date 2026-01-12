-- =====================================================
-- Script de Habilitación de RLS y Políticas
-- Sistema EMOP - Supabase
-- =====================================================
-- 
-- Este script habilita Row Level Security (RLS) en todas las tablas
-- y crea políticas que permiten operaciones CRUD según el rol del usuario
--
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE mecanico ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_x_mecanico ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumo_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE linea_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_x_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. FUNCIÓN HELPER: Obtener ID de empresa del usuario
-- =====================================================

CREATE OR REPLACE FUNCTION auth.user_empresa_id()
RETURNS INTEGER AS $$
  SELECT id_empresa FROM usuario WHERE id_usuario = auth.uid()::integer;
$$ LANGUAGE SQL STABLE;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION auth.user_rol_id()
RETURNS INTEGER AS $$
  SELECT id_rol FROM usuario WHERE id_usuario = auth.uid()::integer;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 3. POLÍTICAS PARA TABLA: empresa
-- =====================================================

-- SELECT: Todos los usuarios autenticados pueden leer empresas
CREATE POLICY "empresa_select_all" ON empresa
  FOR SELECT
  USING (true);

-- INSERT: Solo ADMIN puede crear empresas
CREATE POLICY "empresa_insert_admin" ON empresa
  FOR INSERT
  WITH CHECK (auth.user_rol_id() = 1);

-- UPDATE: Solo ADMIN puede actualizar empresas
CREATE POLICY "empresa_update_admin" ON empresa
  FOR UPDATE
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- DELETE: Solo ADMIN puede eliminar empresas
CREATE POLICY "empresa_delete_admin" ON empresa
  FOR DELETE
  USING (auth.user_rol_id() = 1);

-- =====================================================
-- 4. POLÍTICAS PARA TABLA: rol
-- =====================================================

-- SELECT: Todos los usuarios autenticados pueden leer roles
CREATE POLICY "rol_select_all" ON rol
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo ADMIN
CREATE POLICY "rol_modify_admin" ON rol
  FOR ALL
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- =====================================================
-- 5. POLÍTICAS PARA TABLA: usuario
-- =====================================================

-- SELECT: 
-- - ADMIN puede ver todos
-- - Usuarios Empresa pueden ver usuarios de su empresa
-- - Inspector/Auditor pueden ver todos
CREATE POLICY "usuario_select" ON usuario
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR  -- ADMIN ve todos
    auth.user_rol_id() = 3 OR  -- Inspector ve todos
    auth.user_rol_id() = 4 OR  -- Auditor ve todos
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())  -- Empresa ve su empresa
  );

-- INSERT: ADMIN puede crear usuarios
CREATE POLICY "usuario_insert_admin" ON usuario
  FOR INSERT
  WITH CHECK (auth.user_rol_id() = 1);

-- UPDATE: 
-- - ADMIN puede actualizar todos
-- - Usuarios pueden actualizar su propio perfil
CREATE POLICY "usuario_update" ON usuario
  FOR UPDATE
  USING (
    auth.user_rol_id() = 1 OR  -- ADMIN actualiza todos
    id_usuario = auth.uid()::integer  -- Usuario actualiza su perfil
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    id_usuario = auth.uid()::integer
  );

-- DELETE: Solo ADMIN puede eliminar usuarios
CREATE POLICY "usuario_delete_admin" ON usuario
  FOR DELETE
  USING (auth.user_rol_id() = 1);

-- =====================================================
-- 6. POLÍTICAS PARA TABLA: conductor
-- =====================================================

-- SELECT:
-- - ADMIN, Inspector, Auditor ven todos
-- - Usuarios Empresa ven solo conductores de su empresa
CREATE POLICY "conductor_select" ON conductor
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR  -- ADMIN
    auth.user_rol_id() = 3 OR  -- Inspector
    auth.user_rol_id() = 4 OR  -- Auditor
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())  -- Empresa ve su empresa
  );

-- INSERT:
-- - ADMIN puede crear en cualquier empresa
-- - Usuarios Empresa solo pueden crear en su empresa
CREATE POLICY "conductor_insert" ON conductor
  FOR INSERT
  WITH CHECK (
    auth.user_rol_id() = 1 OR  -- ADMIN
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())  -- Empresa solo su empresa
  );

-- UPDATE:
-- - ADMIN puede actualizar todos
-- - Usuarios Empresa solo pueden actualizar conductores de su empresa
CREATE POLICY "conductor_update" ON conductor
  FOR UPDATE
  USING (
    auth.user_rol_id() = 1 OR  -- ADMIN
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())  -- Empresa solo su empresa
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- DELETE:
-- - ADMIN puede eliminar todos
-- - Usuarios Empresa solo pueden eliminar conductores de su empresa
CREATE POLICY "conductor_delete" ON conductor
  FOR DELETE
  USING (
    auth.user_rol_id() = 1 OR  -- ADMIN
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())  -- Empresa solo su empresa
  );

-- =====================================================
-- 7. POLÍTICAS PARA TABLA: vehiculo
-- =====================================================

-- SELECT:
-- - ADMIN, Inspector, Auditor ven todos
-- - Usuarios Empresa ven solo vehículos de su empresa
CREATE POLICY "vehiculo_select" ON vehiculo
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- INSERT:
-- - ADMIN puede crear en cualquier empresa
-- - Usuarios Empresa solo pueden crear en su empresa
CREATE POLICY "vehiculo_insert" ON vehiculo
  FOR INSERT
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- UPDATE:
-- - ADMIN puede actualizar todos
-- - Usuarios Empresa solo pueden actualizar vehículos de su empresa
CREATE POLICY "vehiculo_update" ON vehiculo
  FOR UPDATE
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- DELETE:
-- - ADMIN puede eliminar todos
-- - Usuarios Empresa solo pueden eliminar vehículos de su empresa
CREATE POLICY "vehiculo_delete" ON vehiculo
  FOR DELETE
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- =====================================================
-- 8. POLÍTICAS PARA TABLA: tipo_mantenimiento
-- =====================================================

-- SELECT: Todos pueden leer
CREATE POLICY "tipo_mantenimiento_select_all" ON tipo_mantenimiento
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo ADMIN
CREATE POLICY "tipo_mantenimiento_modify_admin" ON tipo_mantenimiento
  FOR ALL
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- =====================================================
-- 9. POLÍTICAS PARA TABLA: orden_trabajo
-- =====================================================

-- SELECT:
-- - ADMIN, Inspector, Auditor ven todas
-- - Usuarios Empresa ven solo órdenes de vehículos de su empresa
CREATE POLICY "orden_trabajo_select" ON orden_trabajo
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = orden_trabajo.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- INSERT:
-- - ADMIN puede crear todas
-- - Usuarios Empresa solo pueden crear órdenes para vehículos de su empresa
CREATE POLICY "orden_trabajo_insert" ON orden_trabajo
  FOR INSERT
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = orden_trabajo.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- UPDATE:
-- - ADMIN puede actualizar todas
-- - Usuarios Empresa solo pueden actualizar órdenes de vehículos de su empresa
-- - Inspector/Auditor pueden actualizar órdenes asignadas
CREATE POLICY "orden_trabajo_update" ON orden_trabajo
  FOR UPDATE
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = orden_trabajo.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    )) OR
    (auth.user_rol_id() IN (3, 4) AND EXISTS (
      SELECT 1 FROM orden_x_usuario 
      WHERE orden_x_usuario.id_orden_trabajo = orden_trabajo.id_orden 
      AND orden_x_usuario.id_usuario = auth.uid()::integer
    ))
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = orden_trabajo.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    )) OR
    (auth.user_rol_id() IN (3, 4) AND EXISTS (
      SELECT 1 FROM orden_x_usuario 
      WHERE orden_x_usuario.id_orden_trabajo = orden_trabajo.id_orden 
      AND orden_x_usuario.id_usuario = auth.uid()::integer
    ))
  );

-- DELETE: Solo ADMIN
CREATE POLICY "orden_trabajo_delete_admin" ON orden_trabajo
  FOR DELETE
  USING (auth.user_rol_id() = 1);

-- =====================================================
-- 10. POLÍTICAS PARA TABLA: mecanico
-- =====================================================

-- SELECT:
-- - ADMIN, Inspector, Auditor ven todos
-- - Usuarios Empresa ven solo mecánicos de su empresa
CREATE POLICY "mecanico_select" ON mecanico
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- INSERT:
-- - ADMIN puede crear en cualquier empresa
-- - Usuarios Empresa solo pueden crear en su empresa
CREATE POLICY "mecanico_insert" ON mecanico
  FOR INSERT
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- UPDATE:
-- - ADMIN puede actualizar todos
-- - Usuarios Empresa solo pueden actualizar mecánicos de su empresa
CREATE POLICY "mecanico_update" ON mecanico
  FOR UPDATE
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- DELETE:
-- - ADMIN puede eliminar todos
-- - Usuarios Empresa solo pueden eliminar mecánicos de su empresa
CREATE POLICY "mecanico_delete" ON mecanico
  FOR DELETE
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND id_empresa = auth.user_empresa_id())
  );

-- =====================================================
-- 11. POLÍTICAS PARA TABLA: orden_x_mecanico
-- =====================================================

-- SELECT: Misma lógica que orden_trabajo
CREATE POLICY "orden_x_mecanico_select" ON orden_x_mecanico
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_mecanico.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- INSERT/UPDATE/DELETE: Misma lógica que orden_trabajo
CREATE POLICY "orden_x_mecanico_modify" ON orden_x_mecanico
  FOR ALL
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_mecanico.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_mecanico.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- =====================================================
-- 12. POLÍTICAS PARA TABLA: insumo_catalogo
-- =====================================================

-- SELECT: Todos pueden leer
CREATE POLICY "insumo_catalogo_select_all" ON insumo_catalogo
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo ADMIN
CREATE POLICY "insumo_catalogo_modify_admin" ON insumo_catalogo
  FOR ALL
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- =====================================================
-- 13. POLÍTICAS PARA TABLA: detalle_insumo
-- =====================================================

-- SELECT: Misma lógica que orden_trabajo
CREATE POLICY "detalle_insumo_select" ON detalle_insumo
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = detalle_insumo.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- INSERT/UPDATE/DELETE: Misma lógica que orden_trabajo
CREATE POLICY "detalle_insumo_modify" ON detalle_insumo
  FOR ALL
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = detalle_insumo.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = detalle_insumo.id_orden 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- =====================================================
-- 14. POLÍTICAS PARA TABLA: linea_servicio
-- =====================================================

-- SELECT: Todos pueden leer
CREATE POLICY "linea_servicio_select_all" ON linea_servicio
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Solo ADMIN
CREATE POLICY "linea_servicio_modify_admin" ON linea_servicio
  FOR ALL
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- =====================================================
-- 15. POLÍTICAS PARA TABLA: rto_registro
-- =====================================================

-- SELECT: Misma lógica que vehiculo
CREATE POLICY "rto_registro_select" ON rto_registro
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = rto_registro.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- INSERT/UPDATE/DELETE: Misma lógica que vehiculo
CREATE POLICY "rto_registro_modify" ON rto_registro
  FOR ALL
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = rto_registro.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM vehiculo 
      WHERE vehiculo.id_vehiculo = rto_registro.id_vehiculo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- =====================================================
-- 16. POLÍTICAS PARA TABLA: orden_x_usuario
-- =====================================================

-- SELECT: Misma lógica que orden_trabajo
CREATE POLICY "orden_x_usuario_select" ON orden_x_usuario
  FOR SELECT
  USING (
    auth.user_rol_id() = 1 OR
    auth.user_rol_id() = 3 OR
    auth.user_rol_id() = 4 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_usuario.id_orden_trabajo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    ))
  );

-- INSERT:
-- - ADMIN puede crear todas
-- - Usuarios Empresa solo pueden crear para órdenes de su empresa
-- - Inspector/Auditor pueden asignarse a órdenes
CREATE POLICY "orden_x_usuario_insert" ON orden_x_usuario
  FOR INSERT
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_usuario.id_orden_trabajo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    )) OR
    (auth.user_rol_id() IN (3, 4) AND orden_x_usuario.id_usuario = auth.uid()::integer)
  );

-- UPDATE/DELETE: Misma lógica que INSERT
CREATE POLICY "orden_x_usuario_modify" ON orden_x_usuario
  FOR ALL
  USING (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_usuario.id_orden_trabajo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    )) OR
    (auth.user_rol_id() IN (3, 4) AND id_usuario = auth.uid()::integer)
  )
  WITH CHECK (
    auth.user_rol_id() = 1 OR
    (auth.user_rol_id() = 2 AND EXISTS (
      SELECT 1 FROM orden_trabajo 
      JOIN vehiculo ON vehiculo.id_vehiculo = orden_trabajo.id_vehiculo
      WHERE orden_trabajo.id_orden = orden_x_usuario.id_orden_trabajo 
      AND vehiculo.id_empresa = auth.user_empresa_id()
    )) OR
    (auth.user_rol_id() IN (3, 4) AND id_usuario = auth.uid()::integer)
  );

-- =====================================================
-- 17. POLÍTICAS PARA TABLA: auditoria
-- =====================================================

-- SELECT: Todos pueden leer registros de auditoría
CREATE POLICY "auditoria_select_all" ON auditoria
  FOR SELECT
  USING (true);

-- INSERT: Todos los usuarios autenticados pueden crear registros
CREATE POLICY "auditoria_insert_all" ON auditoria
  FOR INSERT
  WITH CHECK (true);

-- UPDATE/DELETE: Solo ADMIN
CREATE POLICY "auditoria_modify_admin" ON auditoria
  FOR ALL
  USING (auth.user_rol_id() = 1)
  WITH CHECK (auth.user_rol_id() = 1);

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- 1. Las funciones auth.user_empresa_id() y auth.user_rol_id() 
--    necesitan ser ajustadas según tu sistema de autenticación.
--    Si usas Supabase Auth, deberás adaptar estas funciones.
--
-- 2. Para desarrollo/testing, puedes temporalmente permitir todo:
--    ALTER TABLE conductor DISABLE ROW LEVEL SECURITY;
--
-- 3. Verificar políticas creadas:
--    SELECT * FROM pg_policies WHERE tablename = 'conductor';
--
-- 4. Eliminar todas las políticas de una tabla:
--    DROP POLICY IF EXISTS "nombre_politica" ON tabla;
--
-- =====================================================

