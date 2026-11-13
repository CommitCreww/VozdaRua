import { buildApp } from '../app.js';
import type { AppConfig } from '../config/index.js';
import type { DatabaseConfig } from '../config/database.js';
import { createDatabase, type DatabasePort, type PoolLike, type TransactionalSqlExecutor } from '../repositories/database.js';
import { createAuthControls } from '../services/auth-controls.js';
import { registerAuthRoutes } from '../routes/auth.js';
import { registerPasswordRecoveryRoutes } from '../routes/password-recovery.js';
import { validateAuthRateConfiguration, type AuthRatePolicies } from '../security/auth-rate.js';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from '../security/sessions.js';
import { AUTH_RATE_POLICIES } from '../config/auth-rate.js';

interface AuthCompositionOptions {
  config: AppConfig;
  ratePolicies?: AuthRatePolicies;
  rateKey: Buffer;
  legal: { termsVersion: string; privacyVersion: string };
  origin: string;
  now?: () => Date;
}

function validate(options: AuthCompositionOptions) {
  // Approved quotas are the operational default; fixtures remain explicitly injectable for tests.
  validateAuthRateConfiguration(options.ratePolicies ?? AUTH_RATE_POLICIES, options.rateKey);
  if (!options.legal?.termsVersion || !options.legal.privacyVersion) throw new Error('Auth legal configuration unavailable');
  let origin: URL;
  try { origin = new URL(options.origin); } catch { throw new Error('Auth origin unavailable'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== options.origin || origin.username || origin.password ||
      (options.config.appEnv !== 'test' && origin.protocol !== 'https:')) throw new Error('Auth origin unavailable');
}

export function composeAuthBackend(options: AuthCompositionOptions & { database: DatabasePort & TransactionalSqlExecutor }) {
  validate(options);
  const controls = createAuthControls(options.database, options.ratePolicies ?? AUTH_RATE_POLICIES, options.rateKey);
  const app = buildApp(options.config, options.database);
  const dependencies = { ...controls, legal: options.legal, now: options.now ?? (() => new Date()) };
  let mounted = false;
  return {
    app, controls,
    sessionPolicy: Object.freeze({ store: 'postgresql' as const, idleMs: SESSION_IDLE_MS, absoluteMs: SESSION_ABSOLUTE_MS }),
    // Operational mounting remains blocked by infrastructure/provider/staging gates.
    mountExperimentalHttp() {
      if (options.config.appEnv !== 'test') throw new Error('Operational auth mounting blocked');
      if (mounted) throw new Error('Experimental auth already mounted');
      const auth = registerAuthRoutes(app, dependencies, { production: true, origin: options.origin });
      registerPasswordRecoveryRoutes(app, dependencies);
      mounted = true;
      return auth; // Internal current() lookup; no undocumented authenticated GET route.
    }
  };
}

// The pool is lazy; composition does not check readiness, run migrations or connect externally.
export function composeAuthBackendPool(options: AuthCompositionOptions & { databaseConfig: DatabaseConfig; pool?: PoolLike }) {
  validate(options);
  const database = createDatabase(options.databaseConfig, options.pool);
  return composeAuthBackend({ ...options, database });
}
