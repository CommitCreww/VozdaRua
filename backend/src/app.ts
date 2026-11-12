import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import Fastify, { LogController } from 'fastify';
import type { AppConfig } from './config/index.js';
import type { DatabasePort } from './repositories/database.js';

export function buildApp(config: AppConfig, database?: DatabasePort) {
  const app = Fastify({
    bodyLimit: 1_048_576,
    trustProxy: false,
    logController: new LogController({ disableRequestLogging: true }),
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    logger: {
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
        censor: '[REDACTED]'
      }
    }
  });

  app.register(cors, {
    origin: config.corsOrigins.length ? config.corsOrigins : false,
    credentials: false,
    strictPreflight: true
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);
    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({ requestId: request.id, statusCode: reply.statusCode }, 'request completed');
  });

  app.setErrorHandler((error, request, reply) => {
    const code = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : 500;
    const status = Number.isInteger(code) && code >= 400 && code < 500 ? code : 500;
    request.log.error({ status, requestId: request.id }, 'request failed');
    reply.code(status).send({
      code: status === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      message: status === 500 ? 'Erro interno.' : 'Requisição inválida.',
      requestId: request.id
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ code: 'NOT_FOUND', message: 'Recurso não encontrado.', requestId: request.id });
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/ready', async (request, reply) => {
    try {
      if (!database) throw new Error('Database not configured');
      await database.check();
      return { status: 'ready' };
    } catch {
      request.log.warn({ requestId: request.id }, 'dependency unavailable');
      return reply.code(503).send({ status: 'unavailable' });
    }
  });
  if (database) app.addHook('onClose', async () => { await database.close(); });
  return app;
}
