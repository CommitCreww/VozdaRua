# Instruções de desenvolvimento — Voz da Rua

## Escopo e fontes obrigatórias

- Antes de cada tarefa, consultar [PLANO](docs/PLANO.md), [STATUS](docs/STATUS.md), [ERROS](docs/ERROS.md), [PRD](docs/PRD/prd.md), [decisões técnicas](docs/DECISOES_TECNICAS.md) e, obrigatoriamente, o [FSD](docs/FSD/FSD.md) da área afetada.
- A referência visual disponível está em [docs/frontend/Desing.md](docs/frontend/Desing.md); consultar também [Home](docs/frontend/Home.md). Respeitar APROVADO/PROPOSTO/PENDENTE. O índice de caminhos vigentes e as ressalvas estão em [PREPARACAO](docs/PREPARACAO.md).
- PRD define requisitos funcionais; DECISOES_TECNICAS define tecnologias aprovadas; FSD detalha contratos e regras; Design orienta apresentação aprovada. As regras de precedência DT §43 e FSD §64 divergem: registrar conflito concreto e interromper somente a parte afetada, sem escolher silenciosamente outra regra.
- Não adicionar funcionalidades, provedores, regras, dependências ou decisões fora das especificações. Não implementar itens expressamente pendentes ou fora do MVP (FSD §§61–62).
- Executar somente a fase explicitamente autorizada. A autorização de P00 não autoriza P01, deploy ou resolução das decisões abertas. Não alterar escopo/ordem do PLANO ou documentos aprovados por inferência.

## Stack e arquitetura

Conforme DECISOES_TECNICAS §§2–4 e FSD §§5–8:

- Backend: Node.js **26 LTS**, TypeScript, Fastify, build por `tsc`, npm, driver `pg`, REST/JSON. Não substituir a stack nem introduzir ORM por conveniência.
- Frontend separado: React, TypeScript, Vite; PWA mobile-first. MapLibre GL JS e MapTiler; autoridade espacial é PostgreSQL 17/PostGIS 3.6, com pgcrypto.
- Routes declaram rotas/hooks e encaminham; Controllers tratam HTTP/DTOs; Services implementam domínio, autorização contextual e transações; Repositories executam SQL parametrizado. Controller não executa SQL; rota não contém regra de negócio.
- Schemas validam formato/tipo/tamanho; não substituem regras do Service. DTOs explícitos de entrada/saída; não expor linhas brutas ou campos internos do banco.
- Usar a estrutura do FSD §5.3. Definir contratos conforme FSD §§11.0 e 61.5 antes de codificar cada endpoint. Respeitar rotas já especificadas, prefixo `/api/v1`, UUID, ISO-8601 e envelope de erro do FSD §12.
- Migrations SQL são a fonte de verdade. Nunca editar 001–017 ou migration aplicada/compartilhada; evoluções em **018+**, conferindo o último número integrado. Não criar schema automaticamente no startup/runtime. Seed dev separado.
- Verificar nomes/constraints no SQL físico antes de escrever Repository. PostgreSQL/PostGIS real decide município, distâncias e unicidade; não confiar no frontend/geocoder.

## Segurança e privacidade

Conforme DECISOES_TECNICAS §§5–13, 22–29, 35–37 e FSD §§13, 17, 35–45:

- Negar por padrão; backend valida sessão, papel, status atual, ownership e contexto. UUID e botão oculto não autorizam. BANIDO permanece em leitura independentemente do papel. Conta local não verificada não recebe sessão da aplicação.
- Sessão server-side, cookie HttpOnly/Secure em produção/SameSite adequado; CSRF nas mutações por cookie; regeneração/revogação/timeout; nenhum token de autenticação em localStorage/sessionStorage. Store e durações exigem decisão documentada; memória exclusiva é proibida em produção.
- SQL sempre parametrizado, identificadores dinâmicos com allowlist; não avaliar input como código nem enviá-lo diretamente a shell. Escaping React; não usar HTML não confiável sem sanitização revisada.
- Validação de entrada, limites de body/paginação, rate limiting multicamada, cooldown temporário e CORS explícito; erros sem stack, SQL, paths internos ou segredo. Configurar trustProxy somente para o proxy esperado.
- Upload: JPEG/PNG/WebP, até 10 MB/20 MP, magic bytes/decode, UUID no servidor, original privado no MinIO, derivada re-encodada sem EXIF, publicação conforme moderação. Testar compensação de falha entre MinIO e SQL.
- Não versionar `.env`, senhas, tokens, segredos OAuth/Postmark/MinIO/VAPID/sessão/deploy, chaves privadas, dumps ou backups reais. Versionar apenas exemplos sem segredos. Não imprimir valores sensíveis em logs/documentação. Segredo exposto exige rotação, não somente remoção do Git.
- Não persistir histórico contínuo de localização; minimizar dados pessoais. Respeitar privacidade de perfil e exclusão/anonimização do FSD.
- Offline é somente leitura: não enfileirar mutações. Cache sensível restrito, com limpeza aplicável no logout. Push opt-in e revogável.
- Produção: Nginx/HTTPS, PostgreSQL e MinIO internos, credenciais com menor privilégio, ambientes segregados; app não usa superusuário. MFA obrigatório para moderador/admin antes de operar em produção. Não adicionar honeypot, tarpit ou `.env` falso.

## Convenções e dependências

- TypeScript e contratos explícitos; nomes físicos existentes preservados. Centralizar parâmetros aprovados; não espalhar números mágicos ou URLs de canais na regra de negócio (DT §§32–34).
- Usar UTF-8; respeitar `.gitattributes`, especialmente LF em scripts Linux. Não renormalizar migrations históricas para corrigir estilo.
- npm com `package-lock.json` versionado por aplicação; CI usa `npm ci`. Antes de instalar, verificar existência, origem oficial, manutenção, compatibilidade e necessidade da dependência (DT §25).
- Bibliotecas de sessão, OAuth, validação, CSRF e limites só são selecionadas no módulo pertinente e após Security Gate. Não transformar propostas de senha/TTL ou transporte Postmark em decisão aprovada.
- Direção visual dark-first, Sora, azul-marinho/amarelo; componentes HTML acessíveis. Não congelar tokens/ativos/rotas visuais pendentes nem usar imagem de formulário como interface.

## Testes e conclusão

- Toda alteração de comportamento executável inclui testes aplicáveis na mesma entrega (DT §39.1; FSD §44.1). Bugfix reproduz a falha antes da correção quando viável.
- Backend: Vitest, `fastify.inject()` para HTTP, Testcontainers com PostgreSQL/PostGIS real para SQL, constraints e geografia. Não substituir regra espacial por mock.
- Frontend: Vitest, React Testing Library e Playwright. Testar acessibilidade, estados, sucesso/erro/acesso negado e jornadas integradas.
- Derivar negativos do FSD/Security Gate: sessão ausente, papel incorreto, outro usuário/IDOR, payload/estado/limite inválidos e concorrência/replay quando pertinente. Teste gerado pela mesma IA não substitui revisão humana.
- Revisar [Security Gate SEC-001–125](docs/FSD/SECURITY_GATE_100.md) por aplicabilidade, marcando PASS/FAIL/N/A com justificativa. Critical, segredo real e falha de autorização bloqueiam; High bloqueia salvo exceção formal.
- Gates de CI aprovados incluem CodeQL, Semgrep, npm audit, Trivy, Gitleaks, Dependabot e Dependency-Check quando aplicável; ZAP em staging. Não declarar scanner ou ambiente indisponível como aprovado.
- Documentação/estrutura sem comportamento executável pode justificar N/A para testes de aplicação. Configurações devem receber verificações próprias; migrations exigem banco limpo e integração aplicável.
- Mudanças sensíveis exigem revisão humana reforçada antes de merge/release. Deploy de produção exige aprovação específica e staging validado.

## Versionamento e progresso

- Features relevantes chegam por Pull Request (DT §38). Informar alterações, migrations/endpoints, impacto de segurança/SEC, testes e configuração aplicáveis.
- Preservar trabalho local preexistente. Não executar reset/clean forçado, apagar volumes, reescrever histórico ou fazer commit/push automaticamente sem autorização correspondente.
- Não inventar padrão obrigatório de branch/commit: ainda não há convenção aprovada. Não autoaprovar atualizações major/runtime/segurança.
- **Atualizar `docs/STATUS.md` em toda entrega**, com fase, trabalho executado, verificações, limitações e pendências; não marcar teste não executado como PASS.
- **Registrar problemas e erros em `docs/ERROS.md`**, com impacto, tratamento e estado, sem segredos. Interromper só a parte realmente bloqueada; manter independentes em andamento dentro da fase autorizada.
