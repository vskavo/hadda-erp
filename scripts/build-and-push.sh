#!/bin/bash
# Script para construir y publicar imagen Docker

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Hadda ERP - Build & Push Docker Image ===${NC}\n"

# Configuración
REGISTRY=${1:-ghcr.io}  # ghcr.io, azurecr.io, docker.io
USERNAME=${2:-vskavo}
IMAGE_NAME="hadda-erp"
VERSION=${3:-latest}

FULL_IMAGE="${REGISTRY}/${USERNAME}/${IMAGE_NAME}"

echo -e "${YELLOW}Registry:${NC} $REGISTRY"
echo -e "${YELLOW}Image:${NC} $FULL_IMAGE:$VERSION"
echo ""

# Build imagen
echo -e "${GREEN}📦 Building Docker image...${NC}"
docker build \
  --platform linux/amd64 \
  -t ${FULL_IMAGE}:${VERSION} \
  -t ${FULL_IMAGE}:latest \
  .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}\n"

# Push imagen
echo -e "${GREEN}📤 Pushing to registry...${NC}"

docker push ${FULL_IMAGE}:${VERSION}
docker push ${FULL_IMAGE}:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Image pushed successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Available at:${NC}"
echo -e "  ${FULL_IMAGE}:${VERSION}"
echo -e "  ${FULL_IMAGE}:latest"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Mostrar tamaño de la imagen
IMAGE_SIZE=$(docker images ${FULL_IMAGE}:${VERSION} --format "{{.Size}}")
echo -e "${YELLOW}Image size:${NC} $IMAGE_SIZE"

