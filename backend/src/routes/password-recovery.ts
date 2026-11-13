import type { FastifyInstance } from 'fastify';
import { createPasswordRecoveryController } from '../controllers/password-recovery.js';
import type { PasswordRecoveryDependencies } from '../services/password-recovery.js';

// Composition is explicit. app.ts/server.ts must not mount this before the integration gates.
export function registerPasswordRecoveryRoutes(app: FastifyInstance, deps: PasswordRecoveryDependencies) {
  const controller = createPasswordRecoveryController(deps);
  app.post('/api/v1/auth/password/forgot', controller.forgot);
  app.post('/api/v1/auth/password/reset', controller.reset);
}
