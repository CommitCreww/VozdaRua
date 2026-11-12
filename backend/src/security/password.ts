import argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { commonPasswordFingerprints } from './common-password-fingerprints.js';

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export interface CompromisedPasswordList {
  has(password: string): boolean;
}

export const localCommonPasswords: CompromisedPasswordList = { has: (password) => commonPasswordFingerprints.has(createHash('sha256').update(password.toLocaleLowerCase('und')).digest('hex')) };

export function isAllowedPassword(password: string, list: CompromisedPasswordList = localCommonPasswords): boolean {
  if (typeof password !== 'string') return false;
  const length = [...password].length;
  return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH && !list.has(password);
}

export async function hashPassword(password: string, list: CompromisedPasswordList = localCommonPasswords): Promise<string> {
  if (!isAllowedPassword(password, list)) throw new Error('Senha inválida.');
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19 * 1024, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try { return await argon2.verify(hash, password); } catch { return false; }
}
