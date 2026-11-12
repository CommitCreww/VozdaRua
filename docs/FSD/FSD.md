# FSD — VOZ DA RUA
**Functional Specification Document**  

**Versão:** 1.4 — especificação consolidada com decisões abertas explicitamente delimitadas  

**Status:** Apta à implementação modular apenas dos requisitos aprovados; decisões abertas de sessão, e-mail, política de deixar de seguir e navegação ficam bloqueadas até aprovação específica; textos jurídicos finais pendentes para lançamento  

**Plataforma:** PWA mobile-first  

**Backend:** Node.js + TypeScript + Fastify  

**Frontend:** React + TypeScript + Vite  

**Banco:** PostgreSQL + PostGIS

> Este documento é autossuficiente para orientar a implementação.  

> Decisões visuais marcadas como provisórias não devem ser transformadas em definitivas por suposição.

---

# 1. Visão geral
O Voz da Rua é uma plataforma digital voltada inicialmente ao município de São Paulo para centralizar o registro, descoberta, acompanhamento, moderação e encaminhamento de problemas urbanos, estruturais e de acessibilidade.

O sistema permite que cidadãos:

- encontrem problemas próximos;

- registrem novos problemas;

- confirmem problemas existentes por meio de “Eu também vi”;

- acompanhem ocorrências;

- contribuam para resolução e reabertura comunitária;

- descubram o canal oficial responsável;

- participem de uma área Social;

- recebam notificações;

- acompanhem sua própria participação.

O produto é **mobile-first** e distribuído como **PWA**, mas permanece acessível pelo navegador sem instalação.

---

# 2. Princípios de domínio
O sistema deve preservar a separação entre:

```text

OCORRÊNCIA

→ problema real localizado

RELATO

→ participação formal do cidadão em uma ocorrência

POST SOCIAL

→ publicação da área Social

COMENTÁRIO SOCIAL

→ conversa ligada a um post

```

Um post Social não substitui um relato formal.

Uma curtida, comentário ou compartilhamento social não altera a contagem de relatos da ocorrência.

---

# 3. Escopo geográfico
O MVP atende somente:

```text

Município de São Paulo — SP

```

Regras:

- ocorrências fora do município não podem ser criadas;

- criação de denúncia exige localização ativa;

- “Eu também vi” exige localização ativa;

- voto comunitário de resolução exige localização ativa;

- sinalização comunitária de reabertura exige localização ativa;

- ações presenciais exigem distância máxima de 3 km.

A localização reduz abuso, mas não é tratada como prova absoluta de presença física.

O histórico contínuo de deslocamento do usuário não deve ser armazenado.

---

# 4. Perfis e estados de conta

### 4.0 Matriz normativa de autorização (RBAC + contexto)

A matriz abaixo é normativa para UI, API e testes. `C` significa ação permitida sob condições do domínio; `—` significa negada. Toda operação depende de sessão válida, usuário com situação autorizada, autorização no Service e ausência de restrição contextual. A categoria **cidadão ativo** inclui MODERADOR e ADMIN quando atuam como cidadãos; privilégios administrativos não dispensam auditoria nem os limites expressamente exigidos para ações comunitárias. Uma conta `BANIDO` fica somente em leitura, **independentemente do papel armazenado**; acessos administrativos também ficam bloqueados até desbanimento.

| Operação | CIDADAO ATIVO | BANIDO | MODERADOR ATIVO | ADMIN ATIVO | Condição adicional |
|---|---|---|---|---|---|
| Consultar Home, ocorrências, Social e perfis visíveis | C | C | C | C | Autenticado, filtros de visibilidade |
| Criar ocorrência como cidadão | C | — | C | C | Localização, município, 3 km, foto |
| Criar ocorrência administrativamente | — | — | — | C* | Permissão aprovada, implementação bloqueada até contrato de estados, validações e evidências da seção 24.0 |
| Confirmar relato, votar resolução, sinalizar reabertura | C | — | C | C | 3 km, ciclo, unicidade e estado válido |
| Editar/excluir ocorrência própria | C | — | C | C | Titularidade, até 12 h, ainda não validada |
| Publicar Social | C | — | C | C | Perfil público |
| Curtir, comentar, responder e seguir | C | — | C | C | Restrições do recurso, do perfil público de destino e da conta |
| Deixar de seguir | PENDENTE | — | PENDENTE | PENDENTE | Política funcional ainda sem aprovação: não implementar rota, controle ou efeito definitivo |
| Editar/remover conteúdo Social próprio | C | — | C | C | Titularidade e regras de histórico |
| Acessar fila, alertas, validar/rejeitar/duplicar | — | — | C | C | Operação registrada e justificada quando exigida |
| Editar ocorrência em moderação, foto pública, remover pin | — | — | C | C | Escopo de moderação, auditoria |
| Resolver/reabrir por decisão humana | — | — | C | C | Estado permitido, justificativa, histórico |
| Arquivar/restaurar ocorrência | — | — | — | C | Arquivar somente RESOLVIDA, REJEITADA ou DUPLICADA; restaurar status anterior com justificativa e auditoria |
| Banir/desbanir, promover/remover moderador | — | — | — | C | Somente ADMIN, revalidação de sessões |
| Gerenciar categorias, subcategorias, órgãos, canais e parâmetros | — | — | — | C | Somente ADMIN |
| Consultar indicadores e auditoria administrativa | — | — | — | C | Minimização e controle de acesso |

**Nota da matriz:** `C*` significa permissão de papel existente, mas funcionalidade bloqueada para implementação até aprovação das regras operacionais pendentes.

**Negar por padrão:** rota não documentada ou permissão omissa não é liberada. `UUID`, botão oculto, sessão autenticada ou papel isolado não comprovam autorização. Para leitura, nunca retornar conteúdo pendente, privado, removido ou moderado fora das regras de visibilidade. Órgãos externos **não possuem contas no MVP**.

**Conta local ainda não verificada — contrato de segurança restritivo:** `email_verificado_em IS NULL` identifica a conta local pendente de confirmação, independentemente de `ATIVO/BANIDO`, sem exigir novo valor no enum. O cadastro grava a conta privada, o aceite dos Termos e a ciência da Política de Privacidade em caixas independentes inicialmente desmarcadas, com versões e timestamps, e encaminha a mensagem de confirmação; não concede sessão de acesso à área autenticada. Tentativa de login local com credenciais corretas, porém e-mail não confirmado, não abre sessão de aplicação nem redireciona à Home: apresenta instrução para confirmar o e-mail e oferece reenvio protegido contra abuso. A verificação aceita exclusivamente token válido, não consumido e não expirado; confirma a conta uma única vez, registra `email_verificado_em` e invalida o token. Depois, o cidadão pode autenticar normalmente. Cadastro, verificação, reenvio e recuperação operam como fluxos públicos protegidos contra enumeração e abuso; não liberam operações comunitárias, moderação, administração ou leitura autenticada. A conta externa cujo provider comprova e-mail verificado dispensa segunda confirmação; associação com conta local preexistente **nunca ocorre automaticamente**: requer autenticação prévia na conta existente, autorização explícita de vinculação e verificação segura da identidade externa (seção 13.6). Uma conta BANIDO continua em somente leitura após autenticação, mesmo que tenha e-mail verificado.

Essa é a política de execução mínima de **negação por padrão** para a situação não detalhada nas decisões anteriores; não introduz novo papel, nova funcionalidade, novo status de banco ou mecanismo de login. Qualquer alternativa que permita sessão pré-verificação exige aprovação funcional expressa e atualização do FSD antes de ser utilizada. Exclusão de conta e alterações de dados cadastrais seguem suas regras próprias; o bloqueio de colaboração não permite realizar mudanças administrativas por rotas alternativas.

**Mudança de papel/status com sessão ativa:** banimento, desbanimento, promoção e remoção de moderador exigem auditoria e atualização efetiva das permissões em todas as sessões existentes. O backend deve invalidar sessões impactadas **ou** revalidar papel/status em cada operação sensível, com comportamento de revogação imediata; regenerar identificadores ao trocar privilégios quando a sessão continuar. O cookie/session store nunca poderá preservar autorização anterior após banimento ou rebaixamento. Cobrir dois navegadores e requisições simultâneas em testes.

## 4.1 Papéis
```text

CIDADAO

MODERADOR

ADMIN

```

Existe apenas um nível de administrador.

## 4.2 Estados
```text

ATIVO

BANIDO

```

## 4.3 Cidadão ativo
Pode:

- autenticar;

- acessar Home;

- visualizar ocorrências;

- criar ocorrência;

- usar “Eu também vi”;

- votar resolução;

- sinalizar reabertura;

- editar/excluir conteúdo próprio quando a regra permitir;

- acessar Social;

- curtir;

- comentar;

- responder;

- seguir perfis públicos;

- tornar perfil público;

- publicar quando perfil público;

- acessar canais oficiais;

- receber notificações.

## 4.4 Cidadão banido
Pode autenticar e permanecer em **somente leitura**.

Pode visualizar:

- Home;

- ocorrências;

- detalhes;

- Social;

- perfis públicos.

Não pode:

- criar denúncia;

- confirmar ocorrência;

- votar resolução;

- sinalizar reabertura;

- publicar;

- comentar;

- responder;

- curtir;

- seguir;

- executar qualquer outra ação colaborativa.

O backend deve aplicar esse bloqueio; esconder botões no frontend não é suficiente.

## 4.5 Moderador
Pode, além das permissões aplicáveis:

- acessar fila de moderação;

- visualizar alertas;

- validar;

- rejeitar;

- marcar duplicidade;

- editar título/descrição/categoria;

- definir foto pública;

- remover pin;

- resolver;

- reabrir;



- analisar denúncia de ocorrência;

- moderar conteúdo Social;

- registrar justificativa;

- visualizar histórico/evidências.

Toda ação relevante deve gerar auditoria.

## 4.6 Administrador

**Restrição obrigatória:** arquivar e restaurar ocorrências são operações administrativas e exigem `ADMIN` no backend, mesmo quando a rota estiver no namespace `/moderation`. Somente a remoção de pin, quando aplicável, integra o conjunto de ações do moderador. As alterações administrativas devem registrar ator, justificativa e auditoria. Não há papel adicional acima de ADMIN.

Além das permissões do moderador:

- promove/remove moderadores;

- bane/desbane;

- cria ocorrência administrativamente;

- edita qualquer ocorrência;

- gerencia categorias/subcategorias;

- gerencia órgãos/canais;

- gerencia parâmetros;

- visualiza auditoria;

- acessa indicadores agregados.

---

# 5. Arquitetura técnica
## 5.1 Visão
```text

React PWA

    │ HTTPS / JSON

    ▼

Nginx

    │

    ▼

Node.js 26 LTS + TypeScript + Fastify

    │

    ├── PostgreSQL 17 + PostGIS 3.6

    ├── MinIO

    ├── Postmark

    ├── Web Push / VAPID

    └── MapTiler

Grafana + Loki

```

MapLibre GL JS roda no frontend.

PostGIS é a autoridade para as regras geográficas.

## 5.2 MVC adaptado
O projeto mantém organização inspirada em MVC:

- **Model:** banco, repositories e tipos do domínio;

- **View:** frontend React/PWA;

- **Controller:** controllers acionados pelas rotas Fastify;

- **Service:** camada adicional obrigatória para regras de negócio.

## 5.3 Estrutura do repositório
```text

[Diretório do Projeto - Repositório]/

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   ├── features/

│   │   ├── pages/

│   │   ├── routes/

│   │   ├── services/

│   │   ├── hooks/

│   │   ├── styles/

│   │   └── assets/

│   ├── package.json

│   └── package-lock.json

├── backend/

│   ├── src/

│   │   ├── app.ts

│   │   ├── server.ts

│   │   ├── config/

│   │   ├── routes/

│   │   ├── controllers/

│   │   ├── services/

│   │   ├── repositories/

│   │   ├── schemas/

│   │   ├── plugins/

│   │   ├── hooks/

│   │   ├── security/

│   │   ├── integrations/

│   │   ├── errors/

│   │   └── types/

│   ├── tests/

│   ├── package.json

│   ├── package-lock.json

│   └── tsconfig.json

├── db/

│   ├── migrations/

│   └── seeds/

├── scripts/

│   └── migrate.sh

├── docs/

│   ├── PRD.md

│   ├── DECISOES_TECNICAS.md

│   ├── DESIGN.md

│   ├── FSD.md

│   └── SECURITY_GATE_100.md

├── compose.yml

├── .env.example

└── README.md

```

Pastas internas não são servidas diretamente pelo Nginx.

O frontend compilado e a API são os únicos recursos públicos planejados.

---

# 6. Runtime e dependências estruturais
Backend:

```text

Node.js 26 LTS

TypeScript

Fastify

npm

pg (node-postgres)

```

Frontend:

```text

React

TypeScript

Vite

MapLibre GL JS

```

Regras:

- `package-lock.json` deve ser versionado;

- CI usa `npm ci`;

- nenhuma dependência sugerida por IA é instalada antes de verificar existência, manutenção e origem;

- não existe ORM obrigatório;

- SQL do domínio é executado por repositories com parâmetros;

- migrations continuam sendo SQL versionado.

A biblioteca concreta de validação de schemas, OAuth, CSRF, rate limiting e sessão persistente pode ser definida no início do módulo correspondente, desde que respeite o Security Gate.

---

# 7. Configuração e secrets
O projeto usa variáveis de ambiente.

Versionar:

```text

.env.example

```

Não versionar:

```text

.env

```

Segredos proibidos no Git:

- senha PostgreSQL;

- credencial MinIO;

- credencial Postmark;

- chave VAPID privada;

- segredos OAuth;

- segredo de sessão;

- credencial de deploy.

No desenvolvimento, Node 26 pode receber configuração por ambiente/arquivo de ambiente conforme scripts do projeto.

Em produção, Docker Compose fornece as variáveis/secrets necessários.

Nenhum secret deve ficar hardcoded em arquivo TypeScript.

---

# 8. Banco de dados
## 8.1 Baseline
```text

PostgreSQL 17

PostGIS 3.6

pgcrypto

UUID

TIMESTAMPTZ

```

As migrations `001–017` já são baseline e não podem ser reescritas.

## 8.2 Migrations existentes
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

Toda evolução entra em `018+`.

## 8.3 Runner
O projeto mantém migration runner versionado.

Fluxo:

```text

listar migrations por ordem

→ consultar schema_migrations

→ executar somente não aplicadas

→ abortar ao primeiro erro

→ registrar sucesso

```

Não expor migration runner por endpoint HTTP público.

Não executar migration automaticamente em toda request ou startup sem controle de ambiente.

---

# 9. Modelo de dados existente

### 9.0 Dicionário conceitual e convenções de integridade

As entidades abaixo constituem o **modelo conceitual de implementação**; nomes e tipos físicos exatos das migrations `001–017` devem ser verificados nos arquivos SQL existentes antes de escrever repositories. Este FSD não autoriza renomear colunas, modificar migrations aplicadas ou criar campos homônimos por inferência. Evoluções aprovadas entram em `018+` e devem manter compatibilidade. Toda entidade que participa do histórico deve ter identificação, relacionamentos, timestamps e autoria quando existirem na migration correspondente; somente adicionar campos ausentes mediante migration nova validada.

| Conceito | Relação/identidade | Integridade e tratamento |
|---|---|---|
| Usuário / identidade externa | usuário 1:N identidades | E-mail único case-insensitive; papel/status e verificação separados; privacidade por padrão |
| Ocorrência / ciclo | ocorrência 1:N ciclos | No máximo um ciclo aberto; status e histórico coerentes |
| Relato / evidência | ocorrência/ciclo/usuário; relato 0..1 foto ativa | Unicidade de relato ativo por usuário/ciclo; fotos originais privadas; soft delete |
| Categoria / subcategoria | categoria 1:N subcategorias | A subcategoria escolhida pertence à categoria e obedece obrigatoriedade |
| Status / histórico / moderação | ocorrência 1:N registros | Transições autorizadas e auditadas; justificativa quando exigida |
| Voto / sinalização | usuário, ocorrência e ciclo | Unicidade por usuário/ciclo, limiares do ciclo pertinente |
| Órgão / canal / associação | categoria -> canais / responsável | Destino configurável, sem protocolo automático |
| Social | post, comentário, resposta, curtida, seguidor | Autoria, privacidade, remoção lógica e unicidades |
| Notificações / preferências / push | usuário 1:N eventos e subscriptions | Opt-in, revogação, minimização de dados |
| Auditoria / parâmetros | ação e configuração | Proteção contra alteração indevida; retenções definidas |

Para soft delete, a regra de unicidade deve considerar somente itens **ativos** quando a migration assim permitir; erros de constraint tornam-se erros de domínio. Nunca retornar colunas internas brutas em DTO público. Aplicar índices para joins, filtros e PostGIS, além de constraints efetivas; não confiar apenas em verificações de aplicação.

## 9.1 `usuarios`
Campos principais:

- `id UUID`;

- `nome VARCHAR(120)`;

- `email VARCHAR(255)`;

- `senha_hash`;

- `papel`;

- `status`;

- `perfil_publico`;

- `exibir_nome_nos_relatos`;

- `email_verificado_em`;

- `ultimo_acesso_em`;

- timestamps.

Constraints:

- e-mail único case-insensitive;

- papéis limitados;

- estados limitados.

## 9.2 `identidades_auth`
Vincula identidade externa:

- usuário;

- provider;

- subject externo;

- e-mail do provider;

- último login.

Providers existentes:

```text

GOOGLE

GITHUB

OIDC

```

## 9.3 `categorias_ocorrencia`
Contém:

- slug;

- nome;

- descrição;

- tipo de ambiente;

- ícone;

- ativo.

Categorias iniciais:

- Buraco na via;

- Calçada irregular;

- Falta de acessibilidade;

- Iluminação pública;

- Sinalização;

- Transporte público;

- Obstrução de passagem;

- Estrutura pública;

- Estrutura privada;

- Outro.

## 9.4 `status_ocorrencia`
Estados:

```text

PENDENTE_VALIDACAO

VALIDADA

ENCAMINHADA

EM_ANALISE

EM_RESOLUCAO

RESOLVIDA

REJEITADA

DUPLICADA

ARQUIVADA

REABERTA

```

`REABERTA` é status canônico e visível.

## 9.5 `ocorrencias`
Representa o problema real.

Campos principais:

- categoria;

- status;

- criador;

- título;

- descrição;

- `GEOGRAPHY(POINT,4326)`;

- endereço;

- número;

- bairro;

- CEP;

- cidade;

- estado;

- datas de validação/resolução/arquivamento;

- timestamps.

Índice espacial GiST obrigatório.

## 9.6 `ocorrencia_ciclos`
Cada ocorrência possui ciclos numerados.

Motivos:

```text

INICIAL

REABERTURA_MODERACAO

REABERTURA_COMUNIDADE

```

Somente um ciclo pode permanecer aberto por ocorrência.

## 9.7 `relatos`
Tipos:

```text

INICIAL

CONFIRMACAO

REABERTURA

```

Armazena:

- ocorrência;

- ciclo;

- usuário;

- texto opcional;

- proximidade validada;

- distância verificada;

- datas;

- exclusão lógica.

Um usuário possui no máximo um relato ativo por ciclo, assegurado por constraint no banco. **Esta unicidade por ciclo não altera o requisito de participação histórica única por ocorrência.** Para métricas públicas de participantes únicos da ocorrência, contar `DISTINCT usuario_id` entre participações elegíveis da ocorrência, independentemente do número de ciclos; não somar contagens de ciclos para obter pessoas únicas. Os contadores de decisão de resolução e reabertura são **separados** e usam cidadãos distintos na janela/ciclo correspondente, conforme suas próprias regras. Um relato de `REABERTURA` não pode ser computado como segunda pessoa única da mesma ocorrência. A existência de novo ciclo permite nova participação contextual, sem duplicar o cidadão no total histórico. A política de exibição de contagens por ciclo deve identificar explicitamente o período e não confundir-se com o total histórico.

## 9.8 `evidencias`
Foto da ocorrência.

Armazena metadados e chave do objeto MinIO.

Existe no máximo:

- uma foto ativa por relato;

- uma foto pública ativa por ocorrência.

## 9.9 `historico_status`
Registra:

- status anterior;

- novo;

- ator;

- origem;

- observação;

- data.

## 9.10 Moderação
```text

acoes_moderacao

denuncias_ocorrencia

ocorrencias_duplicadas

alertas_moderacao

```

## 9.11 Resolução e reabertura
```text

votos_resolucao

sinalizacoes_reabertura

```

Unicidade por usuário/ciclo é garantida pelo banco.

## 9.12 Encaminhamento
```text

orgaos_responsaveis

canais_denuncia

categoria_canais

```

## 9.13 Social
```text

posts

comentarios

curtidas_posts

seguidores

```

## 9.14 Notificações
```text

notificacoes

```

## 9.15 Auditoria
```text

logs_auditoria

```

## 9.16 Parâmetros
```text

parametros_sistema

```

Parâmetros existentes:

```text

ocorrencia.distancia_maxima_metros = 3000

moderacao.alerta_relatos = 10

ocorrencia.janela_edicao_horas = 12

ocorrencia.resolucao_comunitaria_minimo = 10001

ocorrencia.reabertura_alerta_minimo = 1000

plataforma.cidade = São Paulo

plataforma.estado = SP

plataforma.locale = pt-BR

```

## 9.17 Views
```text

vw_ocorrencias_resumo

vw_usuarios_publicos

```

---

# 10. Evoluções de banco necessárias em migrations `018+`
## 10.1 Tokens de conta
Criar estrutura para:

- confirmação de e-mail;

- recuperação de senha.

Campos mínimos:

- id;

- usuario_id;

- tipo;

- hash do token;

- expiração;

- uso/consumo;

- data de criação.

Tipos:

```text

EMAIL_VERIFICATION

PASSWORD_RESET

```

O token puro não deve ser persistido.

## 10.2 Subcategorias
Criar entidade de subcategoria relacionada à categoria.

Categoria deve indicar modo:

```text

SEM_SUBCATEGORIA

OPCIONAL

OBRIGATORIA

```

Ocorrência poderá referenciar uma subcategoria.

O banco/API devem impedir subcategoria de outra categoria.

## 10.3 Imagem de post Social
Criar estrutura para uma imagem ativa opcional por post.

Guardar:

- post;

- storage provider;

- chave;

- MIME;

- tamanho;

- hash;

- dimensões;

- timestamps.

## 10.4 Replies
Adicionar referência opcional de comentário pai.

Regra:

```text

comentário raiz → pode ter resposta

resposta → não pode ter resposta

```

## 10.5 Denúncia e moderação Social
Criar estrutura para:

- denúncia de post/comentário;

- motivo;

- denunciante;

- status;

- moderador;

- decisão;

- timestamps;

- ação de moderação.

## 10.6 Preferências e push
Criar:

- preferências de notificação;

- Web Push subscriptions.

Subscriptions devem poder ser revogadas e associadas ao usuário/dispositivo.

## 10.7 Analytics de canais
Criar registro mínimo para contabilizar abertura de canal oficial.

Evitar armazenar usuário quando não necessário.

## 10.8 Polígono municipal
Criar estrutura versionada para área atendida.

Campos conceituais:

- id;

- nome;

- código oficial/fonte;

- versão da malha;

- geometria `MULTIPOLYGON` SRID 4326;

- ativo;

- timestamps.

A validação usa `ST_Covers` ou equivalente.

## 10.9 Parâmetro de duplicidade
Adicionar:

```text

ocorrencia.duplicidade_raio_metros = 100

```

---

# 11. API

### 11.0 Contrato mínimo de operações

Cada endpoint implementado deve ter DTO explícito de entrada/saída, requisito de autenticação, papel/estado da conta, autorização contextual, validação, possíveis mudanças no banco, possíveis eventos e erros de domínio. `401` para sessão ausente/inválida, `403` para falta de permissão, `404` para recurso inexistente ou oculto de acordo com política de privacidade, `409` para conflito de unicidade/estado quando adequado, `422` para regra de domínio inválida quando aplicável, `429` para limite de tentativas; seguir padronização de erro da seção 12, sem revelar dados privados. Os códigos exatos de cada operação e política de ocultação devem ser fixados no contrato de módulo antes da implementação; exemplos não substituem contrato aprovado. Mutação protegida por cookie requer CSRF. Listas usam filtros/ordenação allowlisted e paginação, não retornam linhas brutas do banco.

**Operação de exemplo — criar ocorrência:** entrada com ponto, categoria/subcategoria, título/descrição e exatamente uma foto válida; sessão e elegibilidade verificadas no backend; saída inclui identificador e `PENDENTE_VALIDACAO`, sem publicação. **Operação de exemplo — confirmação:** referência à ocorrência, texto opcional, localização válida e ausência de relato ativo no ciclo; resultado preserva unicidade. **Operação de exemplo — transição administrativa:** papel adequado, estado permitido, justificativa quando aplicável, auditoria e atualização atômica. Esses exemplos são padrões do contrato existente, não novas funções.

Prefixo:

```text

/api/v1

```

Formato:

```text

application/json

```

Uploads:

```text

multipart/form-data

```

IDs públicos:

```text

UUID

```

Datas:

```text

ISO-8601

```

Listagens grandes:

- paginação obrigatória;

- page size limitado;

- filtros allowlisted;

- sort allowlisted.

---

# 12. Formato de erro
Resposta padrão:

```json

{

  "code": "OCCURRENCE_TOO_FAR",

  "message": "O local informado está fora do limite permitido.",

  "requestId": "uuid-ou-correlation-id"

}

```

Pode incluir detalhes de validação seguros.

Nunca retornar:

- stack trace;

- SQL;

- caminho interno;

- secret;

- configuração;

- detalhes que facilitem enumeração de conta.

---

# 13. Sessão e autenticação
## 13.1 Modelo
Sessão server-side.

Cookie:

- HttpOnly;

- Secure em produção;

- SameSite apropriado;

- path restrito;

- expiração controlada.

Proibido:

- auth token em localStorage;

- auth token em sessionStorage.

## 13.2 Persistência e duração da sessão

**Decisão aprovada:** autenticação por sessão **server-side**, com identificador opaco em cookie seguro (`HttpOnly`, `Secure` em produção, `SameSite` apropriado), sem token de autenticação em `localStorage` ou `sessionStorage`. O store deve ser persistente e compartilhável entre instâncias quando aplicável; **store exclusivamente em memória é proibido em produção**. Logout invalida a sessão no servidor; login e alterações de privilégio exigem regeneração do identificador e prevenção de fixation. A aplicação revalida status e papel sensíveis e aplica timeout server-side.

**Decisões técnicas essenciais em aberto para concluir este módulo:** tecnologia concreta de persistência da sessão em produção (PostgreSQL é uma alternativa, **não decisão aprovada**), duração exata de inatividade e política exata de renovação. Não criar tabela ou migration específica de store nem fixar TTL numérico sem aprovação técnica registrada. O módulo de autenticação somente poderá ser considerado concluído após registrar essas definições em documentação técnica controlada, configuração e testes de expiração/revogação. O restante do backend não precisa aguardar a escolha do store.

Mudança de senha invalida **todas as outras sessões ativas** da conta; a sessão utilizada deve ser renovada de forma segura. Banimento, remoção de moderador e demais alterações de privilégios exigem revogação efetiva imediata por invalidação ou revalidação, inclusive em outros dispositivos. Não registrar identificadores secretos em logs; remover sessões expiradas de forma coerente com a estratégia que for aprovada.

## 13.3 CSRF
Toda mutação autenticada por cookie deve possuir proteção CSRF.

Também validar `Origin`/`Referer` quando apropriado como defesa adicional.

## 13.4 Cadastro local

**Autorização durante a confirmação:** cadastro local cria `ATIVO` com `email_verificado_em = NULL`, perfil privado e aceites obrigatórios, mas sem sessão da aplicação. Até validar o token, acesso autenticado de leitura, escrita, moderação e administração permanece indisponível. Login pré-verificação responde com orientação de confirmação sem sessão autenticada; reenvio é acessado no fluxo público e tem resposta neutra e rate limiting. Após confirmação bem-sucedida, atualizar `email_verificado_em`, consumir o token e exigir login para iniciar sessão. Usuários Google/GitHub com e-mail comprovadamente verificado não precisam de segunda confirmação. Contas externas com e-mail de conta já existente exigem autenticação na conta original e autorização explícita de vinculação, conforme seção 13.6; vinculação automática é proibida. Textos e versionamento legais dependem de aprovação; o aceite obrigatório não pode ser omitido.

Entrada:

- nome;

- e-mail;

- senha;

- confirmação;

- aceite dos termos;

- ciência da política de privacidade (checkbox independente).

Fluxo:

```text

validar entrada

→ verificar e-mail único

→ criar usuário privado

→ hash seguro da senha

→ gerar token de confirmação

→ enviar por adaptador de e-mail (Mailpit via SMTP em desenvolvimento, Postmark em produção (transporte SMTP/API ainda não aprovado))

→ conta aguarda confirmação

```

Confirmação de e-mail é obrigatória para conta local.

**Parâmetros de senha ratificados em 12/11/2026 (D04):** **15 a 128 caracteres**, com suporte a frases-senha, sem obrigatoriedade de símbolos, números ou maiúsculas, e hash adaptativo **Argon2id** (19 MiB, 2 iterações, paralelismo 1, salt único aleatório). Bloquear senhas comuns/comprometidas por lista local. Nunca persistir senha em texto puro. Aplicar a mesma política a cadastro e redefinição; benchmark antes da produção. Histórico: a proposta anterior de 12 a 128 caracteres foi substituída pela decisão D04.

## 13.5 Login

**Sessões diante de alteração administrativa:** antes de cada operação protegida, garantir que `papel`, `status` e condição de confirmação são atuais para o usuário. Sessões abertas antes de banimento ou rebaixamento não podem continuar a escrever ou administrar com permissões antigas. Após mudança de privilégio, invalidar/revalidar sessões do sujeito e regenerar ID quando apropriado. Testes incluem sessão antiga após banimento, remoção de moderador em segunda aba e tentativa concorrente de escrita. O store e a duração de inatividade ainda exigem aprovação conforme seção 13.2; nenhum valor ou produto específico é obrigatório neste momento.

Login local com e-mail não verificado não autentica na área interna, conforme 4.0 e 13.4. Erros de autenticação evitam revelar existência de e-mails; o aviso de confirmação só pode ser apresentado após validação adequada das credenciais. O redirecionamento para Home ocorre apenas depois de sessão efetivamente estabelecida.

Conta banida pode autenticar, mas recebe sessão read-only.

Após login:

- regenerar ID de sessão;

- registrar acesso;

- redirecionar ao fluxo autenticado.

## 13.6 Google/GitHub
OAuth/OIDC:

- state;

- nonce quando aplicável;

- callback allowlisted;

- vinculação segura;

- não confiar em e-mail não verificado.

Quando provider garantir e-mail validado, não exigir segunda confirmação.

**Vinculação aprovada:** se a identidade Google/GitHub apresentar e-mail já associado a conta existente, **não vincular automaticamente pelo e-mail**. Exigir que o usuário se autentique na conta existente e autorize expressamente a vinculação, com validação da identidade externa pelo protocolo, `state`/`nonce` e comprovação de titularidade; impedir vinculação cruzada a outra conta, duplicação de identidade e takeover. Quando o usuário não comprovar a conta existente, negar a associação e orientar o acesso ao método original de forma segura, sem enumerar contas. A vinculação deve ser auditada e os privilégios revistos. Não criar um segundo usuário com o mesmo e-mail nem elevar papel por dados do provider.

## 13.7 Recuperação
Fluxo:

```text

solicitar

→ resposta neutra

→ token aleatório de uso único

→ hash persistido

→ envio por adaptador de e-mail aprovado

→ redefinição

→ invalidar token

```

Não revelar se o e-mail existe.

**Validades propostas, não ratificadas tecnicamente:** confirmação de e-mail em **24 horas** e recuperação de senha em **30 minutos**. Antes de concluir esses fluxos, aprovar os prazos exatos. Independentemente do prazo aprovado, ambos os tokens devem ser aleatórios, de uso único, persistidos apenas em hash, expirar e ser invalidados no consumo. Solicitações de recuperação e reenvio ficam sujeitas ao rate limiting multicamada e cooldown das seções 13.9.1 e 13.9.2; limites numéricos de solicitações devem ser escolhidos na configuração técnica do módulo e testados sem facilitar enumeração ou DoS de conta alheia. Após redefinir a senha, invalidar as demais sessões ativas.

## 13.8 Endpoints
```text

POST /api/v1/auth/register

POST /api/v1/auth/login

POST /api/v1/auth/logout

POST /api/v1/auth/email/verify

POST /api/v1/auth/email/resend

POST /api/v1/auth/password/forgot

POST /api/v1/auth/password/reset

GET  /api/v1/auth/oauth/google

GET  /api/v1/auth/oauth/google/callback

GET  /api/v1/auth/oauth/github

GET  /api/v1/auth/oauth/github/callback

```

---

# 13.9 Hardening de autenticação
## 13.9.1 Rate limiting multicamada
Aplicar limites por combinação de:

- IP/origem;

- conta/e-mail normalizado;

- sessão;

- endpoint.

Obrigatório em:

```text

POST /api/v1/auth/login

POST /api/v1/auth/register

POST /api/v1/auth/password/forgot

POST /api/v1/auth/email/resend

```

Também aplicar limites coerentes em endpoints caros ou abusáveis, incluindo:

- criação de ocorrência;

- relatos;

- comentários;

- denúncias Social;

- uploads;

- buscas caras.

## 13.9.2 Cooldown e lockout inteligente
Falhas consecutivas aumentam o cooldown.

Preferir:

```text

falha

→ registrar contador/janela

→ calcular cooldown

→ 429 enquanto bloqueado

```

Não manter a conexão aberta artificialmente para atrasar o atacante.

Bloqueio:

- temporário;

- progressivo;

- não permanente automático;

- não deve permitir DoS simples contra conta de terceiro.

## 13.9.3 MFA
Política:

```text

CIDADÃO

→ opcional

MODERADOR

→ obrigatório antes de operar em produção

ADMIN

→ obrigatório antes de operar em produção

```

Método preferencial:

```text

WebAuthn / Passkeys / FIDO2

```

SMS não deve ser o fator principal quando existir opção resistente a phishing.

Fluxos de recuperação de MFA precisam de revisão humana reforçada.

A feature de MFA deve incluir:

- cadastro do autenticador;

- verificação;

- revogação;

- recuperação segura;

- auditoria;

- teste de bypass;

- teste de privilege escalation.

# 14. Perfil, termos e privacidade

Endpoints existentes:

```text
GET    /api/v1/me
PATCH  /api/v1/me
PATCH  /api/v1/me/privacy
DELETE /api/v1/me
```

A conta nasce com perfil **PRIVADO**; o usuário pode alterar `perfil_publico` e a preferência de identificação em relatos quando autorizado. Não confundir publicação Social com relato formal. Alterar a privacidade para privada oculta posts públicos elegíveis, não os apaga fisicamente; posts excluídos ou removidos pela moderação não reaparecem. Alteração para privado também preserva os relacionamentos de seguidores existentes sem sua exposição pública (seção 28.7).

## 14.1 Termos de Uso e Política de Privacidade

Cadastro local exige **duas caixas de seleção independentes, inicialmente desmarcadas**: (1) “Li e aceito os Termos de Uso”; (2) “Li e estou ciente da Política de Privacidade”. Os documentos são acessíveis publicamente, inclusive sem autenticação, na tela de cadastro, e também pela área Perfil. O cadastro é recusado se faltar qualquer marcação. Registrar no banco, com migração `018+` quando necessário, a **versão dos Termos**, a **data/hora do aceite**, a **versão da Política exibida** e a **data/hora da ciência**, sempre ligados ao usuário. A ciência da Política não é tratada automaticamente como consentimento para todas as finalidades de tratamento de dados; bases legais e textos finais dependem de validação jurídica antes do lançamento.

Mudanças relevantes dos Termos **podem exigir novo aceite**, mediante avaliação e aprovação da equipe; alterações na Política devem ser comunicadas de forma adequada à base legal aplicável. Não inventar aceite retroativo ou finalidade adicional de tratamento por conveniência técnica. O modelo deve comportar versionamento e prova da manifestação registrada, com minimização de dados.

## 14.2 Exclusão e localização

Na exclusão de conta, invalidar sessões, impedir novo acesso à conta excluída, retirar perfil e posts da exibição pública e remover/anonimizar dados pessoais quando aplicável. Preservar relatos de interesse coletivo apenas anonimizados quando necessário e manter **somente** auditoria necessária com justificativa legítima/legal, de acordo com a política de retenção. Excluir logicamente registros cujo apagamento físico destruiria histórico coletivo; garantir que índices e contadores não voltem a identificar titular removido. A exclusão deve respeitar a finalidade e a política de retenção de dados.

A localização atual serve exclusivamente à consulta/proximidade e à validação de ações presenciais; a localização da **ocorrência** é persistida. Não armazenar histórico contínuo do deslocamento do cidadão, nem utilizar localização para publicidade ou rastreamento comportamental. As regras geográficas permanecem validadas no backend/PostGIS.

---

# 15. Home — Perto de você
A Home é a tela inicial autenticada.

Não é o mapa de denúncia.

## 15.1 Consulta
Entrada:

- latitude;

- longitude;

- raio;

- categoria opcional;

- status opcional;

- paginação.

Regra:

```text

raio <= 3000 m

```

## 15.2 Ordenação
Padrão:

1\. mais próximos;

2\. distâncias equivalentes → atualização mais recente primeiro.

## 15.3 Filtros
- categoria;

- distância;

- status.

Faixas de UX:

- 500 m;

- 1 km;

- 2 km;

- 3 km.

## 15.4 Card
Deve disponibilizar:

- categoria;

- título;

- endereço;

- bairro;

- distância;

- contagem de relatos;

- status;

- canal oficial;

- mini mapa da ocorrência;

- foto pública aprovada quando disponível;

- “Eu também vi” quando aplicável;

- acesso a detalhes;

- acesso ao canal oficial.

## 15.5 Endpoint
```text

GET /api/v1/occurrences/nearby

```

Exemplo de query:

```text

lat

lng

radius

category

status

page

size

```

O backend limita o raio mesmo que o cliente envie valor maior.

---

# 16. Fazer denúncia
## 16.1 Pré-condições
- autenticado;

- conta ATIVA;

- localização ativa;

- usuário dentro do município;

- ponto dentro do município;

- distância usuário → ponto <= 3 km.

## 16.2 Mapa
Frontend:

- MapLibre GL JS;

- MapTiler para tiles/geocoding;

- seleção de ponto;

- posição atual;

- busca.

O backend não confia no texto do geocoder para validar município.

## 16.3 Duplicidade
Antes da criação, buscar candidatos:

```text

mesma categoria

\+ ocorrência ativa

\+ <= 100 m

```

É sugestão, não decisão automática.

Endpoint:

```text

GET /api/v1/occurrences/duplicate-candidates

```

## 16.4 Formulário
Campos:

- ponto/localização;

- categoria;

- subcategoria quando aplicável;

- título;

- descrição;

- exatamente uma foto;

- data aproximada de observação, caso habilitada.

## 16.5 Criação
Endpoint:

```text

POST /api/v1/occurrences

```

Transação:

```text

ocorrência

\+ ciclo 1

\+ relato INICIAL

\+ evidência

\+ histórico PENDENTE_VALIDACAO

```

Falha em qualquer etapa:

```text

ROLLBACK

```

Status:

```text

PENDENTE_VALIDACAO

```

Não aparece no mapa/feed público antes da validação.

---

# 17. Upload de imagens

### 17.0 Integridade de metadados e objetos

PostgreSQL e MinIO **não participam de uma transação distribuída comum**. A regra de `ROLLBACK` da criação aplica-se às escritas SQL, não elimina automaticamente o objeto remoto. O fluxo de implementação deve garantir que falha em validação, upload, persistência ou publicação não deixe evidência pública inconsistente: tratar original como privado, associar chave gerada pelo servidor somente após validação, compensar upload em falha posterior e identificar/limpar objetos privados órfãos com processo seguro e auditável. Erro de limpeza não converte objeto em público. Não modificar a regra de exatamente uma foto obrigatória na criação nem aprovar a derivada pública sem moderação. O mecanismo concreto de compensação/limpeza deve ser fechado e testado no módulo de upload, sem adicionar produto/serviço externo por suposição.

Permitidos:

```text

image/jpeg

image/png

image/webp

```

Bloqueado:

```text

SVG

```

Limites:

```text

10 MB

20 megapixels

```

Obrigatório:

- magic bytes;

- MIME real;

- não confiar na extensão;

- chave UUID gerada no servidor;

- impedir path traversal;

- original privado no MinIO;

- derivada pública re-encodada;

- remover EXIF da derivada pública;

- não servir upload com MIME controlado pelo usuário.

Foto pública de ocorrência não pode expor:

- rosto identificável;

- placa legível;

- dado pessoal desnecessário.

---

# 18. “Eu também vi”
Endpoint:

```text

POST /api/v1/occurrences/:id/reports

```

Cria:

```text

CONFIRMACAO

```

Pré-condições:

- ATIVO;

- ocorrência/ciclo válidos;

- localização ativa;

- <= 3 km;

- usuário ainda não possui relato ativo no ciclo.

Foto:

```text

não exigida

```

Texto:

```text

opcional

```

Remoção:

```text

DELETE /api/v1/occurrences/:id/reports/me

```

Permitida até 12 horas após a confirmação.

Depois da janela, permanece no histórico.

---

# 19. Detalhes da ocorrência
Endpoint:

```text

GET /api/v1/occurrences/:id

```

Exibir:

- categoria/subcategoria;

- título;

- descrição;

- endereço;

- bairro;

- mapa;

- foto pública;

- status;

- quantidade de relatos;

- datas;

- canal oficial;

- histórico;

- ciclo;

- resolução;

- selo quando aplicável.

Relatos:

```text

GET /api/v1/occurrences/:id/reports

```

Histórico:

```text

GET /api/v1/occurrences/:id/history

```

Identidade do relato é oculta por padrão.

---

# 20. Minhas ocorrências
Endpoint:

```text

GET /api/v1/me/occurrences

```

Separar:

- criadas por mim;

- Eu também vi.

Filtros:

- tipo de participação;

- status;

- categoria;

- período.

Cada item apresenta:

- categoria;

- título;

- endereço;

- bairro;

- status;

- relatos;

- data;

- atualização.

---

# 21. Edição da ocorrência pelo cidadão
Permitida quando:

```text

agora <= criado_em + 12h

E

a ocorrência ainda não foi validada

```

Campos editáveis:

- título;

- descrição;

- categoria;

- subcategoria;

- foto.

Não editável:

- localização.

Endpoint:

```text

PATCH /api/v1/occurrences/:id

```

O backend valida ownership e janela.

---

# 22. Exclusão inicial
Endpoint:

```text

DELETE /api/v1/occurrences/:id

```

Autor cidadão:

- até 12 horas;

- somente se ainda não validada.

Se não houver relatos de terceiros:

- remover/arquivar conforme estratégia implementada preservando auditoria.

Se houver relatos de terceiros:

- ocorrência permanece;

- participação do autor inicial é removida/anonimizada;

- contribuições de terceiros permanecem.

---

# 23. Denúncia de ocorrência falsa/incorreta
Endpoint:

```text

POST /api/v1/occurrences/:id/incorrect-reports

```

Motivos:

```text

NAO_EXISTE

JA_RESOLVIDO

LOCALIZACAO_INCORRETA

CONTEUDO_OFENSIVO

IMAGEM_INADEQUADA

DUPLICADA

OUTRO

```

Uma denúncia pendente por usuário/ocorrência.

Vai à moderação.

---

# 24. Moderação de ocorrências

### 24.0 Máquina de estados e invariantes normativas

A matriz abaixo é **exaustiva para as transições operacionais já aprovadas no MVP**: transição não listada ou marcada pendente deve ser negada pelo backend. A criação administrativa, embora autorizada em RBAC, aguarda contrato funcional completo antes de ser habilitada. Toda alteração exige estado anterior válido, papel autorizado, regras do ciclo, justificativa quando aplicável, histórico e auditoria na mesma unidade transacional. Notificações seguem o mecanismo durável da seção 30 sem duplicidade. `ENCAMINHADA` permanece no domínio/banco **reservado e sem transições operacionais no MVP**. Abrir canal externo não significa protocolo nem muda status.

| Operação | Origem | Destino | Ator | Condições essenciais |
|---|---|---|---|---|
| Criar denúncia | Ausente | `PENDENTE_VALIDACAO` | CIDADÃO ATIVO | Localização ativa, ponto em São Paulo a até 3 km, foto, ciclo inicial, relato e histórico; sem publicação pública |
| Criar ocorrência administrativamente | Ausente | **PENDENTE DE CONTRATO** | ADMIN | A permissão existe; status inicial, geolocalização, evidência, relato inicial e exceções à criação cidadã **não foram aprovados**. Não implementar este fluxo até decisão funcional e inclusão de linha definitiva na matriz. Não assumir dispensa de polígono municipal, auditoria ou integridade. |
| Validar | `PENDENTE_VALIDACAO` | `VALIDADA` | MODERADOR/ADMIN | Um relato já é suficiente; registrar decisão, histórico e auditoria; publicar apenas foto aprovada |
| Rejeitar | `PENDENTE_VALIDACAO` | `REJEITADA` | MODERADOR/ADMIN | Justificativa, histórico, auditoria; não publicar |
| Marcar duplicada | `PENDENTE_VALIDACAO` | `DUPLICADA` | MODERADOR/ADMIN | Decisão humana e referência à ocorrência principal; sugestão de raio não altera status |
| Iniciar análise | `VALIDADA` | `EM_ANALISE` | MODERADOR/ADMIN | Histórico e auditoria, sem alegar resposta oficial |
| Iniciar resolução operacional | `EM_ANALISE` | `EM_RESOLUCAO` | MODERADOR/ADMIN | Histórico e auditoria, sem alegar execução por órgão externo |
| Resolver por moderação | `VALIDADA`, `EM_ANALISE`, `EM_RESOLUCAO` ou `REABERTA` | `RESOLVIDA` | MODERADOR/ADMIN | Justificativa, fechamento do ciclo aberto, histórico e auditoria |
| Resolver por comunidade | `VALIDADA`, `EM_ANALISE`, `EM_RESOLUCAO` ou `REABERTA`, com ciclo aberto | `RESOLVIDA` | SISTEMA | No mínimo 10.001 votos válidos distintos no ciclo, mudança atômica uma única vez |
| Reabrir | `RESOLVIDA` | `REABERTA` | MODERADOR/ADMIN | Decisão humana, novo ciclo, justificativa, histórico e auditoria |
| Retomar análise após reabertura | `REABERTA` | `EM_ANALISE` | MODERADOR/ADMIN | Histórico e auditoria |
| Arquivar | `RESOLVIDA`, `REJEITADA` ou `DUPLICADA` | `ARQUIVADA` | ADMIN | Guardar status anterior, justificativa, histórico e auditoria; não apagar dados coletivos |
| Restaurar | `ARQUIVADA` | Status imediatamente anterior ao arquivamento (`RESOLVIDA`, `REJEITADA` ou `DUPLICADA`) | ADMIN | Justificativa, histórico, auditoria; restauração não reinicia ciclo nem muda decisão anterior |

**Votos e reabertura comunitária:** voto de resolução exige conta ativa, localização ativa, distância de até 3 km e um voto por usuário/ciclo; retirada é permitida antes de resolução automática e não reverte estado resolvido. Sinalização de reaparecimento exige ocorrência `RESOLVIDA`, conta ativa, localização ativa, até 3 km e uma sinalização por usuário/ciclo encerrado; **1.000 usuários distintos geram alerta**, nunca reabertura automática. O sistema mantém o total histórico único de participantes da ocorrência separado dos contadores de cada ciclo. Alertas e transições devem ser idempotentes sob concorrência.

**Limites de estados:** não existe transição operacional `ENCAMINHADA` no MVP; `REABERTA → EM_RESOLUCAO` diretamente é inválida, pois exige passagem por `EM_ANALISE` (salvo resolução direta `REABERTA → RESOLVIDA`); não se pode validar uma ocorrência já rejeitada/duplicada/arquivada por atalho. O valor `ARQUIVADA` é excluído de consultas públicas ativas e a restauração recupera exclusivamente o estado salvo no arquivamento. Toda transição de arquivamento/restauração é exclusiva de ADMIN. Nenhuma alteração na lista de estados autoriza integração automática com órgãos públicos.

**Integridade:** validar que as migrations `001–017` e as evoluções `018+` representam os estados/campos necessários; não editar migrations antigas. Se for necessário persistir o status anterior ao arquivamento, criar migration `018+`, e não inferir o status por tentativa. Bloquear corrida entre arquivamento/restauração e outras mutações com verificações transacionais.

Base:

```text

/api/v1/moderation

```

Endpoints previstos:

```text

GET  /api/v1/moderation/occurrences

GET  /api/v1/moderation/alerts

POST /api/v1/moderation/occurrences/:id/validate

POST /api/v1/moderation/occurrences/:id/reject

POST /api/v1/moderation/occurrences/:id/mark-duplicate

PATCH /api/v1/moderation/occurrences/:id

POST /api/v1/moderation/occurrences/:id/public-photo

POST /api/v1/moderation/occurrences/:id/resolve

POST /api/v1/moderation/occurrences/:id/reopen

POST /api/v1/moderation/occurrences/:id/archive

POST /api/v1/moderation/occurrences/:id/restore

```

Toda ação relevante gera:

- `acoes_moderacao`;

- histórico quando houver mudança de estado;

- auditoria.

## 24.1 Alerta por relatos
```text

10 relatos únicos

→ alerta de prioridade

```

Não valida automaticamente.

---

# 25. Resolução
## 25.1 Moderador/Admin
Pode resolver diretamente.

Registrar:

- ator;

- justificativa;

- data;

- status anterior/novo;

- ciclo encerrado;

- auditoria.

Selo público:

```text

RESOLVIDO PELO VOZ DA RUA

```

## 25.2 Comunidade
Endpoint:

```text

POST /api/v1/occurrences/:id/resolution-votes

```

Pré-condições:

- ATIVO;

- <= 3 km;

- um voto por usuário/ciclo.

Limite:

```text

10001 votos válidos

→ RESOLVIDA automaticamente

```

## 25.3 Remover voto
```text

DELETE /api/v1/occurrences/:id/resolution-votes/me

```

Permitido enquanto a ocorrência ainda não foi resolvida pelo limite.

Após resolução, retirada individual não reverte estado.

---

# 26. Reabertura
## 26.1 Sinalização comunitária
Endpoint:

```text

POST /api/v1/occurrences/:id/reopening-signals

```

Pré-condições:

- ocorrência resolvida;

- ATIVO;

- <= 3 km;

- uma sinalização por usuário/ciclo resolvido.

Limite:

```text

1000

→ alerta emergencial

```

Não reabre automaticamente.

## 26.2 Aprovação humana
Moderador/Admin decide.

Ao aprovar:

```text

RESOLVIDA

→ REABERTA

```

Criar novo ciclo.

Fluxo base:

```text

RESOLVIDA

→ REABERTA

→ EM_ANALISE

→ EM_RESOLUCAO

→ RESOLVIDA

```

---

# 27. Canais oficiais
A plataforma orienta, mas não garante protocolo externo.

Fluxo:

```text

ocorrência

→ categoria

→ canal principal

→ instruções

→ abertura externa

```

Quando não houver canal:

```text

Canal oficial ainda não cadastrado

```

Órgãos iniciais:

- SP156 / Prefeitura;

- SPTrans;

- Metrô;

- CPTM;

- CET;

- responsáveis privados quando aplicável.

Não hardcode URLs na regra de negócio.

Endpoints:

```text

GET  /api/v1/occurrences/:id/official-channel

POST /api/v1/occurrences/:id/official-channel/access

```

O POST registra acesso agregado para analytics.

---

# 28. Social
## 28.1 Publicação
Somente perfil público e ATIVO publica.

Post:

- texto até 1000 caracteres;

- uma imagem opcional;

- ocorrência opcional;

- sem vídeo no MVP.

Endpoint:

```text

POST /api/v1/social/posts

```

## 28.2 Feed
```text

GET /api/v1/social/posts

```

Ordenação:

```text

mais recentes primeiro

```

Sem algoritmo de recomendação.

## 28.3 Privacidade
Ao tornar perfil privado:

- posts deixam de aparecer publicamente;

- não são apagados.

Ao retornar público:

- posts elegíveis reaparecem;

- removidos pelo autor/moderação não reaparecem.

## 28.4 Curtidas
Uma por usuário/post.

```text

POST   /api/v1/social/posts/:id/likes

DELETE /api/v1/social/posts/:id/likes/me

```

## 28.5 Comentários
Até 500 caracteres.

```text

GET    /api/v1/social/posts/:id/comments

POST   /api/v1/social/posts/:id/comments

PATCH  /api/v1/social/comments/:id

DELETE /api/v1/social/comments/:id

```

## 28.6 Respostas
Até 500 caracteres.

Somente um nível:

```text

comentário

└── resposta

```

Resposta não pode receber resposta.

## 28.7 Seguidores

**Funcionalidade aprovada:** usuário `ATIVO` pode **seguir** perfil público; conta `BANIDO` não pode seguir. O usuário pode possuir perfil próprio privado e seguir um perfil público. A ação exige sessão válida, proteção CSRF, verificação de elegibilidade, autoria do vínculo e constraint que impeça duplicação de relacionamento ativo para o mesmo par. Alterações na privacidade de destino impedem novos seguidores; relações existentes são preservadas, sem exibição pública quando o destino fica privado. Retornar ao perfil público pode restaurar a exibição apenas de relacionamentos ainda elegíveis. Listas e contagens observam privacidade, status de conta e paginação, sem expor dados privados.

**Endpoint de seguir:**

```text
POST /api/v1/users/:id/followers
```

**Decisão funcional expressamente pendente: deixar de seguir.** Não existe contrato aprovado de `DELETE`/unfollow, nem regra funcional aprovada de encerramento do vínculo. **Não criar rota, botão, efeito de remoção ou testes de funcionalidade de deixar de seguir** até decisão expressa da equipe e atualização desta especificação. Persistência e exposição dos relacionamentos de seguir devem ser implementadas sem presumir a resolução dessa pendência.

---

# 29. Denúncia e moderação Social

### 29.0 Ciclo normativo de denúncia e decisão Social

Denúncia recebida identifica denunciante autenticado/ativo, alvo (`POST` ou `COMENTARIO`), motivo permitido, data e recurso denunciado, sem permitir que o denunciante altere a moderação. A solicitação entra na fila de moderação; a denúncia inicial **não remove automaticamente** o post/comentário. A decisão ocorre somente por MODERADOR ou ADMIN; medidas sobre a conta (banimento) são exclusivas de ADMIN.

| Etapa lógica | Estado do conteúdo | Quem atua | Resultado e evidências |
|---|---|---|---|
| Recebimento | Mantém visibilidade anterior | Cidadão ativo | Registrar denúncia e disponibilizar na fila de moderação |
| Análise | Mantém visibilidade anterior, salvo moderação expressa | MODERADOR/ADMIN | Acesso ao motivo, alvo e contexto com permissões restritas |
| Ocultar | Conteúdo não visível publicamente | MODERADOR/ADMIN | Registrar justificativa, autor da decisão, data e auditoria |
| Remover | Conteúdo removido logicamente | MODERADOR/ADMIN | Preservar auditoria/histórico necessário; não reaparecer ao alternar perfil público/privado |
| Encerrar sem ocultação/remoção | Conteúdo conserva o estado existente | MODERADOR/ADMIN | Registrar conclusão motivada e auditoria; não atribuir sanção automaticamente |

As etapas são **estados lógicos do fluxo** e não impõem novos enums ou migrations além da estrutura de moderação Social já prevista em `018+`; mapear aos campos efetivamente criados. Ao registrar decisão, encerrar a denúncia analisada sem apagá-la; denúncias concorrentes sobre o mesmo alvo permanecem rastreáveis, mas não produzem ocultações/remoções duplicadas. Consulta pública não expõe denunciante, motivos internos ou identidade de moderador além do aprovado. Reverter uma remoção/ocultação ou instituir recurso de contestação **não está aprovado**: não criar endpoint de reversão ou recurso por iniciativa da IA. O contrato exato de DTO seguirá o padrão da seção 11, usando somente ações já previstas.

Alvos:

- post;

- comentário.

Motivos:

```text

SPAM

ASSEDIO_OU_OFENSA

CONTEUDO_IMPROPRIO

DADOS_PESSOAIS

CONTEUDO_ENGANOSO_OCORRENCIA

OUTRO

```

Endpoint:

```text

POST /api/v1/social/reports

```

Moderação:

```text

GET  /api/v1/moderation/social/reports

POST /api/v1/moderation/social/posts/:id/hide

POST /api/v1/moderation/social/posts/:id/remove

POST /api/v1/moderation/social/comments/:id/hide

POST /api/v1/moderation/social/comments/:id/remove

```

Toda ação relevante gera auditoria.

---

# 30. Notificações

### 30.0 Persistência, deduplicação e falhas de entrega

A notificação interna é persistida no PostgreSQL para evento aprovado, com destinatário autorizado e preferências respeitadas. O evento de domínio e a intenção de notificar devem ser registrados de modo durável e consistente com a transação principal; não executar Postmark/Web Push dentro de transação SQL. O sucesso da regra de negócio não depende da disponibilidade de serviços externos, mas falha de auditoria obrigatória impede concluir a operação administrativa sensível.

**Envio externo assíncrono:** processar intenções duráveis de envio de e-mail e Web Push por trabalhador/aplicação compatível com a infraestrutura existente, **sem adicionar Redis ou RabbitMQ**. Um par evento/destinatário/canal só pode gerar uma intenção; retries não recriam notificação interna nem duplicam entrega já confirmada. Push exige opt-in; desativação de notificações sociais não desativa automaticamente notificações essenciais de ocorrências.

**Tentativas:** em falha temporária, executar **até três tentativas de entrega no total**, com intervalo progressivo entre elas. Uma confirmação de entrega encerra reenvios; erro definitivo encerra novas tentativas, registra resultado minimizado e não desfaz a operação de negócio. Subscription push reconhecida como inválida deve ser desativada. Respostas externas incertas exigem idempotência/deduplicação na medida suportada pelo provider, sem promessa de exatamente uma entrega de rede quando não houver garantia de provider. Registrar tentativa, horário, classificação de falha e correlation ID, nunca tokens/cookies, URL de subscription ou dados pessoais desnecessários.

**Configuração operacional:** os intervalos concretos entre tentativas e a retenção dos registros operacionais podem ser parametrizados e testados dentro da política aprovada de três tentativas e da retenção aplicável; não alterar limite nem introduzir broker/provedor novo por conveniência. Estratégia de trabalho assíncrono deve sobreviver a reinício normal do processo sem perder intenções persistidas.

Canais:

- internas;

- e-mail;

- Web Push opt-in.

Eventos de ocorrência:

- validada;

- rejeitada;

- duplicada;

- status alterado;

- resolvida;

- reaberta;

- decisão relevante da moderação.

Eventos Social:

- novo seguidor;

- curtida;

- comentário;

- resposta.

Curtidas podem ser agrupadas.

Usuário pode desativar notificações sociais separadamente.

Endpoints:

```text

GET   /api/v1/notifications

PATCH /api/v1/notifications/:id/read

PATCH /api/v1/notifications/read-all

GET   /api/v1/me/notification-preferences

PATCH /api/v1/me/notification-preferences

POST   /api/v1/me/push-subscriptions

DELETE /api/v1/me/push-subscriptions/:id

```

---

# 31. PWA
## 31.1 Instalação
Deve possuir:

- Web App Manifest;

- ícones;

- Service Worker;

- start URL;

- display mode apropriado;

- HTTPS em produção.

## 31.2 Offline
Offline:

```text

SOMENTE LEITURA

```

Pode:

- abrir shell;

- mostrar dados já cacheados.

Não pode executar mutações.

Não existe fila offline.

Dados cacheados devem ser identificáveis como potencialmente desatualizados quando apropriado.

Logout deve limpar cache privado necessário.

## 31.3 Push
```text

Web Push + VAPID

```

- opt-in;

- revogável;

- chave privada somente backend;

- endpoint da subscription não vai para logs.

---

# 32. Design e UX

### 32.0 Hierarquia visual e estados de aprovação

A referência aprovada para autenticação utiliza paisagem urbana noturna distante, ponte estaiada ao fundo, árvores/silhuetas, logo e paisagem como **ativos separados**, formulários HTML reais (não imagem de tela), painel arredondado azul-marinho, CTA amarelo e onda decorativa que não cobre conteúdo. Não acrescentar raios laterais aos títulos nem malha geométrica decorativa no céu. Os estados `loading`, `vazio`, `erro`, `sucesso`, `disabled` e `foco` são obrigatórios quando pertinentes, com mensagens acessíveis. Valores hex, pesos/tamanhos, ativos finais e detalhes Light Mode permanecem provisórios. `DESIGN.md` é o documento visual localizado em `docs/DESIGN.md`; este FSD consolida aqui os requisitos aprovados sem presumir os pendentes.

Somente itens aprovados são tratados como obrigatórios.

## 32.1 Direção global
- mobile-first;

- uso em uma mão;

- Dark Mode desenvolvido primeiro;

- Light Mode será adaptado posteriormente;

- paleta conceitual: azul-marinho profundo + amarelo urbano vibrante + neutros/semânticas;

- amarelo reservado prioritariamente para CTA/ação principal, navegação ativa, pins e identidade;

- cantos arredondados;

- densidade equilibrada;

- tipografia Sora como direção aprovada, com validação final de pesos/tamanhos.

Valores hexadecimais ainda são provisórios e não devem ser tratados como congelados.

## 32.2 Acessibilidade
Obrigatório:

- labels reais;

- foco visível;

- mensagens explícitas;

- áreas de toque adequadas;

- leitores de tela;

- teclado;

- zoom;

- reduced motion;

- não depender só de cor;

- safe areas do PWA;

- comportamento correto com teclado virtual.

### 32.2.1 Componentes e estados visuais aprovados

Componentes do módulo de identidade: `AuthLayout` (marca/paisagem/painel/onda decorativa), `BrandHeader` (logo e título), `TextField` (label, ajuda/erro), `PasswordField` (mostrar/ocultar com `aria-label`), `PrimaryButton` (amarelo e texto escuro), `TextLink`, `SocialLoginButton`, `DividerWithLabel` e `FormFeedback`. Estes nomes representam componentes visuais reutilizáveis, não novas funcionalidades.

Para entradas e botões, contemplar estado normal, foco, preenchido, inválido, desabilitado e carregando quando aplicável. Para telas, distinguir sucesso, erro, indisponibilidade, ausência de dados e bloqueio de permissão, sempre com texto acessível. Fundo e paisagem são ativos separados; não usar imagem de formulário como interface, não cobrir CTA com a onda amarela e não colocar barra inferior autenticada nas telas públicas. O layout adapta-se ao teclado virtual, scroll, safe areas e preferências `prefers-reduced-motion`. Cores hexadecimais, dimensões finas e tipografia exata ainda são **provisórias**, apesar da direção visual aprovada.

## 32.3 Autenticação

**Texto aprovado do login:** título “Bem-vindo(a)!” e apoio “Use sua voz para evolução”. Login deve manter divisor “ou continue com”, botões Google/GitHub, alternância mostrar/ocultar senha e tratamento explícito de credenciais incorretas, indisponibilidade e envio repetido. Cadastro inclui aceites obrigatórios ainda que ausentes do mockup; recuperação inclui feedback neutro e etapa de redefinição. Estado do botão principal: normal, carregando, desabilitado e erro apropriado; campos com labels reais, erro associado e foco visível. Não usar screenshot completa como UI.

Login, cadastro e recuperação compartilham:

- fundo azul-marinho;

- logo;

- paisagem urbana noturna;

- painel de formulário;

- amarelo no CTA;

- inputs acessíveis;

- sem bottom navigation autenticada.

Login:

- “Bem-vindo(a)!”;

- e-mail;

- senha;

- mostrar/ocultar;

- “Esqueceu a senha?”;

- Entrar;

- Google;

- GitHub;

- link Criar conta.

Cadastro:

- nome;

- e-mail;

- senha;

- confirmação;

- aceites obrigatórios;

- CTA Cadastrar;

- retorno ao login.

Recuperação:

- e-mail;

- CTA enviar;

- mensagem neutra;

- fluxo posterior de nova senha.

## 32.4 Home

**Composição aprovada da Home:** cabeçalho com logo circular sem nome ao lado, paisagem urbana e saudação personalizada; **sem** ícones de perfil ou notificações no topo; controle arredondado de localização, mapa escuro resumido com pin amarelo e marcador azul do usuário, ação “Ver no mapa”; título “Perto de você”, acesso “Ver todos” e feed de cards; barra inferior Início / Social / Denunciar / Ocorrências / Perfil, com Denunciar central/amarelo. Card é clicável para detalhes fora dos seus controles, mas ações internas devem ser independentes e acessíveis. Cada card precisa também de **mini mapa próprio** com rua e pin, categoria, endereço, bairro, distância, status, relatos, foto pública (se houver), responsável/canal e acesso à denúncia oficial; não suprimir informações porque o mockup visual não as mostrou. Falha de mapa/foto não esconde texto disponível.

**Estados da Home:** carregando, sem ocorrências, filtros sem resultados, localização negada/indisponível, usuário fora do município, falha de consulta/mapa, offline e banido em leitura. Sem localização não fabricar distância nem autorizar ação presencial. Os destinos de “Ver no mapa”, “Ver todos” e item “Ocorrências”, a expansão de região, a saudação sem nome e o acesso visual às notificações permanecem pendentes de definição de UX; não presumir rotas. O layout proposto da Home suplementar está **em revisão**, portanto não transforma sugestões em aprovação.

Design aprovado:

- barra inferior mobile;

- Início;

- Social;

- Denunciar central/amarelo;

- Ocorrências;

- Perfil.

O acesso visual a Notificações ainda precisa ser finalizado no Design System; a funcionalidade existe independentemente da posição final do ícone/rota.

Home:

- mapa resumido no topo;

- lista vertical;

- pins amarelos;

- indicador de usuário;

- cards;

- mini mapa por ocorrência exigido funcionalmente;

- foto aprovada quando disponível;

- status textual;

- canal;

- ações independentes.

A composição exata entre foto e mini mapa ainda não deve ser congelada sem atualização do Design.

---

# 33. MinIO
Uso:

- evidências de ocorrência;

- imagens Social.

Ambientes:

```text

local → MinIO

staging → MinIO isolado

produção → MinIO na VPS

```

Produção:

- bucket privado;

- volume persistente;

- rede interna;

- credencial fora do Git;

- nenhuma porta pública desnecessária.

O backend usa interface S3-compatible para reduzir acoplamento.

---

# 34. E-mail

**Desenvolvimento:** Mailpit recebe mensagens de teste por **SMTP** em ambiente isolado, sem envio real. **Produção:** provedor **Postmark**, com credenciais protegidas, validação de configuração e tratamento seguro de respostas e falhas. A escolha do **transporte de produção (SMTP ou API HTTPS) ainda não está aprovada**; não implementar como decisão definitiva um adaptador específico até aprovação técnica. O serviço deve manter uma interface interna de envio que não dependa da escolha do transporte. Staging usa configuração segregada e não dispara mensagens reais de produção sem autorização explícita.

Casos previstos: confirmação de conta, recuperação de senha e notificações apropriadas. Tokens de confirmação e recuperação são de uso único, expiram conforme prazos a ratificar na seção 13.7 e não são registrados em logs. Envios externos seguem política de falha e processamento assíncrono da seção 30 quando aplicável. Não introduzir provedor alternativo nem novos tipos de e-mail como requisito. **Gate deste módulo:** escolher e registrar SMTP/API para Postmark antes de finalizar integração de produção.

---

# 35. Segurança HTTP
Obrigatório:

- HTTPS;

- CORS restritivo;

- headers de segurança;

- CSP;

- proteção contra XSS;

- proteção CSRF;

- rate limiting;

- body size limit;

- payload validation;

- tratamento seguro de erro;

- não confiar em `X-Forwarded-*` sem `trustProxy` configurado no Fastify para o Nginx esperado.

---

# 35.1 Redução de fingerprinting
Obrigatório:

- ocultar versão do Nginx;

- remover headers desnecessários de runtime/framework;

- não expor stack trace;

- não expor paths internos;

- não expor versões de bibliotecas em erro.

Esse hardening não substitui correção de vulnerabilidades.

# 35.2 WAF
Antes do lançamento público:

```text

staging

→ detection/logging

→ tuning

→ E2E + ZAP

→ blocking

```

O WAF deve ser testado com os fluxos legítimos do Voz da Rua para reduzir falsos positivos.

O WAF não substitui:

- parametrização SQL;

- validação;

- CSRF;

- autorização;

- rate limit;

- correções do backend.

A tecnologia WAF específica ainda não está fechada.

# 35.3 Cyber deception
Fora do MVP:

- honeypot público na VPS de produção;

- SSH/banco/porta falsos;

- `.env` falso;

- credenciais falsas espalhadas;

- tarpit deliberado;

- rotação periódica de portas.

Honeytokens sem privilégio podem ser avaliados futuramente, desde que não concedam acesso real nem confundam secret scanning/CI.

# 36. SQL e injection
Toda query usa parâmetros.

Proibido:

```text

"SELECT ... " + req.query.valor

template string com input em SQL

```

Ordenação/coluna dinâmica:

- allowlist;

- mapeamento interno.

Command injection:

- não enviar input a shell/`node:child_process`;

- quando inevitável, evitar shell, separar argumentos e usar allowlist.

XSS:

- React escaping padrão;

- evitar `dangerouslySetInnerHTML`;

- sanitizar qualquer HTML permitido futuramente.

---

# 37. SSRF e integrações
Qualquer fetch server-side para URL dinâmica:

- validar scheme;

- bloquear loopback/private/link-local quando não requerido;

- revalidar redirects;

- timeouts;

- limite de resposta.

URLs de canais oficiais cadastradas pelo admin devem ser validadas antes de uso.

---

# 38. Controle de acesso e IDOR
Todo endpoint privado verifica:

- sessão;

- status;

- papel;

- ownership;

- contexto.

UUID não é autorização.

Testar troca de IDs entre dois usuários.

Mass assignment:

- requests de usuário não podem alterar papel/status/owner/timestamps.

---

# 39. Auditoria
Registrar pelo menos:

- promoção/remoção de moderador;

- banimento/desbanimento;

- ações de moderação;

- resolução;

- reabertura;

- arquivamento/restauração;

- parâmetros;

- moderação Social;

- ações administrativas sensíveis.

Retenção:

```text

auditoria = 90 dias

segurança = 30 dias

aplicação = 7 dias

```

Nunca registrar segredo ou token completo.

---

# 40. Observabilidade

### 40.0 Continuidade de registro durante falhas

Logs de aplicação, eventos de segurança e registros de auditoria são categorias distintas e observam, respectivamente, retenções de **7/30/90 dias**. A indisponibilidade temporária de Loki/Grafana não autoriza descartar silenciosamente eventos críticos nem expor segredos. O backend escreve logs estruturados com request/correlation ID em saída capturável pelo ambiente de containers, preservando a possibilidade de consulta e retenção na estratégia operacional aprovada. Caso a retenção depende de um coletor indisponível, estabelecer contingência persistente no host (arquivo rotacionado protegido ou mecanismo equivalente aprovado) **antes do deploy**; não assumir arquivo como componente obrigatório sem aprovação técnica. Evitar logging de senha, cookie, token, URL de push subscription, coordenadas pessoais desnecessárias e payload de imagem. Falha de telemetria não deve resultar em autorização implícita; falha de gravação de auditoria obrigatória em ação administrativa sensível deve impedir conclusão sem rastreabilidade adequada. Verificar acesso, rotação, teste de restauração/consulta e comportamento de disco cheio em staging.

MVP:

```text

Grafana

Loki

GET /health

GET /ready

```

`/health`:

- processo vivo.

`/ready`:

- pronto para atender;

- pode incluir banco e dependências essenciais.

Sem Prometheus/Alertmanager no MVP.

Não expor env/config/secrets em health.

---

# 41. Backup
MVP:

```text

backup local na própria VPS

```

Inclui:

- PostgreSQL;

- MinIO;

- configurações essenciais.

Risco aceito:

- falha grave da VPS pode afetar produção e backup.

Obrigatório:

- automatizar;

- proteger acesso;

- testar restore periodicamente.

**Rotina operacional aprovada:** backup local **diário** e automatizado de PostgreSQL, objetos/arquivos MinIO e configurações essenciais; manter **7 backups diários** em diretório protegido da VPS, com controle de acesso e verificação de integridade após execução. Realizar **teste de restauração mensal**, registrar resultado e falhas, e alertar a operação quando backup ou restauração falhar. A rotina deve preservar consistência entre metadados e evidências, usar credenciais de privilégio mínimo e não expor backups em HTTP. O risco de falha simultânea da VPS e dos backups locais é aceito no MVP. Backup externo permanece evolução futura.

---

# 41.1 Rotação de secrets
Rotacionar imediatamente quando houver:

- vazamento;

- commit acidental;

- exposição em log;

- suspeita de comprometimento;

- acesso indevido.

Abrange:

- sessão;

- MinIO;

- Postmark;

- OAuth;

- VAPID;

- deploy;

- banco.

Rotação periódica pode ser adotada conforme criticidade.

Não usar mudança de porta como substituto.

# 42. Ambientes
## 42.1 Desenvolvimento
Serviços:

- frontend;

- backend;

- PostgreSQL/PostGIS;

- MinIO;

- Mailpit.

## 42.2 Staging
Mesma VPS física, porém:

- containers separados;

- banco separado;

- MinIO separado;

- volume separado;

- secrets separados;

- subdomínio separado.

## 42.3 Produção
```text

VPS Hostinger (Debian 12)

Docker Compose

Nginx

```

PostgreSQL e MinIO não ficam publicamente expostos.

**TLS aprovado:** Nginx com certificados **Let's Encrypt**, emissão/renovação automatizada via **Certbot**, redirecionamento HTTP → HTTPS e verificação periódica da renovação. Chaves privadas permanecem fora do Git; staging e produção mantêm domínios/secrets isolados. A publicação em produção exige aprovação após os gates de CI/CD e segurança.

---

# 42.4 Segmentação de rede
A produção deve aplicar segmentação compatível com o MVP.

Fluxo esperado:

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

- PostgreSQL não público;

- MinIO não público;

- frontend sem acesso direto ao banco;

- frontend sem credencial MinIO;

- Nginx sem credencial de banco;

- observabilidade com acesso mínimo necessário.

Redes Docker separadas podem ser usadas por função:

```text

edge

data

observability

```

sem transformar o MVP em arquitetura de microsserviços desnecessária.

# 42.5 Menor privilégio
Backend:

- usuário de banco próprio;

- não usar superusuário PostgreSQL;

- privilégios mínimos.

Migrations:

- podem utilizar identidade separada com privilégios adequados.

MinIO:

- credencial restrita ao bucket/ações necessárias.

Containers:

- não `privileged`;

- evitar root quando possível;

- sem Docker socket;

- remover capabilities desnecessárias;

- filesystem read-only quando compatível.

# 42.6 Zero Trust
Princípio:

```text

rede interna

≠

confiança

```

Toda operação sensível continua exigindo autorização no backend.

Não exigir no MVP:

- service mesh;

- mTLS universal entre containers;

- workload identity enterprise;

- infraestrutura Zero Trust complexa sem necessidade.

# 43. CI/CD
GitHub Actions.

Pull Request:

```text

npm ci

→ typecheck/build

→ testes

→ migrations em banco limpo

→ CodeQL

→ Semgrep

→ Dependency/SCA

→ npm audit

→ Trivy

→ Gitleaks

→ Security Gate

```

Após merge:

```text

deploy staging

→ smoke

→ E2E

→ OWASP ZAP

```

Produção:

- aprovação obrigatória;

- não publicar automaticamente sem gate.

---

# 44. Testes
## Backend
- Vitest;

- `fastify.inject()`;

- Testcontainers for Node;

- PostgreSQL/PostGIS real para integração;

- Repository;

- Service;

- autorização;

- concorrência;

- transações;

- limites.

## Frontend
- Vitest;

- React Testing Library;

- Playwright.

## Casos críticos
Testar:

```text

3 km

100 m

10 relatos

janela de 12 horas para remoção de relato (independente da duração da sessão)

10001 votos

1000 sinalizações

1000 chars post

500 chars comentário

10 MB

20 MP

```

---

# 44.1 Regra obrigatória de testes por feature
Toda feature, implementação ou correção que altere comportamento executável deve incluir testes na mesma entrega.

Regra:

```text

SEM TESTE APLICÁVEL

\=

NÃO CONCLUÍDO

```

Matriz mínima:

| Tipo de mudança | Teste mínimo |

|---|---|

| regra de Service | unitário com Vitest |

| rota/controller Fastify | `fastify.inject()` |

| Repository/SQL | integração com PostgreSQL real |

| PostGIS | integração com PostgreSQL/PostGIS real |

| migration | banco limpo + aplicação da migration |

| autorização | casos permitidos e negados/IDOR |

| autenticação | sucesso + falhas + abuso |

| upload | formato válido + MIME falso + tamanho + dimensão |

| bugfix | teste que reproduz o bug antes da correção |

| regra concorrente | teste de concorrência/constraint quando aplicável |

Exceções `N/A`:

- documentação;

- ativo estático;

- mudança puramente visual/cosmética sem lógica.

O motivo deve ser documentado no PR.

## 44.1.1 Testes negativos obrigatórios
Não testar apenas happy path.

Toda feature sensível deve considerar:

- usuário não autenticado;

- papel incorreto;

- recurso de outro usuário;

- payload inválido;

- limite excedido;

- estado de negócio inválido;

- concorrência/replay quando aplicável.

## 44.1.2 IA e testes
Quando IA gerar a feature e os testes:

- o fato de os testes passarem não encerra a validação;

- casos negativos devem vir do FSD e Security Gate;

- auth, autorização, upload, migrations, infra e secrets exigem revisão humana reforçada.

# 45. Security Gate
Toda feature passa pelo checklist `SEC-001..SEC-100`.

Classificação:

```text

PASS

FAIL

N/A

```

Critical:

```text

bloqueia

```

High:

```text

bloqueia por padrão

```

Revisão humana reforçada para:

- auth;

- sessão;

- autorização;

- upload;

- migrations;

- infra;

- secrets;

- CI/CD;

- integrações;

- geografia;

- segurança.

---

# 46. Analytics administrativos

Painel exclusivamente de ADMIN, com dados agregados e sem rastreamento individual desnecessário. **Filtros temporais aprovados:** últimos **7**, **30** (padrão) e **90** dias, além de **intervalo personalizado**. Interpretar datas no fuso definido da plataforma e armazenar eventos em `TIMESTAMPTZ`; indicar limites temporais de maneira explícita. Contadores de estoque atual são apresentados como **totais atuais**, independentemente do filtro de período; indicadores de eventos usam o intervalo selecionado.

| Indicador | Regra de cálculo obrigatória | Natureza |
|---|---|---|
| Usuários ativos | Contar contas com `status = ATIVO` | Total atual |
| Usuários banidos | Contar contas com `status = BANIDO` | Total atual |
| Novos usuários | Contar contas criadas no período | Evento temporal |
| Ocorrências por status | Agrupar pelo status atual, identificando separadamente `ARQUIVADA` e excluindo removidas logicamente conforme regra | Total atual |
| Ocorrências por categoria | Agrupar pela categoria atual com filtros explícitos de elegibilidade | Total atual |
| Ocorrências por bairro | Agrupar pelo bairro registrado (inclusive tratamento do bairro ausente) | Total atual |
| Pendentes | Contar status atual `PENDENTE_VALIDACAO` | Total atual |
| Alertas de moderação | Contar alertas gerados no período, sem duplicidade por retries | Evento temporal |
| Total de relatos | Contar relatos válidos, excluindo removidos logicamente do total ativo; separar participantes únicos históricos por ocorrência dos relatos por ciclo | Total atual, com definição exibida |
| Ocorrências resolvidas | Contar ocorrências que alcançaram `RESOLVIDA` no período usando histórico; evitar duplicar a mesma ocorrência por múltiplos eventos quando o indicador disser “ocorrências” | Evento temporal |
| Ocorrências reabertas | Contar ocorrências com reabertura no período, usando histórico e deduplicação compatível com o rótulo | Evento temporal |
| Tempo médio de validação | Média do intervalo entre criação e **primeira** validação das ocorrências validadas no período | Evento temporal |
| Acessos aos canais oficiais | Contar eventos de abertura registrados no período; abertura não comprova protocolo externo | Evento temporal |
| Atividade Social | Contar posts, comentários e curtidas registrados no período, respeitando exclusões lógicas/moderação | Evento temporal |

Aplicar paginação às consultas auxiliares, filtros allowlisted, índices apropriados e proibição de dados pessoais desnecessários. Indicadores de eventos e totais atuais devem ser visualmente diferenciados; o período padrão é **30 dias**, sem transformar estoque atual em fluxo de 30 dias. Não criar exportação CSV/XLSX/PDF, relatório externo ou analytics individual. Queries utilizam parâmetros e refletem os estados reais das migrations.

Endpoint: `GET /api/v1/admin/analytics/overview`.

---

# 47. Administração

### 47.0 Contratos e governança administrativa

Toda operação de `/api/v1/admin` exige sessão válida de ADMIN ativo, verificação de e-mail quando a identidade for local e proteção CSRF nas mutações. A autorização é feita pelo backend e não depende do prefixo. Em cada resposta, retornar somente DTO explícito (sem senha hash, token, cookies, credencial ou dados pessoais não necessários). Erros seguem a seção 12, com `401` sem sessão, `403` sem papel, `404` para recurso indisponível/oculto, `409` para conflito e `422` para entrada ou transição inválida conforme contrato. Operações sensíveis registram ator, alvo, data, alteração e justificativa quando exigida, mais auditoria; mudança de papel/status revoga imediatamente privilégios em sessões existentes.

**Contratos já definidos; rotas completas usam o prefixo `/api/v1/admin`:**

| Operação | Método e caminho | Entrada mínima / condições | Saída / efeitos |
|---|---|---|---|
| Pesquisar usuários | `GET /users` | Paginação e filtros allowlisted | Página de resumos administrativos sem credenciais |
| Consultar usuário | `GET /users/:id` | UUID existente | DTO administrativo seguro |
| Banir / desbanir | `POST /users/:id/ban`, `/users/:id/unban` | UUID do alvo, motivo e regra de privilégio | Situação atualizada, auditoria, revalidação de sessões |
| Promover / remover moderador | `POST /users/:id/promote-moderator`, `/users/:id/remove-moderator` | UUID do alvo e autorização ADMIN | Papel atualizado, auditoria, sessões coerentes |
| Consultar categorias | `GET /categories` | Paginação/filtros allowlisted | Lista de categorias, incluindo situação ativa |
| Cadastrar / editar categoria | `POST /categories`, `PATCH /categories/:id` | Nome e atributos aprovados; alterações coerentes com dependências | Categoria criada/atualizada e auditoria |
| Cadastrar / editar subcategoria | `POST /categories/:id/subcategories`, `PATCH /subcategories/:id` | Associação à categoria correta, nome, modo quando aplicável | Subcategoria atualizada, consistência e auditoria |
| Consultar órgãos | `GET /organizations` | Paginação e filtro de ativo | Órgãos sem credenciais externas |
| Cadastrar / editar órgão | `POST /organizations`, `PATCH /organizations/:id` | Nome, tipo, contatos e abrangência quando aplicável | Órgão e auditoria |
| Consultar canais | `GET /channels` | Paginação e filtros | Canais cadastrados |
| Cadastrar / editar canal | `POST /channels`, `PATCH /channels/:id` | Responsável, categoria, URL/contato/instruções; validar URL | Canal salvo, associação e auditoria |
| Consultar parâmetros | `GET /system-parameters` | Sem segredos | Chaves e valores permitidos |
| Alterar parâmetro | `PATCH /system-parameters/:key` | Chave em allowlist, tipo e faixa coerentes | Valor persistido e auditado |
| Indicadores agregados | `GET /analytics/overview` | Filtros/períodos conforme seção 46 | DTO agregado sem rastreamento individual |

**Ativação/desativação:** quando o recurso possui campo `ativo`, a operação de editar (`PATCH`) controla esse campo com validação de impacto; não inventar endpoints separados `activate/deactivate`. Para vincular categoria/canal, usar os atributos das operações de edição já previstas, sem presumir uma API externa.

**Outras operações funcionais do PRD cujo caminho HTTP não foi aprovado:** criação/edição administrativa de ocorrência, arquivamento/restauração (já possuem caminhos na seção 24), consulta de auditoria e detalhamento administrativo de ocorrências. Ações já cobertas pela seção 24 não precisam de rotas duplicadas sob `/admin`. Para as restantes, o FSD fixa **permissão ADMIN, entradas/saídas e efeitos obrigatórios**; quando não houver caminho explicitamente fixado, deve-se definir o contrato técnico no início do módulo, mantendo REST e o prefixo existente sem ampliar o escopo ou inventar uma operação de negócio. Criar administrativamente registra ator e ocorrência sem inventar autor cidadão, preservando histórico e validação de dados aplicável. Editar não altera regras comunitárias por atalho. Auditoria retorna registros paginados minimizados, nunca conteúdo de secrets. Arquivar/restaurar utiliza exclusivamente os estados e o retorno aprovados na matriz da seção 24.0; ambas as operações exigem ADMIN, justificativa, histórico e auditoria.

**Regras de resposta comuns:** sucesso devolve representação mínima atualizada ou confirmação sem segredo; `409` quando uma atualização concorrente tornar o estado incompatível; `403` para MODERADOR tentando endpoint ADMIN; `404` para UUID ausente conforme política anti-enumeração. As rotas existentes são preservadas sem introduzir novos fornecedores, exportações ou dashboards.

Base:

```text

/api/v1/admin

```

Usuários:

```text

GET  /users

GET  /users/:id

POST /users/:id/ban

POST /users/:id/unban

POST /users/:id/promote-moderator

POST /users/:id/remove-moderator

```

Categorias:

```text

GET   /categories

POST  /categories

PATCH /categories/:id

```

Subcategorias:

```text

POST  /categories/:id/subcategories

PATCH /subcategories/:id

```

Órgãos:

```text

GET   /organizations

POST  /organizations

PATCH /organizations/:id

```

Canais:

```text

GET   /channels

POST  /channels

PATCH /channels/:id

```

Parâmetros:

```text

GET   /system-parameters

PATCH /system-parameters/:key

```

---

# 48. Paginação e desempenho
Paginação obrigatória em:

- Home;

- Social;

- comentários;

- Minhas ocorrências;

- notificações;

- admin;

- moderação.

Não carregar toda São Paulo.

PostGIS:

- GiST;

- `ST_DWithin` para raio;

- `ST_Distance` quando distância for necessária;

- `ST_Covers` para município.

Evitar:

- N+1;

- queries sem limite;

- SELECT de colunas desnecessárias;

- contagens repetidas por card quando puderem ser agregadas.

---

# 49. Concorrência e integridade

### 49.0 Invariantes atômicas e retries

Os critérios abaixo são exigências de resultado, não escolha obrigatória de biblioteca SQL. Usar constraints, transações e bloqueio/atualização condicional adequados ao schema; converter disputa de unicidade em conflito de domínio seguro.

| Disputa ou retry | Resultado obrigatório |
|---|---|
| Dois `Eu também vi` do mesmo usuário/ciclo | No máximo um relato ativo; nenhum incremento duplicado |
| Dois votos do mesmo usuário/ciclo | No máximo um voto; limiar de 10.001 verificado atomicamente |
| Duas sinalizações do mesmo usuário/ciclo resolvido | No máximo uma sinalização; alerta de 1.000 sem duplicação |
| Dois eventos atingem limiar de 10 relatos | Um alerta lógico para a condição, sem validar automaticamente |
| Duas operações de resolução | Uma transição eficaz e um encerramento do ciclo; registro idempotente de evento |
| Duas operações de reabertura | No máximo um novo ciclo aberto por ocorrência; histórico íntegro |
| Duas curtidas ou follows do mesmo par | Uma relação ativa e resultado consistente |
| Retry de criação de ocorrência/upload | Não duplicar silenciosamente ocorrência nem publicar evidência órfã; política técnica de idempotência definida no módulo |

Não utilizar `SELECT COUNT` seguido de gravação sem proteção transacional nas decisões que mudam estado. Validar comportamento em PostgreSQL/PostGIS real com requisições paralelas e retry. Políticas exatas de chave de idempotência, status HTTP de retry e expiração devem ser documentadas antes de expor os respectivos fluxos; não inventar novos serviços ou headers obrigatórios sem decisão.

O banco é última linha de defesa para unicidade.

Garantir:

- um relato ativo por usuário/ciclo;

- um voto por usuário/ciclo;

- uma sinalização por usuário/ciclo;

- uma curtida por usuário/post;

- um follow por par;

- um ciclo aberto por ocorrência;

- alerta deduplicado.

Ao receber erro de constraint:

- converter para erro de domínio;

- não retornar 500 bruto.

---

# 50. Transações
Atômicas:

## Criar ocorrência
```text

ocorrência

\+ ciclo

\+ relato inicial

\+ evidência

\+ histórico

```

## Validar
```text

status

\+ historico

\+ moderação

\+ notificação

```

## Resolver
```text

status

\+ encerramento ciclo

\+ histórico

\+ auditoria

\+ notificação

```

## Reabrir
```text

novo ciclo

\+ REABERTA

\+ histórico

\+ auditoria

\+ notificação

```

---

# 51. Soft delete e histórico
Usar exclusão lógica onde apagar fisicamente destruiria histórico coletivo.

Exemplos:

- relato;

- evidência;

- comentário;

- post;

- ocorrência arquivada.

Conta:

- anonimização quando necessário;

- não destruir histórico coletivo sem regra.

---

# 52. Critérios de aceite funcionais — identidade

**Cenários obrigatórios de teste, além da checklist:** usuário sem sessão recebe negação; cidadão banido consegue leitura permitida mas não cria conteúdo; cidadão não confirmado não adquire permissão colaborativa; conta local confirma token válido uma única vez; token expirado não confirma; recuperação não identifica existência da conta; remoção de papel de moderador ou banimento em uma segunda sessão impede operação protegida imediatamente; ADMIN e MODERADOR têm resultados distintos para arquivamento/restauração.

- [ ] Cadastro local cria perfil privado.

- [ ] E-mail local exige confirmação.

- [ ] OAuth Google/GitHub funciona conforme regras.

- [ ] Recuperação não enumera e-mail.

- [ ] Banido autentica, mas fica read-only.

- [ ] Logout invalida sessão no servidor.

- [ ] Session ID é regenerado após login.

---

**Aceite adicional de identidade (bloqueio pré-confirmação):**

- [ ] Conta local criada possui `email_verificado_em = NULL`, perfil privado e nenhum acesso autenticado à Home.
- [ ] Credencial correta sem confirmação não produz sessão interna; há orientação de confirmação e reenvio protegido.
- [ ] Token inválido, expirado ou já utilizado não confirma conta nem ativa acesso.
- [ ] Após token válido, e-mail fica confirmado; é necessário autenticar para iniciar sessão.
- [ ] Mudança de privilégio/banimento revoga acesso antigo em duas sessões simultâneas.

# 53. Critérios de aceite — ocorrência

**Cenários adicionais:** duas confirmações simultâneas do mesmo usuário/ciclo mantêm uma participação; o mesmo cidadão presente em mais de um ciclo conta uma única vez no total histórico de participantes únicos da ocorrência; limiares de resolução/reabertura usam contadores específicos do ciclo; falha após upload não publica foto nem deixa associação inválida no banco; fluxo de compensação de objeto é testado.

- [ ] Ponto fora de São Paulo é rejeitado.

- [ ] Ponto acima de 3 km é rejeitado.

- [ ] Uma foto é obrigatória.

- [ ] Nova ocorrência nasce pendente.

- [ ] Pendente não aparece publicamente.

- [ ] Candidato de duplicidade usa 100 m + mesma categoria + ativa.

- [ ] Duplicidade não é decidida automaticamente.

- [ ] Subcategoria obrigatória é validada quando aplicável.

---

# 54. Critérios de aceite — moderação

**Cenários adicionais:** transição inválida é negada sem mudar status; decisão exige ator/justificativa conforme ação; moderação não executa arquivamento/restauração sem ADMIN; mudança de status concorrente não cria histórico contraditório; conteúdo não aprovado não aparece no feed público.

- [ ] Moderador pode validar desde 1 relato.

- [ ] 10 relatos geram alerta.

- [ ] Alerta não valida automaticamente.

- [ ] Foto pública exige aprovação.

- [ ] Ação relevante gera auditoria.

- [ ] IDOR é bloqueado.

---

# 55. Critérios de aceite — resolução
- [ ] Um voto por usuário/ciclo.

- [ ] Apenas usuário em até 3 km vota.

- [ ] 10001 resolve automaticamente.

- [ ] Voto pode ser removido antes da resolução.

- [ ] Remover voto depois não reverte estado.

---

# 56. Critérios de aceite — reabertura
- [ ] Apenas ocorrência resolvida recebe sinalização comunitária.

- [ ] Até 3 km.

- [ ] Uma sinalização por usuário/ciclo.

- [ ] 1000 gera alerta.

- [ ] Não reabre automaticamente.

- [ ] Aprovação humana muda para REABERTA.

- [ ] Novo ciclo é criado.

---

# 57. Critérios de aceite — Social

**Cenários adicionais:** conteúdo ocultado/moderado não reaparece ao tornar perfil público; duas curtidas simultâneas permanecem uma; comentários de outro autor não podem ser editados; denúncia registra alvo/ator e decisão; privacidade de seguidores é respeitada; seguir respeita ownership, conta ATIVO/BANIDO e perfil de destino público; tornar perfil privado preserva relacionamentos e oculta sua exibição pública. Deixar de seguir não é testado como funcionalidade aprovada enquanto a política estiver pendente.

- [ ] Perfil privado não publica.

- [ ] Post máximo 1000 caracteres.

- [ ] Uma imagem por post.

- [ ] Comentário/resposta máximo 500.

- [ ] Reply não recebe reply.

- [ ] Uma curtida por usuário/post.

- [ ] Privatizar perfil oculta posts.

- [ ] Retornar público restaura posts elegíveis.

- [ ] Denúncia Social chega à moderação.

- [ ] Moderação gera auditoria.

- [ ] Seguir exige conta ATIVO, perfil público de destino, autorização e unicidade; conta BANIDO não pode seguir. Deixar de seguir permanece fora da implementação até aprovação funcional.

---

**Aceite adicional de operação e administração:**

- [ ] Transição de status fora da matriz 24.0 é rejeitada sem alterar histórico.
- [ ] Acesso ao canal oficial não gera status `ENCAMINHADA` nem protocolo inventado.
- [ ] Apenas ADMIN arquiva RESOLVIDA/REJEITADA/DUPLICADA; restauração recupera o estado anterior, com justificativa, histórico e auditoria.
- [ ] Denúncia Social chega à fila; ocultação/remoção só após decisão de moderação motivada; não existe reversão inventada.
- [ ] Falha de Postmark/Web Push não desfaz alteração principal; retry não duplica notificação interna.
- [ ] Dashboard distingue acumulado, período e contagem de ciclo; não expõe dados pessoais indevidos.
- [ ] Rotas administrativas negam papéis incorretos e rejeitam atualização de status/papel via mass assignment.
- [ ] Home e login respeitam componentes, textos e estados visuais aprovados, com tokens provisórios identificados.


**Critérios adicionais de decisões consolidadas:**

- [ ] Política de comprimento, complexidade e algoritmo adaptativo é aprovada tecnicamente antes da conclusão de cadastro/reset; os mesmos parâmetros são aplicados aos dois fluxos.
- [ ] Sessão server-side usa store persistente aprovado (não exclusivamente em memória na produção), timeout aprovado e revogação server-side; logout e mudança de senha invalidam as sessões exigidas.
- [ ] Confirmação e recuperação usam tokens aleatórios, hash, expiração e uso único; prazos exatos são ratificados antes da conclusão dos fluxos; tokens expirados/reutilizados falham.
- [ ] Login Google/GitHub com e-mail já existente não vincula automaticamente: usuário autentica na conta original e autoriza vinculação.
- [ ] Cadastro exige aceite dos Termos e ciência da Política em checkboxes distintos, ambos desmarcados; versões e datas são registradas.
- [ ] Documentos legais têm links públicos e no Perfil; textos jurídicos dependem de aprovação antes do lançamento.
- [ ] Excluir conta invalida sessões, remove/anonimiza dados aplicáveis e preserva somente histórico coletivo anonimizado e auditoria necessária.
- [ ] Abrir canal externo não altera status para ENCAMINHADA; estado permanece reservado no MVP.
- [ ] Máquina de estados rejeita todas as transições fora da matriz 24.0, inclusive saltos `REABERTA → EM_RESOLUCAO`.
- [ ] Backups diários mantêm sete cópias protegidas com verificação; restauração é testada mensalmente.
- [ ] Nginx força HTTPS com certificado Let's Encrypt/Certbot e renovação automática verificada.
- [ ] Notificações internas persistem no PostgreSQL; envios externos são assíncronos, deduplicados e limitados a três tentativas totais.
- [ ] Desenvolvimento entrega e-mails apenas ao Mailpit por SMTP; produção usa Postmark no transporte aprovado formalmente (SMTP ou API).
- [ ] Dashboard usa 30 dias como período temporal padrão e oferece 7/30/90 dias e intervalo personalizado, distinguindo estoque atual de eventos.

# 58. Critérios de aceite — PWA
- [ ] Instalável.

- [ ] Funciona no navegador sem instalação.

- [ ] Mobile-first.

- [ ] Dark Mode implementado primeiro conforme Design.

- [ ] Offline abre shell/dados cacheados.

- [ ] Offline bloqueia escrita.

- [ ] Não existe fila de escrita offline.

- [ ] Push exige opt-in.

- [ ] Logout limpa estado/cache privado aplicável.

---

# 59. Critérios de aceite — segurança

**Cenários adicionais:** duas sessões com privilégios alterados não mantêm autorização antiga; falha de Loki não causa perda silenciosa de auditoria sensível; testes de upload validam objeto órfão; rate limit e locks não possibilitam bloqueio permanente de terceiro; sucesso apenas no happy path não satisfaz o gate; testes de banco limpo e de concorrência são executados nas features correspondentes.

- [ ] SQL parametrizado.

- [ ] Sem secrets no Git.

- [ ] Cookie HttpOnly/Secure em produção.

- [ ] CSRF testado.

- [ ] CORS restritivo.

- [ ] CSP configurada.

- [ ] Rate limit nos endpoints críticos.

- [ ] Upload valida magic bytes/tamanho/dimensões.

- [ ] SSRF protegido onde houver fetch dinâmico.

- [ ] IDOR/BOLA testado.

- [ ] Critical bloqueia release.

- [ ] High bloqueia por padrão.

- [ ] SEC-001..SEC-100 revisado.

- [ ] Rate limit de login combina origem e identidade quando aplicável.

- [ ] Cooldown progressivo não mantém conexões abertas desnecessariamente.

- [ ] Lockout é temporário e resistente a DoS contra conta de terceiro.

- [ ] Moderador exige MFA antes de operar em produção.

- [ ] Admin exige MFA antes de operar em produção.

- [ ] MFA preferencial é resistente a phishing (WebAuthn/Passkey/FIDO2).

- [ ] Containers seguem menor privilégio.

- [ ] Backend não usa superusuário PostgreSQL.

- [ ] PostgreSQL e MinIO não são publicamente acessíveis.

- [ ] Versões/banners desnecessários não são expostos.

- [ ] WAF foi testado/tunado antes de blocking em produção.

- [ ] Toda feature executável possui testes aplicáveis na mesma entrega.

---

# 60. Ordem sugerida de implementação

### 60.0 Gates de decisão por fase

**Antes de finalizar autenticação:** aprovar store persistente e TTL de sessão, ratificar parâmetros de senha/hash e prazos de tokens; implementar e testar e-mail não verificado, vinculação OAuth autorizada, tokens e registro de aceites. Regras de segurança aprovadas permanecem obrigatórias. **Antes de moderação:** implementar e testar matriz de estados e RBAC da seção 24.0; manter criação administrativa indisponível até contrato aprovado. **Antes de resolução/reabertura:** verificar contadores por ocorrência/ciclo e testes concorrentes. **Antes de uploads:** validar compensação MinIO/PostgreSQL. **Antes de Social:** implementar seguir e fluxo de denúncia conforme seções 28–29; não implementar deixar de seguir sem aprovação funcional. **Antes do dashboard:** aplicar períodos e métricas da seção 46. **Antes do deploy público:** comprovar contingência de logs, backups, TLS, WAF, MFA e Security Gate, além da aprovação dos textos jurídicos. **Antes de finalizar a navegação visual:** obter as definições pendentes do responsável pelo Design nas seções 32 e 61.1. As fases independentes podem avançar respeitando seus gates, sem permitir que a IA altere decisões aprovadas.

## Fase 1 — Fundação Node
- workspace backend;

- TypeScript;

- Fastify;

- configuração;

- conexão `pg`;

- `/health`;

- `/ready`;

- erros;

- request ID;

- migration runner existente;

- testes base.

## Fase 2 — Banco 018+
- tokens de conta;

- subcategorias;

- Social extensions;

- moderação Social;

- push/preferences;

- analytics canal;

- polígono municipal;

- parâmetro 100 m.

## Fase 3 — Leitura pública autenticada
- categorias;

- Home;

- detalhe;

- PostGIS;

- canais.

## Fase 4 — Auth
- conta local;

- confirmação;

- recuperação;

- sessão;

- CSRF;

- Google;

- GitHub;

- RBAC/banimento.

## Fase 5 — Ocorrência
- criação;

- MinIO;

- duplicidade;

- relato;

- edição/exclusão.

## Fase 6 — Moderação
- filas;

- alertas;

- validação/rejeição;

- foto;

- auditoria.

## Fase 7 — Resolução/Reabertura
- votos;

- 10001;

- 1000;

- REABERTA;

- ciclos.

## Fase 8 — Social
- posts;

- imagem;

- comentários;

- replies;

- curtidas;

- seguidores;

- denúncias;

- moderação.

## Fase 9 — Notificações
- internas;

- Postmark;

- Web Push;

- preferências.

## Fase 10 — Admin/analytics
- usuários;

- taxonomia;

- canais;

- parâmetros;

- dashboard.

## Fase 11 — PWA/UX
- manifest;

- service worker;

- offline read-only;

- push;

- Design System;

- acessibilidade;

- E2E.

---

# 61. Pendências e aprovações restantes

As decisões de transição de estados (incluindo `ENCAMINHADA` reservado), arquivamento/restauração, administração/RBAC, vinculação OAuth, métricas, notificações, infraestrutura/backups e registro de Termos/Privacidade estão consolidadas. **Continuam abertas**: política de deixar de seguir; store e timeout da sessão; ratificação de números/algoritmos de senha e prazos de tokens; transporte SMTP/API de Postmark; e escolhas visuais de navegação identificadas abaixo. Não transformar propostas em decisões aprovadas por suposição.

## 61.1 Design e navegação — pendentes de aprovação visual

Os destinos de “Ver no mapa”, “Ver todos” e “Ocorrências” na navegação, acesso visual às notificações, expansão do seletor de região, estado sem localização e saudação sem nome dependem do responsável pelo Design. Também permanecem provisórios os valores hex/tokens semânticos, escala tipográfica, arquivos finais do logo/paisagem, composição entre foto e mini mapa, responsividade detalhada e Light Mode. O layout já aprovado não deve ser modificado por inferência; interfaces podem usar placeholders fiéis apenas enquanto não houver ativos finais, sem dar comportamento definitivo aos botões pendentes. A implementação de backend, schema e regras de negócio aprovadas não depende desse fechamento visual.

## 61.2 Exigências antes do lançamento

Os textos finais de Termos de Uso e Política de Privacidade, as bases legais aplicáveis, seus links, as versões publicadas e a necessidade de novo aceite após mudanças relevantes exigem revisão/aprovação da equipe e validação jurídica antes de publicação. Os registros obrigatórios de aceite e ciência descritos na seção 14 já são requisitos de implementação.

## 61.3 Parametrização de implementação sem mudança de produto

Valores operacionais internos ainda não fixados, como os limites numéricos de rate limiting, intervalos progressivos entre tentativas (respeitado o máximo de três), e detalhes de bibliotecas compatíveis com Fastify, devem ser configurados e testados no módulo, mantendo as políticas aprovadas, os gates de segurança e sem introduzir provider/feature nova. Caminhos HTTP técnicos de operações administrativas já aprovadas que não possuam rota preexistente devem ser documentados antes da codificação do endpoint, sem acrescentar capacidades de negócio.

---

## 61.4 Inventário de decisões bloqueantes por módulo

| Decisão em aberto | Módulo que bloqueia | Regra enquanto pendente | Critério de desbloqueio |
|---|---|---|---|
| Deixar de seguir | Social/seguidores | Não expor endpoint, botão ou remoção do vínculo | Aprovação funcional da política e atualização da seção 28.7 |
| Criação administrativa de ocorrência | Admin/ocorrências | Não disponibilizar escrita administrativa sem contrato de domínio | Status inicial, validações, evidências, relato e auditoria definidos na matriz 24.0 |
| Store da sessão e timeout | Auth | Não fixar PostgreSQL nem duração numérica por suposição | Decisão técnica documentada e testes de sessão |
| Parâmetros de senha/hash e validades dos tokens | Auth | Manter segurança de hash adaptativo, expiração e uso único, sem fixar números não ratificados | Parâmetros formalmente validados antes de concluir cadastro/reset |
| SMTP ou API para Postmark | E-mail produção | Mailpit local autorizado; integração de produção não finalizada | Escolha de transporte aprovada e adaptador testado |
| Destinos de navegação e opções visuais da Home | Frontend/UX | Não inventar rota nem destino final; somente composição aprovada e placeholder claramente não funcional | Aprovação visual/UX de cada interação |
| Textos jurídicos e bases legais finais | Lançamento | Implementar aceite e rastreabilidade, sem publicar textos inventados | Revisão jurídica e aprovação editorial |
| Verificação do schema físico 001–017 | Persistência/migrations 018+ | Não presumir nome de coluna nem modificar migration histórica | Executar/inspecionar migrations e validar schema atual |

## 61.5 Especificação mínima do contrato de API por módulo

As rotas listadas neste FSD representam **operações aprovadas**, exceto quando expressamente marcadas como pendentes. Para cada uma, a implementação deve registrar um contrato versionado contendo: método/caminho; visibilidade pública ou autenticada; papel e restrições de estado; IDs e ownership; schema fechado de path/query/body (tipos, limites e opcionalidade); DTO de resposta sem campos sensíveis; códigos HTTP e erros de domínio; efeitos transacionais; eventos/notificações/auditoria; idempotência e concorrência; paginação/filtros/ordenação nas consultas; testes de aceite e negativos. **Não inferir campos ou políticas de recurso além dos requisitos do FSD.** Contratos não definidos devem ser elaborados e revisados antes do respectivo endpoint, sem converter decisões abertas em funcionalidades.

| Grupo de operações existentes | Schemas/condições que devem constar no contrato | Efeitos e testes essenciais |
|---|---|---|
| Conta local, confirmação, login e recuperação | E-mail, senha, aceites, token de uso único, restrições de estado, limites antienumeração; parâmetros pendentes exigem aprovação | Sem sessão antes da confirmação; sessão segura e revogável; token não reutilizável; 401/403/429 aplicáveis |
| OAuth Google/GitHub e vinculação | Identidade comprovada do provider, `state`, `nonce` quando aplicável, conta preexistente autenticada e consentimento explícito | Não vincular por coincidência de e-mail; não elevar privilégios; auditoria |
| Home, mapa, feed e detalhe | Posição, raio máximo, categoria, status, paginação, visibilidade e autorização | PostGIS/município e 3 km; não expor pendentes/privados; alternância online/offline somente leitura |
| Criar ocorrência e upload | Localização, categoria/subcategoria, título, descrição, foto única e formatos/limites aprovados | Estado inicial aprovado para cidadão, relato/ciclo, atomicidade com MinIO e histórico; criação admin permanece bloqueada |
| Eu também vi, editar/excluir e denúncias | Identidade/ownership, tempo permitido, ciclo, localização e texto opcional quando aprovado | Unicidade, janela de remoção, soft delete/histórico e idempotência |
| Moderação, resolução, reabertura e arquivo | Estado de origem, autorização, justificativa, referência de duplicidade, voto/sinalização por ciclo | Matriz 24.0, 10.001 votos, 1.000 alertas, transações/auditoria; arquivar/restaurar só ADMIN |
| Canais e responsáveis | Identificador existente, permissões administrativas, ausência de canal | Abrir canal não significa protocolo nem transição `ENCAMINHADA`; registrar acesso sem expor dados excessivos |
| Social, posts, comentários, replies, curtidas e follows | Visibilidade do perfil, autoria, conteúdo/limite, imagem opcional e alvo | Limites de 1000/500 caracteres, 1 imagem, reply único, unicidade de curtida/follow, moderação e privacidade; unfollow pendente |
| Denúncias Social | Tipo de alvo aprovado, identificador, motivo e denunciante ativo | Entrada na fila, decisão humana auditada, sem remoção automática pela denúncia |
| Notificações internas, push e e-mail | Destinatário, tipo permitido, preferência, opt-in, deduplicação, transporte aprovado | Persistência interna, retries limitados, falha externa não desfaz domínio |
| Administração e analytics | Papel ADMIN, filtros/intervalos aprovados, justificativas e DTOs mínimos | Sem mass assignment; auditoria; estoque atual separado de eventos; ausência de exportação nova |

**Mapeamento de erros:** `401` sessão inválida/ausente; `403` sessão sem autorização; `404` recurso ausente ou oculto por política; `409` conflito de unicidade/estado quando aplicável; `422` entrada semântica/regra de domínio inválida; `429` rate limiting. Não forçar um único código quando o endpoint exigir tratamento mais específico, mas documentá-lo antes de implementá-lo. Os erros seguem o envelope da seção 12. Nenhuma tabela deste complemento cria endpoint adicional.

## 61.6 Rastreabilidade, testes e gates de aceite

| Requisito/área | Fonte normativa consolidada neste FSD | Gate de validação |
|---|---|---|
| Identidade, sessão e RBAC | 4, 13–14 | Sem acesso pré-verificação; sessão revogável; papel/status revalidados; parâmetros pendentes aprovados |
| Geografia, Home e denúncias | 3, 15–17 | PostGIS valida município e 3 km; duplicidade candidata 100 m; MinIO privado; falha de localização não autoriza escrita |
| Participação e ciclos | 18–26 | Uma participação/voto por regra; corrida transacional; estados 24.0; alertas 10 e 1000, resolução 10001 |
| Social e privacidade | 28–29 | Autorizações e visibilidade; limites de conteúdo; moderação humana; não implementar unfollow pendente |
| Notificação e integrações | 30, 34 | Preferências, persistência, deduplicação e três tentativas totais; Postmark aguarda transporte |
| Operação/segurança | 35–45 | Gates SEC-001..SEC-100, CI, secrets, logs, backups e hardening necessários |
| Analytics e administração | 46–47 | Dados agregados, RBAC, métricas temporais e auditoria; não extrapolar exportações |
| UX/PWA | 31–32, 61.1 | Dark Mode e componentes aprovados; interações pendentes não simuladas como funcionalidade |

Para cada regra implementada, produzir teste observável com **Dado / Quando / Então**, incluindo caminho de sucesso, erro de domínio, acesso negado e concorrência quando relevante. Critérios numéricos pendentes não devem ser testados como decisão final antes da aprovação. O esquema físico real e suas migrations versionadas são artefatos de execução obrigatórios para o código, e não podem ser reconstruídos por suposição a partir deste dicionário conceitual.

---

# 62. Fora do MVP
- vídeo;

- chat em tempo real;

- app nativo separado;

- outras cidades;

- outros idiomas;

- login obrigatório de órgãos;

- submissão automática em sistemas externos protegidos;

- acompanhamento automático de protocolo oficial;

- prazos/respostas/obras oficiais automáticos;

- recomendação algorítmica no Social;

- escrita offline.

---

# 63. Definition of Done
Uma feature está concluída somente quando:

- regra funcional está implementada;

- autorização está server-side;

- validação está implementada;

- SQL está parametrizado;

- migration necessária existe;

- migration sobe em banco limpo;

- testes positivos passam;

- testes negativos relevantes passam;

- Security Gate aplicável foi revisado;

- nenhum Critical permanece;

- nenhum High foi ignorado sem exceção formal;

- secrets não aparecem;

- logs não vazam dados;

- staging foi validado quando necessário;

- UX aprovada existente foi respeitada;

- documentação foi atualizada se a decisão mudou.

---

# 64. Regra de precedência
Em caso de divergência durante implementação:

1\. regras funcionais consolidadas neste FSD;

2\. decisões técnicas consolidadas neste FSD;

3\. decisões visuais aprovadas consolidadas neste FSD;

4\. itens marcados como pendentes não podem ser preenchidos por suposição.

Mudança que afete escopo, banco, permissão, fluxo principal ou segurança exige decisão explícita antes de alterar a especificação.
