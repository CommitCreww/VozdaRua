import type { FastifyInstance } from 'fastify';
import type { createProfileController } from '../controllers/profile.js';
export function registerProfileRoutes(app: FastifyInstance,controller: ReturnType<typeof createProfileController>) {
  app.get('/api/v1/me',controller.self);
  app.patch('/api/v1/me/privacy',controller.privacy);
}
