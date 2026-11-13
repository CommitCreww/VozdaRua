import type { FastifyRequest, FastifyReply } from 'fastify';
import { objectWithKeys } from '../schemas/auth.js';
import { privacyBody } from '../schemas/profile.js';
import { ProfileError, type createProfileService } from '../services/profile.js';

export function createProfileController(service: ReturnType<typeof createProfileService>) {
  async function execute(request: FastifyRequest,reply: FastifyReply,work: () => Promise<unknown>) {
    try {
      if (!request.cookies?.vdr_session) throw new ProfileError(401);
      if (!objectWithKeys(request.query,[])) throw new ProfileError(422);
      reply.header('cache-control','private, no-store'); return reply.send(await work());
    } catch (error) {
      const status = error instanceof ProfileError ? error.statusCode : 503;
      return reply.header('cache-control','private, no-store').code(status).send({ code: { 401:'UNAUTHORIZED',403:'FORBIDDEN',422:'INVALID_INPUT',503:'DEPENDENCY_UNAVAILABLE' }[status],message:'Não foi possível consultar ou atualizar o perfil.',requestId:request.id });
    }
  }
  return {
    self: (request: FastifyRequest,reply: FastifyReply) => execute(request,reply,() => service.self(request.cookies?.vdr_session)),
    privacy: (request: FastifyRequest,reply: FastifyReply) => execute(request,reply,async () => {
      const patch = privacyBody(request.body); if (!patch) throw new ProfileError(422);
      return service.privacy(request.cookies?.vdr_session,request.headers['x-csrf-token'],request.headers.origin,patch,request.id);
    })
  };
}
