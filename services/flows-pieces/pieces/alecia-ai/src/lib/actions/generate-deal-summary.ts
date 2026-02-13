import { createAction, Property } from "@activepieces/pieces-framework";
import { Pool } from "pg";
import { callGroq } from "../groq-client";

export const generateDealSummary = createAction({
  name: "generate_deal_summary",
  displayName: "Generate Deal Summary",
  description: "Generate an AI summary of a deal using Groq LLaMA 3.3 70B",
  props: {
    dealId: Property.ShortText({ displayName: "Deal ID", required: true }),
    dbConnectionString: Property.ShortText({ displayName: "Database URL", required: true }),
    language: Property.StaticDropdown({
      displayName: "Language",
      required: false,
      options: {
        options: [
          { label: "Français", value: "fr" },
          { label: "English", value: "en" },
        ],
      },
    }),
  },
  async run(context) {
    const pool = new Pool({ connectionString: context.propsValue.dbConnectionString });
    try {
      const result = await pool.query("SELECT * FROM shared.deals WHERE id = $1", [context.propsValue.dealId]);
      if (result.rows.length === 0) {
        throw new Error(`Deal ${context.propsValue.dealId} not found`);
      }
      const deal = result.rows[0];
      const systemPrompt = "Tu es un analyste M&A senior. Génère un résumé exécutif structuré du deal suivant. Inclus: contexte, parties prenantes, valorisation, étapes clés, risques identifiés.";
      const userPrompt = JSON.stringify(deal, null, 2);
      const summary = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
      return { dealId: context.propsValue.dealId, summary };
    } finally {
      await pool.end();
    }
  },
});
