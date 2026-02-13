// packages/db/src/index.ts
// Alecia Suite — Shared database client
// Provides Drizzle ORM access to PostgreSQL with all schemas

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as shared from "./schema/shared";
import * as bi from "./schema/bi";
import * as numbers from "./schema/numbers";
import * as colab from "./schema/colab";
import * as sign from "./schema/sign";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema: { ...shared, ...bi, ...numbers, ...colab, ...sign },
});

export { shared, bi, numbers, colab, sign };
export type DB = typeof db;

// Re-export drizzle-orm operators for server actions
// This ensures a single copy of drizzle-orm types across the monorepo
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  asc,
  desc,
  sql,
  count,
  sum,
  max,
  min,
  avg,
  inArray,
  isNull,
  isNotNull,
  ilike,
} from "drizzle-orm";
