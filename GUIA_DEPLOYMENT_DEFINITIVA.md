# 🚀 Guía Definitiva de Deployment - Hadda ERP Multi-Cliente

## 📋 Resumen Ejecutivo

Sistema de deployment multi-cliente usando:
- **Docker** para contenedorización
- **GitHub Container Registry** (privado) para distribución de imágenes
- **Azure App Service** o **Azure Container Instances** para hosting
- **Supabase** como base de datos PostgreSQL por cliente
- **Git Bash** como terminal en Windows

**Tiempo de deployment por cliente:** 5-10 minutos  
**Costo aproximado por cliente:** $30-75/mes

## 🔀 Dos Opciones de Deployment

### Opción 1: Azure App Service (Web App) ⭐ RECOMENDADO

**Script:** `deploy-webapp-azure.sh`

**Ventajas:**
- ✅ HTTPS automático con dominio *.azurewebsites.net
- ✅ SSL gratuito
- ✅ Mejor para aplicaciones web
- ✅ Soporte de custom domains más fácil
- ✅ Always-on incluido
- ✅ Logs integrados
- ✅ Health monitoring automático

**Desventajas:**
- ⚠️ Más caro (~$55-75/mes con plan B1)
- ⚠️ Requiere App Service Plan (compartido entre clientes)

**Cuándo usar:**
- Clientes de producción
- Necesitas dominio personalizado
- Aplicaciones que requieren alta disponibilidad
- Múltiples clientes (comparten el plan, más económico)

---

### Opción 2: Azure Container Instances (ACI)

**Script:** `deploy-cliente-azure.sh`

**Ventajas:**
- ✅ Más económico (~$30-40/mes por cliente)
- ✅ Facturación por segundo
- ✅ Deployment más rápido
- ✅ Recursos dedicados por cliente

**Desventajas:**
- ⚠️ Sin SSL/HTTPS automático
- ⚠️ URL menos amigable
- ⚠️ Sin custom domains fácil

**Cuándo usar:**
- Entornos de prueba/desarrollo
- Demos
- Clientes con bajo presupuesto
- Necesitas aislamiento completo por cliente

---

## ⚙️ Configuración Inicial (Una sola vez)

### 1. Credenciales de GitHub Container Registry

Como tu registro es privado, configura tus credenciales de forma permanente en Git Bash:

```bash
# Edita tu archivo de perfil de bash
nano ~/.bashrc

# Agrega al final (reemplaza con tus datos reales):
export GITHUB_USERNAME="tu-usuario-github"
export GITHUB_TOKEN="ghp_tu_token_aqui"

# Guarda y cierra (Ctrl+O, Enter, Ctrl+X)

# Recarga el perfil
source ~/.bashrc
```

**Para crear el token de GitHub:**
1. Ve a: https://github.com/settings/tokens
2. "Generate new token" → "Tokens (classic)"
3. Selecciona permisos: `read:packages` y `write:packages`
4. Copia el token generado (empieza con `ghp_`)

**Verificar que funcionó:**
```bash
echo $GITHUB_USERNAME
echo $GITHUB_TOKEN
# Deberían mostrar tus valores
```

### 2. Azure CLI

```bash
# Instalar Azure CLI (si no lo tienes)
# Windows: Descarga desde https://aka.ms/installazurecliwindows

# Login (solo una vez)
az login

# Verificar que estás conectado
az account show
```

### 3. Docker (opcional, solo si builds locales)

```bash
# Descargar Docker Desktop: https://www.docker.com/products/docker-desktop/

# Login a GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

### 4. Permisos de Scripts

```bash
cd /d/hadda-erp
chmod +x scripts/*.sh
```

---

## 🔄 Workflow Completo

### Build de Nueva Versión (Automático)

El sistema usa **GitHub Actions** que hace build automático en cada push:

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Nueva funcionalidad"
git push origin main

# 2. GitHub Actions automáticamente:
#    - Hace build de la imagen Docker
#    - La sube a ghcr.io/vskavo/hadda-erp:latest
#    - Tarda 5-10 minutos
```

**Verificar el build:**
- Ve a: https://github.com/vskavo/hadda-erp/actions
- Espera a que termine el workflow "Docker build and push"

### Build Manual (Opcional)

Si prefieres hacer build local:

```bash
./scripts/build-and-push.sh ghcr.io vskavo v1.0.0
```

---

## 🆕 Deployar Nuevo Cliente

### Opción A: Azure App Service (Recomendado para Producción)

#### Paso 1: Crear Base de Datos en Supabase

1. Ve a: https://supabase.com/dashboard
2. Click "New Project"
3. Configura:
   - **Name:** `cliente-nombre-erp`
   - **Database Password:** Genera un password seguro
   - **Region:** Selecciona la más cercana (ej: South America - São Paulo)

4. Espera a que se cree el proyecto (2-3 minutos)

5. Obtener Connection String:
   - Settings → Database → Connection string
   - Selecciona **"URI"**
   - Copia el string completo

**Formato esperado:**
```
postgresql://postgres.abcxyz:tu-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

#### Paso 2: Ejecutar Script de Web App Deployment

```bash
# Formato:
./scripts/deploy-webapp-azure.sh <nombre-cliente> '<connection-string-supabase>'

# Ejemplo real:
./scripts/deploy-webapp-azure.sh \
  waygroup-erp \
  'postgresql://postgres:yZ3BMZtYKTbN1WIK@db.svogecgysoxfcpcfkhtf.supabase.co:5432/postgres'
```

**IMPORTANTE:** 
- Este script crea un **Azure App Service (Web App)** con HTTPS y SSL
- URL final: `https://hadda-erp-waygroup-erp.azurewebsites.net`
- El nombre del cliente debe ser único, sin espacios, máximo 63 caracteres
- La connection string debe ir entre comillas simples
- El script requiere credenciales de GitHub configuradas

**El script automáticamente:**
- ✅ Verifica credenciales de GitHub
- ✅ Parsea la connection string de Supabase
- ✅ Verifica/crea el resource group en Azure
- ✅ Verifica/crea el App Service Plan
- ✅ Crea el Web App con Docker
- ✅ Configura HTTPS y SSL
- ✅ Genera JWT_SECRET único
- ✅ Configura variables de entorno
- ✅ Habilita continuous deployment
- ✅ Inicia la aplicación

**Tiempo estimado:** 5-10 minutos

---

### Opción B: Azure Container Instances (Para pruebas/desarrollo)

Si prefieres usar **Container Instances** (más económico pero sin HTTPS):

```bash
./scripts/deploy-cliente-azure.sh \
  waygroup-erp \
  'postgresql://postgres:yZ3BMZtYKTbN1WIK@db.svogecgysoxfcpcfkhtf.supabase.co:5432/postgres'
```

**URL final:** `http://hadda-erp-waygroup-erp.eastus.azurecontainer.io`

---

### Paso 3: Verificar Deployment

```bash
./scripts/check-cliente.sh waygroup-erp
```

**Deberías ver:**
```
=== Estado del Cliente: waygroup-erp ===
📦 Container Status: ✅ Running
🌐 URL: https://hadda-erp-waygroup-erp.eastus.azurecontainer.io
🏥 Health Check: ✅ Healthy (HTTP 200)
```

### Paso 4: Verificar en Supabase

1. Ve a tu proyecto en Supabase
2. Table Editor
3. Deberías ver **35 tablas** creadas automáticamente:
   - usuarios
   - roles
   - permisos
   - clientes
   - proyectos
   - cursos
   - facturas
   - ingresos/egresos
   - etc.

### Paso 5: Acceder al Sistema

**URL (Web App):** https://hadda-erp-waygroup-erp.azurewebsites.net  
**URL (Container Instance):** http://hadda-erp-waygroup-erp.eastus.azurecontainer.io

**Credenciales de Admin:**
- Email: `admin@waygroup-erp.com`
- Password: `Temporal123!`

**⚠️ IMPORTANTE:** El cliente DEBE cambiar este password en el primer login.

---

## 📊 Gestión de Clientes

### Listar Todos los Clientes

```bash
./scripts/list-clientes.sh
```

**Salida:**
```
=== Clientes Deployados ===
CLIENTE                        ESTADO          URL
────────────────────────────────────────────────────────────────────
waygroup-erp                   ✅ Running      https://hadda-erp-waygroup...
cliente2                       ✅ Running      https://hadda-erp-cliente2...
Total de clientes: 2
```

### Ver Estado de un Cliente

```bash
./scripts/check-cliente.sh waygroup-erp
```

### Ver Logs de un Cliente

```bash
# Últimas 50 líneas
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-waygroup-erp \
  --tail 50

# En tiempo real
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-waygroup-erp \
  --follow

# Buscar errores
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-waygroup-erp \
  | grep -i error
```

### Actualizar Cliente a Nueva Versión

```bash
# 1. Primero hacer push con los cambios (GitHub Actions hace build)
git add .
git commit -m "Nueva funcionalidad"
git push origin main

# 2. Esperar a que termine el build en GitHub Actions (5-10 min)

# 3. Actualizar el cliente
./scripts/update-cliente.sh waygroup-erp
```

### Actualizar TODOS los Clientes

```bash
# Script para actualizar todos los clientes de una vez
for cliente in $(./scripts/list-clientes.sh | grep "Running" | awk '{print $1}'); do
    echo "Actualizando $cliente..."
    ./scripts/update-cliente.sh $cliente
    sleep 30
done
```

### Eliminar Cliente

```bash
./scripts/delete-cliente.sh waygroup-erp
# Te pedirá confirmación
```

**⚠️ NOTA:** Esto NO elimina la base de datos en Supabase, solo el contenedor en Azure.

---

## 🆘 Troubleshooting

### Error: "argument --registry-username: expected one argument"

**Causa:** Las variables de entorno no están configuradas.

**Solución:**
```bash
# Verifica que estén configuradas
echo $GITHUB_USERNAME
echo $GITHUB_TOKEN

# Si están vacías, recargar el perfil
source ~/.bashrc

# O configurarlas temporalmente para esta sesión
export GITHUB_USERNAME="tu-usuario"
export GITHUB_TOKEN="ghp_tu_token"
```

### Error: "unauthorized: authentication required"

**Causa:** Las credenciales de GitHub son incorrectas o el token expiró.

**Solución:**
1. Verifica tu token en GitHub: https://github.com/settings/tokens
2. Si expiró, genera uno nuevo
3. Actualiza la variable: `export GITHUB_TOKEN="ghp_nuevo_token"`
4. Actualiza en `~/.bashrc` para que sea permanente

### Container en estado "Waiting" o "Failed"

**Causa:** Puede ser la connection string de Supabase incorrecta.

**Solución:**
```bash
# Ver logs detallados
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-nombre-cliente \
  --tail 100

# Problemas comunes:
# - Password de Supabase con caracteres especiales sin escapar
# - Puerto incorrecto (debe ser 6543 para pooler, 5432 para directo)
# - Host incorrecto
```

### Tablas no se crean en Supabase

**Causa:** El usuario de Supabase no tiene permisos de CREATE TABLE.

**Solución:**
- Verifica que estés usando el usuario `postgres` de Supabase
- El script de inicialización debería crear las tablas automáticamente

### Health Check Falla

**Solución:**
```bash
# Ver logs de inicio
./scripts/check-cliente.sh nombre-cliente

# Ver logs completos
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-nombre-cliente \
  --tail 100

# Reiniciar container
az container restart \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-nombre-cliente
```

---

## 💰 Costos Estimados

### Opción A: Azure App Service (Web App)

| Componente | SKU | Costo Mensual |
|-----------|-----|---------------|
| **Azure App Service Plan B1** | 1 core, 1.75GB RAM | $55 |
| **Supabase Free** | 500MB, 2GB bandwidth | $0 |
| **Supabase Pro** | 8GB, 250GB bandwidth | $25 |
| **Total (con Supabase Free)** | | **$55** |
| **Total (con Supabase Pro)** | | **$80** |

**Nota:** El App Service Plan B1 puede alojar múltiples clientes, reduciendo el costo por cliente.

### Opción B: Azure Container Instances (ACI)

| Componente | SKU | Costo Mensual |
|-----------|-----|---------------|
| **Azure Container Instance** | 1 vCPU, 1.5GB RAM | $30-40 |
| **Supabase Free** | 500MB, 2GB bandwidth | $0 |
| **Supabase Pro** | 8GB, 250GB bandwidth | $25 |
| **Total (con Supabase Free)** | | **$30-40** |
| **Total (con Supabase Pro)** | | **$55-65** |

---

## 🔒 Seguridad

### Mejores Prácticas

1. **JWT Secret Único:**
   - El script genera uno automáticamente por cliente
   - Nunca reutilizar entre clientes

2. **Passwords Temporales:**
   - `Temporal123!` debe cambiarse en el primer login
   - El sistema lo requiere automáticamente

3. **Connection Strings:**
   - Nunca commitear a Git
   - Guardar en un vault seguro (1Password, Bitwarden, etc.)

4. **GitHub Token:**
   - Guardar en `~/.bashrc` (tu máquina)
   - Nunca compartir ni commitear

5. **SSL:**
   - Siempre usar `DB_SSL=true` con Supabase ✅
   - El script lo configura automáticamente

---

## 📝 Comandos Esenciales (Cheat Sheet)

```bash
# ═══════════════════════════════════════════════════════════
# CONFIGURACIÓN INICIAL (una sola vez)
# ═══════════════════════════════════════════════════════════

# Configurar credenciales de GitHub
nano ~/.bashrc
# Agregar:
# export GITHUB_USERNAME="tu-usuario"
# export GITHUB_TOKEN="ghp_tu_token"
source ~/.bashrc

# Login Azure
az login

# ═══════════════════════════════════════════════════════════
# DEPLOYMENT DE CLIENTE
# ═══════════════════════════════════════════════════════════

# OPCIÓN A: Azure App Service (Producción - con HTTPS)
./scripts/deploy-webapp-azure.sh cliente-nombre 'postgresql://...'

# OPCIÓN B: Container Instances (Desarrollo - sin HTTPS)
./scripts/deploy-cliente-azure.sh cliente-nombre 'postgresql://...'

# Verificar deployment
./scripts/check-cliente.sh cliente-nombre

# ═══════════════════════════════════════════════════════════
# GESTIÓN DIARIA
# ═══════════════════════════════════════════════════════════

# Listar clientes
./scripts/list-clientes.sh

# Ver logs
az container logs --resource-group hadda-clientes-rg --name hadda-erp-cliente-nombre --tail 50

# Actualizar cliente
./scripts/update-cliente.sh cliente-nombre

# Reiniciar cliente
az container restart --resource-group hadda-clientes-rg --name hadda-erp-cliente-nombre

# Eliminar cliente
./scripts/delete-cliente.sh cliente-nombre

# ═══════════════════════════════════════════════════════════
# ACTUALIZACIÓN DE CÓDIGO
# ═══════════════════════════════════════════════════════════

# Hacer cambios y deploy
git add .
git commit -m "Cambios"
git push origin main
# Esperar GitHub Actions (5-10 min)
# Luego actualizar clientes con update-cliente.sh

# ═══════════════════════════════════════════════════════════
# DEBUGGING
# ═══════════════════════════════════════════════════════════

# Verificar credenciales
echo $GITHUB_USERNAME
echo $GITHUB_TOKEN

# Ver logs detallados
az container logs --resource-group hadda-clientes-rg --name hadda-erp-cliente-nombre --tail 100

# Ver estado del container
az container show --resource-group hadda-clientes-rg --name hadda-erp-cliente-nombre
```

---

## ✅ Checklist de Deployment por Cliente

- [ ] Crear proyecto en Supabase
- [ ] Obtener connection string
- [ ] Decidir: ¿Web App (producción) o Container Instance (desarrollo)?
- [ ] Ejecutar script de deployment correspondiente
- [ ] Verificar que la app está "Running" o "Ready"
- [ ] Verificar acceso HTTPS (Web App) o HTTP (Container)
- [ ] Verificar 35 tablas creadas en Supabase
- [ ] Login con admin@cliente.com / Temporal123!
- [ ] Cliente cambia password en primer login
- [ ] Entregar credenciales al cliente
- [ ] Documentar en archivo seguro (clientes.txt o vault)

---

## 📚 Archivos de Referencia

- **Este archivo:** Guía principal de deployment
- **`scripts/GITHUB_CREDENTIALS_README.md`:** Detalles sobre credenciales de GitHub
- **`scripts/README.md`:** Documentación detallada de cada script
- **`docker-entrypoint.sh`:** Script de inicialización del contenedor
- **`Dockerfile`:** Configuración de la imagen Docker

---

## 🎯 Flujo de Trabajo Típico

```
┌─────────────────────────────────────────────────────────┐
│ 1. Desarrollo                                           │
│    - Hacer cambios en código                            │
│    - git push origin main                               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Build Automático (GitHub Actions)                    │
│    - Checkout código                                    │
│    - Build imagen Docker                                │
│    - Push a ghcr.io/vskavo/hadda-erp:latest            │
│    Tiempo: 5-10 minutos                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Deployment de Cliente                                │
│    - Cliente crea BD en Supabase                        │
│    - Ejecutar: ./scripts/deploy-cliente-azure.sh       │
│    Tiempo: 5-10 minutos                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Verificación                                         │
│    - Container running ✅                               │
│    - Health check OK ✅                                 │
│    - Tablas creadas ✅                                  │
│    - Login funcional ✅                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs:**
   ```bash
   ./scripts/check-cliente.sh nombre-cliente
   ```

2. **Verifica configuración:**
   ```bash
   echo $GITHUB_USERNAME
   echo $GITHUB_TOKEN
   ```

3. **Consulta documentación:**
   - scripts/GITHUB_CREDENTIALS_README.md
   - scripts/README.md

4. **Comandos útiles:**
   ```bash
   az container show --resource-group hadda-clientes-rg --name hadda-erp-cliente
   az container logs --resource-group hadda-clientes-rg --name hadda-erp-cliente --tail 100
   ```

---

**Versión:** 1.0.0  
**Fecha:** 26 de Octubre, 2025  
**Autor:** Sistema Hadda ERP  
**Estrategia:** Docker + Azure Container Instances + Supabase

🚀 **¡Listo para producción!**

