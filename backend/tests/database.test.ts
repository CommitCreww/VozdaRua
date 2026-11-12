import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { readDatabaseConfig } from '../src/config/database.js';
import { readConfig } from '../src/config/index.js';
import { createDatabase, type PoolLike } from '../src/repositories/database.js';

const validEnv = {
  APP_ENV: 'test',
  DB_HOST: '127.0.0.1',
  POSTGRES_PORT: '15433',
  POSTGRES_DB: 'voz_da_rua_test',
  POSTGRES_USER: 'bootstrap',
  MIGRATION_DB_USER: 'migrator',
  APP_DB_USER: 'application',
  POSTGRES_PASSWORD: 'bootstrap-secret',
  MIGRATION_DB_PASSWORD: 'migration-secret',
  APP_DB_PASSWORD: 'application-secret'
};
const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

function fakePool(query: PoolLike['query'] = vi.fn(async () => ({ rows: [{ '?column?': 1 }] }))) {
  return { query: vi.fn(query), end: vi.fn(async () => {}) };
}

describe('configuração e ciclo de vida do banco', () => {
  it('exige credencial de aplicação separada e não repete segredos em erros', () => {
    expect(readDatabaseConfig(validEnv)).toMatchObject({ user: 'application', port: 15433 });
    expect(() => readDatabaseConfig({ ...validEnv, APP_DB_USER: 'bootstrap' })).toThrow('separate identity');
    expect(() => readDatabaseConfig({ ...validEnv, APP_DB_PASSWORD: 'bootstrap-secret' })).toThrow('distinct');
    expect(() => readDatabaseConfig({ ...validEnv, POSTGRES_PORT: '0' })).toThrow('POSTGRES_PORT is invalid');
    expect(() => readDatabaseConfig({ ...validEnv, APP_DB_PASSWORD: '' })).toThrow('APP_DB_PASSWORD must be set');
  });

  it('inicia sem consulta automática e fecha o pool uma única vez', async () => {
    const pool = fakePool();
    const database = createDatabase(readDatabaseConfig(validEnv), pool);
    const app = buildApp(readConfig(validEnv), database); apps.push(app);
    await app.ready();
    expect(pool.query).not.toHaveBeenCalled();
    await app.close();
    await database.close();
    expect(pool.end).toHaveBeenCalledTimes(1);
  });

  it('usa parâmetros SQL e retorna apenas linhas no contrato de repository', async () => {
    const pool = fakePool(async () => ({ rows: [{ id: 'abc' }] }));
    const database = createDatabase(readDatabaseConfig(validEnv), pool);
    expect(await database.query<{ id: string }>('SELECT id FROM exemplo WHERE id=$1', ['abc'])).toEqual([{ id: 'abc' }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT id FROM exemplo WHERE id=$1', ['abc']);
    await database.close();
  });
});

describe('/ready', () => {
  it('responde sucesso quando o banco simulado responde', async () => {
    const pool = fakePool();
    const app = buildApp(readConfig(validEnv), createDatabase(readDatabaseConfig(validEnv), pool)); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('retorna 503 sem detalhes internos e mantém /health vivo na falha simulada', async () => {
    const pool = fakePool(async () => { throw new Error('password=secret host=private.example SQL SELECT 1'); });
    const app = buildApp(readConfig(validEnv), createDatabase(readDatabaseConfig(validEnv), pool)); apps.push(app);
    const ready = await app.inject({ method: 'GET', url: '/ready' });
    const health = await app.inject({ method: 'GET', url: '/health' });
    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toEqual({ status: 'unavailable' });
    expect(ready.body).not.toMatch(/secret|private|SQL|password/);
    expect(health.statusCode).toBe(200);
  });

  it('retorna 503 quando o banco não foi configurado', async () => {
    const app = buildApp(readConfig(validEnv)); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/ready' });
    expect(response.statusCode).toBe(503);
  });
});
