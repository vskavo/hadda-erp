# ✅ Checklist de Deployment para Azure

## Archivos Creados

Los siguientes archivos han sido creados para optimizar tu deployment:

- [x] `.deploymentignore` - Excluye archivos innecesarios del deployment
- [x] `.deployment` - Configuración base de Azure
- [x] `web.config` - Configuración de IIS/Azure App Service
- [x] `.azure/config` - Configuraciones adicionales de Azure
- [x] `.github/workflows/azure-deploy.yml` - Workflow de GitHub Actions
- [x] `deploy.sh` - Script de deployment personalizado (opcional)
- [x] `AZURE_DEPLOYMENT_GUIDE.md` - Guía completa de deployment
- [x] `package.json` actualizado con script `postinstall`
- [x] `.gitignore` actualizado

## Pasos para Completar el Deployment

### 1️⃣ Configurar Azure Portal (REQUERIDO)

Ve a: **Azure Portal → Tu App Service → Configuration → Application settings**

Agrega estas configuraciones mínimas:

```bash
WEBSITE_NODE_DEFAULT_VERSION=18-lts
NODE_ENV=production
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
SCM_COMMAND_IDLE_TIMEOUT=3600
```

Agrega tus variables de entorno:
```bash
DB_HOST=...
DB_PORT=5432
DB_NAME=hadda_erp
DB_USER=...
DB_PASSWORD=...
JWT_SECRET=...
SENDGRID_API_KEY=...
```

### 2️⃣ Configurar GitHub Secrets (Si usas GitHub Actions)

1. Obtén el Publish Profile de Azure:
   - Azure Portal → Tu App Service → "Get publish profile"
   
2. Agrega secrets en GitHub:
   - Ve a: **GitHub → Tu Repo → Settings → Secrets and variables → Actions**
   - Nuevo secret: `AZURE_WEBAPP_PUBLISH_PROFILE` (pega el XML completo)
   - Nuevo secret: `AZURE_WEBAPP_NAME` (nombre de tu app en Azure)

### 3️⃣ Hacer Commit y Push

```bash
# Verificar cambios
git status

# Agregar archivos
git add .

# Commit
git commit -m "Configure Azure deployment optimization"

# Push
git push origin main
```

### 4️⃣ Monitorear el Deployment

- **GitHub Actions**: Ve a la pestaña "Actions" en tu repositorio
- **Azure Portal**: Deployment Center → Logs
- **Log Stream**: Azure Portal → Tu App Service → Log stream

## Resultados Esperados

### Antes de la Optimización:
- ❌ 113,819 archivos copiados
- ❌ Timeout después de ~40 minutos
- ❌ Errores de rsync y procesos killed
- ❌ Deployment fallido

### Después de la Optimización:
- ✅ ~100-200 archivos copiados (solo código fuente)
- ✅ node_modules instalados en Azure (~2-5 min)
- ✅ Deployment completo en ~5-10 minutos
- ✅ Deployment exitoso

## Verificación Post-Deployment

Después de que el deployment complete exitosamente:

1. **Verificar que la app está corriendo:**
   ```bash
   https://tu-app.azurewebsites.net
   ```

2. **Verificar health endpoint:**
   ```bash
   curl https://tu-app.azurewebsites.net/api/health
   ```

3. **Revisar logs en Azure:**
   - Azure Portal → Tu App Service → Log stream

## Solución de Problemas

### Si el deployment sigue fallando:

1. **Verificar variables de entorno en Azure**
   - Todas las variables necesarias deben estar configuradas

2. **Incrementar timeout si es necesario:**
   ```bash
   SCM_COMMAND_IDLE_TIMEOUT=7200
   ```

3. **Revisar logs detallados:**
   ```bash
   az webapp log tail --name tu-app --resource-group tu-rg
   ```

4. **Verificar node_modules no están en Git:**
   ```bash
   git ls-files | grep node_modules
   # No debería retornar nada
   ```

## Notas Importantes

⚠️ **NUNCA** incluyas `.env` en el repositorio
⚠️ **SIEMPRE** usa Application Settings en Azure para secrets
⚠️ **VERIFICA** que node_modules esté en .gitignore
✅ **MONITOREA** el primer deployment completo

## Contacto

Si tienes problemas después de seguir todos los pasos, revisa `AZURE_DEPLOYMENT_GUIDE.md` para troubleshooting detallado.


