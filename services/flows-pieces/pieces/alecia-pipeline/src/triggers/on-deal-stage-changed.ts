// services/flows-pieces/pieces/alecia-pipeline/src/triggers/on-deal-stage-changed.ts
// Webhook trigger when a deal changes stage

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const onDealStageChanged = createTrigger({
  name: 'on-deal-stage-changed',
  displayName: 'On Deal Stage Changed',
  description: 'Triggers when a deal moves to a new pipeline stage',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    dealId: 'deal_123',
    title: 'Acquisition of Company X',
    oldStage: 'qualification',
    newStage: 'due_diligence',
    dealType: 'buy_side',
    targetValue: 5000000,
    probability: 75,
    assignedTo: ['user_123'],
    timestamp: new Date().toISOString(),
  },
  async onEnable() {
    // Webhook is registered automatically by Activepieces
    return;
  },
  async onDisable() {
    // Cleanup if needed
    return;
  },
  async run(context) {
    return [context.payload.body];
  },
});
