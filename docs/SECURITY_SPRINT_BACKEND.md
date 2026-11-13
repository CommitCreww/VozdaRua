# Security Gate — incremento de backend de 12/11/2026

Escopo: persistência de conta/sessão/reset, migration 020, recuperação HTTP não montada no servidor e infraestrutura local de testes. PASS abaixo é limitado à evidência local descrita, não aprova integração/merge/release. Gates reais incompletos ficam FAIL; nenhum scanner ausente é considerado aprovado. Revisão humana reforçada permanece obrigatória.

| SEC | Estado | Aplicabilidade/evidência |
|---|---|---|
| 001–003, 006, 008, 010 | N/A | Sem novos endpoints privados, listagens, operações comunitárias ou administrativas; reset público preserva status/papel |
| 004–005, 007 | PASS local | Identidade deriva do token; DTO fechado recusa IDs/papel; teste preserva sessão de outra conta; isolamento SQL real pendente em 122 |
| 009 | PASS | Teste confirma 404 para auth/reset no app operacional |
| 011 | PASS local | Argon2id D04; hash no contrato SQL; teste troca senha e verifica hash, sem senha em resposta/log |
| 012–013 | FAIL operacional | Rate gate simulado, sem limitador/cooldown persistente; impede exposição |
| 014 | PASS local | Respostas forgot iguais para conta local, externa e ausente; sem alegar igualdade temporal de entrega externa |
| 015 | PASS local | CSPRNG/hash/TTL/replay/tipo e erro sem consumo testados; atomicidade real pendente em 122 |
| 016–019 | PASS local | Cookies/CSRF/logout existentes exercitados; IDs novos e revogação de duas sessões no cenário simulado; store SQL preparado sem aprovação operacional |
| 020 | N/A | OAuth não implementado neste incremento |
| 021–022 | PASS revisão | Parâmetros para valores; SQL estrutural fixo. DDL da fixture usa nome de role fixo e segredo aleatório via parâmetro/set_config/format %L |
| 023–040 | N/A | Sem entrada enviada a shell/código/HTML/XML, fetch, redirect ou webhook novos; porta de entrega ainda não implementa transporte |
| 041–050 | N/A | Sem upload/storage novo; única alteração de imagem corrige tipo da fixture EXIF e comprova metadado de entrada |
| 051 | PASS local | DTO e política de senha no Service; campos adicionais/tipos/tamanhos inválidos testados |
| 052–054 | N/A | Nenhuma regra geográfica nova |
| 055–058 | FAIL integrado | Constraints e transações/locks preparados; testes reais de rollback, unicidade/replay/concorrência não executados |
| 059–060 | PASS local | Falha de persistência/entrega não retorna sucesso; cliente não escolhe estado/papel/owner/datas |
| 061–062 | PASS local | Gitleaks nos arquivos alterados/novos; ambientes/artefatos ignorados; histórico completo não certificado |
| 063 | FAIL | CI de secret scanning completa ainda não executada |
| 064–065 | N/A | Nenhum incidente de segredo confirmado ou alteração de HTTPS/deploy |
| 066–067 | PASS | Argon2id e SHA-256/CSPRNG existentes reutilizados; sem algoritmo próprio |
| 068, 070 | PASS local | Token só no corpo/porta de entrega, hash no limitador; respostas/logs genéricos; segredos não adicionados a URL |
| 069, 071–074 | N/A | Sem backup/frontend/PWA/CSP alterados |
| 075 | PASS local | CORS restritivo existente preservado; testes de fundação continuam passando |
| 076–080 | N/A | Frontend, links externos, push e cache não alterados |
| 081–083 | PASS local | Testcontainers oficial, versão exata 12.2.1/lockfile; origem npm/GitHub verificada; npm ci isolado e import no Node 26 passaram |
| 084–085 | PASS no limiar High | Audit completo: 0 Critical/High e **7 moderadas** transitivas de desenvolvimento; produção: 0 reportadas. Moderadas registradas, sem correção forçada/downgrade major |
| 086–087 | N/A neste diff | Sem Actions/imagens novas executadas; FAIL de imagens P01 continua vigente, allowlist SQL vazia |
| 088 | PASS revisão | Comandos/SQL inspecionados; sem executar imagem bloqueada; teste de digest recusado antes de startup |
| 089 | FAIL | Revisão humana independente de auth, SQL, migration, grants e dependências ainda não realizada |
| 090 | N/A | Sem auto-merge ou atualização major de dependência existente |
| 091 | FAIL operacional | Limites concretos de reset/auth ainda ausentes |
| 092 | N/A | Sem listagem/raio novo |
| 093–094 | PASS local | Body limit existente e DTO fechado; regex simples, tamanho fixo de token, política 15–128; suíte HTTP passou |
| 095 | N/A | Nenhuma chamada externa nova implementada |
| 096 | PASS local | Erros SQL/SMTP sintéticos não aparecem nas respostas |
| 097 | FAIL operacional | Auditoria/eventos de segurança e alertas ainda não integrados |
| 098 | PASS local | Fundação health/ready preservada, testes existentes passaram; readiness real continua pendente |
| 099–100 | FAIL integrado | Restore, abuso/alertas e staging não executados; nenhuma aprovação de produção |
| 101–104 | FAIL operacional | Rate limiting multicamada/cooldown/lockout persistentes ainda não implementados |
| 105–107 | N/A | Nenhuma operação privilegiada/MFA liberada |
| 108–109 | FAIL integrado | Fixture prepara credencial app sem DDL e separada do bootstrap; não executada em PostgreSQL real |
| 110–113 | N/A operacional | Storage/rede/serviços existentes não alterados. Fixture futura usa loopback, sem socket/privileged/Ryuk/volumes existentes; não executada |
| 114 | PASS local | Erros novos usam envelope seguro e handler existente |
| 115 | N/A | Sem lançamento/WAF |
| 116 | PASS revisão | Nenhum controle removido para compensar WAF/infra |
| 117–118 | N/A | Sem incidente de rotação ou honeytokens novos |
| 119 | PASS revisão | Sem honeypot, tarpit ou ambiente falso |
| 120–121 | PASS local | Testes na entrega; Vitest/fastify.inject, fontes/testes typechecked |
| 122 | FAIL | Oito casos Testcontainers preparados, **skipped**, sem imagem aprovada; migrations 018–020 não aplicadas nesta sessão |
| 123 | PASS local | Payload/ID indevido, token inválido/tipo errado e outra conta preservada; prova SQL entre usuários segue pendente |
| 124 | PASS local | Regressão de login reproduzida intencionalmente: 200 indevido; corrigida para 401 sem cookie |
| 125 | FAIL revisão | Casos derivados do FSD/checklist; revisão humana dos testes gerados ainda pendente |

A soma desses estados **não autoriza registrar rotas no app, promover imagens ou declarar fases concluídas**. D03/D04 são aprovações posteriores já registradas na DT 5.6 e STATUS; os avisos antigos do FSD sobre essas decisões permanecem histórico documental, sem nova escolha nesta sessão. Nenhum conflito funcional novo foi resolvido por inferência.

## Atualização de 12/11/2026 — gate PostgreSQL/libxml2

A tarefa específica de remediação produziu candidata source-review com PG17.12/PostGIS3.6.4 e libxml2 retroportada. Receitas e evidências constam de [REMEDIACAO_P01.md](REMEDIACAO_P01.md). As classificações abaixo atualizam os itens afetados por esta tarefa, preservando os registros históricos acima.

| SEC | Estado atual e evidência |
|---|---|
| 061–062 | PASS local, Gitleaks da receita experimental sem achados e relatórios brutos em `.local` ignorada. Histórico Git completo fora dessa medição |
| 081–083 | PASS na origem fixada, patch GNOME conferido por hunks/checksum, source Debian exato e APT trixie assinado. A reprodutibilidade bit a bit de dependências futuras não foi demonstrada |
| 084 | PASS na execução npm audit, com 7 moderadas de dev e zero reportadas em produção |
| 085, 087 | **FAIL**, Trivy 0.76.2 executado e reportou 5 Critical/167 High, 62 CVEs distintas. Patch libxml2 presente, CVE ainda reportada e validação incompleta. UAF libxml2 e FlatGeobuf PostGIS permanecem bloqueantes |
| 088 | PASS local na inspeção de comandos/builds, sem avaliação de inputs de usuário como código. Dockerfile recompila apenas source fixado e pacote patchado |
| 089 | FAIL para promoção, revisão humana de imagem/retroporte/findings pendente |
| 108–113 | N/A para nova execução de banco/rede, gate impediu iniciar PostgreSQL. Isolamento/privilégios/persistência do novo candidato ainda não comprovados |
| 120 | PASS para verificações próprias de configuração/sintaxe e suíte backend. Validação da biblioteca FAIL com 508 testes/1 erro/0 leaks por fixtures ausentes. Pré-condição de fixture continua falhando |
| 121 | PASS local na suíte HTTP existente, reexecução serial 74 PASS/8 skipped após dois timeouts na primeira execução concorrente |
| 122 | **FAIL**, oito testes PostgreSQL e migrations 001–020 não executados, imagem experimental sem aprovação |
| 124 | N/A para bugfix de aplicação nesta tarefa. Correção de biblioteca exige completar regressão específica e suíte upstream antes de aprovação |
| 125 | FAIL para revisão independente, evidências disponíveis para análise humana |

Os controles operacionais de autenticação continuam pendentes, incluindo rate limiting persistente, cooldown, entrega durável de e-mail e auditoria. A allowlist SQL permanece vazia. Nenhum resultado desta tarefa aprova exposição de rotas ou conclusão formal de fase.
