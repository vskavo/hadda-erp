#!/bin/bash
# Script optimizado para deployar clientes en Azure Web App

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Hadda ERP - Deploy Cliente en Azure Web App ===${NC}\n"

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}Uso: $0 <cliente-name> <supabase-connection-string> [app-service-plan] [resource-group]${NC}"
    echo ""
    echo "Ejemplo:"
    echo "  $0 empresa-abc 'postgresql://postgres.xxx:pass@host:6543/postgres'"
    echo ""
    exit 1
fi

CLIENTE_NAME=$1
SUPABASE_CONN=$2
APP_SERVICE_PLAN=${3:-hadda-erp-plan}
RESOURCE_GROUP=${4:-hadda-clientes-rg}
REGISTRY="ghcr.io/vskavo/hadda-erp:latest"

# Extraer información de Supabase connection string
DB_USER=$(echo $SUPABASE_CONN | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $SUPABASE_CONN | sed -n 's/.*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $SUPABASE_CONN | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $SUPABASE_CONN | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $SUPABASE_CONN | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}Cliente:${NC} $CLIENTE_NAME"
echo -e "${YELLOW}Database Host:${NC} $DB_HOST"
echo -e "${YELLOW}Database Port:${NC} $DB_PORT"
echo -e "${YELLOW}App Service Plan:${NC} $APP_SERVICE_PLAN"
echo -e "${YELLOW}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${YELLOW}Image:${NC} $REGISTRY"
echo ""

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

# Verificar/crear App Service Plan
echo -e "${YELLOW}Verificando App Service Plan...${NC}"
if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo -e "${YELLOW}Creando App Service Plan...${NC}"
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --sku B1 \
      --is-linux
fi

# Crear Web App
echo -e "${YELLOW}Creando Web App...${NC}"
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name hadda-erp-${CLIENTE_NAME} \
  --deployment-container-image-name $REGISTRY

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al crear Web App${NC}"
    exit 1
fi

# Configurar container registry (GitHub)
echo -e "${YELLOW}Configurando acceso a GitHub Container Registry...${NC}"
az webapp config container set \
  --name hadda-erp-${CLIENTE_NAME} \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $REGISTRY \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user $GITHUB_USERNAME \
  --docker-registry-server-password $GITHUB_TOKEN

# Habilitar continuous deployment
az webapp deployment container config \
  --name hadda-erp-${CLIENTE_NAME} \
  --resource-group $RESOURCE_GROUP \
  --enable-cd true

# Configurar variables de entorno
echo -e "${YELLOW}Configurando variables de entorno...${NC}"
az webapp config appsettings set \
  --name hadda-erp-${CLIENTE_NAME} \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DB_HOST=$DB_HOST \
    DB_PORT=$DB_PORT \
    DB_NAME=$DB_NAME \
    DB_USER=$DB_USER \
    DB_PASSWORD=$DB_PASSWORD \
    DB_SSL=true \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITES_PORT=8080 \
    JWT_SECRET=$JWT_SECRET \
    CREATE_DEFAULT_ADMIN=true \
    DEFAULT_ADMIN_EMAIL=admin@${CLIENTE_NAME}.com \
    DEFAULT_ADMIN_PASSWORD="Temporal123!" \
    BASE_URL=https://hadda-erp-${CLIENTE_NAME}.azurewebsites.net

# Configurar always on y otras opciones
echo -e "${YELLOW}Configurando opciones de Web App...${NC}"
az webapp config set \
  --name hadda-erp-${CLIENTE_NAME} \
  --resource-group $RESOURCE_GROUP \
  --always-on true \
  --http20-enabled true \
  --min-tls-version 1.2

echo ""
echo -e "${GREEN}✅ Deployment completado!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Información del deployment:${NC}"
echo -e "  Cliente: ${CLIENTE_NAME}"
echo -e "  URL: https://hadda-erp-${CLIENTE_NAME}.azurewebsites.net"
echo -e "  Admin Email: admin@${CLIENTE_NAME}.com"
echo -e "  Admin Password: Temporal123!"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  Guarda estas credenciales de forma segura${NC}"
echo ""
echo -e "${YELLOW}Esperando a que la app inicie (esto puede tardar 2-3 minutos)...${NC}"
sleep 60

# Verificar estado
echo -e "${YELLOW}Verificando estado...${NC}"
STATE=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query state \
  --output tsv)

echo -e "${GREEN}Estado: $STATE${NC}"
echo ""
echo -e "${GREEN}Para ver los logs:${NC}"
echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"
echo ""
echo -e "${GREEN}Para reiniciar:${NC}"
echo "  az webapp restart --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"

