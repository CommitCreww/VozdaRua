import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/index.js';
import { createOccurrenceReadController } from '../controllers/occurrences.js';
import { registerOccurrenceReadRoutes } from '../routes/occurrences.js';
import { createOccurrenceReadService, type OccurrenceReadDependencies } from '../services/occurrences.js';
import type { OccurrencePaginationPolicy } from '../schemas/occurrences.js';

export function mountExperimentalOccurrenceReads(app: FastifyInstance, config: AppConfig, dependencies: OccurrenceReadDependencies, pagination: OccurrencePaginationPolicy) {
  if (config.appEnv !== 'test') throw new Error('Operational occurrence mounting blocked');
  const service = createOccurrenceReadService(dependencies);
  registerOccurrenceReadRoutes(app,createOccurrenceReadController(service,pagination));
  return service;
}
