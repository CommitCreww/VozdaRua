# Voz da Rua — Design System, UX/UI e especificação das telas

> **Versão:** 0.4 — consolidação de referências visuais e fluxos  
> **Atualizado em:** 12/11/2026  
> **Tipo:** documento vivo de design e experiência, preparado para implementação orientada por especificações (SDD)  
> **Produto:** PWA mobile-first; município de São Paulo/SP  
> **Tema inicial:** Dark Mode  
> **Fonte principal da interface:** Sora  
> **Referências visuais:** pasta [`references/`](references/)


> **Conciliação pendente:** o pacote v0.4 apresenta Mapa na barra inferior e declara aprovação visual; a Home e a versão anterior apresentam Social como aprovado. A escolha e o acesso ao Social dependem de decisão explícita. As afirmações de aprovação da barra abaixo devem ser lidas com esta ressalva. A organização deste arquivo não altera requisitos nem resolve D02/D06.

## 0. Resumo executivo e status

Esta versão **preserva e amplia** as decisões do Design System v0.1/v0.2 enviado pela equipe. Consolida a linguagem visual, telas do cidadão, fluxos de denúncia, histórico, perfil e **duas alternativas ainda abertas para a área de moderação**. A proposta mais recente de navegação inferior é **Início · Mapa · Denunciar · Ocorrências · Perfil**; ela diverge da referência anterior que apresentava **Social** na segunda posição.

**Não confundir aprovação visual com aprovação de regra de negócio.** As imagens são protótipos ilustrativos e usam exemplos fictícios, inclusive contadores, fotografias, nomes, endereços, estados, protocolos e prazos. As exigências funcionais devem ser extraídas do PRD atualizado. O acompanhamento de respostas de órgãos, compromissos de prazo e obras **é evolução futura, fora do MVP**, conforme a seção 28 do PRD.

### 0.1 Convenções de status

| Marcador | Significado | Tratamento pelo Codex |
|---|---|---|
| **RF** | Requisito funcional documentado no PRD | Implementar conforme PRD/especificação técnica; não inferir pelas imagens. |
| **VA** | Direção visual explicitamente aprovada pelo usuário | Preservar composição e linguagem, adaptando responsivamente. |
| **RI** | Referência inicial bem recebida, mas sem aprovação de todos os detalhes | Pode orientar composição; validar variações e interações. |
| **PROPOSTA** | Opção sugerida pelo design, ainda sem decisão | Não consolidar como regra obrigatória. |
| **PENDENTE** | Questão sem decisão final | Não assumir comportamento definitivo nem criar obrigação fictícia. |
| **FUTURO** | Evolução fora do escopo inicial | Não implementar no MVP sem decisão explícita. |

### 0.2 Hierarquia de fontes e tratamento de conflitos

1. **PRD/levantamento funcional mais recente:** requisitos, permissões, estados, limites, validações e escopo do MVP.
2. **Decisões técnicas/arquiteturais existentes no repositório:** contratos técnicos quando formalmente aprovados (a equipe deve confirmar os caminhos e a precedência entre arquivos conflitantes).
3. **Este `design.md`:** UX/UI, estrutura visual, navegação, padrões compartilhados e estados de tela.
4. **Imagens em `references/`:** inspiração e validação visual, **não** fonte de dados ou lógica.

Conflito identificado: versões anteriores deste documento indicaram **confirmação de e-mail não obrigatória no MVP**, conforme decisão registrada na conversa; o **PRD enviado mais recentemente exige confirmação para contas locais**, com exceção para e-mails validados por Google/GitHub. Para o desenvolvimento, **não omitir a confirmação sem conciliar formalmente a divergência**. A tela de verificação e a política de bloqueio permanecem pendentes de especificação.

### 0.3 Decisões visuais consolidadas

| Tema | Estado | Decisão |
|---|---|---|
| Plataforma | VA | PWA mobile-first, adaptável a desktop e tablet; foco no uso durante deslocamentos. |
| Aparência | VA | Moderna, amigável, urbana e confiável; balanço entre informação e respiro. |
| Tema | VA | Dark Mode padrão; Light Mode futuramente, com tokens separados. |
| Marca | VA/RI | Identidade amarelo/preto; usar **símbolo circular** na Home e, quando necessário, combinação símbolo + nome em telas internas/auth. Não redesenhar sem aprovação. |
| Paleta | VA | Azul-marinho profundo + amarelo urbano; intensidade equilibrada. Hexadecimais ainda provisórios. |
| Tipografia | VA | Sora como família de interface, com fallback seguro. |
| Ilustração | VA | Cidade noturna urbana, edifícios em camadas, iluminação azul/amarela, viadutos, fiação, postes, árvores/silhuetas e arquitetura fictícia; **não depende de monumento reconhecível**. |
| Home | VA | Cabeçalho com **logo circular isolado**, sem sino/perfil no canto, mapa compacto e lista de ocorrências com fotos. |
| Navegação cidadão | PENDENTE DE CONCILIAÇÃO | **Início / Mapa / Denunciar / Ocorrências / Perfil** com Denunciar central amarelo. |
| Página de mapa expandido | VA/PROPOSTA | Direção visual criada para o item Mapa; integração como rota de exploração no MVP exige conciliação com PRD (que exigia mapa completo no fluxo de denúncia). |
| Detalhes da ocorrência | VA | Foto maior, categoria/status, endereço, ações, relatos/histórico; card de acompanhamento no lugar do mini mapa na variação discutida. |
| Denúncia | VA | Fluxo de **quatro etapas**: localização → duplicidade → detalhes → confirmação. |
| Minhas ocorrências | RI | Lista das criadas/confirmadas, detalhe e histórico; prazos oficiais dos exemplos são apenas futuros. |
| Social | RI | Feed, criar post, comentários, sem assumir funcionalidades extras ilustradas. |
| Perfil | RI | Informações pessoais, privacidade, notificações e entrada contextual de moderação. |
| Moderação | PROPOSTA | Alternativas **Central dedicada** e **Integrada por abas**; usuário ainda não escolheu a navegação final. |

---

## 1. Identidade visual e tom

O Voz da Rua deve parecer um **aplicativo de participação comunitária confiável**, não um portal público burocrático nem uma rede social de entretenimento. O usuário precisa perceber: **onde o problema está, qual o seu estado, o que pode fazer e qual o próximo passo**.

### 1.1 Princípios

- **Legibilidade antes da decoração:** a paisagem só aparece em áreas de marca/cabeçalho; informações operacionais usam fundos controlados e contraste consistente.
- **Uma ação primária por contexto:** amarelo nos CTAs principais; evitar todos os controles amarelos simultaneamente.
- **Sinalização clara:** estado sempre combina palavra + símbolo; cor isolada não basta.
- **Confiança e origem:** distinguir ocorrência da plataforma, relato da comunidade e eventual comunicação verificada de órgão oficial.
- **Uso rápido no celular:** áreas de toque generosas, fluxo de formulário progressivo, feedback imediato e barra inferior acessível.
- **Não vender expectativas não comprovadas:** contagem de relatos não implica resolução, prioridade não significa validação, nem encaminhamento assistido comprova protocolo oficial.

### 1.2 Logotipo e assinatura

- **Home:** usar somente o **emblema circular amarelo/preto** no topo à esquerda (sem o texto “Voz da Rua” ao lado), conforme última revisão visual.
- **Autenticação:** emblema e título gráfico “Voz da Rua”, centralizados; traço amarelo sob o nome, sem slogan obrigatório junto ao logotipo.
- **Telas internas:** cabeçalho compacto com marca + botão de voltar quando necessário; a presença do nome pode variar por espaço.
- Não usar símbolo recriado por IA como substituto do arquivo definitivo sem validação. As imagens do catálogo são referências, não recursos do logo em qualidade de produção.

### 1.3 Paisagens e imagens

**Direção aprovada:** cidade noturna, predominância de azul profundo, luzes quentes nos postes/janelas, prédios distantes, viadutos e outros elementos urbanos; não é preciso identificar um ponto turístico real de São Paulo. A Home mais recente usa um **viaduto urbano elevado com arcos, fiação e grafites** ao fundo. A paisagem da autenticação pode usar uma ponte estaiada distante.

**Evitar:** silhueta turística óbvia repetida em todas as páginas, textura de mapa geométrico no céu, excesso de brilho, ilustrações infantis, texto embutido na paisagem, imagens decorativas comprometendo o contraste. A equipe pode reutilizar uma biblioteca consistente de cenários, mas não deve criar imagens novas arbitrárias a cada tela.

**Conteúdo de ocorrências:** fotografias reais aprovadas pela moderação; se não houver foto pública liberada, usar placeholder textual e visual neutro. Não publicar evidência privada, rosto identificável, placa legível nem dados pessoais desnecessários.

---

## 2. Tokens, tipografia e layout compartilhado

### 2.1 Cores — valores provisórios, não congelados

| Token | Valor inicial | Uso |
|---|---|---|
| `--color-bg` | `#061626` | Fundo geral do tema escuro. |
| `--color-surface` | `#092039` | Cards, painéis, folhas de detalhe. |
| `--color-surface-input` | `#102C47` | Inputs e filtros. |
| `--color-border` | `#4A7293` | Delimitação de componentes. |
| `--color-text` | `#F8FAFC` | Texto principal. |
| `--color-text-muted` | `#C0CDDC` | Descrições, detalhes e metadados. |
| `--color-accent` | `#FFC400` | Botões principais, navegação ativa e pins. |
| `--color-on-accent` | `#081827` | Texto/ícones sobre amarelo. |
| `--color-focus` | `#FFE17A` | Foco acessível proposto. |

**PENDENTE:** tokens finais de sucesso, aviso, informação, erro, prioridade, status e localização. As prévias usam verde para validação, amarelo para destaque, azul em estados intermediários e vermelho para exclusão/alerta; são convenções **a validar**, não contratos cromáticos. Não utilizar amarelo da marca como sinônimo universal de urgência. Nunca usar texto branco em botão amarelo sem verificar contraste.

### 2.2 Tipografia

- Família `Sora, system-ui, sans-serif`, aplicada a botões, tabelas, campos, navegação, cards e títulos.
- Pesos de partida **propostos**: 400 corpo; 500 legendas; 600 botões/títulos de card; 700 títulos de página.
- Escala **proposta**: texto base `16px`; secundário `14px`; título card `18–20px`; seção `22–26px`; página `26–30px`; rótulo de navegação adaptável e legível.
- Não fixar texto dentro das imagens. Compatibilidade com acentos, ampliação de texto e `line-height` confortável é obrigatória.

### 2.3 Layout e responsividade

- **Mobile-first** em coluna única; distribuição vertical por prioridade, sem depender da altura exata do protótipo.
- Espaçamentos de partida: grade 4px; uso preferido de 8, 12, 16, 24 e 32px.
- Margem lateral responsiva de partida: `16–24px`.
- Controles acionáveis: pelo menos 44 × 44px; preferir 48–52px em ações críticas.
- Cantos de botões/campos: ~12–16px; cards/painéis: ~16–24px; auth painel superior mais arredondado.
- `max-width` em formulários e centralização inteligente em telas largas; adaptar map/lista em desktop **sem mudar o fluxo**.
- Reservar `safe-area-inset-bottom` para barra do PWA e permitir rolagem quando teclado aberto.
- Não renderizar moldura de iPhone, hora/status-bar fictícios ou home-indicator da imagem dentro do produto real.
- Densidade equilibrada: títulos e status visíveis rapidamente; descrições maiores em detalhe, não na lista.

### 2.4 Ícones

Usar uma única família de ícones simples, consistentes e reconhecíveis, com rótulo textual nos pontos de navegação. Exemplos: casa, mapa, sinal de mais, lista, pessoa, pin, calendário, relógio, escudo, sino, documento, seta e confirmação. **PENDENTE:** biblioteca/espessura/tamanhos exatos. Ícones decorativos devem ser ignorados por leitores de tela; os interativos recebem nome acessível.

---

## 3. Arquitetura de navegação — decisão central

### 3.1 Barra inferior do cidadão (conciliação pendente)

```
┌──────────┬──────────┬────────────┬─────────────┬─────────┐
│  Início  │   Mapa   │ Denunciar+ │ Ocorrências │ Perfil  │
└──────────┴──────────┴────────────┴─────────────┴─────────┘
```

- **Início**: abre Home com mapa resumido e feed de até 3 km.
- **Mapa**: abre mapa de exploração de ocorrências (direção de design aceita; verificar inclusão formal no MVP, pois PRD inicial só exigia mapa completo no fluxo de denúncia).
- **Denunciar**: botão central circular amarelo, visualmente mais proeminente; inicia o fluxo de quatro etapas.
- **Ocorrências**: mostra **Minhas ocorrências**: criadas pelo usuário e confirmadas por ele. O nome curto “Ocorrências” deve ser diferenciado da lista geral na Home e do mapa.
- **Perfil**: conta, preferências, notificações e acesso à moderação, quando autorizado.

**Social permanece no produto.** A posição na navegação inferior diverge da Home e do Design anterior; necessita conciliação. **PENDENTE CRÍTICO:** definir entrada descoberta para Social, criar publicação e perfis públicos (opções de UX: item no Perfil, atalho na Home ou área de comunidade). Não inventar uma sexta entrada na barra sem aprovação. O PRD continua exigindo as funcionalidades sociais.

**Notificações:** ícones de sino e avatar foram removidos do cabeçalho da Home. Acesso pela área Perfil/Notificações é **proposta atual**, a confirmar; notificações internas previstas pelo PRD não podem desaparecer do produto.

### 3.2 Persistência da barra inferior

- Exibir nas páginas-raiz autenticadas: Home, Mapa, Minhas ocorrências e Perfil, sempre indicando item ativo por texto + ícone/estado.
- **Não exibir** em autenticação.
- Em telas de formulário imersivo (denúncia em quatro passos), detalhes de ocorrência e moderação, **proposta** é utilizar cabeçalho com Voltar e esconder a barra quando ela prejudicar a leitura ou a confirmação. Protótipos mostram barra mesmo no fluxo; **decisão final pendente**. Nunca cobrir CTA/teclado.
- Navegação de detalhe via card preserva rota anterior/scroll/filtros quando tecnicamente possível; botão Voltar retorna à origem e não reinicia indevidamente o processo.

### 3.3 Mapa das jornadas do cidadão

```text
PÚBLICO
  Login ── Cadastro ── (confirmação de e-mail conforme PRD)
    │  └── Recuperar acesso ── Redefinir senha
    └── sessão autenticada
          │
          ├── Início / Home
          │    ├── mini mapa ── Ver no mapa ───────────────┐
          │    ├── card da ocorrência ── Detalhes ─────────┤
          │    └── Eu também vi (regras geográficas/conta) │
          ├── Mapa de ocorrências ◀─────────────────────────┘
          │    └── pin selecionado ── prévia ── Detalhes
          ├── Denunciar (+)
          │    ├── 1. Localização e validação geográfica
          │    ├── 2. Duplicidade de ocorrência
          │    │      ├── é o mesmo problema → Eu também vi
          │    │      └── problema diferente → continuar
          │    ├── 3. Categoria + descrição + 1 foto
          │    └── 4. Envio / confirmação → Minhas ocorrências
          ├── Ocorrências
          │    ├── Criadas por mim ── Detalhes ── Histórico
          │    └── Eu também vi ── Detalhes
          ├── Perfil
          │    ├── Dados / privacidade / preferências
          │    ├── Notificações (entrada visual proposta)
          │    ├── Perfil público (quando ativado)
          │    └── Acessar moderação (se moderador/admin) ─┐
          └── Social (acesso pendente de definição)         │
               ├── Feed ── Publicação / comentários        │
               └── Criar post (apenas perfil público)      │
                                                           ▼
                                                    ÁREA MODERAÇÃO
```

### 3.4 Mapa do contexto de moderação (propostas alternativas)

```text
Perfil do usuário autorizado
  └── Acessar moderação [só moderador/admin]
       ├── PROPOSTA A: Central dedicada
       │    ├── Fila de ocorrências → Análise → Decisão
       │    ├── Alertas → Análise
       │    └── Moderação Social → Análise → Decisão
       │         └── Voltar ao app → Perfil/área cidadã
       └── PROPOSTA B: Moderação com abas
            ├── Aba Ocorrências → Análise → Decisão
            ├── Aba Alertas → Análise
            └── Aba Social → Análise → Decisão
                 └── Área cidadã → Perfil/área cidadã
```

**Status:** a ideia de entrada por Perfil foi fornecida para exploração; **a escolha A/B/híbrida não foi feita**. A área de moderação representa **mudança de contexto visual, jamais de função, autorização ou sessão**. A conta mantém capacidades de cidadão, sujeitas às permissões do PRD.

### 3.5 Rotas sugeridas, não contratos existentes

| Caminho sugerido | Tela | Proteção/observação |
|---|---|---|
| `/login` | Login | Público. |
| `/cadastro` | Cadastro | Público. |
| `/recuperar-acesso`, `/redefinir-senha` | Recuperação e nova senha | Fluxo com token válido. |
| `/home` | Home | Autenticado. |
| `/mapa` | Exploração de ocorrências | Autenticado; confirmar escopo. |
| `/ocorrencias/:id` | Detalhe de ocorrência | Autenticado; permissões para ações. |
| `/denunciar/localizacao` | Denúncia passo 1 | Autenticado, conta autorizada. |
| `/denunciar/verificacao` | Denúncia passo 2 | Depende de localização válida. |
| `/denunciar/detalhes` | Denúncia passo 3 | Categoria/título/descrição/foto. |
| `/denunciar/conclusao` | Confirmação de envio | Não inventar protocolo/prazo. |
| `/minhas-ocorrencias` | Minhas ocorrências | Autenticado. |
| `/social`, `/social/novo`, `/social/:id` | Social | Acesso pela UX a definir; postagem sob restrição de perfil público. |
| `/perfil`, `/perfil/privacidade`, `/perfil/notificacoes` | Perfil e preferências | Autenticado. |
| `/usuarios/:id` | Perfil público de outro usuário | Respeitar visibilidade. |
| `/moderacao` | Entrada/central ou abas | Moderador/admin, RBAC no servidor. |
| `/moderacao/ocorrencias`, `/moderacao/ocorrencias/:id` | Fila/análise | Moderador/admin. |
| `/moderacao/alertas`, `/moderacao/social` | Alertas/relatos sociais | Moderador/admin. |
| `/admin/*` | Administração | Somente administrador. |

**Roteamento e deep links PWA:** ao entrar por notificação/link, validar sessão; após login, direcionar ao recurso se autorizado. Tratar `404`, falta de autorização, conteúdo removido e retorno à origem sem revelar dados privados.

---

## 4. Componentes reutilizáveis (inventário para design e desenvolvimento)

| Componente | Uso e conteúdo | Estados/interações |
|---|---|---|
| `AuthLayout` | Marca, paisagem, painel, onda de rodapé | Tela curta, teclado aberto, rolagem. |
| `BrandHeader` | Símbolo/wordmark e paisagem opcional | Compacto/expandido, contraste garantido. |
| `BottomNav` | Cinco destinos do cidadão | Item ativo, foco, safe area, teclado. |
| `ModeratorShell` | Navegação própria/contexto distinto | Voltar ao cidadão, controle de permissão. |
| `PageHeader` | Voltar, título e ação contextual | Navegação, rótulo acessível. |
| `PrimaryButton`, `SecondaryButton`, `DangerButton` | Ações salvas/irreversíveis | Loading, disabled, pressed, erro. |
| `TextField`, `PasswordField`, `TextArea`, `SelectField` | Formulários com label real | Foco, erro, ajuda, caracteres, disabled. |
| `CheckboxConsent`, `Toggle`, `SegmentedTabs` | Aceites, preferências e filtros | Seleção anunciada, confirmação quando preciso. |
| `StatusBadge`, `PriorityTag`, `CategoryChip` | Tipo, estado e prioridade | Texto + ícone, não cor isolada. |
| `MapPreview`, `FullMap`, `LocationPin` | Mapa compacto/completo | Falha de tiles, GPS negado, zoom, legenda. |
| `OccurrenceCardCompact` | Foto, categoria, status e resumo | Clique abre detalhe; ações próprias. |
| `OccurrenceDetailHeader` | Foto, título, status, endereço | Foto indisponível, dados extensos. |
| `ReportCounter`, `MetricTile` | Relatos, resolução e métricas verificadas | Sem dados/atualização, sem números fabricados. |
| `Timeline` | Histórico da ocorrência | Eventos reais, ordem temporal. |
| `OfficialChannelCard` | Responsável, link e instruções | Sem canal cadastrado, externo em nova aba. |
| `FormStepper` | 4 passos da denúncia | Concluído, atual, bloqueado, erro, voltar. |
| `UploadEvidence` | Foto obrigatória de denúncia | 1 foto, troca, validação e erro. |
| `DuplicateSuggestionCard` | Possível ocorrência semelhante | Confirmar existente ou continuar com novo problema. |
| `ModerationQueueItem`, `ModerationDecisionDialog` | Fila e ações administrativas | Justificativa, confirmação, auditoria. |
| `SocialPostCard`, `CommentItem` | Feed e comentários | Privacidade, reportar, removido, loading. |
| `EmptyState`, `ErrorState`, `Skeleton`, `OfflineBanner` | Feedback transversal | Textos claros e ação recuperável. |

**Separar lógica e visual:** componentes recebem dados e callbacks; não embutir contadores, URLs oficiais, status ou localização fictícios no JSX/CSS. Usar componentes semânticos e controles acessíveis.

---

## 5. Módulo A — Identidade e Acesso

**Referência:** [`auth-fluxo-dark.png`](references/auth-fluxo-dark.png). **Estado:** VA da linguagem visual e da composição das três telas. O mockup contém exemplos de copy que não são contratos literais.

### 5.1 Login

**Composição:** logo circular com wordmark e traço amarelo; skyline noturna ao fundo; painel arredondado. Título “Bem-vindo(a)!” e, conforme preferência textual registrada, apoio **“Use sua voz para evolução”** (a arte de referência ainda mostra frase anterior). Campos e-mail e senha (olho exibir/ocultar), link de recuperação, CTA amarelo **Entrar**, separador “ou continue com”, Google/GitHub, link para criar conta.

**RF:** autenticar por conta local, Google ou GitHub; páginas internas protegidas; após login, Home. Usuário banido pode autenticar e navegar em modo somente leitura. **UX:** erro genérico para credenciais inválidas, estado carregando, envio duplicado bloqueado, controle de senha acessível. Não exibir barra inferior.

### 5.2 Cadastro

**Composição:** mesmo `AuthLayout` com nome, e-mail, senha, confirmação, botão amarelo **Cadastrar** e retorno ao login. **Adicionar os aceites obrigatórios dos termos e política de privacidade**, ainda que omitidos do mockup. Perfil nasce **privado**.

**RF PRD mais recente:** confirmação de e-mail obrigatória para conta local; provedores com e-mail já validado podem dispensar segunda confirmação. **Divergência com decisão anterior:** “não obrigatória no MVP” ainda deve ser formalmente conciliada; não implementar bypass oculto. **PENDENTE:** copy e desenho do estado de confirmação; regras de validação de senha/nome, tratamento de conta existente, sessão após cadastro e vínculo OAuth.

### 5.3 Recuperação, redefinição e retorno

**Tela ilustrada:** e-mail, botão **Enviar link de recuperação**, link Voltar para o login. **Complementos necessários (não ilustrados):** estado de solicitação recebida; tela de nova senha/confirmar nova senha; expiração/uso único; sucesso e retorno ao login. Texto de resultado não deve revelar existência da conta. Provedores exclusivamente externos devem ter orientação apropriada, sem inventar recuperação local.

### 5.4 Estados obrigatórios

Campos inválidos; credencial incorreta; OAuth indisponível/cancelado; cadastro em andamento; senha diferente da confirmação; aceite pendente; confirmação de e-mail exigida; token de recuperação inválido/expirado; rede indisponível; usuário já logado. **PENDENTE** o texto final e políticas de sessão.

---

## 6. Home — “Perto de você”

**Referência:** [`home-mobile-dark.png`](references/home-mobile-dark.png). **Estado:** VA da estrutura.

### 6.1 Estrutura visual de cima para baixo

1. **Cabeçalho**: logo **somente circular** em amarelo/preto, sem wordmark ao lado; no topo direita **não** inserir sino/avatar. Paisagem noturna com **viaduto urbano fictício**, edifícios e luzes quentes ao fundo; sem comprometer saudação.
2. **Saudação**: nome do usuário e frase curta comunitária (texto da referência é ilustrativo).
3. **Localização**: faixa arredondada com localização/cidade e raio de **até 3 km**. Não permitir alteração de limite além das regras do PRD. Se o seletor for de distância, propor faixas de até 3 km.
4. **Mapa resumido**: fundo cartográfico azul-marinho, pins amarelos e posição do usuário em azul; CTA **Ver no mapa**.
5. **Seção “Perto de você”**: título, indicação de atualização **somente se baseada em dado real**, atalho **Ver todos** e feed vertical.
6. **Cards compactos**: foto pública aprovada à esquerda, categoria amarela, status textual contornado, título, endereço/distância/relatos, menu de ações quando pertinente.
7. **Barra inferior**: Início / Mapa / Denunciar / Ocorrências / Perfil; Denunciar em destaque circular amarelo.

### 6.2 Campos/regras dos cards e divergência com PRD

**RF do PRD:** cada card contém **mini mapa focado no local**, rua/pin, categoria, endereço, bairro, distância, quantidade de relatos, status, nome do canal/responsável, ação **Eu também vi**, abrir detalhes e abrir site oficial. A referência visual compacta **não mostra todos esses elementos** e ainda traz foto como destaque.

**Tratamento proposto:** manter o card compacto como resumo; usar expansão/painel acessível para mini mapa e ações secundárias ou card de detalhe. **PENDENTE** validar como atender ao requisito explícito de mini mapa *por card* sem perder densidade; não afirmar que o mapa global no topo o substitui automaticamente.

### 6.3 Ordenação, filtros e navegação

**RF:** mostrar ocorrências dentro de até 3 km; ordem da **mais próxima** para a mais distante e, em distâncias iguais/muito próximas, **última atualização mais recente**; filtros por categoria, distância e status. Distâncias propostas: 500 m, 1 km, 2 km, 3 km. `Ver todos` pode expandir a lista/abrir visualização paginada da Home; o comportamento exato é **PENDENTE**.

**Interações:** tocar card fora dos botões → detalhes; Eu também vi → confirmar se autorizado; link oficial → abrir site real em nova aba e manter app aberto. Botão Ver no mapa → mapa exploratório, conforme escopo a formalizar.

### 6.4 Estado sem localização / sem dados

Pedir permissão no momento necessário e explicar a razão; se negada, comunicar que confirmações/denúncias presenciais não podem ser realizadas. Não inventar “você está a X metros” sem coordenadas válidas. Sem resultados: distinguir raio vazio de filtro restritivo. Falha no mapa não bloqueia leitura da lista. Em offline, dados já carregados podem aparecer em **somente leitura**, com aviso de desatualização.

---

## 7. Mapa de ocorrências — exploração

**Referência:** [`mapa-ocorrencias-mobile.png`](references/mapa-ocorrencias-mobile.png). **Estado:** direção visual bem recebida; **escopo funcional e acesso no MVP precisam ser registrados como decisão**.

**Layout:** título “Mapa de ocorrências”; campo de busca de endereço; filtros/chips por categoria e status; mapa escuro ocupando maior parte da tela; controles de localização/zoom/camadas, se suportados; pins amarelos com símbolo de categoria; posição do usuário em azul; **bottom sheet** com foto, categoria, status, título, endereço, distância, número de relatos e ação de abrir B3.

**Fluxo:** Home → Ver no mapa, ou barra inferior → Mapa → seleciona pin → abre preview → toca card → detalhes. Mover/zoom não altera automaticamente a regra de até 3 km para ações presenciais. Mostrar itens publicados/visíveis conforme estado e permissões, **nunca pendências que o PRD impede de exibir publicamente**.

**Acessibilidade:** fornecer lista textual alternativa dos pins e buscas, foco e acionamento por teclado, zoom controlável, descrição do marcador e aviso de mapa indisponível. Tratar muitos pins de forma performática sem carregar a cidade inteira de uma só vez.

**Separação obrigatória:** o **mapa para escolher o ponto de uma nova denúncia** é exigido no PRD; o **mapa de exploração de ocorrências** é uma escolha adicional da experiência aprovada visualmente, mas requer ajuste formal de escopo para o MVP.

---

## 8. B3 — Detalhes da ocorrência

**Referências:** [`detalhes-ocorrencia-base.png`](references/detalhes-ocorrencia-base.png) e [`detalhes-ocorrencia-acompanhamento-futuro.png`](references/detalhes-ocorrencia-acompanhamento-futuro.png). **Estado:** estrutura base VA; bloco de acompanhamento oficial visualmente acolhido, porém **FUTURO na parte de respostas/prazos de órgãos**.

### 8.1 Composição da tela

1. Cabeçalho interno com Voltar e marca compacta, paisagem urbana discreta.
2. Foto **pública aprovada** do problema em destaque; não assumir carrossel de 3 imagens: PRD exige **exatamente uma foto no relato inicial**. Se houver múltiplas evidências lícitas ao longo do histórico, seu tratamento é uma **decisão separada**.
3. Categoria, selo de status, título, descrição, endereço completo/bairro e distância somente quando válida.
4. **Bloco de acompanhamento** no espaço antes ocupado por mini mapa na versão de layout mais recente, com status atual, eventos e última atualização. **No MVP** exibir somente eventos internos reais; **prazos/respostas oficiais são FUTURO** e o bloco precisa ter estado “Sem atualização oficial verificada”.
5. Contadores de relatos e confirmações de resolução, apenas quando os dados existirem. “Visualizações” é detalhe ilustrado, não requisito funcional.
6. Ações: **Eu também vi**, **Este problema foi resolvido**, reportar falsidade/incorreção, acompanhar ocorrência, encaminhar ao canal oficial, compartilhar (compartilhar é opção de UX e depende de regra/URL pública).
7. Abas/áreas: **Informações/Detalhes**, **Relatos da comunidade**, **Histórico**. A ordem gráfica pode variar, mas os três tipos de conteúdo devem estar acessíveis.
8. Card oficial: nome do canal/responsável, instruções verificadas, botão para abrir URL oficial em nova aba. Sem canal: **“Canal oficial ainda não cadastrado”**.

### 8.2 Fluxos de interação e permissões

- Toque em card da Home/Mapa/Minhas → B3 → ações habilitadas de acordo com estado e conta.
- **Eu também vi:** só usuário ativo, autenticado, não banido, dentro de até 3 km e ainda não participante; depois vira **“Você também viu”**; texto opcional; sem foto. Pelo PRD atual, remoção da confirmação até **12 horas após confirmar**, depois bloqueada.
- **Resolução comunitária:** uma confirmação única por usuário válido no raio; resolução automática somente após **mais de 10.000 confirmações**; permitir remover voto antes do status ser resolvido pelo limite.
- **Reportar ocorrência falsa/incorreta:** menu/modal com motivo definido no PRD, envio para moderação; não implica remoção imediata.
- **Histórico:** ordenar eventos temporalmente, com indicação de origem (sistema/moderação/comunidade/órgão verificado). Relatos podem ser anônimos; não mostrar autor real sem autorização expressa.
- **Admin/moderador:** ações extras apenas em contexto autorizado, não torná-las disponíveis para cidadão.

### 8.3 Acompanhamento oficial — restrição de MVP

O exemplo visual exibe “órgão responsável”, “prazo até dia X”, “encaminhada” e progresso de atendimento. **O PRD (§28) classifica acompanhamento transparente de respostas oficiais, prazos e execução como FUTURO.** No MVP, exibir encaminhamento assistido ao site oficial, **sem afirmar protocolo, aceitação, resposta, prazo ou conclusão** sem evidência verificável. É permitido usar **linha do tempo das mudanças internas de status reais**, identificando fonte e data.

### 8.4 Estados específicos

Pendente de moderação, validada, encaminhada, em análise, em resolução, resolvida, rejeitada, duplicada, arquivada e reabertura quando definida. Algumas só aparecem ao criador/equipe. Foto indisponível, endereço parcial, sem relatos públicos, sem canal, status desconhecido, conta banida (somente leitura), loading e erro devem ter tratamento.

---

## 9. Criar denúncia — fluxo de quatro etapas

**Referências:** [`denuncia-quatro-etapas.png`](references/denuncia-quatro-etapas.png) e [`denuncia-localizacao-detalhe.png`](references/denuncia-localizacao-detalhe.png). **Estado:** sequência e linguagem visual VA.

**Padrão:** `FormStepper` com etapas numeradas **1 Localização / 2 Verificação / 3 Detalhes / 4 Confirmação**. Usar amarelo no passo atual, concluído com ícone + rótulo e passos seguintes discretos; não depender só de cor. Botão Voltar preserva o que já foi preenchido; envio só ao final. Fluxo linear, acessível e sem rolagem lateral.

### 9.1 Passo 1 — Localização

**Tela:** título **Fazer denúncia**, mapa completo para escolher ponto, usuário marcado em azul, pin selecionado em amarelo, busca de endereço/região, localização atual, zoom, painel “Local selecionado” com endereço/bairro, ação Editar e botão Continuar.

**RF:** GPS/localização deve estar ativa; usuário dentro do município de São Paulo; local do problema deve estar a **até 3 km do usuário**. Fora dessas condições → bloquear avanço/envio, explicar motivo e permitir recuperar permissão/tentar novamente. Não obter distância por texto do endereço; usar coordenadas validadas.

### 9.2 Passo 2 — Verificação de possíveis duplicidades

**Tela:** lista/card de possíveis problemas com foto pública (se houver), título, categoria, status, endereço, distância do ponto marcado e acesso aos detalhes. Pergunta clara: “É o mesmo problema?” com duas ações: **Sim, é o mesmo** (confirmar ocorrência existente) ou **Não, é outro problema** (prosseguir).

**RF:** sugestão de duplicidade para ocorrência **ativa, da mesma categoria, a até 100 metros**. A detecção **não bloqueia automaticamente** a criação; moderador decide duplicidade. O mockup apresenta duplicidade já na etapa 2 antes do preenchimento de categoria; **PENDENTE de UX/técnica:** como coletar categoria antes de consultar (ex.: microseleção na etapa 2) ou quando executar rechecagem depois do preenchimento. Não ignorar critério de categoria para parecer que a comparação já é conclusiva.

**Se nenhuma sugestão:** mostrar estado “Não encontramos ocorrência semelhante” e Continuar. **Se o mesmo problema:** encaminhar para B3/Eu também vi e não criar uma segunda ocorrência automaticamente. **Se distinto:** permitir prosseguir e registrar decisão para moderação.

### 9.3 Passo 3 — Detalhes e evidência

**Campos PRD:** categoria; subcategoria quando existir (obrigatória ou opcional conforme a categoria); título; descrição; **exatamente 1 foto obrigatória** da ocorrência; data aproximada de observação somente se adotada. O mockup exibe duas fotos em algumas prévias; **não implementar múltiplo upload** nem vídeo no MVP. Foto pode ser adicionada, substituída ou removida antes do envio, desde que exista uma válida ao confirmar.

**UX:** mostrar regras de foto/privacidade, contagem de caracteres somente se limite estiver especificado, preview de imagem e erro de arquivo. Validar extensão, MIME e tamanho com regra técnica existente, sem inventar limite no design. Não enviar rosto/placa identificável à área pública sem moderação.

### 9.4 Passo 4 — Confirmação e resultado

**Tela:** resultado de envio bem-sucedido, resumo do que foi registrado, status **PENDENTE_VALIDACAO**, próximos passos e ações **Ver minha ocorrência / Registrar outra denúncia / Voltar à Home**.

**RF:** envio entra na fila de moderação e **não aparece no mapa principal antes de validação**. Não prometer análise em “2 dias úteis” nem inventar protocolo `VR-2025-...`; exibir identificador **somente se de fato existir e vier da API**. Se falhar, manter dados e oferecer nova tentativa segura, sem duplicar submissões.

### 9.5 Critérios de aceite do fluxo

- [ ] Quatro passos com rótulos e progresso acessíveis.
- [ ] 3 km e município de São Paulo validados em ações de escrita.
- [ ] Verificação por **mesma categoria + até 100 m + ocorrência ativa**; não bloqueia automaticamente.
- [ ] Categoria/subcategoria conforme cadastro; título, descrição e exatamente uma foto.
- [ ] Confirmação marca **PENDENTE_VALIDACAO** e não sugere publicação instantânea.
- [ ] Sem prazo/protocolo fictícios.
- [ ] Falhas, retorno e refresh não perdem dados sem aviso, respeitando privacidade/sessão.

---

## 10. Minhas ocorrências e participação

**Referência:** [`minhas-ocorrencias-acompanhamento.png`](references/minhas-ocorrencias-acompanhamento.png). **Estado:** direção visual RI bem recebida.

### 10.1 Lista

A aba raiz **Ocorrências** oferece dois filtros de tipo: **Criadas por mim** e **Eu também vi**. Cada item contém categoria, título, endereço/bairro, status, quantidade de relatos, data de criação e atualização. Filtros do PRD: participação, status, categoria e período. Ordenação final além dessas regras é **PENDENTE**; não assumir “últimas primeiro” como contrato se não documentado.

### 10.2 Detalhe e histórico

Toque em item → reutilizar B3 com ações próprias e acesso à aba Histórico. O mockup propõe cartão de prazo/órgão e notificações: exibir **somente dados reais compatíveis com o MVP**; respostas e prazos oficiais permanecem FUTURO. O histórico real pode conter relato criado, validação, atualização de status, resolução/reabertura e ações de moderação visíveis.

### 10.3 Editar/remover relato inicial

**RF:** criador pode editar em até **12 horas** se ainda não validado: título, descrição, categoria, subcategoria e foto. **Localização não pode ser alterada.** A exclusão, também em até 12 horas antes da validação, pode arquivar/remover quando não há outros relatos; se houver outros cidadãos participantes, preservar a ocorrência e remover/anonimizar a participação conforme PRD. O bloqueio pode ocorrer **antes de 12 horas** após validação.

### 10.4 Estados

Sem participações, filtros sem resultados, relato pendente, relato validado, ação bloqueada por tempo/status, histórico vazio, erro de consulta, offline somente leitura. Exibir razão do bloqueio por texto, não apenas desabilitar botão silenciosamente.

---

## 11. Social e Comunidade

**Referência:** [`social-tres-telas.png`](references/social-tres-telas.png). **Estado:** RI, não aprovado em todos os controles. O usuário optou por **não aprofundar o design Social neste momento**; preservar o módulo no PRD e a referência como base.

### 11.1 Feed Social

Feed cronológico, **posts mais recentes primeiro**, com autor público, data, texto, imagem opcional, curtidas, comentários, vínculo opcional a ocorrência e ação de reportar conteúdo. **Não implementar** feed “Em alta”, algoritmo de recomendação ou aba “Minha rede” apenas porque aparecem na ilustração. A entrada para Social após a troca da navegação inferior por Mapa é **PENDENTE**.

### 11.2 Criar publicação

**RF:** somente usuário com **perfil público** pode publicar; usuário privado pode consumir/interagir, mas não criar post. Campo de texto até **1.000 caracteres**, **1 imagem opcional**, vínculo opcional com ocorrência existente. Vídeo fora do MVP. A imagem gerada mostra múltiplas fotos/vídeos e seleção de “visibilidade privada do post”; **não são requisitos aprovados**. Não oferecer postagem privada isolada sem nova decisão de produto.

### 11.3 Publicação e comentários

Exibir post e lista de comentários. Comentários/respostas até **500 caracteres**, **um nível de resposta**; autor pode editar/excluir seu comentário; curtida única por usuário, reversível. Reportar post/comentário envia denúncia à moderação. Perfil privado pode seguir perfis públicos; usuário banido apenas visualiza. Não expor identidade privada em relatos por herança do Social.

### 11.4 Perfil público de outro usuário

Visualizar apenas dados e posts permitidos; seguir/deixar de seguir se autorizado (o PRD mais recente ainda lista “deixar de seguir” como pendência específica). Não tratar mapa ou perfil privado como público automaticamente.

---

## 12. Perfil, privacidade e notificações

**Referência:** [`perfil-e-home-nav-mapa.png`](references/perfil-e-home-nav-mapa.png). **Estado:** RI da organização.

### 12.1 Tela Meu Perfil

**Layout proposto:** topo discreto com identidade visual, avatar **opcional** e nome, dados de conta/cidade em nível seguro, cartões/resumo de participação quando houver métricas reais, menu vertical.

**Entradas principais:** Meus dados; Notificações; Privacidade; Configurações; Ajuda e suporte; Sair da conta; **Acessar moderação** (apenas quando papel permitir). O item “Cidadão Ativo”, estrelas, pontos e conquistas ilustrados **não foram aprovados como gamificação do MVP** e devem ficar como proposta futura. Foto/avatar, apelido e telefone aparecem em exemplos, mas **não constam necessariamente como campos obrigatórios do PRD**.

### 12.2 Privacidade

**RF:** perfil começa **privado**; perfil público permite página pública, posts e seguidores. Quando público vira privado, posts deixam de aparecer; ao voltar a público, posts antigos reaparecem, exceto removidos pelo usuário/moderação. Preferência de exibição do nome em relatos é separada do acesso ao Social. Exibir confirmação quando mudança impactar exposição pública.

### 12.3 Notificações

Eventos PRD: validação, rejeição, duplicidade, mudança de status, resolução, reabertura, moderação, seguidores, likes, comentários e respostas. Canais: internas, e-mail quando apropriado, push PWA **opt-in**. Preferência para desligar notificações sociais sem bloquear as críticas da própria ocorrência. Acesso final pela interface de Perfil ainda é **PROPOSTA**, apesar de coerente com a remoção do sino da Home.

### 12.4 Segurança e sessão

Alteração de dados, recuperação, saída da conta e controle de sessão devem seguir requisitos técnicos existentes. Não incluir telefone, reputação, conquistas ou dados de localização contínua como obrigatórios sem PRD. A localização em perfil pode representar apenas cidade/região autodeclarada, não histórico de deslocamento.

---

## 13. Área de Moderação — arquitetura de interação

**Referências:** [`moderacao-a-central.png`](references/moderacao-a-central.png), [`moderacao-b-integrada.png`](references/moderacao-b-integrada.png) e [`moderacao-primeiro-fluxo.png`](references/moderacao-primeiro-fluxo.png). **Estado:** ambas alternativas ainda **PROPOSTAS**. O último pedido foi criar **duas** versões distintas para comparação; **nenhuma foi formalmente escolhida**.

### 13.1 Entrada e saída

- No Perfil, apresentar **“Acessar moderação”** somente para **moderador ou administrador** (padrão de acesso visual proposto pelo usuário).
- Ao entrar, exibir título/identidade de moderação, controles de triagem e navegação contextual. **É troca de contexto, não troca de login, papel ou permissões.**
- Deve existir ação permanente **“Voltar ao app”** ou **“Área cidadã”**, com retorno ao Perfil ou última tela do cidadão conforme implementação definida.
- A área de moderação **não reutiliza indiscriminadamente** a barra de cinco entradas para executar ações administrativas: pode ter sua própria navegação; não deixar espaço para confundir botões.
- Autorização sempre no backend/RBAC, independentemente de o botão estar oculto.

### 13.2 Alternativa A — Central de Moderação (PROPOSTA)

**Fluxo:** Perfil → Acessar moderação → **Central** (cards-resumo e menus) → Fila / Alertas / Social → Análise → Diálogo de decisão → Central → Voltar ao app.

**Telas:**
1. Perfil com entrada condicional.
2. Central com cards: fila, alertas e Social; contadores somente quando fornecidos.
3. Fila de ocorrências com filtros, classificação e prévia de cada registro.
4. Análise detalhada (foto/evidências, mapa, relatos, possíveis duplicatas, histórico, status).
5. Modal/folha de decisão com justificativa e confirmação.
6. Alertas e Moderação Social acessados por itens da central.

**Forças:** mudança de contexto muito nítida; fácil separar responsabilidades e ampliar módulos; menu único de retorno. **Custos:** há um passo a mais entre Perfil e a fila; precisa de dashboard útil, não só links decorativos.

### 13.3 Alternativa B — Moderação integrada por abas (PROPOSTA)

**Fluxo:** Perfil → Acessar moderação → **Fila inicial** com abas Ocorrências / Alertas / Social → Análise → Decisão → retorno; botão **Área cidadã** presente no shell.

**Forças:** acesso direto ao trabalho; troca rápida de filas. **Custos:** tela pode ficar densa com abas, filtros, prioridade e buscas; exige cuidado com acessibilidade, rolagem e hierarquia.

### 13.4 Decisão de navegação pendente

**Não implementar A e B simultaneamente.** Proposta híbrida é viável (central com abas internas) mas também precisa de aprovação explícita. Design system e componentes podem ser preparados independentemente da decisão, usando `ModeratorShell`, `ModerationQueue`, `ModerationItem` e `ModerationDecisionDialog` desacoplados.

---

## 14. Moderação — telas e operações comuns às alternativas

### 14.1 Fila de ocorrências

**RF:** exibir ocorrências pendentes, denunciadas, suspeitas, possíveis duplicadas e aguardando análise. Card/linha: foto/evidência permitida, título, categoria, local, status, relatos, motivo da análise, data e ação de abrir análise. Filtros propostos por tipo, status, prioridade e data. Não considerar ordenação “mais recentes” definitiva sem regra. **10 relatos de cidadãos diferentes geram alerta prioritário, sem validação automática.**

### 14.2 Análise de ocorrência

**RF:** dados completos do problema, foto/evidências, mapa, endereço, categoria, título, descrição, relatos, histórico, candidatos a duplicata, dados de moderação. Ações segundo estado/permissão:

- Validar/publicar; rejeitar; marcar como duplicada (e vincular à existente quando definido).
- Editar título, descrição e categoria.
- Selecionar ou substituir **foto pública**. Evidências privadas não precisam ser públicas.
- Remover pin; marcar como resolvida; reabrir.
- Registrar motivo/justificativa para ações relevantes, gerar auditoria.

**UI sugerida:** cabeçalho com dados e imagem pública/privada identificadas; blocos Informações / Evidências / Possíveis duplicadas / Histórico; botão “Tomar decisão” abre folha/modal que resume a ação, impacto e pede justificativa. **Não concentrar todas as ações perigosas em botões amarelos iguais.**

### 14.3 Alertas de moderação

Agrupar prioridades, suspeitas, falsidade, reabertura e posts/comentários reportados. Os chips de nível de alerta devem ter **rótulo textual e origem explicada**. Regras obrigatórias:

- `10+` relatos únicos geram alerta de prioridade, **não validação**.
- `1.000` relatos novos de um problema resolvido geram **alerta emergencial**, **não reabertura automática**.
- A equipe decide; todo resultado relevante fica no histórico.

**Acesso:** alerta → análise da ocorrência/post com o contexto já filtrado; voltar mantém filtro e posição.

### 14.4 Moderação Social

Lista de denúncias de posts e comentários, motivos (spam, assédio, dados pessoais, conteúdo enganoso etc.), contexto do conteúdo, autor visível conforme permissão e data. Ações: **ocultar** ou **remover conteúdo** com motivo e auditoria. **Sanções/medidas sobre contas são exclusivas do administrador**. Não expor dados privados desnecessários a revisores.

### 14.5 Confirmação e justificativa (padrão transversal)

**Estrutura sugerida para `ModerationDecisionDialog`:**

```text
Ação: [Validar] / [Rejeitar] / [Duplicar] / [Resolver] / [...]
Resumo do item e do impacto
Campo “Justificativa” (quando exigida)
Aviso caso haja publicação, remoção de pin ou alteração irreversível
[Cancelar]                         [Confirmar ação]
```

- Justificativa deve ser exigida **conforme ação e regras técnicas/PRD**, sem inventar limite de caracteres.
- Mostrar carregando, erro recuperável, confirmação de sucesso e auditoria.
- Para duplicidade, exibir referência à ocorrência principal; para resolução/reabertura, mostrar status atual e novo.
- Botões destrutivos e confirmatórios têm estilos distintos. Operações protegidas contra envio duplo.

### 14.6 Moderador versus administrador

**Moderador:** análise e decisão, ajuste de dados da ocorrência, foto pública, pin, resolução, reabertura e moderação de conteúdo conforme PRD.

**Administrador:** além disso, usuários e moderadores (promover/remover função, banir/desbanir), gestão de categorias/subcategorias, órgãos/canais, parâmetros, logs, indicadores e manutenção de ocorrências. Não dar a moderador uma ação exclusiva do admin por aparecer em mockup.

---

## 15. Administração — telas necessárias, mas ainda sem protótipos aprovados

**Escopo funcional do PRD, layout de design PENDENTE.** Uma área administrativa pode partir do `ModeratorShell` com seções adicionais visíveis só para admin. **Não houve aprovação de dashboard administrativo específico** na conversa.

| Tela | Informação/ação do PRD | Direção visual proposta |
|---|---|---|
| Painel administrativo | Indicadores agregados de usuários, ocorrências, status, categoria, bairro, pendências, tempo de validação, Social e canais oficiais | Resumo compacto por cartões; filtros; tabela/lista responsiva. |
| Gestão de usuários e moderadores | Buscar, visualizar, banir, desbanir, promover/remover moderador | Lista pesquisável + detalhe + confirmação de mudança de papel. |
| Gestão de ocorrências | Criar/editar/validar/rejeitar/arquivar/restaurar/resolver/reabrir/remover pin | Reutilizar análise com ações adicionais. |
| Categorias/subcategorias | Listar, cadastrar, ativar/desativar e definir obrigatoriedade | Tabela responsiva + formulário. |
| Órgãos/canais oficiais | Nome, tipo, área, site, e-mail, telefone, URL de denúncia e instruções | Formulário de vínculo categoria → responsável; validação de URLs. |
| Auditoria e registros | Histórico administrativo, moderação, integrações, autenticações importantes e erros | Lista temporal pesquisável; dados sensíveis minimizados. |
| Parâmetros | Limite de distância, limiares, prazos e cidade atendida conforme PRD | Formulário protegido por confirmação e auditoria. |

**Segurança/privacidade:** indicadores agregados, sem rastreamento individual desnecessário. Não mostrar “controle de órgãos públicos” como conta externa com acesso próprio: o PRD não prevê login para órgãos no MVP.

---

## 16. Estados de UI, cópia e acessibilidade transversal

### 16.1 Estados visuais e mensagens

Cada tela deve mapear **inicial, carregando, sucesso, vazio, erro, offline, permissão negada, conta bloqueada e sem dados** quando aplicável. Não reaproveitar tela de sucesso gerada por imagem para um erro técnico. Os termos abaixo são orientativos:

| Contexto | Exemplo de comportamento/cópia propostos |
|---|---|
| Localização desativada | “Ative a localização para registrar ou confirmar problemas próximos.” + ação Tentar novamente. |
| Fora de São Paulo | “O Voz da Rua atende inicialmente o município de São Paulo.” |
| Distância >3 km | “Essa ação exige que você esteja a até 3 km do problema.” |
| Home sem ocorrências | “Não encontramos ocorrências nessa região com os filtros atuais.” |
| Mapa indisponível | Exibir endereço/lista textual e erro de mapa; nunca bloquear leitura. |
| Conta banida | Mensagem explicando modo somente leitura e ações indisponíveis. |
| Duplicidade sugerida | “Encontramos um problema semelhante. É a mesma situação?” |
| Foto inválida | Indicar critério de arquivo não atendido, sem ocultar erro. |
| Envio concluído | “Sua denúncia foi recebida e aguarda validação.” |
| Canal oficial ausente | “Canal oficial ainda não cadastrado.” |
| Sem resposta oficial | Não mostrar prazo fictício; “Ainda não há atualização oficial verificada.” quando seção futura existir. |
| Moderação já processada | “Esta ocorrência foi atualizada. Revise o estado antes de decidir.” |

### 16.2 Acessibilidade

- Semântica HTML e navegação por teclado, inclusive mapas e diálogos.
- Labels reais nos campos; erros associados por identificadores; estados anunciados sem depender de cor.
- Contraste mínimo a validar conforme WCAG; aumentar textos sem cortes, zoom, alto contraste quando possível.
- Áreas de toque adequadas, elementos com foco visível, descrição de botões de ícone.
- Diálogos com foco controlado e retorno ao elemento anterior; confirmação não pode ser fechada acidentalmente perdendo dados.
- Lista alternativa para mapa; descrição textual dos pins e status; ordenação de leitura lógica.
- Ilustração decorativa com alt vazio; foto informativa com texto alternativo apropriado sem expor dados pessoais.
- `prefers-reduced-motion` para transições e animações.

### 16.3 PWA, dados e privacidade

- PWA instalável mas com acesso via navegador; desktop e tablet adaptados.
- Sem conexão, permitir apenas acesso a dados previamente carregados em **somente leitura**; sem cadastro offline de denúncia ou fila de escrita no MVP.
- Não armazenar posição do usuário continuamente nem histórico de deslocamento; armazenar coordenadas da ocorrência e somente o estritamente necessário à ação.
- Carregar dados geográficos paginados/filtrados; não carregar toda São Paulo simultaneamente.
- Evitar guardar senha, tokens, segredos ou dados pessoais excessivos em logs.
- Links a órgãos são externos; informar transição e abrir em nova aba quando aplicável.

---

## 17. Matriz de acesso e decisões de navegação

| Recurso | Visitante | Cidadão ativo | Banido | Moderador | Admin |
|---|---|---|---|---|---|
| Auth (login/cadastro/recuperação) | Sim | Sessão conforme política | Sessão conforme política | Sessão conforme política | Sessão conforme política |
| Home, mapa, detalhe | Não | Sim | Sim (leitura) | Sim | Sim |
| Criar denúncia | Não | Sim, regras de raio/cidade | Não | Sim, se autorizado | Sim |
| Eu também vi / votar resolução | Não | Sim, regras e unicidade | Não | Conforme conta e regras | Conforme conta e regras |
| Minhas ocorrências | Não | Sim | Leitura de histórico permitido | Sim | Sim |
| Ler Social / perfis públicos | Não | Sim | Sim (leitura) | Sim | Sim |
| Criar post | Não | Só perfil público | Não | Só se atender regra de perfil | Só se atender regra de perfil |
| Curtir/comentar/seguir | Não | Sim, regras | Não | Conforme regras | Conforme regras |
| Área de moderação | Não | Não | Não* | Sim | Sim |
| Administração de usuários/canais/indicadores | Não | Não | Não | Não | Sim |

`*` **PENDENTE TÉCNICO:** se uma conta com função de moderação também estiver banida, tratar combinação de estados no backend com regra explícita, sem inferir da interface.

---

## 18. Registro de decisões conflitantes ou pendentes

> A tabela prioriza pontos que impedem implementação correta. Cada item tem recomendação para discussão, **não** uma decisão automaticamente aprovada.

| ID | Prioridade | Questão | Fonte/impacto | Caminho sugerido |
|---|---|---|---|---|
| P01 | Alta | **Social saiu da barra:** onde ficará acessível? | PRD mantém Social, mas navegação visual virou Início/Mapa/Denunciar/Ocorrências/Perfil | Definir atalho claro no Perfil ou Home; não abandonar módulo. |
| P02 | Alta | **Mapa de exploração** entra no MVP? | PRD exigia mapa completo para *fazer denúncia*; barra passou a ter Mapa | Formalizar mudança de escopo/PRD. |
| P03 | Alta | **Moderação A, B ou híbrida?** | Foram criadas duas propostas, nenhuma selecionada | Validar shell e retorno ao cidadão antes de codificar. |
| P04 | Alta | **Confirmação de e-mail** no cadastro local | Conversa anterior dispensava; PRD mais recente exige | Definir fonte de verdade; hoje não omitir confirmação sem decisão. |
| P05 | Alta | **Duplicidade na etapa 2** sem categoria escolhida | Regra exige mesma categoria + 100 m | Definir categoria preliminar/checagem dupla. |
| P06 | Alta | **Mini mapa por card da Home** versus visual com foto | PRD exige mini mapa; mockup o substitui visualmente por foto | Definir expansão/organização que atenda ambos. |
| P07 | Alta | **Acompanhamento oficial e prazos** | Mockup detalha cronograma; PRD §28 fora MVP | Só histórico interno real no MVP, sem prazos inventados. |
| P08 | Média | **Barra inferior** em etapas/detalhes | Mockups variam; risco de poluição visual e teclado | Padronizar shell por contexto. |
| P09 | Média | **Foto e carrossel** | Mockups mostram 3 fotos; nova denúncia exige 1 | Upload 1 por relato; visualização múltipla só com evidências adicionais aprovadas. |
| P10 | Média | Entrada de **Notificações** sem sino na Home | UI removeu sino; PRD mantém módulo | Propor Perfil > Notificações e validar. |
| P11 | Média | **Conquistas/gamificação** do Perfil | Mockup inclui “Cidadão Ativo”, pontos e estrelas | FUTURO até definição de regra. |
| P12 | Média | Campos extras do Perfil | Mockup mostra avatar/telefone/@ | Usar apenas campos previstos; extras exigem PRD. |
| P13 | Média | Tela de verificar e-mail e redefinir senha | PRD inclui, mas não há mockups finais | Criar referência visual antes de implementar os estados. |
| P14 | Média | Códigos de cor/ícones finais | Paleta conceitual aprovada, não hex final | Validar contraste em aparelho e tokens semânticos. |
| P15 | Média | Status técnico de reabertura | PRD deixa aberto | Exibir histórico sem inventar máquina de estados. |
| P16 | Média | Interface administrativa desktop | PWA mobile-first; administração ainda sem layout aprovado | Reaproveitar padrões e adaptar responsivamente. |
| P17 | Média | Endereço/identidade de relatos públicos | PRD preserva privacidade por padrão | Anonimizar participantes salvo opt-in de exposição. |
| P18 | Média | Local final do arquivo | Projeto pode usar `docs/DESIGN.md` ou `docs/frontend/Desing-rules.md` | Codex deve localizar e evitar cópia duplicada. |

---

## 19. Checklist de implementação por tela

### Base e autenticação

- [ ] Sora carregada como fonte real, com fallback; componentes não dependem de tipografia renderizada em imagens.
- [ ] Tema Dark padrão e tokens centralizados; Light Mode preparado sem obrigação de entrega agora.
- [ ] Formulários com labels, teclado, foco, erro, loading e prevenção de envios repetidos.
- [ ] Login local + Google/GitHub e acesso a cadastro/recuperação.
- [ ] Cadastro inclui termos e privacidade, perfil privado; resolver confirmação de e-mail.
- [ ] Recuperação tem link/estado de sucesso e redefinição, sem vazamento de existência de conta.

### Home e mapa

- [ ] Home usa logo circular isolado, fundo urbano noturno e sem sino/avatar no topo.
- [ ] Mapa resumido, feed de cards e barra com **Mapa na segunda posição**.
- [ ] Filtros de Home categoria/distância/status e ordenação por proximidade.
- [ ] Cards exibem dados obrigatórios do PRD, incluindo o mini mapa por ocorrência ou solução aprovada equivalente.
- [ ] Mapa de exploração tem pins, posição do usuário, prévia e lista acessível; escopo confirmado.
- [ ] Todas as distâncias são verificadas com localização válida; sem inventar atualização.

### Detalhes e denúncia

- [ ] B3 apresenta foto pública aprovada, categoria, status, descrição, local, relatos, histórico e canal oficial.
- [ ] B3 permite ação “Eu também vi” apenas quando elegível, e mostra reversão nas primeiras 12 horas.
- [ ] B3 expõe resolução/reportar falsidade/acompanhamento conforme status, não permanentemente.
- [ ] Bloco de progresso não atribui prazos oficiais inexistentes nem protocolo fictício.
- [ ] Denúncia tem quatro etapas e validação de SP/3 km.
- [ ] Verificação de duplicidade segue ativa + categoria + 100 m e permite continuar se for diferente.
- [ ] Detalhes exigem exatamente uma foto; sem vídeo no MVP.
- [ ] Conclusão comunica pendência de moderação e encaminha às próprias ocorrências.

### Participação, Social e conta

- [ ] Minhas ocorrências separa criadas/confirmadas; filtros e bloqueio de edição/exclusão após prazo/validação.
- [ ] Social continua disponível por entrada definida, com feed cronológico e regras de perfil público.
- [ ] Post permite texto até 1.000 caracteres e uma imagem opcional; comentário até 500 e um nível de resposta.
- [ ] Privacidade por padrão; troca para privado oculta posts e é reversível conforme PRD.
- [ ] Perfil não implementa pontos/conquistas sem regra; notificações têm preferências separadas.

### Moderação e administração

- [ ] Entrada “Acessar moderação” restrita a papéis autorizados e com retorno à área cidadã.
- [ ] Escolha A/B de navegação confirmada antes de implementar shell definitivo.
- [ ] Fila contém pendentes, suspeitas, denunciadas e duplicatas potenciais, com motivo e prioridade.
- [ ] Análise contém mapa, evidências, relatos, histórico, duplicatas e decisões condicionadas a status.
- [ ] Modal de confirmação apresenta impacto, justificativa quando exigida e evita duplicidade de ação.
- [ ] Alertas 10+ e 1.000 distintos **não** validam/reabrem automaticamente.
- [ ] Moderação Social oculta/remove conteúdo com motivo; medidas sobre conta são de admin.
- [ ] Admin possui acesso a usuários, categorias, canais, parâmetros, logs e indicadores agregados com RBAC.

### Qualidade transversal

- [ ] Estados de loading/empty/error/offline/sem localização/permissão negada cobertos.
- [ ] WCAG, contraste, foco, leitura por teclado e acessibilidade de mapas/dialogs verificados.
- [ ] HTML/CSS real em vez de screenshot como tela; imagens só como ativos de identidade/foto.
- [ ] Mobile, tablet, desktop e PWA com safe area/teclado testados.
- [ ] Segurança e privacidade seguem PRD e backend; rotas protegidas e logs sem dados sensíveis.

---

## 20. Referências visuais do pacote (imagens não são especificação executável)

| Tela/tema | Arquivo no pacote | Estado |
|---|---|---|
| Auth (3 telas) | [`references/auth-fluxo-dark.png`](references/auth-fluxo-dark.png) | VA com copy/aceites a corrigir |
| Home | [`references/home-mobile-dark.png`](references/home-mobile-dark.png) | VA |
| Mapa de exploração | [`references/mapa-ocorrencias-mobile.png`](references/mapa-ocorrencias-mobile.png) | PROPOSTA de escopo, direção visual acolhida |
| B3 detalhamento | [`references/detalhes-ocorrencia-base.png`](references/detalhes-ocorrencia-base.png) | VA |
| B3 acompanhamento | [`references/detalhes-ocorrencia-acompanhamento-futuro.png`](references/detalhes-ocorrencia-acompanhamento-futuro.png) | FUTURO para prazo/resposta oficial |
| Denúncia 4 passos | [`references/denuncia-quatro-etapas.png`](references/denuncia-quatro-etapas.png) | VA sequência |
| Denúncia passo 1 | [`references/denuncia-localizacao-detalhe.png`](references/denuncia-localizacao-detalhe.png) | VA |
| Minhas ocorrências | [`references/minhas-ocorrencias-acompanhamento.png`](references/minhas-ocorrencias-acompanhamento.png) | RI, prazos futuros |
| Social | [`references/social-tres-telas.png`](references/social-tres-telas.png) | RI |
| Perfil + navbar Mapa | [`references/perfil-e-home-nav-mapa.png`](references/perfil-e-home-nav-mapa.png) | RI/VA navbar |
| Moderação fluxo inicial | [`references/moderacao-primeiro-fluxo.png`](references/moderacao-primeiro-fluxo.png) | RI |
| Moderação alternativa A | [`references/moderacao-a-central.png`](references/moderacao-a-central.png) | PROPOSTA |
| Moderação alternativa B | [`references/moderacao-b-integrada.png`](references/moderacao-b-integrada.png) | PROPOSTA |
| Paisagem de inspiração | [`references/paisagem-noturna-inspiracao.png`](references/paisagem-noturna-inspiracao.png) | Inspiração visual |

**Modo de uso:** Codex deve ler o documento, abrir as imagens correspondentes e consultar o PRD. Onde mockup e regra discordarem, registrar a diferença e aplicar a fonte funcional válida. Não converter imagens inteiras em elementos clicáveis.

---

## 21. Instruções para o Codex / modo SDD

1. **Localizar e ler** os arquivos reais do repositório: PRD/levantamento funcional, decisões técnicas, `AGENTS.md` e Design System existente; não pressupor caminhos sem verificar.
2. **Checar duplicações de documentação:** escolher arquivo oficial com a equipe (`design.md` / `docs/DESIGN.md` / `docs/frontend/Desing-rules.md`), atualizar um ponto canônico e referenciar os demais em vez de manter cópias divergentes.
3. **Para cada tela:** preparar `requirements` (dados/regras do PRD), `design` (layouts, estados, fluxos), `tasks` (tarefas testáveis), seguindo o padrão SDD do projeto se já houver.
4. **Antes da implementação:** levantar P01–P07 com a equipe, particularmente rotas/navegação, limites de GPS, duplicidade, confirmação de e-mail e fonte de prazos oficiais.
5. **Implementar shared components** e design tokens antes de duplicar JSX/estilos entre telas.
6. **Preservar escopo:** design de acompanhamento oficial futuro não autoriza desenvolvimento do módulo de fiscalização de prazos no MVP.
7. **Não fabricar dados** a partir de mockups. Usar fixtures explicitamente fictícias apenas em desenvolvimento/testes; serviços reais definem contadores, datas, canais e status.
8. **Validar acessibilidade, RBAC, PWA, responsividade e estados** em cada entrega.
9. **Registrar decisões** que mudarem o fluxo e atualizar este documento, imagens e critérios de aceite por versão.
10. **Não implementar o layout administrativo final** antes de escolher entre propostas A/B/híbrida; manter componentes genéricos reutilizáveis.

---

## 22. Histórico de versões

| Versão | Mudança |
|---|---|
| 0.1 | Base dark-first, marca e tipografia, paleta conceitual, módulo A. |
| 0.2 | Padrões preliminares da Home, tokens e conflitos iniciais. |
| **0.4** | Consolidação completa do plano de telas, navbar com Mapa, jornada de denúncia em 4 passos, detalhes e acompanhamento, Minhas Ocorrências, Social, Perfil, moderação A/B, administração, matriz de acesso e pendências. |

**Próxima revisão:** após decidir navegação de Moderação, acesso ao Social, escopo do Mapa expandido e conciliar divergências de autenticação/duplicidade, elevar para v0.5. O arquivo permanece evolutivo.


---

# Registro anterior do Design System (v0.1)

Esta seção preserva as diretrizes e pendências da versão anterior para conciliação com a v0.4 acima. Em divergências, nenhuma versão é escolhida automaticamente.

# Voz da Rua — Design System e diretrizes de interface

> **Versão:** 0.1 (documento vivo)  
> **Estado:** base visual aprovada; tokens numéricos e detalhes de comportamento ainda sujeitos à validação  
> **Escopo atual:** diretrizes globais, módulo A e padrões preliminares da Home  
> **Produto:** PWA mobile-first, inicialmente para o município de São Paulo  
> **Público:** cidadãos que registram, visualizam e acompanham problemas urbanos

## 1. Como usar este documento (inclusive com Codex)

Este arquivo é a **fonte de referência visual e de UX** do projeto. Ele não substitu i o levantamento funcional nem as especificações técnicas de autenticação. Para cada implementação:

1. Consulte este arquivo para cores, tipografia, componentes, ilustrações e padrões de navegação.
2. Consulte o levantamento funcional e os requisitos da funcionalidade para regras de negócio.
3. Em caso de conflito entre a referência ilustrativa e uma regra funcional documentada, **não invente uma solução**: registre a divergência e peça decisão.
4. Não trate textos, posições de pixels, ícones ou proporções de mockups gerados como especificações técnicas exatas. A implementação deve ser responsiva, acessível e baseada em componentes reais.
5. Decisões ainda marcadas como **pendentes** não devem ser transformadas em regras definitivas por suposição.

**Legenda de estado:** `APROVADO` = decisão explícita; `PROPOSTO` = ponto de partida a validar; `PENDENTE` = precisa de decisão.

## 2. Identidade e princípios do produto

| Diretriz | Estado | Regra |
|---|---|---|
| Personalidade | APROVADO | Equilíbrio entre confiança de serviço público moderno, participação comunitária e linguagem urbana/tecnológica |
| Plataforma | APROVADO | PWA, mobile-first; priorizar uso na rua, com uma mão |
| Tema inicial | APROVADO | Dark Mode é o padrão e será desenvolvido primeiro; Light Mode será adaptado depois |
| Paleta conceitual | APROVADO | Azul-marinho profundo + amarelo urbano vibrante + cores neutras e semânticas |
| Intensidade do amarelo | APROVADO | Uso equilibrado: ações principais, navegação ativa, pins e detalhes de marca |
| Tipografia de interface | APROVADO COMO DIREÇÃO | **Sora** para os textos do sistema; validar pesos, tamanhos e renderização real no navegador |
| Formas | APROVADO | Cantos arredondados, campos e botões confortáveis ao toque, hierarquia clara |
| Densidade | APROVADO | Equilíbrio entre informação e espaço; não sobrecarregar telas |
| Logo | REFERÊNCIA PROVISÓRIA | Símbolo circular amarelo/preto de participação popular, acompanhado do nome “Voz da Rua”; não redesenhar automaticamente |
| Imagens | APROVADO COMO LINGUAGEM | Paisagens urbanas noturnas estilizadas, skyline, ponte estaiada distante, árvores/silhuetas, pins amarelos; evitar mapas geométricos decorativos no céu |

### Princípios de UX

- **Ação evidente:** o amarelo identifica o CTA principal, não todos os elementos clicáveis.
- **Leitura em primeiro lugar:** ilustração não deve comprometer formulário, contraste ou navegação.
- **Identidade consistente:** reaproveitar o mesmo sistema de cores, tipografia, bordas e ilustrações entre módulos.
- **Acessibilidade:** textos legíveis, foco visível, campos identificados, mensagens de erro explícitas, áreas de toque adequadas e respeito a preferências de movimento.
- **Estados reais:** loading, vazio, erro, sucesso, desabilitado e foco precisam ser implementados, mesmo que não apareçam no mockup.

## 3. Referências visuais

### 3.1 Referência principal — módulo A

Arquivo visual associado: `voz_da_rua_design_refs/auth_tres_telas_referencia.png`.

A composição aprovada apresenta **três telas lado a lado**: login, cadastro e recuperação de acesso, todas em Dark Mode, com amarelo (não azul) como cor de destaque.

**Elementos compartilhados:**

- Fundo azul-marinho quase preto, com leves variações de profundidade.
- Na parte superior, logo circular amarelo/preto e título “Voz da Rua” branco, com traço amarelo sob o nome.
- Faixa panorâmica de cidade noturna: prédios ao longe, ponte estaiada iluminada, árvores em silhueta. A paisagem deve parecer **distante**, não colada ao formulário.
- Painel de formulário azul-marinho, com topo bastante arredondado e separação sutil do fundo.
- Títulos brancos; textos secundários claros; links e CTA amarelos.
- Inputs azul-escuros, borda azul acinzentada, ícones claros e cantos arredondados.
- Botões principais amarelos com texto e seta em azul-marinho/preto.
- Onda amarela decorativa no rodapé; não deve cobrir conteúdo ou controles.
- **Não incluir** raios decorativos/pequenos riscos ao lado dos títulos e **não incluir** malhas geométricas/mapas decorativos na região superior.

**Atenção:** esta é uma referência de direção visual, não um conjunto de imagens a serem usadas como formulários. Campos, botões e textos devem ser elementos HTML acessíveis.

### 3.2 Outras referências já alinhadas

- Home mobile: mapa de ocorrências próximas no topo e lista de ocorrências abaixo; cards com foto, categoria, endereço, distância, relatos e status.
- Navegação autenticada: barra inferior com **botão central amarelo para denunciar**.
- No módulo de autenticação, **não exibir** a barra inferior da área autenticada.
- Logo e paisagem podem ser ativos de imagem; inputs, links, botões, badges e cards devem ser componentes de UI.

## 4. Cores e tokens

**Importante:** os códigos abaixo são **tokens iniciais PROPOSTOS**, derivados da direção visual. O usuário aprovou a **família de cores**, não os valores hexadecimais exatos. Antes de congelar a paleta, testar contraste WCAG e visualizar em aparelhos reais.

| Token sugerido | Valor provisório | Uso |
|---|---|---|
| `--color-bg` | `#061626` | Fundo geral Dark Mode |
| `--color-surface` | `#092039` | Painéis e superfícies elevadas |
| `--color-surface-input` | `#102C47` | Inputs e controles |
| `--color-border` | `#4A7293` | Contornos discretos |
| `--color-text` | `#F8FAFC` | Texto principal |
| `--color-text-muted` | `#C0CDDC` | Texto secundário |
| `--color-accent` | `#FFC400` | CTA, links destacados, navegação ativa |
| `--color-on-accent` | `#081827` | Texto/ícones sobre amarelo |
| `--color-focus` | `#FFE17A` | Foco visível (validar) |

**Cores semânticas:** sucesso, erro, alerta, informação e status de ocorrência terão tokens próprios, ainda **PENDENTES**. Não reutilizar amarelo de marca indiscriminadamente como “alerta”.

**Light Mode:** previsto, porém **sem tokens finais definidos**. Criar CSS variables/tokens temáticos desde o início para permitir a futura adaptação sem refatorar cada componente.

## 5. Tipografia

- **Família principal:** `Sora`, com fallback `system-ui, sans-serif`.
- Usar a mesma família em títulos, campos, botões, links, navegação e cards; o logo artístico é um ativo independente.
- Pesos **PROPOSTOS**: 400 para texto; 500 para rótulos; 600 para botões e subtítulos; 700 para títulos.
- Escala **PROPOSTA**: corpo 16px; texto auxiliar 14px; título de seção 24–28px; título de tela 28–32px. Ajustar em celulares pequenos.
- Evitar textos essenciais abaixo de 14px. Não depender apenas do placeholder como rótulo de input.
- Respeitar zoom do navegador, aumento de fonte e quebras de linha.

## 6. Espaçamento, bordas e responsividade

Valores abaixo são **PROPOSTOS** para implementação inicial e devem ser validados:

- Grid de espaçamento: múltiplos de 4px; preferir 8/12/16/24/32px.
- Padding horizontal da tela: 16–24px, adaptativo.
- Altura mínima de controles tocáveis: 44px; preferir 48–52px para botões e inputs.
- Raio de inputs e botões: 12–16px; raio superior do painel: 28–36px.
- Formulário com largura fluida e limite máximo razoável (ex.: 440px) em telas largas.
- Em telas baixas, permitir rolagem vertical. Não fixar o botão abaixo da área visível nem deixar a onda amarela encobrir conteúdo.
- Considerar safe areas do PWA (`env(safe-area-inset-*)`), teclado virtual e foco em inputs.
- Evitar embutir status bar, borda de iPhone ou relógio no produto real: esses elementos pertencem ao mockup.

## 7. Linguagem de ilustração e ativos

**APROVADO:** estética noturna urbana em azul-marinho, com construções em diferentes profundidades, ruas, viadutos, postes, silhuetas e iluminação suave azul e amarela. Cenários urbanos fictícios são permitidos; pontos turísticos específicos não são obrigatórios. A referência do módulo A inclui skyline e ponte estaiada distantes. Evitar estilo infantil, cores excessivas e prejuízo à leitura.

**Não fazer:** fundos de mapa com linhas geométricas sobre o céu; elementos luminosos excessivos; troca do amarelo de marca por azul neon; logo diferente sem aprovação; ilustração por trás de textos com contraste insuficiente.

**Implementação:** exportar a paisagem e o logo como ativos separados, otimizados para web (PNG/WebP/AVIF conforme necessidade); manter texto fora das imagens. Não usar uma captura inteira da tela como interface. Caso o ativo final ainda não exista, usar placeholder fiel e registrar a pendência; não inventar nova identidade.

## 8. Componentes reutilizáveis

| Componente | Regras iniciais | Estados necessários |
|---|---|---|
| `AuthLayout` | Cabeçalho de marca, paisagem, painel de formulário, onda decorativa | Mobile pequeno, rolagem, teclado aberto |
| `BrandHeader` | Logo + título, sem slogan obrigatório | Versão compacta quando faltar altura |
| `TextField` | Label acessível, ícone opcional, borda suave, ajuda/erro abaixo | Default, foco, preenchido, erro, disabled |
| `PasswordField` | Igual ao campo de texto, com alternância mostrar/ocultar | Visível/oculta, foco, erro |
| `PrimaryButton` | Fundo amarelo, texto escuro, largura total em auth | Default, hover, pressed, loading, disabled |
| `TextLink` | Amarelo para links prioritários, foco visível | Default, foco, visited quando aplicável |
| `SocialLoginButton` | Fundo escuro, contorno, ícone do provedor e nome | Default, loading, erro, disabled |
| `DividerWithLabel` | Linha fina em ambos os lados de “ou continue com” | Responsivo |
| `FormFeedback` | Mensagem textual, não apenas cor | Erro, sucesso, aviso |

**Acessibilidade:** inputs com `label` associado; botões de visibilidade de senha com `aria-label`; erros relacionados ao campo; navegação por teclado; indicadores de foco; contraste mínimo a validar; mensagens anunciadas de modo apropriado.

## 9. Módulo A — Identidade e acesso

### 9.1 Login — `PROPOSTO / BASE VISUAL APROVADA`

**Conteúdo:**

- Marca e paisagem compartilhadas.
- Título: **“Bem-vindo(a)!”**.
- Texto de apoio: **“Use sua voz para evolução”** (texto solicitado anteriormente; a imagem de três telas ainda exibe uma frase antiga — atualizar na implementação).
- Campo e-mail.
- Campo senha com mostrar/ocultar.
- Link “Esqueceu a senha?”.
- CTA amarelo “Entrar”.
- Divisor “ou continue com”.
- Botões “Google” e “GitHub”.
- Rodapé: “Ainda não tem conta? Criar conta”.

**Comportamento:** autenticar por e-mail/senha ou provedores previstos; após sucesso, navegar para Home. Erro de credenciais, indisponibilidade, loading e prevenção de envios repetidos devem ter estados próprios. Detalhes de sessão e OAuth dependem da especificação técnica.

### 9.2 Cadastro — `PROPOSTO / BASE VISUAL APROVADA`

**Conteúdo visual:**

- Título: “Criar conta”.
- Texto: “Preencha seus dados para começar a usar o Voz da Rua.”
- Nome completo, e-mail, senha, confirmação de senha.
- CTA amarelo “Cadastrar”.
- Link “Voltar para o login”.
- **Adicionar os aceites obrigatórios previstos no levantamento funcional**, com links para os documentos correspondentes. Eles não aparecem no mockup e não podem ser omitidos por isso.

**CONFLITO PENDENTE:** este documento registrava confirmação de e-mail como não obrigatória no MVP; o PRD (§5) e as decisões técnicas (§5.4) exigem confirmação para conta local. Preservar o registro da divergência e alinhar o fluxo e o momento do bloqueio com a equipe antes da implementação.

**Pendente:** política de senha; critérios de nome; detalhes dos aceites e versionamento; conta já existente; integração com provedores; política de sessão após cadastro. Validar com o levantamento funcional e a especificação de auth.

### 9.3 Recuperação de acesso — `PROPOSTO / BASE VISUAL APROVADA`

**Conteúdo:**

- Título: “Recuperar acesso”.
- Texto: “Insira o e-mail cadastrado para receber o link de recuperação de acesso.”
- Campo e-mail.
- CTA amarelo “Enviar link de recuperação”.
- Link “Voltar para o login”.

**Fluxo necessário:** solicitar link → informar ao usuário que, se houver conta compatível, as instruções serão enviadas → abrir link válido → definir nova senha → confirmar sucesso e retornar ao login. As telas de **mensagem de envio** e **nova senha** ainda precisam de desenho, embora façam parte do fluxo completo.

**Segurança a especificar:** token temporário de uso único, expiração, proteção contra abuso, invalidação após uso e mensagens que não revelem se um e-mail está cadastrado. Esses são requisitos técnicos propostos, não regras de UI já aprovadas.

## 10. Fluxos e rotas sugeridas

> As rotas abaixo são sugestões, não contratos existentes.

```text
/login
  ├── /cadastro
  ├── /recuperar-acesso
  │     ├── confirmação de solicitação (estado ou tela)
  │     └── /redefinir-senha (link recebido por e-mail)
  └── /home (após autenticação)
```

**Sem barra inferior autenticada** nessas rotas. Redirecionamento de usuários já autenticados e retorno à rota pretendida ainda precisam ser definidos.

## 11. Decisões pendentes (não presumir)

1. **Valores finais** de cores e contraste, incluindo tokens semânticos.
2. **Detalhes tipográficos**: escala definitiva de Sora e comportamento em telas menores.
3. **Ativos definitivos** de logo e paisagem (arquivos separados, qualidade e licenças).
4. **Política de senha**, validações de campos e tratamento de duplicidade de e-mail.
5. **Termos e privacidade**: textos, links, aceites obrigatórios e registro do consentimento.
6. **Vinculação de contas OAuth** com e-mails já cadastrados e tratamento de falhas.
7. **Sessão**: duração, renovação, logout, persistência e proteção de rotas.
8. **Recuperação**: prazo de validade do link, limites de solicitação e telas de confirmação/redefinição.
9. **Light Mode**: paleta e imagens adaptadas, depois de consolidar o Dark Mode.
10. **Home**: mini mapas, localização, notificações e demais decisões; consultar [especificação](Home.md).
11. **Conflito de autenticação:** este documento registrava confirmação de e-mail não obrigatória no MVP; o PRD (§5) e `DECISOES_TECNICAS.md` (§5.4) exigem confirmação para conta local. Confirmar com a equipe o fluxo e o momento do bloqueio.
12. **Localização do Design System:** `DECISOES_TECNICAS.md` prevê `docs/DESIGN.md`, enquanto o documento existente está em `docs/frontend/Design.md`. Confirmar a localização oficial antes de mover ou duplicar.

## 12. Critérios de aceite da primeira implementação visual

- [ ] As três telas de auth compartilham o mesmo layout, tipografia Sora e identidade azul-marinho/amarelo.
- [ ] O logo e a paisagem são exibidos como ativos próprios; formulários são HTML/CSS reais.
- [ ] A paisagem mostra skyline e ponte distantes, sem malhas geométricas decorativas.
- [ ] Não há detalhes de “raios” junto aos títulos das telas.
- [ ] O botão principal de cada tela é amarelo, com texto escuro.
- [ ] Login oferece e-mail/senha, Google e GitHub; cadastro e recuperação têm links de retorno.
- [ ] Cadastro apresenta os aceites obrigatórios do levantamento funcional.
- [ ] O layout funciona em celular pequeno, teclado aberto, zoom e rolagem.
- [ ] Campos têm labels, erros, foco visível e controles de senha acessíveis.
- [ ] Estados de loading/erro/sucesso são previstos; não existe ação apenas decorativa.
- [ ] O fluxo de confirmação de e-mail é reconciliado com o PRD e com as decisões técnicas antes da implementação.
- [ ] Regras ainda pendentes estão identificadas, não implementadas arbitrariamente.

## 13. Evolução do documento

| Versão | Mudança |
|---|---|
| 0.1 | Diretrizes globais dark-first; identidade urbana; tokens provisórios; componentes; referência das três telas; regras e pendências do módulo de acesso |
| 0.2 | Padrões reutilizáveis e especificação da Home; conflitos e decisões pendentes documentados |

**Próximas atualizações previstas:** fechar regras de auth e fluxos auxiliares; validar tokens, decisões pendentes da Home e responsividade; detalhar ocorrências e Light Mode.

## 14. Padrões reutilizáveis para a Home

> **DESIGN APROVADO:** direção visual em [home-mobile-dark.png](assets/home-mobile-dark.png) e na solicitação. A imagem orienta a composição, não define medidas exatas nem substitui requisitos. As regras são regidas pelo [levantamento funcional](../PRD/prd.md). A [Home](Home.md) reúne o fluxo e critérios.

### Navegação e ícones

- **DESIGN APROVADO:** barra móvel com Início, Social, Denunciar, Ocorrências e Perfil; Denunciar central, amarelo e com ícone de adição. Identificar a entrada ativa também por texto ou outro sinal além da cor. Cabeçalho da Home sem ícones de perfil e notificações.
- **PROPOSTA:** ícones simples e consistentes, acompanhados de rótulos, com nome acessível e foco visível; reservar espaço para a barra e safe area para não encobrir conteúdo. Família, espessura, dimensões, aparência ativa e acesso a notificações estão **PENDENTES**.
- **REQUISITO:** usuários banidos mantêm acesso de leitura; ações colaborativas ficam indisponíveis. Não depender da interface para autorização.

### Cards, mapa e conteúdo

- **REQUISITO:** card inclui mini mapa focado no local com rua e pin, categoria, endereço, distância, relatos, status, responsável/canal e ações de confirmação, detalhes e encaminhamento. Foto pública apenas quando aprovada e disponível, sem rosto identificável, placa legível ou dados pessoais desnecessários.
- **DESIGN APROVADO:** mapa resumido escuro com pins amarelos, indicador azul do usuário, cantos arredondados e botão “Ver no mapa”; cards em lista vertical com foto à esquerda, texto, categoria em faixa amarela e status em selo contornado. O mapa resumido não substitui automaticamente os mini mapas exigidos pelo PRD.
- **PROPOSTA:** imagem aprovada, título e categoria primeiro; endereço, distância e relatos em bloco compacto; status textual e canal abaixo; ações independentes e detalhes acessíveis. Não truncar informação essencial sem acesso ao texto completo. Disposição de foto e mini mapa e raio dos cards estão **PENDENTES**; usar a escala de espaçamento e controles provisória das seções 5–6 como ponto de partida.
- **PROPOSTA:** distinguir pins por forma ou rótulo acessível além de cor; fornecer lista textual equivalente ao mapa e atribuição cartográfica apropriada. Azul do indicador, tamanhos, símbolos e tokens semânticos específicos estão **PENDENTES**; não acrescentar hexadecimais como aprovados.

### Estados e acessibilidade

**PROPOSTA:** componentes devem prever carregamento com estrutura estável e indicação textual; vazio distinguindo ausência de resultados e filtros; erro com tentativa novamente; localização negada/indisponível com orientação e nova tentativa; imagem ou mapa indisponível sem esconder conteúdo textual. Exibir atualização somente quando houver dado confiável. Offline, identificar dados potencialmente desatualizados quando disponíveis e manter somente leitura, sem fila de escrita (PRD §24). Não apresentar resultados antigos como atuais.

Contraste de texto, ícones e foco deve ser validado; não depender exclusivamente de cor. Usar elementos semânticos, áreas de toque adequadas, leitores de tela, teclado, zoom e movimento reduzido. Ilustrações decorativas não recebem descrição redundante; imagens informativas recebem texto alternativo apropriado. Os tokens da seção 4 continuam provisórios e Light Mode permanece posterior.
