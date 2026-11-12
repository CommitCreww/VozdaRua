# DECISÕES TÉCNICAS — VOZ DA RUA

**Projeto:** Voz da Rua  
**Versão:** 1.0 — decisões consolidadas após fechamento técnico  
**Status:** Aprovado para orientar implementação  
**Documento funcional de referência:** `PRD.md`  
**Documento visual de referência:** `DESIGN.md` 

> Este documento registra as decisões técnicas aprovadas para o projeto.  
> O PRD continua sendo a fonte de verdade das regras funcionais.  
> O `DESIGN.md` será a fonte de verdade das decisões visuais/UX quando estiver concluído.  
> Nenhuma tecnologia, provider ou política não registrada aqui deve ser tratada como decidida.

---

## 1. Princípios técnicos do projeto

O Voz da Rua será implementado como uma aplicação web **mobile-first**, distribuída como **PWA**, com frontend separado do backend.

Princípios obrigatórios:

- regras de negócio críticas devem ser validadas no backend;
- o frontend nunca é autoridade para autorização, distância, papel, status ou ownership;
- PostgreSQL/PostGIS é a autoridade para regras geográficas;
- migrations são a fonte de verdade do schema;
- migrations já aplicadas/compartilhadas não devem ser alteradas;
- arquivos de usuários ficam fora do banco relacional;
- segurança deve ser revisada em toda nova feature;
- código gerado por IA é tratado como código não revisado;
- qualquer decisão futura que altere este documento deve ser aprovada antes de ser implementada.

---

## 2. Stack principal aprovada

### 2.1 Backend

| Item | Decisão |
|---|---|
| Linguagem | Java 25 LTS |
| Framework | Spring Boot 4.1.2 |
| Build | Maven + Maven Wrapper |
| API HTTP | Spring Web |
| Persistência | Spring Data JPA / Hibernate |
| Validação | Bean Validation |
| Banco | PostgreSQL 17 |
| Geoespacial | PostGIS 3.6 |
| ORM espacial | Hibernate Spatial |
| Driver | PostgreSQL JDBC |
| Health | Spring Boot Actuator |

### 2.2 Frontend

**Decisão aprovada:**

- React;
- TypeScript;
- Vite.

Requisitos obrigatórios:

- mobile-first;
- compatível com PWA;
- integração HTTP/JSON com o backend;
- suporte a geolocalização;
- suporte a upload/captura de imagem;
- integração com Web Push;
- acessibilidade;
- responsividade.

A configuração PWA específica deverá ser definida no frontend, sem alterar as regras já aprovadas de funcionamento offline e push.

### 2.3 DESIGN.md

Haverá um arquivo:

```text
docs/DESIGN.md
```

Ele será separado do PRD, FSD e deste documento.

O conteúdo está sendo preparado por outro integrante da equipe.

Portanto:

- não definir identidade visual neste documento;
- não antecipar componentes visuais;
- não substituir o trabalho do `DESIGN.md`;
- backend, banco e segurança podem continuar sendo implementados sem aguardar o design final;
- quando o `DESIGN.md` for concluído, deve ser verificado apenas quanto a conflitos com PRD/FSD.

---

## 3. Arquitetura do backend

Estrutura de referência:

```text
br.com.vozdarua
├── config
├── controller
├── dto
├── entity
├── exception
├── repository
├── security
└── service
```

### 3.1 Controller

Responsável por:

- receber request;
- validar formato inicial;
- chamar services;
- devolver DTO/response;
- aplicar contratos HTTP.

Não deve concentrar regra de negócio.

### 3.2 Service

Responsável por:

- regras de negócio;
- autorização contextual;
- transações;
- validações que dependem do domínio;
- orquestração entre repositories e integrações.

### 3.3 Repository

Responsável por:

- persistência;
- consultas;
- filtros;
- PostGIS;
- agregações.

### 3.4 DTO

Usar DTOs para entrada e saída.

Não expor entity JPA diretamente como contrato público.

### 3.5 Entity

Representa persistência e relacionamentos.

A Entity não substitui as regras do Service.

---

## 4. Banco e migrations

### 4.1 Banco aprovado

```text
PostgreSQL 17
+
PostGIS 3.6
+
pgcrypto
```

### 4.2 Regra de schema

Hibernate não cria nem altera o schema de produção.

Usar:

```text
ddl-auto: validate
```

As migrations SQL versionadas permanecem a fonte de verdade.

### 4.3 Migrations existentes

O banco atual possui as migrations:

```text
001_extensions
002_project_metadata
003_users
004_auth_identities
005_reference_data
006_occurrences
007_occurrence_cycles
008_reports
009_evidence_and_history
010_moderation
011_resolution_and_reopening
012_forwarding
013_social
014_notifications
015_audit
016_system_parameters
017_views
```

**Regra obrigatória:**

> Migration aplicada/compartilhada não é editada.

Toda evolução do PRD final entra em:

```text
018+
```

### 4.4 Evoluções previstas após 017

O banco ainda precisará representar, por novas migrations:

- confirmação de e-mail;
- recuperação de senha;
- subcategorias;
- imagem opcional em post;
- replies de comentário;
- denúncias/moderação Social;
- preferências de notificação;
- Web Push subscriptions;
- contabilização de acesso aos canais oficiais;
- parâmetro de duplicidade em 100 m;
- seeds adicionais de órgãos/canais.

A numeração exata das migrations seguintes poderá ser definida no momento da implementação, desde que não sejam alteradas as anteriores.

---

## 5. Autenticação e sessão

### 5.1 Estratégia aprovada

**Sessão server-side com Spring Security.**

O navegador manterá apenas o identificador necessário em cookie seguro.

Não utilizar JWT armazenado em:

- `localStorage`;
- `sessionStorage`.

### 5.2 Requisitos obrigatórios de cookie

Em produção:

- `HttpOnly`;
- `Secure`;
- `SameSite` apropriado ao fluxo;
- escopo/path restrito conforme necessário.

### 5.3 Proteções de sessão

Obrigatório:

- proteção CSRF em operações mutáveis;
- renovação do identificador da sessão após login;
- renovação após mudança de privilégio;
- invalidação real server-side no logout;
- timeout de sessão;
- proteção contra session fixation;
- proteção contra session hijacking;
- rate limiting nos fluxos de autenticação.

### 5.4 Métodos de autenticação

Confirmados funcionalmente:

- conta Voz da Rua;
- Google;
- GitHub.

Conta local:

- confirmação de e-mail obrigatória.

Conta externa:

- quando o provider fornecer e-mail já verificado, não será necessária segunda confirmação pelo Voz da Rua.

### 5.5 Detalhe ainda não fixado

A forma exata de persistência/distribuição das sessões poderá ser definida na implementação.

Não considerar Redis, JDBC Session ou outra solução como aprovada sem decisão posterior caso se torne necessária.

---

## 6. PWA

### 6.1 Prioridade

O smartphone é o contexto principal de uso.

A PWA deve continuar funcional também em:

- desktop;
- notebook;
- tablet.

### 6.2 Offline

Regra aprovada:

```text
OFFLINE = SOMENTE LEITURA
```

Sem conexão, a aplicação poderá:

- abrir o shell da aplicação;
- apresentar dados previamente carregados disponíveis no cache.

Sem conexão, não poderá:

- criar denúncia;
- confirmar “Eu também vi”;
- votar resolução;
- sinalizar reabertura;
- postar;
- comentar;
- curtir;
- seguir;
- editar;
- excluir;
- moderar;
- administrar.

No MVP:

- não existe fila de escrita offline;
- não existe sincronização posterior automática de mutações feitas offline.

### 6.3 Segurança do Service Worker

O Service Worker não pode:

- cachear indiscriminadamente conteúdo autenticado/sensível;
- manter dados pessoais sem necessidade;
- manter conteúdo privado após logout sem política de limpeza.

---

## 7. Mapas e geocoding

### 7.1 Decisão aprovada

Frontend de mapas:

```text
MapLibre GL JS
```

Provider de tiles/geocoding:

```text
MapTiler
```

### 7.2 Autoridade das regras geográficas

MapLibre e MapTiler servem à experiência de mapa e geocoding.

Eles **não são autoridade** para regras do domínio.

Continuam no PostgreSQL/PostGIS:

- distância de 3 km;
- duplicidade de 100 m;
- validação do limite municipal;
- consultas espaciais oficiais.

---

## 8. Validação do município de São Paulo

### 8.1 Decisão aprovada

Utilizar o **polígono oficial do município de São Paulo** armazenado no PostGIS.

A origem deve ser oficial e a importação/versionamento deve ser registrada.

### 8.2 Validação

O backend verificará se o ponto pertence ao município usando operação espacial apropriada, por exemplo:

```sql
ST_Covers(...)
```

ou equivalente compatível com a modelagem adotada.

Não confiar apenas em:

```text
cidade = "São Paulo"
```

retornada pelo geocoder.

### 8.3 Regra

O geocoder auxilia a interface.

O PostGIS decide se o ponto está dentro do município.

---

## 9. Regra de proximidade e duplicidade

### 9.1 Distância

Ações presenciais definidas pelo PRD devem validar:

```text
<= 3000 m
```

A distância é calculada server-side.

### 9.2 Duplicidade

Possível duplicidade:

```text
ocorrência ativa
+
mesma categoria
+
distância <= 100 m
```

O resultado é candidato/sugestão.

Não realizar fusão automática.

A decisão final permanece humana/moderação.

---

## 10. Object Storage

### 10.1 Decisão aprovada

**MinIO em todos os ambientes do MVP.**

Desenvolvimento:

```text
MinIO via Docker Compose
```

Produção na VPS Hostinger:

```text
MinIO via Docker Compose
```

### 10.2 Integração

O backend deve utilizar interface compatível com S3.

Objetivo:

- não acoplar regra de negócio ao MinIO;
- permitir eventual migração futura sem redesenhar o domínio.

### 10.3 Segurança

Produção:

- bucket privado;
- MinIO não exposto diretamente à Internet;
- acesso pela rede interna Docker;
- credenciais fora do código;
- volume persistente;
- nenhum upload público indiscriminado.

### 10.4 Backup

A política de backup aprovada para o MVP é local na própria VPS e está descrita em seção própria.

---

## 11. Uploads

### 11.1 Formatos aprovados

```text
JPEG
PNG
WebP
```

SVG:

```text
bloqueado no MVP
```

HEIC/HEIF:

```text
não aprovado no MVP
```

### 11.2 Limites

```text
máximo 10 MB por arquivo
máximo 20 megapixels após decode
```

### 11.3 Validações obrigatórias

- validar MIME real/magic bytes;
- não confiar apenas na extensão;
- rejeitar arquivo malformado;
- gerar nome/chave UUID no servidor;
- impedir path traversal;
- aplicar limite durante o recebimento;
- verificar dimensões/pixels após decode.

### 11.4 Imagem pública

A versão destinada à exibição pública deve:

- ser re-encodada;
- ter EXIF removido;
- não depender do arquivo original enviado para servir conteúdo ativo;
- respeitar política do PRD sobre rostos, placas e dados pessoais.

### 11.5 Armazenamento

Original:

- privado no MinIO.

Derivada pública:

- controlada pela aplicação;
- não transforma o bucket inteiro em público.

---

## 12. E-mail

### 12.1 Desenvolvimento

```text
Mailpit
```

Objetivo:

- interceptar e-mails;
- testar confirmação;
- testar recuperação;
- testar notificações sem enviar mensagens reais.

### 12.2 Produção

Provider:

```text
Postmark
```

### 12.3 Integração

A escolha entre SMTP e API do Postmark **não foi fechada**.

Ela deverá ser definida no momento da implementação, considerando:

- suporte oficial;
- segurança;
- tratamento de erros;
- observabilidade;
- manutenção.

### 12.4 Segurança

- credenciais somente em secrets/variáveis de ambiente;
- TLS;
- nunca registrar token/chave;
- não logar link completo de reset/confirmação se contiver token reutilizável;
- respostas de recuperação não devem permitir enumeração de usuário.

---

## 13. Push notifications

### 13.1 Decisão aprovada

```text
Web Push
+
VAPID
```

### 13.2 Cliente

A PWA utilizará Service Worker para receber as notificações.

### 13.3 Backend

O Spring Boot gerenciará subscriptions autorizadas.

### 13.4 Segurança

- push é opt-in;
- usuário pode revogar;
- chave privada VAPID fica somente no backend/secrets;
- subscription não deve aparecer em logs;
- subscription deve ser associada ao usuário/dispositivo de forma controlada;
- notificações sociais podem ser desativadas separadamente.

---

## 14. Ambiente de desenvolvimento

### 14.1 Objetivo

Ambiente reproduzível.

Estrutura prevista:

```text
frontend
backend
PostgreSQL/PostGIS
MinIO
Mailpit
```

via configuração local/Docker Compose conforme serviço.

### 14.2 Configuração

- `.env.example` versionado;
- `.env` real fora do Git;
- sem secrets no repositório;
- migrations executadas de forma determinística;
- seed dev separado.

---

## 15. Homologação / staging

### 15.1 Decisão aprovada

A homologação ficará na **mesma VPS Hostinger** do MVP.

Porém será isolada da produção.

### 15.2 Separação obrigatória

Homologação terá:

- containers próprios;
- banco próprio;
- volumes próprios;
- MinIO/storage próprio;
- secrets próprios;
- subdomínio próprio.

Não compartilhar com produção:

- banco;
- volume;
- bucket;
- credenciais;
- secrets.

### 15.3 Objetivo

Usar staging para:

- smoke tests;
- E2E;
- DAST;
- validação antes da produção.

---

## 16. Produção

### 16.1 Decisão aprovada

Infraestrutura:

```text
VPS Hostinger
+
Docker Compose
+
Nginx
```

### 16.2 Serviços principais

Produção conterá os serviços necessários ao MVP, incluindo:

- frontend React/PWA;
- backend Spring Boot;
- PostgreSQL/PostGIS;
- MinIO;
- observabilidade aprovada.

### 16.3 Exposição de rede

Internet:

```text
HTTPS
↓
Nginx
↓
serviços autorizados
```

PostgreSQL:

```text
não exposto publicamente
```

MinIO:

```text
não exposto publicamente como serviço aberto
```

Comunicação interna deve ocorrer pela rede Docker.

### 16.4 TLS

HTTPS é obrigatório em produção.

Nginx será o reverse proxy aprovado.

A forma de emissão/renovação do certificado poderá ser configurada na implantação, sem alterar esta decisão.

---

## 17. CI/CD

### 17.1 Decisão aprovada

```text
GitHub Actions
```

### 17.2 Pull Request

Pipeline deve executar:

- build;
- testes;
- security gates;
- análise de dependências;
- secret scanning;
- scan de container/misconfiguration quando aplicável;
- validação das migrations.

### 17.3 Homologação

Após fluxo aprovado:

- deploy de staging;
- smoke tests;
- E2E;
- DAST.

### 17.4 Produção

Deploy de produção exige aprovação.

Não realizar deploy automático irrestrito para produção apenas por push.

---

## 18. Observabilidade

### 18.1 Decisão aprovada para o MVP

```text
Grafana
+
Loki
+
Spring Boot Actuator
```

### 18.2 Não adotado inicialmente

No MVP não serão componentes obrigatórios:

- Prometheus;
- Alertmanager.

Podem ser reavaliados posteriormente.

### 18.3 Objetivos

A observabilidade deve permitir acompanhar pelo menos:

- saúde da aplicação;
- erros relevantes;
- logs do backend;
- problemas de integrações;
- falhas de autenticação relevantes;
- falhas de upload/storage;
- erros de e-mail/push;
- comportamento técnico necessário à operação.

### 18.4 Actuator

Não expor publicamente endpoints sensíveis como:

- env;
- beans;
- config;
- heap dump.

---

## 19. Retenção de logs

### 19.1 Decisão aprovada

```text
logs técnicos da aplicação: 7 dias
logs de segurança: 30 dias
auditoria funcional/administrativa: 90 dias
```

### 19.2 Minimização

Não registrar:

- senha;
- cookie de sessão;
- token completo;
- segredo;
- chave VAPID privada;
- credencial MinIO;
- credencial Postmark;
- dado pessoal sem necessidade.

### 19.3 Revisão futura

Os períodos podem ser revisados caso exista:

- necessidade operacional;
- requisito legal;
- mudança de risco;
- crescimento do projeto.

---

## 20. Backup

### 20.1 Decisão aprovada para o MVP

**Backup local na própria VPS Hostinger.**

Incluir:

- PostgreSQL;
- dados/objetos do MinIO;
- configurações essenciais necessárias à recuperação.

### 20.2 Risco aceito

Essa estratégia **não representa redundância externa**.

Falha grave da VPS poderá afetar:

- produção;
- backup.

Esse risco deve permanecer explicitamente documentado.

### 20.3 Obrigação operacional

Mesmo sendo local:

- backup deve ser automatizado;
- deve haver retenção controlada;
- restore deve ser testado periodicamente;
- backup não pode ficar acessível publicamente;
- execução de backup não pode expor secrets em logs.

### 20.4 Evolução

Backup externo deverá ser reavaliado antes de a operação se tornar crítica ou quando o projeto crescer.

A adoção de storage externo, PITR ou política mais avançada **não está aprovada neste momento**.

---

## 21. Reabertura

### 21.1 Status canônico aprovado

```text
REABERTA
```

Será um status:

- persistido;
- real;
- visível ao usuário.

### 21.2 Fluxo base

```text
RESOLVIDA
→ REABERTA
→ EM_ANALISE
→ EM_RESOLUCAO
→ RESOLVIDA
```

Nem toda etapa intermediária precisa ocorrer se a regra funcional permitir outro caminho válido, mas `REABERTA` representa explicitamente a aprovação da reabertura.

### 21.3 Ciclos

Toda reabertura:

- cria novo ciclo;
- preserva ciclo anterior;
- separa contagens;
- registra histórico;
- registra auditoria.

O ciclo continua sendo a referência estrutural para histórico e contadores.

---

## 22. Segurança como gate obrigatório

### 22.1 Princípio

Código gerado por IA é tratado como:

```text
CÓDIGO NÃO REVISADO
```

Uma feature não está concluída apenas porque:

- compila;
- funciona no happy path;
- parece correta;
- foi gerada por IA;
- passou por teste manual superficial.

### 22.2 Baseline

O projeto adota como referências:

- OWASP Top 10:2025;
- OWASP ASVS 5.0;
- OWASP Cheat Sheet Series;
- OWASP API Security;
- padrões observados em estudos de aplicações desenvolvidas com assistência de IA/vibe coding.

Não existe um padrão oficial universal chamado “Top 100 de vulnerabilidades de vibe coding”.

O projeto adota uma **matriz interna SEC-001..SEC-100**, construída para transformar as classes de risco relevantes em verificações práticas.

### 22.3 Fluxo obrigatório por feature

```text
entender a feature
↓
modelagem rápida de ameaça
↓
implementação
↓
testes positivos
↓
testes negativos/abuso
↓
SEC-001..SEC-100 aplicáveis
↓
scans automatizados
↓
revisão humana
↓
staging
↓
DAST quando aplicável
↓
merge/release
```

### 22.4 Classificação do checklist

Cada item aplicável deve ser marcado como:

```text
PASS
FAIL
N/A
```

`N/A` deve possuir justificativa quando não for evidente.

### 22.5 Regra de bloqueio

- finding Critical bloqueia;
- finding High bloqueia por padrão;
- exceção High exige decisão explícita/documentada;
- segredo real detectado bloqueia;
- falha de autenticação/autorização bloqueia;
- bypass de segurança não pode ser escondido como TODO.

---

## 23. Security Gate — 100 verificações

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

---

## 24. Testes e quality gates

### 24.1 Backend

Decisão aprovada:

- JUnit 5;
- Spring Boot Test;
- MockMvc;
- Testcontainers com PostgreSQL/PostGIS;
- testes de Repository;
- testes de autorização;
- testes das regras críticas;
- testes de concorrência/unicidade onde necessário.

### 24.2 Frontend

Decisão aprovada:

- Vitest;
- React Testing Library;
- Playwright para E2E.

### 24.3 Segurança automatizada

Decisão aprovada:

- GitHub CodeQL;
- Semgrep;
- OWASP Dependency-Check;
- auditoria de dependências npm;
- Trivy;
- Gitleaks;
- Dependabot;
- OWASP ZAP em homologação.

### 24.4 Gates obrigatórios

Para merge:

- build passa;
- testes passam;
- migration sobe em banco limpo;
- zero segredo detectado;
- Critical bloqueia;
- High bloqueia por padrão;
- checklist SEC-001..SEC-100 foi revisado;
- revisão humana quando aplicável.

Para produção:

- staging validado;
- smoke tests;
- E2E relevante;
- OWASP ZAP/DAST;
- aprovação de deploy.

### 24.5 Revisão humana reforçada

Obrigatória quando a feature alterar:

- autenticação;
- sessão;
- autorização;
- roles/permissões;
- uploads;
- storage;
- migrations;
- infraestrutura;
- CI/CD;
- secrets;
- integrações externas;
- geolocalização/regra espacial;
- código de segurança.

---

## 25. Dependências e supply chain

### 25.1 Dependências sugeridas por IA

Antes de instalar:

- confirmar que o pacote existe;
- confirmar repositório/documentação oficial;
- evitar typosquatting/slopsquatting;
- verificar manutenção;
- verificar necessidade real.

### 25.2 Versionamento

Frontend:

- lockfile obrigatório e versionado.

Maven:

- dependências definidas explicitamente conforme estratégia do projeto;
- não adicionar dependência sem propósito claro.

### 25.3 Atualizações

Dependabot pode sugerir atualizações.

Não fazer auto-merge indiscriminado de:

- major versions;
- runtimes principais;
- bibliotecas de autenticação;
- segurança;
- infraestrutura.

---

## 26. Segurança específica contra Injection

Toda feature deve considerar explicitamente ataques de injeção.

### 26.1 SQL / JPQL / native query

Obrigatório:

- bind parameters;
- parâmetros nomeados/posicionais;
- nenhuma concatenação de input em SQL/JPQL.

Quando estrutura for dinâmica, como ordenação:

- usar allowlist;
- nunca aceitar nome arbitrário de coluna/tabela vindo do cliente.

### 26.2 Command injection

Não passar input de usuário diretamente para:

- shell;
- `Runtime.exec`;
- `ProcessBuilder`.

Caso alguma execução externa seja realmente necessária:

- justificar;
- usar allowlist;
- evitar shell intermediário;
- limitar argumentos;
- revisar no Security Gate.

### 26.3 XSS

Frontend deve:

- usar escaping padrão do React;
- evitar `dangerouslySetInnerHTML`;
- sanitizar conteúdo quando HTML controlado pelo usuário for realmente requisito.

### 26.4 Template/Expression injection

Não avaliar como código:

- input;
- template;
- expressão;
- script;
- payload enviado pelo usuário.

### 26.5 Header/log injection

Sanitizar/estruturar dados não confiáveis antes de inserir em:

- headers;
- logs;
- e-mails;
- mensagens de auditoria.

---

## 27. Segurança específica de autorização

### 27.1 Regra

Frontend ocultar botão não é autorização.

Todo endpoint deve validar no backend:

- autenticação;
- papel;
- status da conta;
- ownership;
- regra contextual.

### 27.2 IDOR/BOLA

Para qualquer endpoint com:

```text
/<built-in function id>
```

testar pelo menos:

- recurso do próprio usuário;
- recurso de outro usuário;
- usuário banido;
- papel sem permissão;
- ID inexistente;
- recurso oculto/privado quando aplicável.

UUID dificulta enumeração, mas **não é controle de acesso**.

---

## 28. Segurança de integrações externas

Para Postmark, MapTiler, Web Push e futuras integrações:

- timeout;
- tratamento seguro de erro;
- não expor chave no log;
- não confiar no retorno como autorização;
- validar conteúdo recebido;
- rate limit quando aplicável;
- evitar SSRF caso URLs sejam manipuláveis;
- segredos em ambiente/secrets.

---

## 29. LGPD e privacidade técnica

### 29.1 Localização

Não armazenar histórico contínuo de localização do usuário.

Persistir:

- localização da ocorrência;
- informações mínimas necessárias para comprovar a validação definida pelo domínio.

### 29.2 Exclusão/anomização

Seguir PRD para:

- remoção de dados pessoais quando possível;
- anonimização de relatos coletivos;
- ocultação da presença Social;
- retenção mínima de auditoria quando necessária.

### 29.3 Cache da PWA

Evitar manter dados pessoais desnecessários no dispositivo.

Logout deve considerar limpeza de dados privados em cache.

---

## 30. Performance

Pontos críticos:

- Home por proximidade;
- consulta 3 km;
- duplicidade 100 m;
- feed Social;
- comentários;
- notificações;
- fila de moderação;
- analytics.

Diretrizes:

- índices PostGIS;
- paginação;
- limites de page size;
- evitar N+1;
- evitar eager loading indiscriminado;
- não carregar São Paulo inteira;
- analisar queries críticas.

---

## 31. Acessibilidade técnica

O frontend deverá respeitar o PRD e o futuro `DESIGN.md`.

Do ponto de vista técnico:

- semântica HTML adequada;
- labels;
- teclado;
- foco visível;
- leitores de tela;
- contraste conforme design;
- alt text quando aplicável;
- não depender somente de cor.

---

## 32. Encaminhamento oficial

A aplicação:

- identifica canal configurado;
- exibe instruções;
- abre site externo;
- não inventa canal;
- não declara protocolo oficial sem confirmação verificável.

URLs dos canais são dados administráveis.

Não hardcode de forma irreversível canais específicos no código da regra.

---

## 33. Observações sobre Social

As regras funcionais vêm do PRD/FSD.

Impactos técnicos já definidos:

- post com texto;
- uma imagem opcional;
- ocorrência opcional;
- comments/replies;
- somente um nível de reply;
- denúncia/moderação;
- privacidade de perfil;
- auditoria das ações relevantes.

A decisão funcional sobre **deixar de seguir** ainda pertence ao PRD e não deve ser inventada neste documento.

---

## 34. Parâmetros relevantes

Valores funcionais atualmente aprovados:

```text
distância máxima = 3000 m
raio candidato de duplicidade = 100 m
alerta de moderação = 10 relatos
janela de edição/exclusão = 12 horas
resolução comunitária = 10001 votos válidos
alerta de reabertura = 1000 sinalizações
```

Esses valores devem ser centralizados/configuráveis conforme a modelagem já adotada.

Não espalhar números mágicos pelo código.

---

## 35. Logs e tratamento de erro

### 35.1 Resposta ao cliente

Nunca retornar:

- stack trace;
- SQL interno;
- segredo;
- caminho sensível;
- configuração interna.

### 35.2 Logs estruturados

Preferir logs que permitam:

- timestamp;
- nível;
- request/correlation id quando adotado;
- evento;
- contexto mínimo necessário.

### 35.3 Dados sensíveis

Não logar:

- senha;
- sessão;
- token de reset;
- chave VAPID;
- chave MinIO;
- credencial Postmark;
- segredo OAuth;
- dado pessoal sem necessidade.

---

## 36. Infraestrutura de rede

### 36.1 Produção

Nginx é o reverse proxy.

Exposição pública:

```text
80/443 conforme configuração de redirecionamento/TLS
```

Serviços internos não devem ser publicados sem necessidade.

### 36.2 PostgreSQL

Somente rede interna/administrativa autorizada.

### 36.3 MinIO

Somente rede interna/administrativa autorizada.

### 36.4 Staging

Mesmo host físico, porém:

- containers distintos;
- rede lógica/configuração separada;
- banco separado;
- secrets separados.

---

## 37. Gestão de secrets

Não versionar:

- `.env`;
- senha de banco;
- segredo OAuth;
- Postmark token/credential;
- MinIO secret;
- VAPID private key;
- segredo de sessão;
- credenciais de deploy.

Versionar somente:

```text
.env.example
```

com valores fictícios.

Se um segredo for exposto:

```text
remover do código
+
rotacionar o segredo
```

Somente apagar do commit não resolve o incidente.

---

## 38. Git e Pull Requests

Toda feature relevante deve chegar por Pull Request.

O PR deve informar, quando aplicável:

- o que mudou;
- migration criada;
- endpoints afetados;
- impacto de segurança;
- itens SEC aplicáveis;
- testes executados;
- impacto em ambiente/configuração.

Mudança sensível deve receber revisão humana reforçada.

---

## 39. Definition of Done técnica

Uma feature só está concluída quando:

- regra funcional está atendida;
- autorização está correta;
- validação server-side existe;
- migration necessária existe;
- migration funciona em banco limpo;
- testes principais passam;
- testes negativos relevantes existem;
- Security Gate aplicável foi revisado;
- não existe finding Critical;
- finding High não foi ignorado silenciosamente;
- secrets não aparecem no código/log;
- observabilidade necessária existe;
- staging foi validado quando aplicável;
- documentação foi atualizada quando necessário.

---

## 40. Decisões fechadas — resumo

| Tema | Decisão aprovada |
|---|---|
| Frontend | React + TypeScript + Vite |
| Design | `DESIGN.md` separado, em elaboração pelo outro integrante |
| Sessão | server-side + Spring Security + cookie seguro |
| Mapas | MapLibre GL JS |
| Tiles/geocoding | MapTiler |
| Autoridade geográfica | PostgreSQL/PostGIS |
| Storage | MinIO local e produção |
| E-mail local | Mailpit |
| E-mail produção | Postmark |
| Push | Web Push + VAPID |
| Upload | JPEG/PNG/WebP, 10 MB, 20 MP |
| Homologação | mesma VPS, ambientes isolados |
| Produção | VPS Hostinger + Docker Compose + Nginx |
| CI/CD | GitHub Actions |
| Observabilidade | Grafana + Loki + Actuator |
| Logs | 7d aplicação / 30d segurança / 90d auditoria |
| Backup | local na própria VPS no MVP |
| Limite municipal | polígono oficial + PostGIS |
| Reabertura | status `REABERTA` |
| Testes | stack completa/equilibrada aprovada |
| Security Gate | SEC-001..SEC-100 obrigatório por feature |

---

## 41. Pontos deliberadamente não definidos aqui

Não considerar decididos apenas por ausência de detalhe:

- conteúdo do `DESIGN.md`;
- SMTP vs API para Postmark;
- mecanismo exato de persistência da sessão server-side;
- detalhes finais de certificado/TLS no Nginx;
- rotina/ferramenta específica do backup local;
- futuros providers alternativos;
- futura adoção de Prometheus/Alertmanager;
- futura migração de MinIO para storage externo;
- política funcional de “deixar de seguir”, ainda pertencente ao PRD.

Esses itens só devem ser registrados como decisão após aprovação explícita.

---

## 42. Referências de segurança

Baseline técnico:

- OWASP Top 10:2025;
- OWASP Application Security Verification Standard (ASVS) 5.0.0;
- OWASP Cheat Sheet Series;
- OWASP API Security Project;
- estudo da Astra sobre segurança em aplicações geradas por plataformas de vibe coding.

A pesquisa da Astra reportou **137 findings confirmados** distribuídos em aplicações geradas por quatro plataformas, reforçando a necessidade de testar explicitamente controle de acesso, CORS, autenticação, rate limiting, validação e outros cenários de abuso.

O checklist `SEC-001..SEC-100` é uma política interna do Voz da Rua e deverá evoluir conforme novas classes de risco forem relevantes.

---

## 43. Regra final

Se houver conflito entre documentos:

1. **PRD** define comportamento funcional;
2. **DECISOES_TECNICAS.md** define as escolhas técnicas aprovadas;
3. **FSD** detalha a implementação combinando os dois;
4. **DESIGN.md** define apresentação/UX quando finalizado.

Nenhuma IA, ferramenta ou desenvolvedor deve preencher silenciosamente uma decisão em aberto.
