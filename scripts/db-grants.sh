#!/usr/bin/env bash
set -euo pipefail
[[ "${APP_ENV:-}" == development ]] || { echo 'Grants restricted to development.' >&2; exit 1; }
[[ "${APP_DB_USER:-}" =~ ^[a-z][a-z0-9_]{0,62}$ ]] || exit 1
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
\getenv app_user APP_DB_USER
BEGIN;
-- Explicit baseline allowlist, excluding PostGIS/system tables and future tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  usuarios, identidades_auth, ocorrencias, ocorrencia_ciclos, relatos,
  evidencias, historico_status, acoes_moderacao, denuncias_ocorrencia,
  ocorrencias_duplicadas, alertas_moderacao, votos_resolucao,
  sinalizacoes_reabertura, posts, comentarios, curtidas_posts, seguidores,
  notificacoes TO :"app_user";
GRANT SELECT, INSERT, UPDATE ON categorias_ocorrencia, orgaos_responsaveis,
  canais_denuncia, categoria_canais TO :"app_user";
GRANT SELECT, INSERT ON logs_auditoria TO :"app_user";
GRANT SELECT, UPDATE ON parametros_sistema TO :"app_user";
GRANT SELECT ON status_ocorrencia, project_metadata, schema_migrations,
  vw_ocorrencias_resumo, vw_usuarios_publicos TO :"app_user";
COMMIT;
SQL
echo 'Application baseline privileges granted; no schema creation or migration writes permitted.'
