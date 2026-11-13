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
