# 📚 Guía de Migraciones de Base de Datos

Esta guía explica cómo manejar cambios en el esquema de base de datos sin afectar los datos de los clientes.

---

## 🔄 Cómo Funciona el Sistema

### Flujo Automático en Deployment

Cuando despliegas o reinicias un contenedor, el sistema ejecuta automáticamente:

```
1. Esperar a que la BD esté lista
2. Sincronizar esquema base (crear tablas si no existen)
3. ✨ EJECUTAR MIGRACIONES PENDIENTES ✨
4. ✨ EJECUTAR SEEDERS DE DATOS INICIALES ✨  ← NUEVO
5. Crear rol administrador y permisos
6. Crear usuario admin (si no existe)
7. Iniciar aplicación
```

### ¿Qué son los Seeders?

Los **seeders** insertan datos iniciales necesarios para que la aplicación funcione correctamente:

- **Informes Predefinidos**: 6 templates de reportes listos para usar (Proyectos Activos, Clientes Activos, Facturas Pendientes, Ventas del Mes, Cursos Activos, Resumen Financiero)
- Otros datos de configuración del sistema que se agregarán en el futuro

Los seeders son **idempotentes** - verifican si los datos ya existen antes de insertarlos, por lo que es seguro ejecutarlos múltiples veces.

### Tabla de Control

Sequelize mantiene una tabla `SequelizeMeta` que registra qué migraciones ya se ejecutaron:

```sql
SELECT * FROM "SequelizeMeta";
```

```
name
-----------------------------
20240601000001-create-sesiones.js
20240601000002-create-asistencias.js
20240601000003-add-porcentaje-asistencia-to-participantes.js
...
```

**Esto garantiza que cada migración se ejecute UNA SOLA VEZ**, incluso si reinicias el contenedor múltiples veces.

---

## 🛠️ Crear Nueva Migración

### Opción 1: Comando Sequelize CLI (Recomendado)

```bash
# En el directorio backend/
cd backend

# Crear una nueva migración
npx sequelize-cli migration:generate --name add-telefono-to-usuarios
```

Esto crea un archivo: `backend/migrations/YYYYMMDDHHMMSS-add-telefono-to-usuarios.js`

### Opción 2: Crear archivo manualmente

Crea un archivo en `backend/migrations/` con el formato:

```
YYYYMMDDHHMMSS-descripcion-del-cambio.js
```

Ejemplo: `20251004120000-add-telefono-to-usuarios.js`

---

## ✍️ Estructura de una Migración

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // CAMBIOS A APLICAR (cuando se ejecuta la migración)
    
    // Ejemplo 1: Agregar una columna
    await queryInterface.addColumn('usuarios', 'telefono', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Teléfono de contacto del usuario'
    });
    
    // Ejemplo 2: Agregar un índice
    await queryInterface.addIndex('usuarios', ['telefono'], {
      name: 'idx_usuarios_telefono'
    });
  },

  async down(queryInterface, Sequelize) {
    // ROLLBACK (cómo revertir los cambios si es necesario)
    
    await queryInterface.removeIndex('usuarios', 'idx_usuarios_telefono');
    await queryInterface.removeColumn('usuarios', 'telefono');
  }
};
```

---

## 📝 Ejemplos Comunes de Migraciones

### Agregar una columna

```javascript
async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('proyectos', 'codigo_interno', {
    type: Sequelize.STRING(50),
    allowNull: true,
    unique: true
  });
}

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('proyectos', 'codigo_interno');
}
```

### Modificar tipo de columna

```javascript
async up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('usuarios', 'email', {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  });
}

async down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('usuarios', 'email', {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  });
}
```

### Crear una tabla nueva

```javascript
async up(queryInterface, Sequelize) {
  await queryInterface.createTable('notificaciones', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    mensaje: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    leida: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });
}

async down(queryInterface, Sequelize) {
  await queryInterface.dropTable('notificaciones');
}
```

### Agregar índice compuesto

```javascript
async up(queryInterface, Sequelize) {
  await queryInterface.addIndex('proyectos', ['cliente_id', 'estado'], {
    name: 'idx_proyectos_cliente_estado'
  });
}

async down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('proyectos', 'idx_proyectos_cliente_estado');
}
```

### Migración de datos (UPDATE/INSERT)

```javascript
async up(queryInterface, Sequelize) {
  // Agregar columna
  await queryInterface.addColumn('usuarios', 'timezone', {
    type: Sequelize.STRING(50),
    allowNull: true
  });
  
  // Poblar con valor por defecto para usuarios existentes
  await queryInterface.sequelize.query(`
    UPDATE usuarios 
    SET timezone = 'America/Santiago' 
    WHERE timezone IS NULL
  `);
  
  // Hacer la columna NOT NULL ahora que tiene datos
  await queryInterface.changeColumn('usuarios', 'timezone', {
    type: Sequelize.STRING(50),
    allowNull: false,
    defaultValue: 'America/Santiago'
  });
}

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('usuarios', 'timezone');
}
```

---

## 🚀 Flujo Completo de Deployment con Migración

### Escenario: Necesitas agregar la columna `telefono` a la tabla `usuarios`

#### 1. **Desarrollo Local**

```bash
# Crear la migración
cd backend
npx sequelize-cli migration:generate --name add-telefono-to-usuarios

# Editar el archivo generado en backend/migrations/
# Agregar la lógica de up() y down()

# Probar la migración localmente
npx sequelize-cli db:migrate

# Verificar que funcionó
npx sequelize-cli db:migrate:status
```

#### 2. **Actualizar el Modelo (Opcional pero recomendado)**

Si agregaste una columna, actualiza el modelo de Sequelize:

```javascript
// backend/models/usuario.model.js
const Usuario = sequelize.define('Usuario', {
  // ... campos existentes ...
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
});
```

#### 3. **Commit y Push**

```bash
git add backend/migrations/20251004120000-add-telefono-to-usuarios.js
git add backend/models/usuario.model.js
git commit -m "feat: Add telefono field to usuarios table"
git push origin main
```

#### 4. **GitHub Actions Build**

- GitHub Actions construye automáticamente la nueva imagen Docker
- La imagen incluye la nueva migración en `backend/migrations/`
- Espera ~2-3 minutos a que termine el build

#### 5. **Actualizar Clientes**

##### Opción A: Actualizar UN cliente específico

```bash
# El script reinicia el Web App y pull la imagen :latest
./scripts/update-webapp.sh cliente-prueba
```

##### Opción B: Actualizar TODOS los clientes

```bash
# Reinicia todos los Web Apps para que pull la imagen :latest
./scripts/update-all-webapps.sh
```

#### 6. **Verificar en los Logs**

```bash
az webapp log tail \
  --resource-group hadda-clientes-rg \
  --name hadda-erp-cliente-prueba
```

Deberías ver:

```
=== Ejecutando Migraciones de Sequelize ===
✓ Directorio de migraciones encontrado
✓ Total de archivos de migración disponibles: 14
✓ Ejecutando migraciones pendientes...
  Sequelize CLI [Node: 22.x.x, CLI: 6.x.x, ORM: 6.x.x]
  
  Loaded configuration file "config/config.js".
  Using environment "production".
  
  == 20251004120000-add-telefono-to-usuarios: migrating =======
  == 20251004120000-add-telefono-to-usuarios: migrated (0.125s)
  
✓ Migraciones ejecutadas exitosamente
```

#### 7. **Verificar en Supabase**

```sql
-- Verificar que la columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name = 'telefono';

-- Verificar que la migración está registrada
SELECT * FROM "SequelizeMeta" WHERE name = '20251004120000-add-telefono-to-usuarios.js';
```

---

## ⚠️ Mejores Prácticas

### ✅ DO (Hacer)

1. **Siempre escribe el método `down()`** para poder revertir cambios si es necesario
2. **Prueba localmente primero** antes de deployar a producción
3. **Usa transacciones** para cambios complejos que deben ser atómicos
4. **Nombra descriptivamente** las migraciones: `add-X-to-Y`, `create-table-Z`, `fix-column-type-W`
5. **Documenta cambios complejos** con comentarios en la migración
6. **Considera datos existentes** al agregar columnas NOT NULL (usa valores por defecto)

### ❌ DON'T (No hacer)

1. **NO modifiques migraciones ya ejecutadas** - Crea una nueva migración para corregir
2. **NO uses `sequelize.sync({ alter: true })`** en producción - Puede perder datos
3. **NO borres la tabla `SequelizeMeta`** - Perderás el historial de qué migraciones ya se ejecutaron
4. **NO hagas cambios destructivos sin backup** (DROP TABLE, DROP COLUMN con datos importantes)
5. **NO dependas de datos específicos del ambiente** en las migraciones

---

## 🐛 Troubleshooting

### La migración ya se ejecutó pero quiero re-ejecutarla

```bash
# En desarrollo local:
cd backend
npx sequelize-cli db:migrate:undo

# O revertir todas:
npx sequelize-cli db:migrate:undo:all
```

### Error: "Migration X has already been executed"

Esto es normal. Sequelize detectó que la migración ya se aplicó y la saltó. No es un error.

### Necesito ejecutar una migración manualmente en Supabase

```sql
-- 1. Ejecuta el SQL de la migración directamente
ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20);

-- 2. Registra la migración como ejecutada
INSERT INTO "SequelizeMeta" (name) 
VALUES ('20251004120000-add-telefono-to-usuarios.js');
```

### La migración falló a medias

Si una migración falla parcialmente:

1. **Verifica el estado en Supabase** - ¿Se aplicaron algunos cambios?
2. **Ejecuta el `down()` manualmente** si es necesario limpiar
3. **Corrige la migración** y crea una nueva con sufijo `-fix`
4. **NO modifiques la migración original** que ya está en `SequelizeMeta`

---

## 📊 Comandos Útiles

```bash
# Ver estado de migraciones
cd backend
npx sequelize-cli db:migrate:status

# Ejecutar migraciones pendientes
npx sequelize-cli db:migrate

# Revertir última migración
npx sequelize-cli db:migrate:undo

# Revertir hasta una migración específica
npx sequelize-cli db:migrate:undo:all --to 20240601000003-add-porcentaje-asistencia-to-participantes.js
```

---

## 🎯 Resumen del Flujo

```
┌─────────────────────────────────────────────────────────┐
│  Desarrollador                                          │
├─────────────────────────────────────────────────────────┤
│ 1. Crear migración con sequelize-cli                   │
│ 2. Probar localmente                                    │
│ 3. Actualizar modelo (si aplica)                       │
│ 4. git commit & push                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions                                         │
├─────────────────────────────────────────────────────────┤
│ • Build Docker image con nueva migración               │
│ • Push a ghcr.io con tag :latest                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Actualizar Clientes                                    │
├─────────────────────────────────────────────────────────┤
│ • ./scripts/update-webapp.sh cliente-X                 │
│ • O ./scripts/update-all-webapps.sh                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Azure Web App (Cada Cliente)                          │
├─────────────────────────────────────────────────────────┤
│ • Reinicia y pull imagen :latest                       │
│ • docker-entrypoint.sh ejecuta:                        │
│   - Espera BD ready                                    │
│   - Sync esquema base                                  │
│   - ✨ Ejecuta migraciones pendientes ✨              │
│   - Crea admin si no existe                            │
│   - Inicia app                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Base de Datos (Supabase)                              │
├─────────────────────────────────────────────────────────┤
│ • Registra migración en SequelizeMeta                  │
│ • Esquema actualizado ✅                               │
│ • Datos preservados ✅                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad de Datos

El sistema de migraciones es **seguro** porque:

1. ✅ **Sequelize CLI usa transacciones** - Si algo falla, se revierte todo
2. ✅ **Cada migración se ejecuta UNA VEZ** - Registrado en `SequelizeMeta`
3. ✅ **No usa `sequelize.sync({ force: true })`** - NO borra tablas existentes
4. ✅ **Las migraciones son revisables** - Están en Git, puedes auditar cambios
5. ✅ **Puedes revertir** - El método `down()` permite rollback

**Recomendación**: Siempre ten backups de Supabase antes de desplegar cambios críticos.

---

## 🌱 Crear Nuevos Seeders

Si necesitas agregar otros datos iniciales (ej: categorías, configuraciones, etc.), sigue este patrón:

### 1. Crear el archivo del seeder

```javascript
// backend/scripts/seed-categorias.js
require('dotenv').config();
const { sequelize, Categoria } = require('../models');

async function seedCategorias() {
  try {
    console.log('🌱 Creando categorías iniciales...');
    
    await sequelize.authenticate();
    
    const categorias = [
      { nombre: 'Capacitación', activo: true, sistema: true },
      { nombre: 'Consultoría', activo: true, sistema: true },
      { nombre: 'Asesoría', activo: true, sistema: true }
    ];
    
    for (const categoriaData of categorias) {
      // Verificar si ya existe
      const existe = await Categoria.findOne({
        where: { nombre: categoriaData.nombre }
      });
      
      if (!existe) {
        await Categoria.create(categoriaData);
        console.log(`✓ Categoría creada: ${categoriaData.nombre}`);
      } else {
        console.log(`⚠️  Categoría ya existe: ${categoriaData.nombre}`);
      }
    }
    
    console.log('✓ Categorías iniciales creadas');
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error al crear categorías:', error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedCategorias();
}

module.exports = seedCategorias;
```

### 2. Agregar al docker-entrypoint.sh

Edita la función `seed_initial_data()`:

```bash
seed_initial_data() {
    echo ""
    echo "=== Ejecutando Seeders de Datos Iniciales ==="
    
    # Seeder de informes predefinidos
    if [ -f "backend/scripts/crear-templates-reportes.js" ]; then
        echo "✓ Ejecutando seeder de informes predefinidos..."
        node backend/scripts/crear-templates-reportes.js
    fi
    
    # Seeder de categorías (NUEVO)
    if [ -f "backend/scripts/seed-categorias.js" ]; then
        echo "✓ Ejecutando seeder de categorías..."
        node backend/scripts/seed-categorias.js
    fi
    
    echo ""
}
```

### 3. Probar localmente

```bash
node backend/scripts/seed-categorias.js
```

### 4. Commit y deploy

```bash
git add backend/scripts/seed-categorias.js docker-entrypoint.sh
git commit -m "feat: Add categorias seeder"
git push origin main
```

---

## 📞 ¿Preguntas?

Si algo no está claro o encuentras un caso de uso no documentado, actualiza esta guía! 🚀

