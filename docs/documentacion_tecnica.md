# Documentación Técnica del ERP para OTEC

## Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Modelos de Datos](#modelos-de-datos)
5. [API REST](#api-rest)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Integración con Servicios Externos](#integración-con-servicios-externos)
8. [Despliegue](#despliegue)
9. [Mantenimiento y Escalabilidad](#mantenimiento-y-escalabilidad)

## Introducción

Este documento describe la implementación técnica del ERP para OTEC, un sistema de gestión empresarial especializado para Organismos Técnicos de Capacitación en Chile. El sistema está diseñado para gestionar las operaciones financieras, ventas, cursos y proyectos de una OTEC, con funcionalidades específicas para el contexto chileno.

## Arquitectura del Sistema

El sistema está construido siguiendo una arquitectura cliente-servidor con las siguientes capas:

1. **Frontend**: Aplicación SPA (Single Page Application) desarrollada en React.js
2. **Backend**: API REST desarrollada en Node.js con Express
3. **Base de Datos**: PostgreSQL para almacenamiento persistente
4. **Servicios Externos**: Integración con SII, bancos y otros servicios

### Diagrama de Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │     │   Servidor  │     │  Base de    │
│   (React)   │◄───►│   (Node.js) │◄───►│   Datos     │
└─────────────┘     └─────────────┘     └─────────────┘
                          ▲
                          │
                          ▼
                    ┌─────────────┐
                    │  Servicios  │
                    │  Externos   │
                    └─────────────┘
```

## Estructura del Proyecto

El proyecto sigue una estructura modular para facilitar el mantenimiento y la escalabilidad:

```
erp-otec/
├── backend/            # API REST con Express
│   ├── controllers/    # Controladores de la API
│   ├── models/         # Modelos de datos
│   ├── routes/         # Definición de rutas
│   ├── middlewares/    # Middlewares de la aplicación
│   ├── services/       # Servicios y lógica de negocio
│   └── utils/          # Utilidades y helpers
├── frontend/           # Aplicación React
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── context/    # Context API para estado global
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # Utilidades del frontend
└── docs/               # Documentación adicional
```

## Modelos de Datos

El sistema utiliza Sequelize como ORM para interactuar con la base de datos PostgreSQL. Los principales modelos son:

### Usuario
- Gestión de usuarios del sistema con roles y permisos

### Cliente
- Información de clientes y empresas

### Curso
- Cursos ofrecidos con códigos SENCE

### Factura
- Facturación electrónica con integración al SII

### Proyecto
- Gestión de proyectos con cálculo de rentabilidad

### Participante
- Alumnos inscritos en cursos

### DeclaracionJurada
- Gestión de declaraciones juradas para SENCE

### Ingreso / Egreso
- Registro de movimientos financieros

### CuentaBancaria
- Gestión de cuentas bancarias y conciliación

### Remuneracion
- Gestión de remuneraciones y liquidaciones

### Cotizacion / Venta
- Gestión del proceso comercial

## API REST

La API sigue principios RESTful con los siguientes endpoints principales:

### Autenticación
- `POST /api/auth/register`: Registro de usuarios
- `POST /api/auth/login`: Inicio de sesión
- `GET /api/auth/perfil`: Obtener perfil del usuario
- `PUT /api/auth/perfil`: Actualizar perfil

### Clientes
- `GET /api/clientes`: Listar clientes
- `POST /api/clientes`: Crear cliente
- `GET /api/clientes/:id`: Obtener cliente
- `PUT /api/clientes/:id`: Actualizar cliente
- `DELETE /api/clientes/:id`: Eliminar cliente

### Cursos
- `GET /api/cursos`: Listar cursos
- `POST /api/cursos`: Crear curso
- `GET /api/cursos/:id`: Obtener curso
- `PUT /api/cursos/:id`: Actualizar curso
- `DELETE /api/cursos/:id`: Eliminar curso
- `GET /api/cursos/:id/participantes`: Listar participantes
- `POST /api/cursos/:id/participantes`: Agregar participante

### Facturas
- `GET /api/facturas`: Listar facturas
- `POST /api/facturas`: Crear factura
- `GET /api/facturas/:id`: Obtener factura
- `PUT /api/facturas/:id`: Actualizar factura
- `POST /api/facturas/:id/enviar-sii`: Enviar factura al SII

### Proyectos
- `GET /api/proyectos`: Listar proyectos
- `POST /api/proyectos`: Crear proyecto
- `GET /api/proyectos/:id`: Obtener proyecto
- `PUT /api/proyectos/:id`: Actualizar proyecto
- `GET /api/proyectos/:id/rentabilidad`: Calcular rentabilidad

## Autenticación y Autorización

El sistema utiliza JWT (JSON Web Tokens) para la autenticación y un sistema de roles para la autorización:

- **Roles**: admin, finanzas, ventas, instructor, usuario
- **Middleware de Autenticación**: Verifica el token JWT
- **Middleware de Roles**: Controla el acceso basado en roles

## Integración con Servicios Externos

### SII (Servicio de Impuestos Internos)
- Emisión de facturas electrónicas
- Validación de RUT
- Consulta de estado de documentos

### Bancos
- Conciliación bancaria automática
- Registro de transferencias

### SENCE
- Validación de códigos SENCE
- Envío de declaraciones juradas

## Despliegue

El sistema puede desplegarse en diferentes entornos:

### Desarrollo
- Servidor local con Node.js y PostgreSQL

### Producción
- Servidor VPS o cloud (AWS, Google Cloud, Azure)
- Base de datos PostgreSQL gestionada
- Nginx como proxy inverso
- PM2 para gestión de procesos Node.js

## Mantenimiento y Escalabilidad

### Monitoreo
- Logs centralizados
- Alertas de errores
- Monitoreo de rendimiento

### Escalabilidad
- Arquitectura modular para facilitar la expansión
- Posibilidad de escalar horizontalmente
- Optimización de consultas a base de datos

### Respaldos
- Respaldos diarios de la base de datos
- Estrategia de recuperación ante desastres 