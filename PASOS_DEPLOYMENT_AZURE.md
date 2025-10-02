# 🚀 Pasos para Deployment con Azure Deployment Center

## Tu Configuración Actual

✅ **Deployment Center configurado** en Azure Portal  
✅ **GitHub conectado** - deployment automático en cada push  
✅ **Optimizaciones implementadas** - archivos de configuración listos

## ⚠️ IMPORTANTE: Verificación Previa

Cuando configuraste Deployment Center, Azure **pudo haber creado automáticamente** un workflow en GitHub.

### Paso 1: Verificar si Azure ya creó un workflow

Antes de hacer push, ve a GitHub:

**GitHub.com → tu-usuario/hadda-erp → Actions**

- **Si hay workflows:** Verás algo como "Azure Web App Deploy" o similar
- **Si NO hay workflows:** Está limpio, puedes proceder

### Paso 2A: SI Azure ya creó un workflow

Si ves un workflow existente en GitHub:

```bash
# 1. Primero haz pull para traer el workflow de Azure
git pull origin main

# 2. Revisa qué workflow existe
ls .github/workflows/

# 3. Tendrás DOS archivos:
#    - El que creó Azure (ej: azure-webapps-node.yml)
#    - El que yo creé (azure-deploy.yml)
```

**Tienes dos opciones:**

**Opción A - Usar el workflow de Azure (más simple):**
```bash
# Elimina el workflow que yo creé
rm .github/workflows/azure-deploy.yml

# Agrega los cambios
git add .
git commit -m "Use Azure-generated workflow and add deployment optimizations"
git push origin main
```

**Opción B - Usar el workflow optimizado que yo creé:**
```bash
# Elimina el workflow de Azure
rm .github/workflows/azure-webapps-node.yml
# (o el nombre que tenga)

# Agrega los cambios
git add .
git commit -m "Use optimized deployment workflow"
git push origin main
```

**Recomendación:** Usa el de Azure (Opción A) porque ya está configurado con los secrets correctos.

### Paso 2B: SI NO hay workflow en GitHub

Si GitHub Actions está vacío, simplemente:

```bash
# 1. Como Azure Deployment Center está configurado,
#    podemos simplificar y NO usar GitHub Actions custom
#    Azure lo manejará directamente

# 2. Elimina el workflow que creé (no lo necesitas)
rm -r .github/

# 3. Agrega los cambios importantes
git add .
git commit -m "Add Azure deployment optimizations"
git push origin main
```

## 📋 Archivos Importantes que SÍ necesitas

Estos archivos **SÍ son necesarios** y optimizan el deployment:

- ✅ `.deploymentignore` - Excluye node_modules y archivos innecesarios
- ✅ `.deployment` - Configura build en Azure
- ✅ `web.config` - Configuración de IIS
- ✅ `.azure/config` - Configuraciones adicionales
- ✅ `package.json` - Actualizado con postinstall

## ⚠️ CRÍTICO: Configurar Application Settings en Azure

**ANTES de hacer push**, debes configurar las variables de entorno en Azure:

### Ve a Azure Portal:

**Azure Portal → Tu App Service → Configuration → Application settings**

### Agrega estas configuraciones MÍNIMAS:

```bash
WEBSITE_NODE_DEFAULT_VERSION=18-lts
NODE_ENV=production
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
SCM_COMMAND_IDLE_TIMEOUT=3600
```

### Agrega tus variables de aplicación:

```bash
# Database
DB_HOST=tu-servidor.postgres.database.azure.com
DB_PORT=5432
DB_NAME=hadda_erp
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_SSL=true

# JWT
JWT_SECRET=tu-secret-super-seguro

# Email (SendGrid)
SENDGRID_API_KEY=tu-api-key
EMAIL_FROM=noreply@tudominio.com

# Base URL
BASE_URL=https://tu-app.azurewebsites.net
```

Click **"Save"** arriba (muy importante!)

## 🎯 Resumen de Pasos

### Preparación (hacer UNA VEZ antes del primer push):

1. ✅ **Configurar Application Settings** en Azure Portal
2. ✅ **Verificar** si hay workflows en GitHub Actions
3. ✅ **Decidir** qué workflow usar (o ninguno si usas solo Deployment Center)

### Para cada deployment (después de la preparación):

```bash
# 1. Hacer cambios en tu código
git add .
git commit -m "Descripción de cambios"
git push origin main

# 2. Azure detecta el push automáticamente
# 3. Inicia el build y deployment
# 4. Esperar 5-10 minutos
# 5. ¡Listo!
```

## 🔍 Monitorear el Deployment

Puedes ver el progreso en:

**Opción 1 - Azure Portal:**
```
Azure Portal → Tu App Service → Deployment Center → Logs
```

**Opción 2 - GitHub (si usas workflow):**
```
GitHub → Tu Repo → Actions
```

**Opción 3 - Log Stream:**
```
Azure Portal → Tu App Service → Log stream
```

## ✅ Verificar que funciona

Después del deployment:

1. **Visita tu app:**
   ```
   https://tu-app.azurewebsites.net
   ```

2. **Verifica la API:**
   ```bash
   curl https://tu-app.azurewebsites.net/api/health
   ```

3. **Revisa logs si hay errores:**
   ```
   Azure Portal → Log stream
   ```

## 🐛 Troubleshooting

### "Application Error" después del deployment

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Ve a Configuration → Application settings
2. Verifica que TODAS las variables necesarias estén ahí
3. Click "Save"
4. Restart la app

### Deployment muy lento o timeout

**Causa:** Todavía está copiando node_modules

**Solución:**
1. Verifica que `.deploymentignore` esté en el root del proyecto
2. Haz commit del archivo
3. Intenta un nuevo deployment

### "Cannot find module"

**Causa:** Dependencias no se instalaron

**Solución:**
1. Verifica que `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
2. Revisa logs en Deployment Center
3. Puede necesitar restart

## 🎉 Resultado Final

Después de configurar todo correctamente:

- ⏱️ **Deployment:** 5-10 minutos (vs 40+ minutos antes)
- 📦 **Archivos copiados:** ~200 (vs 113,819 antes)
- ✅ **Sin timeouts:** Proceso estable
- 🔄 **Automático:** Push → Build → Deploy

## 📞 ¿Necesitas ayuda?

Si algo no funciona:
1. Comparte los logs del deployment
2. Dime en qué paso estás
3. Te ayudo a resolver el problema específico

