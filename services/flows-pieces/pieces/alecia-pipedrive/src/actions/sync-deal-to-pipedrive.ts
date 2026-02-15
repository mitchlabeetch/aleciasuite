// services/flows-pieces/pieces/alecia-pipedrive/src/actions/sync-deal-to-pipedrive.ts
// Sync Alecia deal to Pipedrive using OAuth2

import { createAction, Property } from '@activepieces/pieces-framework';
import * as pipedrive from 'pipedrive';

export const syncDealToPipedrive = createAction({
  name: 'sync-deal-to-pipedrive',
  displayName: 'Sync Deal to Pipedrive',
  description: 'Create or update deal in Pipedrive CRM using OAuth2',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Pipedrive OAuth Access Token',
      description: 'OAuth2 access token from environment or Activepieces connection',
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
    // Configure Pipedrive SDK client with OAuth2
    const config = new pipedrive.v1.Configuration({
      accessToken: context.propsValue.accessToken,
    });

    const dealsApi = new pipedrive.v1.DealsApi(config);

    const dealData: any = {
      title: context.propsValue.dealTitle,
      value: context.propsValue.value,
      currency: context.propsValue.currency || 'EUR',
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

    // Use the official SDK to create the deal
    const response = await dealsApi.addDeal(dealData);

    return {
      success: true,
      pipedriveId: response.data.id,
      title: response.data.title,
      value: response.data.value,
      currency: response.data.currency,
      stageId: response.data.stage_id,
      url: `https://app.pipedrive.com/deal/${response.data.id}`,
    };
  },
});
