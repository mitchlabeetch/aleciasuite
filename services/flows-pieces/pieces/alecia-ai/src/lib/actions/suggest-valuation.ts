import { createAction, Property } from "@activepieces/pieces-framework";
import { Pool } from "pg";
import { callGroq } from "../groq-client";

export const suggestValuation = createAction({
  name: "suggest_valuation",
  displayName: "Suggest Valuation",
  description: "Suggest valuation range and method for a deal using AI analysis",
  props: {
    dealId: Property.ShortText({ displayName: "Deal ID", required: true }),
    dbConnectionString: Property.ShortText({ displayName: "Database URL", required: true }),
  },
  async run(context) {
    const pool = new Pool({ connectionString: context.propsValue.dbConnectionString });
    try {
      const result = await pool.query("SELECT * FROM shared.deals WHERE id = $1", [context.propsValue.dealId]);
      if (result.rows.length === 0) {
        throw new Error(`Deal ${context.propsValue.dealId} not found`);
      }
      const deal = result.rows[0];
      const systemPrompt = "Return JSON: { method: string, range: [number, number], rationale: string }";
      const userPrompt = JSON.stringify(deal, null, 2);
      const response = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
      const parsed = JSON.parse(response);
      return { dealId: context.propsValue.dealId, ...parsed };
    } finally {
      await pool.end();
    }
  },
});
