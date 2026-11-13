# Contrato preparatório P12 — leitura de ocorrências, v1

13/11/2026. Autorização: sprint de consultas, exclusivamente backend e ensaio isolado. Fontes: FSD 4/11–12/15/19/20/27/38/48/61.5, DT 8/9/27/32 e PLANO P12. Contrato registrado antes da implementação; revisão humana reforçada continua obrigatória.

Atualização posterior — sprint P10/P11: migrations 025/026 adicionam subcategorias e área versionada; o DTO de ocorrência agora projeta subcategory (id/nome) quando associada, null no legado. O adaptador SQL de área foi preparado, mas a fonte operacional continua vazia até escolha/licença/importação e aprovação. As descrições de schema 001–024 e ausência de adaptador abaixo são histórico do contrato inicial; os gates atuais estão em CONTRATO_P10_P11.md/FONTE_TERRITORIAL_P11.md. P10/P11 e P12 continuam sem declaração de conclusão, sem liberar fonte sintética ou rotas operacionais.

## Dependências e classificação

P12 depende formalmente de **P10 e P11**. P10 (privacidade/exclusão) não concluída; P11 depende de P03 e de fonte/versão do polígono oficial, importação revisada, catálogo/subcategorias e testes. O schema 001–024 não contém área municipal versionada nem subcategorias. Este trabalho é **preparação antecipada autorizada, sem início formal/conclusão de P12**.

| Classe | Atividades |
|---|---|
| Independentes dos bloqueios operacionais | Contratos, schemas fechados, DTOs minimizados, services/controllers/routes desacoplados, repositories sobre tabelas existentes, testes locais de entrada/autorização/falhas |
| Somente ensaio isolado autorizado | HTTP inject + sessões PostgreSQL reais; leitura de ocorrências/ciclos/relatos/canais sintéticos; PostGIS com área MULTIPOLYGON sintética identificada como fixture; constraints/visibilidade/distância/ordenação/paginação |
| Bloqueadas | Liberação operacional; conclusão formal P12; fonte/adaptador do polígono oficial e catálogo/subcategorias P11; anonimização/exclusão P10; integração de foto derivada pública P14; detalhes de selo/resolução sem representação inequívoca; Minhas ocorrências com filtros/ownership/anonimização completos; POST analytics de canal e qualquer escrita fora da leitura autorizada |

Não construir imagem nem conectar banco/volume anterior. Nenhuma migration nova necessária para estas projeções; analytics de canal demanda evolução própria quando sua escrita for autorizada. Não expor view/linhas brutas, keys de storage, evidências privadas, usuário/autor, e-mail, moderação interna ou observações livres do histórico.

## Contratos HTTP existentes no FSD

Todos exigem sessão server-side válida, conta verificada e estado atual ATIVO ou BANIDO; BANIDO permanece em leitura independentemente do papel. Papel administrativo não expande a visibilidade nestas rotas cidadãs. Reusar cookie vdr_session e current() existente, revalidado em toda chamada. Sem endpoint novo fora do FSD. GETs não produzem ações de domínio, protocolo, evento de acesso ao canal ou transição de status.

| Método/caminho | Query permitida | Resultado |
|---|---|---|
| GET /api/v1/occurrences/nearby | lat, lng, radius, category?, status?, page, size | Página de cards visíveis com distância PostGIS em metros |
| GET /api/v1/occurrences/:id | Nenhuma | Detalhe minimizado sobre schema disponível |
| GET /api/v1/occurrences/:id/reports | page, size | Relatos ativos, sem identidade/localização do autor |
| GET /api/v1/occurrences/:id/history | page, size | Datas/transições públicas, sem ator/observação interna |
| GET /api/v1/occurrences/:id/official-channel | Nenhuma | Canal principal ativo cadastrado/órgão ativo ou mensagem literal de ausência |

Path id/category são UUIDs conforme convenção existente. Status usa código do catálogo aprovado, com allowlist dos estados físicos existentes; filtro não concede visibilidade a estado oculto. lat/lng são decimais finitos nos intervalos geográficos válidos. radius é positivo e finito, limitado pelo backend a 3.000 m conforme FSD 15.5 (não ampliar raio por input). page/size são inteiros positivos explícitos; não inventar default ausente. A política interna exige maxPageSize/maxOffset explicitamente configurados e validados, sem números operacionais inferidos do FSD. Os números nos testes são fixtures; definir/revisar tetos antes de operação. Não há parâmetro sort: FSD fixa distância crescente, depois atualização decrescente; UUID desempata apenas para estabilidade da paginação. Queries desconhecidas, repetidas/arrays, inválidas ou offset fora do teto são 422. Query de nearby usa exatamente os nomes do FSD 15.5; page/size são reutilizados para coleções, conforme paginação de FSD 11/48/61.5.

Envelope de coleção: {items,page,size,hasMore}. Buscar no máximo size+1, sem count global nem offset ilimitado. DTO explícito de ocorrência: categoria, título/endereço/bairro, coordenadas do pin, status, datas, ciclo atual, contagem de relatos do ciclo e participantes históricos únicos (relatos ativos), metadata da evidência pública aprovada e canal principal quando disponível. Detalhe também contém descrição/data de resolução; sem fingir subcategoria/selo/foto URL não disponíveis. Histórico e relatos são consultados pelos endpoints próprios, paginados, não listas ilimitadas embutidas.

Visibilidade comum: status visível no mapa e código público já existente (VALIDADA, ENCAMINHADA, EM_ANALISE, EM_RESOLUCAO, RESOLVIDA, REABERTA), sem arquivamento. PENDENTE_VALIDACAO/REJEITADA/DUPLICADA/ARQUIVADA não aparecem, nem por ID nem por parâmetro. Havendo ação REMOVER_PIN, ocultar conservadoramente em todas estas leituras: o schema não tem coluna própria de remoção, e não existe regra inequívoca de reversão desse ato. Não inferir que outro evento de moderação ou restauração do arquivo o desfaz. A leitura permanece bloqueada para esse recurso até consolidar o modelo/contrato em fase própria; nenhum fluxo de restauração/moderação é implementado aqui. ENCAMINHADA continua reservado para novas transições; ler eventual legado não produz esse estado. Relato excluído não aparece nem conta; imagem requer publica_no_pin, aprovação efetiva, não exclusão e relato ativo. Estado oculto/inexistente tem o mesmo 404. Perfil privado do autor não retira o problema coletivo visível, mas sua identidade não é projetada. A extensão de exibição opcional de nomes/anonimização depende de P10; esta preparação não a ativa.

Canal só vem da associação principal existente da categoria, sem escolher fallback não aprovado. Não inventar URL/órgão. URL, se existente, deve ser HTTP(S) sem credenciais; dados inválidos falham de forma segura. Não fazer fetch/redirect/envio externo. Ausência: {channel:null,message:"Canal oficial ainda não cadastrado"}, HTTP 200. Nenhum POST de analytics foi implementado nesta sprint de leitura.

## Geografia e gates

Fonte interna obrigatória MunicipalAreaSource fornece geometria GeoJSON MULTIPOLYGON/4326 e metadados de origem/versão; não aceitar área do cliente. O adaptador de fonte oficial em PostgreSQL depende da P11 e não foi inventado. Sem fonte/versão/geometria válidas, falhar 503, nunca assumir cidade pelo texto ou retângulo. PostGIS valida geometria/tipo, decide ST_Covers para posição/pins (borda inclusiva), ST_DWithin geography para raio e ST_Distance geography para ordenação. Posição de consulta fora da área: 422, sem consulta de resultados; detalhe cujo pin esteja fora: 404. Testes usam apenas fonte e área sintéticas, sem alegar cobertura oficial de São Paulo.

A factory de ensaio só monta em APP_ENV=test; app.ts/server.ts não importam estas rotas. Dependência real falhando vira erro minimizado 503; sessão ausente/expirada/revogada/não verificada: 401; contexto de conta inválido: 403; filtro/path inválido: 422; oculto/inexistente: 404. Envelope {code,message,requestId}, sem stack/SQL/coordenadas/cookies/segredos no log. Falha de autenticação nunca é convertida em sessão anônima autorizada.
