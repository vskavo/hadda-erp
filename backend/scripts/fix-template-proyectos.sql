-- Actualizar el template de Proyectos Activos con los valores correctos del enum
UPDATE reporte_templates 
SET 
  descripcion = 'Lista de todos los proyectos en estado activo (No iniciado, En curso)',
  parametros_requeridos = '{
    "campos": ["id", "nombre", "Cliente.razon_social", "Responsable.nombre", "estado", "prioridad", "presupuesto", "porcentaje_avance", "fecha_inicio", "fecha_fin"],
    "filtros": {
      "estado": ["No iniciado", "En curso"]
    }
  }'::jsonb,
  opciones_configuracion = '{
    "entidad": "proyectos",
    "campos": ["id", "nombre", "Cliente.razon_social", "Responsable.nombre", "estado", "prioridad", "presupuesto", "porcentaje_avance", "fecha_inicio", "fecha_fin"],
    "filtros": {
      "estado": ["No iniciado", "En curso"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE nombre = 'Proyectos Activos';

