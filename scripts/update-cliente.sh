#!/bin/bash
# Script para actualizar un cliente a una nueva versión de la imagen

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

# Verificar que el container existe
az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --output none 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Reiniciando container para pull nueva imagen...${NC}"

# Azure Container Instances pull la imagen :latest automáticamente al restart
az container restart \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME}

echo ""
echo -e "${GREEN}✅ Container reiniciado${NC}"
echo -e "${YELLOW}Esperando a que inicie...${NC}"

sleep 15

# Verificar estado
STATE=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query instanceView.state \
  --output tsv)

if [ "$STATE" == "Running" ]; then
    echo -e "${GREEN}✅ Actualización completada - Container running${NC}"
else
    echo -e "${RED}⚠️  Estado: $STATE${NC}"
fi

echo ""
echo -e "${YELLOW}Ver logs de inicialización:${NC}"
echo "  az container logs --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME} --tail 50"

