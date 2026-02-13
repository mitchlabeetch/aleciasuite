import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const searchCompanies = createAction({
  name: "search_companies",
  displayName: "Search Companies",
  description: "Search for companies by name or SIREN",
  props: {
    query: Property.ShortText({ displayName: "Search Query", required: true }),
    limit: Property.Number({ displayName: "Max Results", required: false, defaultValue: 10 }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { query, limit } = context.propsValue;

    const result = await pool.query(
      `SELECT * FROM shared.companies
       WHERE name ILIKE '%' || $1 || '%' OR siren LIKE $1 || '%'
       LIMIT $2`,
      [query, limit || 10]
    );

    return result.rows;
  },
});
