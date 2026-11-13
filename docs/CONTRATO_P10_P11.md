# P10/P11 — contrato de implementação parcial, v1

13/11/2026. Fontes: PLANO P10/P11/P12; PRD 12; FSD 4, 10.2, 10.8–10.9, 14, 28.3, 38–39, 48, 51, 61.5; DT 8/9/27/29. Não altera decisões aprovadas, frontend ou gates operacionais.

P10 depende de P09 e do contrato completo de anonimização/exclusão; P11 depende de P03 e de fonte territorial oficial verificada. O trabalho autorizado avança componentes backend independentes, sem declarar as fases concluídas ou liberar P12. Sem serviços externos de aplicação. Banco somente no ensaio isolado já autorizado.

## P10 executável

- GET /api/v1/me: sessão válida/verificada, titular obtido da sessão; ATIVO/BANIDO em leitura. Query vazia; DTO próprio com id/nome/e-mail/papel/situação/data/verificação e preferências. Métodos externos identificados apenas por provider, sem subject/token/identificador externo. Nunca retornar hash de senha, sessão/CSRF, token, logs ou linha SQL bruta.
- PATCH /api/v1/me/privacy: sessão válida/verificada, ATIVO independentemente do papel, Origin exato e x-csrf-token sincronizado. JSON fechado com pelo menos um boolean: perfil_publico e/ou exibir_nome_nos_relatos (nomes físicos expressos no FSD). Sem id, papel, status, nome/e-mail/senha no payload. Ownership sempre da sessão; transação trava conta antes de sessão e revalida status/verificação/revogação/expiração/hash CSRF, inclusive sob concorrência com banimento/reset. Auditoria mínima transacionada: ação PRIVACIDADE_ATUALIZADA, UUID ator/entidade, request ID/data; sem estado anterior/posterior sensível ou corpo. Falha de auditoria reverte atualização. Retenção administrativa existente de 90 dias, sem nova finalidade/telemetria.
- O retorno a privado não altera/apaga posts, comentários ou seguidores. Predicado interno de visibilidade pública revalida perfil público e ATIVO, post PUBLICADO e não removido; tornar público não ressuscita OCULTO/REMOVIDO. Preferência de nome fica guardada; sua exposição efetiva requer perfil público e preferência, sem aumentar a projeção anônima já existente da P12 nesta execução. Sem APIs Social novas.
- Respostas private/no-store; 401 sessão ausente/inválida, 403 CSRF/origem/conta sem escrita, 422 schema inválido, 503 dependência indisponível. Nenhuma rota operacional montada; factory restrita a APP_ENV=test.

PATCH /me cadastral e DELETE /me permanecem sem implementação: faltam contrato preciso de campos editáveis/reverificação e política física de anonimização, FKs RESTRICT e manutenção dos contadores únicos/histórico. Não escolher identificadores substitutos, prazo de retenção ou exclusão de dados por inferência. MFA/UI/legais finais não são implementados.

## P11 executável

Conferido último número integrado: 024. Novas migrations 025 (subcategorias) e 026 (área/versionamento) sem tocar 001–024.

- Categorias existentes preservadas, sem nomes/IDs/modes atribuídos arbitrariamente. Novo campo subcategoria_modo aceita os três modos do FSD; NULL identifica legado ainda não configurado e bloqueia validação de novas seleções, sem reescrever ocorrências históricas. Nenhuma subcategoria operacional é inventada ou semeada.
- Subcategorias pertencem a categoria. FK composta impede associação cruzada. Trigger valida modo/obrigatoriedade/atividade em nova associação e impede mudança de modo incompatível com ocorrências existentes. Locks de categoria/subcategoria serializam alterações concorrentes. Leitura interna/validação não cria endpoint de catálogo ausente do FSD.
- Parâmetro de duplicidade de 100 m inserido sem sobrescrever valor anterior, conforme FSD 10.9. Testar abaixo/igual/acima de 100 m e 3 km, SRID/metros, relações e obrigatoriedade no PostGIS real.
- Área municipal versionada: MULTIPOLYGON/4326 válido/não vazio, código municipal, fonte/versão/CRS original/licença/checksum e timestamps. Importação parametrizada recebe artefato local com proveniência explícita; verifica hash, tipo/SRID/topologia e transforma CRS com ST_Transform, sem ST_MakeValid, simplificação ou correção silenciosa. Importador somente prepara versão inativa/não aprovada; não substitui área ativa nem contém rotina de ativação.
- Geometrias sintéticas são identificadas como tal e não podem tornar-se área operacional por constraint. Fonte operacional lê somente área ativa/aprovada/não sintética. Preview experimental por ID é restrito a APP_ENV=test. Nenhum dado oficial é importado/ativado nesta execução porque a fonte concreta/edição ainda não foi escolhida pelo projeto. A escolha oficial e revisão humana da transformação/importação permanecem gates expressos do usuário.

IBGE (malha municipal 2025) e GeoSampa (Prefeitura) são opções documentadas em FONTE_TERRITORIAL_P11.md, não decisões. Não confundir o produtor municipal GeoSampa com a base estadual IGC. Não substituir a fonte sintética da suíte P12 por um candidato chamado de aprovado. Polígono oficial precisa de URL/versão/licença/CRS verificáveis e aprovação antes da adoção. Metadados livres preenchidos não provam aprovação humana.

## Complemento de integridade de coordenadas — 13/11/2026

Topologia válida e etiqueta SRID 4326 não bastam para validar a faixa das coordenadas. O importador passa a conferir pares 2D finitos e, nos CRS geográficos 4326/4674, longitude entre -180/180 e latitude entre -90/90 antes de SQL. Isso é formato/domínio do CRS, sem decidir pertencimento municipal no JavaScript. Entradas métricas, como 31983, seguem para transformação real no PostGIS, não são confundidas com graus.

O repository valida também o envelope da geometria resultante após ST_Transform para 4326. A nova migration **027_municipal_coordinate_bounds.sql** impõe a mesma faixa na persistência, inclusive para escrita direta que não use o service. 001–026 preservadas. Sem clamp, reparo ou normalização silenciosa: se houver versão incompatível numa base, a migration falha e exige tratamento explícito, sem remover ou corrigir dado por conta própria. A verificação de faixa global não certifica que a geometria representa São Paulo ou vem de fonte oficial; esses gates permanecem.
