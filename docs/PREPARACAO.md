# Preparação P00 — Voz da Rua

**Data:** 12/11/2026. **Autorização:** P00 aprovada expressamente com ressalvas pelo usuário. Somente P00 foi executada; P01 e seguintes não foram iniciadas.

## Documentos e caminhos vigentes

| Fonte | Caminho real |
|---|---|
| PRD | [PRD/prd.md](PRD/prd.md) |
| Decisões técnicas | [DECISOES_TECNICAS.md](DECISOES_TECNICAS.md) |
| FSD 1.4 | [FSD/FSD.md](FSD/FSD.md) |
| Referência visual disponível | [frontend/Design.md](frontend/Design.md) |
| Home em revisão | [frontend/Home.md](frontend/Home.md) |
| Security Gate e extensão | [FSD/SECURITY_GATE_100.md](FSD/SECURITY_GATE_100.md) |
| Plano de 34 fases | [PLANO.md](PLANO.md) |
| Progresso e problemas | [STATUS.md](STATUS.md), [ERROS.md](ERROS.md) |
| Instruções de desenvolvimento | [AGENTS.md](../AGENTS.md) |

Não existe arquivo físico nos caminhos curtos `docs/PRD.md`, `docs/FSD.md` ou `docs/DESIGN.md`. Os conteúdos foram localizados nas subpastas acima. Não foram criadas cópias, aliases ou renomeações de documentos aprovados.

A documentação visual foi consolidada em `frontend/Design.md` e `frontend/references/`; a Home mantém sua especificação própria. O AGENTS.md ainda cita o nome anterior e precisa ser atualizado quando permitido. A existência de direção visual aprovada não transforma tokens, ativos e navegação pendentes em decisões finais.

## Estrutura preparada

```text
backend/
  src/
    config/ routes/ controllers/ services/ repositories/ schemas/
    plugins/ hooks/ security/ integrations/ errors/ types/
  tests/
frontend/
  src/
    components/ features/ pages/ routes/ services/ hooks/ styles/ assets/
db/
  migrations/          # baseline 001–017 preservada
  seeds/dev/          # seed de desenvolvimento existente
scripts/              # runners existentes preservados
docs/                 # especificações e controle de progresso
```

Cada pasta nova contém somente `.gitkeep`, para que o Git preserve a estrutura. Não existem arquivos executáveis, manifests, lockfiles ou configurações de compilação novos. `app.ts`/`server.ts`, TypeScript/tsc/Fastify e dependências pertencem às fases executáveis seguintes; não foram antecipados por arquivos vazios que aparentem implementação.

## Ambiente e Git

- Git já inicializado: preservado sem commit, stage, push, mudança de branch ou configuração global/local do Git.
- `.gitignore` mantém regras existentes e protege ambiente real, dependências, build/testes, chaves privadas, dumps/backups, dados de banco e objetos locais. SQL versionado em `db/migrations/` e seed dev continuam elegíveis; não ignorar genericamente `*.sql`. Lockfiles futuros devem ser versionados.
- `.gitattributes` define tratamento de texto e LF em scripts Linux, fontes/configurações e documentação; imagens/fontes/PDF são binários. Não foi executada renormalização do repositório.
- `.env.example` mantém as variáveis já usadas pelo Compose, com senha vazia e instrução para configuração local futura. Não copiar por cima de `.env` existente. Nenhum segredo real foi incluído no exemplo; senha vazia não torna o ambiente pronto para subir.
- `.env` existente preservado e ignorado. Valores não foram exibidos. A validação compara internamente valores sensíveis locais aos arquivos candidatos sem imprimir valores.
- Stack planejada: Node.js 26 LTS/Fastify/TypeScript/pg, React/Vite, PostgreSQL 17/PostGIS 3.6. Runtime local observado: Node 24.11.0. Preparação/instalação de Node 26 e validação de serviços ficam em **P01**, sem substituir tecnologias.
- Compose, runners, migrations e serviços existentes não foram alterados, executados ou reinicializados. Não foi criada infraestrutura MinIO/Mailpit, conexão `pg`, CI ou aplicação nesta fase.

## Verificação desta entrega

Resultados finais e limitações são registrados em [STATUS](STATUS.md). Verificações locais: estrutura e placeholders, acessibilidade e hash das fontes, ausência de mudanças executáveis, regras de ignore para arquivos sensíveis/artefatos e inclusão de exemplos/SQL/lockfiles, atributos LF/binários, estado/diff do Git e inspeção de segredos dos arquivos rastreados e candidatos não ignorados.

A inspeção de segredos combina padrões de chaves/tokens/URLs credenciadas e comparação com valores sensíveis de `.env` local. Ela não certifica a ausência universal de segredos nem substitui Gitleaks/SCA/CI. Gitleaks e Trivy não foram encontrados no PATH; sua instalação/pipeline não foi antecipada. Histórico completo do Git e serviços remotos não foram auditados nesta P00.

Testes de aplicação, `npm ci`, build/typecheck/lint, testes HTTP/SQL/E2E, execução de migrations e DAST: **N/A nesta entrega**, pois não há comportamento executável novo nem manifests. As validações específicas de configuração Git são aplicáveis e devem passar.

### Security Gate — aplicabilidade da P00

| Itens SEC | Aplicabilidade / evidência |
|---|---|
| 001–060 | N/A: nenhum endpoint, autenticação, domínio, upload ou integração executável criado |
| 061–062 | Verificação local aplicável: segredos/candidatos e `.env` fora do Git; resultado no STATUS, limitado ao método descrito |
| 063 | N/A para execução P00: secret scanning em CI pertence a P03; não declarado implantado |
| 064 | N/A sem exposição confirmada nesta verificação; rotação permanece obrigatória se houver incidente |
| 065–080 | N/A: nenhum serviço HTTP, criptografia, backup, logging ou PWA implementado nesta entrega |
| 081–087 | N/A: nenhuma dependência, imagem ou Action adicionada; manifests/lockfiles serão criados nas fases responsáveis |
| 088 | Aplicável: comandos/mudanças revisados no escopo P00, sem executar scripts externos ou código sugerido não inspecionado |
| 089 | Aplicável: diff/configuração Git e exemplos revisados; revisão humana reforçada antes de merge/release permanece necessária para mudanças sensíveis; não é aprovação de produção |
| 090–117 | N/A: nenhuma atualização automática, endpoint, controle de auth/rede/infra executável ou incidente de rotação introduzido; requisitos mantidos em AGENTS e plano |
| 118 | N/A: nenhum honeytoken adicionado |
| 119 | Aplicável: nenhuma `.env` falsa, credencial falsa operacional, honeypot, tarpit ou rotação de portas; `.env.example` é exclusivamente modelo autorizado |
| 120 | N/A para testes de aplicação: somente documentação, estrutura e configuração Git; verificações específicas executadas |
| 121–125 | N/A: sem alteração de endpoint, Repository, autorização, migration executável ou bug de aplicação |

Este registro não declara revisão humana independente concluída, scanner especializado aprovado ou todos os gates futuros satisfeitos.

## Ressalvas e limite de continuidade

- D01: fontes localizadas; AGENTS preenchido. Atualização dos links dentro de documentos aprovados aguarda autorização específica.
- D02–D15 continuam discriminadas no PLANO. Sessão/TTL, parâmetros de senha/tokens, Postmark, UX/legais, criação administrativa, unfollow, ferramentas operacionais e acessos serão tratados antes da parte afetada. D12 já possui regra de contagem no FSD; D13 demanda preparar Node 26 em P01.
- Backup/TLS possuem definições expressas no FSD; distinguir essas definições da ferramenta de backup ainda não escolhida e da divergência de atualização da DT.
- Dependência implícita P26/P32: P26 exige evidências em staging, mas P32 prepara staging e depende transitivamente de P26. Precisa de ajuste autorizado do planejamento antes dessas fases. Não foi resolvida alterando silenciosamente o PLANO nesta entrega.
- O PLANO continua com seu cabeçalho histórico de aguardando aprovação. A autorização posterior **somente de P00** está registrada em STATUS; não implica aprovação de execução do restante.

**Próxima fase prevista:** P01 — Desenvolvimento e baseline do banco. Não iniciá-la automaticamente.

## Origem documental preservada (SHA-256)

Digests registrados antes das alterações P00 e conferidos após a preparação. Servem para identificar o conteúdo efetivamente consultado, inclusive o FSD com alteração local preexistente.

| Fonte | SHA-256 |
|---|---|
| PLANO | `b00d6a79637022192ea8140069663f57456ed02b965f1b7e70c298c300f3da6e` |
| PRD | `54fb26a6fd374f8fbc5ecba03901f835316509621ca86178dde87dba797bbaf5` |
| FSD | `b9624746a448b35806a0d8d8633543247c84c0f0f6d62fa6b0635e50a27449fd` |
| DECISOES_TECNICAS | `80f080e26b5741a1156075d99b60317cf200f63f06ef26636a32276d1095e76d` |
| Desing | `5181b7cdce306f945ac0f758a0341bae398d2856aec5fcd31f70e479f77ad5ae` |
| Home | `f05f23208dcfd6cec51709212dde7bb7a05e965c8d7b17197c852fe77c55fe9a` |
| SECURITY_GATE_100 | `bd886def451ccfc7d53e86d55c3aed8daf977458e0b580e018c247232d189cdc` |
