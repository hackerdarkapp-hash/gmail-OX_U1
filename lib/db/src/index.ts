import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const url = process.env["DATABASE_URL"];
    if (!url) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    _pool = new Pool({ connectionString: url });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) { return (getPool() as never)[prop as string]; }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) { return (getDb() as never)[prop as string]; }
});

export * from "./schema";
