#!/usr/bin/env bash
set -euo pipefail
[[ "${APP_ENV:-}" == development && "${ALLOW_DEV_SEED:-}" == true ]] || { echo 'Seed requires APP_ENV=development and ALLOW_DEV_SEED=true.' >&2; exit 1; }
scope="$(psql -X -tA -v ON_ERROR_STOP=1 -c "SELECT value FROM project_metadata WHERE key = 'database_scope'")"
[[ "$scope" == development ]] || { echo 'Database is not marked as development; seed denied.' >&2; exit 1; }
exec /bin/bash /scripts/seed-dev.sh
