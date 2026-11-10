#!/usr/bin/env bash
set -euo pipefail

echo "Aguardando PostgreSQL..."

until pg_isready \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" >/dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL disponível."
echo "Aplicando seed de desenvolvimento..."

shopt -s nullglob
seed_files=(/seeds/*.sql)

if [ ${#seed_files[@]} -eq 0 ]; then
  echo "Nenhum seed encontrado."
  exit 0
fi

for file in "${seed_files[@]}"; do
  echo "SEED  $(basename "$file")"

  psql \
    -v ON_ERROR_STOP=1 \
    -f "$file"

  echo "OK    $(basename "$file")"
done

echo "Seed de desenvolvimento concluído."
