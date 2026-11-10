<div align="center">

# Voz da Rua

### Uma plataforma colaborativa para identificar, acompanhar e encaminhar problemas urbanos em São Paulo.

[![Status](https://img.shields.io/badge/status-em%20defini%C3%A7%C3%A3o%20de%20produto-F5C400?style=for-the-badge&labelColor=111111)](#status-do-projeto)
[![Cidade](https://img.shields.io/badge/cidade-S%C3%A3o%20Paulo-111111?style=for-the-badge&labelColor=F5C400)](#escopo-geogr%C3%A1fico)
[![Idioma](https://img.shields.io/badge/idioma-pt--BR-111111?style=for-the-badge&labelColor=F5C400)](#idioma)
[![Open Source](https://img.shields.io/badge/open%20source-em%20planejamento-111111?style=for-the-badge&labelColor=F5C400)](#licen%C3%A7a)

**Veja o que está acontecendo perto de você.  
Relate problemas. Confirme ocorrências. Encontre o canal certo para denunciar.**

</div>

---

## Sobre o projeto

O **Voz da Rua** é uma plataforma colaborativa pensada para centralizar a descoberta, o registro e o acompanhamento de problemas urbanos na cidade de São Paulo.

A proposta nasce de um problema simples: situações como buracos, calçadas sem acessibilidade, problemas de iluminação, falhas em estruturas públicas, transporte, estações, vias e espaços privados de uso público possuem canais de denúncia diferentes e, muitas vezes, pouco intuitivos.

O Voz da Rua pretende funcionar como uma camada de organização entre o cidadão, o problema identificado e o responsável por recebê-lo.

A plataforma permitirá que pessoas próximas de uma ocorrência confirmem sua existência, acompanhem sua evolução e encontrem rapidamente o canal oficial adequado para realizar a denúncia.

> O Voz da Rua não pretende substituir os canais oficiais dos órgãos públicos ou privados.  
> Seu papel é **organizar, contextualizar e facilitar o caminho entre o cidadão e o responsável pelo problema**.

---

## Visão

Construir uma plataforma onde qualquer cidadão possa entender rapidamente:

- quais problemas existem perto dele;
- onde esses problemas estão;
- quantas pessoas também os identificaram;
- qual o status atual da ocorrência;
- qual órgão ou responsável deve receber a denúncia;
- como realizar a denúncia pelo canal oficial;
- como contribuir para confirmar ou acompanhar a situação.

---

## Princípios do produto

O projeto está sendo desenvolvido em torno de alguns princípios fundamentais:

| Princípio | Objetivo |
|---|---|
| **Localidade** | Priorizar problemas realmente próximos ao cidadão. |
| **Colaboração** | Permitir que diferentes usuários confirmem a mesma ocorrência. |
| **Confiabilidade** | Evitar múltiplos pins para o mesmo problema e utilizar moderação. |
| **Transparência** | Manter histórico e status das ocorrências. |
| **Privacidade** | Não expor automaticamente a identidade de quem relata problemas. |
| **Acessibilidade** | Construir uma plataforma utilizável por diferentes perfis de usuários. |
| **Encaminhamento** | Facilitar o acesso ao canal oficial responsável pela denúncia. |

---

## Escopo geográfico

Nesta primeira fase, o Voz da Rua será dedicado **exclusivamente ao município de São Paulo — SP**.

As funcionalidades relacionadas a ocorrência utilizarão a localização do usuário como parte das regras de negócio.

### Regra de proximidade

Ações presenciais relacionadas a uma ocorrência exigirão que o cidadão esteja em um raio máximo de:

```text
3 km
```

Essa regra será aplicada inicialmente para:

- criar uma nova denúncia;
- confirmar uma ocorrência com **“Eu também vi”**;
- informar que um problema foi resolvido;
- contribuir para uma possível reabertura.

---

## Como o Voz da Rua funciona

```text
Cidadão identifica um problema
          │
          ▼
Seleciona o local no mapa
          │
          ▼
Sistema procura ocorrências semelhantes
          │
      ┌───┴────┐
      │        │
   Existe    Não existe
      │        │
      ▼        ▼
Eu também   Nova ocorrência
   vi            │
                 ▼
          Foto obrigatória
                 │
                 ▼
         Fila de moderação
                 │
                 ▼
              Validada
                 │
                 ▼
          Publicada no mapa
```

---

# Funcionalidades planejadas

## Autenticação

O acesso ao conteúdo da plataforma será restrito a usuários autenticados.

Está previsto suporte para:

- conta própria Voz da Rua;
- login com Google;
- login com GitHub;
- provedores OIDC/OAuth adicionais, quando necessário;
- recuperação de senha;
- gerenciamento de sessão.

Usuários não autenticados não poderão acessar o mapa, as ocorrências ou a área Social.

---

## Home — Perto de você

Após o login, o usuário será direcionado para a Home.

A Home não será um mapa geral.

Ela será um feed de problemas encontrados em um raio de até **3 km da localização atual do cidadão**.

### Cada card poderá exibir

- mini mapa do local;
- pin da ocorrência;
- nome da rua;
- bairro;
- tipo de problema;
- distância;
- quantidade de relatos;
- status;
- órgão ou canal responsável;
- link oficial para realizar a denúncia;
- ação **“Eu também vi”**.

Exemplo conceitual:

```text
┌──────────────────────────────────┐
│                                  │
│          MINI MAPA               │
│                                  │
│      Rua Serra de Botucatu       │
│              ●                   │
│                                  │
├──────────────────────────────────┤
│ Buraco na via                    │
│                                  │
│ Rua Serra de Botucatu, 500       │
│ Tatuapé                          │
│                                  │
│ 320 m de distância               │
│ 37 pessoas também viram          │
│                                  │
│ [ EU TAMBÉM VI ]                 │
│                                  │
│ Denuncie oficialmente em: SP156  │
│ [ IR PARA O SITE ]               │
└──────────────────────────────────┘
```

---

## Fazer denúncia

A criação de uma nova ocorrência acontecerá em uma área separada da Home.

Essa funcionalidade abrirá o mapa completo.

### Fluxo previsto

1. obter localização atual;
2. verificar se o usuário está dentro da área atendida;
3. permitir seleção do ponto do problema;
4. garantir distância máxima de 3 km;
5. procurar possíveis ocorrências semelhantes;
6. caso já exista, sugerir **“Eu também vi”**;
7. caso não exista, permitir criação;
8. selecionar categoria;
9. adicionar título e descrição;
10. enviar exatamente uma foto;
11. enviar para moderação.

---

## Ocorrências

Uma ocorrência representa um problema real localizado.

```text
1 problema real
=
1 ocorrência principal
=
1 pin no mapa após validação
```

Vários cidadãos podem participar da mesma ocorrência através de relatos.

### Estados previstos

- `PENDENTE_VALIDACAO`
- `VALIDADA`
- `ENCAMINHADA`
- `EM_ANALISE`
- `EM_RESOLUCAO`
- `RESOLVIDA`
- `REJEITADA`
- `DUPLICADA`
- `ARQUIVADA`

A modelagem definitiva desses estados ainda poderá evoluir.

---

## Relatos da comunidade

Uma mesma ocorrência poderá receber relatos de diferentes cidadãos.

Cada usuário poderá participar apenas uma vez da contagem da ocorrência.

Além da confirmação **“Eu também vi”**, poderá ser enviado um pequeno texto opcional.

Exemplo:

> “Passei pelo local hoje pela manhã e o problema continua.”

Os relatos não funcionarão como comentários sociais comuns.

Eles representam participação formal naquela ocorrência.

---

## Evidências

Toda nova denúncia deverá possuir:

```text
1 foto obrigatória
```

Vídeos não fazem parte do MVP atual.

A foto enviada pelo cidadão funcionará como evidência e não será necessariamente publicada diretamente no pin.

Moderadores e administradores poderão definir qual imagem será utilizada publicamente.

---

## Minhas ocorrências

Usuários poderão acompanhar sua participação através de uma área própria.

Ela deverá separar:

- problemas iniciados pelo usuário;
- problemas que ele confirmou.

### Edição

O criador poderá editar a ocorrência durante as primeiras:

```text
12 horas
```

desde que ela ainda não tenha sido validada.

### Exclusão

O criador também poderá excluir durante as primeiras 12 horas.

Se um moderador validar antes do fim desse período:

```text
edição bloqueada
exclusão bloqueada
```

---

## Moderação

O Voz da Rua utilizará moderação humana para validar e organizar ocorrências.

Moderadores poderão:

- visualizar ocorrências pendentes;
- analisar evidências;
- visualizar localização;
- verificar duplicidades;
- validar;
- rejeitar;
- marcar como duplicada;
- editar informações;
- selecionar foto pública;
- resolver;
- reabrir;
- registrar justificativas.

### Alerta de prioridade

Uma ocorrência poderá ser validada desde o primeiro relato.

Entretanto, ao alcançar:

```text
10 relatos de usuários diferentes
```

ela deverá gerar destaque no painel de moderação.

Isso **não significa validação automática**.

---

## Resolução comunitária

Usuários próximos de uma ocorrência poderão informar:

**“Este problema foi resolvido.”**

Regras previstas:

- usuário autenticado;
- usuário não banido;
- distância máxima de 3 km;
- uma confirmação por usuário.

Quando o total ultrapassar:

```text
10.000 usuários diferentes
```

a ocorrência poderá ser marcada automaticamente como resolvida.

Moderadores e administradores poderão resolver uma ocorrência diretamente.

---

## Reabertura

Ocorrências resolvidas poderão voltar a ficar ativas.

Moderadores e administradores poderão reabrir diretamente.

A comunidade também poderá indicar que o problema reapareceu.

Ao atingir:

```text
1.000 novos relatos válidos
```

o sistema deverá gerar um **alerta emergencial de reabertura**.

A reabertura comunitária não será automática: a decisão ficará com a moderação.

---

## Encaminhamento para canais oficiais

O Voz da Rua armazenará a ocorrência dentro da plataforma, mas não substituirá o processo oficial de denúncia.

Quando necessário, o cidadão será direcionado ao canal responsável.

Exemplo:

```text
Problema identificado
       ↓
Categoria detectada
       ↓
Responsável identificado
       ↓
Instruções exibidas
       ↓
Site oficial aberto em nova aba
       ↓
Cidadão conclui a denúncia
```

O sistema poderá mostrar instruções específicas antes do redirecionamento.

---

# Área Social

O projeto também prevê uma área Social separada das ocorrências.

Ela funcionará como um feed de publicações, e não como chat em tempo real.

## Funcionalidades planejadas

- posts;
- comentários;
- curtidas;
- seguidores;
- perfis públicos;
- vinculação opcional de post a uma ocorrência.

### Perfis públicos

Somente usuários que optarem por possuir um perfil público poderão publicar.

Usuários com perfil privado ainda poderão:

- consumir o feed;
- seguir perfis;
- curtir;
- comentar.

Ao tornar o perfil privado novamente, posts antigos deixarão de aparecer publicamente.

---

# Privacidade

A identidade dos cidadãos não será exposta automaticamente nos relatos.

Por padrão:

```text
perfil = privado
identidade no relato = oculta
```

O usuário poderá futuramente optar por:

- tornar o perfil público;
- permitir que seu nome seja exibido em determinados contextos.

A exposição de identidade será sempre **opt-in**.

---

# Banimento

O projeto não utilizará estados separados como “bloqueado” e “banido”.

Existirão inicialmente:

- usuário ativo;
- usuário banido.

Um usuário banido continuará podendo acessar e visualizar a plataforma, mas perderá suas permissões de interação.

### Usuário banido pode

- fazer login;
- visualizar Home;
- visualizar ocorrências;
- visualizar Social;
- visualizar perfis.

### Usuário banido não pode

- denunciar;
- confirmar ocorrência;
- votar resolução;
- publicar;
- comentar;
- curtir;
- seguir;
- contribuir para reabertura.

---

# Perfis internos

## Cidadão

Principal usuário da plataforma.

## Moderador

Responsável pela validação e organização das ocorrências.

## Administrador

Responsável pela administração geral da plataforma.

Haverá somente um nível administrativo.

## Órgãos e responsáveis

No MVP, órgãos públicos e responsáveis privados serão tratados como **destinos de encaminhamento**, não como contas obrigatórias dentro da plataforma.

---

# Painel administrativo

O painel administrativo deverá permitir, futuramente:

### Usuários

- pesquisar;
- visualizar;
- banir;
- desbanir;
- promover moderador;
- remover moderador.

### Ocorrências

- criar;
- editar;
- validar;
- rejeitar;
- arquivar;
- restaurar;
- resolver;
- reabrir;
- remover pins.

### Categorias

- criar;
- editar;
- ativar;
- desativar.

### Órgãos e canais

- cadastrar;
- editar;
- ativar;
- desativar;
- associar categorias;
- definir URLs e instruções.

### Sistema

- parâmetros;
- logs;
- auditoria;
- métricas futuras.

---

# Notificações

O projeto prevê notificações para eventos como:

- ocorrência validada;
- ocorrência rejeitada;
- ocorrência marcada como duplicada;
- mudança de status;
- resolução;
- reabertura;
- decisões relevantes da moderação.

Canais previstos inicialmente:

- notificações internas;
- e-mail.

Push notifications poderão ser consideradas posteriormente.

---

# Segurança e privacidade

Segurança será tratada como requisito de produto, não como etapa posterior.

Diretrizes previstas:

- HTTPS em produção;
- hash seguro de senha;
- controle de acesso por perfil;
- rate limiting;
- validação de entrada;
- proteção contra XSS;
- proteção contra SQL Injection;
- validação de uploads;
- segredos fora do código;
- auditoria de ações administrativas;
- proteção adequada de sessões e tokens;
- minimização de dados pessoais;
- conformidade com princípios da LGPD.

A plataforma não deverá armazenar continuamente o histórico de movimentação dos usuários.

A localização utilizada para validação de proximidade deverá ser tratada separadamente da localização persistente da ocorrência.

---

# Acessibilidade

A acessibilidade faz parte do propósito do projeto e será considerada desde o início.

Objetivos:

- navegação por teclado;
- contraste adequado;
- labels acessíveis;
- textos alternativos;
- compatibilidade com leitores de tela;
- interface que não dependa exclusivamente de cores;
- experiência utilizável em dispositivos móveis.

---

# Integrações previstas

O projeto deverá avaliar ou utilizar integrações para:

### Mapas

- OpenStreetMap ou soluções baseadas em seus dados.

### Geocoding

- endereço → coordenadas;
- coordenadas → endereço.

### Autenticação

- Google;
- GitHub;
- outros provedores OIDC/OAuth.

### E-mail

- recuperação de senha;
- notificações;
- confirmação de conta, se adotada.

### Armazenamento

- object storage para evidências e imagens.

### Órgãos públicos e privados

Inicialmente:

```text
encaminhamento assistido
```

Futuramente, integrações diretas poderão ser avaliadas quando existirem APIs adequadas.

---

# Arquitetura

> **Ainda em definição.**

O projeto está passando por uma etapa deliberada de levantamento de requisitos antes da escolha final de arquitetura e stack.

Essa decisão é intencional.

Antes de definir tecnologias, o objetivo é fechar:

1. requisitos;
2. regras de negócio;
3. fluxos;
4. páginas;
5. MVP;
6. modelo de domínio.

Somente depois serão consolidados:

- arquitetura;
- banco de dados;
- backend;
- frontend;
- infraestrutura;
- observabilidade;
- CI/CD;
- estratégia de deploy.

---

# Estrutura planejada do produto

```text
Voz da Rua
│
├── Identidade e Acesso
│
├── Home / Perto de você
│
├── Localização
│
├── Fazer denúncia
│
├── Ocorrências
│   ├── Relatos
│   ├── Evidências
│   ├── Histórico
│   └── Resolução
│
├── Social
│   ├── Posts
│   ├── Comentários
│   ├── Curtidas
│   └── Seguidores
│
├── Notificações
│
├── Moderação
│
├── Administração
│
└── Encaminhamento
```

---

# Roadmap

## Fase 0 — Produto e requisitos

- [x] Definição inicial do problema
- [x] Definição dos principais perfis
- [x] Definição inicial das páginas
- [x] Regras de localização
- [x] Fluxo inicial de ocorrências
- [x] Regras de moderação
- [x] Home baseada em problemas próximos
- [x] Definição inicial da área Social
- [ ] Revisão com a equipe
- [ ] Fechamento de pontos pendentes
- [ ] Separação entre MVP e fases posteriores

## Fase 1 — UX e domínio

- [ ] Fluxos finais
- [ ] Wireframes
- [ ] Design system
- [ ] Modelo de domínio
- [ ] Casos de uso
- [ ] Contratos principais

## Fase 2 — Arquitetura

- [ ] Definição da stack
- [ ] Banco de dados
- [ ] Backend
- [ ] Frontend
- [ ] Autenticação
- [ ] Storage
- [ ] Infraestrutura
- [ ] Observabilidade
- [ ] CI/CD

## Fase 3 — MVP

- [ ] Autenticação
- [ ] Home / Perto de você
- [ ] Localização
- [ ] Criar ocorrência
- [ ] “Eu também vi”
- [ ] Detalhes
- [ ] Minhas ocorrências
- [ ] Moderação
- [ ] Canais oficiais
- [ ] Administração mínima

## Fase 4 — Comunidade

- [ ] Área Social
- [ ] Perfis públicos
- [ ] Seguidores
- [ ] Comentários
- [ ] Curtidas
- [ ] Notificações avançadas

---

# Status do projeto

O Voz da Rua está atualmente na fase de:

> **levantamento funcional e definição de produto**

Nenhuma stack definitiva deve ser considerada oficial neste momento.

Isso evita que decisões técnicas antigas limitem o novo desenho do produto.

---

# Documentação

A documentação do projeto será organizada progressivamente.

Estrutura sugerida:

```text
docs/
├── product/
│   ├── requirements.md
│   ├── business-rules.md
│   └── roadmap.md
│
├── architecture/
│   ├── overview.md
│   └── decisions/
│
├── api/
│
├── database/
│
└── contributing/
```

O levantamento funcional atual deverá ser convertido e mantido dentro dessa estrutura durante a evolução do repositório.

---

# Contribuindo

O processo de contribuição será documentado quando a arquitetura inicial estiver definida.

Futuramente, o projeto deverá possuir:

- `CONTRIBUTING.md`;
- padrão de commits;
- convenção de branches;
- template de Pull Request;
- templates de Issues;
- guia de ambiente local;
- Code of Conduct.

Enquanto o produto estiver em definição, mudanças de regra de negócio devem ser discutidas antes da implementação.

---

# Idioma

O projeto será inicialmente desenvolvido para:

```text
pt-BR
```

Internacionalização não faz parte do MVP atual.

A arquitetura futura, entretanto, não deverá impedir sua adoção.

---

# Licença

A licença do projeto ainda será definida antes da abertura oficial para contribuições externas.

Até que uma licença seja adicionada ao repositório, **nenhum direito de reutilização deve ser presumido**.

---

# Aviso

O Voz da Rua é uma iniciativa independente.

A plataforma não representa oficialmente a Prefeitura de São Paulo, SP156, Metrô, CPTM, SPTrans, CET ou qualquer outro órgão público ou entidade privada mencionada.

Links, marcas e nomes de terceiros poderão ser utilizados exclusivamente para identificar os canais responsáveis por determinadas solicitações.

---

<div align="center">

## Voz da Rua

**A cidade, vista por quem vive nela.**

Construído para tornar problemas urbanos mais visíveis, organizados e fáceis de encaminhar.

</div>
