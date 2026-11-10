#!/usr/bin/env bash
set -euo pipefail

echo "Aguardando PostgreSQL..."

until pg_isready -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" >/dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL disponível."

psql \
  -v ON_ERROR_STOP=1 \
  -c "
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  "

shopt -s nullglob
migration_files=(/migrations/*.sql)

if [ ${#migration_files[@]} -eq 0 ]; then
  echo "Nenhuma migration encontrada."
  exit 0
fi

for file in "${migration_files[@]}"; do
  filename="$(basename "$file")"

  already_applied="$(
    psql -tA \
      -v ON_ERROR_STOP=1 \
      -v migration_name="$filename" \
      -c "SELECT EXISTS (
            SELECT 1
            FROM schema_migrations
            WHERE filename = :'migration_name'
          );"
  )"

  if [ "$already_applied" = "t" ]; then
    echo "SKIP  $filename"
    continue
  fi

  echo "APPLY $filename"

  psql \
    -v ON_ERROR_STOP=1 \
    -1 \
    -v migration_name="$filename" \
    -f "$file" \
    -c "INSERT INTO schema_migrations (filename)
        VALUES (:'migration_name');"

  echo "OK    $filename"
done

echo "Migrations concluídas."
