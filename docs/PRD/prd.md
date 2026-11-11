# Voz da Rua — Levantamento Funcional Consolidado

---

## 1. Visão do produto

### 1.1 Objetivo

O **Voz da Rua** é uma plataforma voltada exclusivamente para a cidade de São Paulo, criada para centralizar o registro, descoberta, acompanhamento e encaminhamento de problemas urbanos, estruturais e de acessibilidade em ambientes públicos e privados.

O sistema deve permitir que cidadãos:

- encontrem problemas próximos;
- registrem novos problemas;
- confirmem problemas já existentes;
- acompanhem ocorrências;
- saibam onde realizar a denúncia oficial;
- contribuam com a validação e resolução comunitária;
- participem de uma área social;
- percebam os problemas da própria região e se sintam parte da solução.

---

## 2. Escopo geográfico

O sistema funcionará inicialmente **somente no município de São Paulo — SP**.

Regras:

- ocorrências fora da cidade de São Paulo não poderão ser registradas;
- criação de denúncia exige localização ativa;
- confirmação de problema exige localização ativa;
- confirmação de resolução exige localização ativa;
- ações presenciais ligadas a uma ocorrência exigem distância máxima de **3 km** entre o usuário e o problema.

> A localização serve como mecanismo de redução de abuso, mas não representa prova absoluta de presença física.

---

## 3. Perfis e permissões

### 3.1 Cidadão ativo

Pode:

- fazer login;
- acessar Home;
- visualizar problemas próximos;
- criar denúncia;
- confirmar “Eu também vi”;
- votar que um problema foi resolvido;
- acompanhar ocorrências;
- editar/excluir a própria ocorrência dentro das regras;
- acessar área Social;
- curtir;
- comentar;
- seguir perfis;
- tornar o perfil público;
- publicar caso o perfil seja público;
- acessar canais oficiais de denúncia;
- receber notificações.

---

### 3.2 Cidadão banido

Pode:

- fazer login;
- visualizar Home;
- visualizar ocorrências;
- visualizar detalhes;
- visualizar área Social;
- visualizar perfis públicos.

Não pode:

- criar denúncia;
- confirmar “Eu também vi”;
- votar resolução;
- contribuir para reabertura;
- publicar;
- comentar;
- curtir;
- seguir usuários;
- executar outras ações colaborativas.

O usuário banido funciona como uma conta de **somente leitura**.

---

### 3.3 Moderador

Além das permissões apropriadas de cidadão, pode:

- acessar painel de moderação;
- visualizar ocorrências pendentes;
- visualizar alertas;
- validar ocorrência;
- rejeitar ocorrência;
- marcar como duplicada;
- editar título;
- editar descrição;
- editar categoria;
- definir/alterar foto pública;
- remover pin;
- marcar ocorrência como resolvida;
- reabrir ocorrência resolvida;
- analisar denúncias de falsidade;
- visualizar histórico e evidências;
- registrar justificativas.

Toda alteração relevante deve gerar histórico/auditoria.

---

### 3.4 Administrador

Possui todas as permissões do moderador e também:

- promover usuário a moderador;
- remover função de moderador;
- banir/desbanir usuários;
- criar ocorrência livremente;
- editar qualquer ocorrência;
- remover/arquivar/restaurar ocorrência;
- colocar/remover pins;
- gerenciar categorias;
- gerenciar órgãos e responsáveis;
- gerenciar canais oficiais;
- visualizar logs administrativos;
- gerenciar parâmetros do sistema.

Haverá somente **um nível de administrador**.

---

### 3.5 Órgãos e responsáveis externos

No MVP, órgãos públicos e responsáveis privados **não precisam possuir conta própria**.

Eles serão cadastrados como destinos/canais de encaminhamento.

Exemplos:

- Prefeitura de São Paulo;
- SP156;
- SPTrans;
- Metrô;
- CPTM;
- CET;
- subprefeituras;
- concessionárias;
- estabelecimentos privados;
- universidades;
- shoppings;
- empresas;
- outros responsáveis.

Login próprio para órgãos pode existir futuramente, mas está fora do escopo atual.

---

## 4. Conceitos centrais

### 4.1 Ocorrência

Representa um **problema real localizado**.

Exemplo:

> Buraco na Rua Serra de Botucatu, próximo ao número 500.

Uma ocorrência representa o problema principal e deve existir apenas uma vez no mapa.

---

### 4.2 Relato

É a participação individual de um cidadão ligada a uma ocorrência.

Pode ser:

- relato inicial, que cria a ocorrência;
- confirmação posterior com “Eu também vi”;
- texto opcional ligado à confirmação.

Cada usuário pode participar apenas uma vez da contagem de relatos da mesma ocorrência.

---

### 4.3 Pin

Representação visual da ocorrência validada.

Ocorrências pendentes não aparecem no mapa principal.

Fluxo:

```text
Relato inicial
→ PENDENTE_VALIDACAO
→ análise da moderação
→ VALIDADA
→ pin publicado
```

---

## 5. Navegação principal

Depois do login:

```text
Home / Perto de você
Fazer denúncia
Social
Minhas ocorrências
Notificações
Perfil
```

Moderadores e administradores também verão entradas específicas para suas áreas internas.

---

# 6. PÁGINAS E FUNCIONALIDADES

---

## 6.1 Login

### Objetivo

Permitir entrada na plataforma.

### Acesso

Público.

### Funcionalidades

- login com conta Voz da Rua;
- login com Google via OIDC/OAuth;
- login com GitHub via OIDC/OAuth;
- acesso à criação de conta;
- recuperação de senha;
- exibição de erro de autenticação;
- bloqueio de acesso a páginas internas sem autenticação.

### Campos

- e-mail;
- senha.

### Botões

- Entrar;
- Entrar com Google;
- Entrar com GitHub;
- Criar conta;
- Esqueci minha senha.

### Regras

- usuário banido ainda pode autenticar;
- após login, usuário vai para a Home;
- mapa, Social e ocorrências não são acessíveis sem login.

---

## 6.2 Cadastro

### Objetivo

Criar uma conta própria no Voz da Rua.

### Acesso

Público.

### Campos

- nome;
- e-mail;
- senha;
- confirmação da senha;
- aceite dos termos;
- aceite da política de privacidade.

### Funcionalidades

- validação de e-mail único;
- validação de senha;
- criação de conta;
- aceite obrigatório dos termos;
- definição inicial de perfil privado.

### Regra inicial

O perfil nasce como **privado**.

Confirmação de e-mail ainda poderá ser decidida posteriormente.

---

## 6.3 Recuperação de senha

### Objetivo

Permitir recuperação de acesso para contas próprias do Voz da Rua.

### Funcionalidades

- informar e-mail;
- solicitar recuperação;
- receber link/código;
- definir nova senha;
- invalidar recuperação após uso ou expiração.

Não se aplica da mesma maneira a logins exclusivamente externos.

---

# 7. HOME — “PERTO DE VOCÊ”

## 7.1 Objetivo

Ser a tela inicial após login.

A Home **não é o mapa**.

Ela exibe um feed vertical de ocorrências próximas da localização atual do usuário.

### Regra geográfica

Mostrar problemas em um raio de até **3 km**.

---

## 7.2 Localização

Ao acessar a Home:

- solicitar/consultar localização;
- verificar se localização está disponível;
- carregar ocorrências próximas;
- não permitir ações presenciais caso localização esteja desativada.

O comportamento exato da Home sem localização ainda poderá receber tratamento visual posterior.

---

## 7.3 Card de ocorrência

Cada card deve conter:

### Mini mapa

- pequeno mapa focado na ocorrência;
- pin do problema;
- rua visível;
- sem excesso de informação;
- não precisa ser plenamente interativo.

### Informações

- tipo/categoria do problema;
- nome da rua;
- número, quando disponível;
- bairro;
- distância do usuário;
- quantidade de relatos;
- status;
- canal oficial de denúncia;
- nome do responsável/canal.

### Ações

- **Eu também vi**;
- abrir detalhes;
- ir para site oficial de denúncia.

---

## 7.4 “Eu também vi”

Disponível quando:

- usuário está autenticado;
- usuário não está banido;
- usuário está em até 3 km;
- usuário ainda não confirmou a ocorrência.

Depois:

```text
EU TAMBÉM VI
→
VOCÊ TAMBÉM VIU
```

Pode abrir campo opcional para pequeno texto do relato.

Não exige nova foto.

---

## 7.5 Link oficial

O card deve mostrar o site/canal oficial onde o cidadão deve fazer a denúncia formal.

Exemplo:

```text
Denuncie oficialmente em:
SP156

[ IR PARA O SITE DE DENÚNCIA ]
```

Antes de abrir o site, pode exibir um popup com instruções.

O site oficial abre em nova aba.

O Voz da Rua permanece aberto na aba original.

---

## 7.6 Clique no card

Clicar fora dos botões específicos abre:

**Detalhes da ocorrência**.

---

# 8. FAZER DENÚNCIA

## 8.1 Objetivo

Iniciar um novo relato e, se necessário, criar uma nova ocorrência.

Essa é a área onde o **mapa completo** é aberto.

---

## 8.2 Localização obrigatória

Para denunciar:

- localização precisa estar ativada;
- usuário precisa estar no município de São Paulo;
- ponto informado precisa estar a até **3 km** da localização do usuário.

Se não atender, envio é bloqueado.

---

## 8.3 Mapa

Funções previstas:

- visualizar mapa de São Paulo;
- visualizar posição atual;
- buscar rua/endereço/região;
- clicar no mapa;
- selecionar local do problema;
- confirmar posição;
- verificar distância entre usuário e problema.

---

## 8.4 Verificação de duplicidade

Depois de selecionar o ponto, o sistema deve procurar ocorrências próximas potencialmente semelhantes.

Fluxo:

```text
Seleciona local
→ sistema procura problemas semelhantes
→ encontrou?
```

### Sim

Mostrar a ocorrência existente e incentivar:

**Eu também vi**

### Não

Continuar com criação.

---

## 8.5 Formulário da denúncia

Campos:

- localização;
- categoria;
- subcategoria, quando existir;
- título;
- descrição;
- 1 foto obrigatória;
- data aproximada de observação, se adotada.

### Evidência

- exatamente 1 foto;
- vídeo não faz parte do MVP;
- foto é evidência da denúncia;
- publicação pública da foto depende de moderação.

---

## 8.6 Envio

Nova ocorrência nasce como:

**PENDENTE_VALIDACAO**

Ela ainda não aparece no mapa principal.

Entra na fila da moderação.

---

# 9. DETALHES DA OCORRÊNCIA / PIN

## 9.1 Objetivo

Mostrar o conjunto completo de informações de uma ocorrência.

---

## 9.2 Informações

- categoria;
- título;
- descrição;
- endereço;
- bairro;
- localização;
- mapa;
- foto pública aprovada;
- status;
- quantidade de relatos;
- data de criação;
- data da última atualização;
- canal oficial;
- histórico;
- resolução;
- eventual selo.

---

## 9.3 Abas sugeridas funcionalmente

Sem definir UX final, a tela deve possuir acesso a:

### Informações

Dados principais.

### Relatos da comunidade

Lista dos relatos ligados à ocorrência.

### Histórico

Mudanças de status e ações relevantes.

---

## 9.4 Relatos da comunidade

Pode mostrar textos opcionais como:

> Passei por aqui hoje e o problema continua.

A identidade do autor não aparece por padrão.

Usuários que optaram por exposição pública podem autorizar identificação.

---

## 9.5 Ações

Dependendo do estado:

- Eu também vi;
- Este problema foi resolvido;
- Reportar ocorrência falsa/incorreta;
- ir para canal oficial;
- acompanhar ocorrência;
- acessar post Social vinculado, quando existir.

---

## 9.6 Quantidade de relatos

Pin validado mostra quantidade de cidadãos únicos que confirmaram.

---

## 9.7 Selo de resolução

Se moderador/admin marcar como resolvida:

```text
RESOLVIDO PELO VOZ DA RUA
```

---

# 10. MINHAS OCORRÊNCIAS

## 10.1 Objetivo

Mostrar a participação do cidadão no sistema.

Separar:

- problemas iniciados pelo usuário;
- problemas que ele confirmou.

---

## 10.2 Informações por item

- categoria;
- título;
- endereço;
- bairro;
- status;
- quantidade de relatos;
- data;
- última atualização.

---

## 10.3 Filtros

Previstos:

- status;
- categoria;
- período.

---

## 10.4 Edição

O cidadão pode editar ocorrência própria por até:

**12 horas após a criação**

desde que ela ainda não tenha sido validada.

---

## 10.5 Exclusão

O cidadão pode excluir o próprio relato/ocorrência inicial nas primeiras:

**12 horas**

desde que ainda não tenha sido validada.

Se moderador validar antes:

```text
edição bloqueada
exclusão bloqueada
```

---

# 11. SOCIAL

## 11.1 Objetivo

Área de publicações comunitárias em formato de feed.

Não será chat em tempo real.

---

## 11.2 Quem pode publicar

Somente usuários com:

**perfil público**

Usuário privado pode consumir a área Social, mas não publicar.

---

## 11.3 Post

Pode conter:

- texto;
- imagem, se futuramente aprovado para o escopo;
- data;
- autor;
- ocorrência vinculada opcionalmente.

---

## 11.4 Vinculação com ocorrência

Post pode opcionalmente apontar para uma ocorrência.

Exemplo:

> A situação desta calçada continua complicada.

Vinculado a:

> Calçada sem acessibilidade — Rua X

O post não substitui relato formal.

---

## 11.5 Curtidas

- uma curtida por usuário por post;
- usuário pode remover curtida;
- usuário banido não pode curtir.

---

## 11.6 Comentários

Usuário autorizado pode:

- comentar;
- editar o próprio comentário;
- apagar o próprio comentário.

Moderador/admin pode remover conteúdo inadequado.

---

## 11.7 Seguidores

Usuário pode seguir perfis públicos.

Perfil privado também pode seguir.

Usuário banido não pode seguir.

---

# 12. PERFIL

## 12.1 Objetivo

Gerenciar conta e presença pública.

---

## 12.2 Dados

- nome;
- e-mail;
- data de cadastro;
- método de autenticação;
- situação da conta;
- preferência de perfil público/privado;
- preferência para exibir nome nos relatos.

---

## 12.3 Perfil privado

Padrão.

Pode:

- visualizar Social;
- seguir;
- curtir;
- comentar;
- usar funcionalidades de ocorrência.

Não pode:

- publicar posts próprios.

---

## 12.4 Perfil público

Pode:

- possuir página pública;
- publicar posts;
- ser seguido;
- permitir exposição do nome nos relatos.

---

## 12.5 Voltar para privado

Ao transformar perfil público em privado:

- posts anteriores deixam de aparecer publicamente;
- posts não precisam ser apagados fisicamente;
- política de restauração ao tornar público novamente poderá ser definida depois.

---

# 13. NOTIFICAÇÕES

## 13.1 Objetivo

Informar mudanças relevantes ao usuário.

---

## 13.2 Eventos previstos

- ocorrência validada;
- ocorrência rejeitada;
- ocorrência marcada como duplicada;
- alteração de status;
- ocorrência resolvida;
- ocorrência reaberta;
- decisão de moderação relevante;
- interação Social futura;
- outros eventos relevantes.

---

## 13.3 Canais

MVP:

- notificações internas;
- e-mail quando apropriado.

Push poderá ser fase futura.

---

# 14. DENUNCIAR OCORRÊNCIA FALSA / INCORRETA

## 14.1 Acesso

Tela de detalhes da ocorrência.

---

## 14.2 Motivos previstos

- problema não existe;
- problema foi resolvido;
- localização incorreta;
- conteúdo ofensivo;
- imagem inadequada;
- ocorrência duplicada;
- outro.

---

## 14.3 Fluxo

```text
Usuário reporta
→ denúncia vai para moderação
→ moderador analisa
→ ação é registrada
```

---

# 15. RESOLUÇÃO

## 15.1 Por moderador/admin

Pode marcar como resolvida diretamente.

Obrigatório registrar:

- responsável;
- data;
- justificativa;
- status anterior;
- novo status.

---

## 15.2 Pela comunidade

Usuário pode clicar:

**Este problema foi resolvido**

Regras:

- precisa estar em até 3 km;
- apenas uma confirmação por usuário;
- apenas usuários válidos;
- ao ultrapassar **10.000 usuários diferentes**, status muda automaticamente para RESOLVIDA.

Valor inicial:

```text
10.001 confirmações válidas
→ resolução automática
```

---

# 16. REABERTURA

## 16.1 Manual

Moderador/admin pode reabrir uma ocorrência resolvida.

---

## 16.2 Comunitária

Se o problema reaparecer:

- usuários próximos podem relatar novamente;
- após **1.000 usuários diferentes**, sistema gera **alerta emergencial**;
- ocorrência não reabre automaticamente;
- moderador/admin decide.

---

## 16.3 Ciclos

Uma ocorrência pode possuir ciclos.

Exemplo:

```text
Ciclo 1:
criada → validada → resolvida

Ciclo 2:
problema reaparece → alerta → reaberta → resolvida
```

Contadores de resolução/reabertura devem considerar o ciclo correto.

---

# 17. MODERAÇÃO

## 17.1 Acesso

Somente moderador e administrador.

---

## 17.2 Fila principal

Mostrar ocorrências:

- pendentes;
- denunciadas;
- suspeitas;
- potencialmente duplicadas;
- aguardando análise.

---

## 17.3 Prioridade

A partir de:

**100 relatos de usuários diferentes**

a ocorrência gera alerta de prioridade.

O número não valida automaticamente.

---

## 17.4 Painel de alertas

Pode conter:

- ocorrências com 10+ relatos;
- alertas emergenciais de reabertura;
- denúncias de falsidade;
- conteúdos reportados;
- outros alertas futuros.

---

## 17.5 Análise da ocorrência

Mostrar:

- mapa;
- localização;
- categoria;
- descrição;
- foto;
- relatos;
- evidências;
- possíveis duplicadas;
- histórico.

---

## 17.6 Ações do moderador

- validar;
- rejeitar;
- marcar duplicada;
- editar título;
- editar descrição;
- editar categoria;
- trocar/selecionar foto pública;
- remover pin;
- resolver;
- reabrir;
- registrar justificativa.

---

# 18. ADMINISTRAÇÃO

## 18.1 Usuários

- pesquisar;
- visualizar;
- banir;
- desbanir;
- promover a moderador;
- remover moderador.

---

## 18.2 Ocorrências

- pesquisar;
- criar;
- editar;
- validar;
- rejeitar;
- arquivar;
- restaurar;
- resolver;
- reabrir;
- remover pin.

---

## 18.3 Categorias

- listar;
- cadastrar;
- editar;
- ativar;
- desativar.

---

## 18.4 Órgãos e canais

- cadastrar;
- editar;
- ativar;
- desativar;
- associar categoria;
- definir site;
- definir telefone;
- definir e-mail;
- definir instruções;
- definir área/tipo de atendimento.

---

## 18.5 Parâmetros

Administrar futuramente parâmetros como:

- distância máxima: 3 km;
- alerta de moderação: 10;
- janela de edição: 12h;
- resolução comunitária: >10.000;
- alerta de reabertura: 1.000;
- cidade atendida;
- outros.

---

## 18.6 Logs

Visualizar auditoria de:

- moderação;
- administração;
- alterações relevantes;
- autenticações importantes;
- integrações;
- erros relevantes.

---

# 19. ÓRGÃOS E CANAIS DE DENÚNCIA

## 19.1 Objetivo

Permitir que o Voz da Rua descubra o destino correto de uma denúncia.

---

## 19.2 Dados

- nome;
- público ou privado;
- descrição;
- categorias atendidas;
- site;
- telefone;
- e-mail;
- URL de denúncia;
- instruções;
- ativo/inativo.

---

## 19.3 Encaminhamento assistido

No MVP, o Voz da Rua não faz necessariamente a denúncia oficial.

Fluxo:

```text
identifica problema
→ identifica responsável
→ mostra instruções
→ abre site oficial em nova aba
→ cidadão faz login externo/GOV.BR
→ cidadão conclui a denúncia
```

O relato continua salvo no Voz da Rua independentemente de o usuário concluir o processo externo.

---

# 20. ESTADOS PRINCIPAIS DA OCORRÊNCIA

Previstos:

- PENDENTE_VALIDACAO;
- VALIDADA;
- ENCAMINHADA;
- EM_ANALISE;
- EM_RESOLUCAO;
- RESOLVIDA;
- REJEITADA;
- DUPLICADA;
- ARQUIVADA;
- REABERTA, caso seja útil como status explícito.

Nem toda ocorrência precisa passar por todos os estados.

---

# 21. REGRAS DE NEGÓCIO CONSOLIDADAS

## Localização

- cidade: São Paulo;
- criação: até 3 km;
- “Eu também vi”: até 3 km;
- resolução comunitária: até 3 km;
- reabertura comunitária: até 3 km.

## Evidência

- nova denúncia: exatamente 1 foto;
- confirmação posterior: não exige foto;
- vídeo: fora do MVP.

## Moderação

- pode validar com apenas 1 relato;
- 10 relatos geram alerta;
- 10 relatos não validam automaticamente.

## Edição

- até 12 horas;
- validação antes das 12h encerra edição imediatamente.

## Exclusão

- até 12 horas;
- validação antes das 12h encerra exclusão imediatamente.

## Resolução

- moderador/admin: imediata;
- comunidade: >10.000 confirmações únicas → automática.

## Reabertura

- moderador/admin: direta;
- comunidade: 1.000 novos relatos → alerta emergencial, decisão humana.

## Social

- somente perfil público publica;
- um like por usuário/post;
- comentários editáveis/apagáveis pelo autor;
- perfil privado pode seguir;
- banido somente visualiza.

---

# 22. DADOS PRINCIPAIS QUE O SISTEMA PRECISARÁ REPRESENTAR

Sem definir banco ainda, o domínio terá conceitos como:

- usuário;
- autenticação/provedores;
- perfil;
- ocorrência;
- ciclo da ocorrência;
- relato;
- foto/evidência;
- categoria;
- status;
- histórico;
- moderação;
- denúncia de falsidade;
- órgão/responsável;
- canal de denúncia;
- notificação;
- post Social;
- comentário Social;
- curtida;
- seguidor;
- banimento;
- log de auditoria.

---

# 23. INTEGRAÇÕES PREVISTAS

## Mapas

- OpenStreetMap ;
- mapa de São Paulo;
- mini mapas dos cards;
- mapa completo para denúncia.

## Geocoding

- rua/endereço → coordenadas;
- coordenadas → endereço.

## Autenticação

- conta própria;
- Google;
- GitHub;
- outros OIDC/OAuth se necessário.

## E-mail

- recuperação de senha;
- confirmação de conta, se adotada;
- notificações.

## Storage

- armazenamento da foto da denúncia;
- object storage;
- não armazenar imagem diretamente no banco relacional.

## Órgãos

Inicialmente redirecionamento assistido.

Integração direta via API poderá ser analisada caso a caso futuramente.

---

# 24. REQUISITOS NÃO FUNCIONAIS

## Segurança

-HTTPS em produção;
-Hash seguro de senha;
-Rate limiting;
-RBAC/perfis de acesso;
-Validação de entradas (inputs);
-Validação de uploads (extensão, MIME type e tamanho);
-Proteção contra SQL Injection;
-Proteção contra XSS;
-Proteção contra CSRF;
-Segredos fora do código (variáveis de ambiente);
-Auditoria e logs de segurança;
-Controle de sessão e tokens (expiração, HttpOnly, SameSite);
-Configuração de cabeçalhos de segurança HTTP (HSTS, CSP, X-Frame-Options, nosniff);
-Política restritiva de CORS;
-Tratamento seguro de erros (sem expor stack trace ao usuário);
-Análise de vulnerabilidade em dependências (SCA);
-Backups automatizados do banco de dados e arquivos.

## Desempenho

- consultas geográficas eficientes;
- não carregar toda São Paulo de uma vez;
- paginação;
- limite por região;
- índices geográficos;
- clustering futuro;
- feeds paginados.

## Responsividade

Suporte a:

- desktop;
- notebook;
- tablet;
- smartphone.

## Acessibilidade

- navegação por teclado;
- contraste;
- labels;
- alt text;
- suporte a leitores de tela;
- não depender apenas de cor.

## LGPD

- coletar somente dados necessários;
- identidade privada por padrão;
- localização do usuário não deve ser armazenada continuamente;
- armazenar localização da ocorrência, não histórico de deslocamento;
- política de privacidade;
- termos;
- exclusão/anonimização quando aplicável.

## Logs

Não registrar:

- senha;
- tokens completos;
- segredos;
- dados pessoais desnecessários.

## Backup

- banco de dados;
- metadados;
- arquivos/evidências;
- configurações essenciais.

---

# 25. DIVISÃO FUNCIONAL PARA DESENVOLVIMENTO


## Módulo A — Identidade e acesso

- login;
- cadastro;
- OAuth/OIDC;
- recuperação de senha;
- sessão;
- banimento;
- perfis e permissões.

## Módulo B — Localização e mapa

- localização do usuário;
- validação de São Paulo;
- regra de 3 km;
- mapa completo;
- busca de endereço;
- geocoding;
- mini mapas.

## Módulo C — Ocorrências

- criação;
- foto;
- categorias;
- duplicidade;
- status;
- histórico;
- edição;
- exclusão;
- detalhes;
- relatos;
- “Eu também vi”.

## Módulo D — Home

- feed 3 km;
- cards;
- distância;
- mini mapa;
- paginação;
- botão Eu também vi;
- link oficial.

## Módulo E — Moderação

- fila;
- alertas 10+;
- edição;
- validação;
- rejeição;
- duplicidade;
- foto pública;
- resolução;
- reabertura.

## Módulo F — Resolução comunitária

- voto resolvido;
- regra de 3 km;
- unicidade;
- contador;
- resolução automática >10.000;
- ciclos;
- reabertura 1.000;
- alerta emergencial.

## Módulo G — Social

- perfil público;
- posts;
- feed;
- vincular ocorrência;
- curtidas;
- comentários;
- seguidores;
- moderação social.

## Módulo H — Notificações

- notificações internas;
- leitura;
- eventos;
- e-mail.

## Módulo I — Administração

- usuários;
- moderadores;
- categorias;
- órgãos;
- canais;
- parâmetros;
- logs.

## Módulo J — Encaminhamento

- associação categoria → responsável;
- instruções;
- popup;
- link oficial;
- abertura em nova aba;
- futuras integrações.

---

# 26. PONTOS AINDA NÃO FECHADOS

Itens que ainda precisam de decisão da equipe:

- confirmação por e-mail no cadastro;
- subcategorias obrigatórias ou opcionais;
- campos exatos editáveis pelo cidadão;
- formato da exclusão dentro das primeiras 12h;
- política de restauração de posts ao tornar perfil público novamente;
- conteúdo exato permitido nos posts sociais;
- imagem em posts sociais;
- limite de caracteres de posts;
- limite de caracteres de comentários;
- se comentários sociais podem receber respostas;
- notificações de seguidores/curtidas/comentários;
- ordenação do feed Home;
- ordenação do feed Social;
- filtros exatos da Home;
- filtros exatos de Minhas ocorrências;
- política detalhada para fotos com rostos/placas;
- política de moderação do Social;
- política de denúncia de posts/comentários;
- se usuário pode deixar de seguir;
- se usuário pode remover confirmação “Eu também vi”;
- se usuário pode remover voto de resolução;
- como tratar denúncia inicial apagada quando outros usuários já confirmaram;
- regra exata de detecção de duplicidade;
- status técnico definitivo da reabertura;
- como tratar ocorrência sem canal oficial conhecido;
- quais categorias existirão no lançamento;
- quais órgãos/canais serão cadastrados no lançamento;
- política exata de anonimização/exclusão de conta;
- métricas e analytics do painel administrativo.

---

# 27. PRINCÍPIO GERAL DO PRODUTO

O Voz da Rua deve separar claramente quatro tipos de conteúdo:

```text
OCORRÊNCIA
→ problema real da cidade

RELATO
→ participação formal do cidadão em uma ocorrência

POST SOCIAL
→ conteúdo da área Social

COMENTÁRIO SOCIAL
→ conversa ligada a um post
```

Essa separação deverá ser preservada na modelagem futura.

---

# 28. EVOLUÇÃO FUTURA — ACOMPANHAMENTO E TRANSPARÊNCIA DAS DENÚNCIAS OFICIAIS

> **FORA DO ESCOPO DO MVP.** Esta seção registra uma proposta para versões futuras do Voz da Rua. Não representa requisito obrigatório, integração implementada ou funcionalidade prevista para a primeira entrega.

## 28.1 Objetivo

Permitir que a comunidade acompanhe, de forma transparente, os desdobramentos de denúncias encaminhadas aos órgãos ou responsáveis competentes, especialmente quando uma ocorrência tiver muitos relatos ou confirmações de cidadãos.

## 28.2 Funcionalidades propostas

- Exibir respostas e manifestações dos órgãos ou responsáveis sobre a denúncia, quando disponibilizadas ou registradas com fonte verificável.
- Registrar prazos informados oficialmente para vistoria, obra, reparo ou manutenção.
- Mostrar a contagem de dias até o prazo anunciado e sinalizar quando ele estiver vencido, sem presumir que a atividade foi concluída.
- Acompanhar atualizações sobre atividades no local, andamento de obras e serviços de manutenção.
- Organizar um histórico cronológico com respostas, compromissos, mudanças de prazo e evidências de execução.
- Dar visibilidade comunitária a ocorrências com muitos relatos, sem confundir popularidade ou quantidade de confirmações com uma resposta oficial.

## 28.3 Transparência e confiabilidade

- Diferenciar claramente **informações oficiais**, **relatos da comunidade** e **atualizações da moderação**.
- Exibir a origem e a data de cada resposta, prazo ou atualização.
- Não apresentar prazos estimados como compromissos assumidos pelo órgão responsável.
- Não afirmar que uma denúncia foi oficialmente protocolada, recebida ou respondida sem confirmação verificável.

## 28.4 Dependências e decisões futuras

A equipe deverá avaliar a disponibilidade de protocolos, consultas públicas, APIs, integrações ou processos manuais para obtenção de respostas oficiais; a viabilidade de associar protocolos a ocorrências; a forma de comprovar atualizações e os critérios de exibição de progresso.

**Limite do MVP:** permanece válido o encaminhamento assistido descrito na seção 19.3. O Voz da Rua indica o canal oficial e mantém o relato na plataforma, mas não garante acompanhamento automático de protocolos, respostas de órgãos, prazos ou execução de serviços.

---
