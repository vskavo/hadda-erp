# ✅ Cierre Automático de Ventana SENCE

## 🎯 Funcionalidad Implementada

La ventana popup de SENCE ahora se cierra automáticamente después de capturar y enviar las cookies al backend, mejorando significativamente la experiencia de usuario.

---

## 🔧 Implementación Dual (Redundante para Mayor Robustez)

### Método 1: Desde el Content Script (Principal)

**Archivo:** `chrome-extension/content.js`

Cuando la extensión recibe confirmación exitosa del backend, cierra la ventana automáticamente:

```javascript
if (response && response.success) {
  console.log('[SENCE Auth Content] Cookies capturadas exitosamente');
  showSuccessMessage();
  
  // Cerrar ventana automáticamente después de 3 segundos
  setTimeout(() => {
    console.log('[SENCE Auth Content] ✅ Proceso completado, cerrando ventana');
    window.close();
  }, 3000);
}
```

**Flujo:**
1. Usuario completa login en SENCE
2. Extensión captura cookies
3. Extensión envía cookies al backend
4. Backend responde con éxito
5. Se muestra mensaje: "✅ Autenticación capturada correctamente. Esta ventana se cerrará automáticamente en 3 segundos..."
6. Después de 3 segundos, la ventana se cierra sola

### Método 2: Desde el Frontend (Backup)

**Archivo:** `frontend/src/pages/cursos/hooks/useCursoForm.js`

El frontend monitorea el estado del scraping y cierra la ventana cuando detecta que el proceso comenzó:

```javascript
// Cuando el scraping comienza o completa
if (response.data.data.estado === 'en_progreso' || response.data.data.estado === 'completado') {
  if (senceWindowRef.current && !senceWindowRef.current.closed) {
    console.log('[Sync] Cerrando ventana de SENCE (scraping iniciado)...');
    senceWindowRef.current.close();
  }
}
```

**¿Por qué dos métodos?**
- **Redundancia:** Si el content script no puede cerrar la ventana por alguna restricción del navegador, el frontend la cierra
- **Timing diferente:** El content script cierra rápido (3 segundos), el frontend cierra cuando confirma que el scraping comenzó (5-10 segundos)

---

## ⏱️ Timeline del Cierre

```
t=0s    Usuario completa login
t=7s    Extensión captura cookies (espera 7 segundos)
t=7.5s  Extensión envía cookies al backend
t=8s    Backend responde con éxito
t=8s    Mensaje: "Esta ventana se cerrará automáticamente en 3 segundos..."
t=11s   🎯 Ventana se cierra (Method 1 - Content Script)
        
        Si no se cerró:
t=15s   Frontend hace primer polling
t=15s   Frontend detecta estado='en_progreso'
t=15s   🎯 Ventana se cierra (Method 2 - Frontend backup)
```

---

## 📊 Ventajas

### ✅ UX Mejorada
- **Antes:** Usuario debía cerrar manualmente la ventana
- **Ahora:** La ventana se cierra sola sin intervención

### ✅ Flujo Más Limpio
- No quedan ventanas abiertas innecesariamente
- Proceso se siente más automático y profesional

### ✅ Feedback Visual
- Usuario ve claramente que el proceso fue exitoso
- Mensaje indica cuándo se cerrará la ventana (3 segundos)
- Tiempo suficiente para leer el mensaje de éxito

### ✅ Robustez
- Dos métodos independientes garantizan que la ventana se cierre
- Si uno falla, el otro actúa como backup

---

## 🛡️ Casos Edge Manejados

### 1. Usuario cierra manualmente antes del auto-cierre
**Resultado:** ✅ El frontend detecta que la ventana se cerró y continúa normalmente

```javascript
const windowCheckInterval = setInterval(() => {
  if (senceWindowRef.current && senceWindowRef.current.closed) {
    console.log('[Sync] Ventana cerrada manualmente');
    // Continuar con verificación
  }
}, 1000);
```

### 2. Error al enviar cookies
**Resultado:** ✅ La ventana NO se cierra, muestra mensaje de error

```javascript
if (response && response.success) {
  // Solo cierra si fue exitoso
} else {
  showErrorMessage(response?.error); // No cierra
}
```

### 3. Restricciones del navegador impiden window.close()
**Resultado:** ✅ El frontend lo cierra como backup después de 5-10 segundos

### 4. Popup bloqueado y no se abre
**Resultado:** ✅ Error manejado antes de intentar enviar datos

```javascript
if (!senceWindowRef.current) {
  throw new Error('No se pudo abrir la ventana de SENCE...');
}
```

---

## 🎬 Demo del Flujo Completo

```
Usuario: Click "Sincronizar Cursos"
  ↓
[Popup SENCE se abre]
  ↓
Usuario: Completa login con ClaveÚnica
  ↓
[Extensión espera 7 segundos]
  ↓
[Extensión captura 10 cookies]
  ↓
[Extensión envía al backend]
  ↓
[Banner verde aparece: "✅ Esta ventana se cerrará automáticamente en 3 segundos..."]
  ↓
[3 segundos después]
  ↓
[🎯 Popup se cierra automáticamente]
  ↓
[ERP muestra: "Sincronizando... 45%"]
  ↓
[ERP muestra: "✅ Sincronización completada"]
```

---

## 🧪 Pruebas

### Escenario 1: Flujo Normal
1. Abrir curso en ERP
2. Click "Sincronizar"
3. Completar login en popup
4. **Verificar:** Popup se cierra solo después de 3 segundos
5. **Verificar:** No hay ventanas abiertas innecesariamente

### Escenario 2: Cierre Manual
1. Abrir curso en ERP
2. Click "Sincronizar"
3. Completar login
4. **Cerrar manualmente** antes del auto-cierre
5. **Verificar:** Sincronización continúa normalmente

### Escenario 3: Error de Red
1. Abrir curso en ERP
2. **Desconectar internet**
3. Click "Sincronizar"
4. Completar login
5. **Verificar:** Ventana NO se cierra, muestra error

---

## 📝 Logs para Debugging

### Logs del Content Script (Popup SENCE - F12)
```
[SENCE Auth Content] Cookies capturadas exitosamente
[SENCE Auth Content] Cerrando ventana en 3 segundos...
[SENCE Auth Content] ✅ Proceso completado, cerrando ventana
```

### Logs del Frontend (ERP - F12)
```
[Sync] Ventana de SENCE abierta
[Sync] Datos enviados al popup de SENCE
[Sync] Cerrando ventana de SENCE (scraping iniciado)...
```

---

## 🔧 Configuración

### Tiempo de Espera Antes de Cerrar

**Por defecto:** 3 segundos

**Para cambiar:**

Edita `chrome-extension/content.js`:
```javascript
setTimeout(() => {
  window.close();
}, 3000); // Cambiar este valor (en milisegundos)
```

**Recomendaciones:**
- **Menos de 2 segundos:** Usuario puede no ver el mensaje de éxito
- **2-4 segundos:** ✅ Ideal (tiempo suficiente para leer)
- **Más de 5 segundos:** Usuario puede impacientarse

---

## 🚀 Próximos Pasos (Opcional)

### Mejora Futura: Contador Visual
Mostrar contador regresivo en el banner:

```javascript
let countdown = 3;
const banner = createBanner(`✅ Cerrando en ${countdown}...`, 'success');

const countdownInterval = setInterval(() => {
  countdown--;
  banner.textContent = `✅ Cerrando en ${countdown}...`;
  if (countdown <= 0) {
    clearInterval(countdownInterval);
  }
}, 1000);
```

### Mejora Futura: Botón "Cerrar Ahora"
Permitir al usuario cerrar antes del timeout:

```html
<button onclick="window.close()">Cerrar ahora</button>
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes ❌ | Ahora ✅ |
|---------|---------|---------|
| **Cierre de ventana** | Manual | Automático |
| **Experiencia** | Usuario debe intervenir | Flujo completamente automático |
| **Ventanas abiertas** | Quedan abiertas | Se cierran solas |
| **Feedback** | Solo logs en consola | Banner visible + auto-cierre |
| **Tiempo del usuario** | +5 segundos (cerrar manual) | 0 segundos (automático) |

---

## ✅ Resumen

**Estado:** ✅ **IMPLEMENTADO Y FUNCIONANDO**

La ventana de SENCE ahora se cierra automáticamente 3 segundos después de capturar las cookies exitosamente, con un sistema de backup desde el frontend para mayor robustez.

**Beneficios principales:**
- ✅ Mejor UX - Proceso completamente automático
- ✅ Menos clics - Usuario no debe cerrar manualmente
- ✅ Más limpio - No quedan ventanas abiertas
- ✅ Robusto - Dos métodos independientes de cierre

**Archivos modificados:**
- `chrome-extension/content.js` - Cierre principal desde extensión
- `frontend/src/pages/cursos/hooks/useCursoForm.js` - Cierre backup desde frontend

