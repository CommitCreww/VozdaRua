# Frontend — levantamento e proposta de blocos

Data: 13/11/2026. Estado: somente B01 — jornada pública de acesso — implementado e autorizado. Os demais blocos permanecem como planejamento, sem código executável. O trabalho atual é local, não conclui P09 e não libera endpoints ou deploy.

## Fontes e alcance da leitura

- Produto: [PRD](PRD/prd.md), [FSD](FSD/FSD.md), [decisões técnicas](DECISOES_TECNICAS.md) e [Security Gate](FSD/SECURITY_GATE_100.md).
- Visual: [Design](Design/Design.md), especialmente mapa das jornadas §3.3, [Home](Design/Home.md) e [catálogo de referências](Design/references/README.md). Imagens de acesso, Home e denúncia em quatro etapas inspecionadas visualmente nesta leitura.
- Planejamento e histórico: [PLANO](PLANO.md), [STATUS](STATUS.md), [ERROS](ERROS.md), [PREPARACAO](PREPARACAO.md).
- Integração: [contrato de recuperação](CONTRATO_AUTH_RECUPERACAO.md), [sprint de segurança](SECURITY_SPRINT_BACKEND.md), [ambiente](AMBIENTE_P01.md), [remediação](REMEDIACAO_P01.md), [corpus de senhas](SECLISTS_CORPUS.md), documentação e inventário em `database/`.
- Código: frontend existente, montagem do servidor, rotas/DTOs/serviços de autenticação e recuperação, primitivas de sessão/conta/senha, repository de conta e workflow de autenticação.

Este é um levantamento de produto, interface e fronteiras de integração. Não é uma auditoria integral de cada linha de SQL, teste, script de infraestrutura, histórico Git ou evidência privada. Os documentos operacionais foram consultados como registros históricos; os scans e testes registrados neles não foram reexecutados nem considerados aprovação atual.

Os caminhos visuais reais são `docs/Design/Design.md` e `docs/Design/Home.md`. Referências antigas a `docs/frontend/`, `docs/DESIGN.md` e `Desing.md` continuam em documentos históricos. Não foram criadas cópias nem alteradas fontes aprovadas.

## Estado encontrado no código

| Área | Evidência | Consequência para o frontend |
|---|---|---|
| Stack | React + TypeScript + Vite; Sora instalada no manifesto; CSS e componentes locais | Reaproveitar a base; nenhuma troca de framework necessária |
| Acesso | Seis telas públicas, contratos explícitos, validação e estados seguros implementados | A integração real permanece desabilitada enquanto auth não estiver montada e os gates não forem atendidos |
| Componentes | AuthLayout, TextField, PasswordField e ícones; tokens provisórios | Estender conforme cada tela; AuthLayout referencia hoje `login-title`, PasswordField fixa ID/nome de login |
| Navegação/HTTP | Roteamento visual local sem dependência externa; nenhum cliente HTTP operacional | Recuperação de sessão/CSRF continua obrigatória antes da área autenticada real |
| Servidor | `backend/src/app.ts` monta `/health` e `/ready`; `server.ts` não registra auth | Os handlers de auth existentes não estão disponíveis no servidor operacional |
| Conta local | Rotas de cadastro, verificação, reenvio, login e logout, com dependências injetadas | Podem orientar DTOs e testes; não equivalem a integração liberada |
| Recuperação | Forgot/reset implementados separadamente e não montados | Reutilizar contrato existente, inclusive respostas neutras |
| Sessão | Login retorna `account: {id, role, status}` e `csrfToken`; cookie HttpOnly | Não inventar nome para saudação nem persistir token em storage do navegador |
| Consulta inicial | `/api/v1/me` previsto no FSD, não implementado; consulta de sessão somente interna | Falta contrato para restaurar contexto e obter CSRF após refresh/nova aba |
| OAuth/MFA | Previstos nas fontes; sem implementação encontrada em `backend/src` | Não ativar botões como se os provedores já funcionassem |
| Home e demais domínios | Sem rotas de ocorrências, perfil, Social ou notificações em `backend/src` | APIs descritas no FSD são previstas, não disponíveis |
| PWA/E2E | Sem Service Worker/manifest funcional e sem Playwright no manifesto frontend | Entregas futuras; não alegar offline ou E2E concluídos |
| CI | Workflow existente é voltado ao backend | Incluir frontend no bloco correspondente, sem supor CI completo |

O trecho genérico de instruções sobre Koa/Mongoose não descreve este repositório. A stack específica documentada e encontrada é Fastify/pg/PostgreSQL, sem ORM.

## Ordem de trabalho proposta pela jornada

Os blocos são unidades de revisão visual/funcional, não substitutos das fases técnicas. Cada bloco separa interface revisável, testes com respostas simuladas explicitamente identificadas e integração real. Simulações pertencem aos testes/prévias de desenvolvimento e não devem permitir acesso fictício no aplicativo operacional.

| Bloco | Jornada e entrega | Fases relacionadas / dependências |
|---|---|---|
| B01 — Acesso | Login → cadastro → aguardar/verificar e-mail → login; recuperar acesso → redefinir → retornar ao login; componentes e feedback acessíveis | Jornada completa escolhida. Interface concluída para revisão; integração depende de P04–P09 e permanece bloqueada |
| B02 — Home | Sessão válida → localização → mapa resumido + feed, filtros, paginação, cards e navegação | Planejado, não implementado. Depende de P10–P13 e de nova autorização explícita |
| B03 — Detalhes e descoberta | Card → detalhes → relatos/histórico/canal oficial; mapa exploratório somente se escopo aprovado | P13; ações colaborativas dependem de P16/P19; distinguir leitura de mutação |
| B04 — Fazer denúncia | Localização → possíveis duplicidades → detalhes e uma foto → resultado pendente de moderação | P17 com P11/P14–P16; resolver categoria antes da consulta de duplicidade |
| B05 — Minhas ocorrências | Criadas por mim / Eu também vi → detalhe/histórico → edição ou remoção elegível | P13/P17; janela de 12 h e estado/ownership validados no servidor |
| B06 — Perfil e notificações | Dados, privacidade, exclusão, saída, preferências e notificações internas/push | P10/P27; contratos mínimos de conta/sessão podem ser necessários antes da tela completa, sem alterar o PLANO |
| B07 — Social | Feed → publicação → comentários/respostas → perfil público | P24, após P21–P23; entrada visível definida, sem unfollow ou gamificação presumidos |
| B08 — Consolidação cidadã | PWA, offline somente leitura, limpeza de cache, acessibilidade e jornadas integradas | P30/P32; acessibilidade e segurança são verificadas desde B01, não adiadas até este bloco |

Moderação/administração constituem contexto posterior separado (P20/P28/P29). A decisão entre central ou abas permanece aberta. A ordem visual acima segue a jornada solicitada; a execução técnica continua respeitando as dependências do PLANO. Não há autorização de implementação de todos esses blocos por este registro.

## B01 — requisitos e tarefas concretas

### Requisitos

- Preservar título “Bem-vindo(a)!”, apoio “Use sua voz para evolução”, paisagem/logo separados, Sora, azul-marinho/amarelo e ausência de barra autenticada.
- Login: e-mail/senha, mostrar/ocultar, envio único, carregamento, credencial inválida, e-mail não confirmado, limite de tentativas, falha de rede e indisponibilidade.
- Cadastro: nome, e-mail, senha e confirmação; dois aceites independentes inicialmente desmarcados; perfil privado e nenhuma sessão antes da verificação.
- Cadastro/reset: política D04 de 15–128 caracteres, sem requisitos artificiais de símbolos/maiúsculas. O backend conta pontos de código com `[...password].length`; não alterar a senha com trim ou conversão de caixa.
- Confirmação: token válido/expirado/usado; reenvio neutro; verificação bem-sucedida retorna ao login, sem autenticação automática.
- Recuperação: resultado neutro para existência ou ausência de conta; reset não confirma e-mail nem remove banimento, revoga sessões e exige novo login.
- OAuth e MFA permanecem dependências rastreadas. Não concluir P09 integral sem os contratos e testes exigidos no PLANO.

### Contratos observados

Todos os caminhos abaixo começam por `/api/v1/auth`. Descrevem handlers existentes, ainda não montados no servidor operacional.

| Operação | Body | Resposta principal / estados |
|---|---|---|
| POST `/login` | `email`, `password` | 200 `account` + `csrfToken`, cookie; 401 credenciais; 403 `EMAIL_UNVERIFIED`; 422 entrada; 429 limite |
| POST `/register` | `name`, `email`, `password`, `passwordConfirmation`, `termsAccepted`, `privacyAcknowledged` | 202 `{status: 'accepted'}`, inclusive duplicado; 422/429; sem sessão |
| POST `/email/verify` | `token` | 200 `{status: 'verified'}`; 422 inválido/expirado/consumido |
| POST `/email/resend` | `email` | 202 neutro; 422/429 |
| POST `/password/forgot` | `email` | 202 neutro; 422/429 |
| POST `/password/reset` | `token`, `password`, `passwordConfirmation` | 200 `{status: 'reset'}`; 422/429 |
| POST `/logout` | Sem payload necessário; cookie, `x-csrf-token` e Origin | 204; 401 quando contexto/CSRF/Origin inválido no handler atual |

Erros seguem `{code, message, requestId}`. Falhas inesperadas dependem do handler genérico. Não converter o 401 atual de logout em 403 no cliente nem inventar detalhe de erro por campo ausente da API. Limites do schema atual: nome até 120 e e-mail até 255 caracteres; token de conta em base64url com 43 caracteres. Esses contratos devem ser rechecados a cada integração.

### Tarefas do primeiro incremento, após fechar o recorte

1. Preparar Node 26 local e dependências dos lockfiles; repetir typecheck, testes e build da base antes de mudanças.
2. Registrar os caminhos visuais necessários. Candidatos do Design: `/login`, `/cadastro`, `/recuperar-acesso`, `/redefinir-senha`; confirmação e documentos legais ainda precisam de destino definido.
3. Tornar componentes reutilizáveis apenas onde necessário: título acessível do AuthLayout, IDs/labels/autocomplete dos campos de senha e mensagens de formulário.
4. Implementar as telas/estados autorizados com testes RTL, preservando ativos existentes até revisão visual. Não embutir telas inteiras em imagens.
5. Preparar cliente HTTP com DTOs explícitos, erros seguros, cookies e CSRF conforme contrato. Definir origem/proxy: hoje CORS usa `credentials: false` e Vite não tem proxy; chamadas com cookies entre origens exigem configuração coordenada e testes, sem liberar `*`.
6. Resolver com backend consulta inicial de sessão/conta e emissão/renovação de CSRF após refresh. A ausência desse contrato não autoriza guardar token em localStorage/sessionStorage ou inventar endpoint.
7. Integrar somente após gates operacionais; testar sucesso/falha, expiração, logout, duas abas, conta banida e não verificada. Testes com mocks não comprovam cookies/CORS/SQL reais.
8. Revisar mobile/tablet/desktop, teclado, zoom, foco, contraste, leitor de tela e teclado virtual; registrar resultados e pontos não testados.

## Decisões a tratar com o responsável

| Momento | Questão | Proposta para discussão, não decisão |
|---|---|---|
| Decidido em 13/11/2026 | B01 completo ou somente login inicialmente? | Jornada completa de acesso |
| Antes da Home | Social ou Mapa na segunda posição? | Preservar Social da Home/FSD ou conciliar Mapa e acesso a Social antes de implementar |
| B01 visual | Confirmação/reset não possuem mockups finais; ativos e tokens ainda provisórios | Derivar do AuthLayout existente e revisar antes de consolidar |
| B01 integrado | Como recuperar conta/sessão/CSRF ao recarregar? | Elaborar contrato considerando `/me` já previsto, com revisão de segurança |
| Cadastro operacional | Conteúdo, links e versões legais definitivos | Solicitar material aprovado; não inventar termos nem enviar aceites de documentos inexistentes |
| B02 | Sem localização, saudação sem nome, Ver todos, foto + mini mapa | Definir cada interação antes de ativá-la; não fabricar dados ou suprimir mini mapa obrigatório |
| B04 | Categoria é exigida pela busca, mas aparece depois no desenho | Selecionar categoria antes da verificação ou revisar a ordem com o responsável |
| B06/B07 | Entrada de notificações | Confirmar descoberta e retorno; Social já possui atalho aprovado na Home e não cria sexta entrada |

D03/D04 já têm aprovação posterior em DT §5.6. Trechos antigos do FSD/PLANO ainda os listam como abertos; não solicitar novamente escolhas já aprovadas. A divergência de precedência DT §43/FSD §64 permanece registrada em D02; conflitos novos de apresentação/escopo são resolvidos explicitamente, apenas na parte afetada.

## Segurança e aceite por bloco

- Cookie HttpOnly é a fonte da sessão; estado React não autoriza. Servidor revalida papel/status/ownership; BANIDO permanece em leitura independentemente do papel.
- CSRF nas mutações por cookie, redirecionamentos internos controlados, escaping React e ausência de segredo no bundle/log/storage.
- Tokens de confirmação/reset precisam de fluxo de entrega/consumo que evite exposição em histórico/referrer/logs; não definir transporte do link por inferência.
- Sem cache de auth/respostas sensíveis nem fila de escrita offline. Limpeza de estado privado ao encerrar sessão; não expor dados antigos ao próximo usuário.
- Falha de localização não concede permissão. Distância, município, unicidade e janela temporal são decisões do backend.
- Não repetir mutações automaticamente após erro de rede sem contrato de idempotência; prevenir clique duplo não substitui controle no servidor.
- Testes RTL para estados e acessibilidade; Playwright para jornadas e integração real quando ambiente liberado; Security Gate aplicável por entrega. Nenhum scanner ausente recebe PASS.

## Incrementos implementados e verificações

- B01: login, cadastro, confirmação/reenvio, recuperação e redefinição; sem cliente HTTP operacional, sessão fictícia ou token em storage. A rota pública continua segura por padrão e os documentos jurídicos inexistentes não são simulados.
- Node oficial 26.13.1 foi preparado pelo script do projeto e dependências do lockfile foram instaladas sem alteração de manifesto. TypeScript PASS, build Vite PASS e Vitest **41/41 PASS** em dois arquivos no recorte final B01.
- A inspeção visual automatizada no Chrome foi interrompida porque o Computer Use não conseguiu confirmar a URL atual com segurança. O responsável revisou visualmente o bloco de login e solicitou preservá-lo.
- A avaliação SEC-001–125 desta entrega está em [SECURITY_FRONTEND_B01.md](SECURITY_FRONTEND_B01.md). A revisão humana exigida por SEC-125 continua pendente.
