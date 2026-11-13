import { Pool, type PoolConfig } from 'pg';
import type { DatabaseConfig } from '../config/database.js';
import { OPERATIONAL_TIMEOUTS } from '../config/operational-timeouts.js';

export interface SqlExecutor {
  query<Row>(sql: string, values?: readonly unknown[]): Promise<readonly Row[]>;
}

export interface DatabasePort extends SqlExecutor {
  check(): Promise<void>;
  close(): Promise<void>;
}

export interface TransactionalSqlExecutor extends SqlExecutor {
  transaction<T>(work: (sql: SqlExecutor) => Promise<T>): Promise<T>;
}

export interface PoolClientLike {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  release(destroy?: boolean): void;
}

export interface PoolLike {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
  connect?(): Promise<PoolClientLike>;
}

export function databasePoolConfig(config: DatabaseConfig): PoolConfig {
  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 5,
    connectionTimeoutMillis: OPERATIONAL_TIMEOUTS.postgresConnectMs,
    statement_timeout: OPERATIONAL_TIMEOUTS.postgresQueryMs,
    query_timeout: OPERATIONAL_TIMEOUTS.postgresQueryMs,
    idleTimeoutMillis: 10_000
  };
}

export function createDatabase(config: DatabaseConfig, suppliedPool?: PoolLike): DatabasePort & TransactionalSqlExecutor {
  const pool: PoolLike = suppliedPool ?? new Pool(databasePoolConfig(config));
  let closing: Promise<void> | undefined;
  return {
    async query<Row>(sql: string, values?: readonly unknown[]) {
      const result = await pool.query(sql, values ? [...values] : undefined);
      return result.rows as Row[];
    },
    async transaction<T>(work: (sql: SqlExecutor) => Promise<T>): Promise<T> {
      if (!pool.connect) throw new Error('Transaction connection unavailable');
      const client = await pool.connect();
      let destroy = false;
      let started = false;
      let active = true;
      const executor: SqlExecutor = {
        async query<Row>(sql: string, values?: readonly unknown[]) {
          if (!active) throw new Error('Transaction already finished');
          const result = await client.query(sql, values ? [...values] : undefined);
          return result.rows as Row[];
        }
      };
      try {
        await client.query('BEGIN');
        started = true;
        const value = await work(executor);
        active = false;
        await client.query('COMMIT');
        return value;
      } catch (error) {
        active = false;
        if (started) {
          try { await client.query('ROLLBACK'); } catch { destroy = true; }
        } else destroy = true;
        throw error;
      } finally {
        active = false;
        client.release(destroy);
      }
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
