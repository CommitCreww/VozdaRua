# DECISÕES TÉCNICAS — VOZ DA RUA

**Projeto:** Voz da Rua  
**Versão:** 1.0 — decisões consolidadas após fechamento técnico  
**Status:** Aprovado para orientar implementação  
**Documento funcional de referência:** `PRD.md`  
**Documento visual de referência:** `DESIGN.md` — documento vivo fornecido pela equipe

> Este documento registra as decisões técnicas aprovadas para o projeto.  
> O PRD continua sendo a fonte de verdade das regras funcionais.  
> O `DESIGN.md` é a fonte de referência visual/UX; somente itens marcados como aprovados devem ser tratados como definitivos.  
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
| Runtime | Node.js 26 LTS |
| Linguagem | TypeScript |
| Framework HTTP | Fastify |
| Build | TypeScript Compiler (`tsc`) |
| Gerenciador de pacotes | npm com `package-lock.json` versionado |
| API HTTP | REST/JSON com rotas/plugins do Fastify |
| Persistência | SQL parametrizado em camada Repository |
| Driver PostgreSQL | `pg` (node-postgres) |
| Banco | PostgreSQL 17 |
| Geoespacial | PostGIS 3.6 |
| Migrations | SQL versionado existente (`scripts/migrate.sh` + `psql`) |
| Health | endpoints próprios `/health` e `/ready` |

**Diretriz:** nenhum ORM adicional é obrigatório. O schema existente e as migrations SQL continuam sendo a fonte de verdade; consultas geográficas e regras críticas devem permanecer explícitas e parametrizadas.

Bibliotecas auxiliares de validação, sessão, CSRF, OAuth e rate limiting podem ser selecionadas no início de cada módulo, desde que sejam mantidas, compatíveis com Fastify, passem pelo Security Gate e não alterem as decisões funcionais.

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
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── schemas/
│   ├── plugins/
│   ├── hooks/
│   ├── security/
│   ├── integrations/
│   ├── errors/
│   └── types/
├── tests/
├── package.json
├── package-lock.json
└── tsconfig.json
```

A organização é inspirada em MVC, adaptada a uma API REST com frontend React separado:

- **Model:** banco PostgreSQL/PostGIS, repositories e tipos do domínio;
- **View:** frontend React/PWA;
- **Controller:** controllers acionados pelas rotas Fastify;
- **Service:** regras de negócio e transações entre Controller e Repository.

### 3.1 Routes

Responsáveis por:

- declarar método e caminho HTTP;
- registrar plugins/hooks necessários;
- encaminhar para controller;
- não conter regra de negócio.

### 3.2 Controller

Responsável por:

- receber request;
- ler parâmetros já validados;
- chamar services;
- transformar resultado em resposta HTTP;
- não executar SQL diretamente.

### 3.3 Service

Responsável por:

- regras de negócio;
- autorização contextual;
- transações;
- validações dependentes do domínio;
- orquestração entre repositories e integrações.

### 3.4 Repository

Responsável por:

- persistência;
- SQL parametrizado;
- consultas PostGIS;
- filtros;
- agregações.

Não concatenar input do usuário em SQL.

### 3.5 Schemas / validação de entrada

Responsáveis por:

- validar shape, tipo, tamanho e enum de requests;
- rejeitar campos inesperados quando isso reduzir risco de mass assignment;
- não substituir validações de regra de negócio no Service.

A biblioteca concreta de schema validation não é uma decisão fechada neste documento.

### 3.6 Plugins e hooks

Responsáveis por preocupações transversais do Fastify:

- autenticação;
- autorização;
- CSRF;
- rate limiting;
- correlation/request ID;
- tratamento de erro;
- upload;
- segurança HTTP.

### 3.7 Separação entre tipos e contratos

Não expor diretamente linhas brutas do banco como contrato público.

Responses e requests devem possuir tipos/DTOs explícitos em TypeScript, evitando vazamento acidental de campos internos.

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

O backend Node.js **não cria nem altera automaticamente o schema** em runtime.

As migrations SQL versionadas permanecem a fonte de verdade.

O acesso ao banco deve respeitar o schema existente, e a aplicação deve falhar de forma clara quando uma migration obrigatória estiver ausente.

Não adotar `sync`, auto-migration de ORM ou criação implícita de tabela em produção.

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

**Sessão server-side com cookie seguro em Fastify.**

O navegador mantém apenas o identificador de sessão necessário em cookie.

Não utilizar token de autenticação em:

- `localStorage`;
- `sessionStorage`.

A implementação pode usar plugin de sessão compatível com Fastify. O mecanismo exato de persistência das sessões ainda não foi fixado; store de sessão somente em memória **não pode ser usado em produção**.

### 5.2 Requisitos obrigatórios do cookie

Em produção:

- `HttpOnly`;
- `Secure`;
- `SameSite` apropriado ao fluxo;
- path/escopo restrito;
- expiração coerente com a política de sessão.

### 5.3 Proteções de sessão

Obrigatório:

- proteção CSRF em operações mutáveis;
- renovação/regeneração do ID de sessão após login;
- renovação após mudança de privilégio;
- invalidação server-side no logout;
- timeout;
- proteção contra session fixation;
- proteção contra session hijacking;
- rate limiting em login, cadastro, reenvio de confirmação e recuperação;
- `trustProxy` configurado corretamente no Fastify atrás do Nginx antes de confiar em cookies `Secure` e IP do cliente.

### 5.4 Métodos de autenticação

Confirmados:

- conta Voz da Rua;
- Google;
- GitHub.

Conta local:

- confirmação de e-mail obrigatória.

Conta externa:

- quando o provider fornecer e-mail já verificado, não será necessária segunda confirmação.

### 5.5 OAuth/OIDC

A implementação deve validar:

- `state`;
- `nonce` quando aplicável;
- callback/redirect URI permitido;
- issuer/audience quando o protocolo exigir;
- associação segura entre identidade externa e conta local.

A biblioteca concreta de OAuth não deve ser escolhida por conveniência sem passar pelo Security Gate.

### 5.6 Detalhe ainda não fixado

Permanece deliberadamente não definido:

- storage de sessão em produção;
- duração exata da sessão;
- política exata de renovação contínua.

Esses detalhes devem ser fechados antes de concluir o módulo de autenticação, sem alterar a decisão principal de sessão server-side.


### 5.7 Hardening adicional de autenticação

Além das proteções já definidas, o módulo de autenticação deve incorporar:

#### Rate limiting multicamada

Aplicar limites independentes, quando aplicável, por:

- IP/origem;
- conta/e-mail normalizado;
- sessão autenticada;
- endpoint/ação.

Endpoints mínimos:

```text
POST /auth/login
POST /auth/register
POST /auth/password/forgot
POST /auth/email/resend
```

Outros endpoints de escrita também devem ter limites coerentes com custo e risco.

Não depender apenas de IP, pois ataques distribuídos podem usar múltiplas origens.

#### Cooldown progressivo

Falhas consecutivas de autenticação devem aumentar progressivamente o tempo até nova tentativa permitida.

Preferir:

```text
falha
→ contador/janela
→ cooldown
→ resposta 429 quando bloqueado
```

Evitar manter requisições abertas artificialmente apenas para "atrasar" o atacante.

#### Account lockout inteligente

- bloqueio temporário, nunca permanente automático;
- cooldown progressivo;
- impedir que terceiro cause bloqueio permanente de uma conta;
- registrar evento de segurança quando limiares relevantes forem atingidos;
- resposta não deve facilitar enumeração de contas.

#### MFA

Política aprovada:

```text
CIDADÃO
→ MFA opcional

MODERADOR
→ MFA obrigatório antes de operar em produção

ADMIN
→ MFA obrigatório antes de operar em produção
```

Método preferencial:

```text
WebAuthn / Passkeys / FIDO2
```

Evitar SMS como fator principal quando existir opção resistente a phishing.

A implementação de recuperação de MFA deve receber revisão humana reforçada e não pode introduzir bypass mais fraco que o próprio MFA.

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

O backend Node.js gerenciará subscriptions autorizadas.

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
- backend Node.js/Fastify;
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
endpoints de health/readiness do backend Node.js
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

### 18.4 Health e readiness

O backend deve expor:

```text
GET /health
GET /ready
```

`/health` indica que o processo está vivo.

`/ready` verifica se a instância está apta a atender, incluindo dependências essenciais definidas para o runtime, como banco.

Esses endpoints:

- não expõem variáveis de ambiente;
- não listam secrets;
- não retornam stack trace;
- não exibem configuração interna;
- podem ter detalhamento restrito à rede/admin quando necessário.

Métricas mais completas que exijam datasource próprio no Grafana permanecem para evolução futura, já que Prometheus não foi adotado no MVP.

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

- [ ] **SEC-021** — Queries SQL usam parâmetros/bindings; nunca concatenar input em consulta.
- [ ] **SEC-022** — Sort, coluna, nome de tabela ou fragmentos estruturais dinâmicos usam allowlist fixa.
- [ ] **SEC-023** — Entrada do usuário nunca é passada diretamente a shell ou APIs de `node:child_process` (`exec`, `execFile`, `spawn`) sem necessidade, allowlist e revisão.
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

- [ ] **SEC-051** — Schema validation valida formato/tamanho, mas regras de negócio também são verificadas no Service.
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
- [ ] **SEC-084** — Dependências npm/Node são verificadas por SCA antes do merge.
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
- [ ] **SEC-098** — Endpoints de health/readiness não expõem env, config, heap, stack ou detalhes internos publicamente.
- [ ] **SEC-099** — Feature que altera dados críticos deve verificar impacto em backup/restauração e migrations reversíveis/recuperáveis.
- [ ] **SEC-100** — Antes de produção, executar teste de abuso/segurança específico da feature e confirmar que alertas/monitoramento conseguem detectar falhas relevantes.

---

## 24. Testes e quality gates

### 24.1 Backend

Adaptação da decisão de testes para Node.js:

- Vitest como runner de testes TypeScript;
- `fastify.inject()` para testes HTTP do Fastify;
- Testcontainers for Node com PostgreSQL/PostGIS;
- testes de Repository;
- testes de Service;
- testes de autorização;
- testes de regras críticas;
- testes de concorrência/unicidade onde necessário.

Os testes devem usar banco PostgreSQL/PostGIS real em container quando a regra depender de SQL, constraint ou função espacial. Não substituir PostGIS por mock em testes que validem distância/geométrica.

### 24.2 Frontend

Decisão aprovada:

- Vitest;
- React Testing Library;
- Playwright para E2E.

### 24.3 Segurança automatizada

Decisão aprovada, adaptada à stack Node:

- GitHub CodeQL para JavaScript/TypeScript;
- Semgrep;
- OWASP Dependency-Check quando aplicável ao lockfile/SBOM;
- `npm audit`;
- Trivy;
- Gitleaks;
- Dependabot;
- OWASP ZAP em homologação.

### 24.4 Gates obrigatórios

Para merge:

- `npm ci` funciona;
- build TypeScript passa;
- lint/typecheck definidos pelo projeto passam;
- testes passam;
- migrations sobem em banco limpo;
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

## 25. Dependências e supply chain

### 25.1 Dependências sugeridas por IA

Antes de instalar:

- confirmar que o pacote existe;
- confirmar repositório/documentação oficial;
- evitar typosquatting/slopsquatting;
- verificar manutenção;
- verificar necessidade real.

### 25.2 Versionamento

Frontend e backend Node:

- `package-lock.json` obrigatório e versionado;
- instalação em CI com `npm ci`;
- evitar ranges excessivamente permissivos em dependências críticas;
- runtime Node deve permanecer em linha LTS suportada.

Não adicionar dependência sem propósito claro.

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

### 26.1 SQL / queries dinâmicas

Obrigatório:

- queries parametrizadas pelo driver PostgreSQL;
- nenhuma concatenação/interpolação de input em SQL;
- valores dinâmicos enviados como parâmetros.

Elementos estruturais que não podem ser parametrizados, como coluna de ordenação:

- usar allowlist fixa;
- mapear valor público para identificador interno conhecido;
- nunca aceitar nome arbitrário de coluna/tabela enviado pelo cliente.

### 26.2 Command injection

Não passar input do usuário diretamente a:

- `child_process.exec`;
- `child_process.execFile`;
- `child_process.spawn`;
- shell.

Caso uma execução externa seja realmente necessária:

- justificar;
- preferir não usar shell;
- usar argumentos separados;
- aplicar allowlist;
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


## 36.5 Segmentação de rede e menor privilégio

A infraestrutura deve adotar segmentação compatível com o tamanho do MVP.

Objetivo:

```text
Internet
↓
Nginx
↓
Frontend / Backend

Backend
↓
PostgreSQL
MinIO
```

Regras:

- Internet não acessa PostgreSQL diretamente;
- Internet não acessa MinIO diretamente;
- frontend não acessa PostgreSQL;
- frontend não acessa credenciais internas do MinIO;
- Nginx não recebe privilégio desnecessário sobre banco;
- serviços de observabilidade devem ter apenas os acessos necessários.

Quando útil, separar redes Docker por função, por exemplo:

```text
edge
data
observability
```

Sem criar complexidade de microsserviços desnecessária.

### 36.6 Princípio do menor privilégio — PoLP

Obrigatório:

- backend não usar superusuário PostgreSQL;
- migrations podem usar identidade separada com privilégios maiores;
- credencial da aplicação deve ter somente permissões necessárias;
- credencial MinIO do backend deve ser restrita aos buckets/ações necessárias;
- containers não devem rodar como `privileged`;
- evitar execução como root quando tecnicamente possível;
- não montar Docker socket no container da aplicação;
- remover Linux capabilities desnecessárias quando possível;
- filesystem read-only deve ser considerado para containers que não precisam escrever localmente;
- segredos devem ser fornecidos apenas aos serviços que realmente os usam.

### 36.7 Zero Trust como princípio

A rede interna não concede confiança implícita.

```text
origem interna
≠
autorização
```

Toda operação sensível continua validando:

- autenticação;
- status da conta;
- papel;
- ownership;
- contexto da operação.

O MVP **não exige** uma implantação enterprise de Zero Trust com service mesh, mTLS entre todos os containers ou identidade criptográfica por workload. Esses controles poderão ser avaliados futuramente se a arquitetura justificar.


## 36.8 Redução de fingerprinting

Adotar hardening de exposição de tecnologia:

- ocultar versões do Nginx;
- não enviar headers desnecessários de framework/runtime;
- não expor stack traces;
- não expor caminhos internos;
- não expor versões de bibliotecas em mensagens de erro;
- remover banners desnecessários de serviços administrativos.

Esse controle é complementar e não substitui patching, SCA, autorização, WAF ou correções de vulnerabilidade.

## 36.9 WAF antes do lançamento público

O projeto deve possuir uma etapa de avaliação/implantação de Web Application Firewall antes do lançamento público.

Abordagem:

```text
staging
→ detection/logging
→ análise de falsos positivos
→ tuning
→ testes E2E + ZAP
→ blocking em produção
```

O WAF deve ser tratado como camada adicional, nunca como substituto de validação server-side.

Regras genéricas, como OWASP Core Rule Set ou solução equivalente, podem ser usadas desde que sejam validadas contra:

- JSON;
- uploads;
- coordenadas;
- descrição livre;
- comentários;
- Social;
- endpoints de autenticação.

A solução WAF específica permanece uma decisão operacional futura.

## 36.10 Cyber deception — escopo deliberado

No MVP:

**não adotar:**

- honeypot público na mesma VPS de produção;
- banco/SSH/porta falsa exposta propositalmente;
- arquivo `.env` falso ou credencial falsa espalhada no repositório/host;
- tarpits que mantenham conexões deliberadamente abertas;
- rotação periódica de portas como mecanismo de segurança.

Motivos:

- aumento de superfície operacional;
- risco de falso positivo;
- risco de confusão operacional;
- possibilidade de amplificar DoS;
- baixo benefício comparado aos controles principais.

**futuro opcional:**

Honeytokens/canary tokens sem privilégio podem ser avaliados futuramente, desde que:

- não concedam acesso real;
- possam ser revogados;
- gerem evento de segurança de alta prioridade;
- não contaminem CI/secret scanning;
- não sejam confundidos com credenciais reais.

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


### 37.1 Rotação de segredos

Todo segredo deve possuir estratégia de rotação.

Rotação imediata é obrigatória quando houver:

- vazamento;
- suspeita de comprometimento;
- exposição em log;
- commit acidental;
- acesso indevido ao ambiente.

Segredos relevantes:

- segredo de sessão;
- credenciais MinIO;
- Postmark;
- OAuth;
- VAPID;
- credenciais de deploy;
- credenciais de banco.

Rotação periódica pode ser adotada conforme criticidade e capacidade operacional.

Não utilizar rotação frequente de portas como substituto de rotação de credenciais.

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


## 39.1 Regra obrigatória de testes por feature

Toda feature, implementação, correção ou alteração de comportamento executável deve criar ou atualizar os testes aplicáveis **na mesma entrega**.

Regra:

```text
FEATURE SEM TESTE APLICÁVEL
=
FEATURE INCOMPLETA
```

A exigência mínima é:

- teste unitário quando houver lógica isolável;
- teste HTTP via `fastify.inject()` quando alterar endpoint/contrato;
- teste de integração quando houver banco, PostGIS, migration ou integração relevante;
- teste negativo/de abuso quando houver regra de segurança ou autorização.

Correção de bug:

```text
reproduzir com teste
→ teste falha
→ corrigir
→ teste passa
```

Pode ser marcado como `N/A` somente quando realmente não houver comportamento executável testável, por exemplo:

- documentação;
- ativo estático;
- mudança visual puramente cosmética;
- alteração sem lógica.

O `N/A` deve ser justificado no Pull Request.

Mudanças de migration não são dispensadas: devem possuir validação em banco limpo e teste de integração quando aplicável.

Testes criados pela mesma IA que implementou a feature não são evidência suficiente por si só. Casos negativos devem ser derivados das regras de negócio, critérios de aceite e Security Gate, e mudanças sensíveis continuam exigindo revisão humana.

## 40. Decisões fechadas — resumo

| Tema | Decisão aprovada |
|---|---|
| Backend | Node.js 26 LTS + TypeScript + Fastify |
| Frontend | React + TypeScript + Vite |
| Design | `DESIGN.md` separado, em elaboração pelo outro integrante |
| Sessão | server-side em Fastify + cookie seguro |
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
| Observabilidade | Grafana + Loki + `/health` e `/ready` |
| Logs | 7d aplicação / 30d segurança / 90d auditoria |
| Backup | local na própria VPS no MVP |
| Limite municipal | polígono oficial + PostGIS |
| Reabertura | status `REABERTA` |
| Testes | stack completa/equilibrada aprovada |
| Security Gate | SEC-001..SEC-100 obrigatório por feature |
| Hardening de autenticação | rate limit multicamada + cooldown + lockout inteligente |
| MFA | opcional cidadão / obrigatório moderador e admin antes de produção |
| MFA preferencial | WebAuthn / Passkeys / FIDO2 |
| Rede | segmentação Docker + PoLP |
| Zero Trust | adotado como princípio, sem stack enterprise obrigatória |
| WAF | requisito de hardening antes do lançamento público, com tuning |
| Cyber deception | honeytokens futuros opcionais; honeypot/tarpit/.env falso fora do MVP |
| Testes por feature | obrigatórios na mesma entrega |

---

## 41. Pontos deliberadamente não definidos aqui

Não considerar decididos apenas por ausência de detalhe:

- conteúdo do `DESIGN.md`;
- SMTP vs API para Postmark;
- mecanismo exato de persistência da sessão server-side em produção;
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
