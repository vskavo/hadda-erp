# 🛠️ Scripts de Deployment Multi-Cliente

Estos scripts facilitan el deployment y gestión de múltiples clientes usando Container Registry + Supabase.

---

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `build-and-push.sh` | Construye y sube imagen a Container Registry |
| `deploy-cliente-azure.sh` | Deploya un nuevo cliente en Azure |
| `check-cliente.sh` | Verifica estado de un cliente |
| `update-cliente.sh` | Actualiza un cliente a nueva versión |
| `list-clientes.sh` | Lista todos los clientes deployados |
| `delete-cliente.sh` | Elimina un cliente |

---

## 🚀 Guía Rápida

### 1. Build y Push Imagen

```bash
# GitHub Container Registry (recomendado)
./scripts/build-and-push.sh ghcr.io vskavo v1.0.0

# Azure Container Registry
./scripts/build-and-push.sh haddaerpregistry.azurecr.io '' v1.0.0

# Docker Hub
./scripts/build-and-push.sh docker.io vskavo v1.0.0
```

### 2. Deploy Nuevo Cliente

**Paso A: Configurar variables de GitHub**
```bash
export GITHUB_USERNAME=tu-usuario-github
export GITHUB_TOKEN=ghp_tu_personal_access_token
```

**Paso B: Crear proyecto Supabase**
1. Ve a https://supabase.com/dashboard
2. New Project → Configura nombre y región
3. Settings → Database → Connection String
4. Copia la connection string (URI format)

**Paso C: Deploy**
```bash
./scripts/deploy-webapp-azure.sh \
  cliente1 \
  'postgresql://postgres.abc:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
```

**O en una sola línea:**
```bash
GITHUB_USERNAME=vskavo GITHUB_TOKEN=ghp_xxx ./scripts/deploy-webapp-azure.sh cliente1 'postgresql://...'
```

### 3. Verificar Cliente

```bash
./scripts/check-cliente.sh cliente1
```

### 4. Listar Todos los Clientes

```bash
./scripts/list-clientes.sh
```

### 5. Actualizar Cliente

```bash
# Primero, build y push nueva versión
./scripts/build-and-push.sh ghcr.io vskavo v1.1.0

# Luego, actualizar cliente (pull nueva imagen)
./scripts/update-cliente.sh cliente1
```

### 6. Eliminar Cliente

```bash
./scripts/delete-cliente.sh cliente1
```

---

## ⚙️ Configuración Inicial

### Permisos de Ejecución

```bash
chmod +x scripts/*.sh
```

### Azure CLI

```bash
# Instalar (si no está instalado)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Configurar subscription (si tienes múltiples)
az account set --subscription "Tu-Subscription-ID"
```

### Docker

```bash
# Login a GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Login a Azure Container Registry
az acr login --name haddaerpregistry

# Login a Docker Hub
docker login
```

---

## 📊 Workflow Típico

### Nuevo Cliente

```bash
# 1. Crear proyecto Supabase
#    → https://supabase.com/dashboard

# 2. Copiar connection string
SUPABASE_CONN="postgresql://postgres.xxx:pass@host:6543/postgres"

# 3. Deploy
./scripts/deploy-cliente-azure.sh empresa-abc "$SUPABASE_CONN"

# 4. Verificar
./scripts/check-cliente.sh empresa-abc

# 5. Guardar credenciales
echo "Cliente: empresa-abc" >> clientes.txt
echo "Admin: admin@empresa-abc.com / Temporal123!" >> clientes.txt
echo "URL: https://hadda-erp-empresa-abc.eastus.azurecontainer.io" >> clientes.txt
echo "---" >> clientes.txt
```

### Actualización General

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "Nueva feature"
git push origin main

# 2. Build nueva imagen
./scripts/build-and-push.sh ghcr.io vskavo v1.2.0

# 3. Actualizar todos los clientes
for cliente in $(./scripts/list-clientes.sh | grep -v "^━" | grep -v "CLIENTE" | grep -v "Total" | awk '{print $1}'); do
    echo "Actualizando $cliente..."
    ./scripts/update-cliente.sh $cliente
    sleep 30
done
```

---

## 🔧 Variables de Entorno

Los scripts usan estas variables (configurables):

```bash
# Resource Group por defecto
RESOURCE_GROUP=hadda-clientes-rg

# Container Registry
REGISTRY=ghcr.io/vskavo/hadda-erp

# Region de Azure
AZURE_REGION=eastus

# Email para SendGrid (opcional)
SENDGRID_API_KEY=tu-api-key
```

Puedes override en cada llamada:

```bash
./scripts/deploy-cliente-azure.sh cliente1 "$SUPABASE_CONN" mi-resource-group ghcr.io/otro/imagen
```

---

## 📝 Logs y Debugging

### Ver logs de un cliente

```bash
# Últimas 50 líneas
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente1 \
  --tail 50

# En tiempo real (follow)
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente1 \
  --follow
```

### Buscar errores en logs

```bash
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente1 \
  | grep -i error
```

### Ver detalles del container

```bash
az container show \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente1 \
  --output json
```

---

## 🆘 Troubleshooting

### Container no inicia

```bash
# Ver logs de error
./scripts/check-cliente.sh cliente1

# Ver últimos 100 líneas
az container logs \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente1 \
  --tail 100
```

**Problemas comunes:**
- ❌ Connection string de Supabase incorrecta
- ❌ Variables de entorno faltantes
- ❌ Supabase database no accesible
- ❌ Imagen no existe en el registry

### Container en estado "Waiting"

Espera unos segundos más, Azure puede tardar en pull la imagen:

```bash
# Ver progreso
watch -n 5 "./scripts/check-cliente.sh cliente1"
```

### Error "ResourceGroupNotFound"

```bash
# Crear resource group
az group create \
  --name hadda-clientes-rg \
  --location eastus
```

### Error al push imagen

```bash
# Verificar que estás logueado
docker login ghcr.io

# Verificar permisos de la imagen
# GitHub: Settings → Packages → Package settings → Change visibility
```

---

## 💡 Tips

### Nombres de Clientes

- Usa nombres simples sin espacios: `empresa-abc`, `cliente1`
- Evita caracteres especiales
- Máximo 63 caracteres (límite de Azure DNS)

### Costos

- Cada container: ~$30-40/mes (1 vCPU, 1.5GB RAM)
- Supabase Free: $0 (hasta 500MB)
- Supabase Pro: $25/mes (8GB)

### Seguridad

- Cambia `DEFAULT_ADMIN_PASSWORD` después del primer login
- Genera JWT_SECRET único por cliente (el script lo hace automáticamente)
- Guarda connection strings de Supabase en un vault seguro

### Performance

- Elige región de Azure cercana a la región de Supabase
- Si tienes muchas conexiones, usa Supabase connection pooler (puerto 6543)
- Para operaciones admin, usa direct connection (puerto 5432)

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `./scripts/check-cliente.sh <cliente>`
2. Verifica la connection string de Supabase
3. Confirma que el container está en "Running"
4. Verifica que la imagen existe en el registry

---

## 🎯 Checklist de Deployment

- [ ] Build imagen y push a registry
- [ ] Crear proyecto Supabase para el cliente
- [ ] Obtener connection string de Supabase
- [ ] Ejecutar script de deployment
- [ ] Verificar que container está "Running"
- [ ] Verificar health check (HTTP 200)
- [ ] Verificar logs de inicialización
- [ ] Confirmar creación de tablas en Supabase
- [ ] Login con credenciales de admin
- [ ] Cambiar password del admin
- [ ] Entregar acceso al cliente
- [ ] Documentar deployment

---

¡Feliz deploying! 🚀

