import { randomBytes, randomUUID } from 'node:crypto';
import { createPostmarkTransport } from '../../src/integrations/postmark.js';
import { expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import type { SqlExecutor, TransactionalSqlExecutor } from '../../src/repositories/database.js';
import { createAuthRateRepository } from '../../src/repositories/auth-rate.js';
import { createPersistentAuthRateGate, type AuthRatePolicies } from '../../src/security/auth-rate.js';
import { createAuthControls } from '../../src/services/auth-controls.js';
import { createAuthMailWorker, type AuthMailTransport } from '../../src/services/auth-mail.js';
import { createAuthMailRepository } from '../../src/repositories/auth-mail.js';
import { createAuthRepository } from '../../src/repositories/auth.js';
import { createAuthSecurityRepository } from '../../src/repositories/auth-security.js';
import { hashAccountToken } from '../../src/security/tokens.js';
import { buildApp } from '../../src/app.js';
import { readConfig } from '../../src/config/index.js';
import { registerAuthRoutes } from '../../src/routes/auth.js';
import { registerPasswordRecoveryRoutes } from '../../src/routes/password-recovery.js';

// Test-only policies. These numbers are not operational defaults or approved thresholds.
export function fixtureRatePolicies(limit = 100): AuthRatePolicies {
  const policy = () => ({
    origin: { limit, windowMs: 60000 }, identity: { limit, windowMs: 60000 }, session: { limit, windowMs: 60000 },
    failureWindowMs: 60000, cooldownMs: [1000, 2000]
  });
  return { register: policy(), resend: policy(), login: policy(), forgot: policy(), reset: policy() };
}
const workerPolicy = { leaseMs: 10000, timeoutMs: 2000, retryDelaysMs: [1000, 2000] as const };

export function authControlCases(fixture: { database(): TransactionalSqlExecutor; admin(): Pool; now(): Date }) {
  const adminSql = (): SqlExecutor => ({ async query<Row>(sql: string, values?: readonly unknown[]) {
    return (await fixture.admin().query(sql, values ? [...values] : undefined)).rows as Row[];
  } });
  async function intent() {
    const db = fixture.database();
    const mail = createAuthMailRepository(db);
    const accounts = createAuthRepository(db, mail.effect);
    const email = `${randomUUID()}@example.test`;
    const requestHash = randomBytes(32).toString('hex');
    await accounts.register({ name: 'Pessoa sintética', email, passwordHash: 'synthetic-hash', termsVersion: 'test-only', privacyVersion: 'test-only',
      tokenHash: requestHash, expiresAt: new Date(fixture.now().getTime() + 86400000) });
    const account = (await accounts.findByEmail(email))!;
    const [job] = await db.query<{ id: string }>('SELECT id FROM envios_email_auth WHERE solicitacao_hash=$1', [requestHash]);
    return { mail, accounts, email, account, requestHash, jobId: job!.id };
  }
  // Scope workers to each fixture through ID, using due time to control retry without sleeping.
  async function onlyDue(jobId: string) {
    await fixture.admin().query("UPDATE envios_email_auth SET proxima_em=clock_timestamp()+INTERVAL '1 day' WHERE estado='PENDING'");
    await fixture.admin().query('UPDATE envios_email_auth SET proxima_em=clock_timestamp() WHERE id=$1', [jobId]);
  }

  it('limite persistente compartilhado serializa tentativas concorrentes', async () => {
    const db = fixture.database(); const key = randomBytes(32); const policy = fixtureRatePolicies(5);
    const one = createPersistentAuthRateGate(createAuthRateRepository(db), policy, key);
    const two = createPersistentAuthRateGate(createAuthRateRepository(db), policy, key);
    const origin = randomUUID(); const identity = `${randomUUID()}@example.test`;
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? one : two).check('login', origin, identity)));
    expect(results.filter(Boolean)).toHaveLength(5);
    const rows = await db.query<{ chave_hash: string; quantidade: number }>('SELECT chave_hash,quantidade FROM limites_auth WHERE acao=$1', ['login']);
    expect(rows.every((row) => /^[a-f0-9]{64}$/.test(row.chave_hash))).toBe(true);
    expect(JSON.stringify(rows)).not.toContain(identity); expect(JSON.stringify(rows)).not.toContain(origin);
  }, 20000);

  it('dimensoes identidade/origem/sessao e cooldown sao temporarios', async () => {
    const db = fixture.database(); const repo = createAuthRateRepository(db);
    const gate = createPersistentAuthRateGate(repo, fixtureRatePolicies(1), randomBytes(32));
    const identity = randomUUID(); const origin = randomUUID(); const session = randomUUID();
    expect(await gate.check('login', origin, identity, session)).toBe(true);
    expect(await gate.check('login', randomUUID(), identity)).toBe(false);
    expect(await gate.check('login', origin, randomUUID())).toBe(false);
    expect(await gate.check('login', randomUUID(), randomUUID(), session)).toBe(false);
    await fixture.admin().query("UPDATE limites_auth SET expira_em=clock_timestamp()-INTERVAL '1 second' WHERE acao='login'");
    expect(await gate.check('login', origin, identity, session)).toBe(true);
    const cooldown = createPersistentAuthRateGate(repo, fixtureRatePolicies(), randomBytes(32));
    const peer = randomUUID(); const email = randomUUID();
    await cooldown.recordFailure('login', peer, email);
    expect(await cooldown.check('login', peer, email)).toBe(false);
    await cooldown.recordFailure('login', peer, email);
    const [progressive] = await fixture.database().query<{ quantidade: number }>("SELECT quantidade FROM limites_auth WHERE escopo='failure' AND quantidade=1");
    expect(progressive!.quantidade).toBe(1); // Active cooldown is not renewed by another failure.
    expect(await cooldown.check('login', randomUUID(), email)).toBe(true);
    await fixture.admin().query("UPDATE limites_auth SET expira_em=clock_timestamp()-INTERVAL '1 second' WHERE escopo='failure'");
    expect(await cooldown.check('login', peer, email)).toBe(true);
  }, 20000);

  it('intencao duravel confirma atomicidade, deduplicacao e ausencia de token bruto', async () => {
    const x = await intent(); const db = fixture.database();
    await db.transaction(async (sql) => x.mail.effect.issued(sql, x.account.id, 'EMAIL_VERIFICATION', x.requestHash, new Date(fixture.now().getTime() + 10000)));
    expect(await db.query('SELECT id FROM envios_email_auth WHERE solicitacao_hash=$1', [x.requestHash])).toHaveLength(1);
    const email = `${randomUUID()}@example.test`;
    const failing = createAuthRepository(db, { async issued() { throw new Error('synthetic failure'); } });
    await expect(failing.register({ name: 'Rollback', email, passwordHash: 'hash', termsVersion: 'test', privacyVersion: 'test', tokenHash: randomBytes(32).toString('hex'), expiresAt: new Date(fixture.now().getTime() + 10000) })).rejects.toThrow('synthetic failure');
    expect(await failing.findByEmail(email)).toBeNull();
    const columns = await db.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name='envios_email_auth'");
    expect(columns.map((row) => row.column_name)).not.toContain('token');
    expect(columns.map((row) => row.column_name)).not.toContain('email');
  });

  it('workers concorrentes nao enviam duas vezes uma intencao confirmada', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    const messages: { idempotencyKey: string; token: string }[] = [];
    const transport: AuthMailTransport = { async send(message) { messages.push(message); return 'DELIVERED'; } };
    const one = createAuthMailWorker(x.mail, transport, workerPolicy);
    const two = createAuthMailWorker(createAuthMailRepository(fixture.database()), transport, workerPolicy);
    await Promise.all([one.runOne(), two.runOne()]);
    expect(messages).toHaveLength(1); expect(messages[0]!.idempotencyKey).toBe(x.jobId);
    const rows = await fixture.database().query<{ estado: string; tentativas: number }>('SELECT estado,tentativas FROM envios_email_auth WHERE id=$1', [x.jobId]);
    expect(rows[0]).toEqual({ estado: 'SENT', tentativas: 1 });
    expect(await x.accounts.confirmEmail(hashAccountToken(messages[0]!.token), fixture.now())).toBe(true);
    expect(await one.runOne()).toBe(false);
  }, 20000);

  it('falha temporaria agenda retries progressivos e encerra em tres tentativas', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    const keys: string[] = [];
    const transport: AuthMailTransport = { async send(message) { keys.push(message.idempotencyKey); throw new Error('synthetic transport failure with private details'); } };
    for (let attempt = 1; attempt <= 3; attempt++) {
      expect(await createAuthMailWorker(x.mail, transport, workerPolicy).runOne()).toBe(true);
      const [row] = await fixture.database().query<{ estado: string; tentativas: number; resultado: string; wait_ms: number }>(
        "SELECT estado,tentativas,resultado,EXTRACT(EPOCH FROM(proxima_em-atualizado_em))*1000 AS wait_ms FROM envios_email_auth WHERE id=$1", [x.jobId]);
      expect(row!.tentativas).toBe(attempt); expect(row!.resultado).toBe('TEMPORARY');
      expect(row!.estado).toBe(attempt < 3 ? 'PENDING' : 'FAILED');
      if (attempt < 3) { expect(Number(row!.wait_ms)).toBeGreaterThanOrEqual(workerPolicy.retryDelaysMs[attempt - 1]! - 1); await onlyDue(x.jobId); }
    }
    expect(new Set(keys).size).toBe(1); expect(keys).toHaveLength(3);
    expect(await createAuthMailWorker(x.mail, transport, workerPolicy).runOne()).toBe(false);
    const attempts = await fixture.database().query<{ tentativa: number; resultado: string; claim_id: string; concluido_em: Date }>(
      'SELECT tentativa,resultado,claim_id,concluido_em FROM tentativas_email_auth WHERE envio_id=$1 ORDER BY tentativa', [x.jobId]);
    expect(attempts.map((row) => row.tentativa)).toEqual([1, 2, 3]);
    expect(attempts.every((row) => row.resultado === 'TEMPORARY' && row.concluido_em instanceof Date)).toBe(true);
    expect(new Set(attempts.map((row) => row.claim_id)).size).toBe(3);
  }, 20000);

  it('adaptador HTTPS simulado integra retry e ACK com PostgreSQL real sem envio externo', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    let calls = 0;
    const transport = createPostmarkTransport({ serverToken: 'synthetic-only', from: 'sender@example.test', messageStream: 'outbound', timeoutMs: workerPolicy.timeoutMs,
      render: () => ({ subject: 'Synthetic', textBody: 'No external delivery' }),
      fetch: async (url, init) => {
        expect(url).toBe('https://api.postmarkapp.com/email');
        expect(JSON.parse(init!.body as string).Metadata.auth_intent_id).toBe(x.jobId);
        calls++;
        return calls === 1 ? new Response(null, { status: 503 }) : Response.json({ ErrorCode: 0, MessageID: randomUUID() });
      } });
    await createAuthMailWorker(x.mail, transport, workerPolicy).runOne();
    expect((await fixture.database().query<{ estado: string }>('SELECT estado FROM envios_email_auth WHERE id=$1', [x.jobId]))[0]!.estado).toBe('PENDING');
    await onlyDue(x.jobId);
    await createAuthMailWorker(x.mail, transport, workerPolicy).runOne();
    expect((await fixture.database().query<{ estado: string }>('SELECT estado FROM envios_email_auth WHERE id=$1', [x.jobId]))[0]!.estado).toBe('SENT');
    expect((await fixture.database().query<{ resultado: string }>('SELECT resultado FROM tentativas_email_auth WHERE envio_id=$1 ORDER BY tentativa', [x.jobId])).map((r) => r.resultado)).toEqual(['TEMPORARY', 'DELIVERED']);
    expect(calls).toBe(2);
  }, 20000);

  it('erro definitivo e expiracao encerram sem envio adicional', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    const send = vi.fn(async () => 'PERMANENT' as const);
    await createAuthMailWorker(x.mail, { send }, workerPolicy).runOne();
    expect(await createAuthMailWorker(x.mail, { send }, workerPolicy).runOne()).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    const expired = await intent(); await onlyDue(expired.jobId);
    await fixture.admin().query("UPDATE envios_email_auth SET expira_em=clock_timestamp()-INTERVAL '1 second' WHERE id=$1", [expired.jobId]);
    expect(await createAuthMailWorker(expired.mail, { send }, workerPolicy).runOne()).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('claim interrompido e recuperado apos lease, ACK antigo e recusado', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    const first = (await x.mail.claim(10000))!;
    await fixture.admin().query("UPDATE envios_email_auth SET lease_ate=clock_timestamp()-INTERVAL '1 second' WHERE id=$1", [x.jobId]);
    const second = (await createAuthMailRepository(fixture.database()).claim(10000))!;
    expect(second.claim_id).not.toBe(first.claim_id); expect(second.tentativas).toBe(2);
    expect(await x.mail.finish(first, 'DELIVERED', 0)).toBe(false);
    expect(await x.mail.finish(second, 'DELIVERED', 0)).toBe(true);
    expect(await x.mail.claim(10000)).toBeNull();
    const crashed = await intent(); await onlyDue(crashed.jobId);
    for (let attempt = 1; attempt <= 3; attempt++) {
      expect((await crashed.mail.claim(10000))!.tentativas).toBe(attempt);
      await fixture.admin().query("UPDATE envios_email_auth SET lease_ate=clock_timestamp()-INTERVAL '1 second' WHERE id=$1", [crashed.jobId]);
    }
    expect(await crashed.mail.claim(10000)).toBeNull();
    const [terminal] = await fixture.database().query<{ estado: string; resultado: string }>('SELECT estado,resultado FROM envios_email_auth WHERE id=$1', [crashed.jobId]);
    expect(terminal).toEqual({ estado: 'FAILED', resultado: 'EXHAUSTED' });
  });

  it('resposta incerta preserva chave de idempotencia e validade do primeiro token entregue', async () => {
    const x = await intent(); await onlyDue(x.jobId);
    let accepted: { token: string; idempotencyKey: string } | undefined;
    const transport: AuthMailTransport = { async send(message) {
      if (!accepted) { accepted = message; throw new Error('simulated response lost after acceptance'); }
      expect(message.idempotencyKey).toBe(accepted.idempotencyKey);
      return 'DELIVERED'; // simulated provider deduplicates the repeated key
    } };
    await createAuthMailWorker(x.mail, transport, workerPolicy).runOne();
    await onlyDue(x.jobId);
    await createAuthMailWorker(x.mail, transport, workerPolicy).runOne();
    expect(await x.accounts.confirmEmail(hashAccountToken(accepted!.token), fixture.now())).toBe(true);
  });

  it('controle HTTP integra limite 429, e-mail duravel, login e eventos de seguranca', async () => {
    const controls = createAuthControls(fixture.database(), fixtureRatePolicies(), randomBytes(32));
    const app = buildApp(readConfig({ APP_ENV: 'test' }));
    const auth = registerAuthRoutes(app, { ...controls, legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, now: fixture.now }, { production: true, origin: 'https://example.test' });
    registerPasswordRecoveryRoutes(app, { ...controls, now: fixture.now });
    const email = `${randomUUID()}@example.test`; const password = 'frase sintetica para controle SQL';
    const sent: { token: string; recipient: string }[] = [];
    const transport: AuthMailTransport = { async send(message) { sent.push(message); return 'DELIVERED'; } };
    try {
      const registered = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { name: 'Pessoa sintética', email, password, passwordConfirmation: password, termsAccepted: true, privacyAcknowledged: true } });
      expect(registered.statusCode).toBe(202); expect(sent).toHaveLength(0);
      const user = (await controls.accounts.findByEmail(email))!;
      const [intent] = await fixture.database().query<{ id: string }>('SELECT id FROM envios_email_auth WHERE usuario_id=$1', [user.id]);
      await onlyDue(intent!.id);
      await createAuthMailWorker(controls.mail, transport, workerPolicy).runOne();
      expect(sent).toHaveLength(1); expect(sent[0]!.recipient).toBe(email);
      const login = (candidate = password) => app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: candidate } });
      expect((await login()).statusCode).toBe(403);
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: sent[0]!.token } })).statusCode).toBe(200);
      const logged = await login(); expect(logged.statusCode).toBe(200);
      const failed = await login('senha incorreta sintetica');
      expect(failed.statusCode).toBe(401);
      const [failure] = await fixture.database().query<{ evento: string; usuario_id: string | null }>('SELECT evento,usuario_id FROM eventos_seguranca_auth WHERE request_id=$1', [failed.headers['x-request-id']]);
      expect(failure).toEqual({ evento: 'LOGIN_FAILED', usuario_id: null });
      expect((await login()).statusCode).toBe(429);
      const events = await fixture.database().query<{ evento: string; request_id: string | null }>(
        'SELECT evento,request_id FROM eventos_seguranca_auth WHERE usuario_id=$1 OR request_id=$2 ORDER BY criado_em', [user.id, logged.headers['x-request-id']]);
      expect(events.map((row) => row.evento)).toEqual(['ACCESS_DENIED', 'LOGIN_SUCCEEDED']);
      expect(events.every((row) => typeof row.request_id === 'string')).toBe(true);
      const [access] = await fixture.database().query<{ ultimo_acesso_em: Date | null }>('SELECT ultimo_acesso_em FROM usuarios WHERE id=$1', [user.id]);
      expect(access!.ultimo_acesso_em).not.toBeNull();
      const eventText = JSON.stringify(await fixture.database().query('SELECT * FROM eventos_seguranca_auth'));
      expect(eventText).not.toContain(email); expect(eventText).not.toContain(password); expect(eventText).not.toContain(sent[0]!.token);
      expect(eventText).not.toContain(String(logged.headers['set-cookie']));
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/password/forgot', payload: { email } })).statusCode).toBe(202);
      expect((await fixture.database().query('SELECT id FROM envios_email_auth WHERE usuario_id=$1', [user.id])).length).toBe(2);
      const [resetJob] = await fixture.database().query<{ id: string }>("SELECT id FROM envios_email_auth WHERE usuario_id=$1 AND tipo='PASSWORD_RESET'", [user.id]);
      await onlyDue(resetJob!.id);
      await createAuthMailWorker(controls.mail, transport, workerPolicy).runOne();
      expect(sent).toHaveLength(2);
      const nextPassword = 'frase nova sintetica para controle SQL';
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/password/reset', payload: {
        token: sent[1]!.token, password: nextPassword, passwordConfirmation: nextPassword
      } })).statusCode).toBe(200);
      const sessionId = String(logged.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
      expect(await auth.current(sessionId)).toBeNull();
    } finally { await app.close(); }
  }, 20000);

  it('falha de auditoria reverte sessao; retencao de seguranca usa 30 dias e app nao apaga eventos', async () => {
    const controls = createAuthControls(fixture.database(), fixtureRatePolicies(), randomBytes(32));
    const x = await intent();
    expect(await x.accounts.confirmEmail(x.requestHash, fixture.now())).toBe(true);
    const at = fixture.now(); const idHash = randomBytes(32).toString('hex');
    await expect(controls.sessions.save({ idHash, accountId: x.account.id, csrfTokenHash: randomBytes(32).toString('hex'), createdAt: at, lastActivityAt: at, revokedAt: null }, 'synthetic-hash', 'invalid-uuid')).rejects.toMatchObject({ code: '22P02' });
    expect(await controls.sessions.findByIdHash(idHash)).toBeNull();
    await expect(fixture.database().query('DELETE FROM eventos_seguranca_auth')).rejects.toMatchObject({ code: '42501' });
    const [old] = await fixture.admin().query("INSERT INTO eventos_seguranca_auth(evento,resultado,criado_em) VALUES('LOGIN_FAILED','FAILURE',clock_timestamp()-INTERVAL '31 days') RETURNING id").then((r) => r.rows);
    await createAuthSecurityRepository(adminSql()).purge();
    expect(await fixture.database().query('SELECT id FROM eventos_seguranca_auth WHERE id=$1', [old.id])).toHaveLength(0);
    expect((await fixture.database().query('SELECT id FROM eventos_seguranca_auth')).length).toBeGreaterThan(0);
    expect(await controls.mail.metrics()).not.toHaveLength(0);
  });
}
