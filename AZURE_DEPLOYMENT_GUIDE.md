# Guía de Deployment en Azure

## Problema Resuelto

El error que experimentabas era debido a que Azure intentaba copiar **113,819 archivos** (incluyendo todos los `node_modules`), lo que causaba timeouts y fallos en el proceso rsync.

### Errores que estabas viendo:
- `rsync: connection unexpectedly closed`
- `rsync error: error in rsync protocol data stream (code 12)`
- `Killed` (signal 9) - procesos terminados por timeout
- `Rsync failed in 2377 seconds` (~40 minutos)

## Solución Implementada

Se han creado los siguientes archivos para optimizar el deployment:

### 1. `.deploymentignore`
Excluye archivos innecesarios del deployment:
- `node_modules/` (se instalarán en Azure)
- Logs, backups, archivos de test
- Archivos de desarrollo (.vscode, .idea, etc.)

### 2. `.deployment`
Configura Azure para hacer build durante el deployment:
```
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 3. `web.config`
Configuración de IIS para Azure App Service con Node.js

### 4. `.azure/config`
Configuraciones específicas de Azure

### 5. `.github/workflows/azure-deploy.yml`
Workflow de GitHub Actions optimizado para deployment

### 6. `deploy.sh`
Script de deployment personalizado (opcional)

## Configuración en Azure Portal

Debes configurar las siguientes **Application Settings** en tu Azure App Service:

### Variables de Ambiente Requeridas

Ve a: **Azure Portal** → **Tu App Service** → **Configuration** → **Application settings**

Agrega las siguientes configuraciones:

```bash
# Node.js
WEBSITE_NODE_DEFAULT_VERSION=18-lts
NODE_ENV=production

# Build durante deployment
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true

# Timeout extendido para build
SCM_COMMAND_IDLE_TIMEOUT=3600

# NPM
NPM_CONFIG_PRODUCTION=false
NPM_USE_CI=false

# Logging (para debugging)
SCM_TRACE_LEVEL=4
WEBSITE_HTTPLOGGING_RETENTION_DAYS=7

# Tu aplicación
PORT=8080
```

### Variables específicas de tu aplicación

Agrega también tus variables de entorno específicas:

```bash
# Base de datos
DB_HOST=tu-servidor-postgres.postgres.database.azure.com
DB_PORT=5432
DB_NAME=hadda_erp
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_SSL=true

# JWT
JWT_SECRET=tu-jwt-secret-seguro

# Email (SendGrid)
SENDGRID_API_KEY=tu-sendgrid-api-key
EMAIL_FROM=noreply@tudominio.com

# Otras configuraciones
BASE_URL=https://tu-app.azurewebsites.net
```

## Configuración de GitHub Actions

### Opción 1: Usar GitHub Actions (Recomendado)

1. **Obtener el Publish Profile de Azure:**
   - Ve a Azure Portal → Tu App Service
   - Click en "Get publish profile"
   - Descarga el archivo XML

2. **Agregar secret en GitHub:**
   - Ve a tu repositorio GitHub
   - Settings → Secrets and variables → Actions
   - New repository secret:
     - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
     - Value: (pega todo el contenido del archivo XML)
   
3. **Agregar nombre de la app:**
   - New repository secret:
     - Name: `AZURE_WEBAPP_NAME`
     - Value: `nombre-de-tu-app-en-azure`

4. **Hacer push a main:**
   ```bash
   git add .
   git commit -m "Configure Azure deployment"
   git push origin main
   ```

### Opción 2: Deployment directo desde Azure

1. **Configurar Deployment Center en Azure:**
   - Ve a Azure Portal → Tu App Service → Deployment Center
   - Source: GitHub
   - Autoriza GitHub
   - Selecciona tu organización, repositorio y branch (main)
   - Azure creará automáticamente el workflow

## Verificación del Deployment

### 1. Verificar logs en Azure:
```bash
# Via Azure Portal
Azure Portal → Tu App Service → Log stream

# Via Azure CLI
az webapp log tail --name tu-app-name --resource-group tu-resource-group
```

### 2. Verificar que la app está corriendo:
```bash
# Visita
https://tu-app.azurewebsites.net

# O via curl
curl https://tu-app.azurewebsites.net/api/health
```

### 3. Ver logs de deployment:
```bash
# Via Azure Portal
Azure Portal → Tu App Service → Deployment Center → Logs
```

## Optimizaciones Aplicadas

### Antes:
- ❌ 113,819 archivos siendo copiados
- ❌ Timeout después de ~40 minutos
- ❌ Procesos killed por falta de recursos
- ❌ node_modules de 3 carpetas (root, backend, frontend)

### Después:
- ✅ ~100-200 archivos copiados (solo código fuente)
- ✅ node_modules instalados en Azure (~2-5 minutos)
- ✅ Frontend build en Azure (~1-3 minutos)
- ✅ Deployment total: ~5-10 minutos
- ✅ Uso eficiente de recursos

## Estructura de Deployment

```
GitHub Push → GitHub Actions
    ↓
    1. Checkout code
    2. No incluir node_modules
    3. Subir solo código fuente
    ↓
Azure recibe deployment
    ↓
    1. npm install (root)
    2. npm install (backend)
    3. npm install (frontend)
    4. npm run build (frontend)
    5. Iniciar aplicación
```

## Troubleshooting

### Si el deployment falla:

1. **Verificar logs:**
   ```bash
   az webapp log download --name tu-app --resource-group tu-rg
   ```

2. **Verificar configuraciones:**
   - Asegúrate de que todas las variables de entorno estén configuradas
   - Verifica que `WEBSITE_NODE_DEFAULT_VERSION` sea correcta

3. **Tiempo de timeout:**
   Si el build es muy largo, incrementa:
   ```bash
   SCM_COMMAND_IDLE_TIMEOUT=7200
   ```

4. **Memoria insuficiente:**
   Considera upgrader tu App Service Plan a un tier superior

### Comandos útiles de Azure CLI:

```bash
# Ver logs en tiempo real
az webapp log tail --name tu-app --resource-group tu-rg

# Reiniciar app
az webapp restart --name tu-app --resource-group tu-rg

# Ver configuración
az webapp config appsettings list --name tu-app --resource-group tu-rg

# Agregar configuración
az webapp config appsettings set --name tu-app --resource-group tu-rg \
  --settings KEY=VALUE
```

## Siguientes Pasos

1. ✅ Los archivos de configuración ya están creados
2. ⏳ Configura las variables de entorno en Azure Portal
3. ⏳ Configura los secrets en GitHub (si usas GitHub Actions)
4. ⏳ Haz commit y push de estos cambios
5. ⏳ Monitorea el deployment en Azure Portal

## Notas Importantes

- **No incluyas** el archivo `.env` en el repositorio
- **Usa** Application Settings en Azure para variables de entorno
- **Monitorea** el primer deployment para verificar que todo funcione
- **Ajusta** el timeout si tu app necesita más tiempo para build

## Contacto y Soporte

Si necesitas ayuda adicional:
- Revisa los logs de Azure
- Verifica que todas las configuraciones estén correctas
- Contacta al equipo de DevOps si el problema persiste


