import type { AccountRole, AccountStatus } from '../security/account-access.js';
export interface ProfileSelf {
  id: string; name: string; email: string; role: AccountRole; status: AccountStatus; createdAt: string; emailVerifiedAt: string | null;
  privacy: { perfil_publico: boolean; exibir_nome_nos_relatos: boolean };
  authenticationMethods: ('LOCAL'|'GOOGLE'|'GITHUB'|'OIDC')[];
}
