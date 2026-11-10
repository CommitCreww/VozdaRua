# Voz da Rua — Banco local

Bootstrap inicial do banco de desenvolvimento do Voz da Rua.

## Requisitos

- Docker Engine + Docker Compose, ou implementação compatível com Compose.
- Nenhuma instalação local de PostgreSQL é necessária.

## Primeira execução

```bash
cp .env.example .env
docker compose up -d db
docker compose run --rm migrate
```

## Verificar o banco

```bash
docker compose exec db psql -U vozrua -d voz_da_rua
```

Dentro do `psql`:

```sql
SELECT current_database(), current_user;
SELECT PostGIS_Version();
SELECT * FROM schema_migrations ORDER BY filename;
```

## Rodar novas migrations

Adicione um novo arquivo em `db/migrations/`, sempre usando prefixo numérico crescente:

```text
001_extensions.sql
002_project_metadata.sql
003_users.sql
004_categories.sql
...
```

Depois execute:

```bash
docker compose run --rm migrate
```

Migrations já aplicadas são ignoradas.

## Reset completo do banco local

> Atenção: apaga somente o banco local/volume de desenvolvimento.

```bash
docker compose down -v
docker compose up -d db
docker compose run --rm migrate
```

## Regra do projeto

Nunca altere uma migration que já tenha sido aplicada e compartilhada com a equipe.

Para qualquer mudança de schema, crie uma nova migration.

Isso mantém o ambiente reproduzível entre todos os desenvolvedores.
