# Retroporte experimental de libxml2

Build restrito à remediação P01. A base local PG17/PostGIS3.6 possui findings bloqueantes registrados em `docs/REMEDIACAO_P01.md`. A aprovação de uso depende da avaliação do artefato final.

O Dockerfile exige a base local por digest e compila o source Debian trixie `2.12.7+dfsg+really2.9.14-2.1+deb13u3`. O patch corresponde ao commit GNOME `d1686f91dbda141a752200419d35639fd6b38340`. O script confere SHA-256 e aplica sem fuzz. A etapa verified executa `make check` explicitamente após o build Debian, cujo alvo indep pula testes. A etapa final instala o pacote runtime. Dependências de compilação ficam na etapa builder.

Executar da raiz do repositório em um Docker Engine local autorizado.

```powershell
docker build --pull=false --progress=plain -f infra/postgis-experimental/Dockerfile -t voz-da-rua-p01-postgis:libxml2-source-review infra/postgis-experimental
docker build --pull=false --target artifacts --output type=local,dest=.local/pg-unblock-source-artifacts -f infra/postgis-experimental/Dockerfile infra/postgis-experimental
```

O target artifacts exporta os pacotes, metadados Debian, fonte `valid-patched.c`, política APT, checksums e log dos testes. Conferir o sucesso do build e os resultados do log antes de avaliar o runtime. Atualizações futuras dos índices APT podem mudar as dependências do builder, por isso o resultado exige novo digest e novo scan a cada reconstrução.

O sufixo `+vozrua1` identifica um retroporte local. Os scanners podem continuar atribuindo CVE-2026-86140 pela versão do pacote. Confrontar o finding com o patch e os testes preservados. Findings adicionais, inclusive libxml2/CVE-2026-6653 e PostGIS/CVE-2026-73515, exigem tratamento próprio.

Usar `trivy image --scanners vuln --format json --output <relatorio-novo.json> <imagem-por-digest>` e registrar contagens por ocorrência pacote/CVE e por CVE distinta. Arquivos de supressão e filtros de findings corrigidos alteram a leitura do gate e exigem evidência específica. A suíte SQL depende de imagem que satisfaça os critérios de segurança definidos pelo projeto.

Na execução de 12/11/2026, o build do pacote e a imagem `libxml2-source-review` foram produzidos antes da inclusão da etapa verified. O make check posterior falhou com fixtures de threads ausentes. A receita atual exige essas fixtures e interrompe antes da imagem final quando a validação falha. O log e os artefatos anteriores continuam em `.local/pg-unblock-*`. A análise de segurança e a validação completa do retroporte permanecem abertas.
