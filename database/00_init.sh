#!/bin/bash
set -e

echo "============================================="
echo "Inicializando Base de Datos XploraSG..."
echo "============================================="

# Nota: Este script sólo se ejecuta si el volumen 'pgdata' está vacío.

echo ">>> Ejecutando Migraciones (Estructura) <<<"
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
    # Las migraciones cuyo nombre contiene "_supabase_" dependen de auth.users,
    # roles y funciones que no existen en PostgreSQL local.
    case "$(basename "$f")" in
        *_supabase_*)
            echo " -> Omitiendo migración exclusiva de Supabase: $f"
            continue
            ;;
    esac
    echo " -> Aplicando migración: $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo ">>> Ejecutando Semillas (Datos base) <<<"
for f in /docker-entrypoint-initdb.d/seeds/*.sql; do
    echo " -> Aplicando semilla: $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "============================================="
echo "Base de Datos Inicializada Correctamente"
echo "============================================="
