import { createAction, Property } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const updateDealStage = createAction({
  name: "update_deal_stage",
  displayName: "Update Deal Stage",
  description: "Move a deal to a new pipeline stage",
  props: {
    dealId: Property.ShortText({ displayName: "Deal ID", required: true }),
    newStage: Property.StaticDropdown({
      displayName: "New Stage",
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
          { label: "Closed Won", value: "closed_won" },
          { label: "Closed Lost", value: "closed_lost" },
        ],
      },
    }),
    reason: Property.LongText({ displayName: "Reason", required: false }),
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const { dealId, newStage, reason } = context.propsValue;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const oldDeal = await client.query("SELECT stage FROM shared.deals WHERE id = $1", [dealId]);
      const oldStage = oldDeal.rows[0]?.stage;

      const updatedDeal = await client.query(
        `UPDATE shared.deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [newStage, dealId]
      );

      await client.query(
        `INSERT INTO shared.deal_stage_history (id, deal_id, from_stage, to_stage, reason, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
        [dealId, oldStage, newStage, reason || null]
      );

      await client.query("COMMIT");
      return updatedDeal.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
