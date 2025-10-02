# Configuración de Service Principal para Azure Deployment

## Problema
El mensaje "Basic authentication is disabled" aparece porque Azure ha deshabilitado la autenticación básica por razones de seguridad.

## Solución: Usar Service Principal (Método Recomendado)

### Paso 1: Obtener tu información de Azure

Necesitas tener instalado Azure CLI. Si no lo tienes:
- Windows: `winget install Microsoft.AzureCLI`
- O descarga desde: https://aka.ms/installazurecliwindows

### Paso 2: Login en Azure CLI

```bash
az login
```

Esto abrirá tu navegador para autenticarte.

### Paso 3: Obtener tu Subscription ID

```bash
az account show --query id --output tsv
```

Guarda este ID, lo necesitarás después.

### Paso 4: Crear Service Principal

Reemplaza `<SUBSCRIPTION_ID>`, `<RESOURCE_GROUP>` y `<APP_NAME>` con tus valores:

```bash
az ad sp create-for-rbac --name "github-deploy-hadda-erp" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.Web/sites/<APP_NAME> \
  --sdk-auth
```

**Ejemplo real:**
```bash
az ad sp create-for-rbac --name "github-deploy-hadda-erp" \
  --role contributor \
  --scopes /subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/hadda-rg/providers/Microsoft.Web/sites/hadda-erp-app \
  --sdk-auth
```

Este comando generará un JSON similar a:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**⚠️ IMPORTANTE: Guarda todo este JSON, lo necesitarás en el siguiente paso.**

### Paso 5: Configurar GitHub Secrets

Ve a tu repositorio en GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

Crea los siguientes secrets:

#### Secret 1: AZURE_CREDENTIALS
- **Name:** `AZURE_CREDENTIALS`
- **Value:** Pega TODO el JSON completo del paso anterior

#### Secret 2: AZURE_WEBAPP_NAME
- **Name:** `AZURE_WEBAPP_NAME`
- **Value:** El nombre de tu App Service (ej: `hadda-erp-app`)

### Paso 6: Verificar la configuración

Una vez configurados los secrets, haz un commit y push:

```bash
git add .
git commit -m "Configure Azure deployment with Service Principal"
git push origin main
```

El workflow de GitHub Actions se ejecutará automáticamente.

---

## Alternativa: Habilitar Basic Auth (NO RECOMENDADO)

⚠️ Solo usa esto si realmente necesitas el Publish Profile y comprendes los riesgos de seguridad.

### Opción A: Via Azure Portal

1. Ve a: **Azure Portal → Tu App Service → Configuration → General settings**
2. En la sección "Platform settings":
   - **Basic Auth Publishing Credentials:** ON
   - **SCM Basic Auth Publishing Credentials:** ON
3. Click "Save"
4. Ahora podrás descargar el Publish Profile desde el Overview

### Opción B: Via Azure CLI

```bash
# Habilitar Basic Auth
az resource update --resource-group <RESOURCE_GROUP> \
  --name scm --namespace Microsoft.Web \
  --resource-type basicPublishingCredentialsPolicies \
  --parent sites/<APP_NAME> \
  --set properties.allow=true

# Descargar el Publish Profile
az webapp deployment list-publishing-profiles \
  --name <APP_NAME> \
  --resource-group <RESOURCE_GROUP> \
  --xml
```

Luego copia el XML completo y agrégalo como secret `AZURE_WEBAPP_PUBLISH_PROFILE` en GitHub.

**PERO RECUERDA:** Después del deployment, desactiva Basic Auth nuevamente por seguridad.

---

## Alternativa: Deployment Center de Azure (Más Fácil)

Esta es la forma más simple si no quieres lidiar con Service Principals:

### Paso 1: Configurar desde Azure Portal

1. Ve a: **Azure Portal → Tu App Service → Deployment Center**
2. Click en "Source" → Selecciona **GitHub**
3. Autoriza Azure para acceder a tu GitHub
4. Selecciona:
   - **Organization:** Tu usuario/organización
   - **Repository:** hadda-erp
   - **Branch:** main
5. Click "Save"

Azure automáticamente:
- Creará el workflow de GitHub Actions
- Configurará los secrets necesarios
- Iniciará el primer deployment

### Paso 2: Actualizar el workflow generado (Opcional)

Azure creará un workflow básico. Puedes mejorarlo reemplazándolo con el nuestro optimizado.

---

## Comandos Útiles para Verificar

### Ver información de tu App Service:
```bash
az webapp show --name <APP_NAME> --resource-group <RESOURCE_GROUP>
```

### Ver configuración de autenticación:
```bash
az resource show --resource-group <RESOURCE_GROUP> \
  --name scm --namespace Microsoft.Web \
  --resource-type basicPublishingCredentialsPolicies \
  --parent sites/<APP_NAME>
```

### Listar todos tus App Services:
```bash
az webapp list --output table
```

### Ver Resource Groups:
```bash
az group list --output table
```

---

## Resumen de Opciones

| Opción | Seguridad | Dificultad | Recomendado |
|--------|-----------|------------|-------------|
| Service Principal | ✅✅✅ Alta | Media | ✅ SÍ |
| Deployment Center | ✅✅ Media | Fácil | ✅ SÍ |
| Basic Auth | ❌ Baja | Fácil | ❌ NO |

## Mi Recomendación

**Usa el Deployment Center de Azure** (la forma más fácil):
1. Es la opción más simple
2. Azure configura todo automáticamente
3. Es seguro (no usa Basic Auth)
4. No necesitas manejar secrets manualmente

Si prefieres control total, usa Service Principal.

---

## Troubleshooting

### Error: "az: command not found"
Instala Azure CLI primero.

### Error: "Insufficient privileges"
Necesitas permisos de Owner o Contributor en el Resource Group.

### Error: "Service principal already exists"
Usa un nombre diferente o elimina el existente:
```bash
az ad sp delete --id <APP_ID>
```

### No puedo ver mi repositorio en Deployment Center
Verifica que hayas autorizado Azure a acceder a tu GitHub y que tengas permisos de admin en el repositorio.

