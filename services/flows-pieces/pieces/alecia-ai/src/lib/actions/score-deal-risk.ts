import { createAction, Property } from "@activepieces/pieces-framework";
import { Pool } from "pg";
import { callGroq } from "../groq-client";

export const scoreDealRisk = createAction({
  name: "score_deal_risk",
  displayName: "Score Deal Risk",
  description: "Analyze M&A deal risk factors using AI and return a risk score (0-100)",
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
      const systemPrompt = "Analyze the M&A deal and return a JSON with { score: number (0-100), factors: string[] }. Higher score = higher risk.";
      const userPrompt = JSON.stringify(deal, null, 2);
      const response = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
      const parsed = JSON.parse(response);
      return { dealId: context.propsValue.dealId, riskScore: parsed.score, riskFactors: parsed.factors };
    } finally {
      await pool.end();
    }
  },
});
