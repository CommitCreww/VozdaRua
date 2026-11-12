export type AccountRole = 'CIDADAO' | 'MODERADOR' | 'ADMIN';
export type AccountStatus = 'ATIVO' | 'BANIDO';

export interface CurrentAccount {
  id: string;
  role: AccountRole;
  status: AccountStatus;
}

export interface CurrentAccountReader {
  findCurrentById(id: string): Promise<CurrentAccount | null>;
}

export type AccountCapability = 'READ_VISIBLE' | 'CONTRIBUTE' | 'MODERATE' | 'ADMINISTER';

// Only an account confirmed by the local email-verification flow can receive an app session.
export function canIssueLocalSession(emailVerifiedAt: Date | null): boolean {
  return emailVerifiedAt instanceof Date && Number.isFinite(emailVerifiedAt.getTime());
}

// The caller must validate the session, then load the current account state for each sensitive action.
// Resource visibility, ownership, geography, CSRF and audit remain separate mandatory checks.
export function hasAccountCapability(account: CurrentAccount | null, capability: AccountCapability): boolean {
  if (!account) return false;
  if (account.status !== 'ATIVO' && account.status !== 'BANIDO') return false;
  if (account.role !== 'CIDADAO' && account.role !== 'MODERADOR' && account.role !== 'ADMIN') return false;
  if (capability === 'READ_VISIBLE') return true;
  if (account.status !== 'ATIVO') return false;
  if (capability === 'CONTRIBUTE') return true;
  if (capability === 'MODERATE') return account.role === 'MODERADOR' || account.role === 'ADMIN';
  if (capability === 'ADMINISTER') return account.role === 'ADMIN';
  return false;
}
