// services/flows-pieces/pieces/alecia-pipeline/src/common/db.ts
// PostgreSQL connection for deal pipeline operations

import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DATABASE_HOST || 'alecia-postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'alecia',
      user: process.env.DATABASE_USER || 'alecia',
      password: process.env.DATABASE_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export interface Deal {
  id: string;
  title: string;
  stage: string;
  deal_type: 'buy_side' | 'sell_side';
  target_company_id?: string;
  buyer_company_id?: string;
  seller_company_id?: string;
  target_value?: number;
  currency?: string;
  assigned_to?: string[];
  status: 'active' | 'archived' | 'closed';
  probability?: number;
  expected_close_date?: Date;
  created_at: Date;
  updated_at: Date;
  metadata?: any;
}
