# ⚡ Solución Rápida: Basic Authentication Disabled

## Tu Problema
```
Download publish profile
Basic authentication is disabled.
```

## ✅ Solución Más Fácil: Deployment Center

Esta es la forma **MÁS SIMPLE** y no requiere comandos:

### Pasos:

1. **Ve a Azure Portal:**
   - https://portal.azure.com

2. **Navega a tu App Service:**
   - Busca y abre tu App Service (ej: hadda-erp-app)

3. **Abre Deployment Center:**
   - En el menú izquierdo, busca "Deployment Center"
   - Click en "Deployment Center"

4. **Configura GitHub:**
   - **Source:** Selecciona "GitHub"
   - Click en "Authorize" y autoriza Azure
   - **Organization:** Selecciona tu usuario/organización
   - **Repository:** Selecciona "hadda-erp"
   - **Branch:** Selecciona "main"

5. **Guarda:**
   - Click en "Save" arriba

6. **¡Listo!**
   - Azure creará automáticamente el workflow
   - Configurará los secrets
   - Iniciará el deployment

### ¿Qué hace esto automáticamente?
- ✅ Crea el archivo `.github/workflows/azure-webapps-node.yml`
- ✅ Configura todos los secrets necesarios
- ✅ Hace el primer deployment
- ✅ Todo sin comandos ni configuración manual

---

## 🔧 Alternativa: Script Automatizado (Windows)

Si prefieres usar Service Principal (más control):

### Paso 1: Ejecutar el script

Abre PowerShell como **Administrador** y ejecuta:

```powershell
cd D:\hadda-erp
.\azure-setup.ps1
```

El script:
1. Verificará Azure CLI (lo instalará si es necesario)
2. Te hará login en Azure
3. Te pedirá el nombre de tu Resource Group y App Service
4. Creará el Service Principal automáticamente
5. Guardará las credenciales en `azure-credentials.json`

### Paso 2: Configurar GitHub Secrets

El script te dirá exactamente qué hacer, pero en resumen:

1. Ve a: **GitHub → hadda-erp → Settings → Secrets and variables → Actions**

2. Click en "New repository secret"

3. Crea secret `AZURE_CREDENTIALS`:
   - Abre el archivo `azure-credentials.json` que el script creó
   - Copia TODO el contenido
   - Pégalo como valor

4. Crea secret `AZURE_WEBAPP_NAME`:
   - Valor: el nombre de tu App Service

### Paso 3: Push y Deploy

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

---

## 🆘 Si no funciona ninguna de las anteriores

### Habilitar Basic Auth temporalmente (última opción)

**⚠️ Solo haz esto si entiendes los riesgos de seguridad**

#### Via Azure Portal:

1. Ve a: **Azure Portal → Tu App Service → Configuration**
2. Tab "General settings"
3. Busca "Basic Auth Publishing Credentials"
4. Cambia a **ON**
5. Busca "SCM Basic Auth Publishing Credentials"  
6. Cambia a **ON**
7. Click "Save" arriba
8. Ahora podrás descargar el Publish Profile desde "Overview"

#### Via PowerShell (más rápido):

```powershell
# Reemplaza <RESOURCE_GROUP> y <APP_NAME> con tus valores

az resource update --resource-group <RESOURCE_GROUP> `
  --name scm --namespace Microsoft.Web `
  --resource-type basicPublishingCredentialsPolicies `
  --parent sites/<APP_NAME> `
  --set properties.allow=true
```

Ejemplo:
```powershell
az resource update --resource-group hadda-rg `
  --name scm --namespace Microsoft.Web `
  --resource-type basicPublishingCredentialsPolicies `
  --parent sites/hadda-erp-app `
  --set properties.allow=true
```

Luego descarga el Publish Profile:

```powershell
az webapp deployment list-publishing-profiles `
  --name <APP_NAME> `
  --resource-group <RESOURCE_GROUP> `
  --xml > publish-profile.xml
```

**⚠️ IMPORTANTE:** Después del deployment, DESACTIVA Basic Auth nuevamente:

```powershell
az resource update --resource-group <RESOURCE_GROUP> `
  --name scm --namespace Microsoft.Web `
  --resource-type basicPublishingCredentialsPolicies `
  --parent sites/<APP_NAME> `
  --set properties.allow=false
```

---

## 📊 Comparación de Métodos

| Método | Dificultad | Tiempo | Seguridad | Recomendado |
|--------|-----------|--------|-----------|-------------|
| **Deployment Center** | 😊 Fácil | 5 min | ✅✅ Alta | ✅ **SÍ** |
| **Script Automatizado** | 😐 Media | 10 min | ✅✅✅ Muy Alta | ✅ SÍ |
| **Basic Auth** | 😊 Fácil | 2 min | ❌ Baja | ❌ NO |

---

## 🎯 Mi Recomendación

**Usa Deployment Center** (la primera opción):
- Es visual y fácil
- Azure hace todo automáticamente
- No necesitas instalar nada
- Es seguro
- Toma solo 5 minutos

---

## 📞 ¿Necesitas ayuda?

Si sigues teniendo problemas:

1. Verifica que tienes permisos de **Contributor** o **Owner** en el App Service
2. Asegúrate de que el Resource Group y App Service existen
3. Revisa `AZURE_SERVICE_PRINCIPAL_SETUP.md` para más detalles
4. Pregúntame y te ayudo con el paso específico donde estás atorado

---

## ✅ Verificación

Después de configurar, verifica que todo funcione:

1. Ve a GitHub → Actions
2. Verás el workflow ejecutándose
3. Espera a que complete (5-10 minutos)
4. Visita tu App Service URL para verificar

¡Éxito! 🎉

