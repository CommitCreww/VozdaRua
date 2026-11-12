import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
const config = () => readConfig({ APP_ENV: 'test' });

describe('fundação HTTP', () => {
  it('responde liveness sem detalhes internos e emite request ID gerado no servidor', async () => {
    const app = buildApp(config()); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/health', headers: { 'request-id': 'forjado' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-request-id']).not.toBe('forjado');
  });

  it('nega CORS por padrão e não expõe rotas privadas', async () => {
    const app = buildApp(config()); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/v1/usuarios', headers: { origin: 'https://example.invalid' } });
    expect(response.statusCode).toBe(404);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND', requestId: response.headers['x-request-id'] });
  });

  it('aceita somente a origem CORS explícita', async () => {
    const app = buildApp(readConfig({ APP_ENV: 'test', CORS_ORIGINS: 'https://voz.example.invalid' })); apps.push(app);
    const allowed = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'https://voz.example.invalid' } });
    const denied = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'https://evil.example.invalid' } });
    expect(allowed.headers['access-control-allow-origin']).toBe('https://voz.example.invalid');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('falha com configuração inválida sem revelar seu valor', () => {
    expect(() => readConfig({ APP_ENV: 'production', PORT: '0' })).toThrow('PORT must be an integer');
    expect(() => readConfig({ APP_ENV: 'test', CORS_ORIGINS: 'https://user:secret@example.invalid' })).toThrow('CORS_ORIGINS must contain');
    expect(() => readConfig({})).toThrow('APP_ENV must be explicit');
  });

  it('retorna erro seguro sem stack, SQL ou segredo', async () => {
    const app = buildApp(config()); apps.push(app);
    app.get('/__test_failure', async () => { throw new Error('senha=segredo SELECT * FROM usuarios'); });
    const response = await app.inject({ method: 'GET', url: '/__test_failure' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: 'INTERNAL_ERROR', message: 'Erro interno.', requestId: response.headers['x-request-id'] });
    expect(response.body).not.toMatch(/segredo|SELECT|stack|\.ts:/);
  });

  it('inicia e encerra processo HTTP local sem infraestrutura externa', async () => {
    const app = buildApp(config()); apps.push(app);
    await app.listen({ host: '127.0.0.1', port: 0 });
    expect(app.server.listening).toBe(true);
    await app.close();
    expect(app.server.listening).toBe(false);
  });
});
