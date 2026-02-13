#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE strapi;
    CREATE DATABASE activepieces;
    CREATE DATABASE plausible;
    CREATE DATABASE miniflux;
    CREATE DATABASE docuseal;
    CREATE DATABASE vaultwarden;
EOSQL

echo "✅ All databases created"
