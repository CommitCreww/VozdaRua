# FSD — VOZ DA RUA

**Functional Specification Document**  
**Versão:** 1.0  
**Status:** Base consolidada para implementação do MVP  
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
- arquivar/restaurar quando autorizado;
- analisar denúncia de ocorrência;
- moderar conteúdo Social;
- registrar justificativa;
- visualizar histórico/evidências.

Toda ação relevante deve gerar auditoria.

## 4.6 Administrador

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
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── assets/
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── plugins/
│   │   ├── hooks/
│   │   ├── security/
│   │   ├── integrations/
│   │   ├── errors/
│   │   └── types/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── db/
│   ├── migrations/
│   └── seeds/
├── scripts/
│   └── migrate.sh
├── docs/
│   ├── PRD.md
│   ├── DECISOES_TECNICAS.md
│   ├── DESIGN.md
│   ├── FSD.md
│   └── SECURITY_GATE_100.md
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

Um usuário possui no máximo um relato ativo por ciclo.

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

## 13.2 Persistência

O storage exato da sessão ainda é uma decisão técnica aberta.

Regras:

- store de memória não é permitido em produção;
- sessão precisa sobreviver ao ciclo normal do processo conforme a política definida;
- logout invalida no servidor.

## 13.3 CSRF

Toda mutação autenticada por cookie deve possuir proteção CSRF.

Também validar `Origin`/`Referer` quando apropriado como defesa adicional.

## 13.4 Cadastro local

Entrada:

- nome;
- e-mail;
- senha;
- confirmação;
- aceite dos termos;
- aceite da política de privacidade.

Fluxo:

```text
validar entrada
→ verificar e-mail único
→ criar usuário privado
→ hash seguro da senha
→ gerar token de confirmação
→ enviar pelo Postmark
→ conta aguarda confirmação
```

Confirmação de e-mail é obrigatória para conta local.

A política numérica exata de senha ainda não está fechada no design; não inventar regra definitiva sem decisão da equipe. A implementação deve usar hash de senha adaptativo e seguro.

## 13.5 Login

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

A política de vinculação automática a uma conta local já existente com o mesmo e-mail permanece pendente e não deve ser presumida.

## 13.7 Recuperação

Fluxo:

```text
solicitar
→ resposta neutra
→ token aleatório de uso único
→ hash persistido
→ envio Postmark
→ redefinição
→ invalidar token
```

Não revelar se o e-mail existe.

Prazo exato do token e limite exato de solicitações ainda precisam ser fechados antes de finalizar o módulo, mantendo rate limiting obrigatório.

## 13.8 Endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/email/verify
POST /api/v1/auth/email/resend
POST /api/v1/auth/password/forgot
POST /api/v1/auth/password/reset

GET  /api/v1/auth/oauth/google
GET  /api/v1/auth/oauth/google/callback
GET  /api/v1/auth/oauth/github
GET  /api/v1/auth/oauth/github/callback
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

# 14. Perfil

Endpoints:

```text
GET   /api/v1/me
PATCH /api/v1/me
PATCH /api/v1/me/privacy
DELETE /api/v1/me
```

Perfil nasce:

```text
PRIVADO
```

Preferências:

- perfil público/privado;
- exibir nome em relatos.

Ao excluir conta:

- remover/anonimizar dados pessoais quando possível;
- ocultar presença Social;
- relatos de interesse coletivo podem permanecer anonimizados;
- manter somente auditoria necessária.

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

1. mais próximos;
2. distâncias equivalentes → atualização mais recente primeiro.

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
+ ocorrência ativa
+ <= 100 m
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
+ ciclo 1
+ relato INICIAL
+ evidência
+ histórico PENDENTE_VALIDACAO
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

Base:

```text
/api/v1/moderation
```

Endpoints previstos:

```text
GET  /api/v1/moderation/occurrences
GET  /api/v1/moderation/alerts

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
GET  /api/v1/occurrences/:id/official-channel
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
POST   /api/v1/social/posts/:id/likes
DELETE /api/v1/social/posts/:id/likes/me
```

## 28.5 Comentários

Até 500 caracteres.

```text
GET    /api/v1/social/posts/:id/comments
POST   /api/v1/social/posts/:id/comments
PATCH  /api/v1/social/comments/:id
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

Usuário ativo pode seguir perfil público.

Perfil privado pode seguir.

Banido não pode seguir.

Endpoint de seguir:

```text
POST /api/v1/users/:id/followers
```

**Pendência funcional:** ainda não foi decidido se o usuário pode “deixar de seguir”. Não implementar endpoint de unfollow como requisito definitivo até decisão.

---

# 29. Denúncia e moderação Social

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
GET  /api/v1/moderation/social/reports
POST /api/v1/moderation/social/posts/:id/hide
POST /api/v1/moderation/social/posts/:id/remove
POST /api/v1/moderation/social/comments/:id/hide
POST /api/v1/moderation/social/comments/:id/remove
```

Toda ação relevante gera auditoria.

---

# 30. Notificações

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
GET   /api/v1/notifications
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all

GET   /api/v1/me/notification-preferences
PATCH /api/v1/me/notification-preferences

POST   /api/v1/me/push-subscriptions
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

## 32.3 Autenticação

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

Desenvolvimento:

```text
Mailpit
```

Produção:

```text
Postmark
```

Casos:

- confirmação;
- recuperação;
- notificações apropriadas.

Ainda não está decidido se Postmark será usado por SMTP ou API.

Não inventar.

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

Backup externo permanece evolução futura.

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
VPS Hostinger
Docker Compose
Nginx
```

PostgreSQL e MinIO não ficam publicamente expostos.

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
12 horas
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
=
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

Indicadores:

- usuários ativos;
- usuários banidos;
- novos usuários;
- ocorrências por status;
- por categoria;
- por bairro;
- pendentes;
- alertas;
- relatos;
- resolvidas;
- reabertas;
- tempo médio de validação;
- acessos aos canais;
- posts;
- comentários;
- curtidas.

Preferir agregados.

Evitar tracking individual desnecessário.

Endpoint de visão geral:

```text
GET /api/v1/admin/analytics/overview
```

---

# 47. Administração

Base:

```text
/api/v1/admin
```

Usuários:

```text
GET  /users
GET  /users/:id
POST /users/:id/ban
POST /users/:id/unban
POST /users/:id/promote-moderator
POST /users/:id/remove-moderator
```

Categorias:

```text
GET   /categories
POST  /categories
PATCH /categories/:id
```

Subcategorias:

```text
POST  /categories/:id/subcategories
PATCH /subcategories/:id
```

Órgãos:

```text
GET   /organizations
POST  /organizations
PATCH /organizations/:id
```

Canais:

```text
GET   /channels
POST  /channels
PATCH /channels/:id
```

Parâmetros:

```text
GET   /system-parameters
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
+ ciclo
+ relato inicial
+ evidência
+ histórico
```

## Validar

```text
status
+ historico
+ moderação
+ notificação
```

## Resolver

```text
status
+ encerramento ciclo
+ histórico
+ auditoria
+ notificação
```

## Reabrir

```text
novo ciclo
+ REABERTA
+ histórico
+ auditoria
+ notificação
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

- [ ] Cadastro local cria perfil privado.
- [ ] E-mail local exige confirmação.
- [ ] OAuth Google/GitHub funciona conforme regras.
- [ ] Recuperação não enumera e-mail.
- [ ] Banido autentica, mas fica read-only.
- [ ] Logout invalida sessão no servidor.
- [ ] Session ID é regenerado após login.

---

# 53. Critérios de aceite — ocorrência

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
- [ ] Unfollow não é inventado enquanto pendente.

---

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

# 61. Pendências não bloqueantes que não devem ser inventadas

## Funcional

- se o usuário pode deixar de seguir.

## Auth/UX

- política numérica exata de senha;
- política de vinculação OAuth quando já existe conta local com mesmo e-mail;
- duração exata da sessão;
- expiração exata do token de recuperação/confirmação;
- limite exato de solicitações de recuperação;
- textos finais e versionamento legal de termos/privacidade.

## Técnica

- store persistente exato da sessão server-side;
- Postmark via SMTP ou API;
- método exato de emissão/renovação TLS no Nginx;
- ferramenta/rotina exata do backup local.

## Design

- hex finais;
- tokens semânticos finais;
- escala tipográfica final;
- ativos finais/logo/paisagem;
- detalhes Light Mode;
- composição final entre foto e mini mapa;
- posicionamento final do acesso às notificações.

Essas pendências não autorizam implementação arbitrária.

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

1. regras funcionais consolidadas neste FSD;
2. decisões técnicas consolidadas neste FSD;
3. decisões visuais aprovadas consolidadas neste FSD;
4. itens marcados como pendentes não podem ser preenchidos por suposição.

Mudança que afete escopo, banco, permissão, fluxo principal ou segurança exige decisão explícita antes de alterar a especificação.
