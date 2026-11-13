import { objectWithKeys } from './auth.js';
export interface PrivacyPatch { perfil_publico?: boolean; exibir_nome_nos_relatos?: boolean }
export function privacyBody(value: unknown): PrivacyPatch | null {
  const body = objectWithKeys(value,['perfil_publico','exibir_nome_nos_relatos']);
  if (!body || !Object.keys(body).length || Object.values(body).some((v) => typeof v!=='boolean')) return null;
  return body as PrivacyPatch;
}
