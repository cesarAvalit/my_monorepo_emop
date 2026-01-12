-- =====================================================
-- Script Simple para Habilitar RLS - Copiar y Pegar
-- Sistema EMOP - Supabase
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia TODO este script
-- 3. Pégalo en el editor SQL
-- 4. Haz clic en "Run" o presiona Ctrl+Enter
-- =====================================================

-- Habilitar RLS en todas las tablas
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

-- Crear políticas permisivas (permiten todas las operaciones CRUD)
CREATE POLICY "empresa_all_access" ON empresa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "rol_all_access" ON rol FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "usuario_all_access" ON usuario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "conductor_all_access" ON conductor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "vehiculo_all_access" ON vehiculo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tipo_mantenimiento_all_access" ON tipo_mantenimiento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_trabajo_all_access" ON orden_trabajo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mecanico_all_access" ON mecanico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_x_mecanico_all_access" ON orden_x_mecanico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "insumo_catalogo_all_access" ON insumo_catalogo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "detalle_insumo_all_access" ON detalle_insumo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "linea_servicio_all_access" ON linea_servicio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "rto_registro_all_access" ON rto_registro FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orden_x_usuario_all_access" ON orden_x_usuario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auditoria_all_access" ON auditoria FOR ALL USING (true) WITH CHECK (true);

-- Verificar que RLS está habilitado
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'empresa', 'rol', 'usuario', 'conductor', 'vehiculo',
    'tipo_mantenimiento', 'orden_trabajo', 'mecanico',
    'orden_x_mecanico', 'insumo_catalogo', 'detalle_insumo',
    'linea_servicio', 'rto_registro', 'orden_x_usuario', 'auditoria'
  )
ORDER BY tablename;

