$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
function Get-PinnedArtifact([string]$Uri, [string]$RelativePath, [string]$Sha256) {
    $destination = Join-Path $projectRoot $RelativePath
    if (Test-Path -LiteralPath $destination) {
        if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Sha256) {
            throw "Existing geographic artifact differs: $RelativePath. No overwrite permitted."
        }
        return
    }
    New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
    $temporaryArtifact = "$destination.$([guid]::NewGuid()).download.tmp"
    Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $temporaryArtifact
    if ((Get-FileHash -LiteralPath $temporaryArtifact -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Sha256) {
        throw 'Downloaded geographic artifact differs from reviewed pin; preserved for inspection, not imported.'
    }
    Move-Item -LiteralPath $temporaryArtifact -Destination $destination
}
Get-PinnedArtifact 'https://dadosabertos.urbis.prefeitura.sp.gov.br/dataset/113a28d3-ffce-40e1-8e6b-830f0c0f5df0/resource/5e2d0548-6b80-4558-a77a-9c24aa7ccc55/download/limites_municipais.geojson' 'geography/urbis/2026-09-05/limites_municipais.original.geojson' '0853b37d21bd5008787b26ad142d5ca5a054d3b9285e5ce22a5855cd6fdd0c93'
Get-PinnedArtifact 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/UFs/SP/SP_Municipios_2025.zip' '.local/geo-dgeo01/SP_Municipios_2025.original.zip' '3ea8041f69e10e68045ff1275616f01673d94019d8105a00212354b80a067c3c'
Write-Output 'Pinned official originals verified. No database connection or activation performed.'
