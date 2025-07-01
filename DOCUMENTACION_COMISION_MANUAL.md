# Propuesta de Implementación: Comisión Manual Editable por Admin en Proyectos

## Objetivo
Permitir que, cuando la rentabilidad de un proyecto esté en un rango bajo (por ejemplo, entre 20% y 24%), un usuario con rol de administrador pueda habilitar y definir manualmente el porcentaje de comisión de venta, en vez de aplicar automáticamente el valor 0%.

---

## Flujo General

1. **Cálculo Automático:**
   - Por defecto, la comisión de venta se calcula automáticamente según la rentabilidad y los rangos definidos en la tabla de comisiones.
   - Si la rentabilidad está por debajo del mínimo (ejemplo: < 25%), la comisión es 0%.

2. **Intervención del Administrador:**
   - Si la rentabilidad está en un rango bajo (ejemplo: 20% a 24%), el administrador verá un botón para habilitar la edición manual de la comisión.
   - Al activar el botón, se mostrará un campo para ingresar el porcentaje de comisión deseado (mayor a 0% y menor al máximo permitido para ese rango).
   - El admin puede deshabilitar la edición manual en cualquier momento, volviendo al cálculo automático.

3. **Guardado y Visualización:**
   - Al guardar el proyecto, si la comisión manual está habilitada, se envía el valor y un flag al backend.
   - En la visualización del proyecto, se muestra si la comisión fue ajustada manualmente y su valor.

---

## Cambios Técnicos

### Backend
- **Modelo de Proyecto:**
  - Agregar campos: `usar_comision_manual` (boolean) y `comision_manual` (float).
- **Controlador de Proyectos:**
  - Al calcular la comisión, si `usar_comision_manual` es `true`, usar `comision_manual`.
  - Permitir guardar y actualizar estos campos desde el frontend.

### Frontend
- **Formulario de Proyecto:**
  - Si el usuario es admin y la rentabilidad está en el rango bajo, mostrar un botón para habilitar/deshabilitar la comisión manual.
  - Si está habilitada, mostrar un campo editable para el porcentaje de comisión.
  - Mostrar visualmente si la comisión es manual o automática.
- **Hook de Formulario:**
  - Manejar el estado de la comisión manual y su envío al backend.

---

## Validaciones y Seguridad
- Solo los administradores pueden habilitar/deshabilitar la comisión manual.
- El valor de comisión manual debe estar dentro de los límites permitidos.
- El backend debe validar que solo admins puedan modificar estos campos.

---

## Notas
- El rango de rentabilidad editable y los valores máximos/mínimos pueden ser ajustados según la política de la empresa.
- Se recomienda registrar en logs/auditoría cuándo y quién habilita la comisión manual.

---

**Este documento debe ser revisado y aprobado antes de iniciar la implementación.** 