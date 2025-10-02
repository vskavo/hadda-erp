# 🚨 Solución Error 409 (Conflict) en Azure Deployment

## Error Encontrado

```
Error: Deployment Failed, Error: Failed to deploy web package using OneDeploy to App Service.
Conflict (CODE: 409)
```

## ¿Qué significa?

El error **409 Conflict** ocurre cuando:
1. ✅ Hay un deployment previo todavía en progreso (más probable)
2. Azure está intentando hacer dos deployments simultáneamente
3. Archivos están bloqueados en el servidor
4. El App Service no se detuvo correctamente antes

Esto es **común** después de cancelar deployments anteriores.

## Solución Implementada

He actualizado el workflow para:

1. **Detener la app** antes del deployment
2. **Esperar 10 segundos** para asegurar que se detuvo
3. **Hacer el deployment** con opciones `clean: true` y `restart: true`
4. **Iniciar la app** después del deployment

## 🚀 Acción Inmediata

### Opción 1: Reintentar con el workflow actualizado (Recomendado)

```powershell
# Hacer commit del workflow actualizado
git add .github/workflows/main_hadda-erp-v2.yml
git add SOLUCION_ERROR_409.md
git commit -m "Fix 409 error: Stop app before deployment"
git push origin main
```

### Opción 2: Limpiar manualmente en Azure Portal AHORA

**Si quieres deployment inmediato:**

1. **Ve a Azure Portal:**
   - Azure Portal → hadda-erp-v2

2. **Detener la app:**
   - Click en **"Stop"** (arriba)
   - Espera 30 segundos

3. **Reiniciar la app:**
   - Click en **"Start"**
   - Espera 30 segundos

4. **Hacer push del workflow actualizado:**
   ```powershell
   git add .github/workflows/main_hadda-erp-v2.yml
   git commit -m "Fix 409 error: Stop app before deployment"
   git push origin main
   ```

### Opción 3: Limpiar con Azure CLI (Más rápido)

```powershell
# Login (si no lo has hecho)
az login

# Detener la app
az webapp stop --name hadda-erp-v2 --resource-group hadda-erp-v2_group

# Esperar
Start-Sleep -Seconds 30

# Iniciar la app
az webapp start --name hadda-erp-v2 --resource-group hadda-erp-v2_group

# Hacer push del workflow actualizado
git add .github/workflows/main_hadda-erp-v2.yml
git commit -m "Fix 409 error: Stop app before deployment"
git push origin main
```

## 📋 Verificar Resource Group Name

⚠️ **IMPORTANTE:** He asumido que tu Resource Group se llama `hadda-erp-v2_group`.

**Para verificar el nombre correcto:**

### Via Azure Portal:
1. Ve a Azure Portal → hadda-erp-v2
2. En "Overview", verás "Resource group: XXXX"
3. Anota el nombre exacto

### Via Azure CLI:
```powershell
az webapp show --name hadda-erp-v2 --query resourceGroup --output tsv
```

**Si es diferente**, actualiza el workflow con el nombre correcto en estas líneas:
- Línea de `az webapp stop`
- Línea de `az webapp start`

## 🔧 Cambios en el Workflow

### ANTES:
```yaml
- name: Login to Azure
- name: Deploy to Azure Web App
```

### AHORA:
```yaml
- name: Login to Azure
- name: Stop Azure Web App before deployment      # ← NUEVO
- name: Wait for app to stop                      # ← NUEVO
- name: Deploy to Azure Web App
  with:
    clean: true                                   # ← NUEVO
    restart: true                                 # ← NUEVO
- name: Start Azure Web App after deployment     # ← NUEVO
```

## ⏱️ Tiempo Esperado

Con estos cambios:
- Stop app: 15 segundos
- Wait: 10 segundos
- Upload artifact: 30-60 segundos
- Deploy: 5-8 minutos
- Start app: 15 segundos
- **Total: 6-10 minutos**

## 🐛 Si el error persiste

### Error: Resource Group no encontrado

Si obtienes un error como:
```
ResourceGroupNotFound
```

Necesitas actualizar el nombre del Resource Group en el workflow:

```powershell
# Obtén el nombre correcto
az webapp show --name hadda-erp-v2 --query resourceGroup --output tsv

# Actualiza el workflow con ese nombre
```

### Error: Insufficient permissions

Si obtienes un error de permisos:

El Service Principal necesita permisos de **Contributor** en el App Service.

**Solución:**
```powershell
# Obtener el subscription ID
$subscriptionId = az account show --query id --output tsv

# Obtener el resource group
$resourceGroup = az webapp show --name hadda-erp-v2 --query resourceGroup --output tsv

# Dar permisos (necesitas ser Owner)
az role assignment create `
  --assignee ${{ secrets.AZUREAPPSERVICE_CLIENTID_6C6A6652B52F4A41970FE5095C34F122 }} `
  --role Contributor `
  --scope /subscriptions/$subscriptionId/resourceGroups/$resourceGroup
```

### El deployment todavía da 409

**Última opción - Reiniciar completamente:**

1. Ve a Azure Portal → hadda-erp-v2
2. Click en **"Restart"** (no Stop, directamente Restart)
3. Espera 2-3 minutos
4. Ve a GitHub Actions
5. Click en el último workflow fallido
6. Click en **"Re-run failed jobs"**

## 📊 Resumen de Soluciones

| Opción | Rapidez | Dificultad | Recomendado |
|--------|---------|------------|-------------|
| Workflow actualizado + Re-run | Media | Fácil | ✅ SÍ |
| Stop/Start manual en Portal | Rápida | Muy Fácil | ✅ SÍ (temporal) |
| Azure CLI | Rápida | Media | ✅ SÍ (si sabes CLI) |
| Esperar 30 min | Lenta | Fácil | ❌ NO |

## ✅ Verificación Post-Deployment

Después de que el deployment complete:

1. **Verifica que la app está corriendo:**
   ```
   https://hadda-erp-v2.azurewebsites.net
   ```

2. **Revisa logs en Azure:**
   ```
   Azure Portal → hadda-erp-v2 → Log stream
   ```

3. **Verifica que no hay errores 5xx:**
   ```powershell
   curl -I https://hadda-erp-v2.azurewebsites.net
   ```

## 💡 Prevenir 409 en el Futuro

Con el workflow actualizado, este error **NO debería volver a ocurrir** porque:
- ✅ Detenemos la app antes de deploy
- ✅ Usamos `clean: true` para limpiar archivos viejos
- ✅ Usamos `restart: true` para reiniciar automáticamente
- ✅ Iniciamos la app explícitamente después

## 📞 Necesitas Ayuda

Si después de seguir estos pasos el error persiste:
1. Comparte el log completo del deployment
2. Verifica el nombre exacto del Resource Group
3. Confirma que las variables de Azure estén configuradas

