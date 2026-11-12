param(
    [ValidatePattern('^voz-da-rua-p01(?:-[a-z0-9]+)*$')][string]$Project = 'voz-da-rua-p01',
    [string]$EnvFile = '.env.p01.local'
)
$ErrorActionPreference = 'Stop'
$env:COMPOSE_PROGRESS = 'quiet'
$root = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
if ($EnvFile -notmatch '^\.env\..+\.local$') { throw 'An explicit private P01 environment is required.' }
$settings = @{}
foreach ($line in Get-Content -LiteralPath $EnvFile) {
    if ($line -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]] = $matches[2] }
}
if ($settings.APP_ENV -ne 'development' -or $settings.POSTGRES_DB -ne 'voz_da_rua_p01') { throw 'Validation is restricted to the isolated P01 development database.' }
$compose = @('compose','--env-file',$EnvFile,'-p',$Project)
$checks = [ordered]@{}
function Invoke-ComposeChecked {
    param([string[]]$CommandArgs)
    $output = @(& docker @compose @CommandArgs)
    if ($LASTEXITCODE -ne 0) { throw ('Docker operation failed: ' + $CommandArgs[0]) }
    return $output
}
function Invoke-AppSql {
    param([string]$Sql)
    return (Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','--no-deps','db-app-check','-tA','-c',$Sql)) -join "`n"
}
function Assert-Equal {
    param($Actual,$Expected,[string]$Name)
    if ($Actual -ne $Expected) { throw "Assertion failed: $Name" }
    $checks[$Name] = 'PASS'
}
function Assert-ComposeDenied {
    param([string[]]$CommandArgs,[string]$ExpectedMessage,[string]$Name)
    $previous = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& docker @compose @CommandArgs 2>&1)
        $code = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previous }
    if ($code -eq 0 -or ($output -join ' ') -notmatch $ExpectedMessage) { throw "Expected failure not proved: $Name" }
    $checks[$Name] = 'PASS'
}
Invoke-ComposeChecked -CommandArgs @('config','--quiet') | Out-Null
$checks['compose-config'] = 'PASS'
Invoke-ComposeChecked -CommandArgs @('up','-d','--wait','--wait-timeout','120','db','mailpit') | Out-Null
Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','db-bootstrap') | Out-Null
Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','migrate') | Out-Null
Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','db-grants') | Out-Null
Assert-Equal (Invoke-AppSql "SELECT count(*) FROM schema_migrations") '17' 'seventeen-migrations'
Assert-Equal (Invoke-AppSql "SELECT current_setting('server_version_num')::int / 10000") '17' 'postgres-major-17'
Assert-Equal (Invoke-AppSql "SELECT postgis_lib_version() LIKE '3.6.%'") 't' 'postgis-3.6'
Assert-Equal (Invoke-AppSql "SELECT count(*) FROM pg_extension WHERE extname IN ('postgis','pgcrypto')") '2' 'approved-extensions'
Assert-Equal (Invoke-AppSql "SELECT ST_DWithin(ST_SetSRID(ST_MakePoint(-46.63,-23.55),4326)::geography,ST_SetSRID(ST_MakePoint(-46.63,-23.55),4326)::geography,3000)") 't' 'real-spatial-query'
$repeat = Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','migrate')
Assert-Equal @($repeat | Where-Object { $_ -match '^SKIP ' }).Count 17 'migration-rerun-skips-all'
Assert-Equal @($repeat | Where-Object { $_ -match '^APPLY ' }).Count 0 'migration-rerun-applies-none'
Assert-Equal (Invoke-AppSql "SELECT NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls FROM pg_roles WHERE rolname=current_user") 't' 'app-unprivileged-role'
Assert-Equal (Invoke-AppSql "SELECT NOT has_schema_privilege(current_user,'public','CREATE') AND NOT has_database_privilege(current_user,current_database(),'CREATE') AND NOT has_database_privilege(current_user,current_database(),'TEMP')") 't' 'app-no-ddl-or-temp'
Assert-Equal (Invoke-AppSql "SELECT NOT has_table_privilege(current_user,'schema_migrations','INSERT') AND NOT has_table_privilege(current_user,'logs_auditoria','UPDATE') AND NOT has_table_privilege(current_user,'logs_auditoria','DELETE') AND NOT has_table_privilege(current_user,'spatial_ref_sys','UPDATE')") 't' 'protected-tables-restricted'
Invoke-AppSql "BEGIN; INSERT INTO usuarios(nome,email) VALUES ('P01 probe','p01-probe@example.invalid'); ROLLBACK;" | Out-Null
$checks['app-domain-dml-rollback'] = 'PASS'
Assert-Equal (Invoke-AppSql "SELECT count(*) FROM usuarios WHERE email='p01-probe@example.invalid'") '0' 'app-probe-not-persisted'
Assert-ComposeDenied -CommandArgs @('run','-T','--rm','--no-deps','db-app-check','-tA','-c','BEGIN; CREATE TABLE p01_ddl_probe(id integer); ROLLBACK;') -ExpectedMessage 'permission denied' -Name 'app-ddl-actually-denied'

# Failure fixtures live only in ignored .local, not in versioned migrations.
$fixtures = Join-Path $root '.local/p01-failure'
New-Item -ItemType Directory -Force -Path $fixtures | Out-Null
[IO.File]::WriteAllText((Join-Path $fixtures '999a_failure.sql'), "INSERT INTO project_metadata(key,value) VALUES ('p01_rollback_probe','uncommitted'); SELECT 1/0;`n", [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $fixtures '999b_after.sql'), "INSERT INTO project_metadata(key,value) VALUES ('p01_after_failure','must not run');`n", [Text.UTF8Encoding]::new($false))
Assert-ComposeDenied -CommandArgs @('run','-T','--rm','--no-deps','-v',"${fixtures}:/migrations:ro",'migrate') -ExpectedMessage 'division by zero' -Name 'migration-failure-reproduced'
Assert-Equal (Invoke-AppSql "SELECT count(*) FROM project_metadata WHERE key IN ('p01_rollback_probe','p01_after_failure')") '0' 'migration-rollback-and-stop'
Assert-Equal (Invoke-AppSql "SELECT count(*) FROM schema_migrations") '17' 'failed-migration-not-recorded'
Assert-ComposeDenied -CommandArgs @('run','-T','--rm','--no-deps','-e','APP_ENV=production','-e','ALLOW_DEV_SEED=true','seed-dev') -ExpectedMessage 'Seed requires' -Name 'production-seed-rejected'
Assert-ComposeDenied -CommandArgs @('run','-T','--rm','--no-deps','seed-dev') -ExpectedMessage 'Seed requires' -Name 'seed-disabled-by-default'
Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','-e','ALLOW_DEV_SEED=true','seed-dev') | Out-Null
$before = Invoke-AppSql "SELECT (SELECT count(*) FROM usuarios)||':'||(SELECT count(*) FROM ocorrencias)||':'||(SELECT count(*) FROM relatos)||':'||(SELECT count(*) FROM posts)"
Invoke-ComposeChecked -CommandArgs @('run','-T','--rm','-e','ALLOW_DEV_SEED=true','seed-dev') | Out-Null
Assert-Equal (Invoke-AppSql "SELECT (SELECT count(*) FROM usuarios)||':'||(SELECT count(*) FROM ocorrencias)||':'||(SELECT count(*) FROM relatos)||':'||(SELECT count(*) FROM posts)") $before 'seed-idempotent-counts'
$env:P01_SMTP_PORT = $settings.MAILPIT_SMTP_PORT
$env:P01_MAIL_HTTP_PORT = $settings.MAILPIT_HTTP_PORT
$nodeVersion = (Get-Content -LiteralPath '.node-version' -Raw).Trim()
$node = Join-Path $root ".tools/node-v$nodeVersion-win-x64/node.exe"
$smtpOutput = & $node (Join-Path $PSScriptRoot 'check-mailpit.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Mailpit SMTP smoke failed.' }
$mail = $smtpOutput | ConvertFrom-Json
Assert-Equal $mail.captured $true 'mailpit-captures-smtp'
Invoke-ComposeChecked -CommandArgs @('restart','db','mailpit') | Out-Null
Invoke-ComposeChecked -CommandArgs @('up','-d','--wait','--wait-timeout','120','db','mailpit') | Out-Null
Assert-Equal (Invoke-AppSql "SELECT (SELECT count(*) FROM usuarios)||':'||(SELECT count(*) FROM ocorrencias)||':'||(SELECT count(*) FROM relatos)||':'||(SELECT count(*) FROM posts)") $before 'database-survives-restart'
$mailResponse = Invoke-RestMethod -Uri ("http://127.0.0.1:" + $settings.MAILPIT_HTTP_PORT + '/api/v1/messages') -TimeoutSec 10
if (-not @($mailResponse.messages | Where-Object { $_.ID -eq $mail.id }).Count) { throw 'Mailpit message did not persist.' }
$checks['mailpit-survives-restart'] = 'PASS'
$state = (Invoke-ComposeChecked -CommandArgs @('ps','--format','json')) -join "`n"
$checks['services-running-after-restart'] = 'PASS'
$directory = Join-Path $root '.local'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$report = [ordered]@{ project=$Project; checks=$checks; minio='BLOCKED: reviewed source/image pending'; note='No existing project or volume was reset. No production services were tested.' }
[IO.File]::WriteAllText((Join-Path $directory 'p01-validation.json'), ($report | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
$report | ConvertTo-Json -Depth 5
