// services/flows-pieces/pieces/alecia-pipeline/src/actions/create-deal.ts
// Create a new deal in PostgreSQL

import { createAction, Property } from '@activepieces/pieces-framework';
import { getDbPool } from '../common/db';

export const createDeal = createAction({
  name: 'create-deal',
  displayName: 'Create Deal',
  description: 'Create a new M&A deal in the pipeline',
  props: {
    title: Property.ShortText({
      displayName: 'Deal Title',
      description: 'Name of the deal (e.g., "Acquisition of Company X")',
      required: true,
    }),
    dealType: Property.StaticDropdown({
      displayName: 'Deal Type',
      description: 'Type of M&A transaction',
      required: true,
      options: {
        options: [
          { label: 'Buy-Side (Acquisition)', value: 'buy_side' },
          { label: 'Sell-Side (Divestiture)', value: 'sell_side' },
        ],
      },
    }),
    stage: Property.StaticDropdown({
      displayName: 'Initial Stage',
      description: 'Starting stage of the deal',
      required: true,
      defaultValue: 'intake',
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
        ],
      },
    }),
    targetValue: Property.Number({
      displayName: 'Target Value (EUR)',
      description: 'Expected transaction value in euros',
      required: false,
    }),
    targetCompanyId: Property.ShortText({
      displayName: 'Target Company ID',
      description: 'UUID of the target company (from shared.companies)',
      required: false,
    }),
    assignedTo: Property.Array({
      displayName: 'Assigned Team Members',
      description: 'User IDs to assign to this deal',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Success Probability (%)',
      description: 'Estimated probability of deal success (0-100)',
      required: false,
      defaultValue: 50,
    }),
    expectedCloseDate: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'Anticipated closing date',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Additional Metadata',
      description: 'Custom JSON metadata for the deal',
      required: false,
    }),
  },
  async run(context) {
    const pool = getDbPool();

    const result = await pool.query(
      `INSERT INTO shared.deals (
        title, stage, deal_type, target_company_id,
        target_value, currency, assigned_to, status,
        probability, expected_close_date, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        context.propsValue.title,
        context.propsValue.stage,
        context.propsValue.dealType,
        context.propsValue.targetCompanyId || null,
        context.propsValue.targetValue || null,
        'EUR',
        context.propsValue.assignedTo || [],
        'active',
        context.propsValue.probability || 50,
        context.propsValue.expectedCloseDate || null,
        context.propsValue.metadata || {},
      ]
    );

    const deal = result.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO alecia_bi.deal_activities (
        deal_id, activity_type, description, created_by, created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [
        deal.id,
        'deal_created',
        `Deal created: ${deal.title}`,
        context.propsValue.assignedTo?.[0] || 'system',
      ]
    );

    return {
      success: true,
      deal: {
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        dealType: deal.deal_type,
        targetValue: deal.target_value,
        probability: deal.probability,
        status: deal.status,
        createdAt: deal.created_at,
      },
    };
  },
});
