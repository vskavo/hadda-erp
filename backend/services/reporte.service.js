const ExcelJS = require('exceljs');
const pdf = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const models = require('../models');
const { Reporte } = models;
const { logError, logInfo } = require('../utils/logger');

/**
 * Servicio para gestión de reportes y exportaciones
 */
class ReporteService {
  constructor() {
    this.uploadPath = path.join(__dirname, '../uploads/reportes');
    this.ensureUploadDirectory();
  }

  // Asegurar que existe el directorio de uploads
  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  // Generar nombre único para archivo
  generarNombreArchivo(reporteId, formato, prefijo = 'reporte') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefijo}_${reporteId}_${timestamp}.${formato}`;
  }

  // Exportar datos a Excel
  async exportarExcel(datos, columnas, opciones = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(opciones.nombreHoja || 'Reporte');

    // Configurar columnas
    worksheet.columns = columnas.map(col => ({
      header: col.nombre,
      key: col.id,
      width: col.ancho || 15
    }));

    // Estilos para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Agregar datos
    datos.forEach(row => {
      const rowData = {};
      columnas.forEach(col => {
        let valor = this.obtenerValorAnidado(row, col.id);

        // Formatear según tipo de dato
        if (col.tipo === 'fecha' && valor) {
          valor = new Date(valor);
        } else if (col.tipo === 'numero' && valor !== null && valor !== undefined) {
          valor = parseFloat(valor);
        } else {
          // Convertir objetos a strings legibles
          valor = this.formatearValorExportacion(valor);
        }

        rowData[col.id] = valor;
      });
      worksheet.addRow(rowData);
    });

    // Aplicar formato condicional si es necesario
    if (opciones.formatoCondicional) {
      this.aplicarFormatoCondicional(worksheet, datos.length, opciones.formatoCondicional);
    }

    return workbook;
  }

  // Exportar datos a PDF
  async exportarPDF(datos, columnas, opciones = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new pdf({
          size: 'A4',
          margin: 50
        });

        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Título del reporte
        doc.fontSize(20).font('Helvetica-Bold');
        doc.text(opciones.titulo || 'Reporte', { align: 'center' });
        doc.moveDown();

        // Información adicional
        if (opciones.fechaGeneracion) {
          doc.fontSize(10).font('Helvetica');
          doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
          doc.moveDown();
        }

        // Crear tabla
        const tableTop = 150;
        const tableLeft = 50;
        const rowHeight = 20;
        const colWidth = (doc.page.width - 100) / columnas.length;

        // Encabezados
        doc.font('Helvetica-Bold').fontSize(10);
        columnas.forEach((col, index) => {
          doc.text(col.nombre,
            tableLeft + (index * colWidth),
            tableTop,
            { width: colWidth, align: 'center' }
          );
        });

        // Línea separadora
        doc.moveTo(tableLeft, tableTop + 15)
           .lineTo(doc.page.width - 50, tableTop + 15)
           .stroke();

        // Datos
        doc.font('Helvetica').fontSize(8);
        datos.forEach((row, rowIndex) => {
          const y = tableTop + 25 + (rowIndex * rowHeight);

          // Nueva página si es necesario
          if (y > doc.page.height - 100) {
            doc.addPage();
            return; // Skip this row for now, would need more complex pagination
          }

          columnas.forEach((col, colIndex) => {
            let valor = this.obtenerValorAnidado(row, col.id);
            valor = this.formatearValorExportacion(valor);
            const texto = valor !== null && valor !== undefined ? String(valor) : '';

            doc.text(texto.substring(0, 20), // Limitar longitud
              tableLeft + (colIndex * colWidth),
              y,
              { width: colWidth, align: 'center' }
            );
          });
        });

        // Pie de página
        const pageCount = doc.pageCount || 1;
        doc.fontSize(8).text(
          `Página ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Exportar datos a CSV
  async exportarCSV(datos, columnas) {
    let csv = columnas.map(col => col.nombre).join(',') + '\n';

    datos.forEach(row => {
      const values = columnas.map(col => {
        let valor = this.obtenerValorAnidado(row, col.id);
        valor = this.formatearValorExportacion(valor);
        if (valor === null || valor === undefined) return '';

        // Escapar comillas y comas
        valor = String(valor).replace(/"/g, '""');
        if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
          valor = `"${valor}"`;
        }
        return valor;
      });
      csv += values.join(',') + '\n';
    });

    return Buffer.from(csv, 'utf-8');
  }

  // Guardar archivo y actualizar reporte
  async guardarArchivoReporte(reporteId, buffer, formato, nombreArchivo) {
    const filePath = path.join(this.uploadPath, nombreArchivo);

    // Guardar archivo
    await fs.writeFile(filePath, buffer);

    // Obtener tamaño del archivo
    const stats = await fs.stat(filePath);
    const tamanoArchivo = stats.size;

    // Actualizar reporte en BD
    const { Reporte } = models;
    await Reporte.update({
      ruta_archivo: filePath,
      tamano_archivo: tamanoArchivo,
      contador_descargas: 0,
      url_publica: `/api/reportes/${reporteId}/descargar/${formato}`
    }, {
      where: { id: reporteId }
    });

    return {
      ruta: filePath,
      tamano: tamanoArchivo,
      url: `/api/reportes/${reporteId}/descargar/${formato}`
    };
  }

  // Generar y guardar reporte completo
  async generarYGuardarReporte(reporte, formato = 'excel') {
    try {
      const { entidad, campos, filtros } = reporte.parametros;

      // Obtener datos (usando la lógica del controlador)
      const datos = await this.obtenerDatosPorEntidad(entidad, campos, filtros);

      // Obtener configuración de columnas
      const configColumnas = await this.obtenerConfiguracionColumnas(entidad, campos);

      let buffer;
      let nombreArchivo;

      switch (formato.toLowerCase()) {
        case 'excel':
          const workbook = await this.exportarExcel(datos, configColumnas, {
            titulo: reporte.nombre,
            fechaGeneracion: true
          });
          buffer = await workbook.xlsx.writeBuffer();
          nombreArchivo = this.generarNombreArchivo(reporte.id, 'xlsx');
          break;

        case 'pdf':
          buffer = await this.exportarPDF(datos, configColumnas, {
            titulo: reporte.nombre,
            fechaGeneracion: true
          });
          nombreArchivo = this.generarNombreArchivo(reporte.id, 'pdf');
          break;

        case 'csv':
          buffer = await this.exportarCSV(datos, configColumnas);
          nombreArchivo = this.generarNombreArchivo(reporte.id, 'csv');
          break;

        default:
          throw new Error(`Formato ${formato} no soportado`);
      }

      // Guardar archivo
      const resultado = await this.guardarArchivoReporte(reporte.id, buffer, formato, nombreArchivo);

      logInfo(`Reporte ${reporte.id} generado y guardado en formato ${formato}`);

      return {
        exito: true,
        formato,
        archivo: buffer, // Retornar el buffer para la descarga
        metadata: resultado, // Información del archivo guardado
        registros: datos.length
      };

    } catch (error) {
      logError(`Error al generar reporte ${reporte.id}:`, error);
      throw error;
    }
  }

  // Obtener datos por entidad (similar a la función del controlador)
  async obtenerDatosPorEntidad(entidad, campos, filtros = {}) {
    const { Proyecto, Cliente, Usuario, Factura, Venta, Curso, Ingreso, Egreso, Op } = require('../models');

    let modelo;
    let include = [];
    let whereConditions = {};

    // Configurar modelo y asociaciones según entidad
    switch (entidad) {
      case 'proyectos':
        modelo = Proyecto;
        include = [
          { model: Cliente, as: 'Cliente', attributes: ['id', 'razon_social', 'rut'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido'] }
        ];
        break;

      case 'clientes':
        modelo = Cliente;
        include = [
          { model: Usuario, as: 'Owner', attributes: ['id', 'nombre', 'apellido'] }
        ];
        break;

      case 'facturas':
        modelo = Factura;
        include = [
          { model: Cliente, attributes: ['id', 'razon_social', 'rut'] },
          { model: Proyecto, attributes: ['id', 'nombre'] }
        ];
        break;

      case 'ventas':
        modelo = Venta;
        include = [
          { model: Cliente, attributes: ['id', 'razon_social', 'rut'] },
          { model: Proyecto, attributes: ['id', 'nombre'] }
        ];
        break;

      case 'cursos':
        modelo = Curso;
        include = [
          { model: Proyecto, as: 'Proyecto', attributes: ['id', 'nombre'] }
        ];
        break;

      default:
        throw new Error(`Entidad ${entidad} no soportada`);
    }

    // Aplicar filtros
    if (filtros.fecha_desde) {
      whereConditions.created_at = { ...whereConditions.created_at, [Op.gte]: new Date(filtros.fecha_desde) };
    }
    if (filtros.fecha_hasta) {
      whereConditions.created_at = { ...whereConditions.created_at, [Op.lte]: new Date(filtros.fecha_hasta) };
    }

    // Agregar filtros específicos
    Object.keys(filtros).forEach(key => {
      if (!['fecha_desde', 'fecha_hasta'].includes(key) && filtros[key]) {
        whereConditions[key] = filtros[key];
      }
    });

    const datos = await modelo.findAll({
      where: whereConditions,
      include,
      limit: 5000, // Límite de seguridad
      order: [['created_at', 'DESC']]
    });

    return datos.map(item => item.toJSON());
  }

  // Obtener configuración de columnas
  async obtenerConfiguracionColumnas(entidad, camposSeleccionados) {
    const camposPorEntidad = {
      proyectos: [
        { id: 'id', nombre: 'ID', tipo: 'numero', ancho: 10 },
        { id: 'nombre', nombre: 'Nombre', tipo: 'texto', ancho: 30 },
        { id: 'descripcion', nombre: 'Descripción', tipo: 'texto', ancho: 40 },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto', ancho: 25 },
        { id: 'Responsable.nombre', nombre: 'Responsable', tipo: 'texto', ancho: 20 },
        { id: 'estado', nombre: 'Estado', tipo: 'texto', ancho: 15 },
        { id: 'prioridad', nombre: 'Prioridad', tipo: 'texto', ancho: 15 },
        { id: 'presupuesto_total', nombre: 'Presupuesto Total', tipo: 'numero', ancho: 18 },
        { id: 'costo_real', nombre: 'Costo Real', tipo: 'numero', ancho: 15 },
        { id: 'margen_estimado', nombre: 'Margen Estimado', tipo: 'numero', ancho: 18 },
        { id: 'porcentaje_avance', nombre: 'Porcentaje de Avance', tipo: 'numero', ancho: 20 },
        { id: 'fecha_inicio', nombre: 'Fecha Inicio', tipo: 'fecha', ancho: 15 },
        { id: 'fecha_fin', nombre: 'Fecha Fin', tipo: 'fecha', ancho: 15 },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha', ancho: 18 }
      ],
      clientes: [
        { id: 'id', nombre: 'ID', tipo: 'numero', ancho: 10 },
        { id: 'razon_social', nombre: 'Razón Social', tipo: 'texto', ancho: 30 },
        { id: 'rut', nombre: 'RUT', tipo: 'texto', ancho: 15 },
        { id: 'giro', nombre: 'Giro', tipo: 'texto', ancho: 20 },
        { id: 'direccion', nombre: 'Dirección', tipo: 'texto', ancho: 35 },
        { id: 'telefono', nombre: 'Teléfono', tipo: 'texto', ancho: 15 },
        { id: 'email', nombre: 'Email', tipo: 'texto', ancho: 25 },
        { id: 'Owner.nombre', nombre: 'Propietario', tipo: 'texto', ancho: 20 },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha', ancho: 18 }
      ],
      facturas: [
        { id: 'id', nombre: 'ID', tipo: 'numero', ancho: 10 },
        { id: 'numero_factura', nombre: 'Número Factura', tipo: 'texto', ancho: 20 },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto', ancho: 25 },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto', ancho: 25 },
        { id: 'monto', nombre: 'Monto', tipo: 'numero', ancho: 15 },
        { id: 'estado', nombre: 'Estado', tipo: 'texto', ancho: 15 },
        { id: 'fecha_emision', nombre: 'Fecha Emisión', tipo: 'fecha', ancho: 18 },
        { id: 'fecha_vencimiento', nombre: 'Fecha Vencimiento', tipo: 'fecha', ancho: 18 },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha', ancho: 18 }
      ],
      ventas: [
        { id: 'id', nombre: 'ID', tipo: 'numero', ancho: 10 },
        { id: 'numero_venta', nombre: 'Número Venta', tipo: 'texto', ancho: 20 },
        { id: 'Cliente.razon_social', nombre: 'Cliente', tipo: 'texto', ancho: 25 },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto', ancho: 25 },
        { id: 'monto', nombre: 'Monto', tipo: 'numero', ancho: 15 },
        { id: 'estado', nombre: 'Estado', tipo: 'texto', ancho: 15 },
        { id: 'fecha_venta', nombre: 'Fecha Venta', tipo: 'fecha', ancho: 15 },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha', ancho: 18 }
      ],
      cursos: [
        { id: 'id', nombre: 'ID', tipo: 'numero', ancho: 10 },
        { id: 'nombre', nombre: 'Nombre', tipo: 'texto', ancho: 30 },
        { id: 'codigo_sence', nombre: 'Código SENCE', tipo: 'texto', ancho: 20 },
        { id: 'modalidad', nombre: 'Modalidad', tipo: 'texto', ancho: 15 },
        { id: 'estado', nombre: 'Estado', tipo: 'texto', ancho: 15 },
        { id: 'fecha_inicio', nombre: 'Fecha Inicio', tipo: 'fecha', ancho: 15 },
        { id: 'fecha_fin', nombre: 'Fecha Fin', tipo: 'fecha', ancho: 15 },
        { id: 'Proyecto.nombre', nombre: 'Proyecto', tipo: 'texto', ancho: 25 },
        { id: 'created_at', nombre: 'Fecha Creación', tipo: 'fecha', ancho: 18 }
      ]
    };

    const camposEntidad = camposPorEntidad[entidad] || [];
    return camposEntidad.filter(campo => camposSeleccionados.includes(campo.id));
  }

  // Obtener valor anidado de un objeto
  obtenerValorAnidado(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (!current) return null;
      
      // Si el valor actual es undefined pero existe, retornarlo
      if (current[key] !== undefined) {
        return current[key];
      }
      
      return null;
    }, obj);
  }
  
  // Formatear valor para exportación (convierte objetos a string)
  formatearValorExportacion(valor) {
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'object' && valor !== null) {
      // Si es un objeto, intentar convertirlo a string legible
      if (valor.nombre && valor.apellido) {
        return `${valor.nombre} ${valor.apellido}`;
      }
      if (valor.nombre) {
        return valor.nombre;
      }
      // Para otros objetos, convertir a JSON
      return JSON.stringify(valor);
    }
    return valor;
  }

  // Aplicar formato condicional a Excel
  aplicarFormatoCondicional(worksheet, numRows, reglas) {
    reglas.forEach(regla => {
      for (let row = 2; row <= numRows + 1; row++) {
        const cell = worksheet.getCell(`${String.fromCharCode(65 + regla.columna)}${row}`);

        if (regla.condicion === 'mayor' && cell.value > regla.valor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: regla.color }
          };
        } else if (regla.condicion === 'menor' && cell.value < regla.valor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: regla.color }
          };
        } else if (regla.condicion === 'igual' && cell.value === regla.valor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: regla.color }
          };
        }
      }
    });
  }

  // Limpiar archivos antiguos (más de 30 días)
  async limpiarArchivosAntiguos() {
    try {
      const archivos = await fs.readdir(this.uploadPath);
      const ahora = Date.now();
      const treintaDias = 30 * 24 * 60 * 60 * 1000;

      for (const archivo of archivos) {
        const filePath = path.join(this.uploadPath, archivo);
        const stats = await fs.stat(filePath);

        if (ahora - stats.mtime.getTime() > treintaDias) {
          await fs.unlink(filePath);
          logInfo(`Archivo antiguo eliminado: ${archivo}`);
        }
      }
    } catch (error) {
      logError('Error al limpiar archivos antiguos', error);
    }
  }

  // Incrementar contador de descargas
  async incrementarContadorDescargas(reporteId) {
    const { Reporte } = models;
    await Reporte.increment('contador_descargas', { where: { id: reporteId } });
  }
}

module.exports = new ReporteService();
