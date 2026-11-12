import { buildApp } from './app.js';
import { readConfig } from './config/index.js';
import { readDatabaseConfig } from './config/database.js';
import { createDatabase } from './repositories/database.js';

const config = readConfig(process.env);
const database = createDatabase(readDatabaseConfig(process.env));
const app = buildApp(config, database);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void app.close(); });
}

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ code: 'STARTUP_FAILED' }, 'startup failed');
  await app.close();
  process.exitCode = 1;
}
