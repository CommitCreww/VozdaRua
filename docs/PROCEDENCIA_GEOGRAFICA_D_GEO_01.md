# D-GEO-01 — Procedência, importação e diagnóstico territorial

13/11/2026, America/Sao_Paulo. **TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.**

## Decisão e resultado

Fonte primária aprovada pelo responsável: **Prefeitura de São Paulo — CODATA / Dados Abertos URBIS — Limites Municipais**. Conferência independente: IBGE Malha Municipal 2025. D-GEO-01 registrada em DECISOES_TECNICAS §8.1. Não há substituição automática por IBGE.

**O recurso municipal específico foi REJEITADO para importação/ativação:** o original é topologicamente inválido e permanece inválido após transformação. Não foi usada ST_MakeValid, retirada de anéis, simplificação, inversão de orientação ou mesclagem com outra malha. Nenhuma versão municipal real foi inserida em areas_municipais. O gate de integridade funcionou; a tarefa de incorporação permanece bloqueada pelo dado de origem.

## Originais e metadados preservados

| Campo | Evidência |
|---|---|
| Instituição/mantenedor | Prefeitura de São Paulo / CODATA, portal URBIS |
| Conjunto | [Limites Municipais](https://dadosabertos.urbis.prefeitura.sp.gov.br/dataset/limites-municipais), ID 113a28d3-ffce-40e1-8e6b-830f0c0f5df0 |
| Recurso | [Limites Municipais de São Paulo](https://dadosabertos.urbis.prefeitura.sp.gov.br/dataset/limites-municipais/resource/5e2d0548-6b80-4558-a77a-9c24aa7ccc55), ID 5e2d0548-6b80-4558-a77a-9c24aa7ccc55 |
| Download | https://dadosabertos.urbis.prefeitura.sp.gov.br/dataset/113a28d3-ffce-40e1-8e6b-830f0c0f5df0/resource/5e2d0548-6b80-4558-a77a-9c24aa7ccc55/download/limites_municipais.geojson |
| Obtenção | 13/11/2026; segunda obtenção confirmada em 2026-11-13T15:54:02Z (12:54:02 -03:00) |
| Versão/data | conjunto versão 1; recurso last_modified 2026-09-05T01:11:04.673700; versão do importador 1@2026-09-05T01:11:04.673700 |
| Formato | application/geo+json, FeatureCollection com uma Feature Polygon e properties null; 785.782 bytes |
| CRS declarado | original crs.name urn:ogc:def:crs:EPSG::31983 e metadado coordinate_system EPSG:31983 concordantes; SIRGAS2000 / UTM 23S, metros |
| Licença | CC BY-SA 4.0, indicada tanto no conjunto quanto no recurso |
| Original versionável | geography/urbis/2026-09-05/limites_municipais.original.geojson |
| SHA-256 original | 0853b37d21bd5008787b26ad142d5ca5a054d3b9285e5ce22a5855cd6fdd0c93 |
| Snapshot CKAN | geography/urbis/2026-09-05/metadata.original.json; SHA-256 273b8121fdef5cf06224e323f3ef6df45f8b53e8432ec3f2d02581f2de4df078 |
| Geometria extraída | somente geometry da Feature, mesma ordem/valores de coordenadas; 742.618 bytes serializados; SHA-256 3afb569ba262a9809296ce5d0e5c2e0228cc02688b0eb8bfb50b2b5c7e0d76a6 |

Duas obtenções HTTPS resultaram no mesmo hash/tamanho. A segunda retornou HTTP 200, Content-Type application/geo+json e Last-Modified Sat, 05 Sep 2026 01:11:04 GMT; evidência local `.local/geo-dgeo01/second-download-verification.json`. O CKAN não fornece hash do produtor (campo vazio) e não foi encontrada assinatura digital. O pin local detecta alterações futuras e preserva rastreabilidade; não é assinatura independente do produtor. `.gitattributes` impede normalização de bytes dos originais.

A identificação territorial vem da cobertura/descrição oficial do recurso e da única feição; o arquivo não contém atributo CD_MUN. A conferência IBGE seleciona explicitamente CD_MUN=3550308, NM_MUN=São Paulo e SIGLA_UF=SP. Compatibilidade de envelope/contorno não convalida buracos/validade do recurso municipal nem constitui certificação cartográfica.

## Licença e atribuição

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [texto legal em português](https://creativecommons.org/licenses/by-sa/4.0/legalcode.pt). Preservar criador/mantenedor, fonte, licença e avisos fornecidos, indicar alterações e evitar alegar endosso. Compartilhamento de adaptações deve observar CompartilhaIgual, sem restrições adicionais incompatíveis; cláusula 4 trata de direitos sobre bases de dados. Não atribuir automaticamente esta licença a todo código do backend. Atribuição preparada em `geography/urbis/2026-09-05/ATTRIBUTION.md`. A apresentação pública e revisão jurídica/humana de eventual distribuição da base derivada permanecem gates; nenhum frontend/publicação foi alterado.

Snapshot HTML do texto legal em `.local/geo-dgeo01/cc-by-sa-4.0.original.html`, SHA-256 95befb077e8647451484022146f5a527d2714314b93020ca5c35ace448d52d0c.

## Diagnóstico PostGIS real e impedimento

- Polygon não vazio, **21.334 posições, 347 anéis**. ST_IsValid=false; ST_IsValidReason: `Too few points in geometry component[332801.94383916 7394861.56332789]`, em EPSG:31983.
- Dez anéis interiores degenerados (índices GeoJSON/PostGIS começando em zero): **4, 38, 60, 74, 76, 179, 215, 221, 245, 251**. Cada um tem quatro posições e apenas **dois vértices distintos**. O relatório preserva localização/envelope de cada componente.
- ST_IsPolygonCW=false e ST_IsPolygonCCW=false: não foi normalizada a orientação. Orientação não resolve anéis degenerados.
- Transformação diagnóstica: `ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),31983),4326)`. O parser GeoJSON assume um SRID padrão quando a geometria extraída não tem crs; o pipeline o substitui explicitamente pelo CRS comprovado antes da transformação. Nenhuma inferência por magnitude das coordenadas.
- Resultado 4326: mesmo número de posições e **ST_IsValid=false**, erro próximo de (-46.6380290389294,-23.5479827800896). Envelope longitude [-46.82628239699992,-46.365092328999914], latitude [-24.008172245999962,-23.356790827999852]. Faixa geográfica correta não implica topologia válida.
- `stageMunicipalArea` rejeita a tentativa e duas reexecuções concorrentes; zero linhas da fonte/versão inseridas, nenhuma ativação e versões anteriores intactas. O app experimental conserva somente SELECT na tabela; staging usa executor de manutenção separado.
- Bloqueio concreto: `backend/src/repositories/municipal-area.ts` exige ST_IsValid; `db/migrations/026_municipal_areas.sql` exige geometria válida; contrato `docs/CONTRATO_P10_P11.md` proíbe reparo silencioso/automático. Não remover essas regras. **Ação necessária:** obter recurso corrigido do mantenedor, com nova versão/hash/metadados, ou aprovar explicitamente um procedimento de reparo derivado separado, com análise de diferenças, licença e revisão humana. Esta execução não solicita nem presume aprovação desse reparo.

Testes positivos com a fonte municipal real (interior/exterior/fronteira, 3 km/ocorrências e persistência após restart de versão importada) ficam explicitamente ignorados por este bloqueio. A regressão anterior com geometrias sintéticas e persistência de sessões não é apresentada como validação desta malha.

## IBGE 2025: referência separada

Origem: [produto oficial](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html), [ZIP estadual oficial](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/UFs/SP/SP_Municipios_2025.zip). Original mantido em `.local/geo-dgeo01/SP_Municipios_2025.original.zip`, SHA-256 **3ea8041f69e10e68045ff1275616f01673d94019d8105a00212354b80a067c3c**; CRC de todos os membros verificado. Nenhum pacote baixado foi executado.

Shapefile 2D, .cpg UTF-8; .prj GCS_SIRGAS_2000/GRS_1980/Greenwich/graus, identificado como EPSG:4674; hash .prj b7fe68a2eb827ea974a1a995a73676e095a366b383a10a66c7498300d1c58153. Extração offline restrita por Python 3.13/stdlib: registro 59 (base zero), identidade municipal validada, Polygon de um anel/21.308 posições. Layout diferente falha fechado, sem reconstituir buracos por heurística. Geometria extraída SHA-256 **b42d7d5ac363b49cc854e7c0eb5ab8a1268c5f55faf0d314a110d4ed82dba7d6**, sem simplificação/reparo.

O LEIA-ME exige consulta à nota técnica/legal vigente. A página/PDF `liv102268` retornou 403 na consulta; licença específica IBGE 2025 continua não validada. Não atribuir CC BY por analogia com 2024. ZIP e geometria IBGE são mantidos somente localmente para a conferência expressamente autorizada; não são versionados, redistribuídos ou usados como fonte operacional.

Não calcular sobreposição/simetria de área com o polígono municipal inválido nem declarar equivalência territorial. O diagnóstico compara envelopes e distâncias ao contorno exterior, com **101 amostras equidistantes por contorno nos dois sentidos**, em EPSG:31983. É amostragem de contornos, não máximo global de Hausdorff, análise dos 346 buracos ou prova de concordância integral. A comparação integral de Hausdorff excedeu o timeout SQL aprovado de 10 s; o limite foi preservado.

Resultado: IBGE ST_IsValid=true, municipal=false; maior distância amostrada à linha oposta **0,1070261973 m**. Área IBGE calculada em 31983: 1.522,5318755 km²; atributo original AREA_KM2=1.522,683, métricas diferentes que não foram sobrescritas/equiparadas. Não foi produzida área municipal corrigida ou diferença territorial de polígonos.

## Reprodução

Sem nova migration, alteração de 001–027 ou schema automático no runtime. Sem dependência npm/GIS nova. Originais, licença e extrator separados do startup/servidor. Em PowerShell na raiz:

```powershell
./scripts/fetch-geography.ps1
python scripts/extract-ibge-reference.py .local/geo-dgeo01/SP_Municipios_2025.original.zip .local/geo-dgeo01/ibge-sao-paulo.geometry.json
python scripts/test_extract_ibge_reference.py
$env:AUTH_SQL_EXPERIMENT='local-restricted-2026-11-13'
$env:AUTH_SQL_INTEGRATION_IMAGE='voz-da-rua-p01-postgis@sha256:bc918a934e61985d08a51406d1d7e753a7d15e3206dd0f0923d75923e76c2893'
$env:GEO_IBGE_REFERENCE=(Join-Path (Get-Location) '.local/geo-dgeo01/ibge-sao-paulo.geometry.json')
./scripts/npm-local.ps1 --prefix backend test -- --maxWorkers=1 --reporter=dot
```

Executar somente no host/ensaio previamente autorizado, com engine Linux disponível. Os helpers verificam isolamento antes do start e durante o ensaio: rede interna nova e exclusiva, volume novo, zero portas/montagens anteriores/socket, sem caps adicionais, 512 MiB/1 CPU e role de app restrita. Dados de contas/ocorrências e credenciais exclusivamente sintéticos; os polígonos territoriais públicos são dados reais não pessoais. Sem tráfego externo no container. O download é feito no host antes do teste. Original ou extração existente divergente não é sobrescrito; mudança do recurso exige nova revisão/pin. Sem variável GEO_IBGE_REFERENCE o caso independente fica SKIP, nunca PASS.

Resultados finais, relatórios locais e limitações de qualidade constam no fechamento desta execução em STATUS.md/ERROS.md.

Fechamento: `.local/dgeo01-clock-verified.log`, **257 PASS/3 SKIP/0 FAIL**, 19 arquivos (184 locais/simulados + 73 SQL reais), mais quatro testes Python/stdlib PASS. Três SKIP correspondem aos fluxos positivos oficiais bloqueados, não à conferência IBGE (esta executou). Relatório `.local/vdr-sql-1a78ada3-d009-4177-80b4-9e8a08727d82.json`, PostgreSQL 17.12/PostGIS 3.6.4/pgcrypto 1.3, migrations 001–027. Container final encerrado exit 0/OOM false. Typecheck/build/Gitleaks/git diff --check PASS; npm audit sete Moderate dev/zero High ou Critical e produção sem findings. Imagem/infraestrutura/rotas operacionais e revisão humana continuam bloqueadas.
