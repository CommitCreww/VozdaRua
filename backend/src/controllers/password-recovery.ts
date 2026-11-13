import type { FastifyReply, FastifyRequest } from 'fastify';
import { normalizedEmail, objectWithKeys } from '../schemas/auth.js';
import { createPasswordRecoveryService, type PasswordRecoveryDependencies } from '../services/password-recovery.js';

const error = (reply: FastifyReply, status: number, requestId: string) => reply.code(status).send({
  code: status === 429 ? 'RATE_LIMITED' : 'INVALID_INPUT', message: 'Não foi possível concluir a solicitação.', requestId
});

export function createPasswordRecoveryController(deps: PasswordRecoveryDependencies) {
  const service = createPasswordRecoveryService(deps);
  return {
    async forgot(request: FastifyRequest, reply: FastifyReply) {
      const body = objectWithKeys(request.body, ['email']);
      const email = normalizedEmail(body?.email);
      if (!email) return error(reply, 422, request.id);
      const result = await service.forgot(email, request.ip);
      if (result.status === 'limited') return error(reply, 429, request.id);
      return reply.code(202).send({ status: 'accepted' });
    },
    async reset(request: FastifyRequest, reply: FastifyReply) {
      const body = objectWithKeys(request.body, ['token', 'password', 'passwordConfirmation']);
      if (typeof body?.token !== 'string' || typeof body.password !== 'string' || typeof body.passwordConfirmation !== 'string') {
        return error(reply, 422, request.id);
      }
      const result = await service.reset({ token: body.token, password: body.password, passwordConfirmation: body.passwordConfirmation }, request.ip);
      if (result.status === 'limited') return error(reply, 429, request.id);
      if (result.status !== 'ok') return error(reply, 422, request.id);
      return reply.send({ status: 'reset' });
    }
  };
}
