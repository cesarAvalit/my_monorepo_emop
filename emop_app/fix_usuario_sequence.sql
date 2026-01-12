-- =====================================================
-- Script para Corregir la Secuencia de usuario_id_usuario_seq
-- Este script sincroniza la secuencia con el valor máximo actual
-- =====================================================

-- Verificar el máximo id_usuario en la tabla antes de corregir
SELECT MAX(id_usuario) AS max_id_usuario_actual FROM usuario;

-- Sincronizar la secuencia de usuario_id_usuario_seq
-- El tercer parámetro 'true' significa que el próximo nextval() devolverá este valor + 1
-- Esto asegura que el próximo id_usuario generado sea mayor que el máximo existente
SELECT setval(
  'usuario_id_usuario_seq', 
  COALESCE((SELECT MAX(id_usuario) FROM usuario), 0), 
  true
) AS secuencia_actualizada;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- 
-- NOTA: Después de ejecutar este script, intenta crear un usuario nuevamente.
-- La secuencia ahora está sincronizada y debería funcionar correctamente.

