import type { FastifyInstance } from 'fastify';
import type { createOccurrenceReadController } from '../controllers/occurrences.js';

// Caller installs the existing cookie/session integration. No business rule or SQL in routes.
export function registerOccurrenceReadRoutes(app: FastifyInstance, controller: ReturnType<typeof createOccurrenceReadController>) {
  app.get('/api/v1/occurrences/nearby',controller.nearby);
  app.get('/api/v1/occurrences/:id',controller.detail);
  app.get('/api/v1/occurrences/:id/reports',controller.reports);
  app.get('/api/v1/occurrences/:id/history',controller.history);
  app.get('/api/v1/occurrences/:id/official-channel',controller.officialChannel);
}
