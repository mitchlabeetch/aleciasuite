import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const createDeal = createAction({
  name: "create_deal",
  displayName: "Create Deal",
  description: "Create a new M&A deal in the pipeline",
  props: {
    title: Property.ShortText({ displayName: "Deal Title", required: true }),
    stage: Property.StaticDropdown({
      displayName: "Stage",
      required: true,
      options: {
        options: [
          { label: "Sourcing", value: "sourcing" },
          { label: "Qualification", value: "qualification" },
          { label: "Initial Meeting", value: "initial_meeting" },
          { label: "Analysis", value: "analysis" },
          { label: "Valuation", value: "valuation" },
          { label: "Due Diligence", value: "due_diligence" },
          { label: "Negotiation", value: "negotiation" },
          { label: "Closing", value: "closing" },
        ],
      },
    }),
    companyName: Property.ShortText({ displayName: "Company Name", required: false }),
    amount: Property.Number({ displayName: "Deal Amount (EUR)", required: false }),
    description: Property.LongText({ displayName: "Description", required: false }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { title, stage, companyName, amount, description } = context.propsValue;

    const result = await pool.query(
      `INSERT INTO shared.deals (id, title, stage, company_name, amount, description, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [title, stage, companyName || null, amount || null, description || null]
    );

    return result.rows[0];
  },
});
