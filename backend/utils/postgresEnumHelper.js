/**
 * Helper para manejar tipos ENUM en PostgreSQL
 * Este archivo crea los tipos ENUM necesarios para la aplicación
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { logInfo, logError } = require('./logger');

/**
 * Crea un tipo ENUM en PostgreSQL si no existe
 * @param {string} typeName - Nombre del tipo ENUM
 * @param {Array<string>} values - Valores del ENUM
 */
async function createEnumType(typeName, values) {
  try {
    // Verificar si el tipo ya existe
    const typeExists = await sequelize.query(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}')`,
      { type: QueryTypes.SELECT }
    );
    
    if (!typeExists[0].exists) {
      // Crear el tipo ENUM
      const valuesString = values.map(v => `'${v}'`).join(', ');
      await sequelize.query(`CREATE TYPE ${typeName} AS ENUM (${valuesString})`);
      logInfo(`Tipo ENUM '${typeName}' creado correctamente`);
    } else {
      logInfo(`Tipo ENUM '${typeName}' ya existe`);
    }
  } catch (error) {
    logError(`Error al crear tipo ENUM '${typeName}'`, error);
    throw error;
  }
}

/**
 * Crea todos los tipos ENUM necesarios para la aplicación
 */
async function createPostgresEnums() {
  try {
    // Estado de Cliente
    await createEnumType('estado_cliente', ['activo', 'inactivo', 'prospecto']);
    
    // Estados de Proyectos
    await createEnumType('estado_proyecto', ['pendiente', 'en_proceso', 'completado', 'cancelado']);
    
    // Tipos de Curso
    await createEnumType('tipo_curso', ['presencial', 'online', 'mixto']);
    await createEnumType('estado_curso', ['activo', 'inactivo', 'en_revision', 'finalizado']);
    
    // Estados de Pago
    await createEnumType('estado_pago', ['pendiente', 'pagado', 'rechazado', 'anulado']);
    
    // Tipo de Cuenta Bancaria
    await createEnumType('tipo_cuenta', ['corriente', 'vista', 'ahorro', 'otra']);
    
    // Estados de Factura
    await createEnumType('estado_factura', ['emitida', 'pagada', 'anulada', 'vencida']);
    
    // Medios de Pago
    await createEnumType('medio_pago', ['transferencia', 'cheque', 'efectivo', 'tarjeta_credito', 'tarjeta_debito', 'otro']);
    
    // Tipos de Documento
    await createEnumType('tipo_documento', ['factura', 'boleta', 'transferencia', 'cheque', 'efectivo', 'nota_credito', 'otro']);
    
    // Estados de Cotización
    await createEnumType('estado_cotizacion', ['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida', 'convertida']);
    
    // Estados de Conciliación
    await createEnumType('estado_conciliacion', ['en_progreso', 'finalizada', 'anulada']);
    
    // Tipos de Movimiento
    await createEnumType('tipo_movimiento', ['ingreso', 'egreso', 'ajuste']);
    
    // Estados de Costo
    await createEnumType('estado_costo', ['planificado', 'comprometido', 'ejecutado', 'anulado']);
    
    // Tipos de Comprobante
    await createEnumType('tipo_comprobante', ['factura', 'boleta', 'contrato', 'recibo', 'otro']);
    
    // Prioridades
    await createEnumType('prioridad', ['baja', 'media', 'alta', 'crítica']);
    
    // Estados de Declaración Jurada
    await createEnumType('estado_declaracion', ['borrador', 'enviada', 'aprobada', 'rechazada', 'anulada']);
    await createEnumType('tipo_declaracion', ['inicio', 'termino', 'conectividad', 'rectificacion']);
    
    logInfo('Todos los tipos ENUM creados correctamente');
  } catch (error) {
    logError('Error al crear tipos ENUM', error);
    throw error;
  }
}

module.exports = {
  createPostgresEnums,
  createEnumType
}; 