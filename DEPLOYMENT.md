# 📚 Documentación de Deployment - Índice

## 🎯 Guía Principal

**→ [`GUIA_DEPLOYMENT_DEFINITIVA.md`](./GUIA_DEPLOYMENT_DEFINITIVA.md)**

Esta es la guía oficial y actualizada para deployar Hadda ERP.

## 🔀 Dos Opciones de Deployment

### Opción 1: Azure App Service (Web App) ⭐ RECOMENDADO

**Para:** Clientes de producción  
**Script:** `./scripts/deploy-webapp-azure.sh`  
**URL:** https://hadda-erp-cliente.azurewebsites.net  
**Costo:** ~$55-80/mes

**Características:**
- ✅ HTTPS/SSL automático
- ✅ Custom domains fácil
- ✅ Always-on incluido
- ✅ Health monitoring

```bash
# Deployment
./scripts/deploy-webapp-azure.sh \
  waygroup-erp \
  'postgresql://postgres:password@host.supabase.co:5432/postgres'
```

---

### Opción 2: Azure Container Instances (ACI)

**Para:** Desarrollo/pruebas  
**Script:** `./scripts/deploy-cliente-azure.sh`  
**URL:** http://hadda-erp-cliente.eastus.azurecontainer.io  
**Costo:** ~$30-40/mes

**Características:**
- ✅ Más económico
- ✅ Facturación por segundo
- ⚠️ Sin HTTPS automático

```bash
# Deployment
./scripts/deploy-cliente-azure.sh \
  waygroup-erp \
  'postgresql://postgres:password@host.supabase.co:5432/postgres'
```

---

## 📖 Documentación Complementaria

| Archivo | Descripción |
|---------|-------------|
| [`scripts/README.md`](./scripts/README.md) | Documentación detallada de cada script |
| [`scripts/GITHUB_CREDENTIALS_README.md`](./scripts/GITHUB_CREDENTIALS_README.md) | Configuración de credenciales de GitHub |
| [`Dockerfile`](./Dockerfile) | Configuración de la imagen Docker |
| [`docker-compose.yml`](./docker-compose.yml) | Para desarrollo local |
| [`docker-entrypoint.sh`](./docker-entrypoint.sh) | Script de inicialización del contenedor |

---

## 🚀 Quick Start

```bash
# 1. Configurar credenciales (una sola vez)
nano ~/.bashrc
# Agregar:
# export GITHUB_USERNAME="tu-usuario"
# export GITHUB_TOKEN="ghp_tu_token"
source ~/.bashrc

# 2. Login Azure
az login

# 3A. Deploy con Web App (Producción)
./scripts/deploy-webapp-azure.sh cliente-nombre 'postgresql://...'

# 3B. O deploy con Container Instance (Desarrollo)
./scripts/deploy-cliente-azure.sh cliente-nombre 'postgresql://...'

# 4. Verificar
./scripts/check-cliente.sh cliente-nombre
```

---

## 🔧 Correcciones Realizadas

### Octubre 26, 2025
- ✅ Corregido parsing de connection string en Git Bash (Windows)
- ✅ Reemplazado `sed` por expansiones de parámetros de bash
- ✅ Agregado script de prueba: `test-connection-string.sh`
- ✅ Mejoras en validación de variables extraídas
- ✅ Documentación actualizada con ambas opciones de deployment

### Problema Resuelto
**Antes:** El password de Supabase no se extraía correctamente (`DB_PASSWORD: null`)  
**Ahora:** Parsing robusto que funciona correctamente en Git Bash

---

## 📝 Changelog de Estrategias

### Estrategia Actual ✅
- ✅ **Opción A:** Docker + Azure App Service (Web App) - Para producción
- ✅ **Opción B:** Docker + Azure Container Instances - Para desarrollo
- ✅ GitHub Container Registry (privado)
- ✅ Build automático con GitHub Actions
- ✅ Base de datos Supabase por cliente
- ✅ Scripts automatizados y corregidos

### Estrategias Anteriores (Obsoletas)
- ❌ Azure App Service con GitHub Actions (deployment directo)
- ❌ Build en Azure (SCM_DO_BUILD_DURING_DEPLOYMENT)
- ❌ Deployment Center con Basic Auth

---

## 🆘 ¿Necesitas ayuda?

Lee primero: **[`GUIA_DEPLOYMENT_DEFINITIVA.md`](./GUIA_DEPLOYMENT_DEFINITIVA.md)**

Si encuentras problemas, la guía incluye una sección de troubleshooting completa.

### Problemas Comunes

**1. "argument --registry-username: expected one argument"**
- Solución: Configura `GITHUB_USERNAME` y `GITHUB_TOKEN` en `~/.bashrc`

**2. "DB_PASSWORD: null en Azure"**
- Solución: Usa los scripts corregidos (ya aplicado)

**3. "No se crearon las tablas en Supabase"**
- Causa: Password no configurado correctamente
- Solución: Re-deploy con script corregido

---

## 🎯 Comparación Rápida

| Característica | Web App | Container Instance |
|---------------|---------|-------------------|
| **HTTPS/SSL** | ✅ Automático | ❌ Manual |
| **URL** | azurewebsites.net | azurecontainer.io |
| **Custom Domain** | ✅ Fácil | ⚠️ Complejo |
| **Costo/mes** | $55-80 | $30-40 |
| **Always-on** | ✅ Incluido | ⚠️ Manual |
| **Monitoring** | ✅ Integrado | ⚠️ Básico |
| **Uso recomendado** | Producción | Desarrollo/Demos |

---

**Última actualización:** 26 de Octubre, 2025  
**Versión:** 2.0.0
