// services/flows-pieces/pieces/alecia-pipeline/src/actions/update-deal-stage.ts
// Update deal stage with automatic activity logging

import { createAction, Property } from '@activepieces/pieces-framework';
import { getDbPool } from '../common/db';

export const updateDealStage = createAction({
  name: 'update-deal-stage',
  displayName: 'Update Deal Stage',
  description: 'Move a deal to a new pipeline stage',
  props: {
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'UUID of the deal to update',
      required: true,
    }),
    newStage: Property.StaticDropdown({
      displayName: 'New Stage',
      description: 'Target stage for the deal',
      required: true,
      options: {
        options: [
          { label: 'Intake', value: 'intake' },
          { label: 'Qualification', value: 'qualification' },
          { label: 'Pitch', value: 'pitch' },
          { label: 'Mandate', value: 'mandate' },
          { label: 'Marketing', value: 'marketing' },
          { label: 'Due Diligence', value: 'due_diligence' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Closing', value: 'closing' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ],
      },
    }),
    notes: Property.LongText({
      displayName: 'Stage Change Notes',
      description: 'Reason for stage change',
      required: false,
    }),
    updatedBy: Property.ShortText({
      displayName: 'Updated By',
      description: 'User ID making the change',
      required: false,
    }),
  },
  async run(context) {
    const pool = getDbPool();

    // Get current deal
    const currentDeal = await pool.query(
      'SELECT * FROM shared.deals WHERE id = $1',
      [context.propsValue.dealId]
    );

    if (currentDeal.rows.length === 0) {
      throw new Error(`Deal not found: ${context.propsValue.dealId}`);
    }

    const oldStage = currentDeal.rows[0].stage;

    // Update stage
    const result = await pool.query(
      `UPDATE shared.deals
       SET stage = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [context.propsValue.newStage, context.propsValue.dealId]
    );

    const updatedDeal = result.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO alecia_bi.deal_activities (
        deal_id, activity_type, description, created_by, created_at, metadata
      ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [
        updatedDeal.id,
        'stage_changed',
        `Stage changed from "${oldStage}" to "${context.propsValue.newStage}"`,
        context.propsValue.updatedBy || 'system',
        {
          oldStage,
          newStage: context.propsValue.newStage,
          notes: context.propsValue.notes,
        },
      ]
    );

    return {
      success: true,
      deal: {
        id: updatedDeal.id,
        title: updatedDeal.title,
        oldStage,
        newStage: updatedDeal.stage,
        updatedAt: updatedDeal.updated_at,
      },
      stageChanged: oldStage !== context.propsValue.newStage,
    };
  },
});
