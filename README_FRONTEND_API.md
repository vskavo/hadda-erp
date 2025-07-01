# Documentación de Integración API Frontend-Backend

## Resumen

Este documento describe la implementación de la capa de servicios API que conecta el frontend con el backend en la aplicación ERP para OTEC. Se ha reemplazado el uso de datos simulados (mock data) por llamadas reales a la API del backend.

## Estructura de Servicios API

Se ha creado una estructura modular de servicios API en el directorio `frontend/src/services/`:

- **api.js**: Configuración base de Axios con interceptores para autenticación y manejo de errores.
- **facturaService.js**: Servicios para gestión de facturas.
- **movimientosService.js**: Servicios para gestión de ingresos y egresos.
- **conciliacionBancariaService.js**: Servicios para gestión de cuentas bancarias y conciliaciones.
- **index.js**: Exportación centralizada de todos los servicios.

## Funcionalidades Implementadas

### Facturas

- Obtención de listado de facturas con paginación y filtros
- Creación, actualización y eliminación de facturas
- Gestión de estados de facturas

### Ingresos y Egresos

- Obtención de listado de ingresos y egresos con paginación y filtros
- Creación, actualización y eliminación de movimientos
- Búsqueda por diversos criterios (cliente, proyecto, fecha, etc.)

### Conciliación Bancaria

- Gestión de cuentas bancarias
- Obtención y creación de conciliaciones bancarias
- Manejo de movimientos conciliados y sin conciliar

## Componentes Actualizados

Se han actualizado los siguientes componentes para usar los servicios API:

1. **FacturasList.js**: Listado de facturas con paginación y filtros
2. **MovimientosList.js**: Listado de ingresos y egresos con paginación y filtros
3. **ConciliacionBancaria.js**: Interfaz para realizar conciliaciones bancarias

## Configuración de Proxy

La aplicación utiliza la configuración de proxy definida en `package.json` para redirigir las llamadas API al servidor backend:

```json
{
  "proxy": "http://localhost:5000"
}
```

## Autenticación y Seguridad

Se ha implementado un interceptor en el cliente Axios (api.js) que añade automáticamente el token JWT a todas las peticiones:

```javascript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

También se maneja automáticamente la caducidad de la sesión, redirigiendo al login cuando se recibe un error 401:

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Manejo de Errores

Cada servicio incluye manejo de errores con try/catch para proporcionar información de diagnóstico y mantener una experiencia de usuario fluida incluso cuando ocurren errores.

## Próximos Pasos

Para completar la integración frontend-backend:

1. Implementar servicios API para el resto de módulos (clientes, cursos, proyectos, etc.)
2. Añadir manejo de caché para mejorar el rendimiento
3. Implementar sistema de reintento automático para peticiones fallidas
4. Mejorar el feedback visual de carga y errores 