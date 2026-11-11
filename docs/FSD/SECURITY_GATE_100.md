# SECURITY GATE — VOZ DA RUA

Este checklist é parte obrigatória das decisões técnicas do projeto.

### A. Controle de acesso e autorização

- [ ] **SEC-001** — Todo endpoint privado nega acesso por padrão e exige autenticação explicitamente.
- [ ] **SEC-002** — Todo endpoint administrativo valida papel ADMIN no backend, nunca apenas na interface.
- [ ] **SEC-003** — Todo endpoint de moderação valida MODERADOR ou ADMIN no backend.
- [ ] **SEC-004** — Operações em recursos do cidadão validam ownership; possuir o UUID do recurso não concede acesso.
- [ ] **SEC-005** — Testar IDOR/BOLA trocando IDs/UUIDs entre dois usuários distintos.
- [ ] **SEC-006** — Usuário BANIDO é bloqueado em todas as operações de escrita, inclusive endpoints novos.
- [ ] **SEC-007** — DTOs de update não permitem mass assignment de papel, status, owner, timestamps ou campos administrativos.
- [ ] **SEC-008** — Listagens e buscas retornam apenas registros que o solicitante pode visualizar.
- [ ] **SEC-009** — Endpoints não documentados/internos não ficam acessíveis por force browsing.
- [ ] **SEC-010** — Mudanças de privilégio (promover moderador, banir/desbanir) exigem autorização explícita, auditoria e regeneração de sessão.

### B. Autenticação, sessão, OAuth e CSRF

- [ ] **SEC-011** — Senha nunca é armazenada ou logada em texto puro; somente hash adaptativo aprovado.
- [ ] **SEC-012** — Login possui rate limit e proteção contra credential stuffing/brute force.
- [ ] **SEC-013** — Cadastro, reenvio de confirmação e recuperação de senha possuem rate limit.
- [ ] **SEC-014** — Respostas de recuperação não permitem enumeração de contas por e-mail.
- [ ] **SEC-015** — Tokens de confirmação/reset são aleatórios, de uso único, expirados e armazenados em forma não reutilizável (hash).
- [ ] **SEC-016** — Sessão usa cookie HttpOnly, Secure e SameSite; nenhum token de autenticação fica em localStorage/sessionStorage.
- [ ] **SEC-017** — ID de sessão é renovado após login e após mudança de privilégio para impedir session fixation.
- [ ] **SEC-018** — Logout invalida a sessão no servidor, não apenas remove o cookie no navegador.
- [ ] **SEC-019** — Operações mutáveis protegidas por cookie possuem proteção CSRF efetiva e testada.
- [ ] **SEC-020** — OAuth/OIDC valida state, nonce quando aplicável, redirect URI, issuer/audience e não confia em dados não verificados do provedor.

### C. Injection, execução e saída insegura

- [ ] **SEC-021** — SQL/JPQL/native queries usam parâmetros; nunca concatenar input em consulta.
- [ ] **SEC-022** — Sort, coluna, nome de tabela ou fragmentos estruturais dinâmicos usam allowlist fixa.
- [ ] **SEC-023** — Entrada do usuário nunca é passada diretamente a shell, Runtime.exec ou ProcessBuilder sem necessidade e allowlist.
- [ ] **SEC-024** — Não executar código, script, expressão ou template vindo de usuário/arquivo externo.
- [ ] **SEC-025** — Prevenir XSS armazenado escapando/encodando saída conforme contexto.
- [ ] **SEC-026** — Prevenir DOM XSS: não inserir texto não confiável via innerHTML/dangerouslySetInnerHTML sem sanitização revisada.
- [ ] **SEC-027** — Headers HTTP, e-mail e logs não recebem conteúdo não confiável sem tratamento contra CRLF/log injection.
- [ ] **SEC-028** — Dados importados/externos são tratados como não confiáveis mesmo quando vêm do próprio banco.
- [ ] **SEC-029** — Não desserializar objetos polimórficos/tipos arbitrários controlados pelo cliente.
- [ ] **SEC-030** — Qualquer parser XML, caso introduzido, deve desabilitar XXE/DTD externos por padrão.

### D. SSRF, URLs, rede e redirects

- [ ] **SEC-031** — Qualquer URL fornecida por usuário é validada antes de requisição server-side.
- [ ] **SEC-032** — Bloquear requisições server-side para localhost, loopback, link-local e redes privadas quando não forem requisito.
- [ ] **SEC-033** — Bloquear acesso a metadata services/cloud metadata por SSRF.
- [ ] **SEC-034** — Permitir apenas esquemas necessários, normalmente https; rejeitar file:, ftp:, gopher: e esquemas inesperados.
- [ ] **SEC-035** — Resolver e validar destino após DNS para reduzir DNS rebinding quando houver fetch server-side.
- [ ] **SEC-036** — Revalidar destino após redirects; redirect não pode escapar da allowlist/regras de rede.
- [ ] **SEC-037** — Definir connect/read timeout em toda chamada HTTP externa.
- [ ] **SEC-038** — Limitar tamanho máximo de resposta de integrações externas.
- [ ] **SEC-039** — Open redirect é proibido; destinos de redirect devem ser internos/allowlisted.
- [ ] **SEC-040** — Webhooks futuros devem validar autenticidade/assinatura e não confiar apenas em IP/origem declarada.

### E. Arquivos, paths e uploads

- [ ] **SEC-041** — Nome original do arquivo nunca é usado como caminho de armazenamento; gerar chave UUID.
- [ ] **SEC-042** — Rejeitar path traversal como ../, caminhos absolutos, separadores e variantes codificadas.
- [ ] **SEC-043** — Validar MIME real/magic bytes e não confiar apenas em extensão ou Content-Type enviado.
- [ ] **SEC-044** — Permitir somente formatos explicitamente aprovados; todo o resto é rejeitado.
- [ ] **SEC-045** — Aplicar limite de bytes antes e durante o upload, evitando upload gigante.
- [ ] **SEC-046** — Aplicar limite de dimensões/pixels após decode para evitar image/decompression bombs.
- [ ] **SEC-047** — Imagem pública é decodificada e re-encodada antes de servir; metadados EXIF são removidos da derivada pública.
- [ ] **SEC-048** — Objeto original fica privado; acesso ocorre por backend ou URL assinada curta, nunca bucket público irrestrito.
- [ ] **SEC-049** — Uploads nunca são executáveis nem servidos com MIME controlado pelo usuário.
- [ ] **SEC-050** — Se ZIP/arquivo compactado for introduzido futuramente, validar Zip Slip, symlinks, profundidade e decompression bombs.

### F. Validação, lógica de negócio, concorrência e fail-open

- [ ] **SEC-051** — Bean Validation valida formato/tamanho, mas regras de negócio também são verificadas no Service.
- [ ] **SEC-052** — Regra de 3 km é recalculada no backend/PostGIS; valor de distância vindo do cliente é ignorado como autoridade.
- [ ] **SEC-053** — Limite municipal é validado no backend contra polígono oficial, não pelo texto cidade=São Paulo.
- [ ] **SEC-054** — Duplicidade de 100 m é apenas candidata; não permitir que cliente force fusão/duplicidade.
- [ ] **SEC-055** — Unicidades críticas usam constraint no banco além da verificação em código.
- [ ] **SEC-056** — Operações críticas são transacionais e não podem deixar estado parcial.
- [ ] **SEC-057** — Testar race condition em Eu também vi, voto, curtida, follow, resolução e criação de alertas.
- [ ] **SEC-058** — Endpoints mutáveis relevantes possuem estratégia de idempotência/constraint para retries.
- [ ] **SEC-059** — Falha de validação externa ou indisponibilidade deve falhar fechado quando segurança/integridade depender dela.
- [ ] **SEC-060** — Parâmetros de negócio recebidos do cliente (papel, status, contadores, datas de sistema) nunca substituem valores calculados pelo servidor.

### G. Segredos, criptografia e dados sensíveis

- [ ] **SEC-061** — Nenhum segredo, senha, token, chave privada ou credential pode ser commitado no Git.
- [ ] **SEC-062** — .env real fica fora do repositório; somente .env.example sem segredos é versionado.
- [ ] **SEC-063** — CI executa secret scanning e bloqueia merge quando detectar segredo real.
- [ ] **SEC-064** — Segredo vazado deve ser rotacionado; apenas remover do commit não é considerado correção suficiente.
- [ ] **SEC-065** — HTTPS é obrigatório em produção e HTTP redireciona para HTTPS.
- [ ] **SEC-066** — Não criar criptografia caseira; usar bibliotecas e algoritmos amplamente revisados.
- [ ] **SEC-067** — Randomness de tokens/identificadores de segurança usa CSPRNG.
- [ ] **SEC-068** — Dados sensíveis não aparecem em URL/query string quando podem parar em histórico/referrer/log.
- [ ] **SEC-069** — Backups e secrets de produção têm acesso restrito e não podem ficar publicamente acessíveis.
- [ ] **SEC-070** — Logs e auditoria aplicam minimização: nunca senha, token completo, cookie, VAPID private key ou chave de object storage.

### H. Frontend, PWA e segurança do navegador

- [ ] **SEC-071** — Service Worker nunca intercepta/cacheia respostas autenticadas sensíveis de forma ampla ou permanente.
- [ ] **SEC-072** — Cache offline deve respeitar a regra do MVP: leitura; mutações offline não são enfileiradas.
- [ ] **SEC-073** — Atualização do Service Worker não pode manter indefinidamente versão vulnerável por Cache-Control incorreto.
- [ ] **SEC-074** — CSP deve restringir script-src/connect-src/img-src/frame-ancestors aos domínios realmente necessários.
- [ ] **SEC-075** — CORS usa origens explícitas; nunca '*' junto com credenciais.
- [ ] **SEC-076** — Aplicação não confia em hidden fields, disabled inputs ou estado React para autorização/regra de negócio.
- [ ] **SEC-077** — postMessage, se utilizado, valida origin e formato da mensagem.
- [ ] **SEC-078** — Links externos sensíveis usam rel=noopener/noreferrer quando aplicável e não permitem opener abuse.
- [ ] **SEC-079** — Push subscription endpoint é tratado como segredo/capability URL e não aparece em logs públicos.
- [ ] **SEC-080** — Dados pessoais/localização não são colocados em cache PWA além do estritamente necessário e devem possuir estratégia de limpeza no logout.

### I. Supply chain, dependências e código gerado por IA

- [ ] **SEC-081** — Toda nova dependência sugerida por IA deve existir de fato e ser verificada no repositório oficial antes de instalar (anti-slopsquatting).
- [ ] **SEC-082** — Preferir dependências mantidas, conhecidas e necessárias; evitar pacote para função trivial.
- [ ] **SEC-083** — Lockfiles são obrigatórios e versionados para frontend e ferramentas.
- [ ] **SEC-084** — Dependências Maven/Node são verificadas por SCA antes do merge.
- [ ] **SEC-085** — Dependência com CVE Critical/High bloqueia merge salvo exceção documentada e temporária.
- [ ] **SEC-086** — GitHub Actions de terceiros devem ser oficiais/confiáveis e versões devem ser fixadas de forma controlada.
- [ ] **SEC-087** — Imagens de container devem usar tags suportadas e passar por scan de CVE/misconfiguration.
- [ ] **SEC-088** — Não executar automaticamente scripts, MCPs, plugins ou comandos sugeridos por IA sem revisão do que será executado.
- [ ] **SEC-089** — Revisar mudanças geradas por IA em autenticação, migrations, CI/CD, Docker, Nginx, secrets e permissões com atenção reforçada.
- [ ] **SEC-090** — Atualizações automáticas de dependência não fazem auto-merge quando alterarem segurança, runtime principal ou major version sem testes/revisão.

### J. Disponibilidade, logging, erros, observabilidade e recuperação

- [ ] **SEC-091** — Aplicar rate limit em login, cadastro, reset, denúncias, posts, comentários e endpoints caros.
- [ ] **SEC-092** — Limitar page size e raio de consultas para evitar consultas sem limite/DoS.
- [ ] **SEC-093** — Limitar tamanho do body/request e quantidade de campos/itens recebidos.
- [ ] **SEC-094** — Evitar regex vulnerável a ReDoS; testar entradas longas em validações complexas.
- [ ] **SEC-095** — Chamadas externas possuem timeout, retry limitado com backoff e circuit breaker quando necessário.
- [ ] **SEC-096** — Erros inesperados nunca retornam stack trace, SQL, caminhos internos ou segredo ao cliente.
- [ ] **SEC-097** — Falhas de autorização, login suspeito e ações administrativas relevantes são auditadas e alertáveis.
- [ ] **SEC-098** — Health/Actuator não expõe env, beans, config, heap ou detalhes internos publicamente.
- [ ] **SEC-099** — Feature que altera dados críticos deve verificar impacto em backup/restauração e migrations reversíveis/recuperáveis.
- [ ] **SEC-100** — Antes de produção, executar teste de abuso/segurança específico da feature e confirmar que alertas/monitoramento conseguem detectar falhas relevantes.
