// services/hocuspocus/src/index.ts
// Alecia Colab — Hocuspocus WebSocket Server
// Provides real-time Yjs sync with PostgreSQL persistence

import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const server = new Hocuspocus({
  port: parseInt(process.env.PORT || "1234"),
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        const result = await pool.query(
          "SELECT state FROM alecia_colab.yjs_state WHERE document_name = $1",
          [documentName]
        );
        return result.rows[0]?.state || null;
      },
      store: async ({ documentName, state }) => {
        await pool.query(
          `INSERT INTO alecia_colab.yjs_state (document_name, state, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (document_name) DO UPDATE SET state = $2, updated_at = NOW()`,
          [documentName, state]
        );
      },
    }),
  ],
  async onAuthenticate({ token }) {
    // Verify BetterAuth session token against shared.session table
    const result = await pool.query(
      `SELECT s.user_id, u.full_name, u.email, u.role
       FROM shared.session s
       JOIN shared.users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) throw new Error("Unauthorized");
    return result.rows[0];
  },
});

server.listen();
console.log(`Hocuspocus running on port ${server.configuration.port}`);
