# 🔧 Instrucciones para Arreglar CORS

## Problema Actual

Tu archivo `.env` tiene:
```env
CORS_ORIGIN=http://localhost:3000
```

Esto sobrescribe la lógica correcta que ya existe en `backend/server.js` (líneas 64-68) que permite extensiones de Chrome.

---

## ✅ Solución: Actualizar tu archivo .env

### Opción 1: Permitir todo en desarrollo (RECOMENDADO)

Edita `backend/.env` y cambia:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=*
ENABLE_CRON_JOBS=false
```

### Opción 2: Permitir orígenes específicos

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000,chrome-extension://*
ENABLE_CRON_JOBS=false
```

### Opción 3: Comentar CORS_ORIGIN (usa la lógica de server.js)

```env
NODE_ENV=development
PORT=5000
# CORS_ORIGIN=http://localhost:3000
ENABLE_CRON_JOBS=false
```

---

## 🔄 Después de cambiar

1. **Guarda el archivo `.env`**
2. **Reinicia el servidor backend**:
   ```bash
   # Presiona Ctrl+C en la terminal del backend
   # Luego vuelve a iniciar:
   npm start
   # o
   npm run dev
   ```

---

## 🧪 Verificar que funcionó

Después de reiniciar, deberías ver en los logs del backend:

```
[CORS] ✅ Extensión de Chrome detectada - permitido: chrome-extension://...
```

En lugar de:

```
Access-Control-Allow-Origin header has a value 'http://localhost:5000/'
```

---

## ⚠️ Nota sobre el Puerto

Veo que tu `.env` tiene `PORT=5000` pero la extensión intenta conectarse a `localhost:3000`. 

**¿A qué puerto está corriendo tu backend realmente?**

- Si corre en puerto **5000**, necesitas actualizar la URL en la extensión
- Si corre en puerto **3000**, cambia `PORT=3000` en tu `.env`

Para verificar, revisa qué dice la terminal cuando inicias el backend:
```
Servidor corriendo en puerto: XXXX
```

