# Invoke this script with the desired Node arguments; uses the verified portable runtime.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content -LiteralPath (Join-Path $root '.node-version') -Raw).Trim()
$node = Join-Path $root ".tools/node-v$version-win-x64/node.exe"
if (-not (Test-Path -LiteralPath $node)) { throw 'Run scripts/setup-node.ps1 first.' }
& $node @args
exit $LASTEXITCODE
