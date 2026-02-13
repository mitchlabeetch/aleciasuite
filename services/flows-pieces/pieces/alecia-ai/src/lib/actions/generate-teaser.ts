import { createAction, Property } from "@activepieces/pieces-framework";
import { Pool } from "pg";
import { callGroq } from "../groq-client";

export const generateTeaser = createAction({
  name: "generate_teaser",
  displayName: "Generate Teaser",
  description: "Generate a confidential teaser document for a deal (1-page format)",
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
      const lang = context.propsValue.language || "fr";
      const systemPrompt = lang === "fr"
        ? "Génère un teaser confidentiel d'1 page pour ce deal M&A. Inclus: vue d'ensemble de l'entreprise, métriques clés, points d'investissement attractifs. Format professionnel et concis."
        : "Generate a confidential 1-page teaser for this M&A deal. Include: company overview, key metrics, investment highlights. Professional and concise format.";
      const userPrompt = JSON.stringify(deal, null, 2);
      const teaser = await callGroq(process.env.GROQ_API_KEY || "", systemPrompt, userPrompt);
      return { dealId: context.propsValue.dealId, teaser };
    } finally {
      await pool.end();
    }
  },
});
