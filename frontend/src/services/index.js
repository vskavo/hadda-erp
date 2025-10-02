// Exportación centralizada de servicios
import api from './api';
import facturaService from './facturaService';
import { ingresoService, egresoService } from './movimientosService';
import { cuentaBancariaService, conciliacionBancariaService } from './conciliacionBancariaService';
import dashboardService from './dashboardService';
import proyectoService from './proyectoService';
import reporteService from './reporteService';
import clienteService from './clienteService';
import usuarioService from './usuarioService';
import settingService from './settingService';
import cursoSenceService from './cursoSenceService';
import cursoService from './cursoService';
import comisionService from './comisionService';
import { siiIngresosService, siiEgresosService, siiService } from './siiService';

// Exportar los servicios
export {
  api,
  facturaService,
  ingresoService,
  egresoService,
  cuentaBancariaService,
  conciliacionBancariaService,
  dashboardService,
  proyectoService,
  reporteService,
  clienteService,
  usuarioService,
  settingService,
  cursoSenceService,
  cursoService,
  comisionService,
  siiIngresosService,
  siiEgresosService,
  siiService
}; 