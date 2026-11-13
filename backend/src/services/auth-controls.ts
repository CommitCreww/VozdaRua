import type { TransactionalSqlExecutor } from '../repositories/database.js';
import { createAuthRepository } from '../repositories/auth.js';
import { createPasswordRecoveryRepository } from '../repositories/password-recovery.js';
import { createSessionStore } from '../repositories/sessions.js';
import { createAuthSecurityRepository } from '../repositories/auth-security.js';
import { createAuthMailRepository } from '../repositories/auth-mail.js';
import { createAuthRateRepository } from '../repositories/auth-rate.js';
import { createPersistentAuthRateGate, type AuthRatePolicies } from '../security/auth-rate.js';
import { createDurableAuthDelivery } from './auth-mail.js';

// Explicit composition for the existing auth/recovery services, without mounting routes.
export function createAuthControls(database: TransactionalSqlExecutor, policy: AuthRatePolicies, rateKey: Buffer) {
  const mail = createAuthMailRepository(database);
  const delivery = createDurableAuthDelivery(mail);
  return {
    accounts: createAuthRepository(database, mail.effect),
    repository: createPasswordRecoveryRepository(database, mail.effect),
    sessions: createSessionStore(database, { securityEvents: true }),
    security: createAuthSecurityRepository(database),
    rate: createPersistentAuthRateGate(createAuthRateRepository(database), policy, rateKey),
    verification: delivery, delivery, mail
  };
}
