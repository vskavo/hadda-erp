#!/bin/bash
# Script para actualizar TODOS los clientes de forma masiva

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

RESOURCE_GROUP=${1:-hadda-clientes-rg}

echo -e "${BLUE}=== Actualización Masiva de Clientes ===${NC}\n"

# Obtener lista de web apps
WEB_APPS=$(az webapp list \
  --resource-group $RESOURCE_GROUP \
  --query "[?starts_with(name, 'hadda-erp-')].name" \
  --output tsv)

if [ -z "$WEB_APPS" ]; then
    echo -e "${YELLOW}No hay clientes deployados en el resource group: $RESOURCE_GROUP${NC}"
    exit 0
fi

# Contar clientes
TOTAL=$(echo "$WEB_APPS" | wc -l)

echo -e "${YELLOW}Se encontraron $TOTAL clientes para actualizar${NC}"
echo ""

# Confirmar
read -p "¿Deseas actualizar TODOS los clientes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Actualización cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Iniciando actualización masiva...${NC}\n"

# Contador
COUNT=0
SUCCESS=0
FAILED=0

# Actualizar cada uno
while IFS= read -r webapp; do
    COUNT=$((COUNT + 1))
    CLIENTE=$(echo $webapp | sed 's/hadda-erp-//')
    
    echo -e "${BLUE}[$COUNT/$TOTAL] Actualizando: $CLIENTE${NC}"
    
    if az webapp restart --resource-group $RESOURCE_GROUP --name $webapp --output none 2>/dev/null; then
        echo -e "${GREEN}  ✅ $CLIENTE actualizado${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}  ❌ $CLIENTE falló${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # Esperar entre clientes para no sobrecargar
    if [ $COUNT -lt $TOTAL ]; then
        echo -e "${YELLOW}  Esperando 10 segundos antes del siguiente...${NC}\n"
        sleep 10
    fi
done <<< "$WEB_APPS"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Actualización masiva completada${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Total:    $TOTAL"
echo -e "  ${GREEN}Exitosos: $SUCCESS${NC}"
echo -e "  ${RED}Fallidos:  $FAILED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Esperando 30 segundos para que las apps inicien...${NC}"
sleep 30
echo -e "${GREEN}¡Listo!${NC}"

