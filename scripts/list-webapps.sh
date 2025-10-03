#!/bin/bash
# Script para listar todos los clientes en Web Apps

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

RESOURCE_GROUP=${1:-hadda-clientes-rg}

echo -e "${BLUE}=== Clientes Deployados en Web Apps ===${NC}\n"

# Listar web apps
WEB_APPS=$(az webapp list \
  --resource-group $RESOURCE_GROUP \
  --query "[?starts_with(name, 'hadda-erp-')].[name, state, defaultHostName]" \
  --output tsv 2>/dev/null)

if [ -z "$WEB_APPS" ]; then
    echo -e "${YELLOW}No hay clientes deployados en el resource group: $RESOURCE_GROUP${NC}"
    exit 0
fi

echo -e "${YELLOW}Resource Group:${NC} $RESOURCE_GROUP\n"

# Tabla de resultados
printf "%-30s %-15s %-60s\n" "CLIENTE" "ESTADO" "URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while IFS=$'\t' read -r name state hostname; do
    # Extraer nombre del cliente
    CLIENTE=$(echo $name | sed 's/hadda-erp-//')
    
    # Color según estado
    if [ "$state" == "Running" ]; then
        STATUS="${GREEN}✅ $state${NC}"
    else
        STATUS="${RED}❌ $state${NC}"
    fi
    
    printf "%-30s %-25s https://%-50s\n" "$CLIENTE" "$(echo -e $STATUS)" "$hostname"
done <<< "$WEB_APPS"

echo ""
echo -e "${YELLOW}Total de clientes:${NC} $(echo "$WEB_APPS" | wc -l)"

