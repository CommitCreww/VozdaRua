import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

// Empty until a human reviews a corrected PG17/PostGIS3.6 image and records its digest.
// An environment variable alone cannot approve an image or bypass P01.
const image = process.env.AUTH_SQL_INTEGRATION_IMAGE;
const approved = JSON.parse(readFileSync(new URL('./approved-images.json', import.meta.url), 'utf8')) as string[];
if (image && (!/^\S+@sha256:[a-f0-9]{64}$/.test(image) || !approved.includes(image))) {
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
  const baselineId = randomUUID();
  const migrations = new URL('../../../db/migrations/', import.meta.url);

  beforeAll(async () => {
    container = await new LocalPostgres(image!).withDatabase('auth_tests').withUsername('bootstrap_tests')
      .withPassword(randomBytes(32).toString('hex')).start();
    admin = new Pool({ connectionString: container.getConnectionUri() });
    const version = await admin.query<{ server_version_num: string }>(
      "SELECT current_setting('server_version_num') AS server_version_num");
    expect(Number(version.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(170000);
    expect(Number(version.rows[0]!.server_version_num)).toBeLessThan(180000);
    // A clean baseline followed by an upgrade containing an existing account.
    const client = await admin.connect();
    try {
      for (const filename of readdirSync(migrations).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
        await client.query('BEGIN');
        try { await client.query(readFileSync(new URL(filename, migrations), 'utf8')); await client.query('COMMIT'); }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        if (filename.startsWith('017_')) {
          await client.query('INSERT INTO usuarios(id,nome,email) VALUES ($1,$2,$3)', [baselineId, 'Baseline sintética', 'baseline@example.test']);
        }
      }
      const spatial = await client.query<{ postgis: string }>('SELECT postgis_lib_version() AS postgis');
      expect(spatial.rows[0]!.postgis).toMatch(/^3\.6\./);
      await client.query('BEGIN');
      const appPassword = randomBytes(32).toString('hex');
      await client.query("SELECT set_config('test_auth.role_password',$1,true)", [appPassword]);
      await client.query(`DO $$ BEGIN
        EXECUTE format('CREATE ROLE auth_test_application LOGIN PASSWORD %L', current_setting('test_auth.role_password'));
      END $$`);
      await client.query('GRANT USAGE ON SCHEMA public TO auth_test_application');
      await client.query('GRANT SELECT, INSERT, UPDATE ON usuarios, tokens_conta, sessoes TO auth_test_application');
      await client.query('GRANT SELECT, INSERT ON aceites_legais TO auth_test_application');
      await client.query('COMMIT');
      db = createDatabase({ host: container.getHost(), port: container.getPort(), database: container.getDatabase(), user: 'auth_test_application', password: appPassword });
    } finally { client.release(); }
  }, 120_000);

  afterAll(async () => {
    try { if (db) await db.close(); } finally {
      try { await admin?.end(); } finally { await container?.stop(); }
    }
  });

  async function account() {
    const email = `${randomUUID()}@example.test`;
    const tokenHash = randomBytes(32).toString('hex');
    const repo = createAuthRepository(db);
    await repo.register({ name: 'Pessoa sintética', email, passwordHash: 'old-hash', termsVersion: 'test-only-terms', privacyVersion: 'test-only-privacy', tokenHash, expiresAt: new Date(Date.now() + 86_400_000) });
    const user = (await repo.findByEmail(email))!;
    return { repo, user, email, tokenHash };
  }
  function session(accountId: string, at = new Date()): StoredSession {
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
    expect(await x.repo.register({ name: 'Duplicado', email: x.email.toUpperCase(), passwordHash: 'hash', termsVersion: 'test', privacyVersion: 'test', tokenHash: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 10000) })).toBe(false);
    const email = `${randomUUID()}@example.test`;
    await expect(x.repo.register({ name: 'Rollback', email, passwordHash: 'hash', termsVersion: '', privacyVersion: 'test', tokenHash: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 10000) })).rejects.toMatchObject({ code: '23514' });
    expect(await x.repo.findByEmail(email)).toBeNull();
  });

  it('confirmacao concorrente consome uma vez, sem sessao', async () => {
    const x = await account(); const now = new Date();
    const result = await Promise.all([x.repo.confirmEmail(x.tokenHash, now), x.repo.confirmEmail(x.tokenHash, now)]);
    expect(result.sort()).toEqual([false, true]);
    expect((await x.repo.findById(x.user.id))!.emailVerifiedAt).not.toBeNull();
    expect(await db.query('SELECT id_hash FROM sessoes WHERE usuario_id=$1', [x.user.id])).toHaveLength(0);
  });

  it('sessoes persistem entre stores; renovacao nunca ressuscita revogacao', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, new Date());
    const first = createSessionStore(db); const second = createSessionStore(db); const stored = session(x.user.id);
    expect(await first.save(stored, 'old-hash')).toBe(true);
    expect(await second.findByIdHash(stored.idHash)).toEqual(stored);
    await Promise.all([first.revoke(stored.idHash, new Date()), second.renewIfActive(stored.idHash, new Date())]);
    expect(await second.renewIfActive(stored.idHash, new Date())).toBeNull();
  });

  it('expira exatamente nos limites inativo e absoluto', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, new Date()); const store = createSessionStore(db);
    const at = new Date(); const idle = session(x.user.id, new Date(at.getTime() - SESSION_IDLE_MS));
    expect(await store.save(idle, 'old-hash')).toBe(true);
    expect(await store.renewIfActive(idle.idHash, at)).toBeNull();
    const absolute = { ...session(x.user.id, new Date(at.getTime() - SESSION_ABSOLUTE_MS)), lastActivityAt: new Date(at.getTime() - 1) };
    expect(await store.save(absolute, 'old-hash')).toBe(true);
    expect(await store.renewIfActive(absolute.idHash, at)).toBeNull();
  });

  it('reset concorrente por tokens diferentes altera uma vez e revoga duas sessoes', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, new Date()); const store = createSessionStore(db);
    const first = session(x.user.id); const second = session(x.user.id);
    await store.save(first, 'old-hash'); await store.save(second, 'old-hash');
    const recovery = createPasswordRecoveryRepository(db); const now = new Date();
    const tokens = [randomBytes(32).toString('hex'), randomBytes(32).toString('hex')];
    for (const token of tokens) await recovery.requestReset(x.user.id, token, new Date(now.getTime() + 10000), now);
    expect((await Promise.all(tokens.map((token) => recovery.completeReset(token, 'new-hash', new Date())))).sort()).toEqual([false, true]);
    expect(await store.renewIfActive(first.idHash, new Date())).toBeNull(); expect(await store.renewIfActive(second.idHash, new Date())).toBeNull();
    expect(await store.save(session(x.user.id), 'old-hash')).toBe(false);
  });

  it('falha posterior ao consumo reverte token, senha e sessoes', async () => {
    const x = await account(); await x.repo.confirmEmail(x.tokenHash, new Date()); const store = createSessionStore(db);
    const stored = session(x.user.id); await store.save(stored, 'old-hash');
    const recovery = createPasswordRecoveryRepository(db); const now = new Date(); const token = randomBytes(32).toString('hex');
    await recovery.requestReset(x.user.id, token, new Date(now.getTime() + 10000), now);
    await expect(recovery.completeReset(token, 'x'.repeat(256), new Date())).rejects.toMatchObject({ code: '22001' });
    expect((await x.repo.findById(x.user.id))!.passwordHash).toBe('old-hash');
    expect((await store.findByIdHash(stored.idHash))!.revokedAt).toBeNull();
    expect(await recovery.completeReset(token, 'new-hash', new Date())).toBe(true);
  });

  it('HTTP -> service -> repositories SQL: cadastro, confirmacao, login e reset', async () => {
    const app = buildApp(readConfig({ APP_ENV: 'test' }));
    const accounts = createAuthRepository(db); const sessions = createSessionStore(db);
    const verification: string[] = []; const resetTokens: string[] = [];
    // Explicit simulation only of delivery and rate policy, not persistence.
    const rate = { async check() { return true; }, async recordFailure() {} };
    const clock = () => new Date();
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
