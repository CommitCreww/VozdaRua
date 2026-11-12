export type AppConfig = {
  appEnv: 'development' | 'test' | 'staging' | 'production';
  host: string;
  port: number;
  corsOrigins: string[];
};

export function readConfig(env: NodeJS.ProcessEnv): AppConfig {
  const appEnv = env.APP_ENV;
  if (!['development', 'test', 'staging', 'production'].includes(appEnv ?? '')) {
    throw new Error('APP_ENV must be explicit and valid');
  }
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const host = env.HOST ?? '127.0.0.1';
  if (!host || /\s/.test(host)) throw new Error('HOST is invalid');
  const corsOrigins = (env.CORS_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  for (const origin of corsOrigins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error('CORS_ORIGINS must contain exact HTTP origins'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) {
      throw new Error('CORS_ORIGINS must contain exact HTTP origins');
    }
  }
  return { appEnv: appEnv as AppConfig['appEnv'], host, port, corsOrigins };
}
