import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const onDealStageChanged = createTrigger({
  name: "on_deal_stage_changed",
  displayName: "On Deal Stage Changed",
  description: "Triggers when a deal moves to a different pipeline stage",
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await context.store.put("lastChecked", new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete("lastChecked");
  },
  async run(context) {
    const pool = getPool(context.auth as string);
    const lastChecked = await context.store.get<string>("lastChecked");

    const result = await pool.query(
      `SELECT * FROM shared.deal_stage_history WHERE created_at > $1 ORDER BY created_at ASC`,
      [lastChecked || new Date(0).toISOString()]
    );

    await context.store.put("lastChecked", new Date().toISOString());

    return result.rows;
  },
  sampleData: {
    dealId: "uuid-sample",
    fromStage: "sourcing",
    toStage: "qualification",
    reason: "Initial meeting completed",
  },
});
