#!/usr/bin/env bash
set -euo pipefail
[[ "${APP_ENV:-}" == development ]] || { echo 'Auth grants restricted to development.' >&2; exit 1; }
[[ "${APP_DB_USER:-}" =~ ^[a-z][a-z0-9_]{0,62}$ ]] || exit 1
# Separate opt-in administrative step after migrations 018–020, never app startup.
# No default privileges, DDL, DELETE or rights on the migration ledger.
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
\getenv app_user APP_DB_USER
BEGIN;
GRANT SELECT, INSERT, UPDATE ON tokens_conta, sessoes TO :"app_user";
GRANT SELECT, INSERT ON aceites_legais TO :"app_user";
COMMIT;
SQL
echo 'Auth application privileges granted.'
