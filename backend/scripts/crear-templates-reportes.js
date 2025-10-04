require('dotenv').config();
const { sequelize, ReporteTemplate } = require('../models');

async function crearTemplatesReportes() {
  try {
    console.log('🧪 Creando templates de reportes predefinidos...\n');

    // Verificar conexión a BD
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    // Templates predefinidos del sistema
    const templates = [
      {
        nombre: 'Proyectos Activos',
        descripcion: 'Lista de todos los proyectos en estado activo (No iniciado, En curso)',
        tipo_reporte: 'proyectos',
        modulo: 'proyectos',
        categoria: 'Proyectos',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['id', 'nombre', 'Cliente.razon_social', 'Responsable.nombre', 'estado', 'prioridad', 'presupuesto', 'porcentaje_avance', 'fecha_inicio', 'fecha_fin'],
          filtros: {
            estado: ['No iniciado', 'En curso']
          }
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'gerencia', 'finanzas'],
        opciones_configuracion: {
          entidad: 'proyectos',
          campos: ['id', 'nombre', 'Cliente.razon_social', 'Responsable.nombre', 'estado', 'prioridad', 'presupuesto', 'porcentaje_avance', 'fecha_inicio', 'fecha_fin'],
          filtros: {
            estado: ['No iniciado', 'En curso']
          }
        }
      },
      {
        nombre: 'Clientes Activos',
        descripcion: 'Directorio completo de clientes activos con información de contacto',
        tipo_reporte: 'clientes',
        modulo: 'clientes',
        categoria: 'Clientes',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['id', 'razon_social', 'rut', 'giro', 'direccion', 'telefono', 'email', 'owner.nombre', 'created_at'],
          filtros: {}
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'gerencia', 'ventas'],
        opciones_configuracion: {
          entidad: 'clientes',
          campos: ['id', 'razon_social', 'rut', 'giro', 'direccion', 'telefono', 'email', 'owner.nombre', 'created_at'],
          filtros: {}
        }
      },
      {
        nombre: 'Facturas Pendientes',
        descripcion: 'Facturas pendientes de cobro con información detallada',
        tipo_reporte: 'financiero',
        modulo: 'finanzas',
        categoria: 'Finanzas',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['id', 'numero_factura', 'cliente.razon_social', 'proyecto.nombre', 'monto', 'estado', 'fecha_emision', 'fecha_vencimiento'],
          filtros: {
            estado: 'pendiente'
          }
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'finanzas'],
        opciones_configuracion: {
          entidad: 'facturas',
          campos: ['id', 'numero_factura', 'cliente.razon_social', 'proyecto.nombre', 'monto', 'estado', 'fecha_emision', 'fecha_vencimiento'],
          filtros: {
            estado: 'pendiente'
          }
        }
      },
      {
        nombre: 'Ventas del Mes',
        descripcion: 'Resumen de ventas realizadas en el mes actual',
        tipo_reporte: 'ventas',
        modulo: 'ventas',
        categoria: 'Ventas',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['id', 'numero_venta', 'cliente.razon_social', 'proyecto.nombre', 'monto', 'estado', 'fecha_venta'],
          filtros: {
            fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            fecha_hasta: new Date().toISOString().split('T')[0]
          }
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'gerencia', 'ventas'],
        opciones_configuracion: {
          entidad: 'ventas',
          campos: ['id', 'numero_venta', 'cliente.razon_social', 'proyecto.nombre', 'monto', 'estado', 'fecha_venta'],
          filtros: {
            fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            fecha_hasta: new Date().toISOString().split('T')[0]
          }
        }
      },
      {
        nombre: 'Cursos Activos',
        descripcion: 'Cursos actualmente en ejecución con información detallada',
        tipo_reporte: 'cursos',
        modulo: 'cursos',
        categoria: 'Cursos',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['id', 'nombre', 'codigo_sence', 'modalidad', 'estado', 'fecha_inicio', 'fecha_fin', 'proyecto.nombre'],
          filtros: {
            estado: ['planificado', 'en_curso']
          }
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'gerencia', 'cursos'],
        opciones_configuracion: {
          entidad: 'cursos',
          campos: ['id', 'nombre', 'codigo_sence', 'modalidad', 'estado', 'fecha_inicio', 'fecha_fin', 'proyecto.nombre'],
          filtros: {
            estado: ['planificado', 'en_curso']
          }
        }
      },
      {
        nombre: 'Resumen Financiero',
        descripcion: 'Resumen general de ingresos y egresos del período',
        tipo_reporte: 'financiero',
        modulo: 'finanzas',
        categoria: 'Finanzas',
        formatos_disponibles: ['pdf', 'excel', 'csv'],
        parametros_requeridos: {
          campos: ['tipo', 'monto', 'descripcion', 'fecha', 'cliente.razon_social', 'proyecto.nombre'],
          filtros: {
            fecha_desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            fecha_hasta: new Date().toISOString().split('T')[0]
          }
        },
        activo: true,
        sistema: true,
        roles_permitidos: ['admin', 'finanzas'],
        opciones_configuracion: {
          entidad: 'finanzas',
          campos: ['tipo', 'monto', 'descripcion', 'fecha', 'cliente.razon_social', 'proyecto.nombre'],
          filtros: {
            fecha_desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            fecha_hasta: new Date().toISOString().split('T')[0]
          }
        }
      }
    ];

    // Crear templates con códigos únicos
    for (const templateData of templates) {
      // Generar código único
      const prefix = templateData.tipo_reporte.substring(0, 3).toUpperCase();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      templateData.codigo = `${prefix}-${random}`;

      // Verificar si ya existe
      const existe = await ReporteTemplate.findOne({
        where: {
          nombre: templateData.nombre,
          tipo_reporte: templateData.tipo_reporte
        }
      });

      if (!existe) {
        await ReporteTemplate.create(templateData);
        console.log(`✅ Template creado: ${templateData.nombre}`);
      } else {
        console.log(`⚠️  Template ya existe: ${templateData.nombre}`);
      }
    }

    console.log('\n🎉 Templates de reportes creados exitosamente!');
    console.log('\n📋 Templates disponibles:');
    templates.forEach(template => {
      console.log(`  - ${template.nombre} (${template.categoria})`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al crear templates:', error);
    process.exit(1);
  }
}

crearTemplatesReportes();
