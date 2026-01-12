# ✅ Solución: Error "duplicate key value violates unique constraint orden_trabajo_pkey"

## 🐛 Problema

Al intentar crear una orden de trabajo, se producía el error:

```
Error: duplicate key value violates unique constraint "orden_trabajo_pkey"
```

## 🔍 Causas Identificadas

1. **Secuencia desincronizada**: La secuencia `orden_trabajo_id_orden_seq` estaba en el valor `2`, pero el MAX(id_orden) era `4`
2. **Código incluía `id_orden` manualmente**: En la carga masiva, el código estaba incluyendo `id_orden: currentId` en los datos a insertar
3. **Números de orden no consecutivos**: No había validación para asegurar que los números de orden sean consecutivos

## ✅ Soluciones Aplicadas

### 1. Sincronización de Secuencia

```sql
-- Sincronizar la secuencia con el MAX actual
SELECT setval('orden_trabajo_id_orden_seq', 
    COALESCE((SELECT MAX(id_orden) FROM orden_trabajo), 0), 
    true);
```

**Estado:** ✅ Secuencia sincronizada (siguiente ID: 5)

### 2. Eliminación de `id_orden` Manual

**Archivo:** `src/pages/NuevosDDJJ.jsx`

**Antes:**
```javascript
validRows.push({
  id_orden: currentId,  // ❌ Esto causaba conflictos
  id_vehiculo: ...,
  ...
});
```

**Después:**
```javascript
validRows.push({
  // id_orden se genera automáticamente por la secuencia, NO incluirlo
  id_vehiculo: ...,
  ...
});
```

### 3. Validación de Consecutividad

Se agregó validación para asegurar que los números de orden sean consecutivos:

**En formulario individual:**
```javascript
// Validar que el número de orden sea consecutivo
const numerosOrden = validOrdenesExistentes
  .map(o => {
    const nro = o.nro_orden_trabajo;
    if (nro && /^\d+$/.test(String(nro))) {
      return parseInt(String(nro), 10);
    }
    return null;
  })
  .filter(n => n !== null);

if (numerosOrden.length > 0) {
  const maxNumero = Math.max(...numerosOrden);
  const numeroIngresado = parseInt(formData.numero_orden_trabajo.trim(), 10);
  
  if (!isNaN(numeroIngresado)) {
    const siguienteEsperado = maxNumero + 1;
    if (numeroIngresado !== siguienteEsperado) {
      // Mostrar advertencia
    }
  }
}
```

**En carga masiva:**
```javascript
// Validar consecutividad del número de orden
const nroOrdenNum = parseInt(nroOrden, 10);
if (!isNaN(nroOrdenNum) && nroOrdenNum !== maxNumeroOrden + 1) {
  const siguienteEsperado = maxNumeroOrden + 1;
  rowErrors.push(`Fila ${index + 2}: El número de orden debería ser ${siguienteEsperado} (siguiente consecutivo), pero se ingresó ${nroOrdenNum}`);
}
```

## 📊 Estado Actual

### Órdenes de Trabajo Existentes:
- ID 1: N° 602570
- ID 2: N° 602571
- ID 3: N° 602572
- ID 4: N° 602573

### Próxima Orden:
- **ID esperado:** 5 (generado por secuencia)
- **N° esperado:** 602574 (consecutivo)

## ✅ Verificación

### Verificar Secuencia:
```sql
SELECT last_value, is_called FROM orden_trabajo_id_orden_seq;
SELECT nextval('orden_trabajo_id_orden_seq');
SELECT MAX(id_orden) FROM orden_trabajo;
```

### Verificar Números de Orden:
```sql
SELECT id_orden, nro_orden_trabajo 
FROM orden_trabajo 
ORDER BY nro_orden_trabajo::integer;
```

## 🎯 Funcionalidad Final

1. **Al crear orden de trabajo:**
   - ✅ `id_orden` se genera automáticamente por la secuencia
   - ✅ `nro_orden_trabajo` debe ser consecutivo al máximo existente
   - ✅ Se valida que el número no exista
   - ✅ Se advierte si no es consecutivo (pero permite continuar)

2. **En carga masiva:**
   - ✅ No se incluye `id_orden` en los datos
   - ✅ Se valida consecutividad de números de orden
   - ✅ Se reportan errores si no son consecutivos

## 📝 Notas Importantes

1. **Secuencia automática**: El `id_orden` siempre se genera automáticamente, nunca debe incluirse en los datos
2. **Números consecutivos**: Los números de orden de trabajo deben ser consecutivos (602570, 602571, 602572, etc.)
3. **Validación**: El sistema valida y advierte, pero permite continuar si el usuario lo desea
4. **Sincronización**: Si se importan datos manualmente, ejecutar el script de sincronización de secuencias

## 🔧 Script de Sincronización

Si necesitas sincronizar la secuencia manualmente:

```bash
cd /home/cesar/emop-my-back/emop_back
./scripts/sincronizar_secuencias.sh
```

O directamente en PostgreSQL:

```sql
SELECT setval('orden_trabajo_id_orden_seq', 
    (SELECT MAX(id_orden) FROM orden_trabajo), 
    true);
```

## ✅ Estado Final

- ✅ Secuencia sincronizada
- ✅ Código no incluye `id_orden` manualmente
- ✅ Validación de consecutividad implementada
- ✅ Próxima orden: ID 5, N° 602574

El error no debería volver a aparecer. Las órdenes de trabajo se crearán correctamente con IDs y números consecutivos.

