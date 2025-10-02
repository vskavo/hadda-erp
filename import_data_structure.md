Estructura de Tablas para Importación de Datos

Este documento describe la estructura de las tablas necesarias para importar datos de clientes, ventas y cursos a la plataforma Hadda ERP. Los campos que no conozcan, no es necesario completarlos, los hacemos por sistema (id, owner, cliente_id,proyecto_id,cotizacion_id,usuario_id,factura_id,owner_operaciones)

---

## 1. Clientes (Tabla: clientes)

Representa a los clientes de la empresa.

| Campo                 | Tipo de Dato      | Nulo  | Descripción                                       | Ejemplo                               |
|-----------------------|-------------------|-------|---------------------------------------------------|---------------------------------------|
| id                    | INTEGER           | No    | Identificador único del cliente (autoincremental) | 1                                     |
| razon_social          | STRING            | No    | Nombre o razón social del cliente                 | "Mi Empresa SpA"                      |
| rut                   | STRING            | No    | RUT del cliente (formato: XX.XXX.XXX-X)           | "76.123.456-7"                        |
| giro                  | STRING            | Sí    | Giro comercial del cliente                        | "Servicios de consultoría"            |
| direccion             | STRING            | Sí    | Dirección del cliente                             | "Av. Siempre Viva 123"                |
| comuna                | STRING            | Sí    | Comuna del cliente                                | "Providencia"                         |
| ciudad                | STRING            | Sí    | Ciudad del cliente                                | "Santiago"                            |
| telefono              | STRING            | Sí    | Teléfono de contacto del cliente                  | "+56912345678"                        |
| email                 | STRING            | Sí    | Email de contacto del cliente                     | "contacto@miempresa.cl"               |
| sitio_web             | STRING            | Sí    | Sitio web del cliente                             | "https://www.miempresa.cl"            |
| contacto_nombre       | STRING            | Sí    | Nombre del contacto principal en la empresa       | "Juan Pérez"                          |
| contacto_cargo        | STRING            | Sí    | Cargo del contacto principal                      | "Gerente de Operaciones"              |
| contacto_email        | STRING            | Sí    | Email del contacto principal                      | "juan.perez@miempresa.cl"             |
| contacto_telefono     | STRING            | Sí    | Teléfono del contacto principal                   | "+56987654321"                        |
| estado                | STRING            | No    | Estado del cliente ('activo', 'inactivo', 'prospecto') | "activo"                             |
| notas                 | TEXT              | Sí    | Notas adicionales sobre el cliente                | "Cliente referido por..."               |
| fecha_ultimo_contacto | DATE              | Sí    | Fecha del último contacto con el cliente          | "2023-10-26"                          |
| holding               | STRING            | Sí    | Nombre del holding al que pertenece el cliente    | "Holding Principal"                   |
| owner                 | INTEGER           | Sí    | ID del usuario propietario del cliente (FK a usuarios.id) | 1                                   |

---

## 2. Ventas (Tabla: ventas)

Representa las transacciones de venta de cursos o servicios.

| Campo         | Tipo de Dato      | Nulo  | Descripción                                       | Ejemplo           |
|---------------|-------------------|-------|---------------------------------------------------|-------------------|
| id            | INTEGER           | No    | Identificador único de la venta (autoincremental) | 101               |
| cliente_id    | INTEGER           | No    | ID del cliente asociado a la venta (FK a clientes.id) | 1                 |
| proyecto_id   | INTEGER           | Sí    | ID del proyecto asociado a la venta (FK a proyectos.id) | 201             |
| cotizacion_id | INTEGER           | Sí    | ID de la cotización asociada (FK a cotizaciones.id) | 301             |
| titulo        | STRING            | No    | Título o nombre de la venta                       | "Venta Curso SENCE" |
| descripcion   | TEXT              | Sí    | Descripción detallada de la venta                 | "Capacitación..."   |
| fecha_venta   | DATE              | No    | Fecha en que se realizó la venta                  | "2023-10-26"      |
| monto_neto    | DECIMAL(12, 2)    | No    | Monto de la venta sin impuestos                   | 1500000.00        |
| iva           | DECIMAL(12, 2)    | No    | Monto del IVA (calculado, 19%)                    | 285000.00         |
| monto_total   | DECIMAL(12, 2)    | No    | Monto total de la venta (neto + IVA)              | 1785000.00        |
| estado        | ENUM              | No    | Estado de la venta ('pendiente', 'en_proceso', 'completada', 'facturada', 'anulada') | "completada" |
| usuario_id    | INTEGER           | Sí    | ID del usuario que registró la venta (FK a usuarios.id) | 2               |
| factura_id    | INTEGER           | Sí    | ID de la factura asociada (FK a facturas.id)      | 401               |
| metodo_pago   | STRING            | Sí    | Método de pago utilizado                          | "Transferencia"   |
| observaciones | TEXT              | Sí    | Observaciones adicionales sobre la venta          | "Pago en 2 cuotas"|

---

## 3. Cursos (Tabla: cursos)

Representa los cursos ofrecidos por la empresa.

| Campo                      | Tipo de Dato      | Nulo  | Descripción                                     | Ejemplo                             |
|----------------------------|-------------------|-------|-------------------------------------------------|-------------------------------------|
| id                         | INTEGER           | No    | Identificador único del curso (autoincremental) | 501                                 |
| nombre                     | STRING            | No    | Nombre del curso                                | "Liderazgo para Equipos"            |
| codigo_sence               | STRING            | Sí    | Código SENCE del curso                          | "12345678"                          |
| id_sence                   | STRING            | Sí    | ID SENCE del curso                              | "87654321"                          |
| duracion_horas             | INTEGER           | No    | Duración total del curso en horas               | 16                                  |
| valor_hora                 | DECIMAL(10, 2)    | No    | Valor por hora del curso                        | 50000.00                            |
| valor_total                | DECIMAL(10, 2)    | No    | Valor total del curso (duracion * valor_hora)   | 800000.00                           |
| valor_participante         | DECIMAL(10, 2)    | Sí    | Valor por participante                          | 100000.00                           |
| modalidad                  | STRING            | No    | Modalidad del curso (e.g., 'presencial', 'online') | "presencial"                       |
| descripcion                | TEXT              | Sí    | Descripción del curso                           | "Curso orientado a..."              |
| objetivos                  | TEXT              | Sí    | Objetivos de aprendizaje del curso              | "Al finalizar el curso..."          |
| contenidos                 | TEXT              | Sí    | Contenidos del curso                            | "1. Introducción..."                |
| requisitos                 | TEXT              | Sí    | Requisitos para los participantes               | "Conocimientos básicos..."          |
| materiales                 | TEXT              | Sí    | Materiales incluidos en el curso                | "Manual del participante..."        |
| nro_participantes          | INTEGER           | No    | Número de participantes inscritos               | 25                                  |
| fecha_inicio               | DATEONLY          | Sí    | Fecha de inicio del curso                       | "2023-11-15"                        |
| fecha_fin                  | DATEONLY          | Sí    | Fecha de término del curso                      | "2023-11-20"                        |
| estado                     | STRING            | No    | Estado del curso ('activo', 'inactivo', 'finalizado') | "activo"                          |
| estado_sence               | STRING            | No    | Estado SENCE del curso                          | "aprobado"                          |
| proyecto_id                | INTEGER           | Sí    | ID del proyecto asociado (FK a proyectos.id)    | 201                                 |
| owner                      | INTEGER           | Sí    | ID del usuario propietario del curso (FK a usuarios.id) | 3                                 |
| owner_operaciones          | INTEGER           | Sí    | ID del usuario responsable de operaciones (FK a usuarios.id) | 4 |

---

## 4. Participantes (Tabla: participantes)

Representa a los participantes (alumnos) inscritos en un curso. Solo se deben agregar los alumnos que han sido becados, los Sence se extraen desde Sence

| Campo                 | Tipo de Dato      | Nulo  | Descripción                                       | Ejemplo                        |
|-----------------------|-------------------|-------|---------------------------------------------------|--------------------------------|
| id                    | INTEGER           | No    | Identificador único del participante (autoincremental) | 1001                         |
| curso_id              | INTEGER           | No    | ID del curso al que está inscrito (FK a cursos.id) | 501                            |
| rut                   | STRING            | No    | RUT del participante (formato: XXXXXXXX-X)        | "12345678-9"                   |
| nombre                | STRING            | No    | Nombre del participante                           | "Ana"                          |
| apellido              | STRING            | No    | Apellido del participante                         | "García"                       |
| email                 | STRING            | No    | Email del participante                            | "ana.garcia@email.com"         |
| telefono              | STRING            | Sí    | Teléfono del participante                         | "+56911223344"                 |
| fecha_nacimiento      | DATEONLY          | Sí    | Fecha de nacimiento del participante              | "1990-05-15"                   |
| genero                | STRING            | Sí    | Género del participante                           | "Femenino"                     |
| direccion             | STRING            | Sí    | Dirección del participante                        | "Calle Falsa 456"              |
| comuna                | STRING            | Sí    | Comuna del participante                           | "Las Condes"                   |
| ciudad                | STRING            | Sí    | Ciudad del participante                           | "Santiago"                     |
| nivel_educacional     | STRING            | Sí    | Nivel educacional del participante                | "Universitaria completa"       |
| empresa               | STRING            | Sí    | Empresa donde trabaja el participante             | "Otra Empresa Ltda."           |
| cargo                 | STRING            | Sí    | Cargo del participante en su empresa              | "Analista"                     |
| estado                | STRING            | No    | Estado del participante ('inscrito', 'retirado', 'aprobado', 'reprobado') | "inscrito" |
| porcentaje_asistencia | DECIMAL(5, 2)     | No    | Porcentaje de asistencia al curso                 | 95.50                          |
| nota_final            | DECIMAL(3, 1)     | Sí    | Nota final del participante en el curso (1.0 a 7.0) | 6.5                            |
| fecha_inscripcion     | DATE              | No    | Fecha de inscripción al curso                     | "2023-10-20T10:00:00Z"         |
| observaciones         | TEXT              | Sí    | Observaciones sobre el participante               | "Requiere material especial"   |

---
