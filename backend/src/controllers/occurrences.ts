import type { FastifyReply, FastifyRequest } from 'fastify';
import { OccurrenceReadError, type createOccurrenceReadService } from '../services/occurrences.js';
import { emptyOccurrenceQuery, nearbyQuery, occurrenceId, occurrencePagination, validateOccurrencePaginationPolicy, type OccurrencePaginationPolicy } from '../schemas/occurrences.js';
import { objectWithKeys } from '../schemas/auth.js';

export function createOccurrenceReadController(service: ReturnType<typeof createOccurrenceReadService>, policy: OccurrencePaginationPolicy) {
  validateOccurrencePaginationPolicy(policy);
  const invalid = (): never => { throw new OccurrenceReadError(422); };
  const id = (request: FastifyRequest) => occurrenceId(objectWithKeys(request.params,['id'])?.id) ?? invalid();
  const codes = { 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 422: 'INVALID_INPUT', 503: 'DEPENDENCY_UNAVAILABLE' } as const;
  async function execute(request: FastifyRequest, reply: FastifyReply, operation: () => Promise<unknown>) {
    try {
      await service.authorize(request.cookies?.vdr_session);
      reply.header('cache-control','private, no-store');
      return reply.send(await operation());
    } catch (error) {
      const status = error instanceof OccurrenceReadError ? error.statusCode : 503;
      reply.header('cache-control','private, no-store');
      return reply.code(status).send({ code: codes[status], message: 'Não foi possível consultar a ocorrência.', requestId: request.id });
    }
  }
  return {
    nearby: (request: FastifyRequest, reply: FastifyReply) => execute(request,reply,async () => service.nearby(nearbyQuery(request.query,policy) ?? invalid())),
    detail: (request: FastifyRequest, reply: FastifyReply) => execute(request,reply,async () => {
      if (!emptyOccurrenceQuery(request.query)) invalid(); return service.detail(id(request));
    }),
    reports: (request: FastifyRequest, reply: FastifyReply) => execute(request,reply,async () => service.reports(id(request),occurrencePagination(request.query,policy) ?? invalid())),
    history: (request: FastifyRequest, reply: FastifyReply) => execute(request,reply,async () => service.history(id(request),occurrencePagination(request.query,policy) ?? invalid())),
    officialChannel: (request: FastifyRequest, reply: FastifyReply) => execute(request,reply,async () => {
      if (!emptyOccurrenceQuery(request.query)) invalid(); return service.officialChannel(id(request));
    })
  };
}
