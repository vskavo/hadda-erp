#!/bin/bash
set -e

echo "=== Hadda ERP - Inicialización ==="
echo ""

# Función para esperar a que la base de datos esté lista
wait_for_db() {
    echo "Esperando a que la base de datos esté lista..."
    
    max_attempts=30
    attempt=0
    
    # Determinar el puerto correcto (por defecto 5432)
    DB_PORT_CHECK=${DB_PORT:-5432}
    
    until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT_CHECK" -U "$DB_USER" -d "$DB_NAME" -c '\q' --set=sslmode=require 2>/dev/null || [ $attempt -eq $max_attempts ]; do
        attempt=$((attempt + 1))
        echo "Intento $attempt/$max_attempts - Base de datos no está lista aún..."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ ERROR: No se pudo conectar a la base de datos después de $max_attempts intentos"
        exit 1
    fi
    
    echo "✓ Base de datos está lista"
}

# Función para sincronizar esquema de base de datos
sync_database_schema() {
    echo ""
    echo "=== Sincronizando Esquema de Base de Datos ==="
    
    node <<EOF
const { sequelize } = require('./backend/models');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Conexión establecida');
        
        // Verificar tablas existentes
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log(\`✓ Tablas encontradas: \${tables.length}\`);
        
        // Si hay menos de 10 tablas, probablemente es una BD nueva o incompleta
        if (tables.length < 10) {
            console.log('');
            console.log('⚠️  Base de datos vacía o incompleta detectada');
            console.log('📦 Creando tablas desde los modelos...');
            console.log('');
            
            await sequelize.sync({ 
                force: false,  // NO borrar tablas existentes
                alter: false   // NO modificar tablas existentes
            });
            
            console.log('');
            console.log('✅ Esquema de base de datos sincronizado');
            console.log('');
            
            // Verificar nuevamente
            const newTables = await sequelize.getQueryInterface().showAllTables();
            console.log(\`✓ Total de tablas creadas: \${newTables.length}\`);
        } else {
            console.log('✓ Esquema completo detectado, saltando sync');
        }
        
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error al sincronizar esquema:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
})();
EOF
}

# Función para ejecutar migraciones adicionales
run_migrations() {
    echo ""
    echo "=== Ejecutando Migraciones Adicionales ==="
    
    # Buscar archivos de migración
    if [ -d "backend/migrations" ]; then
        echo "✓ Directorio de migraciones encontrado"
        
        # Si usas Sequelize CLI migrations:
        # cd backend && npx sequelize-cli db:migrate
        
        # Por ahora, las migraciones específicas se pueden ejecutar manualmente si es necesario
        echo "✓ Migraciones opcionales disponibles en backend/migrations/"
    else
        echo "⚠ No se encontraron migraciones"
    fi
}

# Función para crear usuario administrador por defecto
create_default_admin() {
    echo ""
    echo "=== Creando Usuario Administrador ==="
    
    # Script Node.js para crear el usuario admin
    node <<EOF
const { Sequelize } = require('sequelize');

(async () => {
    try {
        // Conectar a la base de datos
        const sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USER,
            process.env.DB_PASSWORD,
            {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 5432,
                dialect: 'postgres',
                logging: false,
                ssl: process.env.DB_SSL === 'true' ? {
                    require: true,
                    rejectUnauthorized: false
                } : false
            }
        );

        await sequelize.authenticate();
        console.log('✓ Conexión a BD establecida');

        // 1. Verificar/Crear rol 'superadmin'
        let [roles] = await sequelize.query(
            "SELECT id FROM roles WHERE LOWER(nombre) = 'superadmin' LIMIT 1"
        );

        let rolId;
        if (roles.length === 0) {
            console.log('✓ Creando rol superadmin...');
            await sequelize.query(\`
                INSERT INTO roles (nombre, descripcion, sistema, activo, created_at, updated_at)
                VALUES ('superadmin', 'Super Administrador del Sistema', true, true, NOW(), NOW())
                ON CONFLICT (nombre) DO NOTHING
                RETURNING id
            \`);
            
            // Obtener el ID del rol recién creado
            [roles] = await sequelize.query(
                "SELECT id FROM roles WHERE LOWER(nombre) = 'superadmin' LIMIT 1"
            );
        }
        
        rolId = roles[0].id;
        console.log('✓ Rol superadmin encontrado con ID:', rolId);

        // 2. Verificar si ya existe un usuario con ese rol
        const [users] = await sequelize.query(
            "SELECT COUNT(*) as count FROM usuarios WHERE rol_id = :rolId",
            { replacements: { rolId } }
        );

        if (users[0].count > 0) {
            console.log('✓ Usuario administrador ya existe');
            await sequelize.close();
            return;
        }

        // 3. Crear usuario admin por defecto
        const bcrypt = require('bcryptjs');
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@hadda-erp.com';

        await sequelize.query(\`
            INSERT INTO usuarios (
                nombre, 
                apellido, 
                email, 
                password, 
                rol_id,
                activo,
                bloqueado,
                intentos_fallidos,
                requiere_cambio_password,
                created_at,
                updated_at
            ) VALUES (
                'Super',
                'Admin',
                :email,
                :password,
                :rolId,
                true,
                false,
                0,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO NOTHING
        \`, {
            replacements: {
                email: defaultEmail,
                password: hashedPassword,
                rolId: rolId
            }
        });

        console.log('');
        console.log('========================================');
        console.log('✓ Usuario administrador creado');
        console.log('========================================');
        console.log('Email:', defaultEmail);
        console.log('Password:', defaultPassword);
        console.log('Rol ID:', rolId);
        console.log('========================================');
        console.log('⚠ CAMBIA ESTA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN');
        console.log('========================================');
        console.log('');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error al crear usuario admin:', error.message);
        console.error('Stack:', error.stack);
        // No fallar el inicio si no se puede crear el usuario
    }
})();
EOF
}

# Verificar variables de entorno requeridas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ ERROR: Variables de entorno de base de datos no configuradas"
    echo "Requeridas: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    exit 1
fi

# Esperar a que la base de datos esté lista
wait_for_db

# Sincronizar esquema de base de datos (crea tablas si no existen)
sync_database_schema

# Ejecutar migraciones adicionales (si las hay)
run_migrations

# Crear usuario admin si es el primer inicio
if [ "$CREATE_DEFAULT_ADMIN" = "true" ]; then
    create_default_admin
fi

echo ""
echo "=== Iniciando Aplicación ==="
echo ""

# Ejecutar el comando especificado (por defecto: node start.js)
exec "$@"

