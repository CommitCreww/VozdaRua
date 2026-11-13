import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createDatabase } from '../../src/repositories/database.js';
import { createAuthRepository } from '../../src/repositories/auth.js';
import { createSessionStore } from '../../src/repositories/sessions.js';
import { createPasswordRecoveryRepository } from '../../src/repositories/password-recovery.js';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, type StoredSession } from '../../src/security/sessions.js';
import { buildApp } from '../../src/app.js';
import { readConfig } from '../../src/config/index.js';
import { registerAuthRoutes } from '../../src/routes/auth.js';
import { registerPasswordRecoveryRoutes } from '../../src/routes/password-recovery.js';
import { ExperimentalPostgres, EXPERIMENT_IMAGE, experimental, checkExperimentalIsolation, recordExperiment, experimentalPool, stopPartialExperiment } from './local-experiment.js';
import { authControlCases } from './auth-controls-cases.js';
import { authOperationalCases } from './auth-operational-cases.js';
import { approvedConfigurationCases } from './approved-configuration-cases.js';
import { occurrenceReadCases } from './occurrence-read-cases.js';
import { p10p11Cases } from './p10-p11-cases.js';
import { municipalOfficialCases } from './municipal-official-cases.js';

// Empty until a human reviews a corrected PG17/PostGIS3.6 image and records its digest.
// An environment variable alone cannot approve an image or bypass P01.
const image = process.env.AUTH_SQL_INTEGRATION_IMAGE;
const approved = JSON.parse(readFileSync(new URL('./approved-images.json', import.meta.url), 'utf8')) as string[];
if (image && (!/^\S+@sha256:[a-f0-9]{64}$/.test(image) || !(approved.includes(image) || (experimental && image === EXPERIMENT_IMAGE)))) {
  throw new Error('Integration image lacks recorded security approval; no container started');
}

class LocalPostgres extends PostgreSqlContainer {
  constructor(reference: string) {
    super(reference);
    this.hostConfig.PortBindings = { '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: '0' }] };
    this.withAutoCleanup(false); // no Ryuk/socket/privileged helper container
  }
}

describe.skipIf(!image)('PostgreSQL17/PostGIS3.6 real — bloqueado ate liberacao P01', () => {
  let container: StartedPostgreSqlContainer | undefined;
  let admin: Pool | undefined;
  let db: ReturnType<typeof createDatabase>;
  let bootstrapPassword: string;
  let appPassword: string;
  const connectApp = () => createDatabase({ host: experimental ? '127.0.0.1' : container!.getHost(), port: experimental ? 5432 : container!.getPort(), database: container!.getDatabase(), user: 'auth_test_application', password: appPassword },
    experimental ? experimentalPool(container!.getId(), 'auth_tests', 'auth_test_application', appPassword) : undefined);
  const connectAdmin = () => experimental ? experimentalPool(container!.getId(), 'auth_tests', 'bootstrap_tests', bootstrapPassword)
    : new Pool({ connectionString: container!.getConnectionUri(), connectionTimeoutMillis: 3000 });
  let clockOffsetMs = 0;
  const testNow = (value?: number) => new Date(value ?? Date.now() + clockOffsetMs);
  async function calibrateFixtureClock() {
    const sample = await admin!.query<{ at: Date }>('SELECT clock_timestamp() AS at');
    const measuredOffsetMs = sample.rows[0]!.at.getTime() - Date.now();
    if (experimental && Math.abs(measuredOffsetMs + 1000 - clockOffsetMs) > 250) {
      recordExperiment('latestFixtureClockAdjustment', { previousOffsetMs: clockOffsetMs, measuredOffsetMs, testMarginMs: 1000 });
    }
    clockOffsetMs = measuredOffsetMs + 1000;
  }
  const baselineId = randomUUID();
  const migrations = new URL('../../../db/migrations/', import.meta.url);

  beforeAll(async () => {
    const candidate = experimental ? new ExperimentalPostgres(image!) : new LocalPostgres(image!);
    bootstrapPassword = randomBytes(32).toString('hex');
    container = await candidate.withDatabase('auth_tests').withUsername('bootstrap_tests')
      .withPassword(bootstrapPassword).start();
    if (experimental) await checkExperimentalIsolation(container.getId());
    admin = connectAdmin();
    const version = await admin.query<{ server_version_num: string }>(
      "SELECT current_setting('server_version_num') AS server_version_num");
    expect(Number(version.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(170000);
    expect(Number(version.rows[0]!.server_version_num)).toBeLessThan(180000);
    const clockSample = await admin.query<{ at: Date }>('SELECT clock_timestamp() AS at');
    const measuredOffset = clockSample.rows[0]!.at.getTime() - Date.now();
    // Test-only allowance for transport latency and PostgreSQL microsecond precision.
    clockOffsetMs = measuredOffset + 1000;
    if (experimental) recordExperiment('clockCalibration', { measuredOffsetMs: measuredOffset, testMarginMs: 1000 });
    // A clean baseline followed by an upgrade containing an existing account.
    const client = await admin.connect();
    try {
      for (const filename of readdirSync(migrations).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
        if (filename.startsWith('025_')) {
          await client.query(`INSERT INTO ocorrencias(categoria_id,status_id,titulo,descricao,localizacao)
            SELECT c.id,s.id,'Legacy P11 upgrade','Synthetic legacy record',ST_SetSRID(ST_MakePoint(-46.63,-23.55),4326)::geography
            FROM categorias_ocorrencia c CROSS JOIN status_ocorrencia s WHERE c.slug='buraco-via' AND s.codigo='VALIDADA'`);
        }
        await client.query('BEGIN');
        try { await client.query(readFileSync(new URL(filename, migrations), 'utf8')); await client.query('COMMIT'); }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        if (experimental) recordExperiment('lastMigration', filename);
        if (filename.startsWith('017_')) {
          await client.query('INSERT INTO usuarios(id,nome,email) VALUES ($1,$2,$3)', [baselineId, 'Baseline sintética', 'baseline@example.test']);
        }
      }
      const spatial = await client.query<{ postgis: string }>('SELECT postgis_lib_version() AS postgis');
      expect(spatial.rows[0]!.postgis).toMatch(/^3\.6\./);
      if (experimental) {
        const versions = await client.query('SELECT extname,extversion FROM pg_extension ORDER BY extname');
        recordExperiment('versions', { postgres: version.rows[0]!.server_version_num, extensions: versions.rows });
      }
      await client.query('BEGIN');
      appPassword = randomBytes(32).toString('hex');
      await client.query("SELECT set_config('test_auth.role_password',$1,true)", [appPassword]);
      await client.query(`DO $$ BEGIN
        EXECUTE format('CREATE ROLE auth_test_application LOGIN PASSWORD %L', current_setting('test_auth.role_password'));
      END $$`);
      await client.query('GRANT USAGE ON SCHEMA public TO auth_test_application');
      await client.query('GRANT SELECT, INSERT, UPDATE ON usuarios, tokens_conta, sessoes TO auth_test_application');
      await client.query('GRANT SELECT, INSERT ON aceites_legais TO auth_test_application');
      await client.query('GRANT SELECT, INSERT, UPDATE ON limites_auth, envios_email_auth TO auth_test_application');
      await client.query('GRANT SELECT, INSERT, UPDATE ON tentativas_email_auth TO auth_test_application');
      await client.query('GRANT SELECT, INSERT ON eventos_seguranca_auth TO auth_test_application');
      // P12 preparation: only read privileges on synthetic occurrence data in this new experiment.
      await client.query('GRANT SELECT ON ocorrencias,categorias_ocorrencia,status_ocorrencia,ocorrencia_ciclos,relatos,evidencias,historico_status,acoes_moderacao,orgaos_responsaveis,canais_denuncia,categoria_canais TO auth_test_application');
      await client.query('GRANT SELECT ON identidades_auth,posts,subcategorias_ocorrencia,areas_municipais,parametros_sistema TO auth_test_application');
      await client.query('GRANT INSERT ON logs_auditoria TO auth_test_application');
      await client.query('COMMIT');
      db = connectApp();
      // Docker Desktop's VM clock can resynchronize while migrations execute.
      // Calibrate only fixture timestamps; never alter host/DB clocks or production policies.
      await calibrateFixtureClock();
    } finally { client.release(); }
  }, 120_000);

  beforeEach(async () => { if (admin) await calibrateFixtureClock(); });

  afterAll(async () => {
    try {
      if (experimental && admin) {
        const connections = await admin.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE client_addr IS NOT NULL AND client_addr <> '127.0.0.1'::inet");
        recordExperiment('nonLoopbackSqlConnections', connections.rows[0].count);
        expect(connections.rows[0].count).toBe(0);
      }
    } finally {
      try { if (db) await db.close(); } finally {
        try { await admin?.end(); } finally {
          if (container && experimental) {
            await checkExperimentalIsolation(container.getId());
            await container.stop({ timeout: 10000, remove: false, removeVolumes: false });
            recordExperiment('stopped', true);
          } else if (experimental) await stopPartialExperiment();
          else await container?.stop();
        }
      }
    }
  }, 30000);

  async function account() {
    const email = `${randomUUID()}@example.test`;
    const tokenHash = randomBytes(32).toString('hex');
    const repo = createAuthRepository(db);
    await repo.register({ name: 'Pessoa sintética', email, passwordHash: 'old-hash', termsVersion: 'test-only-terms', privacyVersion: 'test-only-privacy', tokenHash, expiresAt: testNow(Date.now() + 86_400_000) });
    const user = (await repo.findByEmail(email))!;
    return { repo, user, email, tokenHash };
  }
  function session(accountId: string, at = testNow()): StoredSession {
    return { idHash: randomBytes(32).toString('hex'), accountId, csrfTokenHash: randomBytes(32).toString('hex'), createdAt: at, lastActivityAt: at, revokedAt: null };
  }

  it('upgrade preserva usuario anterior e aplica schema de aceites', async () => {
    expect(await createAuthRepository(db).findById(baselineId)).not.toBeNull();
    const identity = await db.query<{ current_user: string }>('SELECT current_user');
    expect(identity[0]!.current_user).toBe('auth_test_application');
    await expect(db.query('CREATE TABLE forbidden_auth_test(id INTEGER)')).rejects.toMatchObject({ code: '42501' });
    const x = await account();
    const [legal] = await db.query<{ termos_versao: string; privacidade_versao: string }>('SELECT termos_versao,privacidade_versao FROM aceites_legais WHERE usuario_id=$1', [x.user.id]);
    expect(legal).toEqual({ termos_versao: 'test-only-terms', privacidade_versao: 'test-only-privacy' });
  });

  it('unicidade case-insensitive e rollback de cadastro incompleto', async () => {
    const x = await account();
    expect(await x.repo.register({ name: 'Duplicado', email: x.email.toUpperCase(), passwordHash: 'hash', termsVersion: 'test', privacyVersion: 'test', tokenHash: randomBytes(32).toString('hex'), expiresAt: testNow(Date.now() + 10000) })).toBe(false);
    const email = `${randomUUID()}@example.test`;
    await expect(x.repo.register({ name: 'Rollback', email, passwordHash: 'hash', termsVersion: '', privacyVersion: 'test', tokenHash: randomBytes(32).toString('hex'), expiresAt: testNow(Date.now() + 10000) })).rejects.toMatchObject({ code: '23514' });
    expect(await x.repo.findByEmail(email)).toBeNull();
  });

  it('confirmacao concorrente consome uma vez, sem sessao', async () => {
    const x = await account(); const now = testNow();
    const result = await Promise.all([x.repo.confirmEmail(x.tokenHash, now), x.repo.confirmEmail(x.tokenHash, now)]);
    expect(result.sort()).toEqual([false, true]);
    expect((await x.repo.findById(x.user.id))!.emailVerifiedAt).not.toBeNull();
    expect(await db.query('SELECT id_hash FROM sessoes WHERE usuario_id=$1', [x.user.id])).toHaveLength(0);
  });

  it('sessoes persistem entre stores; renovacao nunca ressuscita revogacao', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, testNow());
    const first = createSessionStore(db); const second = createSessionStore(db); const stored = session(x.user.id);
    expect(await first.save(stored, 'old-hash')).toBe(true);
    expect(await second.findByIdHash(stored.idHash)).toEqual(stored);
    await Promise.all([first.revoke(stored.idHash, testNow()), second.renewIfActive(stored.idHash, testNow())]);
    expect(await second.renewIfActive(stored.idHash, testNow())).toBeNull();
    const survivor = session(x.user.id);
    expect(await first.save(survivor, 'old-hash')).toBe(true);
    await db.close(); await admin!.end();
    await container!.restart({ timeout: 10000 });
    db = connectApp(); admin = connectAdmin();
    expect(await createSessionStore(db).findByIdHash(survivor.idHash)).toEqual(survivor);
    if (experimental) { await checkExperimentalIsolation(container!.getId()); recordExperiment('sessionSurvivedRestart', true); }
  }, 30000);

  it('expira exatamente nos limites inativo e absoluto', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, testNow()); const store = createSessionStore(db);
    const at = testNow(); const idle = session(x.user.id, testNow(at.getTime() - SESSION_IDLE_MS));
    expect(await store.save(idle, 'old-hash')).toBe(true);
    expect(await store.renewIfActive(idle.idHash, at)).toBeNull();
    const absolute = { ...session(x.user.id, testNow(at.getTime() - SESSION_ABSOLUTE_MS)), lastActivityAt: testNow(at.getTime() - 1) };
    expect(await store.save(absolute, 'old-hash')).toBe(true);
    expect(await store.renewIfActive(absolute.idHash, at)).toBeNull();
  });

  it('reset concorrente por tokens diferentes altera uma vez e revoga duas sessoes', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, testNow()); const store = createSessionStore(db);
    const first = session(x.user.id); const second = session(x.user.id);
    await store.save(first, 'old-hash'); await store.save(second, 'old-hash');
    const recovery = createPasswordRecoveryRepository(db); const now = testNow();
    const tokens = [randomBytes(32).toString('hex'), randomBytes(32).toString('hex')];
    for (const token of tokens) await recovery.requestReset(x.user.id, token, testNow(now.getTime() + 10000), now);
    expect((await Promise.all(tokens.map((token) => recovery.completeReset(token, 'new-hash', testNow())))).sort()).toEqual([false, true]);
    expect(await store.renewIfActive(first.idHash, testNow())).toBeNull(); expect(await store.renewIfActive(second.idHash, testNow())).toBeNull();
    expect(await store.save(session(x.user.id), 'old-hash')).toBe(false);
    const racing = await account();
    expect(await racing.repo.confirmEmail(racing.tokenHash, testNow())).toBe(true);
    const racingToken = randomBytes(32).toString('hex');
    const racingNow = testNow();
    await recovery.requestReset(racing.user.id, racingToken, testNow(racingNow.getTime() + 10000), racingNow);
    const loginSession = session(racing.user.id);
    const results = await Promise.all([
      store.save(loginSession, 'old-hash'),
      recovery.completeReset(racingToken, 'new-hash', testNow())
    ]);
    expect(results[1]).toBe(true);
    expect(await store.renewIfActive(loginSession.idHash, testNow())).toBeNull();
  });

  it('falha posterior ao consumo reverte token, senha e sessoes', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, testNow()); const store = createSessionStore(db);
    const stored = session(x.user.id); await store.save(stored, 'old-hash');
    const recovery = createPasswordRecoveryRepository(db); const now = testNow(); const token = randomBytes(32).toString('hex');
    await recovery.requestReset(x.user.id, token, testNow(now.getTime() + 10000), now);
    await expect(recovery.completeReset(token, 'x'.repeat(256), testNow())).rejects.toMatchObject({ code: '22001' });
    expect((await x.repo.findById(x.user.id))!.passwordHash).toBe('old-hash');
    expect((await store.findByIdHash(stored.idHash))!.revokedAt).toBeNull();
    expect(await recovery.completeReset(token, 'new-hash', testNow())).toBe(true);
  });

  authControlCases({ database: () => db, admin: () => admin!, now: testNow });
  authOperationalCases({ database: () => db, openDatabase: connectApp, admin: () => admin!, now: testNow });
  approvedConfigurationCases({ database: () => db, openDatabase: connectApp, admin: () => admin!, now: testNow });
  occurrenceReadCases({ database: () => db, openDatabase: connectApp, admin: () => admin!, now: testNow });
  p10p11Cases({ database: () => db, openDatabase: connectApp, admin: () => admin!, now: testNow });
  municipalOfficialCases({ database: () => db, admin: () => admin! });

  it('HTTP -> service -> repositories SQL: cadastro, confirmacao, login e reset', async () => {
    const app = buildApp(readConfig({ APP_ENV: 'test' }));
    const accounts = createAuthRepository(db); const sessions = createSessionStore(db);
    const verification: string[] = []; const resetTokens: string[] = [];
    // Explicit simulation only of delivery and rate policy, not persistence.
    const rate = { async check() { return true; }, async recordFailure() {} };
    const clock = () => testNow();
    registerAuthRoutes(app, { accounts, sessions, rate, now: clock, legal: { termsVersion: 'test-only', privacyVersion: 'test-only' },
      verification: { async queue(_email, token) { verification.push(token); } } }, { production: true, origin: 'https://example.test' });
    registerPasswordRecoveryRoutes(app, { accounts, repository: createPasswordRecoveryRepository(db), rate, now: clock,
      delivery: { async queue(_email, token) { resetTokens.push(token); } } });
    const email = `${randomUUID()}@example.test`; const password = 'frase antiga sintetica integrada';
    try {
      const registered = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {
        name: 'Pessoa sintética', email, password, passwordConfirmation: password, termsAccepted: true, privacyAcknowledged: true
      } });
      expect(registered.statusCode).toBe(202); expect(registered.headers['set-cookie']).toBeUndefined();
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: verification[0] } })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/password/forgot', payload: { email } })).statusCode).toBe(202);
      const nextPassword = 'frase nova sintetica integrada';
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/password/reset', payload: {
        token: resetTokens[0], password: nextPassword, passwordConfirmation: nextPassword
      } })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } })).statusCode).toBe(401);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: nextPassword } })).statusCode).toBe(200);
    } finally { await app.close(); }
  });
});
