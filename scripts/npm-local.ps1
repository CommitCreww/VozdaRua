$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content -LiteralPath (Join-Path $root '.node-version') -Raw).Trim()
$runtime = Join-Path $root ".tools/node-v$version-win-x64"
$node = Join-Path $runtime 'node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'Run scripts/setup-node.ps1 first.' }
# Child npm scripts inherit this process-only PATH; the OS/user PATH is untouched.
$previousPath = $env:PATH
try {
    $env:PATH = "$runtime;$previousPath"
    & $node (Join-Path $runtime 'node_modules/npm/bin/npm-cli.js') @args
    $result = $LASTEXITCODE
} finally { $env:PATH = $previousPath }
exit $result
