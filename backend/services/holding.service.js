const { Cliente, Venta, sequelize } = require('../models');
const { Op } = require('sequelize');

class HoldingService {
  /**
   * Obtiene un resumen de los holdings, incluyendo el nombre del holding,
   * la cantidad de empresas (clientes) asociadas y las ventas totales.
   * @returns {Promise<Array<Object>>} Un array de objetos, cada uno representando un holding.
   *                                    Ej: [{ nombreHolding: 'Holding A', cantidadEmpresas: 5, ventasTotales: 12000.50 }]
   * @throws {Error} Si ocurre un error durante la consulta a la base de datos.
   */
  static async getSummaryByHolding(userId = null) {
    try {
      // 1. Obtener todos los clientes que tienen un 'holding' definido y no es una cadena vacía
      const where = {
        holding: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      };
      if (userId) {
        where.owner = userId;
      }
      const clientesConHolding = await Cliente.findAll({
        where,
        attributes: ['id', 'holding', 'razon_social'], // Incluir razon_social para referencia si es necesario
        raw: true // Obtener objetos planos para facilitar el procesamiento
      });

      if (!clientesConHolding || clientesConHolding.length === 0) {
        return []; // No hay clientes con holding definido
      }

      // 2. Agrupar clientes por 'holding'
      const holdingsMap = new Map();
      for (const cliente of clientesConHolding) {
        if (!holdingsMap.has(cliente.holding)) {
          holdingsMap.set(cliente.holding, {
            nombreHolding: cliente.holding,
            cantidadEmpresas: 0,
            ventasTotales: 0,
            clienteIds: [] // IDs de los clientes en este holding
          });
        }
        const holdingData = holdingsMap.get(cliente.holding);
        holdingData.cantidadEmpresas++;
        holdingData.clienteIds.push(cliente.id);
      }

      // 3. Para cada holding, calcular las ventas totales
      const summaryPromises = Array.from(holdingsMap.values()).map(async (holdingData) => {
        if (holdingData.clienteIds.length > 0) {
          const { totalVentas } = await Venta.findOne({
            attributes: [
              [sequelize.fn('SUM', sequelize.col('monto_total')), 'totalVentas']
            ],
            where: {
              cliente_id: {
                [Op.in]: holdingData.clienteIds
              }
            },
            raw: true
          });
          // sequelize.fn('SUM', ...) devuelve un string si no hay ventas, o null. Convertir a número.
          holdingData.ventasTotales = parseFloat(totalVentas) || 0;
        }
        // Eliminar clienteIds del resultado final si no se quiere exponer
        delete holdingData.clienteIds; 
        return holdingData;
      });

      return Promise.all(summaryPromises);

    } catch (error) {
      console.error('Error en HoldingService.getSummaryByHolding:', error);
      throw error; // Re-lanzar el error para que el controlador lo maneje
    }
  }

  /**
   * Obtiene el detalle de ventas por empresa y proyecto para un holding específico.
   * @param {string} nombreHolding
   * @returns {Promise<Object>} Estructura anidada con empresas, proyectos y ventas.
   */
  static async getHoldingSalesDetails(nombreHolding, userId = null) {
    try {
      // 1. Buscar todas las empresas del holding
      const where = {
        holding: nombreHolding
      };
      if (userId) {
        where.owner = userId;
      }
      const clientes = await Cliente.findAll({
        where,
        attributes: ['id', 'razon_social', 'rut'],
        raw: true
      });
      if (!clientes || clientes.length === 0) {
        return { nombreHolding, empresas: [], granTotalVentasHolding: 0 };
      }
      const clienteIds = clientes.map(c => c.id);

      // 2. Buscar todas las ventas de estas empresas, incluyendo el proyecto
      const { Venta, Proyecto } = require('../models');
      const ventas = await Venta.findAll({
        where: {
          cliente_id: { [Op.in]: clienteIds }
        },
        attributes: ['id', 'cliente_id', 'proyecto_id', 'titulo', 'monto_total', 'fecha_venta'],
        include: [
          {
            model: Proyecto,
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        raw: true,
        nest: true
      });

      // 3. Agrupar ventas por empresa y por proyecto
      const empresas = clientes.map(cliente => {
        // Ventas de esta empresa
        const ventasEmpresa = ventas.filter(v => v.cliente_id === cliente.id);
        // Agrupar por proyecto
        const proyectosMap = new Map();
        ventasEmpresa.forEach(v => {
          const idProyecto = v.proyecto_id;
          const nombreProyecto = v.Proyecto?.nombre || 'Sin proyecto';
          if (!proyectosMap.has(idProyecto || 'sin')) {
            proyectosMap.set(idProyecto || 'sin', {
              idProyecto: idProyecto,
              nombreProyecto: nombreProyecto,
              ventasEnProyecto: [],
              totalVentasProyectoEmpresa: 0
            });
          }
          const proyecto = proyectosMap.get(idProyecto || 'sin');
          proyecto.ventasEnProyecto.push({
            idVenta: v.id,
            titulo: v.titulo,
            montoTotal: parseFloat(v.monto_total) || 0,
            fechaVenta: v.fecha_venta
          });
          proyecto.totalVentasProyectoEmpresa += parseFloat(v.monto_total) || 0;
        });
        return {
          idCliente: cliente.id,
          razonSocial: cliente.razon_social,
          rut: cliente.rut,
          proyectos: Array.from(proyectosMap.values()),
          totalVentasEmpresa: ventasEmpresa.reduce((acc, v) => acc + (parseFloat(v.monto_total) || 0), 0)
        };
      });
      // 4. Gran total del holding
      const granTotalVentasHolding = empresas.reduce((acc, emp) => acc + emp.totalVentasEmpresa, 0);
      return {
        nombreHolding,
        empresas,
        granTotalVentasHolding
      };
    } catch (error) {
      console.error('Error en HoldingService.getHoldingSalesDetails:', error);
      throw error;
    }
  }
}

module.exports = HoldingService; 