# 🐳 Guía Completa: Docker Deployment Multi-Cliente (Azure Web App + Supabase)

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Setup Inicial](#setup-inicial)
4. [Deployment de Clientes](#deployment-de-clientes)
5. [Gestión Diaria](#gestión-diaria)
6. [Actualización Masiva](#actualización-masiva)
7. [Scripts Disponibles](#scripts-disponibles)
8. [Container Registry](#container-registry)
9. [Supabase Configuration](#supabase-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Costos](#costos)

---

## Introducción

Este sistema te permite deployar múltiples instancias de Hadda ERP para diferentes clientes usando:
- **Docker** para contenedorización
- **GitHub Container Registry** para distribución de la imagen
- **Supabase** como base de datos PostgreSQL gestionada
- **Azure Web App (App Service)** para hosting con HTTPS automático y SSL

### Características Principales

✅ **Sync Automático de Esquema** - Crea 35 tablas automáticamente  
✅ **Usuario Admin Automático** - Con credenciales configurables  
✅ **Deployment en 5-10 minutos** por cliente  
✅ **Actualizaciones Centralizadas** - Una imagen para todos  
✅ **Scripts Automatizados** - Gestión completa desde CLI  
✅ **Datos Aislados** - Cada cliente su propia BD en Supabase  

### ⚠️ Changelog Importante (Octubre 2025)

**Scripts actualizados para Azure CLI v2.x+**
- ✅ Parámetros deprecados reemplazados con nuevos:
  - `--docker-custom-image-name` → `--container-image-name`
  - `--docker-registry-server-url` → `--container-registry-url`
  - `--docker-registry-server-user` → `--container-registry-user`
  - `--docker-registry-server-password` → `--container-registry-password`
- ✅ Compatibilidad garantizada con futuras versiones de Azure CLI
- ✅ Sin warnings de deprecación en los logs

---

## Arquitectura

```
GitHub Repository
    ↓ (push)
GitHub Actions (build automático)
    ↓
Container Registry (ghcr.io)
    ↓ (pull)
┌──────────────────────────────────────────────┐
│  Múltiples Deployments                       │
├──────────────────────────────────────────────┤
│ Cliente 1 (Azure) → Supabase DB 1           │
│ Cliente 2 (Azure) → Supabase DB 2           │
│ Cliente 3 (Azure) → Supabase DB 3           │
│ Cliente N (Azure) → Supabase DB N           │
└──────────────────────────────────────────────┘
```

### Componentes Docker

**1. Dockerfile (Multi-stage)**
- Stage 1: Builder - Instala dependencias y build
- Stage 2: Production - Imagen optimizada (~200MB)

**2. docker-entrypoint.sh**
Inicialización automática:
```bash
1. Espera PostgreSQL (hasta 60 segundos)
2. Sincroniza esquema (crea 35 tablas si no existen)
3. Ejecuta migraciones adicionales (opcionales)
4. Crea rol 'superadmin'
5. Crea usuario admin (si CREATE_DEFAULT_ADMIN=true)
6. Inicia aplicación (node start.js)
```

**3. docker-compose.yml**
Para desarrollo local con PostgreSQL incluido

---

## Setup Inicial

### Prerequisitos

```bash
# Docker Desktop
# Descargar: https://www.docker.com/products/docker-desktop/

# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Git
# Ya lo tienes ;)
```

### Configuración One-Time

**1. Permisos de Scripts**
```bash
chmod +x scripts/*.sh
```

**2. Login a Azure**
```bash
az login
```

**3. Login a Container Registry**

**GitHub Container Registry (Recomendado):**
```bash
# Crear Personal Access Token en GitHub con permisos de packages
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

**Azure Container Registry:**
```bash
az acr login --name haddaerpregistry
```

**Docker Hub:**
```bash
docker login
```

**4. Build Imagen Inicial**

Automático (recomendado):
```bash
git push origin main
# GitHub Actions hace build y push automáticamente
```

Manual:
```bash
./scripts/build-and-push.sh ghcr.io vskavo v1.0.0
```

---

## Deployment de Clientes

### Proceso Completo (5-10 minutos)

#### Paso 1: Cliente Crea Proyecto Supabase

1. Ve a: https://supabase.com/dashboard
2. Click "New Project"
3. Configura:
   - Name: `cliente-nombre-erp`
   - Database Password: (genera seguro)
   - Region: Más cercana al cliente

4. Obtener Connection String:
   - Settings → Database → Connection string → URI
   - Copia el formato completo

Ejemplo:
```
postgresql://postgres.abcxyz:tu-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Paso 2: Deploy con Script

```bash
./scripts/deploy-cliente-azure.sh \
  empresa-abc \
  'postgresql://postgres.xyz:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
```

El script:
- ✅ Crea container en Azure
- ✅ Configura todas las variables de entorno
- ✅ Genera JWT_SECRET único
- ✅ Inicia el contenedor

#### Paso 3: Verificar Deployment

```bash
./scripts/check-cliente.sh empresa-abc
```

Verás:
```
=== Estado del Cliente: empresa-abc ===
📦 Container Status: ✅ Running
🌐 URL: https://hadda-erp-empresa-abc.eastus.azurecontainer.io
🏥 Health Check: ✅ Healthy (HTTP 200)
```

#### Paso 4: Entregar Credenciales

```
URL: https://hadda-erp-empresa-abc.eastus.azurecontainer.io
Email: admin@empresa-abc.com
Password: Temporal123!

⚠️ El cliente DEBE cambiar el password al primer login
```

---

## Gestión Diaria

### Listar Todos los Clientes

```bash
./scripts/list-clientes.sh
```

Output:
```
=== Clientes Deployados ===
CLIENTE                        ESTADO          URL
──────────────────────────────────────────────────────────────────────
empresa-abc                    ✅ Running      https://hadda-erp-empresa-abc.eastus...
empresa-xyz                    ✅ Running      https://hadda-erp-empresa-xyz.eastus...
Total de clientes: 2
```

### Verificar Estado de Cliente

```bash
./scripts/check-cliente.sh empresa-abc
```

### Ver Logs de Cliente

```bash
# Últimas 50 líneas
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-empresa-abc \
  --tail 50

# En tiempo real (follow)
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-empresa-abc \
  --follow

# Buscar errores
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-empresa-abc \
  | grep -i error
```

### Actualizar Cliente a Nueva Versión

```bash
# 1. Build nueva imagen (automático con push)
git add .
git commit -m "Nueva feature"
git push origin main

# 2. Actualizar cliente específico
./scripts/update-cliente.sh empresa-abc

# 3. O actualizar todos los clientes
for cliente in $(./scripts/list-clientes.sh | grep -v "^━" | grep -v "CLIENTE" | grep -v "Total" | awk '{print $1}'); do
    echo "Actualizando $cliente..."
    ./scripts/update-cliente.sh $cliente
    sleep 30
done
```

### Eliminar Cliente

```bash
./scripts/delete-cliente.sh empresa-abc
# Confirmación requerida: escribe "DELETE"
```

**⚠️ Nota:** Esto NO elimina la base de datos en Supabase, solo el container.

---

## Scripts Disponibles

### Scripts para Azure Web App (RECOMENDADO)

#### `deploy-webapp-azure.sh` ⭐
Deploya nuevo cliente en Azure Web App con HTTPS automático.

```bash
# Uso:
./scripts/deploy-webapp-azure.sh <cliente-name> <supabase-connection-string> [app-service-plan] [resource-group]

# Ejemplo:
./scripts/deploy-webapp-azure.sh \
  empresa-abc \
  'postgresql://postgres.xyz:pass@host:6543/postgres'

# Con opciones personalizadas:
./scripts/deploy-webapp-azure.sh \
  empresa-abc \
  'postgresql://...' \
  mi-plan-custom \
  mi-resource-group
```

**Características:**
- ✅ HTTPS automático con SSL
- ✅ Health check configurado
- ✅ Always-on habilitado
- ✅ Continuous deployment desde GitHub
- ✅ Custom domains fácil de configurar

#### `update-webapp.sh`
Actualiza un cliente específico a la última versión.

```bash
./scripts/update-webapp.sh empresa-abc
```

#### `update-all-webapps.sh` ⭐
Actualiza TODOS los clientes de forma masiva.

```bash
./scripts/update-all-webapps.sh
# Pide confirmación antes de ejecutar
```

#### `list-webapps.sh`
Lista todos los clientes deployados.

```bash
./scripts/list-webapps.sh
```

#### `delete-webapp.sh`
Elimina un cliente (requiere confirmación).

```bash
./scripts/delete-webapp.sh empresa-abc
```

---

### Scripts Generales

#### `build-and-push.sh`
Construye y sube imagen a Container Registry.

```bash
# Uso:
./scripts/build-and-push.sh [registry] [username] [version]

# Ejemplos:
./scripts/build-and-push.sh ghcr.io vskavo v1.0.0
./scripts/build-and-push.sh docker.io vskavo latest
./scripts/build-and-push.sh haddaerpregistry.azurecr.io '' v1.1.0
```

### `deploy-cliente-azure.sh`
Deploya nuevo cliente en Azure Container Instances.

```bash
# Uso:
./scripts/deploy-cliente-azure.sh <cliente-name> <supabase-connection-string> [resource-group] [registry]

# Ejemplo:
./scripts/deploy-cliente-azure.sh \
  empresa-abc \
  'postgresql://postgres.xyz:pass@host:6543/postgres' \
  hadda-clientes-rg \
  ghcr.io/vskavo/hadda-erp:latest
```

### `check-cliente.sh`
Verifica estado y salud de un cliente.

```bash
# Uso:
./scripts/check-cliente.sh <cliente-name> [resource-group]

# Ejemplo:
./scripts/check-cliente.sh empresa-abc
```

### `update-cliente.sh`
Actualiza cliente a la última versión de la imagen.

```bash
# Uso:
./scripts/update-cliente.sh <cliente-name> [resource-group]

# Ejemplo:
./scripts/update-cliente.sh empresa-abc
```

### `list-clientes.sh`
Lista todos los clientes deployados.

```bash
# Uso:
./scripts/list-clientes.sh [resource-group]

# Ejemplo:
./scripts/list-clientes.sh hadda-clientes-rg
```

### `delete-cliente.sh`
Elimina un cliente (requiere confirmación).

```bash
# Uso:
./scripts/delete-cliente.sh <cliente-name> [resource-group]

# Ejemplo:
./scripts/delete-cliente.sh empresa-abc
```

---

## Container Registry

### GitHub Container Registry (Recomendado)

**Ventajas:**
- ✅ Gratis para repos públicos
- ✅ Integrado con GitHub Actions
- ✅ Sin límites de almacenamiento

**Configuración:**

1. Crear Personal Access Token:
   - GitHub → Settings → Developer settings → Personal access tokens
   - Scopes: `write:packages`, `read:packages`

2. Login:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

3. Build y Push:
```bash
docker build -t ghcr.io/vskavo/hadda-erp:latest .
docker push ghcr.io/vskavo/hadda-erp:latest
```

**Workflow Automático:**
Ya está configurado en `.github/workflows/docker-deploy.yml`. Hace build y push automáticamente en cada push a `main`.

### Azure Container Registry

**Ventajas:**
- ✅ Integrado con Azure
- ✅ Geo-replicación
- ✅ Privado por defecto

**Configuración:**

```bash
# Crear ACR
az acr create \
  --resource-group hadda-rg \
  --name haddaerpregistry \
  --sku Basic

# Login
az acr login --name haddaerpregistry

# Build y push
docker build -t haddaerpregistry.azurecr.io/hadda-erp:latest .
docker push haddaerpregistry.azurecr.io/hadda-erp:latest
```

### Docker Hub

**Ventajas:**
- ✅ Conocido mundialmente
- ✅ 1 repo privado gratis

**Configuración:**

```bash
# Login
docker login

# Build y push
docker build -t vskavo/hadda-erp:latest .
docker push vskavo/hadda-erp:latest
```

---

## Supabase Configuration

### Connection Strings

Supabase ofrece dos tipos de conexión:

**1. Connection Pooler (Recomendado para apps web):**
```
postgresql://postgres.ref:password@host.pooler.supabase.com:6543/postgres
```
- Puerto: `6543`
- Mejor para muchas conexiones concurrentes

**2. Direct Connection:**
```
postgresql://postgres.ref:password@host.supabase.com:5432/postgres
```
- Puerto: `5432`
- Para migraciones y operaciones admin

### Variables de Entorno

El script de deployment configura automáticamente:

```bash
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ref
DB_PASSWORD=tu-password
DB_SSL=true

NODE_ENV=production
PORT=8080

JWT_SECRET=generado-automaticamente-unico

CREATE_DEFAULT_ADMIN=true
DEFAULT_ADMIN_EMAIL=admin@cliente.com
DEFAULT_ADMIN_PASSWORD=Temporal123!

BASE_URL=https://hadda-erp-cliente.eastus.azurecontainer.io
```

### Verificar Tablas en Supabase

1. Ve a Supabase Dashboard
2. Table Editor
3. Deberías ver 35 tablas creadas automáticamente:
   - usuarios
   - roles
   - permisos
   - clientes
   - proyectos
   - cursos
   - etc.

---

## Troubleshooting

### Container No Inicia

**Síntoma:** Container en estado "Waiting" o "Failed"

**Solución:**
```bash
# Ver logs
./scripts/check-cliente.sh cliente-nombre

# Ver logs completos
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente-nombre \
  --tail 100
```

**Problemas Comunes:**
- ❌ Connection string de Supabase incorrecta
- ❌ Password con caracteres especiales sin escapar
- ❌ Supabase database no accesible
- ❌ Variables de entorno faltantes

### Error "Connection Refused"

**Causa:** Supabase database no accesible

**Solución:**
1. Verifica que el proyecto Supabase esté activo
2. Verifica la connection string
3. Verifica que DB_SSL=true

### Tablas No Se Crean

**Síntoma:** Logs muestran "Base de datos vacía" pero tablas no se crean

**Solución:**
```bash
# Ver logs de sync
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente \
  | grep "Sincronizando"

# Verificar permisos en Supabase
# El usuario debe tener permisos de CREATE TABLE
```

### Usuario Admin No Se Crea

**Causa:** Variable CREATE_DEFAULT_ADMIN no configurada

**Solución:**
```bash
# Verificar variables
az container show \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente \
  --query containers[0].environmentVariables

# Debe aparecer: CREATE_DEFAULT_ADMIN=true
```

### Health Check Falla

**Síntoma:** HTTP status code diferente de 200

**Solución:**
```bash
# Ver logs de la app
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente \
  --tail 50

# Verificar que el puerto 8080 está expuesto
# Verificar que la app inició correctamente
```

### Deployment Muy Lento

**Causa:** Azure está pulling una imagen muy grande

**Solución:**
- Espera paciente (primera vez puede tardar 5-10 min)
- Verifica el tamaño de la imagen: `docker images`
- Optimiza el Dockerfile si es necesario

---

## Costos

### Por Cliente

| Componente | SKU | Costo Mensual |
|-----------|-----|---------------|
| **Azure Container Instance** | 1 vCPU, 1.5GB RAM | $30-40 |
| **Supabase Free Tier** | 500MB, 2GB bandwidth | $0 |
| **Supabase Pro** | 8GB, 250GB bandwidth | $25 |
| **Total (Free)** | | **$30-40** |
| **Total (Pro)** | | **$55-65** |

### Opciones de Ahorro

**1. Container más pequeño (clientes pequeños):**
```bash
--cpu 0.5 --memory 1
# Costo: ~$15-20/mes
```

**2. App Service Plan Compartido (múltiples clientes):**
```bash
# Un App Service Plan para todos los clientes
# Costo: $55/mes para plan B1 (soporta ~5-10 clientes pequeños)
```

**3. Supabase Free Tier:**
- Hasta 500MB de datos
- Perfecto para clientes pequeños/piloto

---

## Desarrollo Local

### Usar docker-compose

```bash
# Iniciar todo (PostgreSQL + App)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# La app estará en: http://localhost:8080
# PostgreSQL: localhost:5432

# Detener
docker-compose down

# Detener y eliminar datos
docker-compose down -v
```

### Variables de Entorno Local

Edita `docker-compose.yml` o crea `.env`:

```bash
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hadda_erp
DB_USER=hadda_user
DB_PASSWORD=hadda_password_dev
DB_SSL=false

CREATE_DEFAULT_ADMIN=true
DEFAULT_ADMIN_EMAIL=admin@local.com
DEFAULT_ADMIN_PASSWORD=Admin123!
```

---

## Checklist de Deployment

### Para Cada Cliente Nuevo:

- [ ] Cliente crea proyecto Supabase
- [ ] Obtener connection string de Supabase
- [ ] Ejecutar script de deployment
- [ ] Verificar que container está "Running"
- [ ] Verificar health check (HTTP 200)
- [ ] Verificar logs de inicialización
- [ ] Confirmar creación de 35 tablas en Supabase
- [ ] Confirmar creación de usuario admin
- [ ] Login con credenciales de admin
- [ ] Cambiar password del admin
- [ ] Configurar dominio custom (opcional)
- [ ] Agregar a `clientes.json` para tracking
- [ ] Entregar credenciales al cliente
- [ ] Documentar en vault seguro

---

## Seguridad

### Best Practices

1. **JWT Secret Único:**
   - El script genera automáticamente uno por cliente
   - Nunca reutilizar entre clientes

2. **Passwords Temporales:**
   - `DEFAULT_ADMIN_PASSWORD` debe cambiarse al primer login
   - Configurar `requiere_cambio_password=true` (ya lo hace el script)

3. **Connection Strings:**
   - Nunca commitear a Git
   - Guardar en vault seguro (Azure Key Vault, 1Password, etc.)

4. **SSL:**
   - Siempre usar `DB_SSL=true` con Supabase
   - Usar HTTPS para la app

5. **Firewall:**
   - Configurar reglas de firewall en Supabase si es necesario
   - Restringir acceso por IP si es posible

---

## Gestión de Clientes

### Template `clientes.json`

Usa `clientes.example.json` como base:

```json
{
  "clientes": [
    {
      "id": "empresa-abc",
      "nombre": "Empresa ABC S.A.",
      "supabase_url": "aws-0-us-east-1.pooler.supabase.com",
      "deployment": {
        "url": "https://hadda-erp-empresa-abc.eastus.azurecontainer.io",
        "deployed_at": "2025-10-02T10:30:00Z",
        "version": "v1.0.0"
      },
      "admin_email": "admin@empresa-abc.com",
      "active": true
    }
  ]
}
```

---

## Actualizaciones

### Release Nueva Versión

```bash
# 1. Hacer cambios en código
git add .
git commit -m "Feature: Nueva funcionalidad"

# 2. Tag de versión
git tag v1.1.0
git push origin v1.1.0
git push origin main

# 3. GitHub Actions hace build automático
# Esperar 5-10 minutos

# 4. Verificar imagen
docker pull ghcr.io/vskavo/hadda-erp:latest

# 5. Actualizar clientes
./scripts/update-cliente.sh cliente1
./scripts/update-cliente.sh cliente2
# etc...
```

---

## Comandos Esenciales

```bash
# BUILD Y DEPLOY
./scripts/build-and-push.sh ghcr.io vskavo v1.0.0
./scripts/deploy-cliente-azure.sh cliente1 "connection-string"

# GESTIÓN
./scripts/list-clientes.sh
./scripts/check-cliente.sh cliente1
./scripts/update-cliente.sh cliente1
./scripts/delete-cliente.sh cliente1

# LOGS
az container logs --resource-group hadda-clientes-rg --name hadda-erp-cliente1 --tail 50
az container logs --resource-group hadda-clientes-rg --name hadda-erp-cliente1 --follow

# RESTART
az container restart --resource-group hadda-clientes-rg --name hadda-erp-cliente1

# ESTADO
az container show --resource-group hadda-clientes-rg --name hadda-erp-cliente1
```

---

## Soporte

### Recursos

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Azure Portal:** https://portal.azure.com
- **GitHub Container Registry:** https://github.com/users/vskavo/packages
- **Scripts README:** `scripts/README.md`

### Logs Útiles

Al deployar verás en los logs:
```
=== Hadda ERP - Inicialización ===
Esperando a que la base de datos esté lista...
✓ Base de datos está lista

=== Sincronizando Esquema de Base de Datos ===
⚠️  Base de datos vacía o incompleta detectada
📦 Creando tablas desde los modelos...
✓ Total de tablas creadas: 35

=== Creando Usuario Administrador ===
✓ Creando rol superadmin...
✓ Rol superadmin encontrado con ID: 1
========================================
✓ Usuario administrador creado
========================================
Email: admin@cliente.com
Password: Temporal123!
========================================

=== Iniciando Aplicación ===
Server listening on port 8080...
```

---

## Conclusión

Este sistema te permite deployar y gestionar múltiples instancias de Hadda ERP de forma:

- ✅ **Rápida:** 5-10 minutos por cliente
- ✅ **Automática:** Scripts para todo
- ✅ **Escalable:** 100+ clientes sin problema
- ✅ **Segura:** Datos aislados, JWT único, SSL
- ✅ **Económica:** $30-65/mes por cliente
- ✅ **Profesional:** Usando tecnologías estándar de la industria

**¡Listo para producción!** 🚀

---

**Creado:** 2 de Octubre, 2025  
**Versión:** 1.0.0  
**Autor:** Sistema de Deployment Hadda ERP

