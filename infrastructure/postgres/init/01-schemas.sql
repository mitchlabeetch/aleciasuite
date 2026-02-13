-- infrastructure/postgres/init/01-schemas.sql

-- Application role used by GRANT statements in migrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'alecia_app') THEN
        CREATE ROLE alecia_app LOGIN PASSWORD 'dev-app-password';
    END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS alecia_bi;
CREATE SCHEMA IF NOT EXISTS alecia_numbers;
CREATE SCHEMA IF NOT EXISTS alecia_flows;
CREATE SCHEMA IF NOT EXISTS alecia_sign;
CREATE SCHEMA IF NOT EXISTS alecia_colab;
CREATE SCHEMA IF NOT EXISTS alecia_cms;
CREATE SCHEMA IF NOT EXISTS alecia_analytics;
ALTER DATABASE alecia SET search_path TO shared, public;
