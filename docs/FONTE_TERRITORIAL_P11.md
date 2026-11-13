# P11 — fonte territorial e importação preparada

**Atualização D-GEO-01 (13/11/2026):** o responsável aprovou URBIS/Prefeitura — Limites Municipais como fonte primária, com IBGE 2025 somente para conferência. O recurso municipal obtido foi rejeitado por topologia inválida, sem reparo/ativação/substituição. Evidências e reprodução em [PROCEDENCIA_GEOGRAFICA_D_GEO_01.md](PROCEDENCIA_GEOGRAFICA_D_GEO_01.md). A aprovação da fonte não aprova este artefato defeituoso nem o ambiente operacional.

Registro histórico anterior à D-GEO-01, também em 13/11/2026: nenhuma fonte/edição concreta estava aprovada. DT 8 e FSD 10.8 exigiam polígono oficial versionado, sem escolher fornecedor/malha. As opções abaixo documentam aquela investigação; não substituem a decisão posterior acima.

## Opções verificadas em fontes primárias

| Opção | Evidência obtida | Pendências antes da adoção |
|---|---|---|
| IBGE — Malha Municipal Digital 2025 | [Página oficial do produto](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html?=&t=o-que-e): edição 2025, Shapefile, coordenadas geográficas/SIRGAS2000, UTF-8. [Diretório oficial de SP](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/UFs/SP/): SP_Municipios_2025.zip, modificado em 26/02/2026. [Identificação municipal oficial](https://www.ibge.gov.br/cidades-e-estados/sp/sao-paulo.html): código 3550308 | Aprovar produto/edição; obter pacote e documentação legal, registrar hashes, confirmar .prj/atributos/código da feição e licença específica. Não usar versão simplificada de terceiros |
| GeoSampa — limite municipal da Prefeitura | [Tutorial do próprio GeoSampa](https://geoinfo-smdu.github.io/tutorial-GeoSampa/): dados abertos, catálogo de metadados por camada, CRS SIRGAS2000 geográfico EPSG:4674 ou UTM23S EPSG:31983 conforme arquivo. Serviços WFS vetoriais e download GPKG/SHP disponíveis | Fixar camada exata, órgão produtor, edição/data, licença/termo e arquivo/CRS, antes de comparar com IBGE. O tutorial geral não certifica licença/versão de um artefato específico |

O catálogo técnico/legal IBGE 2025 foi identificado pela página do produto (liv102268). As tentativas de acessar o catálogo/PDF retornaram 403 ou indisponibilidade nesta sessão. **Licença 2025 não validada; não atribuir CC BY por analogia com outra edição.** “Público” no diretório de download não substitui verificar licença. GeoSampa igualmente exige metadado/licença da camada concreta. A indicação de CRS no tutorial não substitui inspecionar o arquivo selecionado.

Decisão necessária: fonte/camada e edição autorizadas para a malha operacional, com licença e atribuição comprovadas. A opção IBGE oferece edição/artefato estáveis identificados para revisão; isso não é adoção automática. Não há geometria oficial utilizada como autoridade nesta entrega. Todos os testes espaciais usam fixtures sintéticas explicitamente identificadas e inativas.

## Pipeline implementado

Migrations 025/026: área MULTIPOLYGON/4326, fonte/versão/CRS original/licença/URL/hash e flags; catálogo separado. Importação recebe `AreaArtifact` em `services/municipal-area.ts`, com transação no repository. Nenhuma chamada de rede, download, ST_MakeValid, simplificação, reparo silencioso, ativação ou substituição. É staging de uma nova versão inativa/não aprovada. Constraint impede ativar geometria sintética; índice único limita área operacional ativa, GiST dá suporte espacial. Role app de teste somente consulta; staging usa executor de manutenção segregado.

Preparação de artefato futuro após a decisão:

1. Obter arquivo oficial em armazenamento local controlado; conservar pacote, metadados, licença e checksum originais. Selecionar somente a feição do município 3550308 pelo atributo oficial; verificar nome/código e projeção no artefato.
2. Extrair a geometria Polygon/MultiPolygon sem simplificação/reparo. Não passar FeatureCollection ou CRS ambíguo ao importador. A conversão/extrator de Shapefile/GPKG não foi implementada nem escolhida como dependência nesta sprint; fazê-la por ferramenta aprovada e registrar comando/versão/arquivo de origem. Nenhuma dependência GDAL/QGIS nova foi instalada.
3. Calcular SHA-256 dos bytes UTF-8 do GeoJSON de geometria fornecido. Manifesto: nome/código, URL pública da fonte, edição, licença/URL, SRID original explícito, hash, geometria e indicação de fixture sintética quando aplicável. O hash registrado pelo pipeline é do artefato GeoJSON recebido; guardar separadamente hash do pacote original e rastreio da extração. Metadados preenchidos não provam origem ou aprovação.
4. Chamar `stageMunicipalArea(repositoryDeManutencao, artifact)`. O pipeline rejeita hash/tipo inválidos, transforma por ST_Transform do SRID declarado para 4326 e exige MULTIPOLYGON válido/não vazio/2D. Repetição idêntica retorna o mesmo ID; alteração sob a mesma fonte/edição rejeita conflito, sem sobrescrever versão.
5. Revisar topologia, envelope, território/ilhas/bordas, CRS/transformação e licença no banco isolado. Fonte experimental por ID só em APP_ENV=test. Fonte operacional retorna apenas ativo/aprovado/não sintético e continua vazia. Ativação/publicação depende da escolha e revisão humana, sem função/CLI de promoção criada nesta execução.

Dados reais não devem ser substituídos nem marcados como aprovados para contornar o gate. Não copiar fixtures para seed operacional. O pipeline não declara válida uma fronteira oficial ainda não obtida.

Complemento do pipeline: a migration **027** restringe o envelope persistido em 4326 a longitude [-180,180]/latitude [-90,90]. O service rejeita posições não finitas/não 2D e faixas incompatíveis nos CRS geográficos 4326/4674; coordenadas projetadas 31983 continuam sendo transformadas no PostGIS antes da conferência do envelope resultante. Não se introduziu conversão heurística de CRS, tolerância espacial ou escolha de fonte. Versões incompatíveis não são normalizadas ou descartadas automaticamente.

## Precisão do ensaio

ST_Covers valida interior/borda/exterior da área sintética armazenada, inclusive após transformação 4674→4326. ST_DWithin/ST_Distance geography usam metros e os limites aprovados de 100/3.000 m. A projeção de coordenadas de um alvo teoricamente exato pode cair microscopicamente além da fronteira numérica do predicado nativo, apesar da distância exibida arredondar ao alvo. Os probes em oito direções são preservados no relatório experimental; abaixo/acima de 0,1 m e representações de borda foram testados. **Não foi adicionado epsilon, arredondamento ou expansão do raio à regra de negócio.** Validar precisão da malha/transformação real antes das ações presenciais; o ensaio não aprova sua exatidão cartográfica.
