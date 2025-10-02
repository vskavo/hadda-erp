#!/bin/bash

# Script de deployment personalizado para Azure
# Este script se ejecuta durante el deployment en Azure

# Configuración de errores
set -e

echo "=== Iniciando deployment personalizado para Hadda ERP ==="

# 1. Instalar dependencias del proyecto raíz
echo "=== Instalando dependencias del proyecto raíz ==="
if [ -f package.json ]; then
  npm install --production --no-optional
fi

# 2. Instalar dependencias del backend
echo "=== Instalando dependencias del backend ==="
if [ -d backend ] && [ -f backend/package.json ]; then
  cd backend
  npm install --production --no-optional
  cd ..
fi

# 3. Instalar y construir el frontend
echo "=== Instalando y construyendo el frontend ==="
if [ -d frontend ] && [ -f frontend/package.json ]; then
  cd frontend
  npm install --production --no-optional
  
  # Verificar si existe el script de build
  if npm run | grep -q "build:production"; then
    npm run build:production
  elif npm run | grep -q "build"; then
    npm run build
  fi
  cd ..
fi

echo "=== Deployment completado exitosamente ==="


