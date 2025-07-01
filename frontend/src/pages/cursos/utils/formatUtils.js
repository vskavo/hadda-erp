import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Funciones auxiliares para formateo de fechas, números, etc. en el módulo de cursos.
 */

/**
 * Formatea una fecha para mostrar en UI (DD/MM/YYYY)
 * @param {Date|string} fecha - La fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatFechaUI(fecha) {
  if (!fecha) return 'No definida';
  
  if (typeof fecha === 'string') {
    try {
      const parsedDate = parse(fecha, 'yyyy-MM-dd', new Date());
      if (isNaN(parsedDate.getTime())) return 'Fecha inválida';
      return format(parsedDate, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
  
  if (fecha instanceof Date && !isNaN(fecha)) {
    return format(fecha, 'dd/MM/yyyy', { locale: es });
  }
  
  return 'Formato inválido';
}

/**
 * Parsea una fecha de string a objeto Date
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date|null} Objeto Date o null si es inválida
 */
export function parseDateStringRobust(dateString) {
  if (!dateString) return null;
  try {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isNaN(parsedDate.getTime())) {
       return null; 
    }
    return parsedDate;
  } catch (error) {
    return null;
  }
}

/**
 * Formatea un valor numérico para mostrar como moneda (CLP)
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
export function formatMoneda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return 'No definido';
  return Number(valor).toLocaleString('es-CL');
}

/**
 * Convierte una fecha para API (YYYY-MM-DD)
 * @param {Date} fecha - La fecha a formatear
 * @returns {string|null} Fecha formateada para API o null
 */
export function formatFechaAPI(fecha) {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return null;
  return fecha.toISOString().split('T')[0];
}

export function formatNumero(numero) {
  // TODO: Implementar formateo de número (ejemplo: miles, decimales)
  return numero;
} 