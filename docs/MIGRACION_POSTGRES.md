# Migración para PostgreSQL

Este archivo contiene información importante para migrar de MariaDB a PostgreSQL.

## Guía de migración

1. Actualiza tu archivo .env con los datos de conexión a PostgreSQL:
   ```
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=erp_otec
   DB_PORT=5432
   DB_TIMEZONE=UTC
   DB_ALTER=false
   ```

2. Crea la base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE erp_otec;
   ```

3. Ejecuta el script de creación de tablas adaptado para PostgreSQL:
   ```bash
   psql -U postgres -d erp_otec -f "Script para crear las tablas en la bbdd.sql"
   ```

4. Para valores actualizados automáticamente (updated_at), se han configurado triggers:
   - Estos triggers están incluidos al final del script principal de creación
   - También están disponibles por separado en los archivos:
     - `backend/migrations/trigger_updated_at.sql` - Define las funciones
     - `backend/migrations/00_auto_updated_at.sql` - Aplica los triggers a todas las tablas

5. Tipos ENUM en PostgreSQL:
   - Se han definido como tipos de datos propios al inicio del script
   - El helper `utils/postgresEnumHelper.js` crea estos tipos si ejecutas la aplicación con DB_ALTER=true
   - Cada tipo se puede usar en múltiples tablas

## Cambios realizados:
- `AUTO_INCREMENT` → `SERIAL`
- `ON UPDATE CURRENT_TIMESTAMP` → Reemplazado por triggers
- `ENUM(...)` → Tipos personalizados con `CREATE TYPE`
- `JSON` → `JSONB` (versión binaria, más eficiente)
- Agregados triggers para mantener `updated_at` actualizado automáticamente

## Notas importantes:
- PostgreSQL es sensible a mayúsculas/minúsculas en los nombres
- La secuencia de creación de tablas respeta las dependencias de claves foráneas
- Los índices y constraints funcionan de manera similar a MariaDB

## Cambios realizados en los modelos:
- Configuración dialect: postgres
- Compatibilidad con tipos ENUM
- Ajuste de dialectOptions para PostgreSQL 