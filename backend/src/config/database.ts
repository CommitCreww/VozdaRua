export type DatabaseConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

export function readDatabaseConfig(env: NodeJS.ProcessEnv): DatabaseConfig {
  const host = env.DB_HOST?.trim();
  const database = env.POSTGRES_DB?.trim();
  const user = env.APP_DB_USER?.trim();
  const password = env.APP_DB_PASSWORD;
  const port = Number(env.POSTGRES_PORT ?? '5432');
  if (!host || /\s/.test(host)) throw new Error('DB_HOST must be set');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('POSTGRES_PORT is invalid');
  if (!database) throw new Error('POSTGRES_DB must be set');
  if (!user || user === env.POSTGRES_USER || user === env.MIGRATION_DB_USER) {
    throw new Error('APP_DB_USER must be a separate identity');
  }
  if (!password || password === env.POSTGRES_PASSWORD || password === env.MIGRATION_DB_PASSWORD) {
    throw new Error('APP_DB_PASSWORD must be set and distinct');
  }
  return { host, port, database, user, password };
}
