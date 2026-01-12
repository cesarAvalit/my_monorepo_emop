# Instrucciones: Agregar Restricciones UNIQUE

## 📋 Paso a Paso para Ejecutar el Script

### **PASO 1: Verificar Duplicados (IMPORTANTE)**

Antes de ejecutar el script, debes verificar si hay datos duplicados en tu base de datos. Si hay duplicados, el script fallará.

#### 1.1. Abre el SQL Editor en Supabase
- Ve a tu proyecto en Supabase
- Haz clic en "SQL Editor" en el menú lateral izquierdo

#### 1.2. Ejecuta estas consultas para verificar duplicados:

```sql
-- Verificar duplicados en usuario.dni
SELECT dni, COUNT(*) as cantidad
FROM usuario 
WHERE dni IS NOT NULL AND dni != ''
GROUP BY dni 
HAVING COUNT(*) > 1;

-- Verificar duplicados en vehiculo.interno
SELECT interno, COUNT(*) as cantidad
FROM vehiculo 
WHERE interno IS NOT NULL AND interno != ''
GROUP BY interno 
HAVING COUNT(*) > 1;

-- Verificar duplicados en vehiculo.matricula
SELECT matricula, COUNT(*) as cantidad
FROM vehiculo 
WHERE matricula IS NOT NULL AND matricula != ''
GROUP BY matricula 
HAVING COUNT(*) > 1;
```

#### 1.3. Interpretar los resultados:
- **Si NO aparecen resultados**: No hay duplicados, puedes continuar al PASO 2
- **Si aparecen resultados**: Tienes duplicados, debes resolverlos primero (ver PASO 1.4)

#### 1.4. Si hay duplicados, resolverlos:

**Opción A: Eliminar duplicados automáticamente (mantiene el registro más antiguo)**
```sql
-- Para usuario.dni
DELETE FROM usuario 
WHERE id_usuario NOT IN (
    SELECT MIN(id_usuario) 
    FROM usuario 
    WHERE dni IS NOT NULL AND dni != ''
    GROUP BY dni
) 
AND dni IS NOT NULL AND dni != '';

-- Para vehiculo.interno
DELETE FROM vehiculo 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vehiculo 
    WHERE interno IS NOT NULL AND interno != ''
    GROUP BY interno
) 
AND interno IS NOT NULL AND interno != '';

-- Para vehiculo.matricula
DELETE FROM vehiculo 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vehiculo 
    WHERE matricula IS NOT NULL AND matricula != ''
    GROUP BY matricula
) 
AND matricula IS NOT NULL AND matricula != '';
```

**Opción B: Corregir duplicados manualmente**
- Revisa cada duplicado en la interfaz de Supabase
- Actualiza o elimina los registros duplicados según corresponda

---

### **PASO 2: Ejecutar el Script de Restricciones**

#### 2.1. Abre el archivo `add_unique_constraints.sql`
- El archivo está en la raíz del proyecto: `/home/cesar/emop/add_unique_constraints.sql`

#### 2.2. Copia todo el contenido del script

#### 2.3. En Supabase SQL Editor:
- Pega el contenido completo del script
- Haz clic en "Run" o presiona `Ctrl + Enter` (o `Cmd + Enter` en Mac)

#### 2.4. Verificar la ejecución:
- Deberías ver mensajes como:
  - `Restricción UNIQUE agregada a usuario.dni`
  - `Restricción UNIQUE agregada a vehiculo.interno`
  - `Restricción UNIQUE agregada a vehiculo.matricula`
- O mensajes indicando que ya existen

---

### **PASO 3: Verificar que las Restricciones se Crearon Correctamente**

Ejecuta esta consulta para ver todas las restricciones UNIQUE:

```sql
SELECT 
    tc.table_name as tabla,
    kcu.column_name as columna,
    tc.constraint_name as nombre_restriccion
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name IN ('usuario', 'vehiculo')
    AND kcu.column_name IN ('dni', 'email', 'interno', 'matricula')
ORDER BY tc.table_name, kcu.column_name;
```

**Resultado esperado:**
```
tabla    | columna   | nombre_restriccion
---------|-----------|-------------------
usuario  | dni       | usuario_dni_key
usuario  | email     | usuario_email_key
vehiculo | interno   | vehiculo_interno_key
vehiculo | matricula | vehiculo_matricula_key
```

---

### **PASO 4: Probar las Restricciones**

#### 4.1. Intentar insertar un DNI duplicado (debe fallar):
```sql
-- Esto debería fallar si ya existe un usuario con ese DNI
INSERT INTO usuario (username, email, password_hash, dni, id_rol)
VALUES ('test_user', 'test@test.com', 'hash123', '12345678', 1);
```

#### 4.2. Intentar insertar una matrícula duplicada (debe fallar):
```sql
-- Esto debería fallar si ya existe un vehículo con esa matrícula
INSERT INTO vehiculo (id_vehiculo, matricula, id_empresa)
VALUES (9999, 'ABC-123', 1);
```

---

## ⚠️ Solución de Problemas

### Error: "duplicate key value violates unique constraint"

**Causa:** Hay datos duplicados en la base de datos.

**Solución:**
1. Ejecuta las consultas del PASO 1.2 para identificar duplicados
2. Resuelve los duplicados usando el PASO 1.4
3. Vuelve a ejecutar el script del PASO 2

### Error: "constraint already exists"

**Causa:** La restricción ya fue creada anteriormente.

**Solución:** 
- Este error es normal si ya ejecutaste el script antes
- El script verifica si existe antes de crearla, así que puedes ejecutarlo múltiples veces sin problemas

### Error de permisos

**Causa:** Tu usuario no tiene permisos para crear restricciones.

**Solución:**
- Asegúrate de estar usando una cuenta con permisos de administrador en Supabase
- O contacta al administrador de la base de datos

---

## 📝 Notas Importantes

1. **Valores NULL:** PostgreSQL permite múltiples valores NULL en campos UNIQUE. Solo los valores no-nulos deben ser únicos.

2. **Backup:** Aunque el script es seguro, siempre es recomendable hacer un backup antes de ejecutar cambios en producción.

3. **Aplicación:** Una vez aplicadas las restricciones, tu aplicación deberá manejar errores de duplicados al intentar insertar datos duplicados.

---

## ✅ Checklist Final

- [ ] Verifiqué que no hay duplicados en `usuario.dni`
- [ ] Verifiqué que no hay duplicados en `vehiculo.interno`
- [ ] Verifiqué que no hay duplicados en `vehiculo.matricula`
- [ ] Resolví los duplicados si los había
- [ ] Ejecuté el script `add_unique_constraints.sql`
- [ ] Verifiqué que las restricciones se crearon correctamente
- [ ] Probé que las restricciones funcionan intentando insertar duplicados

---

## 🎯 Resultado Final

Una vez completados todos los pasos, tendrás:
- ✅ `usuario.dni` con restricción UNIQUE
- ✅ `usuario.email` con restricción UNIQUE (ya existía)
- ✅ `vehiculo.interno` con restricción UNIQUE
- ✅ `vehiculo.matricula` con restricción UNIQUE

Esto garantizará que no se puedan crear usuarios con el mismo DNI o email, ni vehículos con el mismo interno o matrícula.

