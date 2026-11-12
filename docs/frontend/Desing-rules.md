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
12. **Localização do Design System:** `DECISOES_TECNICAS.md` prevê `docs/DESIGN.md`, enquanto o documento existente está em `docs/frontend/Desing-rules.md`. Confirmar a localização oficial antes de mover ou duplicar.

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
