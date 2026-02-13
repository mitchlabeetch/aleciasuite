// services/flows-pieces/pieces/alecia-pipedrive/src/actions/sync-deal-to-pipedrive.ts
// Sync Alecia deal to Pipedrive

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const syncDealToPipedrive = createAction({
  name: 'sync-deal-to-pipedrive',
  displayName: 'Sync Deal to Pipedrive',
  description: 'Create or update deal in Pipedrive CRM',
  props: {
    apiToken: Property.ShortText({
      displayName: 'Pipedrive API Token',
      required: true,
    }),
    companyDomain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'Your Pipedrive company domain (e.g., mycompany)',
      required: true,
    }),
    dealTitle: Property.ShortText({
      displayName: 'Deal Title',
      required: true,
    }),
    value: Property.Number({
      displayName: 'Deal Value',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      defaultValue: 'EUR',
      required: false,
    }),
    stageId: Property.Number({
      displayName: 'Pipeline Stage ID',
      required: false,
    }),
    personId: Property.Number({
      displayName: 'Person ID',
      description: 'Pipedrive person ID',
      required: false,
    }),
    orgId: Property.Number({
      displayName: 'Organization ID',
      description: 'Pipedrive organization ID',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Additional custom fields',
      required: false,
    }),
  },
  async run(context) {
    const baseUrl = `https://${context.propsValue.companyDomain}.pipedrive.com/api/v1`;

    const dealData: any = {
      title: context.propsValue.dealTitle,
      value: context.propsValue.value,
      currency: context.propsValue.currency,
    };

    if (context.propsValue.stageId) {
      dealData.stage_id = context.propsValue.stageId;
    }

    if (context.propsValue.personId) {
      dealData.person_id = context.propsValue.personId;
    }

    if (context.propsValue.orgId) {
      dealData.org_id = context.propsValue.orgId;
    }

    if (context.propsValue.customFields) {
      Object.assign(dealData, context.propsValue.customFields);
    }

    const response = await axios.post(
      `${baseUrl}/deals`,
      dealData,
      {
        params: {
          api_token: context.propsValue.apiToken,
        },
      }
    );

    return {
      success: true,
      pipedriveId: response.data.data.id,
      title: response.data.data.title,
      value: response.data.data.value,
      currency: response.data.data.currency,
      stageId: response.data.data.stage_id,
      url: `https://${context.propsValue.companyDomain}.pipedrive.com/deal/${response.data.data.id}`,
    };
  },
});
