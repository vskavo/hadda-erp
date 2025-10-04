# Documentación de la API de Reportes Personalizados

## Resumen

La API de reportes personalizados permite a los usuarios generar informes dinámicos basados en los datos del ERP. Soporta múltiples entidades, formatos de exportación y plantillas personalizables.

## Arquitectura

### Componentes Principales

1. **Controlador** (`reporte.controller.js`): Maneja las solicitudes HTTP y lógica de negocio
2. **Servicio** (`reporte.service.js`): Gestiona la generación de archivos Excel/PDF
3. **Modelos**: `Reporte` y `ReporteTemplate` para persistencia de datos
4. **Frontend**: Páginas React para gestión de reportes

### Estados de Reportes

- `pendiente`: Reporte creado pero no procesado
- `generando`: En proceso de generación
- `completado`: Generación exitosa
- `error`: Error durante la generación
- `expirado`: Reporte expirado

## Endpoints de la API

### Autenticación

Todos los endpoints requieren autenticación Bearer token.

### 1. Obtener Reportes Predefinidos

**GET** `/api/reportes/predefinidos`

Obtiene la lista de reportes predefinidos disponibles.

**Parámetros de consulta:**
- `categoria` (opcional): Filtrar por categoría
- `tipo_reporte` (opcional): Filtrar por tipo

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Reporte de Proyectos Activos",
    "descripcion": "Lista de proyectos en curso",
    "tipo_reporte": "proyectos",
    "modulo": "proyectos",
    "categoria": "General",
    "consultasRealizadas": 15,
    "ultimaConsulta": "2024-01-15T10:30:00Z"
  }
]
```

### 2. Obtener Reporte Específico

**GET** `/api/reportes/:id`

Obtiene información detallada de un reporte específico.

**Parámetros:**
- `id`: ID del reporte

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Reporte de Ventas",
  "descripcion": "Análisis de ventas mensuales",
  "tipo_reporte": "ventas",
  "modulo": "ventas",
  "estado": "completado",
  "fecha_generacion": "2024-01-15T10:30:00Z",
  "parametros": {
    "entidad": "ventas",
    "campos": ["id", "numero_venta", "cliente.razon_social", "monto"],
    "filtros": {
      "fecha_desde": "2024-01-01",
      "fecha_hasta": "2024-01-31"
    }
  },
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@empresa.com"
  }
}
```

### 3. Generar Reporte Personalizado

**POST** `/api/reportes/generar`

Crea y genera un reporte personalizado.

**Cuerpo de la solicitud:**
```json
{
  "entidad": "proyectos",
  "campos": ["id", "nombre", "cliente.razon_social", "estado"],
  "filtros": {
    "estado": "en_progreso",
    "fecha_desde": "2024-01-01"
  },
  "nombre": "Proyectos en Progreso",
  "descripcion": "Lista de proyectos activos"
}
```

**Respuesta:**
```json
{
  "message": "Reporte en proceso de generación",
  "reporte_id": 123,
  "estado": "generando"
}
```

### 4. Obtener Estado de Reporte

**GET** `/api/reportes/:id/estado`

Obtiene el estado actual de un reporte en generación.

**Respuesta:**
```json
{
  "id": 123,
  "estado": "completado",
  "metadata": {
    "registros_generados": 45,
    "fecha_generacion": "2024-01-15T10:35:00Z"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### 5. Obtener Datos de Reporte

**GET** `/api/reportes/:id/datos`

Obtiene los datos de un reporte completado.

**Respuesta:**
```json
{
  "reporte": {
    "id": 123,
    "nombre": "Proyectos Activos",
    "fecha_generacion": "2024-01-15T10:35:00Z"
  },
  "datos": [
    {
      "id": 1,
      "nombre": "Proyecto Alpha",
      "cliente.razon_social": "Empresa ABC",
      "estado": "en_progreso"
    },
    {
      "id": 2,
      "nombre": "Proyecto Beta",
      "cliente.razon_social": "Empresa XYZ",
      "estado": "en_progreso"
    }
  ]
}
```

### 6. Exportar a Excel

**GET** `/api/reportes/:id/excel`

Descarga el reporte en formato Excel.

**Respuesta:** Archivo Excel (.xlsx) como descarga binaria

### 7. Exportar a PDF

**GET** `/api/reportes/:id/pdf`

Descarga el reporte en formato PDF.

**Respuesta:** Archivo PDF como descarga binaria

### 8. Obtener Campos Disponibles

**GET** `/api/reportes/campos/:entidad`

Obtiene los campos disponibles para una entidad específica.

**Parámetros:**
- `entidad`: Una de `proyectos`, `clientes`, `facturas`, `ventas`, `cursos`, `finanzas`

**Respuesta:**
```json
{
  "entidad": "proyectos",
  "campos": [
    {
      "id": "id",
      "nombre": "ID",
      "tipo": "numero"
    },
    {
      "id": "nombre",
      "nombre": "Nombre",
      "tipo": "texto"
    },
    {
      "id": "cliente.razon_social",
      "nombre": "Cliente",
      "tipo": "texto"
    }
  ],
  "filtros": [
    {
      "id": "estado",
      "nombre": "Estado",
      "tipo": "select",
      "opciones": [
        {"valor": "planificado", "etiqueta": "Planificado"},
        {"valor": "en_progreso", "etiqueta": "En Progreso"}
      ]
    },
    {
      "id": "fecha_desde",
      "nombre": "Fecha Desde",
      "tipo": "fecha"
    }
  ]
}
```

### 9. Guardar Reporte Predefinido

**POST** `/api/reportes/predefinidos`

Guarda un reporte personalizado como predefinido.

**Cuerpo de la solicitud:**
```json
{
  "nombre": "Mis Proyectos Activos",
  "descripcion": "Plantilla personalizada",
  "categoria": "Personal",
  "entidad": "proyectos",
  "campos": ["id", "nombre", "estado"],
  "filtros": {"estado": "en_progreso"},
  "rolesPermitidos": ["gerencia", "finanzas"]
}
```

### 10. Eliminar Reporte Predefinido

**DELETE** `/api/reportes/predefinidos/:id`

Elimina un reporte predefinido.

### 11. Obtener Estadísticas

**GET** `/api/reportes/estadisticas`

Obtiene estadísticas de uso de reportes.

**Respuesta:**
```json
{
  "generales": {
    "total_reportes": 150,
    "tipos_reportes": 8,
    "tamano_promedio": 245680
  },
  "por_tipo": [
    {
      "tipo_reporte": "proyectos",
      "cantidad": 45
    },
    {
      "tipo_reporte": "ventas",
      "cantidad": 32
    }
  ],
  "por_mes": [
    {
      "mes": "2024-01-01T00:00:00.000Z",
      "cantidad": 25
    }
  ]
}
```

## Entidades Soportadas

### Proyectos
Campos disponibles: ID, nombre, descripción, cliente, responsable, estado, prioridad, presupuesto, costo real, margen, porcentaje de avance, fechas.

### Clientes
Campos disponibles: ID, razón social, RUT, giro, dirección, teléfono, email, propietario, fecha de creación.

### Facturas
Campos disponibles: ID, número de factura, cliente, proyecto, monto, estado, fechas de emisión y vencimiento.

### Ventas
Campos disponibles: ID, número de venta, cliente, proyecto, monto, estado, fecha de venta.

### Cursos
Campos disponibles: ID, nombre, código SENCE, modalidad, estado, fechas de inicio/fin, proyecto.

### Finanzas
Campos combinados de ingresos y egresos: tipo, monto, descripción, fecha, cliente, proyecto.

## Formatos de Exportación

### Excel (.xlsx)
- Mantiene el formato de tabla
- Soporta fórmulas y gráficos
- Formato condicional automático
- Columnas con ancho automático

### PDF
- Formato tabular profesional
- Encabezados y pies de página
- Numeración de páginas
- Optimizado para impresión

### CSV
- Formato plano para importación
- Separado por comas
- Compatible con Excel y otras herramientas

## Permisos y Roles

Los reportes utilizan el sistema de permisos existente:

- `reportes:read`: Ver reportes
- `reportes:create`: Crear reportes
- `reportes:export`: Exportar reportes
- `reportes:delete`: Eliminar reportes

## Limitaciones

- Máximo 5000 registros por reporte
- Archivos expiran automáticamente después de 30 días
- Procesamiento asíncrono para reportes grandes
- Validación estricta de parámetros

## Manejo de Errores

La API devuelve códigos HTTP estándar:

- `200`: Éxito
- `400`: Datos inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## Ejemplos de Uso

### Generar Reporte de Proyectos Activos

```javascript
const response = await fetch('/api/reportes/generar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    entidad: 'proyectos',
    campos: ['id', 'nombre', 'cliente.razon_social', 'estado', 'porcentaje_avance'],
    filtros: {
      estado: 'en_progreso'
    },
    nombre: 'Proyectos Activos'
  })
});
```

### Exportar Reporte a Excel

```javascript
// Después de obtener el ID del reporte
window.open(`/api/reportes/${reporteId}/excel`, '_blank');
```

## Funcionalidades del Frontend

### Lista de Reportes Predefinidos

**Página:** `/reportes`

**Funcionalidades:**
- **Ver templates disponibles:** Lista de 6 reportes predefinidos del sistema
- **Ejecutar template:** Botón "Generar reporte y ver resultados" que ejecuta el template y muestra los resultados
- **Exportar template:** Botón para exportar directamente a Excel/PDF
- **Crear reporte personalizado:** Botón "Nuevo Informe" que lleva al generador

### Generador de Reportes Personalizados

**Página:** `/reportes/generador`

**Funcionalidades:**
- **Seleccionar entidad:** Proyectos, Clientes, Facturas, Ventas, Cursos, Finanzas
- **Elegir campos:** Interfaz visual para seleccionar columnas
- **Aplicar filtros:** Filtros dinámicos según la entidad
- **Vista previa:** Configuración antes de generar
- **Guardar como template:** Opción para reutilizar configuraciones

### Detalle de Reporte

**Página:** `/reportes/:id`

**Funcionalidades:**
- **Ver información del reporte:** Estado, configuración, fecha de generación
- **Mostrar datos:** Tabla completa con resultados
- **Exportar:** Excel y PDF desde resultados
- **Estados de procesamiento:** Mensajes para reportes en generación/error

## Próximas Funcionalidades

- Programación automática de reportes
- Dashboard de análisis avanzado
- Compartir reportes entre usuarios
- Notificaciones por email
- API para integraciones externas
