import { Pool } from 'pg';
import type { DatabaseConfig } from '../config/database.js';

export interface SqlExecutor {
  query<Row>(sql: string, values?: readonly unknown[]): Promise<readonly Row[]>;
}

export interface DatabasePort extends SqlExecutor {
  check(): Promise<void>;
  close(): Promise<void>;
}

export interface PoolLike {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
}

export function createDatabase(config: DatabaseConfig, suppliedPool?: PoolLike): DatabasePort {
  const pool: PoolLike = suppliedPool ?? new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 5,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 10_000
  });
  let closing: Promise<void> | undefined;
  return {
    async query<Row>(sql: string, values?: readonly unknown[]) {
      const result = await pool.query(sql, values ? [...values] : undefined);
      return result.rows as Row[];
    },
    async check() {
      await pool.query('SELECT 1');
    },
    close() {
      closing ??= pool.end();
      return closing;
    }
  };
}
