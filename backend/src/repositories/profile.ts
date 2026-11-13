import type { TransactionalSqlExecutor } from './database.js';
import type { PrivacyPatch } from '../schemas/profile.js';
import { isSessionValid } from '../security/sessions.js';
import type { AccountRole, AccountStatus } from '../security/account-access.js';
import type { ProfileSelf } from '../dtos/profile.js';

interface ProfileRow { id: string; nome: string; email: string; papel: AccountRole; status: AccountStatus;
  perfil_publico: boolean; exibir_nome_nos_relatos: boolean; criado_em: Date; email_verificado_em: Date | null; local: boolean }
const columns = 'id,nome,email,papel,status,perfil_publico,exibir_nome_nos_relatos,criado_em,email_verificado_em,(senha_hash IS NOT NULL) AS local';
function dto(row: ProfileRow, providers: readonly { provider: 'GOOGLE'|'GITHUB'|'OIDC' }[]): ProfileSelf {
  return { id: row.id,name: row.nome,email: row.email,role: row.papel,status: row.status,createdAt: row.criado_em.toISOString(),
    emailVerifiedAt: row.email_verificado_em?.toISOString() ?? null,
    privacy: { perfil_publico: row.perfil_publico,exibir_nome_nos_relatos: row.exibir_nome_nos_relatos },
    authenticationMethods: [...(row.local ? ['LOCAL' as const] : []),...providers.map((p) => p.provider)] };
}
export function createProfileRepository(database: TransactionalSqlExecutor) {
  return {
    async self(id: string): Promise<ProfileSelf | null> {
      const [row] = await database.query<ProfileRow>(`SELECT ${columns} FROM usuarios WHERE id=$1`,[id]);
      if (!row) return null;
      const providers = await database.query<{ provider: 'GOOGLE'|'GITHUB'|'OIDC' }>('SELECT DISTINCT provedor AS provider FROM identidades_auth WHERE usuario_id=$1 ORDER BY provedor',[id]);
      return dto(row,providers);
    },
    async updatePrivacy(input: { accountId: string; sessionHash: string; csrfHash: string; patch: PrivacyPatch; now(): Date; requestId: string }): Promise<'UPDATED'|'UNAUTHORIZED'|'FORBIDDEN'> {
      return database.transaction(async (sql) => {
        const [account] = await sql.query<{ status: AccountStatus; papel: AccountRole; email_verificado_em: Date | null }>('SELECT status,papel,email_verificado_em FROM usuarios WHERE id=$1 FOR UPDATE',[input.accountId]);
        if (!account?.email_verificado_em) return 'UNAUTHORIZED';
        if (account.status!=='ATIVO') return 'FORBIDDEN';
        const [session] = await sql.query<{ criado_em:Date;ultima_atividade_em:Date;revogado_em:Date|null;csrf_token_hash:string }>(
          'SELECT criado_em,ultima_atividade_em,revogado_em,csrf_token_hash FROM sessoes WHERE id_hash=$1 AND usuario_id=$2 FOR UPDATE',[input.sessionHash,input.accountId]);
        // Read time after both locks: expiry/revocation during lock contention cannot authorize a write.
        if (!session || session.csrf_token_hash!==input.csrfHash || !isSessionValid({idHash:input.sessionHash,accountId:input.accountId,csrfTokenHash:session.csrf_token_hash,
          createdAt:session.criado_em,lastActivityAt:session.ultima_atividade_em,revokedAt:session.revogado_em},input.now())) return 'UNAUTHORIZED';
        await sql.query(`UPDATE usuarios SET perfil_publico=COALESCE($2,perfil_publico),exibir_nome_nos_relatos=COALESCE($3,exibir_nome_nos_relatos) WHERE id=$1`,
          [input.accountId,input.patch.perfil_publico ?? null,input.patch.exibir_nome_nos_relatos ?? null]);
        await sql.query(`INSERT INTO logs_auditoria(usuario_id,papel_ator,acao,entidade,entidade_id,request_id)
          VALUES($1,$2,'PRIVACIDADE_ATUALIZADA','usuarios',$1,$3)`,[input.accountId,account.papel,input.requestId]);
        return 'UPDATED';
      });
    },
    async isPostPublicVisible(id: string) {
      const [row] = await database.query<{ visible: boolean }>(`SELECT EXISTS(SELECT 1 FROM posts p JOIN usuarios u ON u.id=p.usuario_id
        WHERE p.id=$1 AND u.perfil_publico=TRUE AND u.status='ATIVO' AND p.status='PUBLICADO' AND p.removido_em IS NULL) AS visible`,[id]);
      return row?.visible===true;
    }
  };
}
