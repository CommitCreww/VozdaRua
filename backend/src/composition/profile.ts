import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/index.js';
import { createProfileService, type ProfileDependencies } from '../services/profile.js';
import { createProfileController } from '../controllers/profile.js';
import { registerProfileRoutes } from '../routes/profile.js';
export function mountExperimentalProfile(app: FastifyInstance,config: AppConfig,dependencies: ProfileDependencies) {
  if (config.appEnv!=='test') throw new Error('Operational profile mounting blocked');
  const service = createProfileService(dependencies); registerProfileRoutes(app,createProfileController(service)); return service;
}
