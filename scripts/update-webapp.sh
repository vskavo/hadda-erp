#!/bin/bash
# Script para actualizar un cliente a la última versión de la imagen

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -lt 1 ]; then
    echo -e "${RED}Uso: $0 <cliente-name> [resource-group]${NC}"
    exit 1
fi

CLIENTE_NAME=$1
RESOURCE_GROUP=${2:-hadda-clientes-rg}

echo -e "${BLUE}=== Actualizando Cliente: ${CLIENTE_NAME} ===${NC}\n"

# Verificar que el web app existe
az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --output none 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Web App not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Reiniciando web app para pull nueva imagen...${NC}"

# Restart para que pull la imagen :latest
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME}

echo ""
echo -e "${GREEN}✅ Web app reiniciado${NC}"
echo -e "${YELLOW}Esperando a que inicie (30 segundos)...${NC}"

sleep 30

# Verificar estado
STATE=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query state \
  --output tsv)

if [ "$STATE" == "Running" ]; then
    echo -e "${GREEN}✅ Actualización completada - Web app running${NC}"
    echo -e "${GREEN}URL: https://hadda-erp-${CLIENTE_NAME}.azurewebsites.net${NC}"
else
    echo -e "${RED}⚠️  Estado: $STATE${NC}"
fi

echo ""
echo -e "${YELLOW}Ver logs de inicialización:${NC}"
echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"

