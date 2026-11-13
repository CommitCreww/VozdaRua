# Preparação operacional da autenticação — 13/11/2026

Estado: configurações aprovadas implementadas em P05/P06, sem liberação operacional. Fontes: FSD 13.9, 30.0, 34 e 39–40; DT 5.8/12.5/12.6/19/35; contrato interno em CONTRATO_CONTROLES_AUTH.md. As aprovações humanas de 13/11/2026 fecham transporte, quotas, cooldowns e timeouts descritos abaixo. Referências históricas a esses números pendentes estão superadas. Demais decisões/gates permanecem; nenhum envio externo autorizado.

## Parâmetros vigentes aprovados — D05

| Configuração | Valor aprovado / aplicação |
|---|---|
| Transporte | Postmark por API HTTPS; contrato interno de envio preservado |
| Tentativas | Três totais, incluindo claims interrompidos; sem retry adicional no transporte |
| Intervalos | Segunda tentativa 1 min após a primeira falha; terceira 5 min após a segunda |
| Retenção da fila/histórico | 30 dias após conclusão terminal, sem conteúdo sensível; manutenção com role segregada |
| Polling | 5 s entre ticks, inclusive após processamento; sem espera após solicitação de parada |
| Backoff | Teto 60 s; multiplicador continua configuração explícita a validar |
| Alertas | Falhas definitivas e crescimento anormal; limiares, janela, coletor/canal e operação ainda pendentes |

Valores centralizados em `backend/src/config/auth-mail.ts`, `config/auth-rate.ts` e `config/operational-timeouts.ts`. A composição aplica os retries/polling/teto e os defaults aprovados de lease/timeout, exigindo apenas multiplicador explícito. Retenção aprovada aplicada por `purgeAuthMailHistory`, chamado somente com executor de manutenção; sem scheduler novo.

| Timeout vigente | Valor implementado |
|---|---|
| Conexão PostgreSQL | 5 s |
| Consulta PostgreSQL | 10 s no driver e statement_timeout por conexão |
| Lease worker | 60 s |
| Requisição Postmark | 10 s |
| Graceful shutdown | 30 s desde o primeiro sinal |

## Aprovado e implementado

- Postmark é o provedor de produção; Mailpit SMTP é exclusivo do desenvolvimento isolado permitido pelos gates.
- Até três tentativas **totais**, incluindo claims interrompidos, com intervalos progressivos. O limite existente continua no worker e nas constraints; não é um novo parâmetro livre.
- Intenção transacionada no PostgreSQL, processamento fora da transação de negócio, SKIP LOCKED, lease e ACK condicionado ao claim. Nenhum broker/dependência novo.
- Eventos de segurança: 30 dias; auditoria administrativa: 90 dias; logs de aplicação: 7 dias. A retenção de 30 dias da fila é aprovação independente em D05, sujeita à minimização.
- Rate limiting compartilhado por ação/origem/identidade e sessão quando aplicável, cooldown temporário/progressivo, 429 e falha SQL sem autorização implícita. Quotas aprovadas agora são o default da composição; segredo ausente ou override inválido continua bloqueando-a.

## Adaptador HTTPS aprovado para implementação, validação externa pendente

`backend/src/integrations/postmark.ts` implementa a porta existente. Requer explicitamente token do servidor, remetente simples, stream, timeout, renderizador e função fetch. Não lê segredos automaticamente, não possui transporte de rede implícito e não é importado pelo servidor HTTP. Renderização/URLs legais e públicas definitivas permanecem responsabilidade da composição; exemplos dos testes são sintéticos. A composição em `backend/src/composition/auth-mail.ts` prepara o adaptador/worker sem iniciar loop ou fazer chamadas de rede; `run()` explícito é único por raiz de composição.

Segue o [contrato oficial da API de e-mail](https://postmarkapp.com/developer/api/email-api): endpoint fixo `https://api.postmarkapp.com/email`, JSON e header de servidor, stream explícito e tracking desabilitado. Redirects são recusados. Sucesso exige HTTP 200, ErrorCode 0 e MessageID UUID; significa **aceitação pelo provedor**, não entrega comprovada na caixa postal. O resultado interno DELIVERED encerra retries conforme a porta existente, sem alegar confirmação de destinatário.

Conforme os [códigos HTTP oficiais](https://postmarkapp.com/developer/api/overview), 401/404/413/415/422 são classificados como permanentes; 429/5xx, timeout, erro de rede e resposta inesperada como temporários. Corpo de erro externo nunca é propagado/logado. Respostas de sucesso são limitadas a 16 KiB (limite técnico do parser); timeout cobre requisição/leitura, recebe cancelamento do worker e cancela stream ativo. Não há retry interno: somente a fila decide as três tentativas.

O UUID da intenção segue apenas como Metadata de correlação. Não se inventa header de idempotência nem se assume deduplicação do Postmark. Resposta perdida após aceitação pode causar mensagem repetida; tokens anteriores válidos permanecem utilizáveis e de uso único. Essa limitação requer revisão humana do desenho e do comportamento real do provedor antes de habilitar operação. Nenhum envio externo, inclusive com token de teste Postmark, é autorizado por esta preparação.

## Worker separado preparado

`backend/src/workers/auth-mail.ts` oferece `runAuthMailProcess`, raiz de composição destinada a um processo separado do HTTP. Recebe conexão dedicada com role de menor privilégio, transporte, política de entrega, polling e logger. Não executa ao importar, não cria conexão automaticamente e não registra daemon/serviço, cron, script de produção ou defaults de agendamento.

O loop aguarda um job por vez; workers distintos continuam coordenados pelos claims SQL. Sem trabalho ou com erro, espera progressiva até 60 s; após progresso aguarda o polling base de 5 s. O multiplicador é explícito, sem default aprovado. Logger recebe somente eventos fechados, sem exceção, destinatário, token ou payload. SIGINT/SIGTERM impedem novos claims, interrompem espera ociosa e deixam o job corrente concluir antes de fechar SQL/remover handlers. Falha/kill abrupto recupera a intenção pelo lease persistido; ACK antigo não altera claim novo. Nenhuma garantia de exatamente uma entrega de rede é adicionada.

`backend/src/composition/auth.ts` compõe Fastify, pool pg lazy (ou conexão injetada), repositories, store de sessão D03, entrega durável, rate limiting compartilhado e auditoria de segurança. Aplica quotas aprovadas quando não há override; segredo/versões legais/origem ausentes ou inválidos e overrides inválidos são recusados. Não cria schema nem conecta ao preparar. A raiz retorna HTTP sem auth montada; o único método de montagem fornecido é `mountExperimentalHttp()`, restrito a APP_ENV=test e recusado em development/staging/production. O servidor operacional permanece sem montagem. Consulta da sessão é somente `current()` interno: não foi inventada rota GET autenticada.

Timeouts de conexão/consulta e lease/HTTPS já estão implementados com os valores aprovados, inclusive no pool do ensaio SQL. O drain tem prazo de 30 s; worker sinaliza erro fatal minimizado, cancela transporte e impede novo envio/ACK após operação atrasada. HTTP finaliza o processo com erro ao exceder o prazo. Parada normal continua drenando e fechando SQL. Grace de 30 s é menor que o lease de 60 s por aprovação expressa: um claim interrompido pode permanecer recuperável até o lease vencer; não estender o prazo de parada por isso. Bootstrap/supervisor e teste de encerramento efetivo do processo worker no host escolhido continuam necessários para adaptadores que ignorem cancelamento. Não há reconfiguração global do PostgreSQL, nem instalação de serviço nesta execução.

## Configurações adicionais pendentes — propostas NÃO APLICADAS

| Parâmetro aberto | Proposta para aprovação humana | Impacto e validação exigida |
|---|---|---|
| Configuração Postmark | Remetente/domínio confirmado, stream segregado e segredo protegido | Transporte HTTPS agora aprovado; configuração e teste real expressamente autorizado ainda necessários |
| Topologia inicial | Um processo de worker separado; escala via claims SQL | Worker separado preparado; supervisor e limites de CPU/memória ainda precisam de validação |
| Multiplicador do backoff | 2 | Base 5 s/teto 60 s já aprovados; fator 2 permanece apenas proposta/fixture |
| Falha definitiva | Alerta na primeira intenção que entrar em FAILED | Pode exigir agrupamento para evitar ruído; diferenciar erro de configuração, expiração e falha do destinatário |
| Acúmulo | Alerta se PENDING+PROCESSING ≥100 ou intenção pendente mais antiga >5 min, por 5 min | Inicialmente sensível; calibrar ao volume esperado, sem conteúdo/identificadores pessoais no alerta |
| Chave HMAC do rate limit | Segredo aleatório ≥32 bytes compartilhado pelas instâncias; rotação coordenada em janela de manutenção | Rotação altera buckets e pode zerar contadores; procedimento não pode abrir janela de abuso |

`operationalSnapshot()` agora consulta contagens PENDING/PROCESSING/FAILED e idade do pendente mais antigo usando relógio do banco. `createAuthMailMonitor` recebe limiares e sink explícitos e emite sinais de nível AUTH_MAIL_FAILED e AUTH_MAIL_BACKLOG com números agregados. Projeta somente esses campos, sem UUID/payload/destinatário/segredos. Falha da fonte ou sink não é suprimida. Não existe deduplicação/transição ou janela de sustentação implementada; o coletor deve agrupar sinais repetidos e aplicar a política aprovada antes da ativação. Limiares, destino/canal, agrupamento, cadência e janela **permanecem pendentes**; nenhum alerta externo foi enviado/ativado. Scheduler de expurgos também segue pendente.

### Rate limiting: valores APROVADOS e IMPLEMENTADOS

| Operação | Limite (origem / identidade) | Janela (origem / identidade) | Cooldown implementado | Justificativa |
|---|---|---|---|---|
| login | 60 / 10 chamadas | 5 / 15 min | Falhas: 1, 2, 4, 8, 16, 30 s; janela 15 min | Combater credential stuffing preservando margem por NAT; revisar bloqueio temporário dirigido por identidade |
| register | 10 / 3 chamadas | 1 h / 1 h | 15 min após quota excedida | Reduzir criação abusiva/envio e preservar retries legítimos |
| resend | 10 / 3 chamadas | 15 / 15 min | 5 min após quota excedida | Conter disparos de confirmação sem bloqueio permanente |
| forgot | 20 / 3 chamadas | 15 / 15 min | 5 min após quota excedida | Conter abuso de recuperação com resposta antienumeração |
| reset | 30 / 10 chamadas | 15 / 15 min | 5 min após quota excedida | Conter tentativas de consumo; identidade atual é hash do token, não e-mail |

O cooldown é da combinação origem/identidade, nunca flag global da conta. Login progride após nova falha admitida quando o bloqueio anterior venceu; falhas concorrentes durante bloqueio não aumentam contador nem renovam prazo. Nos demais fluxos, a primeira negação por quota inicia o cooldown aprovado; novas negações no bloqueio ativo não o estendem. Janelas de origem/identidade são fixas e nunca estendidas por negações; a recuperação ocorre por expiração. Os buckets contam chamadas, não somente falhas. A quota compartilhada de identidade ainda pode ser consumida por terceiros dentro da janela aprovada: não se promete eliminar DoS dirigido; não ampliar cooldown da combinação para toda a conta. Avaliar NAT/proxy e volumes/abuso legítimos em staging. Origem usa trustProxy=false no app atual; ativar proxy somente com configuração restrita aprovada. Não adicionar sessão por inferência em endpoints pré-login. Configuração aprovada é default da composição; segredo HMAC permanece obrigatório. Fixtures podem injetar políticas explícitas, sem mudar defaults operacionais.

## Sequência para integração efetiva

1. Quotas/cooldowns/timeouts foram aprovados e implementados: não voltam à lista de decisões pendentes. Definir apenas os parâmetros restantes de supervisor, multiplicador de backoff e alertas; validar infraestrutura e revisão humana.
2. Completar bootstrap/supervisor do processo com configuração/segredos segregados, templates/URLs aprovados, role SQL/timeouts e monitoramento; manter rotas HTTP fechadas até validação dos controles. A composição reutilizável e o expurgo explícito já estão implementados.
3. Autorizar teste Postmark segregado, validar aceitação/erros reais e riscos de resposta incerta, revisar segurança humana e atender gates de imagem/staging/relógio. Só então avaliar montagem operacional das rotas.

Não há migration nova: 001–024 preservadas. A execução não conclui P01/P02/P05/P06. DT recebeu D05 e as aprovações expressas posteriores nas seções 5.8/12.6; FSD/PLANO/requisitos funcionais preservados.
