import { Pool } from "pg";

const pools = new Map<string, Pool>();

export function getPool(connectionString: string): Pool {
  if (!pools.has(connectionString)) {
    pools.set(connectionString, new Pool({ connectionString, max: 3 }));
  }
  return pools.get(connectionString)!;
}
