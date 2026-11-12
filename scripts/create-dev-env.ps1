param(
    [string]$Path = '.env.p01.local',
    [ValidateRange(1024,65535)][int]$DatabasePort = 15433,
    [ValidateRange(1024,65535)][int]$MailUiPort = 18025,
    [ValidateRange(1024,65535)][int]$MailSmtpPort = 11025
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$target = [IO.Path]::GetFullPath((Join-Path $root $Path))
if (-not $target.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Environment must stay inside the workspace.' }
if ([IO.Path]::GetFileName($target) -notmatch '^\.env\..+\.local$') { throw 'Use an ignored .env.<name>.local file; never overwrite .env.' }
if (Test-Path -LiteralPath $target) { throw 'Environment file already exists; it was not overwritten.' }
function New-LocalSecret {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return -join ($bytes | ForEach-Object { $_.ToString('x2') })
}
$lines = @(
    'APP_ENV=development', 'POSTGRES_DB=voz_da_rua_p01', 'POSTGRES_USER=vozrua_bootstrap',
    ('POSTGRES_PASSWORD=' + (New-LocalSecret)), "POSTGRES_PORT=$DatabasePort",
    'MIGRATION_DB_USER=vozrua_migrator', ('MIGRATION_DB_PASSWORD=' + (New-LocalSecret)),
    'APP_DB_USER=vozrua_app', ('APP_DB_PASSWORD=' + (New-LocalSecret)),
    'DB_HOST=127.0.0.1', 'BACKEND_PORT=8080', "MAILPIT_HTTP_PORT=$MailUiPort", "MAILPIT_SMTP_PORT=$MailSmtpPort",
    'TZ=America/Sao_Paulo'
)
$bytes = [Text.UTF8Encoding]::new($false).GetBytes(($lines -join "`n") + "`n")
$stream = [IO.File]::Open($target, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
try { $stream.Write($bytes,0,$bytes.Length) } finally { $stream.Dispose() }
Write-Output 'Private development environment created; values were not printed.'
