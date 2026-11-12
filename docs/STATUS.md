# Status — Voz da Rua

**12/11/2026:** `docs/PLANO.md` versão 1.0 gerado, com 34 fases e matriz de rastreabilidade do FSD. **Aguardando aprovação explícita do plano.** Nenhuma fase de implementação iniciada nesta execução.

## 12/11/2026 — P00 concluída com ressalvas documentadas

**Autorização posterior ao registro acima:** o usuário aprovou expressamente **somente P00**, com ressalvas, e autorizou sua execução integral. O cabeçalho histórico do PLANO foi preservado; não representa revogação dessa autorização nem autorização das outras fases.

**Situação atual:** P00 concluída no escopo de documentação, estrutura e configuração Git. **P01 não iniciada.** Nenhuma funcionalidade, dependência, migration nova, serviço ou pipeline implementado/executado.

### Atividades concluídas

- AGENTS preenchido com fontes obrigatórias, stack/camadas, convenções documentadas, segurança, testes por feature, versionamento e atualização obrigatória de STATUS/ERROS.
- Criadas 21 pastas com `.gitkeep`: 12 camadas do backend, backend/tests e oito pastas do frontend conforme FSD §5.3. Sem arquivos executáveis ou manifests antecipados.
- `.gitignore` ampliado para dependências/build/testes, chaves privadas, secrets e dados/backups locais; exemplos, SQL e lockfiles permanecem elegíveis ao Git.
- `.gitattributes` criado com LF para scripts/fontes/configuração e tratamento binário de assets; sem renormalizar arquivos históricos.
- `.env.example` revisado, mantendo nomes existentes e removendo senha pronta; `.env` real preservado, sem copiar/sobrescrever nem exibir valores.
- README recebeu aviso de preparação e links atuais; conteúdo original integral preservado após o aviso.
- [PREPARACAO.md](PREPARACAO.md) registra caminhos reais, estrutura, origem das fontes, limites e Security Gate aplicável. Problemas e tratamentos registrados em [ERROS.md](ERROS.md).

### Verificações executadas

| Verificação | Resultado |
|---|---|
| Documentos necessários | PASS: PRD/FSD/Design localizados em subpastas; links novos em AGENTS/PREPARACAO válidos |
| Estrutura mínima | PASS: 21 diretórios esperados, cada um somente com `.gitkeep`; nenhum código/manifests nos apps |
| Integridade das fontes e baseline | PASS: SHA-256 inalterado em 27 arquivos: sete fontes documentais, Compose, 17 migrations e dois runners |
| Ambiente local e README | PASS: `.env` idêntico; conteúdo original do README idêntico após o aviso adicionado |
| Proteção de arquivos sensíveis/artefatos | PASS: 15 caminhos representativos ignorados, incluindo `.env` raiz/subpastas, chaves, dados, dumps e resultados de testes |
| Arquivos que devem ser versionáveis | PASS: 28 caminhos representativos não ignorados, incluindo exemplos de ambiente, lockfiles futuros, migration/seed e placeholders |
| Atributos de arquivo | PASS: `git check-attr` confirma LF nos runners/fontes/SQL; PNG sem transformação de texto/diff/merge |
| Git | PASS: repositório existente, estado revisado e `git diff --check` sem erros; nenhum stage/commit/push/reset/clean/config global executado |
| Segredos — inspeção local limitada | PASS no método aplicado: 62 arquivos candidatos/rastreados, 60 textuais, zero achados por padrões de tokens/chaves/URL credenciada e comparação com valores sensíveis do `.env`; nenhum `.env` real/chave privada/dump rastreado |
| Gitleaks/Trivy especializados | NÃO EXECUTADOS: não encontrados no PATH. Inspeção local não substitui esses scanners, CI ou auditoria completa do histórico |
| Testes de aplicação/build/HTTP/banco/E2E/DAST | N/A: nenhuma alteração de comportamento executável, manifesto npm ou migration nesta entrega; verificações de configuração realizadas acima |

Critérios da P00 atendidos: fontes acessíveis, regras de AGENTS rastreáveis, ambiente real fora do índice, exemplo sem segredo, estrutura alinhada, PLANO preservado e ausência de funcionalidades antecipadas. Zero segredo detectado no conjunto inspecionado; isso não é garantia universal nem auditoria de histórico/remotos. Revisão humana reforçada antes de merge/release continua exigível; não foi declarada concluída por esta entrega.

### Pendências remanescentes

- Dois links antigos em PLANO/Home ainda apontam para `Desing-rules.md`; o caminho real `frontend/Desing.md` consta no guia e AGENTS. Os documentos aprovados não foram editados, conforme instrução desta execução.
- Ajuste de dependência implícita P26/P32 e divergência de precedência documental continuam registrados para tratamento autorizado antes da parte afetada.
- Node local 24.11.0: preparar Node 26 aprovado em P01, sem alterar a stack. MinIO/Mailpit/credenciais de menor privilégio e baseline executada também pertencem a P01.
- D03–D15 do PLANO permanecem com seus gates; não foram aprovados por inferência store/TTL, política de senha/tokens, transporte Postmark, UX/legais, criação administrativa ou unfollow. D12 tem regra definida no FSD; política/TLS em D10 já têm definições expressas, distinguindo ferramenta operacional ainda aberta.
- Scanners especializados/CI em suas fases; histórico completo e acessos externos não auditados nesta P00.

**Próxima fase prevista:** P01 — Desenvolvimento e baseline do banco, somente após autorização explícita. Execução encerrada na P00.

## 12/11/2026 — P01 autorizada e parcialmente executada

**Autorização:** execução integral de P01 concedida expressamente pelo usuário após P00. **Situação atual: P01 PARCIAL, conclusão BLOQUEADA por segurança das imagens e distribuição MinIO. P02 não autorizada/não iniciada.** Os registros anteriores permanecem como histórico.

### Implementação realizada

- Node **26.13.1 LTS** e npm **11.20.0** portáteis em `.tools`, com SHA-256 conferido na origem oficial. `.node-version`, setup e wrappers locais criados; Node global **24.11.0** e configurações do sistema preservados. Nenhuma dependência TypeScript/Fastify/pg instalada: fundação da aplicação é P02.
- Docker Desktop instalado foi iniciado; Engine **29.2.1**, Desktop **4.61.0**, Compose **v5.0.2** verificados. Containers antigos com restart policy puderam iniciar junto do daemon; não foram reconfigurados nem usados para migrations/seed.
- Compose local com PostgreSQL/PostGIS e Mailpit, imagens fixadas por digest, healthchecks, volumes próprios, serviços auxiliares de bootstrap/migration/grants/app-check, portas somente loopback e seed separado por profile/guards.
- Ambiente `.env.p01.local` novo/ignorado, com senhas CSPRNG independentes. `.env` anterior preservado. Projeto e volumes de teste isolados por `-p voz-da-rua-p01`.
- Roles de bootstrap, migrator não superusuário e app separados. App sem DDL/TEMP, sem escrita no ledger/status/metadados/PostGIS interno e sem UPDATE/DELETE de auditoria. Nenhuma tabela/campo de domínio novo.
- Baseline **001–017 aplicada em banco limpo**, reexecutada sem reaplicação, schema físico inspecionado e seed original dev testado sem duplicação de contagens.
- Mailpit **1.33.1** com processo UID 1000, filesystem readonly, capabilities removidas e initializer de volume sem rede. E-mail somente local, sem relay.
- Overlay MinIO preparado sem imagem padrão; ativação bloqueada por configuração obrigatória. MinIO não substituído nem iniciado.

Arquivos criados: `.node-version`, `compose.storage.yml`, `scripts/{setup-node,node-local,npm-local,create-dev-env,verify-p01}.ps1`, `scripts/{db-bootstrap,db-grants,migrate-local,seed-dev-local}.sh`, `scripts/check-mailpit.mjs`, [AMBIENTE_P01.md](AMBIENTE_P01.md) e [inventário físico](database/INVENTARIO_P01.md). Modificados: `compose.yml`, `.env.example`, `.gitignore`, README, STATUS e ERROS. Runtimes/credenciais/relatórios privados em caminhos ignorados.

### Testes e evidências

| Verificação | Resultado efetivamente observado |
|---|---|
| Runtime portátil | PASS: Node 26.13.1 / npm 11.20.0 executados; checksum oficial verificado; sem instalação global |
| Compose/init/saúde | PASS durante testes: PostgreSQL e Mailpit saudáveis no projeto P01 |
| Banco/extensões | PASS: PostgreSQL **17.11**, PostGIS **3.6.4**, pgcrypto **1.3**, consulta espacial real |
| Baseline/migrations | PASS: 17 aplicadas em banco limpo; segunda execução 17 SKIP/zero APPLY; falha intencional fez rollback, não registrou sucesso e impediu migration seguinte |
| Menor privilégio | PASS: login real do app, DML aprovado com rollback, CREATE TABLE realmente negado, ausência de DDL/TEMP e proteção das tabelas sensíveis |
| Seed | PASS: recusado com produção e sem opt-in; permitido só dev com marcador; repetição sem duplicar contagens |
| Mailpit e rede | PASS: SMTP do host capturado localmente e localizado via API; PostgreSQL host TCP acessível; portas novas em 127.0.0.1 |
| Persistência | PASS: dados SQL e mensagem de e-mail mantidos após reiniciar db/mailpit; volume SQL também preservado na recriação isolada que corrigiu alias DNS |
| Teste automatizado | **24 checks PASS** em `scripts/verify-p01.ps1`; relatório em `.local/p01-validation.json` |
| Inventário | PASS: 27 tabelas pertencentes ao migrator (incluindo ledger/metadados) e duas views da aplicação; colunas/constraints/índices extraídos do banco real |
| Segredos | Gitleaks portátil **8.30.1** executado com `--redact` sobre snapshot dos **76 candidatos ao Git**, sem ambientes privados/binários ignorados; nenhum segredo encontrado. Sem auditoria completa do histórico |
| Integridade/escopo | PASS: SHA-256 dos **28 arquivos protegidos** inalterado, incluindo documentos aprovados/AGENTS/PREPARACAO, `.env`, migrations, runners e seed; nenhum arquivo de aplicação adicionado e nenhum caminho privado candidato ao Git |
| Qualidade estática | PASS: parser PowerShell, `bash -n` em scripts shell, `node --check` no teste SMTP, links locais do guia/AGENTS e `git diff --check`; índice Git sem arquivos staged |
| Imagem PostGIS — segurança | **FAIL:** Docker Scout reportou **6 Critical + 51 High** (57 findings), sem exceção/triagem aprovada |
| Imagem Mailpit — segurança | **FAIL:** Docker Scout reportou **2 High**, sem exceção/triagem aprovada |
| MinIO | **BLOQUEADO/NÃO TESTADO:** escolha de distribuição/imagem corrigida e mantida; sem bucket/credencial restrita/testes de objetos |
| Trivy / CI / produção / testes de API | NÃO EXECUTADOS: Scout é complementar; nenhuma implantação CI ou API/P02/produção nesta fase |

Os serviços novos **foram parados preventivamente com exit 0 após os testes** devido ao gate das imagens. Containers/volumes/dados mantidos; nenhum reset, prune ou `down -v`. Nenhuma operação de dados no banco anterior. Seu mapeamento legado 0.0.0.0:5433 foi observado, sem mudança em runtime; a configuração nova da P01 usa loopback. Gitleaks/relatórios não equivalem a aprovação de todo o host.

### Pendências que impedem concluir P01

1. **Imagens com findings bloqueantes:** remediar e validar builds mantendo PostgreSQL 17/PostGIS 3.6 e Mailpit; repetir scans/testes. Não ignorar Critical, nem High sem exceção formal. Tag PostGIS 17-3.6 está sem novas atualizações segundo upstream; não substituir por 3.7 silenciosamente.
2. **MinIO comunitário:** repositório oficial arquivado/sem manutenção e advisory High GHSA-hv4r-mvr4-25vw afeta releases comunitários, indicando correção em AIStor. Exige decisão técnica de distribuição/origem e revisão de imagem/licença; não foi adotado produto/edição/fork alternativo automaticamente. Após decisão, concluir bucket privado, credencial restrita, conectividade e persistência do storage.
3. Revisão humana reforçada de infraestrutura e gates de scanner/CI aplicáveis antes de merge. Docker Scout não substitui os scanners aprovados de P03. Sem commit/push.

Ressalvas documentais D01–D15, incluindo links antigos e P26/P32, preservadas sem edição de especificações. D13 (Node local de projeto) atendida pela instalação portátil; Node global permanece intacto. Manual e evidências adicionais em [AMBIENTE_P01](AMBIENTE_P01.md).

**Próxima fase definida no plano: P02 — Fundação Fastify e testes base. Não iniciada; não liberar como se P01 estivesse concluída.**


## 12/11/2026 - Delimitacao dos bloqueios P01

Revisados os 59 findings originais e verificadas atualizacoes oficiais: tags continuam nos mesmos digests. Nenhuma correcao de runtime comprovada; sem supressao, mudanca de versao principal, dados ou P02. Matriz individual e alternativas MinIO em [REMEDIACAO_P01.md](REMEDIACAO_P01.md). Relatorios anteriores preservados; novos scans em .local/p01-remediation-*.json. Testes funcionais/persistencia nao reexecutados nesta delimitacao sem alteracao das imagens; os 24 PASS anteriores permanecem historicos. P01 continua parcialmente concluida, com remediacao/build e validacao ainda pendentes.

## 12/11/2026 - Remediacao tecnica experimental P01

- Criadas imagens isoladas sem trocar `compose.yml`: PostgreSQL **17.12**/PostGIS **3.6.4** com pacotes atualizados e `gosu` 1.19 recompilado em Go **1.26.9**; Mailpit **1.33.1** estatico em `scratch` (Dockerfile versionavel em `infra/mailpit/Dockerfile`). Ajustado `scripts/verify-p01.ps1` para executar `compose run -T` e sem progresso interativo no PowerShell. Artefatos intermediarios de PostGIS permanecem apenas em `.local/` porque a imagem ainda nao passou pelo gate.
- Docker Scout: PostgreSQL/PostGIS **57 (6 Critical/51 High) -> 20 (2 Critical/18 High)** na imagem final experimental; Mailpit **2 High -> 1 High**. Nenhum finding suprimido. O finding residual Mailpit CVE-2023-42821 foi confrontado com Go Vuln DB e ancestralidade do commit corrigido; classificacao de falso positivo documentada, pendente revisao humana para promocao.
- Dois projetos Compose novos com volumes separados; a imagem PostgreSQL final achatada e o Mailpit experimental passaram **24/24 verificacoes** em banco descartavel: migrations, extensoes, PostGIS espacial, privilegios, seed, SMTP, restart/persistencia. Imagem Mailpit versionavel tambem passou smoke SMTP/API direto. Relatorios privados `.local/p01-validation-remediation-*.json`, SARIF em `.local/p01-*-scout.json`. Projetos experimentais parados, volumes preservados; P01 anterior nao alterado.
- Integridade: portas somente `127.0.0.1`; Git candidatos (78 arquivos) varridos com Gitleaks 8.30.1, zero achados; `.env.p01.local` e `.local/` ignorados; documentos aprovados e migrations intactos; `git diff --check` sem erros. Trivy nao executado nesta etapa. Nenhum commit, push, deploy ou P02.
- **Situacao: P01 permanece parcialmente concluida.** Banco com 20 findings sem resolucao/triagem formal, promocao Mailpit ainda pendente e MinIO sem distribuicao/licenca aprovada nem teste S3. [Evidencias, CVEs e recomendacao MinIO](REMEDIACAO_P01.md). P02 continua dependente e nao iniciada.

## 12/11/2026 - Verificacao final de prontidao P01

- Revisados **individualmente os 20 findings** da imagem PostgreSQL/PostGIS candidata com SARIF, `dpkg-query`, `ldd`, ausencia de binarios/servicos e consulta SQL no banco descartavel. Nove avisos MariaDB referem-se a funcoes do servidor ausente; seis krb5 referem-se a GSS-RPC/kadmind/KDC ausentes. Bibliotecas XML/Expat/Poppler permanecem presentes. O High **CVE-2026-86140** em libxml2 nao teve caminho de exploracao excluido: PostGIS liga a biblioteca e `ST_GeomFromGML(text)` e executavel pelo papel app. Nenhuma excecao ou supressao; imagem principal nao promovida.
- `go version -m` no binario da imagem Mailpit candidata confirmou modulo `gomarkdown/markdown` no commit `a51d70be185e`; comparacao oficial confirmou ancestralidade do fix de CVE-2023-42821. Finding classificado tecnicamente como nao aplicavel ao binario, mantendo SARIF original e candidato. Promocao/initializer ainda requerem revisao do gate.
- Pre-condicoes AIStor Free: manifesto remoto corrigido confirmado sem pull; Docker local 16 CPUs/~7,71 GiB/kernel WSL2 6.18.58.1. **Nenhuma licenca legitima localizada** no workspace ou nomes de variaveis de ambiente consultados. Por isso a PoC local autorizada nao foi iniciada; bucket, objeto, persistencia e scan AIStor nao testados. Licenca/uso Free em producao continuam sem aprovacao.
- Criterios P01 de banco, migrations, privilegios, seed, SMTP e persistencia seguem comprovados pelos **24/24 testes** anteriores em volumes isolados. Criterio **MinIO privado operante** nao atendido. Gate de imagem SEC-085/087 sem PASS pela libxml2 e triagem humana pendente; SEC-110 MinIO sem teste. Nenhum deploy, commit, push ou P02.
- **Resultado final: P01 parcialmente concluida.** Detalhes e tabela CVE por CVE em [REMEDIACAO_P01.md](REMEDIACAO_P01.md); inventario operacional em [AMBIENTE_P01.md](AMBIENTE_P01.md).

## 12/11/2026 - Desenvolvimento incremental autorizado: P02 categoria A

Autorizacao limitada do responsavel para atividades independentes dos bloqueios P01; **nao e aprovacao integral de P01 nem de P02**. Classificacao da P02 conforme PLANO item 4: **A** manifests/lockfile, TypeScript/tsc, Fastify app/server, configuracao local validada, request ID gerado no servidor, envelope de erro seguro, logs estruturados sem URL/payload, limite de body, CORS explicito e restritivo, `/health` e testes independentes do banco; **B** pool `pg`, repositories e `/ready` dependente de banco por interface/simulacao, que exigem autorizacao especifica; **C** integracao `pg` e Testcontainers com imagem PostgreSQL/PostGIS ainda bloqueada, validacao de readiness real e promocao/deploy, nao executadas.

Implementados apenas A em `backend/package.json`, `backend/package-lock.json`, `backend/tsconfig.json`, `backend/src/{config/index.ts,app.ts,server.ts}` e `backend/tests/foundation.test.ts`. Dependencias locais Fastify 5.12.8, @fastify/cors 11.4.2, TypeScript 7.0.2, Vitest 5.1.0, @types/node 26.6.6 no Node 26 portatil; nenhuma instalacao global. Nenhum endpoint de negocio, autenticacao, migration em startup, pool, `/ready` ou P03.

Validacao efetiva: **6/6 testes Vitest PASS** (`fastify.inject` para liveness, ID nao forjavel, CORS, 404, erro sem segredo/SQL/stack; listen/close real em loopback); typecheck e build `tsc` PASS; `npm audit --omit=dev --audit-level=high` **0 vulnerabilidades reportadas**. `git diff --check` PASS; `node_modules` e `dist` ignorados, lockfile candidato ao Git. Criterios de processo HTTP local, liveness, fechamento e configuracao invalida atendidos para A. Criterios P02 de readiness, banco real e integracao nao testados.

**Estado:** P01 parcial como registrado acima; P02 **parcial, somente A**. B aguarda autorizacao especifica; C aguarda resolucao dos bloqueios de imagens/MinIO. Sem commit, push, deploy ou P03.

## 12/11/2026 - P02 categoria B autorizada

- Adicionado `pg` 8.23.1 e tipos 8.23.1 ao backend com lockfile. Configuracao do banco exige `DB_HOST`, `POSTGRES_DB`, identidade e senha da aplicacao separadas das credenciais de bootstrap/migration; porta validada. Credenciais existem apenas em variaveis de ambiente.
- Criados `DatabasePort`, `SqlExecutor` e `PoolLike` para separar contratos de acesso SQL do pool. Pool limitado a 5 conexoes, timeout de conexao de 2 s e idle de 10 s. Consultas aceitam parametros; fechamento idempotente e vinculado ao shutdown Fastify. Nenhuma consulta ou migration e feita na inicializacao.
- `/ready` consulta a dependencia por abstracao injetavel (`SELECT 1`): HTTP 200 quando disponivel e HTTP 503 generico quando indisponivel. `/health` permanece independente. Logs e respostas do readiness nao incluem erro do driver, SQL nem credenciais.
- Arquivos: `backend/package.json`, `backend/package-lock.json`, `backend/src/config/database.ts`, `backend/src/repositories/database.ts`, `backend/src/app.ts`, `backend/src/server.ts`, `backend/tests/database.test.ts`.
- Validacao: typecheck PASS; build PASS; Vitest **12/12 PASS** (6 testes anteriores e 6 novos com pool simulado); `npm audit --omit=dev --audit-level=high` reportou **0 vulnerabilidades**. Testados configuracao invalida, inicio sem consulta, query parametrizada, readiness positiva/negativa, independencia de health e fechamento do pool. PostgreSQL real, Testcontainers e migrations em banco real **nao executados**, conforme limite da autorizacao.
- Controle de versao e segredos: `git diff --check` PASS; nada staged; `node_modules`, `dist`, `.env` e `.local` ignorados. Gitleaks 8.30.1 com redacao varreu `backend/src`, `backend/tests`, `backend/package.json` e `docs/STATUS.md`: **zero achados**. A varredura e limitada a esses caminhos, sem conclusao sobre todo o historico Git.
- **Estado:** P01 ainda parcial pelos gates de imagens e armazenamento S3. P02 **parcial, categorias A e B executadas**; integracao real e criterios completos de P02 permanecem bloqueados. Sem P03, deploy, commit ou push.

## 12/11/2026 - Checkpoint Git e continuidade

- Revisados arquivos modificados, novos e ignorados. O checkpoint inclui somente preparacao P00, ambiente/remediacao P01, fundacao P02 A/B e seus registros. Alteracao preexistente em `docs/FSD/FSD.md` e troca de `docs/frontend/Desing-rules.md` por `docs/frontend/Desing.md` ficam fora deste commit: documentos aprovados/visuais nao foram alterados por essas fases. O aviso de estado no README foi atualizado para refletir P02 parcial.
- Reexecutados typecheck, Vitest **12/12 PASS** e build do backend. `git diff --check` PASS; `.gitignore` protege `.env`, `.local`, `.tools`, volumes/dumps, `node_modules` e `dist`. Scanner de segredos sera aplicado ao indice exato antes do commit; nenhum push ou deploy.
- No indice preparado (58 arquivos), `git diff --cached --check` PASS e Gitleaks 8.30.1 `git --staged --redact` varreu ~359 KB sem achados. `git check-ignore` confirmou ambientes reais, artefatos e `.local` ignorados. `docker compose -f compose.yml --env-file .env.p01.local config --quiet` PASS; o overlay `compose.storage.yml` recusou a configuracao por `MINIO_IMAGE` ausente, bloqueio intencional ate a decisao de armazenamento.
- Continuidade classificada conforme PLANO, sem autorizar fase nova: **independente da infraestrutura bloqueada:** revisao de configuracao e contratos/testes sem banco, preparacao local dos arquivos de CI da P03 apos autorizacao e resolucao das pendencias documentais; **mediante simulacoes:** testes de contratos HTTP/erro e cenarios negativos do backend, sem alegar integracao; **integracao real:** teste `pg`/Testcontainers e readiness real da P02, migrations e repositories futuros, MinIO/S3 e gates de staging/producao. P03 tem dependencia formal de P02 e nao foi iniciada; nenhuma fase posterior foi liberada por esta classificacao.
- P01 e P02 permanecem parciais. Imagem PG/PostGIS com finding High potencialmente aplicavel, revisao do candidato Mailpit e decisao/licenca MinIO continuam bloqueios registrados.
- Checkpoint local criado em `621df52807d68e1b0d7b689d5f30818a3ea2ee4c` (58 arquivos). O unico arquivo modificado fora do checkpoint e `docs/FSD/FSD.md`, alteracao anterior preservada e nao preparada; sem push. Este registro documental posterior nao altera o conteudo do checkpoint.

## 12/11/2026 - Trabalho preparatorio antecipado P14: assinatura de imagens

- Implementada triagem pura de magic bytes para JPEG, PNG e WebP, conforme FSD 17 e PLANO P14. Arquivos novos: `backend/src/integrations/images/signature.ts` e `backend/tests/image-signature.test.ts`. A funcao retorna somente MIME candidato ou `null`; nao usa extensao/MIME informado pelo cliente, banco ou MinIO.
- Typecheck PASS, Vitest **21/21 PASS**, build PASS e `npm audit --omit=dev --audit-level=high` com zero vulnerabilidades reportadas. Casos de assinatura permitida, truncada, SVG e HEIC sinteticos testados. Nao foram usados dados pessoais nem imagens reais.
- Esta triagem nao valida integridade completa, decode, dimensoes/20 MP, tamanho durante recebimento, EXIF, privacidade, S3 ou compensacao. Esses criterios exigem a implementacao integral da P14 e integracoes reais. A P14 **nao foi iniciada formalmente**; P01 e P02 seguem parciais, P03 nao executada. Nenhum deploy ou push.

## 12/11/2026 - Preparacao da validacao completa de imagens P14

- FSD 17/DT 11 fixam JPEG/PNG/WebP, 10 MB, 20 MP apos decode, rejeicao de malformados e derivada re-encodada sem EXIF. Nenhuma biblioteca de decode/re-encoding esta aprovada em AGENTS, DT, FSD ou PLANO. Sharp e Jimp foram avaliadas brevemente como candidatas, sem instalacao ou escolha automatica.
- A validacao completa ficou bloqueada pela decisao tecnica da biblioteca e sua revisao de seguranca/supply chain. A interpretacao exata de 10 MB em bytes (decimal ou binaria) tambem nao esta explicitada; nao foi criado um limite alternativo. A triagem anterior permanece apenas preliminar, sem endpoint, upload, S3 ou processamento novo.
- P14 continua nao iniciada formalmente; P01/P02 parciais. Nenhum deploy, commit ou push.
- Verificacoes nesta execucao: Vitest 21/21 PASS, typecheck PASS, build PASS; `npm audit --omit=dev --audit-level=high` reportou zero vulnerabilidades. Esses testes cobrem a triagem preliminar existente, nao decode/re-encoding.

## 12/11/2026 - Processador seguro de imagens, trabalho preparatorio P14

- Decisoes D-IMG-01 a D-IMG-05 aprovadas pelo responsavel foram registradas em `DECISOES_TECNICAS.md`: Sharp, 10.000.000 bytes, 20.000.000 pixels, JPEG/PNG/WebP e derivada sem metadados com orientacao visual preservada. A pendencia anterior da biblioteca/convencao de bytes foi resolvida por essa aprovacao.
- Instalado Sharp **0.35.5** com libvips **8.18.7** no Node local **26.13.1**; lockfile atualizado. `backend/src/integrations/images/process.ts` verifica tamanho e assinatura antes do decoder, confirma formato/dimensoes, decodifica e re-encoda com auto-orientacao e sem preservar EXIF/ICC/XMP/IPTC, verifica tamanho/pixels/formato/metadata de saida e decodifica a saida. Erros expostos sao genericos. Nenhum endpoint ou S3 foi criado.
- `backend/tests/image-process.test.ts` usa fixtures sinteticas para os tres formatos, truncamento, assinatura falsa, SVG/HEIC, malformacao, limite inclusivo de 10.000.000 bytes e 20.000.000 pixels, excesso, EXIF, orientacao e saida. Vitest **30/30 PASS**, typecheck PASS, build PASS; `npm audit --audit-level=high` reportou **0 vulnerabilidades** no grafo npm. Nenhum scan de imagem Docker/native ou teste de integracao S3 foi executado.
- P14 permanece trabalho antecipado, nao fase concluida. P01/P02 continuam parciais. Faltam limite durante recebimento HTTP, politica de publicacao/privacidade, armazenamento privado, compensacao SQL/S3 e validacao integrada.

## 12/11/2026 - Implementacao preparatoria de autenticacao P05/P06

- Implementados contratos puros em `backend/src/security/account-access.ts`: papeis/estados aprovados, `CurrentAccountReader` para obter estado atual sem acoplamento ao banco, precondicao de email verificado para emissao de sessao local e capacidade de conta para leitura visivel, contribuicao, moderacao e administracao. `backend/tests/account-access.test.ts` usa repository simulado para rebaixamento e banimento, cobrindo negacao por padrao e BANIDO somente leitura. FSD 4.0-4.4 e 13.4/13.5; PLANO P05/P06, trabalho antecipado sem inicio formal das fases.
- Vitest **35/35 PASS**, typecheck PASS, build PASS; `npm audit --audit-level=high` reportou zero vulnerabilidades. Nenhum endpoint, banco, store de sessao, cookie, senha/hash, token, CSRF ou login foi implementado. `READ_VISIBLE` nao verifica visibilidade do recurso; ownership, sessao valida, confirmacao de identidade externa, CSRF e auditoria exigem camadas futuras.
- Pendencias documentadas: D03 store/TTL/renovacao de sessao, D04 parametros de senha/hash e validade de tokens, D07 textos legais; testes de persistencia e duas sessoes reais pendentes. P01/P02 seguem parciais; P04-P06 nao concluidas nem iniciadas formalmente. Sem deploy, commit ou push.

## 12/11/2026 - D03/D04 aprovadas e primitivas locais de autenticacao

- D03/D04 e cookie/CSRF aprovados pelo responsavel foram registrados em `DECISOES_TECNICAS.md`. FSD 13.4 foi harmonizado somente na politica de senha: proposta 12-128 substituida por 15-128 caracteres, com historico na propria secao. Demais requisitos preservados.
- Instalado `argon2` 0.45.2, compatível com Node 26. Arquivos novos `backend/src/security/password.ts`, `tokens.ts`, `sessions.ts` e `backend/tests/auth-primitives.test.ts`; `backend/package.json` e lockfile alterados. Hash Argon2id m=19456 KiB/t=2/p=1 com salt aleatorio, validacao 15-128, lista local inicial, token CSPRNG 32 bytes/base64url e SHA-256, prazos 24 h/30 min, comparacao segura, contratos de consumo atomico, store PostgreSQL futuro e CSRF sincronizado; tempo de sessao 30 min inativo/12 h absoluto e revogacao por contrato.
- Vitest **42/42 PASS**, typecheck PASS, build PASS e `npm audit --audit-level=high` reportou zero vulnerabilidades. Testes de store/token sao simulados: nao demonstram atomicidade SQL, revogacao entre instancias, cookie, CSRF real ou OAuth. Nao houve endpoint, PostgreSQL, migration, deploy, commit ou push.
- Pendencias: implementar store real e consumo atomico em banco aprovado apos desbloqueio, cookies/CSRF e testes integrados; ampliar e revisar lista local de senhas comuns/comprometidas antes de cadastro/reset operacionais; benchmark Argon2 antes de producao; D07 textos juridicos segue aberto. P01/P02 parciais; P04-P06 apenas trabalho preparatorio.
- Gitleaks inicialmente apontou a denylist textual; ela passou a conter somente fingerprints SHA-256 e o scan repetido de `backend/src/security` ficou sem achados. Typecheck/build e Vitest 42/42 repetidos com PASS. Nao houve supressao de finding.

## 12/11/2026 - Reproducibilidade Argon2 e preparacao PostgreSQL

- Copia nova e isolada em `.local/auth-ci-<id>` (ignorada pelo Git), com manifests/lockfile, fontes e testes. `npm ci` instalou 118 pacotes no Node 26.13.1; modulo nativo `argon2` 0.45.2 carregou, gerou hash D04 (m=19456,t=2,p=1) e verificou a senha sintetica. Nessa copia: Vitest **42/42 PASS**, typecheck PASS, build PASS. Nenhum node_modules existente ou volume foi alterado. npm avisou sobre install script de argon2 nao coberto por `allowScripts`, embora o binario precompilado tenha funcionado; CI Linux ainda nao comprovado.
- Contratos confrontados com migrations 001-017: `usuarios.id`, `senha_hash VARCHAR(255)`, `papel`, `status` e `email_verificado_em` existem em 003; hash Argon2 gerado cabe em 255 caracteres. Nao existem tabelas de sessao nem de tokens, que permanecem atribuicoes de migrations futuras P04/P05. `CurrentAccountReader` mapeia papel/status conceitualmente, sem repository SQL; `AccountTokenStore.consume` exige atomicidade apenas por contrato, sem prova em banco. Nenhuma migration criada.
- Denylist local: 8 fingerprints SHA-256 de exemplos comuns, comparacao com senha recebida em lowercase somente para busca; hash Argon2 recebe a senha original sem trim/casefold. Adicionado teste de caixa e entrada invalida. Cobertura insuficiente para cadastro/reset operacionais. Proposta: apos revisao de licenca/proveniencia, usar corpus `SecLists/Passwords/Common-Credentials/10-million-password-list-top-10000.txt` do projeto SecLists (MIT), fixado por commit e transformado localmente em fingerprints, sem versionar senhas claras. Nada externo incorporado nesta execucao.
- P01/P02 parciais; P04/P05/P06 ainda preparatorias. Integracao real PostgreSQL, atomicidade, revogacao multiprocesso, CI Linux, benchmark na VPS, corpus revisado e OAuth/CSRF continuam pendentes. Sem deploy, commit ou push.
- Apos ajuste do guard de entrada e testes, validacao do workspace: Vitest 42/42, typecheck e build PASS; `npm audit --audit-level=high` reportou zero vulnerabilidades. Gitleaks em `backend/src/security` e `backend/tests` sem achados; `git diff --check` PASS, `.local`/`node_modules`/`dist` ignorados e indice Git vazio.

## 12/11/2026 - Preparacao final da persistencia de autenticacao

- Corpus SecLists aprovado incorporado como **10.000 fingerprints SHA-256 distintos** em `backend/src/security/common-password-fingerprints.ts`; `password.ts` passou a consultar o corpus. Origem oficial fixada no commit `dbfb830d95e4f3da4fb7d7d277ed597de0ed7a18`, blob `a93ea7f91f095b38728795ecd6ec731e59b8c112`, licença MIT com aviso preservado em `docs/SECLISTS_LICENSE.txt`; metodologia em `docs/SECLISTS_CORPUS.md`. O arquivo oficial contém 10.001 linhas, selecionadas as primeiras 10.000; zero vazias/duplicadas/controle. Apenas uma entrada alcança o mínimo D04 de 15 caracteres: eficácia adicional limitada, sem alterar a política ou incorporar senhas em claro.
- Workflow `.github/workflows/auth-primitives.yml` configurado com Node 26, `npm ci`, smoke nativo Argon2id, Vitest, typecheck, build, audit e check estático de migrations; Actions oficiais fixadas por SHA. **CI remoto Linux NÃO EXECUTADO**, portanto não aprovado. O `npm ci` anterior foi validado somente em cópia isolada Windows com Node 26.13.1, binário Argon2 carregado e 42 testes/typecheck/build PASS.
- Criadas migrations **018_account_tokens.sql** (hash, tipo, expiração, consumo único) e **019_sessions.sql** (hash do ID opaco, usuário, hash CSRF, atividade e revogação), sem alterar 001-017. `StoredSession` recebeu `csrfTokenHash` para corresponder à estrutura. `scripts/check-auth-migrations.mjs`: 11 verificações estáticas PASS. **SQL não executado em PostgreSQL**, sem prova de atomicidade ou persistência; imagem bloqueada não usada. Fases P04/P05 apenas preparatórias.
- Vitest 42/42 PASS, typecheck/build PASS, `npm audit --audit-level=high` zero vulnerabilidades reportadas, Gitleaks em security/migrations/workflow sem achados, `git diff --check` PASS. Nenhum deploy, commit, push, endpoint ou conexão real.
- Consulta local direta ao corpus derivado: a única entrada da fonte dentro de 15-128 caracteres foi bloqueada no formato original e em caixa alta; a senha não foi exibida. Fonte original `.local/seclists-10k-source.txt`, `node_modules` e `dist` confirmados ignorados; nenhum arquivo staged.
- Pendências: executar CI Linux remoto; rever a baixa cobertura efetiva do corpus sem reduzir mínimo; aplicar 018/019 em banco limpo e upgrade real após liberação da imagem, testar constraints/consumo concorrente/revogação/restore; revisão humana reforçada de migrations e CI. P01/P02 seguem parciais; P03/P04/P05 não concluídas.

## 12/11/2026 - Handlers de autenticacao com dependencias simuladas

- Trabalho antecipado P04-P06 conforme FSD 13.4-13.8: `backend/src/services/auth.ts` define contratos de conta, rate gate, notificacao simulada e servico para cadastro, reenvio, verificacao, login, consulta interna de sessao e logout; `backend/src/schemas/auth.ts` valida DTOs; `backend/src/routes/auth.ts` define POST register/email/resend/email/verify/login/logout. `backend/tests/auth-http.test.ts` cobre os handlers por `fastify.inject()` com stores simulados. `@fastify/cookie` 11.1.5 adicionado ao manifesto/lockfile. Rotas NAO registradas no app/server operacional.
- Cadastro exige aceites independentes e versoes legais injetadas apenas como fixtures de teste; resposta neutra para e-mail duplicado, sem sessao. Confirmacao usa hash e consumo atomico por contrato; login requer Argon2id e email verificado, cria ID opaco e CSRF aleatorios com somente hashes no store. Conta BANIDO pode entrar somente em leitura; consulta interna revalida papel/status. Logout exige cookie, CSRF e Origin e revoga no store. Nao foi criado GET de sessao: caminho nao previsto na lista FSD 13.8.
- `SessionStore.renewIfActive` passou a exigir renovacao atomica condicionada a validade/revogacao, evitando salvar estado obsoleto em futura implementacao SQL. Mock cobre comportamento, sem provar atomicidade real. `backend/src/app.ts` e `server.ts` seguem sem autenticacao operacional.
- Vitest 47/47 PASS, typecheck/build PASS, `npm audit --audit-level=high` reportou zero vulnerabilidades. Testes cobrem cadastro valido/invalido/duplicado, confirmacao valida/expirada/reutilizada, reenvio e rate gate simulado, login valido/invalido/nao confirmado/BANIDO, flags de cookie, CSRF/Origin no logout, expiracao e estado atual. Sem banco, envio externo, deploy, commit ou push.
- Bloqueios: rate limiting/cooldown persistentes apenas por interface; versoes/textos legais definitivos pendentes D07; entrega de e-mail duravel ainda nao demonstrada; controle de timing antienumeracao, cookies/OAuth em ambiente real, CSRF em demais mutacoes, migrations 018/019 e store PostgreSQL reais, revisao humana de auth. P01/P02 parciais e P04-P06 nao concluidas.
