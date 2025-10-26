#!/bin/bash
# Script para probar el parsing de la connection string

if [ $# -lt 1 ]; then
    echo "Uso: $0 '<connection-string>'"
    echo ""
    echo "Ejemplo:"
    echo "  $0 'postgresql://postgres:mypassword@host.supabase.co:5432/postgres'"
    exit 1
fi

SUPABASE_CONN=$1

echo "=== Test de Parsing de Connection String ==="
echo ""
echo "Connection string recibida:"
echo "$SUPABASE_CONN"
echo ""

# Remover el prefijo postgresql://
CONN_WITHOUT_PREFIX="${SUPABASE_CONN#postgresql://}"
echo "Sin prefijo: $CONN_WITHOUT_PREFIX"
echo ""

# Extraer user:password (antes de @)
USER_PASS="${CONN_WITHOUT_PREFIX%%@*}"
echo "User:Pass: $USER_PASS"
DB_USER="${USER_PASS%%:*}"
DB_PASSWORD="${USER_PASS#*:}"

# Extraer host:port/database (después de @)
HOST_PORT_DB="${CONN_WITHOUT_PREFIX#*@}"
echo "Host:Port/DB: $HOST_PORT_DB"
HOST_PORT="${HOST_PORT_DB%%/*}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"

# Extraer database (después de /)
DB_NAME="${HOST_PORT_DB#*/}"
# Remover query params si existen
DB_NAME="${DB_NAME%%\?*}"

echo ""
echo "=== Resultados del Parsing ==="
echo "DB_USER:     '$DB_USER'"
echo "DB_PASSWORD: '$DB_PASSWORD' (${#DB_PASSWORD} caracteres)"
echo "DB_HOST:     '$DB_HOST'"
echo "DB_PORT:     '$DB_PORT'"
echo "DB_NAME:     '$DB_NAME'"
echo ""

# Validación
ALL_OK=true
if [ -z "$DB_USER" ]; then
    echo "❌ DB_USER está vacío"
    ALL_OK=false
fi
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD está vacío"
    ALL_OK=false
fi
if [ -z "$DB_HOST" ]; then
    echo "❌ DB_HOST está vacío"
    ALL_OK=false
fi
if [ -z "$DB_PORT" ]; then
    echo "❌ DB_PORT está vacío"
    ALL_OK=false
fi
if [ -z "$DB_NAME" ]; then
    echo "❌ DB_NAME está vacío"
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo "✅ Todos los campos extraídos correctamente"
else
    echo "❌ Algunos campos no se pudieron extraer"
    exit 1
fi

