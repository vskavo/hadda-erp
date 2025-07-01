# Propuesta de Implementación: Asignación de Propietario (owner) en Clientes

## Objetivo
Permitir que cada cliente tenga un propietario (owner), que corresponde a un usuario de la app. Los usuarios solo podrán ver los clientes que les pertenecen, salvo los administradores, que podrán ver todos. Los usuarios con permiso de ver clientes, pero sin rol de administrador, solo verán sus propios clientes.

---

## 1. Cambios en Base de Datos

### 1.1. Agregar columna `owner` a la tabla `clientes`
- Tipo: INTEGER (referencia a `usuarios.id`)
- Permitir NULL solo para migración inicial, luego debe ser obligatorio.
- Agregar FK a `usuarios(id)`.

**Ejemplo SQL:**
```sql
ALTER TABLE clientes ADD COLUMN owner INTEGER;
ALTER TABLE clientes ADD CONSTRAINT fk_clientes_owner FOREIGN KEY (owner) REFERENCES usuarios(id);
```

---

## 2. Cambios en el Backend

### 2.1. Modelo Sequelize (`backend/models/cliente.model.js`)
- Agregar campo `owner` al modelo.
- Definir la relación con el modelo Usuario (belongsTo).

### 2.2. Controlador de Clientes (`backend/controllers/cliente.controller.js`)
- **findAll:**
  - Si el usuario es admin: retornar todos los clientes.
  - Si no es admin pero tiene permiso de ver clientes: retornar solo los clientes donde `owner = req.usuario.id`.
- **create:**
  - Asignar `owner` como el usuario autenticado (`req.usuario.id`).
  - Si el usuario es admin, permitir especificar el owner.
- **update:**
  - Permitir cambiar el owner solo a administradores.

### 2.3. Middlewares de permisos
- Usar los middlewares existentes para distinguir entre admin y usuarios normales.

### 2.4. Rutas
- Proteger las rutas de clientes con autenticación y permisos.

---

## 3. Cambios en el Frontend

### 3.1. Listado de clientes
- No requiere cambios si el backend filtra correctamente.
- (Opcional) Mostrar el propietario en la tabla para administradores.

### 3.2. Formulario de cliente
- Al crear un cliente, no mostrar el campo owner a usuarios normales (se asigna automáticamente).
- Si el usuario es admin, permitir seleccionar el owner (lista de usuarios).

### 3.3. Servicios
- Asegurarse de enviar el campo owner al crear/editar solo si el usuario es admin.

### 3.4. Contexto de usuario
- Usar el contexto de usuario autenticado para saber si es admin y su id.

---

## 4. Migración de datos
- Asignar un owner por defecto a los clientes existentes (por ejemplo, al admin principal o según reglas de negocio).

---

## 5. Pruebas y validaciones
- Probar con usuarios admin y no admin.
- Validar que los usuarios solo ven sus clientes.
- Validar que los admin pueden ver y reasignar cualquier cliente.

---

## 6. Resumen de pasos
1. Agregar columna y FK en la base de datos.
2. Actualizar modelo Sequelize.
3. Modificar controladores para filtrar y asignar owner.
4. Ajustar frontend para creación/edición y visualización.
5. Migrar datos existentes.
6. Probar con diferentes roles.

---

**Notas:**
- Si necesitas ejemplos de código para cada paso, indícalo y los agrego.
- Esta propuesta asume que el sistema de autenticación ya provee el usuario autenticado en `req.usuario` y que los roles están correctamente implementados. 