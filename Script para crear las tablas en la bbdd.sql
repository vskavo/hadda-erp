-- Script para crear las tablas en la base de datos PostgreSQL para el ERP OTEC

-- Crear tipos ENUM necesarios
CREATE TYPE estado_cliente AS ENUM ('activo', 'inactivo', 'prospecto');
CREATE TYPE tipo_actividad AS ENUM ('llamada', 'reunion', 'email', 'visita', 'propuesta', 'otro');
CREATE TYPE estado_seguimiento AS ENUM ('pendiente', 'completada', 'cancelada', 'reprogramada');
CREATE TYPE tipo_curso AS ENUM ('presencial', 'online', 'mixto');
CREATE TYPE estado_curso AS ENUM ('activo', 'inactivo', 'en_revision', 'finalizado');
CREATE TYPE genero AS ENUM ('masculino', 'femenino', 'otro');
CREATE TYPE estado_participante AS ENUM ('inscrito', 'confirmado', 'asistiendo', 'aprobado', 'reprobado', 'retirado');
CREATE TYPE estado_conciliacion AS ENUM ('en_progreso', 'finalizada', 'anulada');
CREATE TYPE modalidad_sesion AS ENUM ('presencial', 'online', 'mixta');
CREATE TYPE estado_sesion AS ENUM ('programada', 'en_curso', 'finalizada', 'cancelada', 'reprogramada');
CREATE TYPE estado_declaracion AS ENUM ('borrador', 'enviada', 'aprobada', 'rechazada', 'anulada');
CREATE TYPE estado_proyecto AS ENUM ('planificacion', 'en_curso', 'finalizado', 'cancelado', 'pausado');
CREATE TYPE estado_factura AS ENUM ('emitida', 'pagada', 'anulada', 'vencida');
CREATE TYPE metodo_pago_factura AS ENUM ('transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro');
CREATE TYPE metodo_pago_ingreso AS ENUM ('factura', 'transferencia', 'cheque', 'efectivo', 'deposito', 'otro');
CREATE TYPE metodo_pago_egreso AS ENUM ('transferencia', 'cheque', 'efectivo', 'tarjeta_credito', 'tarjeta_debito', 'otro');
CREATE TYPE tipo_cuenta AS ENUM ('corriente', 'vista', 'ahorro', 'otra');
CREATE TYPE metodo_pago_remuneracion AS ENUM ('transferencia', 'cheque', 'efectivo', 'otro');
CREATE TYPE estado_cotizacion AS ENUM ('borrador', 'enviada', 'aprobada', 'rechazada', 'vencida', 'convertida');
CREATE TYPE estado_venta AS ENUM ('pendiente', 'en_proceso', 'completada', 'facturada', 'anulada');
CREATE TYPE metodo_pago_venta AS ENUM ('contado', 'credito', 'cheque', 'transferencia', 'otro');
CREATE TYPE estado_costo AS ENUM ('planificado', 'comprometido', 'ejecutado', 'anulado');
CREATE TYPE formato_reporte AS ENUM ('pdf', 'excel', 'csv', 'html', 'json');
CREATE TYPE frecuencia_reporte AS ENUM ('diario', 'semanal', 'mensual', 'trimestral', 'anual', 'bajo_demanda');
CREATE TYPE estado_procesamiento AS ENUM ('pendiente', 'procesado', 'error');
CREATE TYPE estado_scraping AS ENUM ('en_progreso', 'completado', 'error');
CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'crítica');
CREATE TYPE tipo_movimiento AS ENUM ('ingreso', 'egreso', 'ajuste');

-- Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos
CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación entre roles y permisos
CREATE TABLE roles_permisos (
    id SERIAL PRIMARY KEY,
    rol_id INT,
    permiso_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, permiso_id),
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INT,
    rut VARCHAR(255),
    telefono VARCHAR(255),
    direccion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,
    fecha_bloqueo TIMESTAMP NULL,
    requiere_cambio_password BOOLEAN DEFAULT FALSE,
    token_recuperacion VARCHAR(255),
    fecha_expiracion_token TIMESTAMP NULL,
    ultima_ip VARCHAR(255),
    imagen_perfil VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Tabla de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    rut VARCHAR(255) NOT NULL UNIQUE,
    giro VARCHAR(255),
    direccion VARCHAR(255),
    comuna VARCHAR(255),
    ciudad VARCHAR(255),
    telefono VARCHAR(255),
    email VARCHAR(255),
    sitio_web VARCHAR(255),
    contacto_nombre VARCHAR(255),
    contacto_cargo VARCHAR(255),
    contacto_email VARCHAR(255),
    contacto_telefono VARCHAR(255),
    estado estado_cliente DEFAULT 'activo',
    notas TEXT,
    fecha_ultimo_contacto TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de contactos
CREATE TABLE contactos (
    id SERIAL PRIMARY KEY,
    cliente_id INT,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    cargo VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(255),
    telefono_movil VARCHAR(255),
    es_principal BOOLEAN DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de seguimiento de clientes
CREATE TABLE seguimiento_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INT,
    contacto_id INT,
    usuario_id INT,
    tipo_actividad tipo_actividad NOT NULL,
    fecha_actividad TIMESTAMP NOT NULL,
    descripcion TEXT,
    resultado TEXT,
    estado estado_seguimiento DEFAULT 'pendiente',
    fecha_siguiente_actividad TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (contacto_id) REFERENCES contactos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de cursos
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo_sence VARCHAR(255) UNIQUE,
    duracion_horas INT NOT NULL,
    valor_hora DECIMAL(10, 2) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    modalidad tipo_curso DEFAULT 'presencial',
    descripcion TEXT,
    objetivos TEXT,
    contenidos TEXT,
    requisitos TEXT,
    materiales TEXT,
    nro_participantes INT DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    participantes_aprobados INT DEFAULT 0,
    participantes_reprobados INT DEFAULT 0,
    participantes_eliminados INT DEFAULT 0,
    estado estado_curso DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de participantes
CREATE TABLE participantes (
    id SERIAL PRIMARY KEY,
    curso_id INT NOT NULL,
    rut VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(255),
    fecha_nacimiento DATE,
    genero genero,
    direccion VARCHAR(255),
    comuna VARCHAR(255),
    ciudad VARCHAR(255),
    nivel_educacional VARCHAR(50),
    empresa VARCHAR(255),
    cargo VARCHAR(255),
    estado estado_participante DEFAULT 'inscrito',
    porcentaje_asistencia DECIMAL(5, 2) DEFAULT 0,
    nota_final DECIMAL(3, 1),
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(curso_id, rut),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Tabla de sesiones
CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    curso_id INT NOT NULL,
    usuario_id INT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tema VARCHAR(255),
    descripcion TEXT,
    modalidad modalidad_sesion DEFAULT 'presencial',
    lugar VARCHAR(255),
    estado estado_sesion DEFAULT 'programada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de asistencia
CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,
    participante_id INT NOT NULL,
    curso_id INT NOT NULL,
    usuario_id INT,
    fecha DATE NOT NULL,
    asistio BOOLEAN DEFAULT FALSE,
    justificacion TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participante_id, curso_id, fecha),
    FOREIGN KEY (participante_id) REFERENCES participantes(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de declaraciones juradas
CREATE TABLE declaraciones_juradas (
    id SERIAL PRIMARY KEY,
    curso_id INT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_inicio_curso DATE NOT NULL,
    fecha_fin_curso DATE NOT NULL,
    numero_registro VARCHAR(255),
    estado estado_declaracion DEFAULT 'borrador',
    url_documento VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Tabla de proyectos
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    presupuesto DECIMAL(10, 2),
    costo_real DECIMAL(10, 2),
    estado estado_proyecto DEFAULT 'planificacion',
    responsable_id INT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
);

-- Tabla de facturas
CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    numero_factura VARCHAR(255) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP NOT NULL,
    monto_neto DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    estado estado_factura DEFAULT 'emitida',
    fecha_pago TIMESTAMP NULL,
    metodo_pago metodo_pago_factura DEFAULT 'transferencia',
    observaciones TEXT,
    url_pdf VARCHAR(255),
    url_xml VARCHAR(255),
    folio_sii VARCHAR(255),
    proyecto_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
);

-- Tabla de ingresos
CREATE TABLE ingresos (
    id SERIAL PRIMARY KEY,
    proyecto_id INT,
    fecha DATE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    tipo_ingreso VARCHAR(50),
    metodo_pago metodo_pago_ingreso,
    referencia VARCHAR(255),
    factura_id INT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    FOREIGN KEY (factura_id) REFERENCES facturas(id)
);

-- Tabla de egresos
CREATE TABLE egresos (
    id SERIAL PRIMARY KEY,
    proyecto_id INT,
    fecha DATE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    tipo_egreso VARCHAR(50),
    metodo_pago metodo_pago_egreso,
    referencia VARCHAR(255),
    proveedor VARCHAR(255),
    rut_proveedor VARCHAR(255),
    numero_documento VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
);

-- Tabla de cuentas bancarias
CREATE TABLE cuentas_bancarias (
    id SERIAL PRIMARY KEY,
    nombre_banco VARCHAR(255) NOT NULL,
    tipo_cuenta tipo_cuenta NOT NULL,
    numero_cuenta VARCHAR(255) NOT NULL,
    titular VARCHAR(255) NOT NULL,
    rut_titular VARCHAR(255) NOT NULL,
    saldo_actual DECIMAL(10, 2) DEFAULT 0,
    fecha_ultimo_movimiento DATE,
    activa BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de remuneraciones
CREATE TABLE remuneraciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_pago DATE NOT NULL,
    periodo_mes INT NOT NULL,
    periodo_anio INT NOT NULL,
    sueldo_base DECIMAL(10, 2) NOT NULL,
    horas_extra DECIMAL(10, 2) DEFAULT 0,
    bonos DECIMAL(10, 2) DEFAULT 0,
    comisiones DECIMAL(10, 2) DEFAULT 0,
    descuentos DECIMAL(10, 2) DEFAULT 0,
    afp VARCHAR(50),
    porcentaje_afp DECIMAL(5, 2),
    monto_afp DECIMAL(10, 2),
    isapre VARCHAR(50),
    plan_isapre VARCHAR(255),
    monto_isapre DECIMAL(10, 2),
    seguro_cesantia DECIMAL(10, 2),
    impuesto_renta DECIMAL(10, 2),
    total_imponible DECIMAL(10, 2),
    total_haberes DECIMAL(10, 2),
    total_descuentos DECIMAL(10, 2),
    liquido_pagar DECIMAL(10, 2),
    metodo_pago metodo_pago_remuneracion,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de cotizaciones
CREATE TABLE cotizaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    numero_cotizacion VARCHAR(255) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL,
    fecha_validez DATE NOT NULL,
    monto_neto DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    estado estado_cotizacion DEFAULT 'borrador',
    usuario_id INT,
    descripcion TEXT,
    condiciones TEXT,
    observaciones TEXT,
    url_pdf VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de ventas
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    fecha_venta DATE NOT NULL,
    monto_neto DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    estado estado_venta DEFAULT 'pendiente',
    metodo_pago metodo_pago_venta,
    factura_id INT,
    cotizacion_id INT,
    usuario_id INT,
    proyecto_id INT,
    descripcion TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (factura_id) REFERENCES facturas(id),
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
);

-- Tabla de costos de proyecto
CREATE TABLE costos_proyecto (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    tipo_costo VARCHAR(50) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL,
    proveedor VARCHAR(255),
    numero_documento VARCHAR(255),
    estado estado_costo DEFAULT 'planificado',
    egreso_id INT,
    usuario_id INT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
    FOREIGN KEY (egreso_id) REFERENCES egresos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de reporte_templates
CREATE TABLE reporte_templates (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    configuracion JSONB,
    usuario_id INT,
    es_publico BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de reportes
CREATE TABLE reportes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    template_id INT,
    parametros JSONB,
    resultado JSONB,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    url_archivo VARCHAR(255),
    formato formato_reporte DEFAULT 'pdf',
    programado BOOLEAN DEFAULT FALSE,
    frecuencia frecuencia_reporte,
    ultima_ejecucion TIMESTAMP NULL,
    proxima_ejecucion TIMESTAMP NULL,
    destinatarios JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES reporte_templates(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de movimientos bancarios raw
CREATE TABLE movimientos_bancarios_raw (
  id SERIAL PRIMARY KEY,
  cuenta_bancaria_id INT,
  fecha_movimiento DATE,
  fecha_valor DATE,
  descripcion TEXT,
  referencia VARCHAR(100),
  monto DECIMAL(15,2),
  tipo_movimiento VARCHAR(50), -- 'cargo' o 'abono'
  saldo_posterior DECIMAL(15,2),
  datos_adicionales JSONB,
  fecha_scraping TIMESTAMP,
  hash_movimiento VARCHAR(64), -- hash único para identificar duplicados
  estado_procesamiento estado_procesamiento DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  procesado_at TIMESTAMP NULL,
  FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id)
);

CREATE INDEX idx_movimientos_raw_cuenta_id ON movimientos_bancarios_raw(cuenta_bancaria_id);
CREATE INDEX idx_movimientos_raw_hash ON movimientos_bancarios_raw(hash_movimiento);
CREATE INDEX idx_movimientos_raw_estado ON movimientos_bancarios_raw(estado_procesamiento);

-- Tabla de estado del scraping bancario
CREATE TABLE estado_scraping_bancario (
  id SERIAL PRIMARY KEY,
  cuenta_bancaria_id INT,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  estado estado_scraping,
  mensaje_error TEXT,
  movimientos_procesados INT,
  saldo_inicial DECIMAL(15,2),
  saldo_final DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id)
);

-- Tabla de hitos de proyecto
CREATE TABLE hitos_proyecto (
  id SERIAL PRIMARY KEY,
  proyecto_id INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_objetivo DATE,
  prioridad prioridad DEFAULT 'media',
  porcentaje_proyecto INT,
  completado BOOLEAN DEFAULT FALSE,
  fecha_completado DATE,
  usuario_id INT,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CHECK (porcentaje_proyecto >= 0 AND porcentaje_proyecto <= 100)
);

-- Tabla de avances de proyecto
CREATE TABLE avances_proyecto (
  id SERIAL PRIMARY KEY,
  proyecto_id INT NOT NULL,
  porcentaje_anterior INT NOT NULL,
  porcentaje_nuevo INT NOT NULL,
  nota TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CHECK (porcentaje_anterior >= 0 AND porcentaje_anterior <= 100),
  CHECK (porcentaje_nuevo >= 0 AND porcentaje_nuevo <= 100)
);

-- Tabla de conciliaciones bancarias
CREATE TABLE conciliaciones_bancarias (
  id SERIAL PRIMARY KEY,
  cuenta_bancaria_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  saldo_inicial DECIMAL(14, 2) NOT NULL DEFAULT 0,
  saldo_final DECIMAL(14, 2) NOT NULL DEFAULT 0,
  saldo_banco DECIMAL(14, 2) NOT NULL DEFAULT 0,
  diferencia DECIMAL(14, 2) DEFAULT 0,
  estado estado_conciliacion DEFAULT 'en_progreso',
  observaciones TEXT,
  usuario_id INT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_finalizacion TIMESTAMP NULL,
  archivo_extracto VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de movimientos en conciliación
CREATE TABLE movimientos_conciliacion (
  id SERIAL PRIMARY KEY,
  conciliacion_id INT NOT NULL,
  tipo_movimiento tipo_movimiento NOT NULL,
  movimiento_id INT,
  descripcion VARCHAR(255),
  monto DECIMAL(14, 2) NOT NULL,
  fecha DATE NOT NULL,
  conciliado BOOLEAN DEFAULT FALSE,
  referencia_banco VARCHAR(255),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conciliacion_id) REFERENCES conciliaciones_bancarias(id)
);

-- Crear triggers para mantener updated_at automáticamente
SELECT create_updated_at_trigger('roles');
SELECT create_updated_at_trigger('permisos');
SELECT create_updated_at_trigger('roles_permisos');
SELECT create_updated_at_trigger('usuarios');
SELECT create_updated_at_trigger('clientes');
SELECT create_updated_at_trigger('contactos');
SELECT create_updated_at_trigger('seguimiento_clientes');
SELECT create_updated_at_trigger('cursos');
SELECT create_updated_at_trigger('participantes');
SELECT create_updated_at_trigger('sesiones');
SELECT create_updated_at_trigger('asistencias');
SELECT create_updated_at_trigger('declaraciones_juradas');
SELECT create_updated_at_trigger('proyectos');
SELECT create_updated_at_trigger('facturas');
SELECT create_updated_at_trigger('ingresos');
SELECT create_updated_at_trigger('egresos');
SELECT create_updated_at_trigger('cuentas_bancarias');
SELECT create_updated_at_trigger('remuneraciones');
SELECT create_updated_at_trigger('cotizaciones');
SELECT create_updated_at_trigger('ventas');
SELECT create_updated_at_trigger('costos_proyecto');
SELECT create_updated_at_trigger('reporte_templates');
SELECT create_updated_at_trigger('reportes');
SELECT create_updated_at_trigger('hitos_proyecto');
SELECT create_updated_at_trigger('avances_proyecto');
SELECT create_updated_at_trigger('conciliaciones_bancarias');
SELECT create_updated_at_trigger('movimientos_conciliacion');

     