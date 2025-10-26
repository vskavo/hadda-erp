#!/bin/bash
# Script para deployar un cliente en Azure Container Instances con Supabase

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cargar credenciales de GitHub si existe el archivo
ENV_FILE="$(dirname "$0")/../.env.github"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Cargando credenciales de GitHub...${NC}"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Credenciales cargadas${NC}\n"
fi

echo -e "${BLUE}=== Hadda ERP - Deploy Cliente en Azure ===${NC}\n"

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}Uso: $0 <cliente-name> <supabase-connection-string> [resource-group] [registry]${NC}"
    echo ""
    echo "Ejemplo:"
    echo "  $0 cliente1 'postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo ""
    exit 1
fi

CLIENTE_NAME=$1
SUPABASE_CONN=$2
RESOURCE_GROUP=${3:-hadda-clientes-rg}
REGISTRY=${4:-ghcr.io/vskavo/hadda-erp:latest}

# Extraer información de Supabase connection string
# Format: postgresql://user:password@host:port/database
# Método más robusto compatible con Git Bash en Windows

# Remover el prefijo postgresql://
CONN_WITHOUT_PREFIX="${SUPABASE_CONN#postgresql://}"

# Extraer user:password (antes de @)
USER_PASS="${CONN_WITHOUT_PREFIX%%@*}"
DB_USER="${USER_PASS%%:*}"
DB_PASSWORD="${USER_PASS#*:}"

# Extraer host:port/database (después de @)
HOST_PORT_DB="${CONN_WITHOUT_PREFIX#*@}"
HOST_PORT="${HOST_PORT_DB%%/*}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"

# Extraer database (después de /)
DB_NAME="${HOST_PORT_DB#*/}"
# Remover query params si existen
DB_NAME="${DB_NAME%%\?*}"

echo -e "${YELLOW}Cliente:${NC} $CLIENTE_NAME"
echo -e "${YELLOW}Database User:${NC} $DB_USER"
echo -e "${YELLOW}Database Password:${NC} ${DB_PASSWORD:0:3}***${DB_PASSWORD: -3} (${#DB_PASSWORD} chars)"
echo -e "${YELLOW}Database Host:${NC} $DB_HOST"
echo -e "${YELLOW}Database Port:${NC} $DB_PORT"
echo -e "${YELLOW}Database Name:${NC} $DB_NAME"
echo -e "${YELLOW}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${YELLOW}Image:${NC} $REGISTRY"
echo ""

# Validación de que todos los datos fueron extraídos
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ ERROR: No se pudieron extraer todos los datos de la connection string${NC}"
    echo -e "${RED}Connection string recibida: ${SUPABASE_CONN}${NC}"
    echo -e "${RED}DB_USER: '$DB_USER'${NC}"
    echo -e "${RED}DB_PASSWORD: '$DB_PASSWORD'${NC}"
    echo -e "${RED}DB_HOST: '$DB_HOST'${NC}"
    echo -e "${RED}DB_PORT: '$DB_PORT'${NC}"
    echo -e "${RED}DB_NAME: '$DB_NAME'${NC}"
    exit 1
fi

# Generar JWT secret único
JWT_SECRET=$(openssl rand -base64 32)

# Confirmar deployment
read -p "¿Continuar con el deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Iniciando deployment...${NC}\n"

# Verificar/crear resource group
echo -e "${YELLOW}Verificando resource group...${NC}"
az group show --name $RESOURCE_GROUP &>/dev/null || \
  az group create --name $RESOURCE_GROUP --location eastus

# Deploy container
echo -e "${YELLOW}Creando container instance...${NC}"

# Verificar si necesitamos credenciales de registry
REGISTRY_AUTH=""
if [ ! -z "$GITHUB_USERNAME" ] && [ ! -z "$GITHUB_TOKEN" ]; then
  REGISTRY_AUTH="--registry-login-server ghcr.io --registry-username $GITHUB_USERNAME --registry-password $GITHUB_TOKEN"
  echo -e "${GREEN}✓ Usando autenticación para registry privado${NC}"
else
  echo -e "${YELLOW}⚠ No se encontraron credenciales de registry. Asumiendo imagen pública.${NC}"
fi

echo -e "${YELLOW}Ejecutando az container create...${NC}"
echo -e "${YELLOW}DB_PASSWORD length: ${#DB_PASSWORD}${NC}"

az container create \
  --resource-group "$RESOURCE_GROUP" \
  --name "hadda-erp-${CLIENTE_NAME}" \
  --image "$REGISTRY" \
  --os-type Linux \
  $REGISTRY_AUTH \
  --dns-name-label "hadda-erp-${CLIENTE_NAME}" \
  --ports 8080 \
  --cpu 1 \
  --memory 1.5 \
  --restart-policy Always \
  --environment-variables \
    "DB_HOST=$DB_HOST" \
    "DB_PORT=$DB_PORT" \
    "DB_NAME=$DB_NAME" \
    "DB_USER=$DB_USER" \
    "DB_SSL=true" \
    "NODE_ENV=production" \
    "PORT=8080" \
    "JWT_SECRET=$JWT_SECRET" \
    "CREATE_DEFAULT_ADMIN=true" \
    "DEFAULT_ADMIN_EMAIL=admin@${CLIENTE_NAME}.com" \
    "DEFAULT_ADMIN_PASSWORD=Temporal123!" \
    "BASE_URL=https://hadda-erp-${CLIENTE_NAME}.eastus.azurecontainer.io" \
  --secure-environment-variables \
    "DB_PASSWORD=$DB_PASSWORD"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment completado!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Información del deployment:${NC}"
echo -e "  Cliente: ${CLIENTE_NAME}"
echo -e "  URL: https://hadda-erp-${CLIENTE_NAME}.eastus.azurecontainer.io"
echo -e "  Admin Email: admin@${CLIENTE_NAME}.com"
echo -e "  Admin Password: Temporal123!"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  Guarda estas credenciales de forma segura${NC}"
echo ""

# Esperar a que el container esté listo
echo -e "${YELLOW}Esperando a que el container inicie...${NC}"
sleep 15

# Verificar estado
echo -e "${YELLOW}Verificando estado...${NC}"
az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query instanceView.state \
  --output tsv

echo ""
echo -e "${GREEN}Para ver los logs:${NC}"
echo "  az container logs --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"
echo ""
echo -e "${GREEN}Para eliminar (si es necesario):${NC}"
echo "  az container delete --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME} --yes"

