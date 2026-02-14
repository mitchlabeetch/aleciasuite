#!/bin/bash
set -e

# Create databases idempotently using SELECT to check existence first
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE strapi'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'strapi')\gexec

    SELECT 'CREATE DATABASE activepieces'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'activepieces')\gexec

    SELECT 'CREATE DATABASE plausible'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'plausible')\gexec

    SELECT 'CREATE DATABASE miniflux'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'miniflux')\gexec

    SELECT 'CREATE DATABASE docuseal'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'docuseal')\gexec

    SELECT 'CREATE DATABASE vaultwarden'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vaultwarden')\gexec
EOSQL

echo "✅ All databases created"
