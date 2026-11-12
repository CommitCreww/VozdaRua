param()
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content -LiteralPath (Join-Path $root '.node-version') -Raw).Trim()
if ($version -notmatch '^26\.\d+\.\d+$') { throw 'Expected the approved Node 26 release line.' }
if (-not [Environment]::Is64BitOperatingSystem) { throw 'This portable setup requires Windows x64.' }
$tools = Join-Path $root '.tools'
$destination = Join-Path $tools "node-v$version-win-x64"
$node = Join-Path $destination 'node.exe'
if (-not (Test-Path -LiteralPath $node)) {
    New-Item -ItemType Directory -Force -Path $tools | Out-Null
    $archiveName = "node-v$version-win-x64.zip"
    $archive = Join-Path $tools $archiveName
    $checksums = Join-Path $tools "node-v$version-SHASUMS256.txt"
    & curl.exe --fail --location --silent --show-error --max-time 180 "https://nodejs.org/dist/v$version/$archiveName" --output $archive
    if ($LASTEXITCODE -ne 0) { throw 'Official Node archive download failed.' }
    & curl.exe --fail --location --silent --show-error --max-time 60 "https://nodejs.org/dist/v$version/SHASUMS256.txt" --output $checksums
    if ($LASTEXITCODE -ne 0) { throw 'Official checksum download failed.' }
    $entry = @(Get-Content -LiteralPath $checksums | Where-Object { $_ -match ('^[a-f0-9]{64}\s+' + [regex]::Escape($archiveName) + '$') })
    if ($entry.Count -ne 1) { throw 'Unique archive checksum not found.' }
    $expected = ($entry[0] -split '\s+')[0]
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Node checksum mismatch; archive will not be executed.' }
    if (Test-Path -LiteralPath $destination) { throw 'Partial runtime exists; inspect it rather than overwriting it.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $tools
}
$actual = & $node --version
if ($LASTEXITCODE -ne 0 -or $actual -ne "v$version") { throw 'Portable Node version mismatch.' }
Write-Output "Portable Node: $actual"
& $node (Join-Path $destination 'node_modules/npm/bin/npm-cli.js') --version
if ($LASTEXITCODE -ne 0) { throw 'Bundled npm verification failed.' }
# No system PATH, registry, execution policy or global installation is modified.
