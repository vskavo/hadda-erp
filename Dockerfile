# Multi-stage build para optimizar el tamaño de la imagen
FROM node:22-alpine AS builder

# Instalar dependencias necesarias para build
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependencias
RUN npm ci --production --omit=dev
RUN cd backend && npm ci --production --omit=dev
RUN cd frontend && npm ci

# Copiar el código fuente
COPY . .

# Build del frontend
RUN cd frontend && npm run build || echo "No build script found"

# Limpiar archivos innecesarios
RUN rm -rf logs backups coverage .git *.log test_*.js test-*.js *.xml *.csv docs

# --- Imagen final ---
FROM node:22-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Crear usuario no-root para ejecutar la app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar desde el builder
COPY --from=builder --chown=nodejs:nodejs /app ./

# Copiar scripts de inicialización
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar entrypoint para inicialización
ENTRYPOINT ["docker-entrypoint.sh"]

# Comando por defecto
CMD ["node", "start.js"]

