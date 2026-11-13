import { buildApp } from './app.js';
import { readConfig } from './config/index.js';
import { readDatabaseConfig } from './config/database.js';
import { createDatabase } from './repositories/database.js';
import { createShutdownDeadline } from './workers/shutdown.js';

const config = readConfig(process.env);
const database = createDatabase(readDatabaseConfig(process.env));
const app = buildApp(config, database);

const deadline = createShutdownDeadline(() => {
  app.log.error({ code: 'SHUTDOWN_TIMEOUT' }, 'shutdown deadline exceeded');
  process.exit(1); // Disconnecting rolls back any unfinished SQL transaction.
});
let closing: Promise<void> | undefined;
const stop = () => {
  if (closing) return;
  deadline.start();
  closing = Promise.race([app.close(), deadline.expired]).then(() => {}, () => { process.exitCode = 1; }).finally(() => deadline.clear());
};
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, stop);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ code: 'STARTUP_FAILED' }, 'startup failed');
  await app.close();
  process.exitCode = 1;
}
