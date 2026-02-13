import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { getPool } from "../db";

export const onDealCreated = createTrigger({
  name: "on_deal_created",
  displayName: "On Deal Created",
  description: "Triggers when a new deal is created in the pipeline",
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
      `SELECT * FROM shared.deals WHERE created_at > $1 ORDER BY created_at ASC`,
      [lastChecked || new Date(0).toISOString()]
    );

    await context.store.put("lastChecked", new Date().toISOString());

    return result.rows;
  },
  sampleData: {
    id: "uuid-sample",
    title: "Sample Deal",
    stage: "sourcing",
    amount: 5000000,
  },
});
