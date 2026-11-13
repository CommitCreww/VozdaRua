import { describe, expect, it, vi } from 'vitest';
import { createDatabase, type PoolClientLike, type SqlExecutor } from '../src/repositories/database.js';

const config = { host: '127.0.0.1', port: 5432, database: 'synthetic', user: 'application', password: 'synthetic' };
function setup(fail: string[] = []) {
  const client: PoolClientLike = { query: vi.fn(async (sql) => {
    if (fail.includes(sql)) throw new Error(sql);
    return { rows: [{ id: 1 }] };
  }), release: vi.fn() };
  const pool = { query: vi.fn(async () => ({ rows: [] })), end: vi.fn(async () => {}), connect: vi.fn(async () => client) };
  return { database: createDatabase(config, pool), pool, client };
}

describe('transacoes com cliente pg simulado', () => {
  it('usa uma conexao, parametros, commit e libera; executor nao escapa do escopo', async () => {
    const x = setup(); let captured: SqlExecutor | undefined;
    expect(await x.database.transaction(async (sql) => { captured = sql; return sql.query('SELECT $1', ['value']); })).toEqual([{ id: 1 }]);
    expect(vi.mocked(x.client.query).mock.calls).toEqual([['BEGIN'], ['SELECT $1', ['value']], ['COMMIT']]);
    expect(x.pool.query).not.toHaveBeenCalled(); expect(x.client.release).toHaveBeenCalledExactlyOnceWith(false);
    await expect(captured!.query('SELECT 1')).rejects.toThrow('Transaction already finished');
  });
  it('rollback em erro de dominio/SQL e preserva erro original', async () => {
    const x = setup(); const failure = new Error('domain failure');
    await expect(x.database.transaction(async (sql) => { await sql.query('INSERT synthetic'); throw failure; })).rejects.toBe(failure);
    expect(vi.mocked(x.client.query).mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'INSERT synthetic', 'ROLLBACK']);
    expect(x.client.release).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('descarta conexao se rollback falhar e nao mascara erro original', async () => {
    const x = setup(['ROLLBACK']); const failure = new Error('original');
    await expect(x.database.transaction(async () => { throw failure; })).rejects.toBe(failure);
    expect(x.client.release).toHaveBeenCalledExactlyOnceWith(true);
  });
  it('descarta conexao quando BEGIN falha; tenta rollback quando COMMIT falha', async () => {
    const begin = setup(['BEGIN']); const work = vi.fn();
    await expect(begin.database.transaction(work)).rejects.toThrow('BEGIN'); expect(work).not.toHaveBeenCalled();
    expect(begin.client.release).toHaveBeenCalledExactlyOnceWith(true);
    const commit = setup(['COMMIT']);
    await expect(commit.database.transaction(async () => undefined)).rejects.toThrow('COMMIT');
    expect(vi.mocked(commit.client.query).mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'COMMIT', 'ROLLBACK']);
    expect(commit.client.release).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('nao tenta release nem executa work se connect falhar', async () => {
    const x = setup(); x.pool.connect.mockRejectedValueOnce(new Error('unavailable')); const work = vi.fn();
    await expect(x.database.transaction(work)).rejects.toThrow('unavailable');
    expect(work).not.toHaveBeenCalled(); expect(x.client.release).not.toHaveBeenCalled();
  });
});
