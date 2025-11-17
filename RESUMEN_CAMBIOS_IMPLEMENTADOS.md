# ✅ Cambios Implementados para Captura de Cookies

## 🎯 Mejoras en la Extensión de Chrome

### 1. **Permisos Mejorados** (`manifest.json`)

Se agregaron más host_permissions para capturar cookies de todos los dominios necesarios:

```json
"host_permissions": [
  "https://*.sence.cl/*",
  "https://lce.sence.cl/*",
  "http://lce.sence.cl/*",          // ← NUEVO
  "https://accounts.claveunica.gob.cl/*",
  "https://*.gob.cl/*",              // ← NUEVO
  "*://*.sence.cl/*"                 // ← NUEVO (wildcard protocol)
]
```

### 2. **Método Específico para ASP.NET_SessionId** (`background.js`)

Se implementó una función dedicada para capturar la cookie crítica:

```javascript
async function getCookieByName(name, url, storeId = null) {
  // Captura directa por nombre
  const cookie = await chrome.cookies.get({ name, url, storeId });
  return cookie;
}
```

### 3. **Captura Directa Antes de Búsqueda General** (`background.js`)

Ahora la extensión intenta capturar `ASP.NET_SessionId` **directamente** antes de hacer búsquedas genéricas:

```javascript
// 🎯 MÉTODO ESPECÍFICO: Intentar capturar ASP.NET_SessionId directamente
const targetUrls = [
  'https://lce.sence.cl/',
  'https://lce.sence.cl/CertificadoAsistencia/',
  'https://lce.sence.cl/CertificadoAsistencia/SeleccionarPerfil',
  tabUrl // URL exacta del tab
];

for (const url of targetUrls) {
  const cookie = await getCookieByName('ASP.NET_SessionId', url, cookieStoreId);
  if (cookie) {
    aspNetCookie = cookie;
    break;
  }
}
```

### 4. **Fallback sin cookieStoreId** (`background.js`)

Si `cookieStoreId` es `undefined` (como en tu caso), la extensión reintenta sin especificarlo:

```javascript
if (!aspNetCookie) {
  // Reintentar sin especificar cookieStoreId
  for (const url of targetUrls) {
    const cookie = await getCookieByName('ASP.NET_SessionId', url, null);
    if (cookie) {
      aspNetCookie = cookie;
      break;
    }
  }
}
```

### 5. **Manejo Robusto del cookieStoreId** (`background.js`)

Se estableció un valor por defecto si no está disponible:

```javascript
// Antes
let cookieStoreId = null;
if (tabId) {
  const tab = await chrome.tabs.get(tabId);
  cookieStoreId = tab.cookieStoreId; // podía ser undefined
}

// Ahora
let cookieStoreId = '0'; // Default store ID
if (tabId) {
  const tab = await chrome.tabs.get(tabId);
  cookieStoreId = tab.cookieStoreId || '0';
}
```

---

## 🔧 Configuración Necesaria en el Backend

### Archivo `.env` Necesita Actualización

**Tu configuración actual:**
```env
CORS_ORIGIN=http://localhost:3000
```

**❌ Problema:** Esto bloquea las peticiones de la extensión de Chrome.

**✅ Solución:** Elige una de estas opciones:

#### Opción A: Permitir todo (desarrollo)
```env
CORS_ORIGIN=*
```

#### Opción B: Orígenes específicos
```env
CORS_ORIGIN=http://localhost:3000,chrome-extension://*
```

#### Opción C: Comentar (usa lógica de server.js)
```env
# CORS_ORIGIN=http://localhost:3000
```

**Después de cambiar: REINICIAR EL BACKEND**

---

## 📊 Diagnóstico Mejorado

Ahora verás logs mucho más detallados:

```
[SENCE Auth] 🎯 Intentando captura DIRECTA de ASP.NET_SessionId...
[SENCE Auth] ✅ Cookie "ASP.NET_SessionId" encontrada en https://lce.sence.cl/
[SENCE Auth] 🎉 ¡ASP.NET_SessionId encontrada!
[SENCE Auth] ✅ Cookie ASP.NET_SessionId agregada manualmente
```

Si falla, verás:
```
[SENCE Auth] ❌ Cookie "ASP.NET_SessionId" NO encontrada en https://lce.sence.cl/
[SENCE Auth] Reintentando sin especificar cookieStoreId...
```

---

## 🧪 Cómo Probar

### Paso 1: Recargar la Extensión
1. Ve a `chrome://extensions/`
2. Encuentra "SENCE Auth Capture"
3. Click en el botón de recargar (🔄)

### Paso 2: Actualizar `.env` del Backend
1. Abre `backend/.env`
2. Cambia o comenta `CORS_ORIGIN`
3. Guarda el archivo

### Paso 3: Reiniciar el Backend
```bash
# En la terminal del backend, presiona Ctrl+C
# Luego:
npm start
```

### Paso 4: Probar el Flujo Completo
1. Abre tu ERP
2. Click en "Sincronizar Cursos"
3. Se abre popup de SENCE
4. Completa el login con Clave Única
5. Espera 7 segundos (la extensión captura automáticamente)
6. Revisa logs de la extensión:
   - Botón derecho en el ícono de la extensión → "Inspect service worker"
   - Busca: `[SENCE Auth] 🎉 ¡ASP.NET_SessionId encontrada!`

---

## 🎯 Qué Esperar

### ✅ Si Todo Funciona Correctamente:

**En la consola de la extensión:**
```
[SENCE Auth] 🎉 ¡ASP.NET_SessionId encontrada!
[SENCE Auth] Total cookies únicas capturadas: 2
[SENCE Auth] Cookies capturadas: ['ASP.NET_SessionId (lce.sence.cl/)', 'sessionid (accounts.claveunica.gob.cl/)']
[SENCE Auth] Enviando cookies al backend: http://localhost:3000/api/scraping/start-with-auth
```

**En la consola del backend:**
```
[CORS] ✅ Extensión de Chrome detectada - permitido: chrome-extension://...
[Scraping Controller] Recibida solicitud con cookies de extensión
[Scraping Controller] 2 cookies recibidas
```

### ❌ Si Sigue Fallando:

**Error de CORS:**
- Verificaste que actualizaste el `.env`?
- Reiniciaste el backend?
- El puerto es el correcto? (3000 o 5000?)

**Cookie no capturada:**
- La cookie existe en DevTools → Application → Cookies?
- Cuál es el dominio exacto de la cookie?
- Es `HttpOnly: true`?

---

## 🔍 Debugging Adicional

Si después de estos cambios la cookie sigue sin capturarse, necesito saber:

1. **¿Aparece este mensaje en los logs?**
   ```
   [SENCE Auth] 🎉 ¡ASP.NET_SessionId encontrada!
   ```

2. **¿Cuál es el valor de cookieStoreId en los logs?**
   ```
   [SENCE Auth] Cookie Store ID del tab: ???
   ```

3. **¿El error de CORS desapareció?**
   - Busca en la consola de la extensión si ya no aparece el error de CORS

---

## 📦 Archivos Modificados

1. ✅ `chrome-extension/manifest.json` - Permisos mejorados
2. ✅ `chrome-extension/background.js` - Captura directa de ASP.NET_SessionId
3. 📝 `INSTRUCCIONES_CORS.md` - Guía para configurar CORS
4. 📝 `RESUMEN_CAMBIOS_IMPLEMENTADOS.md` - Este archivo

---

## ⏭️ Próximos Pasos

1. **Recarga la extensión** en `chrome://extensions/`
2. **Actualiza tu `.env`** según las instrucciones
3. **Reinicia el backend**
4. **Prueba el flujo completo**
5. **Comparte los logs** para verificar que todo funcionó

