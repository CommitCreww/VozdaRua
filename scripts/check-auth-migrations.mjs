import { readFileSync } from 'node:fs';

const root = new URL('../db/migrations/', import.meta.url);
const users = readFileSync(new URL('003_users.sql', root), 'utf8');
const tokens = readFileSync(new URL('018_account_tokens.sql', root), 'utf8');
const sessions = readFileSync(new URL('019_sessions.sql', root), 'utf8');
const legal = readFileSync(new URL('020_legal_acceptances.sql', root), 'utf8');
const checks = [
  [users, /senha_hash VARCHAR\(255\)/],
  [users, /email_verificado_em TIMESTAMPTZ/],
  [tokens, /usuario_id UUID NOT NULL REFERENCES usuarios\(id\)/],
  [tokens, /token_hash CHAR\(64\) NOT NULL UNIQUE/],
  [tokens, /EMAIL_VERIFICATION.*PASSWORD_RESET/],
  [tokens, /expira_em TIMESTAMPTZ NOT NULL/],
  [tokens, /consumido_em TIMESTAMPTZ/],
  [sessions, /id_hash CHAR\(64\) PRIMARY KEY/],
  [sessions, /csrf_token_hash CHAR\(64\) NOT NULL/],
  [sessions, /ultima_atividade_em TIMESTAMPTZ NOT NULL/],
  [sessions, /revogado_em TIMESTAMPTZ/],
  [legal, /usuario_id UUID NOT NULL REFERENCES usuarios\(id\)/],
  [legal, /termos_versao TEXT NOT NULL/],
  [legal, /termos_aceitos_em TIMESTAMPTZ NOT NULL/],
  [legal, /privacidade_versao TEXT NOT NULL/],
  [legal, /privacidade_ciente_em TIMESTAMPTZ NOT NULL/]
];
if (checks.some(([source, pattern]) => !pattern.test(source))) throw new Error('Auth migration static contract mismatch');
console.log(`Auth migration static checks: ${checks.length} passed; SQL execution not tested`);
