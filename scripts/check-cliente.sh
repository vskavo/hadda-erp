#!/bin/bash
# Script para verificar el estado de un cliente deployado

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

echo -e "${BLUE}=== Estado del Cliente: ${CLIENTE_NAME} ===${NC}\n"

# Verificar container
echo -e "${YELLOW}📦 Container Status:${NC}"
CONTAINER_STATE=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query instanceView.state \
  --output tsv 2>/dev/null)

if [ $? -eq 0 ]; then
    if [ "$CONTAINER_STATE" == "Running" ]; then
        echo -e "  ${GREEN}✅ Running${NC}"
    else
        echo -e "  ${RED}❌ $CONTAINER_STATE${NC}"
    fi
else
    echo -e "  ${RED}❌ Container not found${NC}"
    exit 1
fi

# Obtener URL
URL=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --query ipAddress.fqdn \
  --output tsv)

echo -e "${YELLOW}🌐 URL:${NC} https://${URL}"

# Health check
echo ""
echo -e "${YELLOW}🏥 Health Check:${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${URL}/api/health 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "  ${GREEN}✅ Healthy (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "  ${RED}❌ Unhealthy (HTTP $HTTP_STATUS)${NC}"
fi

# Últimos logs
echo ""
echo -e "${YELLOW}📝 Últimos logs (10 líneas):${NC}"
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --tail 10

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  Ver logs completos:"
echo "    az container logs --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"
echo ""
echo "  Ver logs en tiempo real:"
echo "    az container logs --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME} --follow"
echo ""
echo "  Restart container:"
echo "    az container restart --resource-group $RESOURCE_GROUP --name hadda-erp-${CLIENTE_NAME}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

