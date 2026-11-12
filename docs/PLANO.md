# Voz da Rua — Plano de implementação

**Versão:** 1.0 — 12/11/2026  
**Estado:** GERADO — AGUARDANDO APROVAÇÃO EXPLÍCITA.  
**Execução:** nenhuma fase autorizada por este documento enquanto não houver aprovação do plano. Nenhuma fase está concluída.  
**Escopo:** MVP aprovado; planejamento de decisões abertas não significa aprovação dessas decisões.

## 1. Fontes, situação inicial e limites

Documentos lidos integralmente para o planejamento:

| Documento solicitado | Arquivo disponível | Uso |
|---|---|---|
| PRD | [PRD/prd.md](PRD/prd.md) | Requisitos funcionais |
| Decisões técnicas | [DECISOES_TECNICAS.md](DECISOES_TECNICAS.md) | Referência obrigatória de tecnologias e políticas técnicas |
| FSD | [FSD/FSD.md](FSD/FSD.md), versão 1.4 | Contratos, regras detalhadas, critérios de aceite e pendências |
| DESIGN | `docs/DESIGN.md` ausente | Não presumir documento final nem criar substituto |
| Referências visuais disponíveis | [frontend/Desing-rules.md](frontend/Desing-rules.md) e [frontend/Home.md](frontend/Home.md) | Ler estados APROVADO/PROPOSTO/PENDENTE; Home está em revisão |
| Instruções de agentes | [AGENTS.md](../AGENTS.md) existente, vazio | Preenchimento previsto em P00, após aprovação |
| Segurança | [FSD/SECURITY_GATE_100.md](FSD/SECURITY_GATE_100.md) | SEC-001–100 e extensão SEC-101–125 |

Não mover, duplicar ou renomear as fontes para esconder caminhos divergentes. Aprovar sua organização em P00. PRD, FSD, referências visuais e decisões técnicas não foram alterados nesta execução. A alteração local preexistente do FSD foi preservada.

O Git já está inicializado. Existem `compose.yml`, `.env.example`, `.gitignore`, migrations SQL 001–017 e scripts de migration/seed; não existem frontend e backend implementados. O Compose atual prepara apenas o banco e os runners. Há `.env` local, cujo conteúdo não foi exibido. `.gitattributes` está ausente. Node local observado: **24.11.0**, diferente do **26 LTS** aprovado; npm **11.6.1** e Docker Compose **v5.0.2** disponíveis por CLI. Isso não comprova Docker Engine ativo, banco funcionando ou compatibilidade de dependências.

Stack obrigatória: Node.js 26 LTS, TypeScript, Fastify, `tsc`, npm com lockfiles, `pg`, SQL parametrizado em repositories; React/TypeScript/Vite; PostgreSQL 17/PostGIS 3.6/pgcrypto; MapLibre GL JS/MapTiler; MinIO compatível com S3; Mailpit local; Postmark em produção; Web Push/VAPID; VPS Hostinger/Docker Compose/Nginx; Grafana/Loki; GitHub Actions. Não substituir por ORM, outro runtime, banco, broker, storage ou hospedagem.

Testes aprovados: Vitest, `fastify.inject()`, Testcontainers for Node com PostgreSQL/PostGIS real, React Testing Library e Playwright. Segurança: CodeQL JS/TS, Semgrep, npm audit, Dependency-Check quando aplicável ao lockfile/SBOM, Trivy, Gitleaks, Dependabot e ZAP em homologação. Bibliotecas auxiliares serão verificadas em sua origem oficial antes de instalação no módulo correspondente; este plano não fixa versões nem aprova bibliotecas ainda abertas.

## 2. Como executar e verificar cada fase

1. Obter aprovação explícita deste plano. Executar somente fase cujas dependências e decisões necessárias estejam satisfeitas.
2. Consultar novamente o FSD e o SQL físico pertinente; registrar contrato de módulo **antes** de codificar endpoints, conforme FSD 11.0 e 61.5. Os caminhos listados no FSD devem ser preservados.
3. Limitar cada PR a uma unidade verificável da fase. Mudanças executáveis incluem testes na mesma entrega. Não adiar testes, autorização ou auditoria para a fase final.
4. Atualizar `docs/STATUS.md` com fase, entregáveis e evidências; registrar problemas em `docs/ERROS.md`, sem segredos. Usar PRs para mudanças relevantes, sem inventar convenção de branches/commits ainda não aprovada.
5. Aplicar o gate comum abaixo e os critérios específicos. Marcar conclusão apenas com evidências; dependência de fase significa sua conclusão, não apenas seu início. Subentregas independentes podem existir, mas não liberam fase dependente enquanto o respectivo contrato obrigatório estiver incompleto.

**Gate comum de conclusão (GC), obrigatório em toda fase:** escopo e contratos conferidos com FSD; testes positivos/negativos e de concorrência aplicáveis aprovados; `npm ci`, typecheck, lint definido e builds aplicáveis passam; migrations novas aplicam em banco limpo e em baseline existente quando houver; SEC-001–125 avaliados por aplicabilidade com PASS/FAIL/N/A justificado; scans pertinentes sem segredo real nem Critical, e High bloqueado salvo exceção explícita, documentada e temporária; revisão humana reforçada em auth, autorização, upload, migrations, infraestrutura, CI/CD, secrets, integrações e geografia; documentação/evidências atualizadas. Não declarar ferramenta indisponível como PASS. Em fase apenas documental, justificar N/A para testes executáveis. Validação em staging é exigida quando aplicável e obrigatória antes de release.

**Contrato mínimo por endpoint:** método/caminho, sessão, papel/status, confirmação local, ownership/contexto, schemas fechados, DTO de resposta, erros e códigos, paginação/filtros/sort, transação, auditoria/eventos, concorrência/idempotência e casos Dado/Quando/Então. Envelope de erro do FSD 12; 401/403/404/409/422/429 segundo contrato, sem expor configuração, SQL ou dados privados.

**Arquitetura de arquivos prevista:** backend com `src/{config,routes,controllers,services,repositories,schemas,plugins,hooks,security,integrations,errors,types}`, `app.ts`, `server.ts`, `tests/`, manifests/lockfile/tsconfig; frontend com `src/{components,features,pages,routes,services,hooks,styles,assets}`, manifest npm e lockfile. SQL continua em `db/migrations/`, seed dev separado e runners em `scripts/`. Nomes de arquivos de módulo abaixo são organização prevista, não contrato adicional de produto.

## 3. Sequência e dependências

São **34 fases (P00–P33)**. A ordem de leitura abaixo é uma ordem executável. Ramos só podem avançar após suas dependências; não existe dependência circular.

| ID | Fase | Dependências diretas |
|---|---|---|
| P00 | Preparação documental, Git e estrutura | Aprovação do plano |
| P01 | Desenvolvimento e baseline do banco | P00 |
| P02 | Fundação Fastify e testes base | P01 |
| P03 | CI e segurança automatizada inicial | P02 |
| P04 | Persistência de conta, tokens e aceites | P03 |
| P05 | Sessão, CSRF e autorização contextual | P04 |
| P06 | Conta local, confirmação e recuperação | P05 |
| P07 | Google/GitHub e vinculação segura | P06 |
| P08 | MFA e proteção de contas privilegiadas | P07 |
| P09 | Fundação frontend e telas de acesso | P08 |
| P10 | Perfil, privacidade e exclusão de conta | P09 |
| P11 | Geografia, subcategorias e referência | P03 |
| P12 | Consultas autenticadas e canais | P10, P11 |
| P13 | Home, detalhes e participação em leitura | P12 |
| P14 | Upload seguro e consistência MinIO/SQL | P05, P11 |
| P15 | Criação cidadã e duplicidade candidata | P12, P14 |
| P16 | Relatos, edição, exclusão e denúncia | P15 |
| P17 | Interface cidadã de ocorrências | P13, P16 |
| P18 | Moderação e máquina de estados | P16 |
| P19 | Resolução e reabertura por ciclo | P18 |
| P20 | Interface de moderação e resolução | P17, P19 |
| P21 | Evoluções de persistência Social | P14, P16 |
| P22 | Feed, posts, comentários, likes e seguir | P21 |
| P23 | Moderação Social e privacidade integrada | P18, P22 |
| P24 | Interface Social e perfis visíveis | P20, P23 |
| P25 | Notificações duráveis e processamento | P19, P23 |
| P26 | Postmark e Web Push | P25 |
| P27 | Interface de notificações e preferências | P24, P26 |
| P28 | Administração de contas e cadastros | P19, P23 |
| P29 | Indicadores, auditoria e interface admin | P27, P28 |
| P30 | PWA, offline somente leitura e UX final | P29 |
| P31 | Observabilidade, backup e recuperação | P03, P26, P28 |
| P32 | Staging, hardening e validação integral | P30, P31 |
| P33 | Release e produção aprovada | P32 e aprovação específica de deploy |

**Justificativa frente ao FSD 60:** sua ordem é explicitamente sugerida. Este plano preserva seus módulos e antecipa Auth/RBAC à exposição da leitura autenticada, evitando acesso provisório inseguro. Divide migrations 018+ por dependência real, sem fixar números concorrentes; antecipa CI, testes e contratos; entrega frontend integrado por módulo em vez de postergar toda validação visual à PWA. As notificações externas vêm depois dos módulos produtores, mas a intenção durável e a auditoria obrigatória são planejadas desde a primeira mutação. A consolidação operacional final não dispensa logs e segurança desde P02. Essa organização é uma proposta sujeita à aprovação deste plano, não mudança das regras do FSD.

## 4. Fases detalhadas

### P00 — Preparação documental, Git e estrutura

1. **Objetivo:** deixar o repositório pronto para receber código sem iniciar funcionalidades.
2. **FSD:** 5–8, 42.1, 43, 45, 60–64.
3. **Dependências:** aprovação explícita do plano; registrar organização documental D01. A entrega do DESIGN final não bloqueia a estrutura/backend independentes de apresentação.
4. **Atividades:** preencher AGENTS com decisões existentes; criar somente estrutura aprovada; revisar conteúdo antes de alterar Git ignore/attributes e exemplos de ambiente; proteger `.env`, certificados privados, dumps, objetos, logs e artefatos de build; definir LF para scripts Linux; planejar Node 26 sem substituir stack; registrar versão de origem das fontes e pendências.
5. **Arquivos/módulos:** `AGENTS.md`, `.gitignore`, `.gitattributes`, `.env.example`, `README.md`, diretórios frontend/backend e documentação de execução.
6. **Testes:** inspeção de estrutura, links, `git check-ignore`, arquivos rastreados/candidatos e secret scanning; testes de negócio N/A justificado.
7. **Aceitação:** fontes localizáveis; regras do AGENTS rastreáveis; `.env` real fora do índice; exemplos sem credenciais reais; diretórios alinhados ao FSD 5.3; PLANO preservado.
8. **Entregáveis:** estrutura mínima e instruções reproduzíveis de preparação.
9. **Conclusão:** GC documental e evidências de verificação, sem alegar aplicação executável.
10. **Limite:** não instalar módulos de negócio, aplicar migrations novas, criar rotas ou componentes funcionais nesta fase.

### P01 — Desenvolvimento e baseline do banco

1. **Objetivo:** ambiente local reproduzível com banco e serviços aprovados.
2. **FSD:** 7–9, 33–34, 42.1, 42.5, 44.
3. **Dependências:** P00.
4. **Atividades:** preparar Node 26/npm; validar imagens e compatibilidade; completar Compose local com MinIO/Mailpit; preservar volumes existentes; serviços administrativos acessíveis somente no escopo local necessário; isolar testes; executar 001–017 em banco descartável, repetir runner e inspecionar schema real; seed exclusivamente dev; separar credencial de aplicação de identidade privilegiada de migration. Não usar superusuário na aplicação.
5. **Arquivos/módulos:** `compose.yml`, exemplos de ambiente, `scripts/migrate.sh`, `scripts/seed-dev.sh`, documentação local; migrations históricas somente leitura.
6. **Testes:** inicialização em ambiente limpo, extensões/versões, 17 registros aplicados, segunda execução sem reaplicação, erro aborta runner; persistência de volumes e recebimento local de e-mail; conectividade com menor privilégio.
7. **Aceitação:** PostgreSQL 17/PostGIS 3.6/pgcrypto comprovados; MinIO privado e Mailpit operantes; nenhum envio real; app sem DDL/superusuário; seed não executa em produção.
8. **Entregáveis:** ambiente dev verificável e inventário do schema físico.
9. **Conclusão:** GC, instruções de inicialização testadas, sem reset de volume do usuário.
10. **Limite:** schemas funcionais novos somente nas fases responsáveis; confirmar previamente tags e dependências em fontes oficiais.

### P02 — Fundação Fastify e testes base

1. **Objetivo:** processo HTTP testável, sem endpoints de negócio.
2. **FSD:** 5–7, 11–12, 35–40, 44, 60/Fase 1.
3. **Dependências:** P01.
4. **Atividades:** manifests/lockfile, TypeScript/tsc, separação app/server, configuração validada, pool `pg`, repositories separados, request ID, erro seguro, logs estruturados com redação, limites de request e CORS explícito; `/health` e `/ready`; Vitest/inject/Testcontainers; ausência de migration em startup.
5. **Arquivos/módulos:** `backend/package*.json`, tsconfig, `src/app.ts`, `server.ts`, config/plugins/errors/types, `tests/`.
6. **Testes:** inject para liveness/readiness; banco indisponível torna readiness negativa; configuração inválida falha claramente; erro/log não vaza senha, cookie ou SQL; build/typecheck; integração `pg` em banco real.
7. **Aceitação:** processo inicia com ambiente válido, fecha recursos de modo controlado; health não revela detalhes; ready reflete dependência essencial; nenhum endpoint privado liberado implicitamente.
8. **Entregáveis:** backend técnico mínimo e comandos de verificação reais.
9. **Conclusão:** GC com testes positivos e negativos da fundação.
10. **Limite:** não implementar autenticação por mock, sessão em memória de produção ou regra de domínio.

### P03 — CI e segurança automatizada inicial

1. **Objetivo:** impedir que futuras entregas avancem sem validação automatizada.
2. **FSD:** 43–45, 59, 63; decisões técnicas 17, 24–25.
3. **Dependências:** P02.
4. **Atividades:** GitHub Actions para npm ci/build/typecheck/lint/testes e migrations limpas; CodeQL, Semgrep, npm audit, Trivy, Gitleaks e Dependabot; avaliar Dependency-Check conforme lockfile/SBOM; fixar Actions confiáveis; permissões mínimas; incluir frontend quando P09 existir; manter revisão humana e aprovação de produção.
5. **Arquivos/módulos:** `.github/workflows/`, configuração Dependabot e scanners, scripts npm, documentação de gates.
6. **Testes:** pipeline verde com baseline e testes de bloqueio em fixtures inofensivas para falha de teste, migration e segredo sintético; validar permissões/configuração de scanners.
7. **Aceitação:** falha aplicável bloqueia; nenhum skip silencioso; findings Critical/High tratados conforme política; nenhuma chave real usada nos testes.
8. **Entregáveis:** CI funcional e evidências; proteção de branch registrada/configurada quando houver acesso autorizado.
9. **Conclusão:** GC com execução comprovada no GitHub; acesso ausente fica como pendência, não PASS.
10. **Limite:** não publicar automaticamente produção; ativação de serviços externos somente no escopo autorizado.

### P04 — Persistência de conta, tokens e aceites

1. **Objetivo:** suportar cadastro/recuperação e rastreabilidade jurídica no banco.
2. **FSD:** 9.1–9.2, 10.1, 13.4, 13.7, 14.1, 52.
3. **Dependências:** P03; validar SQL físico em P01.
4. **Atividades:** migrations novas 018+ para tokens em hash, consumo/expiração e versões/timestamps de aceite de Termos e ciência da Política; reutilizar `email_verificado_em` existente; índices/constraints apropriados; não inventar enum de conta não verificada.
5. **Arquivos/módulos:** novas `db/migrations/*.sql`, repositories/types de conta e testes de integração.
6. **Testes:** banco limpo e upgrade desde 017; unicidade/FKs, token consumido/expirado, transações; aceites independentes com prova de versão/data; ausência de token puro persistido.
7. **Aceitação:** duas manifestações legais representadas; tokens não reutilizáveis; 001–017 intactas; não fixar TTL ou algoritmo ainda pendente.
8. **Entregáveis:** persistência validada para identidade e aceites.
9. **Conclusão:** GC de migration e revisão humana; contratos de uso documentados.
10. **Limite:** textos jurídicos definitivos e prazos de tokens dependem de D04/D07; nenhum texto legal inventado.

### P05 — Sessão, CSRF e autorização contextual

1. **Objetivo:** acesso seguro e revogável antes das APIs autenticadas.
2. **FSD:** 4.0–4.6, 13.1–13.3, 13.5, 13.9.1–13.9.2, 35–38, 52, 59.
3. **Dependências:** P04 e decisão D03 sobre store/timeout/renovação.
4. **Atividades:** selecionar plugins compatíveis após verificação; store aprovado e migration se necessária; cookie seguro, regeneração/revogação/timeout; CSRF; status/papel atuais; negar por padrão; conta local não verificada sem acesso; BANIDO leitura independentemente de papel; rate limiting multicamada, cooldown e lockout temporário; trustProxy restrito ao proxy esperado.
5. **Arquivos/módulos:** plugins/hooks/security/config e repositories de sessão se aprovados; contratos de autorização.
6. **Testes:** inject e integração com store; CSRF ausente/inválido, fixation, expiração, logout, duas sessões após banimento/rebaixamento e concorrência; cooldown sem conexão artificialmente aberta; IP forjado não contorna limites.
7. **Aceitação:** revogação imediata efetiva, ausência de token em storage do navegador, sessão persistente de produção, regras de RBAC comprovadas com contas distintas.
8. **Entregáveis:** camada de sessão e segurança reutilizável.
9. **Conclusão:** GC e revisão humana de auth; decisão D03 formalizada antes da conclusão.
10. **Limite:** fixtures de teste não autorizam login de teste em produção; não escolher PostgreSQL como store por inferência.

### P06 — Conta local, confirmação e recuperação

1. **Objetivo:** entregar acesso local com confirmação obrigatória e recuperação segura.
2. **FSD:** 4.0, 13.4–13.5, 13.7–13.8, 14.1, 34, 52.
3. **Dependências:** P05; D04 ratificada e versões legais de teste claramente identificadas, sem publicação final.
4. **Atividades:** contratos de register/login/logout/verify/resend/forgot/reset do FSD; hash adaptativo aprovado; perfil privado; sem sessão pré-confirmação; confirmação única exige login posterior; adaptador de e-mail desacoplado via Mailpit/SMTP; reset revoga outras sessões; aceites independentes; limites e respostas antienumeração. Entrega externa usa intenção persistente/consumo seguro, sem chamadas dentro de transação SQL.
5. **Arquivos/módulos:** routes/controllers/services/repositories/schemas de auth, integração de e-mail local e testes.
6. **Testes:** cadastro, duplicidade, falta de cada aceite, credencial inválida, usuário não verificado/banido, token inválido/expirado/reutilizado, reset em duas sessões, abuso e falha do Mailpit sem perda de intenção durável.
7. **Aceitação:** todos os endpoints locais documentados exercitados; nenhuma sessão criada no cadastro ou confirmação; senha nunca persistida/logada em claro; links com token não aparecem em logs.
8. **Entregáveis:** fluxo local completo e persistência de intenção de e-mail necessária ao módulo, reutilizável em P25.
9. **Conclusão:** GC; parâmetros de senha/hash/tokens aprovados e testes aderentes, não apenas valores propostos do FSD.
10. **Limite:** produção Postmark aguarda P26/D05; não declarar envio de produção pronto nesta fase.

### P07 — Google/GitHub e vinculação segura

1. **Objetivo:** autenticação externa aprovada sem associação automática por e-mail.
2. **FSD:** 9.2, 13.6, 13.8, 52.
3. **Dependências:** P06 e credenciais/callbacks segregados dos provedores.
4. **Atividades:** contratos das rotas OAuth existentes; state, nonce quando aplicável, callback allowlisted e validação protocolar; e-mail comprovado; para conta existente exigir autenticação original e autorização explícita; auditoria e regeneração da sessão; documentar contratos técnicos faltantes sem ampliar operações.
5. **Arquivos/módulos:** integrações Google/GitHub, serviços/repositories de identidade, callbacks e testes.
6. **Testes:** sucesso, state/nonce/issuer/audience quando pertinentes, callback adulterado, e-mail não verificado, identidade duplicada, takeover, vinculação sem autorização e conta banida; testes controlados do protocolo e smoke com contas de homologação.
7. **Aceitação:** Google/GitHub conformes; coincidência de e-mail nunca vincula sozinha nem eleva papel; falha externa não abre sessão indevida.
8. **Entregáveis:** autenticação externa e evidências de validação dos provedores.
9. **Conclusão:** GC, revisão humana e teste real autorizado em staging antes de lançamento.
10. **Limite:** não adicionar providers além de Google/GitHub; OIDC genérico do schema não exige funcionalidade nova.

### P08 — MFA e proteção de contas privilegiadas

1. **Objetivo:** garantir requisito de MFA antes de operação privilegiada em produção.
2. **FSD:** 13.9.3, 59; SEC-105–107.
3. **Dependências:** P07; contrato técnico de WebAuthn/Passkeys/FIDO2, bibliotecas e recuperação revisados.
4. **Atividades:** cadastro, verificação, revogação e recuperação segura do autenticador; persistência nova somente se necessária; MFA opcional para cidadão e obrigatório para MODERADOR/ADMIN em produção; auditar mudanças; definir contratos e estados para integração visual posterior em P09/P10.
5. **Arquivos/módulos:** security/services/repositories de MFA, contratos, migrations necessárias e testes; componentes React somente em P09/P10.
6. **Testes:** desafio/origem/RP e replay, troca de usuário, bypass, elevação de privilégio, revogação e recuperação; comprovar negação de operação privilegiada sem MFA.
7. **Aceitação:** recuperar MFA não oferece bypass mais fraco; papel armazenado não dispensa fator nem validação de status.
8. **Entregáveis:** MFA testado e contrato de recuperação revisado.
9. **Conclusão:** GC e revisão humana reforçada; validar experiência em P09/P10 e staging.
10. **Limite:** não adotar SMS por conveniência nem inventar processo de recuperação sem revisão. UI base será consolidada em P09; P08 entrega backend e contrato de interação, sem exigir componente React antes de P09.

### P09 — Fundação frontend e telas de acesso

1. **Objetivo:** frontend real integrado aos fluxos de identidade.
2. **FSD:** 5.3, 6–7, 13, 32.0–32.3, 44, 52.
3. **Dependências:** P08; direção visual disponível; D01 e definições visuais necessárias de D06.
4. **Atividades:** React/TypeScript/Vite, manifests/lockfile, Vitest/RTL/Playwright; camada HTTP com sessão/CSRF; AuthLayout e componentes aprovados; login/cadastro/recuperação/confirmação/reset, OAuth e MFA conforme contratos; links jurídicos públicos; Sora/dark-first e ativos separados; estados e acessibilidade; incluir frontend no CI.
5. **Arquivos/módulos:** `frontend/src/{components,features,pages,routes,services,hooks,styles,assets}`, configs e testes.
6. **Testes:** RTL para labels, feedback/disabled/loading e aceites; E2E dos fluxos com backend real; foco/teclado/zoom/mobile/teclado virtual; nenhum segredo em bundle; sessão sem localStorage/sessionStorage.
7. **Aceitação:** formulários HTML reais, sem screenshot como UI; conta não verificada não entra; BANIDO em leitura; OAuth/MFA integrados; sem barra autenticada nas telas públicas.
8. **Entregáveis:** app frontend inicial e acesso integrado; matrizes visuais de estados.
9. **Conclusão:** GC frontend/backend; pendências de tokens/ativos não declaradas como design congelado.
10. **Limite:** rotas visuais não aprovadas devem ser definidas antes de ativar controles; não inventar identidade ou texto jurídico.

### P10 — Perfil, privacidade e exclusão de conta

1. **Objetivo:** controle de conta e privacidade com histórico coletivo preservado.
2. **FSD:** 14, 14.1–14.2, 28.3, 38–39, 51.
3. **Dependências:** P09; contratos exatos de campos/permissões e anonimização antes da implementação.
4. **Atividades:** GET/PATCH `/me`, PATCH privacy e DELETE `/me`; preferências de exposição do nome; UI de perfil e MFA; invalidar sessões, anonimizar/remover dados aplicáveis e preservar auditoria mínima; respeitar FKs reais; ocultar Social já existente na baseline; links de Termos/Política.
5. **Arquivos/módulos:** perfil/privacy nos dois apps, repositories, migrations novas se necessárias.
6. **Testes:** ownership, mass assignment de papel/status, exclusão com relatos de terceiros e FKs RESTRICT, revogação em outro dispositivo, retorno de perfil a público, minimização de DTO/log.
7. **Aceitação:** privado por padrão; sem histórico contínuo de localização; conta excluída sem acesso; histórico coletivo anônimo não identifica titular removido.
8. **Entregáveis:** gestão de perfil/exclusão e contrato de privacidade reutilizado pelo Social.
9. **Conclusão:** GC; repetir cenários sobre novas estruturas Social/push em P23/P26, sem presumir cobertura antecipada.
10. **Limite:** banimento não é exclusão e não permite escrita colaborativa por endpoint alternativo; decisões de dados cadastrais seguem contrato do FSD.

### P11 — Geografia, subcategorias e dados de referência

1. **Objetivo:** autoridade espacial real e catálogo consistente.
2. **FSD:** 3, 9.3–9.7, 9.16–9.17, 10.2, 10.8–10.9, 16.1–16.3, 48.
3. **Dependências:** P03; fonte oficial e versão do polígono identificadas e verificadas.
4. **Atividades:** migrations 018+ de subcategorias/modo por categoria, vínculo de ocorrência, área municipal MULTIPOLYGON/4326 e parâmetro 100 m; importar polígono oficial com origem/versionamento registrados; validar ST_Covers, ST_DWithin e ST_Distance; verificar categorias iniciais; preservar 001–017.
5. **Arquivos/módulos:** novas migrations, dados/metadados geográficos, scripts de importação e repositories espaciais.
6. **Testes:** banco limpo/upgrade; dentro/fora/borda do município; distâncias abaixo/igual/acima de 3.000 m e 100 m; SRID/unidades; subcategoria de outra categoria e obrigatoriedade.
7. **Aceitação:** PostGIS decide município/distância; geocoder não é autoridade; índices GiST; fonte oficial verificável; não alterar dados históricos por seed dev.
8. **Entregáveis:** geografia/catálogo e testes de integração reais.
9. **Conclusão:** GC de migration/geografia; revisão humana da importação.
10. **Limite:** sem expandir cidades ou raios; não fixar numeração 018+ em paralelo sem conferir último arquivo integrado.

### P12 — Consultas autenticadas e canais oficiais

1. **Objetivo:** leitura autorizada de Home, ocorrência, participação e destino oficial.
2. **FSD:** 11–12, 15, 19–20, 27, 38, 48, 53.
3. **Dependências:** P10, P11.
4. **Atividades:** contratos de nearby, detalhe/relatos/histórico, minhas ocorrências e official-channel; consultas de referência necessárias documentadas antes das rotas; paginação/filtros/sort; 3 km e visibilidade; acesso agregado ao canal com persistência 018+ de 10.7; participantes históricos DISTINCT separados dos totais do ciclo; não devolver view/linha bruta. Explicitar o alcance de acompanhar ocorrência (D15) antes de criar controle ou vínculo além da consulta já especificada.
5. **Arquivos/módulos:** camadas de leitura/canais e migration de analytics mínimo, testes SQL/HTTP.
6. **Testes:** sessão ausente, banido em leitura, pendente/privado oculto, troca de IDs, filtros, ordenação por proximidade/atualização; mesmo usuário em dois ciclos contado uma vez; canal ausente e evento de acesso sem protocolo.
7. **Aceitação:** nenhum acesso interno sem autenticação; raio limitado; DTO sem identidade privada; canal desconhecido exibe mensagem prevista; abertura não muda para ENCAMINHADA.
8. **Entregáveis:** APIs de consulta e canal com contratos e contagens inequívocas.
9. **Conclusão:** GC e análise das consultas críticas/índices; não usar `total_relatos` da view como total histórico único.
10. **Limite:** não inventar GET público anônimo, URL de órgão ou resultado de denúncia externa.

### P13 — Home, detalhes e participação em leitura

1. **Objetivo:** entregar descoberta mobile integrada e acessível.
2. **FSD:** 15, 19–20, 27, 32.4, 48, 58.
3. **Dependências:** P12 e aprovação dos destinos/interações de D06 necessários.
4. **Atividades:** geolocalização e MapLibre/MapTiler, mapa resumido e mini mapa por card, filtros/ordenação/paginação; detalhes/relatos/histórico/minhas ocorrências e canais; saudação e barra inferior aprovadas; distinguir loading/vazio/erro/localização indisponível/fora do município/offline/banido.
5. **Arquivos/módulos:** frontend features home/occurrences/maps/participation, serviços HTTP e componentes de card.
6. **Testes:** RTL e E2E com APIs reais; geolocalização negada, falha de imagem/mapa, sem canal; teclado/leitor de tela/zoom; nenhuma distância fabricada; botões internos independentes do clique no card.
7. **Aceitação:** mini mapa não é substituído pelo mapa geral; dados obrigatórios presentes mesmo ausentes do mockup; sem ícones perfil/notificação no topo; lista textual acessível equivalente ao mapa.
8. **Entregáveis:** experiência de leitura integrada, sem mutações ainda não entregues.
9. **Conclusão:** GC e validação visual dos itens aprovados; controles pendentes não simulam funcionalidade.
10. **Limite:** não atribuir destino arbitrário a Ver no mapa/Ver todos/Ocorrências nem selecionar região como prova de presença.

### P14 — Upload seguro e consistência MinIO/SQL

1. **Objetivo:** pipeline de imagem validado e privado, reutilizável nos módulos aprovados.
2. **FSD:** 17, 17.0, 33, 37, 53, 59.
3. **Dependências:** P05, P11; estratégia técnica de compensação/limpeza revisada.
4. **Atividades:** integração S3-compatible com credencial restrita; magic bytes/decode, UUID, limite durante recebimento de 10 MB/20 MP; JPEG/PNG/WebP; re-encoding e EXIF removido da derivada; original privado; compensação SQL/MinIO e limpeza de órfãos auditável; autorização de acesso ao objeto.
5. **Arquivos/módulos:** integrações storage/images, services/schemas, metadados e testes.
6. **Testes:** MIME falso, SVG/HEIC/HEIF, malformado, traversal, bytes/pixels no limite e excedidos, EXIF, acesso cruzado, falhas em cada etapa/limpeza, objeto privado após rollback.
7. **Aceitação:** nenhuma publicação por mero upload, nenhum bucket público, sem objeto ativo inconsistente; falha de limpeza permanece segura e rastreável.
8. **Entregáveis:** serviço de imagem/storage e fluxo de compensação validado.
9. **Conclusão:** GC de upload/storage; testes reais com MinIO isolado.
10. **Limite:** não criar capacidade genérica de upload público nem publicação automática de rosto/placa/dado pessoal.

### P15 — Criação cidadã e duplicidade candidata

1. **Objetivo:** nova ocorrência cidadã íntegra e pendente de validação.
2. **FSD:** 16, 17.0, 24.0, 49–50, 53.
3. **Dependências:** P12, P14.
4. **Atividades:** duplicate-candidates e POST occurrence; sessão/ATIVO, usuário e ponto no município, até 3 km, categoria/subcategoria e foto única; transação ocorrência+ciclo+relato inicial+evidência+histórico; intenção durável de eventos e auditoria aplicável; idempotência/retry definidos antes de expor escrita.
5. **Arquivos/módulos:** camadas de criação/duplicidade, DTOs e testes.
6. **Testes:** 3 km/100 m, usuário/ponto fora, foto ausente/múltipla, categoria incompatível, candidato ativo da mesma categoria, resolvedora segue reabertura, falhas SQL/MinIO e retries concorrentes.
7. **Aceitação:** status PENDENTE_VALIDACAO, não publicado; sugestão não bloqueia nem funde; rollback SQL e compensação de objeto comprovados.
8. **Entregáveis:** API cidadã de criação e candidatos.
9. **Conclusão:** GC; nenhuma conclusão sem integridade transacional e testes negativos.
10. **Limite:** criação administrativa permanece bloqueada por D08; não dispensar evidência/geografia por papel.

### P16 — Relatos, edição, exclusão e denúncia de ocorrência

1. **Objetivo:** participação formal e manutenção própria dentro das janelas aprovadas.
2. **FSD:** 18, 21–23, 24.1, 49–51, 53.
3. **Dependências:** P15.
4. **Atividades:** confirmar/remover próprio relato, editar/excluir criação, denunciar falsa/incorreta; ownership, ciclo, estado, 3 km, janela de 12 h e validação anterior; impedir mudar localização; preservar terceiros; alerta único em 10 relatos sem validar; intenção durável de notificação quando aplicável.
5. **Arquivos/módulos:** reports/occurrence-updates/incorrect-reports, alertas e testes.
6. **Testes:** limites exatos antes/no/depois de 12 h, validação antes do prazo, IDOR, dois relatos simultâneos, unicidade ativa por ciclo, histórico único de pessoas, remoção com terceiros, denúncia pendente duplicada, alerta concorrente.
7. **Aceitação:** uma participação ativa por usuário/ciclo, foto não exigida em confirmação, remoção de confirmação por 12 h após ela; exclusão inicial não apaga coletividade; 10 não valida.
8. **Entregáveis:** APIs de participação e manutenção, auditadas conforme ação.
9. **Conclusão:** GC com integração PostGIS/constraints e fronteiras temporais.
10. **Limite:** não converter relato em comentário Social; não confundir janela de 12 h com TTL de sessão.

### P17 — Interface cidadã de ocorrências

1. **Objetivo:** fluxo integrado de denúncia e participação.
2. **FSD:** 16, 18, 20–23, 32, 53, 58.
3. **Dependências:** P13, P16; decisões visuais do módulo aprovadas antes de congelar apresentação.
4. **Atividades:** mapa completo separado da Home, busca/endereço, escolha do ponto/categoria/subcategoria, captura/upload, candidatos e envio; Eu também vi/remover, editar/excluir permitido, denunciar ocorrência; mostrar motivos de indisponibilidade e falhas sem fabricar sucesso.
5. **Arquivos/módulos:** frontend features occurrence-create/reports/my-occurrences, componentes mapa/formulário.
6. **Testes:** RTL/E2E desde seleção até PENDENTE_VALIDACAO, confirmação sem foto, janelas, banido, sem localização, envio repetido, falha de upload e acesso por teclado/mobile.
7. **Aceitação:** backend decide elegibilidade; usuário pode prosseguir apesar de candidato; validação encerra edição; nenhum item pendente publicado por UI.
8. **Entregáveis:** jornada cidadã ponta a ponta.
9. **Conclusão:** GC e testes com serviços reais isolados.
10. **Limite:** não adicionar vídeo, fila offline, mudança de ponto na edição ou navegação não aprovada.

### P18 — Moderação e máquina de estados

1. **Objetivo:** decisão humana com transições autorizadas e auditáveis.
2. **FSD:** 4.5–4.6, 9.9–9.10, 24.0–24.1, 25.1, 38–39, 49–50, 54.
3. **Dependências:** P16.
4. **Atividades:** fila/alertas; validar desde 1 relato, rejeitar/duplicar, editar escopo permitido, foto pública, remover pin, análise/resolução operacional; contrato das transições sem rota fixa antes de codificar; matriz exaustiva; arquivar/restaurar só ADMIN e guardar status anterior via migration nova se ausente; resolver/reabrir usam serviços concluídos em P19; registrar intenções de notificação duráveis sem envio externo em transação.
5. **Arquivos/módulos:** moderation/state-machine/audit, migration de estado anterior se necessária, contratos/testes.
6. **Testes:** todas as arestas permitidas/negadas da matriz pertinente, MODERADOR tentando arquivo, foto não aprovada, duplicidade humana, histórico/auditoria atômicos, falha de auditoria bloqueante, corrida arquivo/edição/restauração.
7. **Aceitação:** arquivo só de RESOLVIDA/REJEITADA/DUPLICADA e restaura estado salvo; ENCAMINHADA reservado; sem atalho de rejeitada para validada; 10 relatos não publica.
8. **Entregáveis:** APIs/fila e máquina de estados; arquivo/restauração com testes por fixtures de estado legítimas.
9. **Conclusão:** GC; resolução e reabertura ficam explicitamente para P19, sem rota funcional incompleta exposta.
10. **Limite:** D08 bloqueia criação administrativa; edição administrativa fora do escopo de moderação exige contrato da P28.

### P19 — Resolução e reabertura por ciclo

1. **Objetivo:** transições humana/comunitária com contadores corretos.
2. **FSD:** 9.6–9.7, 9.11, 24.0, 25–26, 49–50, 55–56.
3. **Dependências:** P18.
4. **Atividades:** votos/remover voto, sinalização de reaparecimento, resolução humana e reabertura humana; fechar/abrir ciclo, histórico/auditoria/intenção de notificar na unidade transacional; selo humano; deduplicar alertas e transições.
5. **Arquivos/módulos:** resolution/reopening/cycles em todas as camadas e testes.
6. **Testes:** 10.000/10.001 votos, 999/1.000 sinais, uma pessoa/ciclo, 3 km, remoção antes/depois do estado resolvido, duas transições concorrentes, mesmo cidadão em ciclos distintos; negação REABERTA→EM_RESOLUCAO direta.
7. **Aceitação:** 10.001 válidos resolve uma vez; 1.000 só alerta; apenas humano reabre para REABERTA criando um ciclo; no máximo um ciclo aberto; total histórico não soma pessoas repetidas.
8. **Entregáveis:** serviços/endpoints e provas de concorrência/limiares.
9. **Conclusão:** GC; todas as transições da matriz 24.0 cobertas em conjunto com P18.
10. **Limite:** retirar voto não reverte resolução; não reabrir automaticamente nem simular órgão externo.

### P20 — Interface de moderação e resolução

1. **Objetivo:** operar e acompanhar decisões com UX acessível e permissões reais.
2. **FSD:** 19, 24–26, 32, 54–56.
3. **Dependências:** P17, P19; apresentação aprovada para telas sem desenho final.
4. **Atividades:** filas, prioridades, evidências privadas autorizadas, histórico e decisões com justificativa; ações de resolução/reabertura para cidadãos e equipe; contagens por ciclo e total diferenciadas; arquivo/restauração somente ADMIN; rotas protegidas, MFA conforme política.
5. **Arquivos/módulos:** frontend features moderation/resolution/reopening, serviços e componentes de feedback.
6. **Testes:** E2E cidadão/MODERADOR/ADMIN/BANIDO, IDOR via requisição direta, justificativa, falha de servidor e atualização concorrente; foco e leitores de tela.
7. **Aceitação:** UI reflete estado persistido, alerta não equivale a validação/reabertura; ocultar botão não é único controle; selo somente conforme origem humana.
8. **Entregáveis:** jornadas de moderação e resolução integradas.
9. **Conclusão:** GC com testes de API associados aos E2E.
10. **Limite:** sem painel/ação extra não documentada; navegação depende de UX aprovada.

### P21 — Evoluções de persistência Social

1. **Objetivo:** preparar schema Social aprovado sem alterar a baseline.
2. **FSD:** 9.13, 10.3–10.5, 28–29, 49, 51.
3. **Dependências:** P14, P16.
4. **Atividades:** migrations novas de imagem opcional única, comentário pai de um nível, denúncias/moderação; validar constraints/status e limites 1000/500 no lugar apropriado; preservar vínculos existentes e privacidade; usar upload P14.
5. **Arquivos/módulos:** migrations 018+ Social e testes/repositories pertinentes.
6. **Testes:** clean/upgrade, uma imagem ativa, pai de outro post, resposta de resposta, duplicidade de relação, soft delete e dados existentes compatíveis.
7. **Aceitação:** integridade de replies e referências; sem objeto público por mudança de schema; 013 original intacta.
8. **Entregáveis:** schema Social evoluído e validado.
9. **Conclusão:** GC de migrations e segurança de dados/imagem.
10. **Limite:** não criar entidade de chat, recomendação ou campos de unfollow por suposição.

### P22 — Feed, posts, comentários, curtidas e seguir

1. **Objetivo:** APIs Social com autoria, limites e visibilidade.
2. **FSD:** 28.1–28.7, 38, 48–49, 57.
3. **Dependências:** P21.
4. **Atividades:** contratos das operações aprovadas; feed cronológico/paginado; post público ATIVO até 1000 chars, imagem opcional/ocorrência opcional, comentários/replies até 500, autoria para editar/apagar, likes únicos/removíveis, seguir perfil público; listas/perfis visíveis minimizados; intenção durável de notificar. Definir caminhos técnicos ausentes apenas para capacidades já aprovadas.
5. **Arquivos/módulos:** social nas camadas backend, integrações de imagem e testes.
6. **Testes:** privado consome/curte/comenta/segue mas não publica; BANIDO sem escrita; 1000/1001 e 500/501; reply único, IDOR, concorrência de likes/follows; imagem não autorizada, vínculo oculto, paginação.
7. **Aceitação:** conteúdo de perfil privado não exposto; like/follow não duplica; autor edita/remove próprio conteúdo conforme contrato; nenhuma rota/botão/teste positivo de unfollow enquanto D09 pendente.
8. **Entregáveis:** APIs Social e contratos sem ampliação de escopo.
9. **Conclusão:** GC, incluindo privacidade server-side em toda listagem.
10. **Limite:** post não conta como relato; sem vídeo, recomendação ou chat.

### P23 — Moderação Social e privacidade integrada

1. **Objetivo:** denúncias e decisão humana preservando privacidade e histórico.
2. **FSD:** 14.2, 28.3, 28.7, 29.0, 39, 51, 57.
3. **Dependências:** P18, P22.
4. **Atividades:** registrar denúncia de POST/COMENTARIO por motivos aprovados, fila, ocultar/remover ou encerrar motivadamente; auditoria e deduplicação; aplicar privacidade de perfil/seguidores e exclusão P10 a todas as estruturas novas; posts elegíveis reaparecem ao voltar a público, removidos não.
5. **Arquivos/módulos:** moderation/social, privacy/deletion, repositories e testes.
6. **Testes:** denúncia não remove automaticamente, ator sem permissão, decisões concorrentes, privacidade alternada, remoção permanente lógica, relações preservadas/ocultas, exclusão da conta com imagem/replies e histórico.
7. **Aceitação:** nenhuma exposição de denunciante/motivo interno indevido; sanção de conta só ADMIN; ocultação/remoção com justificativa e auditoria; não reexpor conteúdo removido.
8. **Entregáveis:** moderação Social e regressão de privacidade/exclusão.
9. **Conclusão:** GC e cenários P10 repetidos sobre schema Social final.
10. **Limite:** sem recurso de contestação/reversão de moderação ou unfollow não aprovado.

### P24 — Interface Social e perfis visíveis

1. **Objetivo:** consumo, publicação e moderação Social integrados.
2. **FSD:** 28–29, 32, 57.
3. **Dependências:** P20, P23; desenho do módulo validado sem inventar identidade.
4. **Atividades:** feed/compositor, imagem/vínculo opcionais, likes, comentários/reply único, edição/remoção própria, seguir, perfil público, denúncia e fila/ações Social para equipe; estados de privacidade/banimento/falha.
5. **Arquivos/módulos:** frontend features social/public-profile/social-moderation.
6. **Testes:** RTL/E2E de limites, perfis privados, likes/replies, denúncia→decisão, visibilidade após privacidade/exclusão, teclado/foco/zoom e mobile.
7. **Aceitação:** interface e API concordam; perfil privado não publica; nenhum botão unfollow ou reversão; texto Social não altera ocorrência.
8. **Entregáveis:** jornada Social e moderação ponta a ponta.
9. **Conclusão:** GC e testes de privacidade com dois usuários distintos.
10. **Limite:** somente funcionalidades aprovadas, sem menu extra por sugestão de mockup.

### P25 — Notificações duráveis e processamento

1. **Objetivo:** consolidar eventos, preferências e entrega resiliente.
2. **FSD:** 9.14, 10.6, 30.0, 39–40, 49–50.
3. **Dependências:** P19, P23.
4. **Atividades:** migrations de preferências/subscriptions e estruturas duráveis necessárias; consolidar intenção de e-mail P06 e eventos já produzidos por ocorrências/Social; notificação interna e intenção consistentes com domínio; trabalhador compatível com stack existente, sem Redis/RabbitMQ; deduplicação evento/destinatário/canal, até três tentativas totais com backoff parametrizado; APIs de listagem/leitura/preferência.
5. **Arquivos/módulos:** notifications/preferences/worker, migrations e integrações dos produtores.
6. **Testes:** reinício após commit/antes de envio, concorrência de consumidores, falha temporária/definitiva, terceira tentativa encerra, destinatário indevido, preferências sociais independentes, leitura de notificação alheia e retries sem duplicar interna.
7. **Aceitação:** intenção não se perde em reinício normal; envio externo fora de transação; falha externa não desfaz domínio; auditoria obrigatória continua bloqueante; incerteza de rede não promete exactly-once.
8. **Entregáveis:** processamento durável e API interna/preferências.
9. **Conclusão:** GC e cobertura de todos os eventos aprovados, sem tipos extras inferidos.
10. **Limite:** sem broker novo; agrupamento de curtidas só conforme contrato aprovado, sem algoritmo novo.

### P26 — Postmark e Web Push

1. **Objetivo:** concluir canais externos aprovados com opt-in e proteção de segredos.
2. **FSD:** 10.6, 30, 31.3, 34, 37, 41.1.
3. **Dependências:** P25 e D05 aprovada; credenciais segregadas e consentimento para testes externos reais.
4. **Atividades:** adaptador Postmark no transporte aprovado, mantendo Mailpit/SMTP local; VAPID privado no backend, inscrição/revogação autorizada, subscription inválida desativada; SW mínimo para recepção, sem cache amplo; preferências; exclusão de conta revoga subscriptions/intenção inelegível; rate limit/timeouts e erros minimizados.
5. **Arquivos/módulos:** integrações email/push, APIs push-subscriptions, SW receptor frontend e testes.
6. **Testes:** adapter local e controlado de produção, três tentativas, timeout, opt-out/revogação, associação cruzada, erro definitivo/subscription inválida, logout/exclusão, logs sem endpoint push/token e recebimento em navegador compatível.
7. **Aceitação:** push só opt-in; nenhum segredo no bundle; staging não dispara mensagem real de produção sem autorização; confirmação/reset/notificações operam no canal aprovado.
8. **Entregáveis:** canais de e-mail e push completos e evidências em staging.
9. **Conclusão:** GC, revisão de integrações e decisão D05 registrada.
10. **Limite:** não escolher SMTP/API por suposição nem exigir provider alternativo; offline/cache completo continua P30.

### P27 — Interface de notificações e preferências

1. **Objetivo:** acesso às notificações e controle de consentimento integrado.
2. **FSD:** 30, 31.3, 32.4, 61.1.
3. **Dependências:** P24, P26 e acesso visual às notificações aprovado em D06.
4. **Atividades:** listar/paginar e marcar lida/todas; preferências sociais separadas das importantes de ocorrência; solicitar push de forma opt-in e permitir revogação; estados compatíveis com suporte/permissão do navegador.
5. **Arquivos/módulos:** frontend features notifications/preferences/push, serviços/SW receptor.
6. **Testes:** RTL/E2E lida/ownership, preferência respeitada em novo evento, permissão negada/sem suporte, revogação e logout; acesso acessível sem alterar cabeçalho aprovado.
7. **Aceitação:** negar push não bloqueia uso do app; API persiste preferência; inexistência de ícone no topo não elimina acesso aprovado.
8. **Entregáveis:** central e preferências integradas.
9. **Conclusão:** GC e teste real de recepção suportada, sem tratar mock como prova de entrega.
10. **Limite:** não inventar posição final ou nova rota visual sem decisão de UX.

### P28 — Administração de contas e cadastros

1. **Objetivo:** gestão administrativa prevista com menor privilégio e auditoria.
2. **FSD:** 4.6, 27, 38–39, 47.0, 49–50.
3. **Dependências:** P19, P23.
4. **Atividades:** pesquisar/consultar usuários, banir/desbanir, promover/remover moderador, gerenciar categoria/subcategoria/modo, órgãos/canais e parâmetros; PATCH controla ativo conforme FSD; validar URLs/allowlists; verificar seeds iniciais de órgãos/canais e URLs oficiais; edição administrativa e consulta detalhada/auditoria só com contrato técnico prévio; criação administrativa aguarda D08; revalidar todas as sessões.
5. **Arquivos/módulos:** admin/accounts/catalog/organizations/channels/parameters, contratos e migrations novas apenas quando necessárias.
6. **Testes:** MODERADOR/BANIDO negados, CSRF/IDOR/mass assignment, privilégios em dois dispositivos, URL perigosa, parâmetro fora de faixa, impacto de desativação, auditoria atômica e concorrência.
7. **Aceitação:** só ADMIN ativo; MFA antes de produção; valores centralizados; canais não inventados; sem endpoint activate/deactivate adicional; edição não contorna regras comunitárias.
8. **Entregáveis:** APIs administrativas, dados de lançamento verificados e decisões bloqueadas identificadas.
9. **Conclusão:** GC; D08 pode manter somente criação administrativa pendente, impedindo marcar cobertura integral dessa operação.
10. **Limite:** nenhuma capacidade nova para órgão externo; sem autoatribuição de ADMIN por payload/provider.

### P29 — Indicadores, auditoria e interface administrativa

1. **Objetivo:** painel administrativo agregado e operação das APIs aprovadas.
2. **FSD:** 39, 46–48, 57/aceites adicionais.
3. **Dependências:** P27, P28.
4. **Atividades:** GET analytics/overview e consulta de auditoria minimizada/paginada com contrato prévio; todos os indicadores da tabela 46; períodos 7/30 padrão/90/customizado, distinguir estoque atual/eventos; interface de contas, cadastros, parâmetros, auditoria e indicadores; incluir criação administrativa somente após D08.
5. **Arquivos/módulos:** backend analytics/audit; frontend features admin/analytics; testes e consultas parametrizadas.
6. **Testes:** dataset controlado em vários períodos/status/ciclos, primeira validação, ocorrências únicas resolvidas/reabertas, bairro ausente, relatos ativos versus pessoas únicas, eventos de canal e Social, limites de data/TIMESTAMPTZ e fuso da plataforma; E2E de RBAC e cadastros.
7. **Aceitação:** todos os indicadores 46 conferem com fixture independente; 30 dias padrão apenas para eventos; auditoria/DTO sem segredo; sem exportação nem rastreamento individual.
8. **Entregáveis:** painel admin e contratos de cálculo verificáveis.
9. **Conclusão:** GC, revisão de queries/índices e validação da UI autorizada.
10. **Limite:** não confundir abertura de canal com protocolo; não inventar CSV/XLSX/PDF ou dashboard adicional.

### P30 — PWA, offline somente leitura e UX final

1. **Objetivo:** consolidar instalação, cache seguro e experiência multiplataforma.
2. **FSD:** 31–32, 48, 58, 61.1.
3. **Dependências:** P29; D06 para escolhas visuais finais necessárias.
4. **Atividades:** manifest/ícones/start URL/display; completar SW receptor P26 com política de cache restrita, atualização e limpeza privada no logout; shell/dados recentes em leitura offline, sem fila; revisar telas/estados/navegação, acessibilidade e responsividade; dark-first; Light Mode condicionado aos tokens aprovados, sem congelar valores provisórios.
5. **Arquivos/módulos:** manifest, SW, assets aprovados, styles/components/routes e testes frontend.
6. **Testes:** instalação em dispositivos compatíveis, navegador sem instalar, offline antes/depois de carga, nenhuma mutação enviada/enfileirada, troca de conta/logout, atualização de SW, push, teclado/leitor de tela/zoom/reduced motion/safe areas/teclado virtual e telas maiores.
7. **Aceitação:** nenhum conteúdo sensível cacheado indiscriminadamente; offline identificado como potencialmente desatualizado; dados privados limpos; todas as jornadas anteriores mantidas; PWA não exige instalação.
8. **Entregáveis:** PWA verificável, matriz de dispositivos/estados e evidências de acessibilidade.
9. **Conclusão:** GC; separar adaptação Light Mode ainda pendente da direção Dark aprovada e não declarar fechamento visual sem aprovação.
10. **Limite:** sem escrita offline, app nativo, nova identidade ou adaptação Light inventada.

### P31 — Observabilidade, backup e recuperação

1. **Objetivo:** operar com retenção, rastreabilidade e restauração comprovadas.
2. **FSD:** 39–41.1, 42.4–42.6, 59.
3. **Dependências:** P03, P26, P28; decisões operacionais D10/D11 quando necessárias.
4. **Atividades:** Grafana/Loki, logs estruturados e request ID existentes; retenções 7/30/90 dias; acesso restrito e contingência persistente aprovada para falha do coletor; backup local diário de PostgreSQL/MinIO/configuração, sete cópias protegidas/integridade, restore mensal e registro/alerta de falhas; estratégia de rotação dos segredos; sem Prometheus/Alertmanager obrigatório.
5. **Arquivos/módulos:** configurações de observabilidade/retention, scripts operacionais de backup/restore, runbooks e Compose operacional.
6. **Testes:** falha de Loki, disco cheio, consulta/retencão por categoria, ausência de segredo; backup consistente metadado/objeto, restauração em ambiente isolado, falha de backup/restore detectada; app sem privilégios desnecessários.
7. **Aceitação:** falha de telemetria não apaga auditoria crítica; sete backups íntegros conforme política configurada; exercício inicial de restore aprovado e agenda mensal definida; backup sem acesso HTTP; risco de VPS única documentado.
8. **Entregáveis:** observabilidade e runbooks de recuperação com evidências e responsabilidade operacional identificada.
9. **Conclusão:** GC; testes de recuperação não atingem volumes reais de produção nem ambiente do usuário.
10. **Limite:** sem provider de backup externo/PITR ou datasource de métricas não aprovado.

### P32 — Staging, hardening e validação integral

1. **Objetivo:** demonstrar prontidão do MVP em ambiente isolado antes da produção.
2. **FSD:** 35.1–35.3, 40–45, 52–59, 61–64.
3. **Dependências:** P30, P31; D07/D10/D11 e demais bloqueios de lançamento resolvidos; acesso operacional autorizado.
4. **Atividades:** staging na mesma VPS Hostinger, containers/banco/volumes/MinIO/buckets/secrets/subdomínio próprios; Debian 12 conforme FSD; Nginx, HTTPS/renovação conforme D10, trustProxy, segmentação e PoLP; somente portas públicas necessárias; ocultar versões/banners; WAF escolhido/aprovado com detection→tuning→E2E/ZAP→blocking; pipelines de deploy staging/smoke/E2E/DAST; revisar dados iniciais/canais, termos e documentação.
5. **Arquivos/módulos:** Compose de staging, Nginx/TLS, CI/CD de staging, configuração WAF aprovada, runbooks e relatório de aceite.
6. **Testes:** smoke/E2E completos, ZAP e casos de abuso específicos, scan de imagem/configuração, SEC-001–125; WAF com JSON/upload/coordenadas/texto/auth; isolamento staging/produção, renovação TLS, MFA privilegiado, restore e indisponibilidade de integração.
7. **Aceitação:** fluxos browser→API→PostGIS/MinIO→resposta comprovados; sem segredo/Critical, High conforme política; DB/MinIO sem Internet direta; staging sem envio real de produção não autorizado; todos os bloqueios funcionais para release resolvidos ou formalmente decididos sem falsa conclusão.
8. **Entregáveis:** staging validado, relatório de segurança/aceite e pacote de release revisável.
9. **Conclusão:** GC e revisão humana; não confundir build verde com aprovação de produção.
10. **Limite:** sem compartilhar secrets/dados/volumes entre ambientes; sem honeypot/tarpit/.env falso/rotação de portas.

### P33 — Release e produção aprovada

1. **Objetivo:** publicar somente versão validada e explicitamente autorizada.
2. **FSD:** 41–43, 45, 59, 61.2, 63.
3. **Dependências:** P32 e aprovação específica de deploy; esta aprovação é distinta da aprovação do plano.
4. **Atividades:** preparar versão/configuração/migrations aplicáveis e instruções de recuperação revisáveis antes de pedir aprovação de deploy; confirmar backups e restore, TLS/renovação, WAF, MFA, canais/URLs, textos jurídicos e isolamento; executar deploy aprovado, smoke e observação de health/readiness/logs; registrar resultado e procedimentos operacionais.
5. **Arquivos/módulos:** workflow de produção com gate de aprovação, configurações segregadas, notas de release e runbook.
6. **Testes:** gates CI/staging obrigatórios, smoke em produção autorizado sem dados pessoais artificiais públicos; verificação externa de exposição, TLS, acesso privilegiado e monitoramento; ensaio de recuperação previamente validado em staging.
7. **Aceitação:** aprovação registrada, release rastreável, disponibilidade e restrições conferidas, responsáveis operacionais definidos; migrations aplicadas controladamente, nunca auto-DDL em startup.
8. **Entregáveis:** release aprovada e evidências de operação.
9. **Conclusão:** GC completo e STATUS atualizado; incidente registrado com mitigação/rotação quando aplicável; não afirmar conclusão com bloqueios de lançamento pendentes.
10. **Limite:** sem deploy irrestrito por push, sem alteração destrutiva de banco para reverter código, sem ampliar MVP no lançamento.

## 5. Matriz de rastreabilidade do FSD

Os identificadores abaixo usam a numeração existente do FSD. Intervalos incluem todas as subseções do trecho, e os itens de aceite sem número próprio pertencem à seção anterior. As fases em “validação” repetem os testes aplicáveis, não adiam os testes da fase de implementação. Requisitos transversais aplicam-se também a cada fase que altere sua área, conforme GC.

| Requisito identificável do FSD | Implementação / tratamento | Validação observável |
|---|---|---|
| 1 — visão/PWA/São Paulo | P00, P11–P30 | P32: jornadas aprovadas; sem cidade extra |
| 2 — ocorrência/relato/post/comentário separados | P12, P15–P16, P22 | P16/P22: Social não altera relato/contagem |
| 3 — geografia/3 km/localização mínima | P11–P17, P19 | P11/P16/P19: PostGIS real e limites/bordas |
| 4.0 — RBAC/contexto, conta não verificada, revogação | P05–P08, P28 | P05/P06/P28/P32: dois dispositivos, privilégios atuais |
| 4.1–4.2 — papéis/ATIVO/BANIDO | P04–P05 | P05: enums físicos e negação por status |
| 4.3–4.4 — cidadão/banido em leitura e acompanhamento | P05, P12–P30, D15 para alcance de acompanhar | Cada API/UI: sucesso permitido e escrita negada; sem vínculo adicional inferido |
| 4.5 — moderador | P18–P20, P23–P24 | P20/P24: operações e auditoria |
| 4.6 — ADMIN/arquivo/restauração | P18, P28–P29 | P18/P29: MODERADOR negado; D08 para criar |
| 5.1–5.3 — arquitetura/camadas/estrutura | P00–P02, P09 | P03 e revisão de cada PR: SQL só Repository |
| 6 — runtime/dependências/lockfiles | P01–P03, P09 | npm ci/build/SCA nos dois apps |
| 7 — ambiente/secrets | P00–P03, P31–P33 | Gitleaks, índice/candidatos, bundles e logs |
| 8.1–8.3 — baseline/runner | P01 | Banco limpo e runner repetido sem reaplicar |
| 9.0 — físico versus conceitual/constraints | P01, todas as migrations | P01/P04/P11/P21/P25: SQL inspecionado e integrado |
| 9.1–9.2 — usuários/identidades | P04–P07, P10 | Auth/identidade reais, sem associação automática |
| 9.3–9.4 — categorias/status/REABERTA | P11, P18–P19 | Catálogo/estados conferidos com SQL, arestas negadas |
| 9.5–9.7 — ocorrência/ciclo/relato | P15–P16, P19 | Unicidade, ciclo aberto e total DISTINCT histórico |
| 9.8 — evidências | P14–P15, P18 | Imagem privada/derivada e publicação humana |
| 9.9–9.10 — histórico/moderação | P16, P18 | Auditoria/histórico atômicos e alertas deduplicados |
| 9.11 — votos/sinalização | P19 | 10001/1000 e concorrência por usuário/ciclo |
| 9.12 — órgãos/canais | P12, P28 | Canal conhecido/ausente e associações |
| 9.13 — Social | P21–P24 | Feed, autoria, relações, privacidade |
| 9.14 — notificações | P06, P25–P27 | Persistência/intenção/reinício/preferências |
| 9.15 — auditoria | P02, P05–P29, P31 | Falha bloqueia ação sensível; minimização/90 dias |
| 9.16 — parâmetros existentes | P11, P28–P29 | Valores/configuração centralizados e validados |
| 9.17 — views | P01, P12 | DTO/visibilidade e contagem por ciclo versus histórica |
| 10.1 — tokens | P04, P06 | Hash/consumo/expiração; D04 antes de concluir |
| 10.2 — subcategorias/modo | P11, P15, P28 | Relação correta e obrigatoriedade |
| 10.3 — imagem Social única | P21–P22 | Uma imagem ativa/limites/compensação |
| 10.4 — reply de um nível | P21–P22 | Resposta de resposta e pai cruzado negados |
| 10.5 — denúncia/moderação Social | P21, P23 | Fila/decisão humana motivada |
| 10.6 — preferências/push | P25–P27 | Opt-in, revogação, titularidade e exclusão |
| 10.7 — analytics de canal | P12, P29 | Abertura agregada sem protocolo |
| 10.8 — polígono oficial | P11 | Fonte/versão/SRID e ST_Covers real |
| 10.9 — parâmetro 100 m | P11, P15, P28 | 100 m igual/inferior/superior, sem merge |
| 11/11.0 — API/contrato/UUID/datas/paginação | P02 e cada módulo antes da rota | inject e contrato de cada endpoint |
| 12 — erro seguro | P02 e todos os endpoints | Envelope/código, sem stack/SQL/segredo |
| 13.1–13.3 — sessão/store/CSRF | P05 | Cookie, fixation, logout, TTL aprovado, CSRF |
| 13.4 — cadastro/aceites/sem sessão | P04, P06, P09 | Registro privado e confirmação antes de acesso |
| 13.5 — login/banido/revogação | P05–P06 | Duas sessões, privilégio atual e regeneração |
| 13.6 — Google/GitHub/vinculação | P07, P09 | Protocolo e takeover/consentimento |
| 13.7 — recuperação | P04, P06, P09, P26 | Antienumeração/token único/revogação de sessões |
| 13.8 — endpoints auth listados | P06–P07 | Contrato/inject para cada rota; E2E P09 |
| 13.9.1–13.9.2 — limites/cooldown/lockout | P05–P06, demais escritas | Abuso por origem/identidade, 429 e ausência de DoS permanente |
| 13.9.3 — MFA | P08–P10 | Bypass/replay/recuperação e privilégio em P32 |
| 14 e 14.1 — perfil/legais/aceites | P04, P06, P09–P10 | Checkboxes independentes, versão/data e links públicos |
| 14.2 — exclusão/localização | P10, P23, P26, P30 | Sem acesso/reidentificação/cache privado indevido |
| 15.1–15.5 — Home/consulta/card | P12–P13 | Raio/ordenação/filtro/paginação/dados/estados |
| 16.1–16.5 — denúncia/mapa/candidato/formulário | P11, P14–P17 | API+E2E localização/foto/transação/pendente |
| 17 e 17.0 — upload/compensação | P14–P15, P21–P22 | MIME/bytes/pixels/EXIF/órfão/privacidade |
| 18 — Eu também vi/remover | P16–P17 | Unicidade, 3 km, 12 h desde confirmação |
| 19 — detalhe/relatos/histórico | P12–P13 | Visibilidade, identidade oculta, dados do ciclo |
| 20 — minhas ocorrências | P12–P13, P17 | Criadas/confirmadas, filtros e titularidade |
| 21 — edição cidadã | P16–P17 | Ownership, 12 h/não validada, localização imutável |
| 22 — exclusão inicial | P16–P17 | Terceiros preservados e janela/validação |
| 23 — ocorrência falsa/incorreta | P16–P18 | Motivos, uma pendente por usuário/ocorrência |
| 24/24.0 — máquina exaustiva/fila/ações | P18–P20 | Toda aresta da matriz permitida/negada, auditoria |
| 24.0 — criação administrativa pendente | D08, P28–P29 após decisão | Sem habilitar/testar como aprovada enquanto aberta |
| 24.0 — ENCAMINHADA reservado | P12, P18–P19 | Abrir canal não altera status; transição operacional negada |
| 24.1 — alerta em 10 relatos | P16, P18 | Um alerta, sem publicação automática |
| 25.1 — resolver humano/selo | P19–P20 | Justificativa, ciclo fechado, selo pela origem |
| 25.2–25.3 — voto/remover/resolução automática | P19–P20 | 10000/10001, um voto/ciclo e sem reversão por retirada |
| 26.1–26.2 — sinalização/reabrir | P19–P20 | 999/1000 só alerta; humano abre novo ciclo |
| 27 — encaminhamento assistido | P12–P13, P28 | URL conhecida, mensagem sem canal, nova aba segura |
| 28.1–28.2 — post/feed | P21–P22, P24 | 1000 chars, imagem única, ocorrência opcional, cronológico |
| 28.3 — privacidade Social | P10, P22–P24 | Privatizar oculta; restaurar público só elegíveis |
| 28.4 — curtida | P22, P24 | Única/removível, corrida e BANIDO |
| 28.5–28.6 — comentário/reply | P21–P22, P24 | 500 chars, autoria, raiz/resposta único nível |
| 28.7 — seguir/privacidade de seguidores | P22–P24 | Destino público, próprio privado permitido, relações preservadas |
| 28.7 — deixar de seguir pendente | D09 | Ausência de rota/botão/efeito até decisão explícita |
| 29/29.0 — denúncias Social | P21, P23–P24 | Motivos/alvos, sem remoção automática/reversão inventada |
| 30/30.0 — notificações/worker | P06, P15–P29, P25 consolida | Cada evento aprovado, deduplicação/reinício/3 tentativas |
| 31.1 — instalação | P30 | Manifest/ícones/SW e instalação/navegador |
| 31.2 — offline/cache | P30 | Só leitura, sem fila, logout/atualização SW |
| 31.3 — push | P26–P27, P30 | Consentimento/revogação e recepção real suportada |
| 32.0–32.1 — direção visual/ativos | P09 e cada fase de UI | Dark-first, Sora, azul/amarelo, tokens não congelados |
| 32.2/32.2.1 — acessibilidade/componentes/estados | P09, P13, P17, P20, P24, P27, P29–P30 | RTL, teclado/leitor/zoom/toque/reduced motion |
| 32.3 — autenticação visual | P09 | Textos aprovados, layouts reais e sem barra autenticada |
| 32.4 — Home/navegação | P13, P27, P30 | Cabeçalho sem ícones extras, mini mapa, D06 |
| 33 — MinIO | P01, P14, P26, P31–P32 | Bucket/credencial/rede privados, persistência e restore |
| 34 — Mailpit/Postmark | P01, P06, P26 | Sem envio real local, transporte D05, token fora de logs |
| 35 — segurança HTTP | P02, P05 e cada endpoint, P32 | CORS/CSRF/CSP/headers/body limit/proxy |
| 35.1 — fingerprinting | P02, P32 | Sem versão/banner/stack/path desnecessário |
| 35.2 — WAF | P32 | Detection/tuning/E2E/ZAP antes de blocking |
| 35.3 — cyber deception fora do MVP | P00, P32 | Ausência de honeypot/tarpit/.env falso/rotação de portas |
| 36 — injection/saída | P02 e todas as consultas/UI | Parametrização/allowlist/escaping; sem shell/input avaliado |
| 37 — SSRF/URLs/integrações | P07, P11, P14, P26, P28 | Timeouts/limites, scheme/destino/redirect quando fetch dinâmico |
| 38 — IDOR/mass assignment | P05 e cada módulo | Dois usuários, papéis errados, DTO fechado |
| 39 — auditoria/retenção | Cada ação sensível, P29, P31 | Ator/alvo/justificativa e 7/30/90 dias segregados |
| 40/40.0 — observabilidade/continuidade | P02, P31 | Health/ready, Loki indisponível, contingência/disco cheio |
| 41 — backup | P31–P33 | Diário/sete cópias/integridade, restore inicial e mensal |
| 41.1 — rotação | P00, P31–P33 | Procedimento e exercício controlado, sem segredo no Git |
| 42.1 — desenvolvimento | P00–P03 | Reproduzir dev sem afetar volume existente |
| 42.2 — staging | P32 | Containers/dados/storage/secrets/domínio isolados |
| 42.3 — produção/TLS | P32–P33, D10 | HTTPS, renovação e aprovação de deploy |
| 42.4–42.6 — rede/PoLP/Zero Trust | P01–P02, P14, P31–P32 | Sem Internet→DB/MinIO, app não superuser/root indevido |
| 43 — CI/CD | P03, P32–P33 | Checks/scan/migrations e gates staging/produção |
| 44 e 44.1–44.1.2 — testes por feature | P02–P33 conforme execução | Vitest/inject/integração/RTL/E2E; negativos independentes |
| 45 — Security Gate | GC em P00–P33, consolidação P32 | SEC-001–100 e extensão 101–125; PASS/FAIL/N/A |
| 46 — analytics completos | P12, P29 | Todos os indicadores e períodos em dataset independente |
| 47/47.0 — contratos admin | P18, P28–P29 | Todos os endpoints listados; sem duplicar arquivo/restore |
| 48 — desempenho | P11–P29 | GiST/ST_DWithin/paginação, limites/queries sem N+1 |
| 49/49.0 — concorrência/idempotência | P15–P29 | Corridas de relato/voto/sinal/alerta/like/follow/estado/upload |
| 50 — transações criar/validar/resolver/reabrir | P15, P18–P19, P25 | Rollback SQL, compensação de objeto, intenção durável |
| 51 — soft delete/histórico | P10, P16, P18, P21–P23 | Histórico coletivo preservado sem reexpor pessoa removida |
| 52 — todos os aceites de identidade | P04–P10 | P09/P32: confirmação, OAuth, revogação/MFA e abuso |
| 53 — todos os aceites de ocorrência | P11–P17 | P17/P32: 3 km/município/foto/pendente/compensação |
| 54 — todos os aceites de moderação | P18–P20 | P20/P32: estados/1 relato/10 alerta/foto/auditoria/IDOR |
| 55 — todos os aceites de resolução | P19–P20 | P20/P32: 10001 e retirada sem reversão |
| 56 — todos os aceites de reabertura | P19–P20 | P20/P32: 1000 alerta, humano/REABERTA/novo ciclo |
| 57 — aceites Social e blocos adicionais de decisões/operação | P04–P31 | Módulos correspondentes e regressão P32, incluindo legais/TLS/backup/retries/admin |
| 58 — todos os aceites PWA | P09, P26, P30 | P30/P32: instalável, dark-first, offline/push/cache/logout |
| 59 — todos os aceites segurança | GC em cada fase, P31–P32 | Scans/abuso/MFA/PoLP/WAF/segredos/testes e revisão humana |
| 60/60.0 — sugestão de ordem/gates | Seção 3 deste plano, P00 | DAG verificado; justificativa de Auth antecipada; aprovação do plano |
| 61.1 — pendências visuais | D01/D06, fases de UI | Não inferir navegação/tokens/ativos finais |
| 61.2 — textos jurídicos | D07, P04, P09–P10, P32 | Registros implementados; conteúdo aprovado antes de release |
| 61.3 — parâmetros internos | Contrato do módulo, GC | Configuração e testes sem mudar políticas ou providers |
| 61.4 — bloqueios por módulo | Seção 6 deste plano | Decisão necessária registrada antes da parte afetada |
| 61.5 — contrato mínimo/grupos/erros | Seção 2 e cada fase de API | Contrato revisto antes de endpoint; inject positivo/negativo |
| 61.6 — rastreabilidade/aceite | Esta matriz e GC | Cenários Dado/Quando/Então por regra e evidências |
| 62 — exclusões do MVP | P00 e revisão de cada fase | Nenhuma capacidade excluída adicionada |
| 63 — Definition of Done | GC em toda fase | Sem conclusão só por build/happy path |
| 64 — precedência e mudanças controladas | D02, GC | Divergência não resolvida silenciosamente |

**Cobertura:** todas as seções 1–64 e suas subseções identificáveis possuem responsável acima. Os aceites adicionais dentro da seção 57 são transversais e foram distribuídos explicitamente. Requisito bloqueado não é requisito excluído: D03/D04/D05/D06/D07/D08/D09 continuam rastreados e impedem concluir a parte afetada até decisão. Não existe fase de implementação para capacidades expressamente excluídas em 62; existe verificação de sua ausência.

## 6. Pendências e divergências que exigem decisão

| ID | Evidência / situação | Parte afetada | Conduta e condição de desbloqueio |
|---|---|---|---|
| D01 | PRD/FSD em subpastas; DESIGN ausente; AGENTS vazio | P00 e fechamento visual | Confirmar localização oficial; disponibilizar/aprovar referência visual controlada. Não mover/duplicar fonte por suposição. Planejamento usa os arquivos existentes e os itens visuais aprovados consolidados no FSD. |
| D02 | DT 43 prioriza PRD funcional/DT técnica; FSD 64 declara precedência interna; PRD ainda cita REABERTA pendente e mapas genéricos, FSD/DT consolidam REABERTA/MapLibre/MapTiler | Qualquer conflito efetivo | Para o plano, conservar tecnologias DT e requisitos aprovados do FSD, sem substituir origem. Registrar ratificação de precedência e divergência concreta antes de implementar parte conflitante; não usar plano como emenda do PRD. |
| D03 | FSD 13.2: store, timeout e renovação não definidos | P05 e conclusão Auth | Decisão técnica explícita; não escolher store PostgreSQL nem TTL numérico por inferência; memória exclusiva proibida em produção. |
| D04 | FSD 13.4/13.7: Argon2id, 12–128 chars e 24 h/30 min são propostas | P06 | Aprovar limites, algoritmo/custo e prazos; mesmos parâmetros no cadastro/reset. |
| D05 | DT 12/FSD 34: Postmark SMTP versus API em aberto | P26 | Aprovar transporte e adaptador; Mailpit SMTP local já permitido. |
| D06 | FSD 32/61.1 e Home em revisão: navegação, notificações, localização ausente, tokens/ativos/responsividade/Light | P09/P13/P17/P20/P24/P27/P29/P30 conforme interação | Responsável de UX aprova itens necessários por módulo; não inventar rota/destino nem congelar tokens provisórios; não bloqueia backend independente. |
| D07 | FSD 14.1/61.2: textos legais/bases/links/versões finais pendentes | Publicação das telas legais e lançamento | Aprovação jurídica/editorial; preservar desde P04 estrutura de versão/aceite/ciência; não criar texto legal como se aprovado. |
| D08 | FSD 24.0/61.4: criação ADMIN autorizada em papel, contrato de estados/geografia/foto/relato ausente | Criação administrativa em P28–P29 e aceite integral dessa operação | Aprovação funcional do contrato e atualização controlada do FSD pela equipe; não disponibilizar fluxo provisório. Edição administrativa tem permissão, mas exige contrato técnico das operações já aprovadas antes da rota. |
| D09 | PRD/FSD 28.7: deixar de seguir não definido | Somente unfollow Social | Sem rota, botão, remoção de vínculo ou teste como funcionalidade aprovada; decisão funcional expressa e FSD atualizado antes de incluir execução. Seguir pode avançar. |
| D10 | FSD 41/42.3 chama aprovados backup diário/sete cópias/restore mensal e Debian 12/Let's Encrypt/Certbot; DT 20/41 mantém ferramenta de backup e detalhes TLS não fixados | P31–P33 | Ratificar consolidação operacional do FSD e registrar decisão técnica controlada antes de instalar/configurar ferramentas. Não substituir Nginx, VPS, backup local nem política já expressa no FSD; não escolher ferramenta adicional por conveniência. |
| D11 | WAF específico e mecanismo de contingência/coleta de logs não escolhidos | P31–P32 | Decisão operacional aprovada e testada, sem tornar Prometheus/Alertmanager obrigatórios; staging, tuning e ZAP antes de blocking. |
| D12 | SQL 017: `total_relatos` conta ciclo atual; FSD 9.7 separa esse valor de pessoas históricas únicas | P12/P19/P29 | Repositories/DTOs com semânticas explícitas, DISTINCT histórico e testes de múltiplos ciclos; se alterar view, somente migration nova. É diferença de semântica a tratar, não autorização de editar 017. |
| D13 | Runtime local observado Node 24.11.0 versus Node 26 aprovado | P01–P03 | Preparar/verificar Node 26 e dependências compatíveis após aprovação; não trocar decisão técnica para acomodar máquina atual. |
| D14 | CI depende de acesso ao GitHub; staging/produção, chaves MapTiler/OAuth/Postmark/VAPID e fonte oficial geográfica exigem configuração controlada | Fases de integração/CI/operação pertinentes | Obter os acessos necessários por canal seguro, com secrets separados; nunca gravá-los no plano, ERROS, commit ou logs. Disponibilidade não foi comprovada nesta etapa documental. |
| D15 | FSD 1/4.3 cita acompanhar ocorrências; 19/20 detalham consulta e participação, sem contrato de ação ou vínculo de acompanhamento independente | Somente eventual controle de acompanhar em P12/P13/P17 | Confirmar se o acompanhamento é atendido por detalhes/minhas ocorrências ou se exige contrato funcional adicional aprovado. Não inventar assinatura, tabela, endpoint ou evento; consultas aprovadas podem avançar. |

**Perguntas de decisão para aprovação:** confirmar fontes/localização visual e precedência D01/D02; ratificar D10 ou manter a implantação correspondente bloqueada; decidir D03/D04 antes de Auth e D05 antes do e-mail de produção; encaminhar D06/D07/D08/D09/D11 aos responsáveis. Aprovar o plano não resolve automaticamente essas decisões nem autoriza preencher propostas silenciosamente. Se a equipe decidir manter alguma funcionalidade pendente fora do release, registrar a decisão explicitamente; a IA não reduz o escopo para declarar MVP concluído.

## 7. Revisão crítica e primeira fase

| Verificação do planejamento | Resultado |
|---|---|
| Cobertura integral do FSD | Seções 1–64 mapeadas; subseções e blocos adicionais de aceite incluídos; pendências com fase/gate, exclusões com controle de ausência |
| Fases sem justificativa | Nenhuma; cada fase cita FSD e entregável aprovado. Operação/release derivam de 35–45/59/63 |
| Ordem técnica | Auth/RBAC antes da exposição de leitura; schema antes de Repository; upload antes de criação; produtores antes de consolidação de entrega externa; staging antes de produção |
| Ciclos de dependência | Nenhum: dependências apontam somente para IDs anteriores; P11 e P14 são ramos independentes quando liberados |
| Granularidade | 34 unidades verificáveis, com possibilidade de PRs menores dentro da mesma fase e sem ampliar escopo |
| Critérios verificáveis | Limites numéricos aprovados, estados, DTOs, banco real, negativos, concorrência, E2E e evidências operacionais definidos por fase |
| Tecnologias | Somente stack aprovada; plugins/bibliotecas auxiliares verificados no início do módulo; decisões abertas preservadas |
| Testes | Mesma entrega da mudança executável; banco/PostGIS reais quando regra depende deles; revisão humana não substituída por teste gerado por IA |
| Contradições | D01/D02/D10 registradas sem alterar especificações; somente parte afetada bloqueada |
| Ausência de código nesta execução | Apenas PLANO e registro mínimo de STATUS; nenhuma dependência instalada, migration aplicada, aplicação/infra criada ou deploy realizado |

**Verificação estrutural executada nesta entrega:** 34 IDs de fase únicos, 34 linhas de dependências, dez campos por fase, dependências somente para fases anteriores, cobertura das seções numeradas 1–64 e links Markdown locais existentes. Comparação SHA-256 confirmou que AGENTS, PRD, FSD, decisões técnicas e referências visuais não foram modificados. Isso valida a organização do plano; testes de aplicação, migrations e infraestrutura ainda não foram executados nem declarados aprovados.

**Primeira fase recomendada após aprovação explícita:** P00 — Preparação documental, Git e estrutura. P01 vem em seguida para validar ambiente/baseline; P02 inicia a fundação executável. Até a aprovação, manter todas as fases como não iniciadas. Este arquivo é o plano proposto, não uma autorização de implementação ou produção.
