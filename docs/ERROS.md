# Problemas e tratamentos — Voz da Rua

Registros de 12/11/2026 referentes à P00 autorizada. Nenhum registro contém valor de segredo. Pendências futuras não autorizam implementação fora da fase atual.

| ID | Problema / evidência | Impacto | Tratamento nesta entrega | Estado / próxima ação |
|---|---|---|---|---|
| P00-001 | Caminhos curtos do PRD/FSD/Design não existem; conteúdos estão em subpastas. PLANO/Home apontam para o antigo `Desing-rules.md` | Consulta documental e dois links quebrados em fontes aprovadas | Fontes reais acessíveis em AGENTS, README e PREPARACAO; nenhuma cópia/renomeação ou edição das fontes | Parcial: consulta desbloqueada; correção dos dois links depende de atualização documental autorizada. D01 não impede P00 |
| P00-002 | AGENTS existente com zero bytes | Ausência de instruções operacionais | Preenchido exclusivamente com stack/regras documentadas e obrigações de progresso/testes/segurança | Resolvido na P00 |
| P00-003 | Sem `.gitattributes`; ignore não cobria dependências, builds, chaves ou dados locais | Risco de artefatos/segredos candidatos ao Git e scripts com finais de linha inadequados | Adicionados padrões específicos; SQL/lockfiles/exemplos continuam versionáveis; LF e binários verificados | Resolvido na P00; sem renormalizar arquivos históricos |
| P00-004 | `.env.example` tinha senha genérica pronta | Incentivo à reutilização de valor fraco de exemplo; não é evidência de vazamento de credencial real | Campo vazio, comentário orientando senha exclusiva e preservação do `.env` existente | Resolvido na P00; ambiente novo exige preenchimento em P01 |
| P00-005 | Node local 24.11.0 difere do 26 LTS aprovado | Runtime de desenvolvimento futuro | Diferença registrada sem instalar runtime ou trocar tecnologia | Pendente P01 (D13); não impede P00 |
| P00-006 | Gitleaks e Trivy não encontrados no PATH | Varredura especializada indisponível | Executada inspeção local por padrões e comparação com segredos locais sem imprimir valores; nenhum achado | Limitação registrada; scanners/CI nas fases responsáveis. Não declarar histórico inteiro ou scanner especializado aprovado |
| P00-007 | P26 exige evidências em staging; P32 prepara staging e depende transitivamente de P26 | Dependência circular implícita futura | Evidência preservada em PREPARACAO/STATUS, sem alterar PLANO | Pendente antes dessas fases: ajuste de planejamento autorizado, sem eliminar testes |
| P00-008 | README ainda descrevia stack/roadmap em definição | Orientação desatualizada para iniciar trabalho | Aviso inicial aponta para decisões aprovadas e guia P00; texto original preservado integralmente | Orientação atual resolvida; atualização editorial do conteúdo histórico pode ser tratada depois |
| P00-009 | Criação em lote de placeholders não retornou; 13 já existiam ao verificar. Node não pôde criar subprocessos Git (EPERM) durante validação | Ferramentas locais da preparação, sem efeito funcional | Interrompida a espera; completados somente oito placeholders ausentes, sem sobrescrever. Git foi orquestrado por PowerShell e resultados passados à inspeção Node | Resolvido: 21 pastas verificadas e validação local passou |
| P00-010 | DT §43/FSD §64 divergem sobre precedência; outros pontos continuam expressamente abertos | Decisões de módulos futuros | Proibida resolução silenciosa em AGENTS; D02–D15 preservadas no plano/guia | Tratar conflito concreto/decisão antes da parte afetada, sem bloquear P00 independente |

As alterações locais anteriores no FSD e a substituição de nome do Design foram preservadas. Migrations 001–017, runners, Compose e `.env` não foram modificados. Esta entrega não executa correções de regras de negócio nem resolve ambiguidades por suposição.

## 12/11/2026 — Execução P01

| ID | Problema / diagnóstico | Correção aplicada / resultado | Estado |
|---|---|---|---|
| P01-001 | Docker Engine inacessível: pipe dockerDesktopLinuxEngine ausente; CLI instalado | Iniciado Docker Desktop instalado, sem instalação/alteração de configuração. Engine 29.2.1 acessível. Políticas de restart iniciaram também containers antigos; nenhum dado deles foi usado nos testes | Resolvido |
| P01-002 | Rede/download bloqueados no sandbox (proxy local indisponível); primeira consulta PowerShell tratou array JSON como objeto único | Downloads oficiais executados com acesso autorizado; manifesto parseado como array. Node 26.13.1 LTS/npm 11.20.0 preparados portavelmente, checksum conferido e executados | Resolvido; não houve rejeição de aprovação automática |
| P01-003 | Identidade de bootstrap anterior seria superusuário para tráfego normal; app/migrator ainda inexistentes | Bootstrap operacional separado; migrator não superusuário, extensões preparadas administrativamente e app com allowlist. Testes reais confirmaram DML e negação de DDL/TEMP/escrita de auditoria/ledger | Resolvido no banco isolado; nenhuma role/privilege do banco anterior alterada |
| P01-004 | Seed original sem bloqueio explícito de ambiente no ponto de entrada | Wrapper exige development, opt-in e marcador no banco; profile separado. Produção/default recusados; positivo/idempotência passaram | Resolvido, preservando seed/runner originais |
| P01-005 | Bridge interna sem gateway retornou ECONNREFUSED do host ao SMTP no Docker Desktop | Rede dev bridge com publicações exclusivamente loopback; SMTP/API e TCP PostgreSQL do host passaram. Nenhum relay configurado | Resolvido e retestado |
| P01-006 | Tentativa de redução de privilégios usou opção `setpriv --reuid` não disponível no BusyBox da imagem | Substituída por initializer isolado sem rede para ownership do volume e Mailpit com `user: 1000:1000`, readonly/cap_drop ALL. Healthcheck e SMTP passaram | Resolvido; tentativa inválida removida da configuração final |
| P01-007 | Após alteração da rede, Compose manteve endpoint do db sem alias `db` (Aliases null); bootstrap falhou em DNS | Inspecionado endpoint e recriado somente db do projeto P01 com o mesmo volume. Alias restaurado; dados mantidos e bateria completa de 24 checks passou | Resolvido; nenhum reset/remoção de volume |
| P01-008 | Varredura complementar Scout da imagem PostGIS reportou 57 findings: 6 Critical/51 High; tag 17-3.6 sem atualização segundo upstream | Findings preservados em SARIF ignorado e resumidos no guia; sem exceção/falso positivo automático. Serviço novo parado após testes | **Bloqueia conclusão/merge:** remediar mantendo stack aprovada e repetir scan/testes |
| P01-009 | Mailpit 1.33.1 reportou 2 High no Scout: CVE-2023-42821/CVE-2026-107891 | Relatório preservado; hardening não usado como dispensa do gate. Serviço novo parado após testes | **Bloqueia conclusão/merge:** build corrigido/triagem e novo scan |
| P01-010 | MinIO oficial comunitário arquivado/sem manutenção; GHSA-hv4r-mvr4-25vw High afeta releases comunitários e aponta correção em AIStor | Não instalada imagem legada vulnerável nem substituto. Overlay exige imagem/credenciais revisadas e recusa configuração ausente | **Bloqueia storage/P01:** decisão técnica de distribuição/origem corrigida, revisão de licença/imagem; testes funcionais pendentes |
| P01-011 | Gitleaks ausente do PATH na P00; Trivy não instalado | Gitleaks 8.30.1 oficial baixado com checksum para .tools; candidatos Git inspecionados com --redact, zero achados. Scout já instalado usado como complemento | Gitleaks local resolvido; Trivy/CI não executados nem declarados aprovados |
| P01-012 | Scout gerou avisos de limpeza de arquivo temporário em uso no Windows; os dois relatórios SARIF foram gravados e são parseáveis | Relatórios analisados pelos resultados/rules; nenhum arquivo temporário do sistema removido manualmente | Limitação do scanner registrada; sem afetar os findings reportados |
| P01-013 | `docker top` com campos USER/COMM não incluiu PID e retornou erro de formatação | Não usado como evidência do usuário do processo PostgreSQL. Apenas usuário `postgres` existente foi inspecionado; não declarar medição do processo por esse comando | Verificação opcional não concluída; Mailpit UID 1000 foi efetivamente comprovado por exec |
| P01-014 | Git Bash não pôde criar pipe de sinais dentro do sandbox Windows (Win32 error 5) | Checagem `bash -n` repetida com acesso autorizado, sem executar scripts de runtime; sintaxe Bash e Node aprovadas. Parser PowerShell também passou | Resolvido; nenhuma mudança de configuração do sistema nem rejeição da aprovação automática |

A migration inválida intencional foi um teste de infraestrutura em fixtures ignoradas: rollback confirmado, 17 migrations mantidas e arquivo seguinte não aplicado. Nenhum campo/tabela de domínio adicional ficou no banco. Migrations 001–017, runners originais, seed, `.env` original e documentos aprovados permaneceram intactos. `compose.yml` foi alterado somente como configuração dev autorizada da P01.

Nenhum commit, push, deploy ou P02 executado. Fontes oficiais dos bloqueios e instruções em [AMBIENTE_P01.md](AMBIENTE_P01.md). Os registros anteriores descrevem seu próprio momento e permanecem preservados.


## 12/11/2026 - Delimitacao dos bloqueios P01

Revisados os 59 findings originais e verificadas atualizacoes oficiais: tags continuam nos mesmos digests. Nenhuma correcao de runtime comprovada; sem supressao, mudanca de versao principal, dados ou P02. Matriz individual e alternativas MinIO em [REMEDIACAO_P01.md](REMEDIACAO_P01.md). Relatorios anteriores preservados; novos scans em .local/p01-remediation-*.json. Testes funcionais/persistencia nao reexecutados nesta delimitacao sem alteracao das imagens; os 24 PASS anteriores permanecem historicos. P01 continua parcialmente concluida, com remediacao/build e validacao ainda pendentes.

## 12/11/2026 - Remediacao tecnica experimental P01

| ID | Problema / diagnostico | Correcao aplicada e evidencia | Estado |
|---|---|---|---|
| P01-R01 | Base PostGIS 17-3.6 sem update; Go 1.24.6 no gosu e apt/zlib antigos | Base oficial PostgreSQL 17 atualizada a 17.12, PostGIS 3.6.4 PGDG fixado, gosu 1.19 recompilado com Go 1.26.9. Imagem final achatada removeu binario antigo das camadas escaneadas; Scout reduziu 57 para 20. 24/24 testes em novo volume | **Pendente:** 2 Critical e 18 High reportados, sem supressao ou aprovacao |
| P01-R02 | `libmariadb3` 11.8.6 entra por `libgdal36`, dependencia do PostGIS PGDG; scanner reporta 9 CVEs MariaDB, 2 Critical | Pacote e cadeia de dependencias confirmados; nao ha servidor MariaDB. Advisories upstream dos dois Critical descrevem funcoes do servidor e fix 11.8.9, ainda indisponivel no indice Debian consultado. Nenhuma biblioteca removida a forca | **Pendente:** triagem formal de aplicabilidade e demais High ou pacote realmente corrigido |
| P01-R03 | Docker Scout continuou marcando 34 CVEs de Go 1.24.6 apos substituir `/usr/local/bin/gosu` | Binario executado confirmou Go 1.26.9; imagem experimental achatada eliminou os 34 findings no novo scan. Nao foi usado ignore/supressao | Resolvido no candidato final; imagem principal inalterada |
| P01-R04 | Docker build Go falhou em TLS ao baixar modulos; teste Compose PowerShell aguardou container e tratou NOTICE do psql como erro | Modulos baixados do proxy oficial no host para cache local, hashes `go.sum` validados sem desabilitar TLS. Verificador ajustado com `run -T` e progresso quieto; NOTICE silenciado apenas no override experimental com `PGOPTIONS`. Bateria 24/24 passou | Resolvido na validacao experimental |
| P01-R05 | Mailpit Alpine 3.24 musl 1.2.6-r3; indice oficial ainda ofertou r3 apesar de fix r6 reportado | Binario Mailpit estatico v1.33.1 copiado para `scratch`; musl ausente, Scout 2 High -> 1 High. SMTP/API e persistencia passaram; Dockerfile versionavel criado | Corrigida CVE da musl no candidato; imagem principal/initializer inalterados |
| P01-R06 | Scout ainda reporta CVE-2023-42821 em gomarkdown do Mailpit | Go Vuln DB fixa em commit 14b1601; API GitHub confirmou commit instalado a51d70b descendente do fix. Finding preservado e classificado com evidencia como falso positivo de faixa | Pendente revisao humana do gate High antes da promocao |
| P01-R07 | MinIO Community sem patch mantido; AIStor Free exigiria licenca e limita recursos | Avaliados advisory, licenca, container, S3 e requisitos oficiais. Free sem criptografia em repouso, replicacao ou suporte; licenca expirada bloqueia escrita/S3. Nenhuma instalacao ou configuracao | **Pendente decisao humana** de licenca/distribuicao e adequacao da VPS; storage P01 nao testado |

Detalhes, digests, CVEs, links oficiais e classificacao dos bloqueios em [REMEDIACAO_P01.md](REMEDIACAO_P01.md). Nenhum volume ou dado existente foi removido; nenhum documento tecnico aprovado ou migration foi alterado.

## 12/11/2026 - Verificacao final de prontidao P01

| ID | Problema / diagnostico | Evidencia e tratamento | Estado |
|---|---|---|---|
| P01-R08 | 20 findings ainda reportados na imagem PG/PostGIS candidata | Triagem individual em REMEDIACAO: MariaDB servidor ausente (9, incluindo 2 Critical), GSS-RPC/kadmind/KDC ausentes (6); libxml2/Expat/Poppler presentes. APT trixie nao ofereceu versoes novas para os cinco pacotes consultados. Nenhum finding suprimido | **Bloqueio de gate:** CVE-2026-86140 libxml2 pode ser alcancavel por funcao XML PostGIS; aplicabilidade nao excluida. Revisao humana dos demais findings pendente |
| P01-R09 | Scout persiste em marcar CVE-2023-42821 no Mailpit candidato | `go version -m` do binario confirmou versao exata do modulo; API oficial GitHub confirmou commit instalado descendente do fix 14b16010c2ee. SARIF preservado | Classificacao tecnica: nao aplicavel ao binario; promocao segue sujeita a revisao humana do gate e do initializer |
| P01-R10 | PoC AIStor Free requer licenca legitima que nao foi localizada | Confirmados requisitos oficiais, recursos Docker locais e manifesto remoto da release corrigida. Sem licenca no workspace/ambiente, nenhum pull/container/S3/scan executado | **Bloqueia criterio MinIO da P01.** Disponibilizar licenca legitima para PoC ou decidir distribuicao/licenca; sem contorno |

Historico anterior preservado. Nenhum volume, migration, documento aprovado, imagem principal ou servico de producao foi alterado nesta verificacao. P02 nao iniciada.

## 12/11/2026 - P02 categoria A

| ID | Problema | Tratamento / resultado |
|---|---|---|
| P02-A01 | `npm view` demorou e `npm ping` falhou com `UNABLE_TO_VERIFY_LEAF_SIGNATURE` no Node portatil | Consultadas versoes no registro oficial por HTTPS. Para npm local, `NODE_OPTIONS=--use-system-ca` somente no processo restaurou TLS verificado; sem `strict-ssl=false` ou alteracao global. `npm install` gerou lockfile |
| P02-A02 | Primeira compilacao apontou assinatura incorreta de `genReqId` e tipo `unknown` do erro | Corrigido callback de UUID e tratamento de status sem expor mensagem/SQL. Typecheck/build PASS |
| P02-A03 | Vitest nao conseguiu criar worker no sandbox Windows (`spawn EPERM`) | Reexecutado com permissao de subprocessos; **6/6 testes PASS**. Nao declarado aprovado antes da reexecucao |
| P02-A04 | Fastify avisou deprecacao do `disableRequestLogging` no nivel superior | Usado `LogController` oficial; logs de request agora registram ID/status sem URL. Testes/typecheck/build PASS |

Nenhum problema da P01 foi resolvido por estas mudancas. Readiness/pool/integracao de banco nao implementados nesta autorizacao; P02 permanece parcial.

## 12/11/2026 - Triagem de assinatura de imagens (preparatorio P14)

| ID | Problema | Diagnostico e correcao | Resultado |
|---|---|---|---|
| P14-P01 | O primeiro teste parametrizado falhou com `undefined is not iterable` para o caso de bytes vazios | Vitest interpretou o array vazio como lista vazia de argumentos. Os casos foram encapsulados em objetos `{ bytes }`, sem alterar a regra de triagem | Reexecucao: 21/21 testes PASS, typecheck e build PASS |

## 12/11/2026 - Bloqueio da validacao completa de imagens

| ID | Problema | Diagnostico e tratamento | Estado |
|---|---|---|---|
| P14-P02 | Nenhuma biblioteca de decode/re-encoding aprovada nos documentos | Sharp e Jimp avaliadas sem instalacao. Selecao exige decisao tecnica e revisao de seguranca; sem decoder nao e possivel comprovar integridade, pixels ou EXIF | Pendente decisao humana; nenhum processamento novo declarado aprovado |
| P14-P03 | Limite de 10 MB documentado sem convencao explicita de bytes | Nao fixado 10.000.000 vs 10.485.760 por inferencia | Pendente precisao do limite antes do guard de upload |

## 12/11/2026 - Processador Sharp (preparatorio P14)

| ID | Problema | Diagnostico e tratamento | Estado |
|---|---|---|---|
| P14-P04 | Primeira bateria de testes falhou: PNG com padding exatamente no limite foi aceito e fixture EXIF de orientacao ficou com valor 1 | Aceitacao do tamanho exato esta correta; ajustada expectativa. Fixture passou a usar `withMetadata({ orientation: 6 })`; reexecucao confirmou orientacao 6 na entrada e dimensoes invertidas/EXIF ausente na saida | Resolvido: Vitest 30/30 PASS |
| P14-P05 | Biblioteca e unidade de 10 MB antes indefinidas (P14-P02/P03) | Decisoes D-IMG-01/02 aprovadas expressamente, Sharp 0.35.5 instalado com npm audit sem achados reportados | Resolvido para processamento local; limites HTTP/S3 permanecem pendentes |

## 12/11/2026 - Primitivas de autenticacao D03/D04

| ID | Problema | Diagnostico e tratamento | Estado |
|---|---|---|---|
| AUTH-P01 | Lista local inicial de senhas comuns/comprometidas cobre apenas exemplos, sem corpus revisado para producao | Contrato `CompromisedPasswordList` permite ampliar a lista sem alterar a politica; nao conectar cadastro/reset antes de revisar fonte, cobertura e atualizacao da lista | Pendente para autenticacao operacional |
| AUTH-P02 | npm avisou que script de instalacao de `argon2` nao esta coberto por `allowScripts` | Importacao da biblioteca nativa e testes de hash/verificacao passaram no runtime local; install scripts nao foram liberados globalmente | Validar instalacao reproduzivel e supply chain no CI futuro |
| AUTH-P03 | Gitleaks identificou `generic-api-key` na linha da denylist textual de senhas comuns | As entradas da lista local foram convertidas para fingerprints SHA-256; a comparacao da senha candidata usa hash local. Nenhum finding foi suprimido | Reexecucao Gitleaks sem achados; testes 42/42 PASS |

## 12/11/2026 - Corpus e migrations preparatorias de autenticacao

| ID | Problema | Diagnostico e tratamento | Estado |
|---|---|---|---|
| AUTH-P04 | Nome de arquivo SecLists proposto anteriormente nao existe no commit oficial atual | Usado arquivo oficial `10k-most-common.txt`, commit/blob e licença MIT verificados. Fonte possui 10.001 linhas; primeiras 10.000 selecionadas e documentadas | Resolvido com integridade verificavel |
| AUTH-P05 | Primeira conversao PowerShell usou `Convert.ToHexString` indisponivel no PowerShell deste host | Geracao refeita com `BitConverter`, contagem e unicidade exigidas antes de gravar; nenhuma lista parcial aceita | Resolvido: 10.000 hashes distintos |
| AUTH-P06 | Teste anterior assumia que senha sintética da denylist de oito itens constava no corpus SecLists | Teste atualizado para contagem real do corpus e bloqueio por lista injetada, sem alterar D04. Suite reexecutada | Resolvido: Vitest 42/42 PASS |
| AUTH-P07 | CI remoto Linux e migrations SQL nao podem ser declarados aprovados por checks locais | Workflow e testes estáticos preparados; nenhuma imagem bloqueada, banco real ou runner remoto usado | Pendente execução Linux e integração PostgreSQL após liberação |

## 12/11/2026 - Handlers simulados de autenticacao

| ID | Problema | Diagnostico e tratamento | Estado |
|---|---|---|---|
| AUTH-P08 | FSD 13.8 nao lista GET de consulta de sessao | Consulta implementada somente no servico interno, sem rota HTTP inventada | Resolvido para esta entrega; eventual endpoint exige contrato aprovado |
| AUTH-P09 | Renovacao por leitura seguida de `save` poderia sobrescrever revogacao concorrente no store futuro | Contrato substituido por `renewIfActive`, update condicional atomico exigido; mock/testes ajustados | Contrato corrigido; prova SQL real pendente |
| AUTH-P10 | Rate limiting real, versoes legais definitivas e entrega duravel de e-mail ainda indisponiveis | Rotas nao montadas no servidor; dependencias simuladas e versoes de teste apenas para `inject` | Bloqueia promocao para auth operacional; sem alegar seguranca integrada |

## 13/11/2026 - Frontend B01

| ID | Problema | Diagnóstico e tratamento | Estado |
|---|---|---|---|
| FE-P01 | Referências documentais antigas apontavam para `docs/frontend/Desing.md`, enquanto os arquivos vigentes estão em `docs/Design/` | Leitura e implementação usaram os caminhos confirmados por PREPARACAO e pelo catálogo real; não foram criadas cópias divergentes | Resolvido para esta entrega; referências históricas permanecem |
| FE-P02 | Backend não monta auth e não possui contrato operacional para bootstrap de sessão/CSRF | B01 ficou sem cliente HTTP; nenhuma área autenticada foi liberada e nenhum token foi persistido no navegador | Pendente; bloqueia integração real |
| FE-P03 | Textos/versões jurídicos definitivos não existem | Cadastro operacional e aceites permanecem desabilitados; nenhuma política fictícia foi publicada | Pendente D07; bloqueia cadastro real |
| FE-P04 | Vitest/Vite falharam dentro do sandbox porque esbuild não conseguiu ler a árvore necessária para carregar `vite.config.ts` | Testes e build foram repetidos com autorização fora do sandbox | Resolvido: 41/41 testes, typecheck e build PASS no recorte final B01 |

## 13/11/2026 — TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.

| ID | Problema | Tratamento e estado |
|---|---|---|
| SQL-EXP-01 | Testcontainers expirou aguardando porta publicada em rede Docker internal | Container saudável foi parado antes de migrations. Transporte de pg adaptado para docker exec/stdio até loopback interno, sem portas publicadas. Resolvido no ensaio; TCP operacional não medido |
| SQL-EXP-02 | Primeira execução SQL real teve 3 PASS/5 FAIL, confirmação retornou false/422 e sessões não criadas | Medida diferença de aproximadamente 57 s entre Docker e Windows. Fixtures calibradas ao clock_timestamp do banco, com margem de 1 s. Oito casos passaram. Sincronização temporal operacional permanece pendente, sem alterar relógios globais ou domínio |
| SQL-EXP-03 | Timeout zero padrão do Testcontainers provocou exit 137 no restart/cleanup de tentativas iniciais, sem OOM | Definidos 10 s para parada/restart. Parada posterior confirmou exit 0 e OOMKilled false. Timeout de hook afterAll de 10 s excedido, ampliado somente no hook para 30 s e revalidado |
| SQL-EXP-04 | Comando inicial de edição de fixtures falhou no parser PowerShell, gerando referências temporárias a testNow indefinido | Edição corrigida por patch, typecheck de testes passou antes da nova execução. Resolvido |
| SQL-EXP-05 | Imagem continua com findings Critical/High e validação de biblioteca incompleta | Autorização atual aplicada apenas ao ensaio restrito documentado. Nenhuma promoção/dispensa de gate; riscos residuais continuam abertos |

Migrations 001–020 e oito casos reais passaram no ambiente experimental. Persistência após restart e zero conexões SQL não loopback registrados nos relatórios `.local/vdr-sql-*.json`. Falhas de infraestrutura e de clock das tentativas anteriores foram preservadas nos logs. Nenhum incidente de exposição pública ou acesso a bancos anteriores identificado. Recursos experimentais parados e volumes/redes próprios preservados para diagnóstico.

## 13/11/2026 — Sprint dos controles de autenticação

| ID | Problema ou pendência | Tratamento e estado |
|---|---|---|
| AUTH-CTRL-01 | Typecheck rejeitou cast de Object.fromEntries para o Record fechado de políticas de teste | Fixture refeita com chaves explícitas. Typecheck fontes/testes, build e suíte final 98 PASS. Resolvido |
| AUTH-CTRL-02 | FSD define dimensões e comportamento do rate limit, sem quotas/janelas/cooldown numéricos | Implementado store SQL compartilhado e adaptador sem defaults operacionais. Políticas inválidas/ausentes recusadas. Números presentes apenas em fixtures; operação depende da definição/revisão desses valores |
| AUTH-CTRL-03 | Envio pós-commit anterior podia perder e-mail, e persistir token claro violaria proteção de segredos | Intenção agora é parte da transação com token, deduplicada por solicitação. Worker gera token por tentativa e armazena só hash, preservando expiração e tokens anteriores válidos. Teste real cobre resposta incerta com chave estável. Revisão humana de segurança do desenho ainda obrigatória |
| AUTH-CTRL-04 | Intervalos, lease, timeout e retenção da fila não definidos operacionalmente; Postmark SMTP/API continua pendente | Configurações explícitas exigidas, transporte simulado nos testes, sem provedor alternativo ou envio real. Worker/agendamento/expurgos e transporte operacional continuam pendentes |
| AUTH-CTRL-05 | Eventos de autenticação precisavam de persistência mínima e retenção própria | Nova tabela de segurança separada do audit administrativo, retenção 30 dias, app sem DELETE; sucesso atômico à sessão e falha reverte operação. Testes reais passaram. Alertas e execução periódica da manutenção ainda pendentes |

Migrations 021–024 e integrações validadas no ambiente experimental já autorizado. Imagem continua bloqueada para uso operacional e diferenças de relógio não foram corrigidas globalmente. O log `.local/auth-controls-final.log` distingue os 18 casos SQL reais dos 80 locais/simulados. Não houve falha conhecida de testes na execução final. Gates completos e revisão humana permanecem pendentes conforme STATUS.

## 13/11/2026 — Preparação operacional de autenticação

| ID | Problema ou pendência | Tratamento e estado |
|---|---|---|
| AUTH-OPS-01 | Teste de backoff com relógio Vitest não controlou node:timers/promises: 126 PASS/1 FAIL na primeira suíte | Espera tornada injetável; teste determinístico verifica sequência de backoff/reset sem relógio global. Suíte final 127/127 PASS; logs inicial/final preservados. Resolvido |
| AUTH-OPS-02 | API HTTPS ainda não é decisão definitiva aprovada | Protótipo isolado preparado por autorização atual, fetch explicitamente injetado, sem montagem operacional/envios. Decisão SMTP/API, domínio, stream, segredo, templates/URLs e ensaio real pendentes |
| AUTH-OPS-03 | Resposta perdida após aceitação pode gerar entrega repetida; Metadata não garante deduplicação Postmark | Sem header fictício ou promessa de exatamente uma entrega; intenção/claim e tokens de uso único preservados. Aceitação pelo provedor não comprova entrega ao destinatário. Revisão humana e validação externa pendentes |
| AUTH-OPS-04 | Intervalos, retenção da fila, quotas e agendamento não aprovados | Tabela de propostas concretas/impactos em CONFIGURACAO_OPERACIONAL_AUTH.md. Nenhum valor convertido em default, nenhum controle desativado para montar rotas |
| AUTH-OPS-05 | Shutdown pode aguardar SQL travado, e alertas operacionais ainda não existem | Lifecycle faz drain/fecha DB e remove handlers; conexão dedicada, timeouts SQL/locks, supervisor com grace period e observabilidade devem ser validados antes da ativação. Sem scheduler/daemon nesta execução |
| AUTH-OPS-06 | npm audit retorna sete pacotes Moderate de desenvolvimento, exit 1 | Relatório preservado; produção zero findings, zero High/Critical no conjunto. Não aplicada troca major/downgrade sugerida automaticamente. Reavaliação da cadeia de testes permanece aberta |

**TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Dezenove casos SQL reais passaram no ensaio novo isolado; 108 casos locais/simulados passaram. Zero envios Postmark. Imagem anterior continua bloqueada, defasagem de clock ~57 s permanece operacionalmente aberta, recursos próprios parados e evidências preservadas. Nenhum incidente de isolamento identificado. Falha inicial de leitura de `docs/frontend/Desing.md` corresponde ao caminho antigo já registrado em PREPARACAO; consultado `docs/frontend/Design.md`, sem mudança de frontend. Gitleaks inicial com escopo inadequado foi interrompido e refeito no backend, sem achados; não foi tratado como aprovação de scan completo do workspace.

## 13/11/2026 — Integração funcional da composição e D05

| ID | Problema ou pendência | Tratamento e estado |
|---|---|---|
| AUTH-INT-01 | Typecheck da nova fixture recusou indexar argumentos de um mock inferido sem parâmetros | Assinatura explícita de query SQL/valores, typecheck corrigido antes do ensaio. Resolvido |
| AUTH-INT-02 | Primeiro ensaio: 138 PASS/2 FAIL; comparação exata de 60.000 ms observou 59.999,999 ms e teste consultou coluna id inexistente em tentativas_email_auth | Tolerância inferior a 1 ms para avaliações separadas de clock_timestamp; consulta usa envio_id da chave composta física. Sem alteração de comportamento/retry SQL. Log inicial preservado; resolvido |
| AUTH-INT-03 | Segundo ensaio: 140 PASS/1 FAIL; reset retornou 422 porque fixture congelava relógio antes da criação posterior do token de entrega | Relógio da jornada passa a acompanhar o relógio calibrado do banco e aplica avanço somente nos testes de expiração. Nenhuma mudança no domínio/relógio global. Suíte final 141 PASS; logs anteriores preservados. Resolvido |
| AUTH-INT-04 | Loop anterior processava job seguinte imediatamente após progresso | Aplicado polling aprovado de 5 s também após sucesso, com reset do backoff e parada sem nova espera. Teste determinístico cobre 5/10/20/40/60/60 s e retorno ao mínimo com multiplicador explícito de fixture. Resolvido |
| AUTH-INT-05 | SMTP/API, retries, retenção e polling antes abertos | Fechados por aprovação humana D05 em DT 12.5; histórico preservado e configuração central aplicada. Quotas reais, fator/timeouts/lease/supervisor e limiares/canal de alerta continuam pendentes |
| AUTH-INT-06 | Alertas não podem ser considerados operacionais só por sinal simulado | Snapshot/monitor agregado preparados e testados com SQL real e sink simulado; sinais de nível sem deduplicação/janela sustentada/coletor/destino ativo. Falha de fonte/sink propaga; integração externa pendente |

Resultado final: **141/141 PASS (120 locais/simulados + 21 SQL reais experimentais)**. Expurgo de 30 dias testado com manutenção segregada, app sem DELETE, terminais antigos removidos e recentes/pendentes preservados. Nenhuma migration nova, chamada Postmark ou montagem operacional. Os sete pacotes Moderate de desenvolvimento continuam registrados, produção sem findings npm; imagem bloqueada, relógio operacional e revisão humana/staging permanecem pendentes. Não houve incidente de isolamento identificado. **TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.**

## 13/11/2026 — Execução das configurações aprovadas

| ID | Problema ou pendência | Tratamento e estado |
|---|---|---|
| AUTH-CFG-01 | Typecheck inferiu o default de shutdown como literal 30000, mock sem argumentos e linha SQL opcional sem assertion | Tipos explícitos number/assinatura de consume e checagem de linha da fixture corrigidos antes de Vitest; typecheck fontes/testes e build PASS. Resolvido |
| AUTH-CFG-02 | Falhas concorrentes de login já admitidas podiam renovar cooldown ativo, dificultando recuperação | Repository ignora falha durante bloqueio vigente; negações não renovam prazos/contadores. SQL real valida seis degraus 1/2/4/8/16/30 s e ausência de renovação sob concorrência. Resolvido; revisão humana continua necessária |
| AUTH-CFG-03 | Cooldowns adicionais e defaults de quota aprovados ainda não existiam | Implementados em config/auth-rate.ts e no consume transacional após quota excedida, por combinação origem/identidade. Composição usa defaults aprovados; HTTP real experimental retorna 429 no quarto cadastro da identidade. Resolvido |
| AUTH-CFG-04 | Shutdown anterior podia aguardar indefinidamente sem prazo | Deadline aprovado de 30 s implementado no HTTP e lifecycle do worker, sem extensão por sinais repetidos; cancelamento/impedimento de envio/ACK tardio testados. Bootstrap/supervisor worker precisa tratar erro fatal e terminar handles de adaptadores que não cooperem; sem ativação operacional |
| AUTH-CFG-05 | Quota global por identidade pode ser consumida por terceiro mesmo sem cooldown global de conta | Preservadas quotas aprovadas e janelas fixas; negações não estendem janelas, cooldown restrito à combinação. Risco residual de indisponibilidade temporária dirigida documentado; avaliar em staging sem inventar desafios/provedores ou alterar quotas |

Quotas, cooldowns e timeouts foram **aprovados e efetivamente implementados**, não permanecem como propostas. Primeira suíte 159/159 PASS; após acrescentar validação HTTP dos defaults, suíte final **160/160 PASS (126 locais/simulados + 34 SQL reais experimentais)**. Cancelamento de consulta aos 10 s e recuperação da conexão validados no banco real. npm audit mantém sete pacotes Moderate de desenvolvimento, zero High/Critical; produção sem findings. Imagem operacional, clock, integração externa, supervisor/alertas/staging e revisão humana continuam abertos. Nenhum incidente de isolamento identificado, nenhuma migration nova ou envio externo. **TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Ocorrências não implementadas; P12/P15 apenas identificadas no PLANO.

## 13/11/2026 — Preparação antecipada das consultas P12

| ID | Problema / regra que limita a entrega | Tratamento e estado |
|---|---|---|
| P12-PREP-01 | PLANO P12 depende de P10 e P11, ainda não concluídas | Trabalho registrado como preparação antecipada expressamente autorizada. Não iniciar/concluir formalmente P12 nem implementar P10/P11/P15 por inferência |
| P12-PREP-02 | FSD 10.8/DT 8 exigem polígono oficial versionado; schema 001–024 não contém essa estrutura/adaptador | Fonte interna obrigatória, sem fallback por cidade/geocoder. Ensaio com MULTIPOLYGON sintético e PostGIS real. Ausência/geometria inválida falha 503. Fonte/versão/importação oficiais dependem de P11 |
| P12-PREP-03 | FSD exige paginação limitada, mas não fixa tetos numéricos operacionais de size/offset | Política explícita obrigatória sem default inventado. Testes usam fixtures; definir/revisar tetos antes de operação. Parâmetros de query usam os nomes existentes, sem sort/filtros novos |
| P12-PREP-04 | Modelo não possui subcategoria nem derivada pública/URL inequívoca de foto/selo/resolução completa | DTO apenas com campos reais e metadata de evidência pública aprovada; sem storage key, autor ou campo fictício. Integrações P10/P11/P14 e contratos restantes pendentes |
| P12-PREP-05 | Ação REMOVER_PIN existe em 010, sem coluna própria de remoção/reversão inequívoca | Leituras negam conservadoramente qualquer recurso com essa ação, sem inferir que outro ato o restaura. Testes de ocultação em todos os GETs passaram. Consolidar modelo/contrato da moderação em fase própria antes de habilitar restauração |
| P12-PREP-06 | Typecheck da fixture inferiu papel/status como string ampla | Literais tipados corrigidos antes do primeiro Vitest; typecheck fontes/testes e build PASS. Resolvido |
| P12-PREP-07 | Minhas ocorrências/analytics de acesso exigem contratos/persistência e integrações além da leitura básica atual | Não implementados: não inventar parâmetros de participação/período nem escrita/analytics. Necessário fechar contrato e autorização/gates próprios |

Resultado: **203/203 PASS (154 locais/simulados + 49 SQL reais experimentais)**. Nenhuma falha de aplicação nos dois ensaios completos. Conta sem sessão, BANIDO/ADMIN, perda de verificação, revogação/expiração, visibilidade, privacidade de DTO, paginação/filtros, distâncias e borda, fonte inválida/ausente e canais ausentes/inativos foram exercitados. Logs `.local/p12-read-initial.log` e `.local/p12-read-final.log` preservados. GiST verificado; performance em carga/fonte oficial não validada. Audit mantém sete pacotes Moderate de desenvolvimento; produção sem findings npm. Nenhuma migration ou decisão aprovada modificada, nenhum envio/serviço externo ou incidente de isolamento identificado. **TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Gates operacionais e revisão humana permanecem; frontend e criação/moderação de ocorrências não implementados.

## 13/11/2026 — Avanço P10/P11 e limitações verificadas

| ID | Problema / impacto | Tratamento e estado |
|---|---|---|
| P10-11-01 | Primeira suíte falhou no beforeAll por inferência inconsistente de $2 (varchar/text) na fixture Social; 226 PASS/15 SKIP | Cast explícito na fixture, sem alterar migration aplicada. Casos dirigidos então executaram. Resolvido, log p10-p11-initial preservado |
| P10-11-02 | Ponto projetado teoricamente a 100 m foi classificado fora por precisão finita, apesar da distância exibida arredondar ao alvo | Probes em oito direções para 100/3.000 m preservados; abaixo/acima 0,1 m e representações incluídas de borda testados. 6/16 probes teóricos de borda ficam fora no predicado nativo. Não acrescentado epsilon ou alterado raio; limitação cartográfica/numérica documentada e revisão da fonte real pendente |
| P10-11-03 | Pools automáticos Docker esgotados, impedindo criar rede antes do container; 65 casos ignorados no ensaio bloqueado | Sem apagar redes/volumes ou alterar daemon/rotas globais. Helper verifica IPAM+rotas e escolhe /28 livre em 10.253/16, cria rede interna nova e confirma subnet/isolamento. Teste puro de sobreposição/falta de faixa. Resolvido no host autorizado; CI/Linux não validado |
| P10-11-04 | PATCH privacy aceitava sessão que expirava enquanto aguardava lock (200 indevido) | Falha reproduzida em SQL real antes da correção. Revalidação usa relógio fresco após locks conta→sessão, helper D03 e estado/revogação/CSRF atuais. Regressão exige 401 e privacidade intacta; suíte final PASS. Resolvido no código novo, revisão humana reforçada pendente |
| P10-11-05 | Fonte/edição territorial não escolhidas; documentação legal IBGE 2025 inacessível (403/indisponibilidade) | Opções IBGE 2025/GeoSampa e evidências em FONTE_TERRITORIAL_P11. Licença específica não validada por analogia; zero importação/ativação oficial. Aprovação/licença/artefato/revisão necessários antes de substituir dados |
| P10-11-06 | Modos/subcategorias reais não definidos e anonimização/exclusão não tem contrato físico completo | Legado preservado com modo NULL (configuração pendente), validações negam nova seleção sem modo. Sem catálogo operacional inventado. GET /me e PATCH privacy implementados; PATCH cadastral e DELETE /me não implementados. Decisões/contratos restantes pendentes |

Resultado final: **243/243 PASS (178 locais/simulados + 65 SQL reais experimentais)**, 18 arquivos. Migrations 025/026 validadas em banco novo com dados legados antes de 025; 001–024 preservadas. API privacy com CSRF/ownership, BANIDO leitura, rollback de auditoria e concorrência; P11 com constraints, transformação 4674→4326, topologia, idempotência/conflito e bloqueio de ativação sintética testados. Typecheck/build/Gitleaks backend PASS; npm audit sete pacotes Moderate de desenvolvimento, zero High/Critical, produção sem findings. Relatórios/logs anteriores mantidos; nenhum SKIP declarado PASS. **TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Container final parado, rede/volume próprios preservados, sem acesso a bancos anteriores ou incidente de isolamento identificado. P10/P11/P12 não concluídas; bloqueios operacionais, fonte/licença e revisão humana mantidos.

## 13/11/2026 — Continuação P11: coordenadas e estabilidade dos ensaios

| ID | Problema / impacto | Tratamento e estado |
|---|---|---|
| P11-COORD-01 | SRID/topologia aceitam geometria com latitude 91/92; possível versão municipal inválida | Diagnóstico SQL comprova predicado anterior insuficiente. Service valida pares finitos/faixa de 4326/4674, repository valida resultado transformado; migration 027 impõe domínio no banco. Escrita direta rejeitada com 23514/ck_area_geographic_bounds; 31983→4326 positivo preserva versão anterior. Resolvido no código experimental, sem atestar fonte oficial |
| P11-COORD-02 | Docker Linux indisponível bloqueou a primeira tentativa pré-fix; testes ignorados não eram evidência | Usuário iniciou Docker após solicitação. Ensaio final isolado executou todos os casos; nenhum container anterior iniciado/reiniciado por esta tarefa. Histórico `.local/p11-coordinate-reproduction.log` preservado |
| P11-COORD-03 | Nova fixture projetada incluiu crs automaticamente, rejeitado corretamente pelo importer; 248 PASS/1 FAIL | Fixture usa ST_AsGeoJSON(...,17,0), mantendo SRID explícito do manifesto e proibição de crs ambíguo. Sem flexibilizar validação; log `.local/p11-coordinate-final.log` preservado |
| P11-COORD-04 | Reinício real excedeu timeout Vitest padrão 5 s, deixando testes seguintes usar pool encerrado; cooldown de 1 s também expirou durante prova concorrente sob carga; 232 PASS/17 FAIL | Timeout só do teste de restart ampliado a 30 s. Progressão validada por timestamps DB antes/depois; concorrência no cooldown aprovado de 30 s com assert explícito de não expiração. Sem alterar quotas/timeouts operacionais ou congelar relógios. Suíte final 249/249 PASS; log anterior `.local/p11-coordinate-verified.log` preservado |

Resultado final verificável: `.local/p11-coordinate-complete.log`, **181 locais/simulados + 68 SQL reais = 249 PASS**, 18 arquivos. Migrations 001–027 em banco novo; fontes/testes typecheck e build PASS; Gitleaks backend sem achados. Audit permanece com sete pacotes Moderate de desenvolvimento (exit 1), zero High/Critical e produção sem findings (exit 0); sem alteração de dependências. `git diff --check` PASS. Imagem e gates operacionais continuam bloqueados; scanners gerais/CI não repetidos.

**TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Relatório `.local/vdr-sql-2b5f8919-9efe-4dcf-8dd5-01ca2e60c8d1.json`: rede/volume próprios novos, sem portas ou conexões SQL não loopback, isolamento verificado antes/durante execução, sessão persistiu após restart, container encerrado exit 0/OOM false. Sem incidente de isolamento identificado. Fonte oficial/edição/licença, catálogo real, anonimização/reverificação e gates P09/P03/revisão humana continuam pendentes; P10/P11/P12 não concluídas. Próxima prioridade: decisão territorial verificável e cadeia de extração/importação; nenhuma fonte escolhida ou ativada por inferência.
## 13/11/2026 — D-GEO-01: defeito no recurso municipal oficial

| ID | Problema / impacto | Tratamento e estado |
|---|---|---|
| D-GEO-01-01 | Original municipal URBIS de 05/09/2026 é inválido: Too few points, 21.334 posições/347 anéis; dez anéis interiores só têm dois vértices distintos. 31983→4326 mantém defeito | **BLOQUEANTE para importação/ativação**. Original SHA-256 0853b37d21bd5008787b26ad142d5ca5a054d3b9285e5ce22a5855cd6fdd0c93 preservado; diagnóstico e índices dos anéis em PROCEDENCIA_GEOGRAFICA_D_GEO_01.md. Importador/constraint recusam três tentativas (duas concorrentes), zero versões inseridas/ativadas, anteriores intactas. Sem reparo, retirada de anéis, ST_MakeValid ou substituição IBGE. Necessário arquivo corrigido do mantenedor ou aprovação específica/revisão de reparo derivado. Fonte institucional aprovada não aprova arquivo inválido |
| D-GEO-01-02 | Hausdorff integral de contornos com cerca de 20 mil vértices por malha excedeu query timeout aprovado de 10 s | Limite preservado. Comparação diagnóstica em EPSG:31983 com 101 amostras de cada contorno, dois sentidos: maior distância amostrada 0,1070261973 m; não é máximo global nem equivalência territorial. Sem overlay de polígono inválido; buracos não convalidados |
| D-GEO-01-03 | Regressões experimentais falharam por timeout/tempo de fixtures e variação do relógio host/Docker; calibração única insuficiente para execução | Logs initial/verified/final preservados com contagens em STATUS. Recalibração só de timestamps das fixtures após migrations/antes de cada teste, sem alterar relógios globais, segurança ou timeout SQL. Última suíte: 257 PASS/3 SKIP/0 FAIL. Falha wall-clock anterior de 20.023 ms registrada; não se certifica estabilidade prolongada do host |
| D-GEO-01-04 | Nota técnica/legal IBGE 2025 liv102268 indisponível/403; LEIA-ME exige consulta; não há prova de licença específica | ZIP/CRC/PRJ/identidade selecionada e geometria válidos para conferência local expressamente autorizada. Sem atribuir licença por analogia, versionar/redistribuir ZIP/geometria ou adotar IBGE como autoridade. Conferência completa de áreas/buracos pendente de recurso municipal válido |

D-GEO-01 registrada em DECISOES_TECNICAS §8.1; licença municipal indicada no conjunto/recurso **CC BY-SA 4.0**, texto legal/snapshots e atribuição preservados. Segunda obtenção HTTPS produz hash idêntico; produtor não publica checksum/assinatura. Pipeline offline com pin/versão/proveniência, extrator IBGE Python/stdlib e proteção contra sobrescrita. Nenhuma migration adicional ou alteração em 001–027.

**Verificação final:** 184 locais/simulados + 73 SQL reais = **257 PASS**, mais **3 SKIP expressos** dos fluxos positivos que exigem geometria municipal válida. Quatro testes Python PASS. Typecheck fontes/testes, build, Gitleaks backend/scripts/geography e git diff --check PASS; documentos escaneados no fechamento. Audit sete pacotes Moderate dev (exit 1), zero High/Critical; produção sem findings (exit 0). Trivy/CI/staging não executados nesta entrega. Logs e relatórios .local/dgeo01-* e .local/vdr-sql-1a78ada3-d009-4177-80b4-9e8a08727d82.json preservados. Imagem/infraestrutura operacional não aprovadas.

**TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.** Rede/volume novos internos e exclusivos, nenhuma porta ou conexão SQL não loopback, nenhum acesso a banco anterior; container final encerrado exit 0/OOM false. Próxima atividade P11: recurso corrigido/revisado, importação idempotente e cenários geográficos positivos oficiais. Sem deploy, push, frontend, promoção de imagem/rotas ou conclusão de P10/P11/P12.
