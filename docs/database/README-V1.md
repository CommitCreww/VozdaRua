# Voz da Rua — Database v1

Schema inicial completo do Voz da Rua.

## Ordem

As migrations são aplicadas pelo nome do arquivo:

```text
001_extensions.sql
002_project_metadata.sql
003_users.sql
004_auth_identities.sql
005_reference_data.sql
006_occurrences.sql
007_occurrence_cycles.sql
008_reports.sql
009_evidence_and_history.sql
010_moderation.sql
011_resolution_and_reopening.sql
012_forwarding.sql
013_social.sql
014_notifications.sql
015_audit.sql
016_system_parameters.sql
017_views.sql
```

## Regra de equipe

**Nunca altere uma migration já aplicada e compartilhada.**

Mudanças futuras devem criar novas migrations:

```text
018_...
019_...
020_...
```

## Aplicar

Na raiz do repositório:

```bash
docker compose run --rm migrate
```

## Conferir

```sql
SELECT filename, applied_at
FROM schema_migrations
ORDER BY filename;
```

## Testar PostGIS

```sql
SELECT PostGIS_Version();
```

## Reset local

Somente para desenvolvimento local:

```bash
docker compose down -v
docker compose up -d db
docker compose run --rm migrate
```

## Observações importantes

- A localização persistida é a localização da ocorrência.
- A localização atual do cidadão é usada para validar proximidade, mas não precisa ser persistida continuamente.
- A distância máxima inicial de 3 km está em `parametros_sistema`.
- O banco guarda a distância validada em ações como relato/voto, sem exigir o armazenamento da coordenada atual do usuário.
- Uma denúncia inicial exige uma foto na regra de aplicação. O banco permite no máximo uma evidência ativa por relato.
- Somente uma evidência pode estar marcada como pública por ocorrência.
- Um usuário só pode possuir um relato ativo por ciclo.
- Um usuário só pode votar uma vez pela resolução de um ciclo.
- Uma sinalização de reabertura por usuário/ciclo resolvido é única.
- Posts sociais e relatos de ocorrência são domínios separados.
