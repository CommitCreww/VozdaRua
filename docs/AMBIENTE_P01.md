# Ambiente de desenvolvimento — P01

**12/11/2026 — execução parcial; conclusão bloqueada por segurança/storage.** Atividades independentes executadas e testadas. Nenhuma API, autenticação ou atividade P02 implementada. Fontes aprovadas e migrations 001–017 preservadas.

## Versões efetivamente verificadas

| Componente | Versão / origem |
|---|---|
| Node portátil | 26.13.1 LTS; ZIP oficial conferido com SHASUMS256 |
| npm portátil | 11.20.0, incluído no ZIP Node |
| Node global anterior | 24.11.0, não alterado |
| Docker Desktop / Engine | 4.61.0 / 29.2.1, Linux amd64 |
| Compose | v5.0.2 |
| PostgreSQL | 17.11 (Debian 17.11-1.pgdg13+2) |
| PostGIS / pgcrypto | 3.6.4 / 1.3 |
| Mailpit | 1.33.1 |
| Gitleaks portátil | 8.30.1, release/checksum oficiais; sem instalação global |
| Scanner complementar instalado | Docker Scout 1.19.0; não substitui Trivy/CI de P03 |

Imagens usadas com tags e digests fixados em `compose.yml`, inspecionados no registry oficial. A imagem PostgreSQL/PostGIS já estava disponível localmente. Nenhuma troca para PostGIS 3.7 foi feita.

Fontes: [manifesto Node](https://nodejs.org/dist/index.json), [checksums Node](https://nodejs.org/dist/v26.13.1/SHASUMS256.txt), [PostGIS Docker](https://github.com/postgis/docker-postgis), [Mailpit Docker](https://mailpit.axllent.org/docs/install/docker/), [Mailpit health](https://mailpit.axllent.org/docs/integration/healthcheck/), [Gitleaks](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1).

## Configuração e arquivos

- `.node-version` fixa a versão. `setup-node.ps1` baixa/verifica o ZIP em `.tools`; `node-local.ps1`/`npm-local.ps1` usam essa cópia. npm ajusta somente o PATH do próprio processo e o restaura. Nenhuma instalação global, registro, execution policy ou PATH permanente alterado.
- `create-dev-env.ps1` cria `.env.p01.local` com três senhas CSPRNG distintas, sem imprimir valores ou sobrescrever arquivo existente. `.env` original preservado; `.tools`, `.local` e ambientes reais ignorados.
- Compose mantém a key do volume antigo e elimina nomes fixos de container para permitir isolamento. Todos os testes usam `--env-file .env.p01.local -p voz-da-rua-p01`; seus volumes têm esse prefixo e são distintos dos anteriores.
- Portas novas somente em `127.0.0.1`: PostgreSQL 15433, Mailpit UI 18025 e SMTP 11025. Rede bridge permite respostas aos clientes locais no Docker Desktop. Sem relay/forward no Mailpit; somente endereços `example.invalid` usados nos testes.
- Mailpit roda com UID/GID 1000, capabilities removidas, raiz readonly e tmpfs `/tmp`. Initializer sem rede prepara apenas a propriedade do seu volume. Nenhum container novo privileged ou com Docker socket.
- `db-bootstrap.sh` prepara extensões aprovadas e roles operacionais, sem tabela/campo de domínio novo. Bootstrap privilegiado separado do migrator não superusuário e do app. `migrate-local.sh` chama o runner original sem alterá-lo.
- `db-grants.sh` usa allowlist da baseline. App sem DDL/TEMP, sem escrita no ledger/status/metadata ou tabelas internas PostGIS; auditoria apenas SELECT/INSERT; parâmetros SELECT/UPDATE. Grants de novas tabelas deverão acompanhar a migration/módulo correspondente.
- `seed-dev-local.sh` exige ambiente development, `ALLOW_DEV_SEED=true` e marcador development no banco. Profile separado impede seed automático. O seed e runner originais foram preservados.
- `compose.storage.yml` contém MinIO opcional/persistente, com imagem/credenciais obrigatórias e sem imagem padrão insegura. Não iniciado: bucket privado, usuário restrito, conectividade e persistência de objetos continuam bloqueados pela escolha da distribuição/imagem.

## Reprodução após resolver os gates de imagem

**Não reativar imagens com findings bloqueantes sem remediação/revisão do gate.** Os comandos descrevem a reprodução testada, não autorização para ignorar findings.

```powershell
.\scripts\setup-node.ps1
.\scripts\node-local.ps1 --version
.\scripts\npm-local.ps1 --version
# Somente se ainda não existir; não copiar por cima de .env.
.\scripts\create-dev-env.ps1
docker compose --env-file .env.p01.local -p voz-da-rua-p01 config --quiet
docker compose --env-file .env.p01.local -p voz-da-rua-p01 up -d --wait db mailpit
docker compose --env-file .env.p01.local -p voz-da-rua-p01 run --rm db-bootstrap
docker compose --env-file .env.p01.local -p voz-da-rua-p01 run --rm migrate
docker compose --env-file .env.p01.local -p voz-da-rua-p01 run --rm db-grants
.\scripts\verify-p01.ps1
# Para parar preservando dados/containers/volumes:
docker compose --env-file .env.p01.local -p voz-da-rua-p01 stop db mailpit
```

Não executar `down -v`, prune, reset ou seed contra ambientes anteriores. Usar o env novo explicitamente: o antigo não contém as credenciais separadas. Não imprimir `docker compose config` completo, pois revela valores interpolados; usar `--quiet`. O overlay storage só será usado explicitamente com `-f compose.yml -f compose.storage.yml` após imagem e credenciais revisadas.

## Evidências de testes

`verify-p01.ps1` concluiu **24 checks PASS**: config; inicialização; 17 migrations; PostgreSQL 17/PostGIS 3.6/pgcrypto; consulta espacial real; 17 SKIP/zero APPLY na repetição; app sem privilégios elevados/DDL/TEMP; tabelas protegidas; DML com rollback; negação real de CREATE TABLE; migration inválida com rollback/parada e sem ledger de sucesso; seed recusado em produção/por padrão e idempotente em dev; SMTP capturado; banco/e-mail preservados após reinício; serviços saudáveis após reinício.

A primeira aplicação foi em banco limpo. Fixtures de falha ficam apenas em `.local/p01-failure`, montadas no lugar das migrations em um container de teste. Nenhuma migration histórica editada. O [inventário físico](database/INVENTARIO_P01.md) registra 27 tabelas do migrator (incluindo ledger/metadados), duas views, campos, constraints e índices reais.

Verificações adicionais: PostgreSQL/SMTP alcançáveis pelo host em loopback, UID Mailpit 1000, readonly/sem capabilities, portas locais/sem privileged/socket, storage recusando configuração ausente e Gitleaks sobre snapshot dos candidatos ao Git. Relatórios ignorados: `.local/p01-validation.json`, `p01-schema.json`, `p01-gitleaks.json`, `p01-postgis-scout.json` e `p01-mailpit-scout.json`.

**Estado final:** db e mailpit da P01 parados com saída 0 por gate de segurança; volumes/dados preservados. Os testes passaram antes dessa parada preventiva. Docker Desktop continua iniciado. Nenhuma operação de dados/recriação dirigida ao banco anterior; seu volume original permanece distinto. O mapeamento legado `0.0.0.0:5433` foi observado e não alterado em runtime: esta entrega não certifica a segurança dos demais serviços preexistentes do host.

## Bloqueios de segurança

| Parte | Evidência | Ação pendente |
|---|---|---|
| Imagem PostgreSQL/PostGIS | Scout: **57 findings: 6 Critical e 51 High**, 380 pacotes indexados; tag 17-3.6 sem novas atualizações segundo upstream | Remediar/produzir build revisado mantendo PostgreSQL 17/PostGIS 3.6, repetir scans e testes. Sem troca silenciosa para 3.7 |
| Imagem Mailpit | Scout: **2 High**, 78 pacotes indexados | Build corrigido e novo scan; tag mais recente não basta para aprovação |
| MinIO | Comunidade arquivada/sem manutenção; advisory oficial High GHSA-hv4r-mvr4-25vw afeta releases comunitários e indica correção em AIStor | Decisão técnica sobre distribuição/origem corrigida e mantida, compatibilidade/licença e imagem revisada. Não trocar por AIStor/fork/outro storage por inferência |
| Storage funcional | Não iniciado/testado | Provisionar bucket privado e usuário restrito; testar objetos/conectividade/persistência após decisão anterior |
| Merge/CI | Sem commit/push; revisão humana pendente; Trivy/CI não executados | Respeitar gate das decisões técnicas. Scout é evidência complementar |

Findings exigem triagem de aplicabilidade; não foram convertidos automaticamente em falsos positivos/exceções. Critical bloqueia, High bloqueia por padrão. Critical PostGIS: CVE-2026-78663, CVE-2026-39821, CVE-2026-56857, CVE-2026-85746, CVE-2026-92262, CVE-2025-68121. High Mailpit: CVE-2023-42821 e CVE-2026-107891. Loopback não foi tratado como dispensa do gate.

Fontes MinIO: [estado do projeto](https://github.com/minio/minio) e [advisory High](https://github.com/minio/minio/security/advisories/GHSA-hv4r-mvr4-25vw). Relatórios complementares reproduzíveis sem subir serviços: `docker scout cves --only-severity critical,high --format sarif --output <arquivo-local> <imagem@digest>`, usando os digests do Compose.

### Security Gate aplicável

| SEC | Estado |
|---|---|
| 061–062 | PASS nos candidatos inspecionados: ambientes/secrets fora do Git; Gitleaks sem achados. Histórico completo não auditado |
| 063 | N/A: implantação CI pertence a P03 |
| 081–082 | Origem verificada; seleção MinIO BLOQUEADA, sem instalar substituto |
| 083–086 | N/A: nenhuma dependência npm de aplicação ou Action criada |
| 087 | **FAIL:** findings de imagem bloqueantes, sem aprovação de merge/produção |
| 088 | Comandos/scripts/checksums revisados; sem instalação global ou execução de script remoto por pipe |
| 089 | PENDENTE de revisão humana reforçada; artefatos/relatórios disponíveis |
| 108–109 | PASS: identidades separadas; app não superusuário e sem DDL/TEMP; migrator próprio |
| 110 | BLOQUEADO: credencial MinIO restrita não provisionada |
| 111–113 | Configuração local verificada: sem privileged/socket, Mailpit sem root/readonly, portas loopback; sem auditoria dos serviços antigos do host |
| 120/122/124/125 | Testes reais de infraestrutura/SQL e falhas reproduzidas/retestadas; não substituem revisão humana |
| Demais | N/A para APIs/auth/domínio/frontend/produção novos; requisitos futuros não declarados implementados |

**P01 parcialmente executada; conclusão bloqueada por storage e imagens. Próxima fase prevista: P02, não autorizada nem iniciada.**


## 12/11/2026 - Delimitacao dos bloqueios P01

Revisados os 59 findings originais e verificadas atualizacoes oficiais: tags continuam nos mesmos digests. Nenhuma correcao de runtime comprovada; sem supressao, mudanca de versao principal, dados ou P02. Matriz individual e alternativas MinIO em [REMEDIACAO_P01.md](REMEDIACAO_P01.md). Relatorios anteriores preservados; novos scans em .local/p01-remediation-*.json. Testes funcionais/persistencia nao reexecutados nesta delimitacao sem alteracao das imagens; os 24 PASS anteriores permanecem historicos. P01 continua parcialmente concluida, com remediacao/build e validacao ainda pendentes.

## 12/11/2026 - Estado operacional apos triagem final

- Imagens principais em `compose.yml` **inalteradas** nesta verificacao. Candidato PostgreSQL/PostGIS `sha256:b428b8d42cdc28321f0dce4a9fbccd4f306f8da07aa4e5dd26b188a1d47123f1`: PostgreSQL 17.12, PostGIS 3.6.4, pgcrypto 1.3, 24/24 checks funcionais anteriores em projeto isolado; Scout ainda 2 Critical/18 High. Candidato Mailpit `sha256:5c1b59bd9a10ba92a99da9aebee572d95ade9d798889ba045af6e9f9d6c4a811`: v1.33.1/Go 1.27.3, 1 High reportado tecnicamente nao aplicavel com evidencias em REMEDIACAO. Nenhum candidato promovido.
- A consulta read-only no banco isolado confirmou `pgcrypto,plpgsql,postgis` e funcao `ST_GeomFromGML(text)` executavel pelo papel app; `postgis_raster` nao habilitada. Container de banco foi parado novamente, sem excluir dados. Volumes P01 e de experimentos preservados.
- AIStor Free: nenhuma licenca legitima localizada no projeto/variaveis verificadas. Manifesto remoto corrigido `quay.io/minio/aistor/minio:RELEASE.2026-04-11T03-20-12Z` existe, mas nenhuma imagem baixada ou servico instalado. Docker local: 16 CPUs, 8.277.319.680 bytes (~7,71 GiB), kernel 6.18.58.1. A PoC de bucket/upload/download/exclusao/persistencia/scan **nao foi executada** por falta da licenca. Nenhuma credencial de teste gerada para AIStor.
- Criterios operacionais pendentes: MinIO privado/credencial restrita e S3 funcional, triagem/promocao da imagem de banco, revisao humana de findings. Estado completo em [REMEDIACAO_P01.md](REMEDIACAO_P01.md). P01 parcial; P02 nao iniciada.
