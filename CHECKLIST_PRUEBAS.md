# ✅ Checklist de Pruebas - Captura de Cookies

## 📋 Antes de Probar

### [ ] 1. Recargar la Extensión
```
1. Abre chrome://extensions/
2. Busca "SENCE Auth Capture"
3. Click en el botón 🔄 (Recargar)
```

### [ ] 2. Actualizar archivo `.env` del Backend

**Ubicación:** `backend/.env`

**Cambiar de:**
```env
CORS_ORIGIN=http://localhost:3000
```

**A una de estas opciones:**

✅ **Opción Recomendada (desarrollo):**
```env
CORS_ORIGIN=*
```

✅ **Opción Alternativa:**
```env
CORS_ORIGIN=http://localhost:3000,chrome-extension://*
```

### [ ] 3. Verificar Puerto del Backend

En tu `.env` tienes:
```env
PORT=5000
```

Pero la extensión intenta conectarse a `localhost:3000`.

**¿En qué puerto corre tu backend?**
- [ ] Puerto 3000 → Cambia `.env` a `PORT=3000`
- [ ] Puerto 5000 → La extensión está buscando el puerto equivocado

### [ ] 4. Reiniciar el Backend
```bash
# En la terminal del backend:
# Presiona Ctrl+C
# Luego inicia de nuevo:
npm start
# o
npm run dev
```

---

## 🧪 Flujo de Prueba

### [ ] 1. Abrir DevTools de la Extensión

**Para ver los logs:**
```
1. Click derecho en el ícono de la extensión
2. "Inspect service worker" o "Inspeccionar vista de service worker"
3. Ve a la pestaña Console
```

### [ ] 2. Abrir el ERP

```
1. Abre tu ERP en el navegador
2. Navega a la sección de sincronización de cursos
```

### [ ] 3. Iniciar el Flujo

```
1. Click en "Sincronizar Cursos" (o el botón que abra SENCE)
2. Se debe abrir un popup con el login de SENCE
```

### [ ] 4. Completar Login

```
1. Ingresa con Clave Única
2. Completa el proceso de autenticación
3. Llegas a la página "SeleccionarPerfil" de SENCE
```

### [ ] 5. Esperar Captura Automática

```
⏱️ La extensión espera 7 segundos y luego captura automáticamente
```

### [ ] 6. Verificar Logs de la Extensión

**Busca estos mensajes en la consola del service worker:**

✅ **SI FUNCIONA, verás:**
```
[SENCE Auth] 🎯 Intentando captura DIRECTA de ASP.NET_SessionId...
[SENCE Auth] ✅ Cookie "ASP.NET_SessionId" encontrada en https://lce.sence.cl/
[SENCE Auth] 🎉 ¡ASP.NET_SessionId encontrada!
[SENCE Auth] ✅ Cookie ASP.NET_SessionId agregada manualmente
[SENCE Auth] Total cookies únicas capturadas: 2
[SENCE Auth] Enviando cookies al backend: http://localhost:3000/api/scraping/start-with-auth
```

❌ **SI NO FUNCIONA (CORS), verás:**
```
Access to fetch at 'http://localhost:3000/api/scraping/start-with-auth' 
from origin 'chrome-extension://...' has been blocked by CORS policy
```
→ **Solución:** Revisa el paso 2 (actualizar .env) y 4 (reiniciar backend)

❌ **SI NO CAPTURA LA COOKIE, verás:**
```
[SENCE Auth] ❌ Cookie "ASP.NET_SessionId" NO encontrada
```
→ **Solución:** Verifica que la cookie existe en DevTools

### [ ] 7. Verificar Logs del Backend

**En la terminal donde corre el backend, busca:**

✅ **SI FUNCIONA:**
```
[CORS] ✅ Extensión de Chrome detectada - permitido: chrome-extension://...
[Scraping Controller] Recibida solicitud con cookies de extensión
[Scraping Controller] 2 cookies recibidas
```

❌ **SI HAY ERROR CORS:**
```
[CORS] ⚠️ Origen no en lista: chrome-extension://...
```
→ **Solución:** El .env no se actualizó correctamente

---

## 🔍 Verificaciones Adicionales

### [ ] Verificar que la Cookie Existe

```
1. En la ventana de SENCE (después del login)
2. F12 → Application → Cookies → https://lce.sence.cl
3. Busca: ASP.NET_SessionId
4. ¿Está ahí? 
   - ✅ Sí → El problema es de captura
   - ❌ No → La cookie no se está creando
```

### [ ] Verificar el Puerto Correcto

```
En los logs de la extensión, busca:
[SENCE Auth] Enviando cookies al backend: http://localhost:XXXX/...

¿El puerto XXXX coincide con el puerto donde corre tu backend?
```

---

## 📊 Resultados Esperados

| Componente | Estado Esperado | ¿Cómo verificar? |
|------------|----------------|------------------|
| Extensión recargada | ✅ | Chrome extensions muestra versión actualizada |
| .env actualizado | ✅ | `CORS_ORIGIN=*` o con chrome-extension |
| Backend reiniciado | ✅ | Terminal muestra "Servidor corriendo en puerto..." |
| Cookie existe | ✅ | DevTools → Application → Cookies |
| Cookie capturada | ✅ | Logs: "🎉 ¡ASP.NET_SessionId encontrada!" |
| Sin error CORS | ✅ | No aparece error de CORS en consola |
| Backend recibe | ✅ | Logs backend: "cookies recibidas" |

---

## 🐛 Si Algo Falla

### Problema: Cookie no se captura

**Comparte estos datos:**
```
1. Valor de cookieStoreId en los logs:
   [SENCE Auth] Cookie Store ID del tab: ???

2. ¿La cookie existe en DevTools?
   Sí / No

3. Dominio exacto de la cookie:
   ???

4. ¿HttpOnly está en true?
   Sí / No
```

### Problema: Error CORS persiste

**Verifica:**
```
1. ¿Actualizaste el archivo .env?
   □ Sí  □ No

2. ¿Reiniciaste el backend completamente?
   □ Sí  □ No

3. ¿Qué dice el log del backend cuando se inicia?
   [Copiar y pegar logs de inicio]

4. ¿Qué valor tiene CORS_ORIGIN después de actualizar?
   [Mostrar contenido del .env]
```

### Problema: Puerto incorrecto

**Verifica:**
```
1. ¿En qué puerto corre el backend?
   Terminal muestra: "Servidor corriendo en puerto: XXXX"

2. ¿A qué puerto intenta conectarse la extensión?
   Logs: "Enviando cookies al backend: http://localhost:XXXX/..."

3. ¿Coinciden? 
   □ Sí  □ No
```

---

## 📸 Comparte para Debugging

Si sigues teniendo problemas, comparte:

1. **Screenshot de los logs de la extensión** (completos)
2. **Screenshot de DevTools → Application → Cookies**
3. **Contenido actual de tu `.env`** (oculta datos sensibles)
4. **Logs del backend al iniciar**
5. **Puerto donde corre el backend**

---

## ✨ Si Todo Funciona

Deberías ver:
- ✅ Notificación de la extensión: "Cookies capturadas y enviadas correctamente"
- ✅ Banner verde en SENCE: "Autenticación capturada correctamente"
- ✅ En el ERP: Los cursos se sincronizan automáticamente

