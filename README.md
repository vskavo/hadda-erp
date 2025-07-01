# ERP para OTEC

Sistema de Planificación de Recursos Empresariales (ERP) especializado para Organismos Técnicos de Capacitación (OTEC) en Chile.

## Descripción

Este sistema ERP está diseñado específicamente para gestionar las operaciones de una OTEC, incluyendo gestión financiera, ventas, cursos, proyectos y generación de reportes. Integra funcionalidades específicas para el contexto chileno, como conexión con el SII para facturación electrónica y gestión de códigos SENCE.

## Características Principales

- **Finanzas y Contabilidad**: Facturación electrónica, conciliación bancaria, gestión de remuneraciones
- **Ventas y CRM**: Gestión de clientes, cotizaciones y seguimiento de ventas
- **Cursos**: Administración de cursos con códigos SENCE, matrículas y declaraciones juradas
- **Proyectos y Rentabilidad**: Control de costos e ingresos por proyecto con cálculo de rentabilidad
- **Reportes e Indicadores**: Dashboard con KPIs y generación de informes personalizados

## Tecnologías

- **Backend**: Node.js con Express
- **Frontend**: React
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT y OAuth2

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/[tu-usuario]/erp-otec.git
cd erp-otec

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con tus configuraciones

# Iniciar la aplicación en modo desarrollo
npm run dev
```

## Estructura del Proyecto

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

Índice
Fase 1: Desarrollo del Backend
Fase 2: Desarrollo del Frontend
Fase 3: Integración con Servicios Externos
Fase 4: Pruebas y Control de Calidad
Fase 5: Despliegue y Operaciones
Cronograma Estimado
Fase 1: Desarrollo del Backend
1.1. Modelos de Base de Datos
[✓] Completar modelos faltantes:
[✓] Participante
[✓] DeclaracionJurada
[✓] Ingreso
[✓] Egreso
[✓] CuentaBancaria
[✓] Remuneracion
[✓] Cotizacion
[✓] Venta
[✓] CostoProyecto
[✓] Reporte
1.2. Controladores y Rutas
[✓] Módulo de Usuarios:
[✓] Autenticación (login, registro)
[✓] Gestión de usuarios (CRUD)
[✓] Permisos y roles
[✓] Módulo de Clientes:
[✓] CRUD de clientes
[✓] Gestión de contactos
[✓] Seguimiento de actividades con clientes
[✓] Informes y dashboard de clientes
[ ] Módulo de Cursos:
[✓] CRUD de cursos
[✓] Gestión de participantes
[✓] Declaraciones juradas SENCE
[✓] Control de asistencia
[ ] Módulo de Finanzas:
[✓] Gestión de facturas (pendiente la integración con el SII, factura controller linea 428)
[ ] Integración con SII
[✓] Registro de ingresos y egresos
[✓] Conciliación bancaria (pendiente la integración con los bancos)
[ ] Módulo de Proyectos:
[✓] CRUD de proyectos
[✓] Cálculo de rentabilidad
[✓] Seguimiento de avance
[✓] Reportes de proyectos
1.3. Servicios y Utilidades
[✓] Servicios de correo electrónico
[✓] Generación de PDFs (facturas, certificados)
[✓] Validación de RUT chileno
[✓] Logs y monitoreo
[✓] Cron jobs para tareas programadas
1.4. Seguridad Backend
[✓] Implementación de rate limiting
[✓] Protección contra ataques comunes (CSRF, XSS)
[✓] Validación robusta de datos de entrada
[✓] Encriptación de datos sensibles

Fase 2: Desarrollo del Frontend
2.1. Configuración y Estructura
[✓] Implementar enrutamiento con React Router
[✓] Configurar gestión de estado global (Context API)
[✓] Estructura de carpetas y componentes
[✓] Temas y estilos base (Material UI)
2.2. Componentes Reutilizables
[✓] Layout principal con sidebar y header
[✓] Tablas de datos con paginación y filtros
[✓] Formularios con validación
[✓] Modales y alertas
[✓] Componentes de carga y estados vacíos
2.3. Páginas y Módulos
[✓] Autenticación:
[✓] Login y registro
[✓] Recuperación de contraseña
[✓] Perfil de usuario
[ ] Dashboard:
[✓] Panel principal con KPIs
[✓] Gráficos de rendimiento
[✓] Alertas y notificaciones
[ ] Gestión de Clientes:
[✓] Listado de clientes
[✓] Ficha de cliente
[✓] Formularios de creación y edición
[ ] Gestión de Cursos:
[✓] Catálogo de cursos
[✓] Detalles de curso
[✓] Gestión de participantes
[✓] Declaraciones juradas
[ ] Finanzas:
[✓] Facturación
[✓] Registro de ingresos y egresos
[✓] Estados financieros
[✓] Conciliación bancaria
[ ] Proyectos:
[✓] Listado de proyectos
[✓] Detalles de proyecto
[✓] Análisis de rentabilidad
[✓] Seguimiento de avance
[ ] Reportes:
[✓] Generador de informes
[✓] Exportación a Excel/PDF
[✓] Informes predefinidos
2.4. UI/UX
[ ] Diseño responsive para dispositivos móviles
[ ] Accesibilidad (WCAG)
[ ] Modo oscuro / claro
[ ] Animaciones y transiciones
[ ] Optimización de rendimiento

Fase 3: Integración con Servicios Externos
3.1. Integración con SII
[ ] Configuración de certificado digital
[ ] Emisión de facturas electrónicas
[ ] Consulta de estado de documentos
[ ] Validación de contribuyentes
3.2. Integración con SENCE
[ ] Validación de códigos SENCE
[ ] Envío de declaraciones juradas
[ ] Consulta de estado de cursos
[ ] Reporte de asistencia
3.3. Integración Bancaria
[ ] Conexión API bancaria
[ ] Importación de movimientos
[ ] Conciliación automática
[ ] Registro de transferencias
3.4. Servicios Adicionales
[ ] Integración con servicios de email marketing
[ ] Conexión con almacenamiento en la nube
[ ] Integración con Previred (opcional)
[ ] Pasarelas de pago
Fase 4: Pruebas y Control de Calidad
4.1. Pruebas Unitarias
[ ] Pruebas para modelos
[ ] Pruebas para controladores
[ ] Pruebas para servicios
[ ] Pruebas para utilidades
4.2. Pruebas de Integración
[ ] Pruebas de API
[ ] Pruebas de integración con servicios externos
[ ] Pruebas de flujos completos
4.3. Pruebas Frontend
[ ] Pruebas de componentes
[ ] Pruebas de navegación
[ ] Pruebas de formularios
[ ] Pruebas de estados y efectos secundarios
4.4. Control de Calidad
[ ] Revisión de código
[ ] Análisis estático
[ ] Optimización de rendimiento
[ ] Pruebas de seguridad
Fase 5: Despliegue y Operaciones
5.1. Preparación para Producción
[ ] Optimización de configuraciones
[ ] Compilación de activos
[ ] Minificación y compresión
[ ] Configuración de variables de entorno
5.2. Infraestructura
[ ] Configuración de servidores
[ ] Configuración de base de datos
[ ] Configuración de balanceadores de carga (si aplica)
[ ] Configuración de DNS y dominios
5.3. CI/CD
[ ] Configuración de pipelines de integración continua
[ ] Configuración de despliegue automático
[ ] Pruebas automáticas en pipeline
5.4. Monitoreo y Mantenimiento
[ ] Configuración de logs centralizados
[ ] Alertas de errores
[ ] Monitoreo de rendimiento
[ ] Copias de seguridad automáticas
[ ] Plan de recuperación ante desastres
Cronograma Estimado
| Fase | Duración Estimada | Fecha Inicio | Fecha Fin |
|------|-------------------|--------------|-----------|
| Fase 1: Backend | 6 semanas | | |
| Fase 2: Frontend | 8 semanas | | |
| Fase 3: Integraciones | 4 semanas | | |
| Fase 4: Pruebas | 3 semanas | | |
| Fase 5: Despliegue | 2 semanas | | |
| Total | 23 semanas | | |
Estado de Desarrollo Actual:
✅ Configuración básica del proyecto
✅ Estructura de directorios
✅ Configuración de base de datos
✅ Modelos básicos (Usuario, Cliente, Curso, Factura, Proyecto)
✅ Modelos complementarios (Participante, DeclaracionJurada, Ingreso, Egreso, CuentaBancaria, Remuneracion)
✅ Modelos de gestión comercial (Cotizacion, Venta)
✅ Modelos de gestión de proyectos (CostoProyecto)
✅ Módulo de usuarios con autenticación, roles y permisos
✅ Módulo de clientes completo (clientes, contactos, seguimiento)

## Funcionalidades implementadas en el módulo de clientes

### Gestión de Clientes
- CRUD completo de clientes con validación de datos
- Estados de cliente (activo/inactivo)
- Búsqueda y filtrado avanzado
- Reportes y estadísticas

### Gestión de Contactos
- CRUD de contactos asociados a clientes
- Gestión de contactos principales
- Asignación automática de contactos primarios

### Seguimiento de Clientes
- Registro de actividades con clientes (llamadas, reuniones, emails)
- Calendario de seguimiento
- Historial de interacciones
- Asignación de actividades a usuarios

### Dashboard e Informes
- Estadísticas de clientes por estado
- Clientes nuevos y sin actividad reciente
- Actividades pendientes
- TOP clientes con más interacciones
- Generación de informes personalizados

## Próximos pasos
1. Implementación del módulo de cursos
2. Desarrollo del módulo financiero
3. Desarrollo del módulo de proyectos
4. Implementación del frontend
5. Integraciones con servicios externos (SII, SENCE)