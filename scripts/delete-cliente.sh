#!/bin/bash
# Script para eliminar un cliente

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

echo -e "${BLUE}=== Eliminar Cliente: ${CLIENTE_NAME} ===${NC}\n"

# Verificar que el container existe
az container show \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --output none 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container not found${NC}"
    exit 1
fi

# Advertencia
echo -e "${RED}⚠️  ADVERTENCIA: Esta acción NO se puede deshacer${NC}"
echo -e "${YELLOW}Esto eliminará:${NC}"
echo "  - Container instance: hadda-erp-${CLIENTE_NAME}"
echo "  - NOTA: La base de datos en Supabase NO será eliminada"
echo ""

read -p "¿Estás seguro? Escribe 'DELETE' para confirmar: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Eliminando container...${NC}"

az container delete \
  --resource-group $RESOURCE_GROUP \
  --name hadda-erp-${CLIENTE_NAME} \
  --yes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cliente eliminado exitosamente${NC}"
    echo ""
    echo -e "${YELLOW}Recuerda:${NC}"
    echo "  - La base de datos en Supabase sigue activa"
    echo "  - Elimínala manualmente desde Supabase dashboard si es necesario"
else
    echo -e "${RED}❌ Error al eliminar${NC}"
    exit 1
fi

