#!/usr/bin/env bash
set -euo pipefail
[[ "${APP_ENV:-}" == development ]] || { echo 'Bootstrap restricted to development.' >&2; exit 1; }
for name in MIGRATION_DB_USER APP_DB_USER; do
  [[ "${!name:-}" =~ ^[a-z][a-z0-9_]{0,62}$ ]] || { echo 'Invalid database role identifier.' >&2; exit 1; }
done
[[ "$MIGRATION_DB_USER" != "$APP_DB_USER" && "$MIGRATION_DB_USER" != "$PGUSER" && "$APP_DB_USER" != "$PGUSER" ]] || { echo 'Bootstrap, migration and app identities must differ.' >&2; exit 1; }
: "${MIGRATION_DB_PASSWORD:?Separate migration password required}"
: "${APP_DB_PASSWORD:?Separate application password required}"
[[ "$MIGRATION_DB_PASSWORD" != "$APP_DB_PASSWORD" && "$MIGRATION_DB_PASSWORD" != "$PGPASSWORD" && "$APP_DB_PASSWORD" != "$PGPASSWORD" ]] || { echo 'Database passwords must be distinct.' >&2; exit 1; }
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
-- Avoid logging secret-bearing DDL on an error in this administrative session.
SET log_min_error_statement = 'panic';
SET password_encryption = 'scram-sha-256';
\getenv migration_user MIGRATION_DB_USER
\getenv migration_password MIGRATION_DB_PASSWORD
\getenv app_user APP_DB_USER
\getenv app_password APP_DB_PASSWORD
BEGIN;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD %L', :'migration_user', :'migration_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'migration_user') \gexec
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec
SELECT (count(*) = 2 AND bool_and(NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls)) AS safe_roles
FROM pg_roles WHERE rolname IN (:'migration_user', :'app_user') \gset
\if :safe_roles
\else
  \echo 'Existing roles have unexpected privileges; no privilege changes applied.'
  \quit 1
\endif
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database()) \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I, %I', current_database(), :'migration_user', :'app_user') \gexec
REVOKE ALL ON SCHEMA public FROM PUBLIC;
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'migration_user') \gexec
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_user') \gexec
COMMIT;
SQL
echo 'Development roles and approved extensions prepared; existing passwords were not rotated.'
