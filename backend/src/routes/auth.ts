import cookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { createAuthService, type AuthDependencies } from '../services/auth.js';
import { normalizedEmail, objectWithKeys, registrationBody } from '../schemas/auth.js';

const COOKIE = 'vdr_session';
export function registerAuthRoutes(app: FastifyInstance, deps: AuthDependencies, options: { production: boolean; origin: string }) {
  app.register(cookie);
  const auth = createAuthService(deps);
  const error = (reply: FastifyReply, status: number, requestId: string) => reply.code(status).send({ code: status === 429 ? 'RATE_LIMITED' : status === 401 ? 'UNAUTHORIZED' : 'INVALID_INPUT', message: 'Não foi possível concluir a solicitação.', requestId });
  const cookieOptions = { httpOnly: true, secure: options.production, sameSite: 'lax' as const, path: '/' };

  app.post('/api/v1/auth/register', async (request, reply) => {
    const body = registrationBody(request.body);
    if (!body) return error(reply, 422, request.id);
    const result = await auth.register(body, request.ip);
    if (result.status === 'limited') return error(reply, 429, request.id);
    if (result.status !== 'ok') return error(reply, 422, request.id);
    return reply.code(202).send({ status: 'accepted' });
  });
  app.post('/api/v1/auth/email/resend', async (request, reply) => {
    const body = objectWithKeys(request.body, ['email']);
    const email = normalizedEmail(body?.email);
    if (!email) return error(reply, 422, request.id);
    const result = await auth.resend(email, request.ip);
    return result.status === 'limited' ? error(reply, 429, request.id) : reply.code(202).send({ status: 'accepted' });
  });
  app.post('/api/v1/auth/email/verify', async (request, reply) => {
    const body = objectWithKeys(request.body, ['token']);
    if (typeof body?.token !== 'string') return error(reply, 422, request.id);
    const result = await auth.verify(body.token);
    return result.status === 'ok' ? reply.send({ status: 'verified' }) : error(reply, 422, request.id);
  });
  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = objectWithKeys(request.body, ['email', 'password']);
    const email = normalizedEmail(body?.email);
    if (!email || typeof body?.password !== 'string') return error(reply, 422, request.id);
    const result = await auth.login(email, body.password, request.ip, request.id);
    if (result.status === 'limited') return error(reply, 429, request.id);
    if (result.status === 'unverified') return reply.code(403).send({ code: 'EMAIL_UNVERIFIED', message: 'Confirme seu e-mail antes de entrar.', requestId: request.id });
    if (result.status !== 'ok') return error(reply, 401, request.id);
    reply.setCookie(COOKIE, result.value.sessionId, cookieOptions);
    return reply.send({ account: result.value.account, csrfToken: result.value.csrfToken });
  });
  app.post('/api/v1/auth/logout', async (request, reply) => {
    const sessionId = request.cookies[COOKIE];
    const csrf = request.headers['x-csrf-token'];
    if (!sessionId || typeof csrf !== 'string') return error(reply, 401, request.id);
    const result = await auth.logout(sessionId, csrf, request.headers.origin === options.origin);
    if (result.status !== 'ok') return error(reply, 401, request.id);
    reply.clearCookie(COOKIE, cookieOptions);
    return reply.code(204).send();
  });
  return auth; // internal session lookup; no undocumented GET route
}
