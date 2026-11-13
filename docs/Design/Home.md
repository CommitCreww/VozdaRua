# Home — Perto de você

> **Estado:** especificação de design para revisão; referência visual inspecionada. Não autoriza implementação antes da aprovação.  
> **Fontes:** [levantamento funcional](../PRD/prd.md), especialmente §§ 2, 3, 5, 7, 10, 19 e 24; [Design System](Design.md); [referência mobile dark](assets/home-mobile-dark.png). Decisões técnicas e segurança complementam as regras. A imagem é direcional, não define medidas exatas nem elimina requisitos.

**Legenda:** **REQUISITO** = levantamento funcional; **DESIGN APROVADO** = solicitação ou referência; **PROPOSTA** = recomendação a validar; **PENDENTE** = decisão necessária. Exemplos da imagem não constituem dados reais nem categorias aprovadas.

## 1. Objetivo

**REQUISITO:** primeira tela após login, apresenta feed vertical de problemas próximos da localização atual, até 3 km, no município atendido. O mapa complementa a descoberta; a Home não é uma tela exclusivamente cartográfica. Usuários banidos podem consultar Home e detalhes em modo somente leitura. Páginas internas exigem autenticação.

## 2. Estrutura visual

**DESIGN APROVADO**, de cima para baixo:

1. Cabeçalho com logo circular amarelo e preto sem nome ao lado; paisagem noturna ao fundo com construções, iluminação e viaduto; saudação personalizada e mensagem comunitária curta em primeiro plano. Sem ícones de perfil ou notificações no topo. A imagem é decorativa e não pode prejudicar contraste.
2. Controle arredondado de localização/região, com ícone de localização, indicação de até 3 km e seta de expansão.
3. Mapa resumido escuro e arredondado com pins amarelos, localização do usuário em azul e ação contornada em amarelo “Ver no mapa”.
4. Cabeçalho “Perto de você”, indicador de atualização quando houver dado disponível e acesso “Ver todos”. Lista vertical de cards escuros contornados, com foto à esquerda, categoria amarela, título, endereço, distância, relatos e selo textual de status. O mockup mostra menu de reticências, mas não estabelece seu conteúdo.
5. Navegação inferior: Início, Social, Denunciar, Ocorrências e Perfil. Denunciar é central, circular, amarelo e com ícone de adição; a entrada ativa é identificável. Elementos de moldura e status do aparelho na imagem não fazem parte da interface.

**PROPOSTA:** completar os cards com os dados e ações exigidos pelo PRD, sem confiar no menu de reticências para ocultar ações essenciais. Usar as escalas provisórias do Design System e preservar legibilidade com textos longos.

## 3. Componentes e dados

| Componente | Conteúdo e tratamento |
|---|---|
| Cabeçalho | **DESIGN APROVADO:** marca, saudação, texto de apoio e paisagem; alternativa para nome indisponível é **PENDENTE**. |
| Localização e filtros | **REQUISITO:** localização atual; filtros por categoria, distância e status, respeitando 3 km. **PENDENTE:** comportamento exato de expansão e significado de seleção de região. Não presumir que um local escolhido substitua a localização atual para ações presenciais. |
| Mapa resumido | **DESIGN APROVADO:** pins, posição e CTA. **PROPOSTA:** alternativa textual acessível; destino e interação exatos do CTA são **PENDENTES**. |
| Card | **REQUISITO:** mini mapa focado no problema, com pin e rua; categoria, rua, número quando disponível, bairro, distância, quantidade de relatos, status, responsável e canal. **DESIGN APROVADO:** título e foto pública aprovada quando disponível. **PROPOSTA:** agrupar endereço e métricas; apresentar canal e ações em área própria. Foto e mini mapa devem coexistir até que outra solução seja validada com produto. |
| Navegação inferior | **DESIGN APROVADO:** cinco entradas e botão central destacado. **PENDENTE:** acesso às notificações internas e significado/destino exato de Ocorrências e “Ver todos”. |

**REQUISITO:** foto pública é selecionada pela moderação e não deve expor rosto identificável, placa legível ou dados pessoais desnecessários; não expor a identidade do cidadão por padrão. Se não houver canal conhecido, exibir “Canal oficial ainda não cadastrado”, sem inventar responsável ou link.

## 4. Ações e interações

- **REQUISITO:** tocar no card fora de controles específicos abre detalhes; ações internas devem ser independentes, inclusive por teclado. Detalhes permitem consultar status e histórico conforme a funcionalidade de ocorrências.
- **REQUISITO:** “Eu também vi” para usuário autenticado, não banido, ainda não participante e a até 3 km; localização ativa é necessária. Após confirmação, apresentar “Você também viu”; texto curto é opcional, sem nova foto. Remoção é permitida nas primeiras 12 horas após a confirmação. Estados e modo de remoção são **PROPOSTA** a detalhar.
- **REQUISITO:** abrir canal oficial cadastrado em nova aba, podendo antes apresentar instruções. O cidadão conclui a denúncia no serviço externo; não afirmar que ela foi protocolada. O relato permanece no Voz da Rua independentemente da conclusão externa.
- **REQUISITO:** ordenar por proximidade; em distâncias iguais ou muito semelhantes, atualização mais recente primeiro. Oferecer filtros por categoria, distância e status, e paginação. Faixas de 500 m, 1 km, 2 km e 3 km são exemplos do PRD, não valores fechados.
- **PROPOSTA:** mostrar motivo compreensível para ação indisponível, sem confundir ausência de localização, distância excedida, conta banida e participação já registrada. Interface não substitui validação de autorização e distância no servidor.

## 5. Regras relacionadas

**REQUISITO:** operação inicial limitada ao município de São Paulo; criação de ocorrência, confirmação, resolução e reabertura comunitárias exigem localização ativa e no máximo 3 km. Não registrar ocorrência fora do município. O backend verifica distância e limite municipal; não assumir que localização visual ou região selecionada autorize uma ação. Não armazenar continuamente histórico de localização do usuário.

**REQUISITO:** ocorrências são publicadas após moderação; não usar foto não aprovada. O feed não representa relatos sociais nem deve sugerir que quantidade de relatos substitui validação. Estados e histórico devem refletir dados existentes, sem presumir resposta oficial. A disponibilidade de ações varia por estado e permissão.

## 6. Estados da interface

| Situação | Tratamento |
|---|---|
| Carregamento | **PROPOSTA:** placeholders estruturais e indicação textual; preservar espaço e não simular dados. |
| Sem ocorrências | **PROPOSTA:** explicar ausência na área, sem sugerir que a cidade inteira está vazia. |
| Filtros sem resultado | **PROPOSTA:** distinguir do vazio geral e oferecer limpeza dos filtros. |
| Localização negada, desligada ou indisponível | **REQUISITO:** não permitir ações presenciais. **PROPOSTA:** explicar permissão e oferecer nova tentativa; não fabricar localização, distância ou resultados próximos. Conteúdo alternativo é **PENDENTE**. |
| Fora do município | **PROPOSTA:** informar área atendida e não apresentar ações incompatíveis; comportamento de leitura é **PENDENTE**, sem ampliar regras geográficas. |
| Erro de consulta, mapa ou imagem | **PROPOSTA:** mensagem e nova tentativa; preservar dados textuais disponíveis e usar alternativa à imagem, sem ocultar card por falha cartográfica. |
| Offline | **REQUISITO:** dados recentes já carregados podem aparecer somente para leitura; ações de escrita exigem conexão, sem fila offline no MVP. **PROPOSTA:** indicar offline e eventual desatualização, sem afirmar horário desconhecido. |
| Banido | **REQUISITO:** acesso de leitura; impedir ações colaborativas. **PROPOSTA:** identificar o motivo de forma clara e acessível. |
| Canal ausente | **REQUISITO:** “Canal oficial ainda não cadastrado”; não criar link ou responsável. |

## 7. Responsividade e acessibilidade

**DESIGN APROVADO:** mobile-first, dark mode; light mode posterior. Em telas estreitas, conteúdo flui e rola sem ser coberto pela navegação; considerar safe areas e zoom. **PROPOSTA:** em telas maiores, limitar largura de leitura e adaptar disposição sem perder ordem e funcionalidade; breakpoint e composição estão pendentes.

Usar títulos semânticos, botões e links identificáveis, foco visível, suporte a teclado e leitor de tela, áreas de toque adequadas e contraste validado. Status, seleção e pins não dependem só de cor. Informações do mapa devem ter equivalente textual; fotos informativas precisam de alternativa apropriada e paisagem decorativa não deve gerar anúncio redundante. Respeitar preferências de movimento e aumento de texto.

## 8. Critérios de aceite para futura implementação

- [ ] Somente usuários autenticados acessam a Home; banidos mantêm leitura e não executam ações colaborativas.
- [ ] Cabeçalho, seletor, mapa, feed e navegação refletem a direção aprovada, sem ícones de perfil/notificação no topo e sem embutir moldura do aparelho.
- [ ] Feed apresenta ocorrências elegíveis em até 3 km, ordenação e filtros previstos, com paginação; sem localização não oferece ações presenciais.
- [ ] Cada card contempla mini mapa, rua e pin, dados e ações do PRD, além de título e foto pública aprovada quando houver; ausência de imagem ou mapa não oculta dados textuais.
- [ ] “Eu também vi”, detalhes e canal oficial funcionam de forma independente, respeitam permissão, proximidade, estado e janela de remoção; encaminhamento não afirma protocolo.
- [ ] Canal ausente tem mensagem prevista; fotos e identidade respeitam privacidade; dados públicos dependem de moderação.
- [ ] Carregamento, vazio, filtros, erro, localização indisponível, offline e conta banida são distinguíveis; offline não enfileira escritas.
- [ ] Teclado, leitor de tela, contraste, zoom, toque e alternativa textual do mapa são verificados; navegação não encobre conteúdo.
- [ ] Pendências abaixo e tokens provisórios são aprovados antes de serem tratados como definitivos.

## 9. Decisões pendentes

| Pendente | Recomendação de UX/técnica, separada da decisão | Impacto |
|---|---|---|
| Mini mapa por card junto à foto e ao mapa geral | Manter mini mapa exigido, talvez compacto ou em área expansível acessível, sem remover dados; validar densidade com protótipo. | Altura do feed, custo cartográfico e aderência ao PRD. |
| Localização/região e opções do seletor | Usar localização atual como referência; distinguir filtros de distância de qualquer região selecionada. | Privacidade, compreensão da proximidade e elegibilidade das ações. |
| Acesso a notificações sem ícone no topo | Avaliar entrada identificável no Perfil ou outro acesso acessível, sem acrescentar ícone ao cabeçalho aprovado. | Descoberta e leitura de notificações internas. |
| Destino de “Ver no mapa”, “Ver todos” e Ocorrências | Definir destinos e retorno ao feed com equipe; não presumir rotas. | Navegação e continuidade da tarefa. |
| Apresentação de ações, filtros e menu de reticências | Prototipar controles explícitos e acessíveis, mantendo ações obrigatórias descobríveis. | Densidade, usabilidade e acesso às funções. |
| Conteúdo sem localização, fora da cidade e saudação sem nome | Testar mensagens e leitura permitida com produto, sem inventar dados próximos. | Acesso à informação e expectativas do usuário. |
| Tokens finais, status, ativos e layout em telas maiores | Validar contraste, dispositivos, imagens e estados; manter valores do Design System provisórios. | Acessibilidade e consistência. |

O PRD exige mini mapas nos cards e a imagem não os mostra; também omite canal oficial, bairro e ações obrigatórias. A solução visual deve incorporar esses requisitos, não suprimi-los. O conflito de confirmação de e-mail e a localização oficial do Design System estão registrados no próprio Design System.
