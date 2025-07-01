-- Permisos para el módulo de cursos
INSERT INTO permisos (nombre, descripcion, modulo, codigo, sistema, activo, "createdAt", "updatedAt")
VALUES 
('Leer cursos', 'Permite ver la lista de cursos y detalles de cada curso', 'Cursos', 'cursos:read', true, true, NOW(), NOW()),
('Crear cursos', 'Permite crear nuevos cursos', 'Cursos', 'cursos:create', true, true, NOW(), NOW()),
('Actualizar cursos', 'Permite modificar la información de cursos existentes', 'Cursos', 'cursos:update', true, true, NOW(), NOW()),
('Eliminar cursos', 'Permite eliminar cursos', 'Cursos', 'cursos:delete', true, true, NOW(), NOW()),
('Gestionar participantes', 'Permite gestionar los participantes de un curso', 'Cursos', 'cursos:participantes', true, true, NOW(), NOW()),
('Gestionar declaraciones juradas', 'Permite gestionar las declaraciones juradas de un curso', 'Cursos', 'cursos:declaraciones', true, true, NOW(), NOW()),
('Ver estadísticas de cursos', 'Permite ver estadísticas y reportes de cursos', 'Cursos', 'cursos:estadisticas', true, true, NOW(), NOW());

-- Asignar permisos al rol de Administrador (asumiendo que el ID del rol Administrador es 1)
INSERT INTO "rolPermisos" (rol_id, permiso_id, "createdAt", "updatedAt")
SELECT 1, id, NOW(), NOW() FROM permisos WHERE codigo LIKE 'cursos:%';

-- Asignar permisos al rol de Coordinador (asumiendo que el ID del rol Coordinador es 2)
INSERT INTO "rolPermisos" (rol_id, permiso_id, "createdAt", "updatedAt")
SELECT 2, id, NOW(), NOW() FROM permisos WHERE codigo IN ('cursos:read', 'cursos:create', 'cursos:update', 'cursos:participantes', 'cursos:declaraciones', 'cursos:estadisticas');

-- Asignar permisos al rol de Instructor (asumiendo que el ID del rol Instructor es 3)
INSERT INTO "rolPermisos" (rol_id, permiso_id, "createdAt", "updatedAt")
SELECT 3, id, NOW(), NOW() FROM permisos WHERE codigo IN ('cursos:read', 'cursos:participantes', 'cursos:estadisticas'); 