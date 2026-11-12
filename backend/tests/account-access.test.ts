import { describe, expect, it } from 'vitest';
import { canIssueLocalSession, hasAccountCapability, type CurrentAccount, type CurrentAccountReader } from '../src/security/account-access.js';

const citizen: CurrentAccount = { id: 'synthetic', role: 'CIDADAO', status: 'ATIVO' };

describe('precondicoes de conta e autorizacao por papel/status', () => {
  it('nega sessao local antes da verificacao e aceita data valida', () => {
    expect(canIssueLocalSession(null)).toBe(false);
    expect(canIssueLocalSession(new Date(Number.NaN))).toBe(false);
    expect(canIssueLocalSession(new Date('2026-01-01T00:00:00Z'))).toBe(true);
  });

  it('nega por padrao conta ausente ou estado desconhecido', () => {
    expect(hasAccountCapability(null, 'READ_VISIBLE')).toBe(false);
    expect(hasAccountCapability({ ...citizen, status: 'SUSPENSO' as CurrentAccount['status'] }, 'READ_VISIBLE')).toBe(false);
    expect(hasAccountCapability({ ...citizen, role: 'OUTRO' as CurrentAccount['role'] }, 'CONTRIBUTE')).toBe(false);
  });

  it('permite leitura visivel ao banido mas nega toda escrita inclusive administrativa', () => {
    for (const role of ['CIDADAO', 'MODERADOR', 'ADMIN'] as const) {
      const banned = { ...citizen, role, status: 'BANIDO' as const };
      expect(hasAccountCapability(banned, 'READ_VISIBLE')).toBe(true);
      for (const capability of ['CONTRIBUTE', 'MODERATE', 'ADMINISTER'] as const) {
        expect(hasAccountCapability(banned, capability)).toBe(false);
      }
    }
  });

  it('restringe moderacao e administracao ao papel atual', () => {
    expect(hasAccountCapability(citizen, 'CONTRIBUTE')).toBe(true);
    expect(hasAccountCapability(citizen, 'MODERATE')).toBe(false);
    expect(hasAccountCapability({ ...citizen, role: 'MODERADOR' }, 'MODERATE')).toBe(true);
    expect(hasAccountCapability({ ...citizen, role: 'MODERADOR' }, 'ADMINISTER')).toBe(false);
    expect(hasAccountCapability({ ...citizen, role: 'ADMIN' }, 'ADMINISTER')).toBe(true);
  });

  it('usa estado atual fornecido por repository simulado, sem banco', async () => {
    let current: CurrentAccount = { ...citizen, role: 'ADMIN' };
    const reader: CurrentAccountReader = { async findCurrentById() { return current; } };
    expect(hasAccountCapability(await reader.findCurrentById('synthetic'), 'ADMINISTER')).toBe(true);
    current = { ...citizen, role: 'CIDADAO' };
    expect(hasAccountCapability(await reader.findCurrentById('synthetic'), 'ADMINISTER')).toBe(false);
    current = { ...citizen, role: 'ADMIN', status: 'BANIDO' };
    expect(hasAccountCapability(await reader.findCurrentById('synthetic'), 'ADMINISTER')).toBe(false);
  });
});
