import { randomBytes, randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import type { Pool } from 'pg';
import { composeAuthBackend } from '../../src/composition/auth.js';
import { composePostmarkWorker, purgeAuthMailHistory } from '../../src/composition/auth-mail.js';
import { readConfig } from '../../src/config/index.js';
import { AUTH_MAIL } from '../../src/config/auth-mail.js';
import type { createDatabase, SqlExecutor } from '../../src/repositories/database.js';
import { createAuthMailRepository } from '../../src/repositories/auth-mail.js';
import { createAuthRepository } from '../../src/repositories/auth.js';
import { createAuthMailWorker } from '../../src/services/auth-mail.js';
import { createPostmarkTransport, type PostmarkOptions } from '../../src/integrations/postmark.js';
import { createAuthMailMonitor, type MailAlert } from '../../src/services/auth-mail-monitor.js';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from '../../src/security/sessions.js';
import { hashAccountToken } from '../../src/security/tokens.js';
import { fixtureRatePolicies } from './auth-controls-cases.js';

export function authOperationalCases(fixture: {
  database(): ReturnType<typeof createDatabase>;
  openDatabase(): ReturnType<typeof createDatabase>;
  admin(): Pool;
  now(): Date;
}) {
  async function onlyDue(id: string) {
    await fixture.admin().query("UPDATE envios_email_auth SET proxima_em=clock_timestamp()+INTERVAL '1 day' WHERE estado='PENDING'");
    await fixture.admin().query('UPDATE envios_email_auth SET proxima_em=clock_timestamp() WHERE id=$1', [id]);
  }
  const maintenance: SqlExecutor = { async query<Row>(sql: string, values?: readonly unknown[]) {
    return (await fixture.admin().query(sql, values ? [...values] : undefined)).rows as Row[];
  } };

  it('composicao HTTP + pools reais: cadastro/outbox/retry/confirmacao/login/reinicio/logout/reset/expiracao', async () => {
    let advanceMs = 0;
    const clock = () => new Date(fixture.now().getTime() + advanceMs);
    const rateKey = randomBytes(32);
    const make = () => composeAuthBackend({ config: readConfig({ APP_ENV: 'test' }), database: fixture.openDatabase(), ratePolicies: fixtureRatePolicies(), rateKey,
      legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, origin: 'https://example.test', now: clock });
    const first = make(); const firstAuth = first.mountExperimentalHttp();
    let second: ReturnType<typeof make> | undefined;
    const email = `${randomUUID()}@example.test`; const password = 'frase sintetica para composicao';
    let sentToken = ''; let sends = 0;
    const postmark: PostmarkOptions = { from: 'sender@example.test', serverToken: 'synthetic-only', messageStream: 'outbound', timeoutMs: 2000,
      render: (message) => ({ subject: 'Synthetic', textBody: message.token }),
      fetch: async (_url, init) => {
        sends++; sentToken = JSON.parse(init!.body as string).TextBody;
        return sends === 1 ? new Response(null, { status: 503 }) : Response.json({ ErrorCode: 0, MessageID: randomUUID() });
      } };
    const prepared = composePostmarkWorker({ database: fixture.database(), postmark, leaseMs: 20000, backoffFactor: 2, log() {} });
    // Drive individual ticks without a wall-clock sleep; HTTP/SQL are real, only provider I/O is simulated.
    const worker = createAuthMailWorker(createAuthMailRepository(fixture.database()), createPostmarkTransport(postmark), prepared.policies.delivery);
    try {
      const registered = await first.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {
        name: 'Pessoa sintética', email, password, passwordConfirmation: password, termsAccepted: true, privacyAcknowledged: true } });
      expect(registered.statusCode).toBe(202); expect(registered.headers['set-cookie']).toBeUndefined(); expect(sends).toBe(0);
      const account = (await first.controls.accounts.findByEmail(email))!;
      const [job] = await fixture.database().query<{ id: string }>('SELECT id FROM envios_email_auth WHERE usuario_id=$1', [account.id]);
      await onlyDue(job!.id); expect(await worker.runOne()).toBe(true);
      const [retry] = await fixture.database().query<{ estado: string; wait_ms: number }>(
        "SELECT estado,EXTRACT(EPOCH FROM(proxima_em-atualizado_em))*1000 AS wait_ms FROM envios_email_auth WHERE id=$1", [job!.id]);
      expect(retry!.estado).toBe('PENDING'); expect(Math.abs(Number(retry!.wait_ms) - AUTH_MAIL.retryDelaysMs[0])).toBeLessThan(1);
      expect(await worker.runOne()).toBe(false); // Approved 1-minute delay enforced by SQL.
      await onlyDue(job!.id); expect(await worker.runOne()).toBe(true); expect(sends).toBe(2);
      const login = (app: typeof first.app, candidate = password) => app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: candidate } });
      expect((await login(first.app)).statusCode).toBe(403);
      expect((await first.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: sentToken } })).statusCode).toBe(200);
      expect((await first.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: sentToken } })).statusCode).toBe(422);
      const logged = await login(first.app); expect(logged.statusCode).toBe(200);
      const cookie = String(logged.headers['set-cookie']).split(';')[0]!;
      const sessionId = cookie.split('=')[1]!; const csrf = logged.json<{ csrfToken: string }>().csrfToken;
      expect(String(logged.headers['set-cookie'])).toMatch(/HttpOnly/); expect(String(logged.headers['set-cookie'])).toMatch(/Secure/);
      expect(await firstAuth.current(sessionId)).not.toBeNull();
      await first.app.close(); // New Fastify composition and independent pool must see persisted session.
      second = make(); const auth = second.mountExperimentalHttp();
      expect(await auth.current(sessionId)).not.toBeNull();
      expect((await second.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie, origin: 'https://example.test', 'x-csrf-token': 'invalid' } })).statusCode).toBe(401);
      expect(await auth.current(sessionId)).not.toBeNull();
      expect((await second.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie, origin: 'https://example.test', 'x-csrf-token': csrf } })).statusCode).toBe(204);
      expect(await auth.current(sessionId)).toBeNull();
      const beforeReset = await login(second.app); expect(beforeReset.statusCode).toBe(200);
      const resetSession = String(beforeReset.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
      expect((await second.app.inject({ method: 'POST', url: '/api/v1/auth/password/forgot', payload: { email } })).statusCode).toBe(202);
      const [resetJob] = await fixture.database().query<{ id: string }>("SELECT id FROM envios_email_auth WHERE usuario_id=$1 AND tipo='PASSWORD_RESET'", [account.id]);
      await onlyDue(resetJob!.id); expect(await worker.runOne()).toBe(true);
      const nextPassword = 'outra frase sintetica composicao';
      expect((await second.app.inject({ method: 'POST', url: '/api/v1/auth/password/reset', payload: { token: sentToken, password: nextPassword, passwordConfirmation: nextPassword } })).statusCode).toBe(200);
      expect(await auth.current(resetSession)).toBeNull();
      const fresh = await login(second.app, nextPassword); expect(fresh.statusCode).toBe(200);
      const freshId = String(fresh.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
      advanceMs += SESSION_IDLE_MS;
      expect(await auth.current(freshId)).toBeNull();
      const absolute = await login(second.app, nextPassword); expect(absolute.statusCode).toBe(200);
      const absoluteId = String(absolute.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
      advanceMs += SESSION_ABSOLUTE_MS;
      await fixture.admin().query('UPDATE sessoes SET ultima_atividade_em=$2 WHERE id_hash=$1', [hashAccountToken(absoluteId), new Date(clock().getTime() - 1000)]);
      expect(await auth.current(absoluteId)).toBeNull();
      const events = await fixture.database().query('SELECT * FROM eventos_seguranca_auth WHERE usuario_id=$1', [account.id]);
      expect(events.length).toBeGreaterThan(0); expect(JSON.stringify(events)).not.toContain(email);
      expect(JSON.stringify(events)).not.toContain(sentToken); expect(JSON.stringify(events)).not.toContain(sessionId);
      expect((await fixture.database().query('SELECT id_hash FROM sessoes WHERE id_hash=$1', [hashAccountToken(freshId)])).length).toBe(1);
    } finally { await first.app.close(); await second?.app.close(); }
  }, 30000);

  it('retencao aprovada expurga somente terminais antigos/historico e metricas alimentam alertas minimizados', async () => {
    const mail = createAuthMailRepository(fixture.database());
    const accounts = createAuthRepository(fixture.database(), mail.effect);
    async function intent() {
      const hash = randomBytes(32).toString('hex');
      await accounts.register({ name: 'Pessoa sintética', email: `${randomUUID()}@example.test`, passwordHash: 'synthetic-hash',
        termsVersion: 'test-only', privacyVersion: 'test-only', tokenHash: hash, expiresAt: new Date(fixture.now().getTime() + 86400000) });
      return (await fixture.database().query<{ id: string }>('SELECT id FROM envios_email_auth WHERE solicitacao_hash=$1', [hash]))[0]!.id;
    }
    const old = await intent(); await onlyDue(old);
    const job = (await mail.claim(20000))!; expect(job.id).toBe(old);
    expect(await mail.finish(job, 'DELIVERED', 0)).toBe(true);
    await fixture.admin().query("UPDATE envios_email_auth SET atualizado_em=clock_timestamp()-INTERVAL '31 days' WHERE id=$1", [old]);
    const recent = await intent(); await onlyDue(recent);
    expect(await mail.finish((await mail.claim(20000))!, 'PERMANENT', 0)).toBe(true);
    const pending = await intent();
    await fixture.admin().query("UPDATE envios_email_auth SET criado_em=clock_timestamp()-INTERVAL '31 days' WHERE id=$1", [pending]);
    const alerts: MailAlert[] = [];
    const snapshot = await createAuthMailMonitor(mail, { backlogCount: 1, oldestPendingMs: 1 }, async (alert) => { alerts.push(alert); }).check(); // Fixtures, not approved thresholds.
    expect(snapshot.failed).toBeGreaterThan(0); expect(snapshot.oldestPendingMs).toBeGreaterThan(30 * 86400000);
    expect(alerts.map((a) => a.code)).toEqual(['AUTH_MAIL_FAILED', 'AUTH_MAIL_BACKLOG']);
    expect(JSON.stringify(alerts)).not.toContain('usuario_id'); expect(JSON.stringify(alerts)).not.toContain('solicitacao_hash');
    await expect(purgeAuthMailHistory(fixture.database())).rejects.toMatchObject({ code: '42501' });
    await purgeAuthMailHistory(maintenance);
    expect(await fixture.database().query('SELECT id FROM envios_email_auth WHERE id=$1', [old])).toHaveLength(0);
    expect(await fixture.database().query('SELECT envio_id FROM tentativas_email_auth WHERE envio_id=$1', [old])).toHaveLength(0);
    expect(await fixture.database().query('SELECT id FROM envios_email_auth WHERE id IN ($1,$2)', [recent, pending])).toHaveLength(2);
  }, 20000);
}
