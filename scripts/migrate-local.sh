#!/usr/bin/env bash
set -euo pipefail
[[ "${APP_ENV:-}" == development ]] || { echo 'Local migrations restricted to development.' >&2; exit 1; }
exec /bin/bash /scripts/migrate.sh
