-- =====================================================
-- Script de Habilitación de RLS - MODO DESARROLLO
-- Sistema EMOP - Supabase
-- =====================================================
-- 
-- Este script habilita Row Level Security (RLS) en todas las tablas
-- con políticas permisivas para desarrollo y testing
--
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- 
-- NOTA: Estas políticas permiten todas las operaciones CRUD
-- para facilitar el desarrollo. En producción, deberás refinar
-- estas políticas según tus necesidades de seguridad.
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
-- 2. POLÍTICAS PERMISIVAS PARA DESARROLLO
-- =====================================================
-- Estas políticas permiten todas las operaciones CRUD
-- para cualquier usuario autenticado (usando anon key)

-- =====================================================
-- EMPRESA
-- =====================================================

CREATE POLICY "empresa_all_access" ON empresa
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ROL
-- =====================================================

CREATE POLICY "rol_all_access" ON rol
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- USUARIO
-- =====================================================

CREATE POLICY "usuario_all_access" ON usuario
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CONDUCTOR
-- =====================================================

CREATE POLICY "conductor_all_access" ON conductor
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VEHICULO
-- =====================================================

CREATE POLICY "vehiculo_all_access" ON vehiculo
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TIPO_MANTENIMIENTO
-- =====================================================

CREATE POLICY "tipo_mantenimiento_all_access" ON tipo_mantenimiento
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ORDEN_TRABAJO
-- =====================================================

CREATE POLICY "orden_trabajo_all_access" ON orden_trabajo
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- MECANICO
-- =====================================================

CREATE POLICY "mecanico_all_access" ON mecanico
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ORDEN_X_MECANICO
-- =====================================================

CREATE POLICY "orden_x_mecanico_all_access" ON orden_x_mecanico
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- INSUMO_CATALOGO
-- =====================================================

CREATE POLICY "insumo_catalogo_all_access" ON insumo_catalogo
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- DETALLE_INSUMO
-- =====================================================

CREATE POLICY "detalle_insumo_all_access" ON detalle_insumo
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- LINEA_SERVICIO
-- =====================================================

CREATE POLICY "linea_servicio_all_access" ON linea_servicio
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RTO_REGISTRO
-- =====================================================

CREATE POLICY "rto_registro_all_access" ON rto_registro
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ORDEN_X_USUARIO
-- =====================================================

CREATE POLICY "orden_x_usuario_all_access" ON orden_x_usuario
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- AUDITORIA
-- =====================================================

CREATE POLICY "auditoria_all_access" ON auditoria
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS
-- =====================================================

-- Verificar que RLS está habilitado en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'empresa', 'rol', 'usuario', 'conductor', 'vehiculo',
    'tipo_mantenimiento', 'orden_trabajo', 'mecanico',
    'orden_x_mecanico', 'insumo_catalogo', 'detalle_insumo',
    'linea_servicio', 'rto_registro', 'orden_x_usuario', 'auditoria'
  )
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- 1. Estas políticas permiten TODAS las operaciones CRUD
--    para cualquier usuario que use la anon key.
--
-- 2. Para deshabilitar RLS temporalmente en una tabla:
--    ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
--
-- 3. Para eliminar todas las políticas de una tabla:
--    DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;
--
-- 4. Para eliminar todas las políticas y deshabilitar RLS:
--    -- Eliminar políticas
--    DROP POLICY IF EXISTS "empresa_all_access" ON empresa;
--    -- Deshabilitar RLS
--    ALTER TABLE empresa DISABLE ROW LEVEL SECURITY;
--
-- 5. En producción, deberás crear políticas más restrictivas
--    basadas en roles y empresas del usuario.
--
-- =====================================================

