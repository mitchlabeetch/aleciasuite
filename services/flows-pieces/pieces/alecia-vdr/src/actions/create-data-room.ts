// services/flows-pieces/pieces/alecia-vdr/src/actions/create-data-room.ts
// Create virtual data room in DocuSeal

import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const createDataRoom = createAction({
  name: 'create-data-room',
  displayName: 'Create Data Room',
  description: 'Create a virtual data room in DocuSeal',
  props: {
    docusealUrl: Property.ShortText({
      displayName: 'DocuSeal URL',
      defaultValue: 'https://sign.alecia.fr',
      required: false,
    }),
    apiKey: Property.ShortText({
      displayName: 'DocuSeal API Key',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Data Room Name',
      required: true,
    }),
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    allowedUsers: Property.Array({
      displayName: 'Allowed User Emails',
      required: true,
    }),
  },
  async run(context) {
    // Note: DocuSeal may not have a native "folder" API
    // This is a conceptual implementation - adjust based on actual DocuSeal API

    // Create a submission template for the data room
    const response = await axios.post(
      `${context.propsValue.docusealUrl}/api/templates`,
      {
        name: context.propsValue.name,
        description: context.propsValue.description || `Data room for deal ${context.propsValue.dealId}`,
        folder: true, // Flag as folder/container
        metadata: {
          deal_id: context.propsValue.dealId,
          type: 'data_room',
          created_by: 'alecia-workflows',
        },
      },
      {
        headers: {
          'X-Auth-Token': context.propsValue.apiKey,
          'Content-Type': 'application/json',
        },
      }
    ).catch(error => {
      throw new Error(`Failed to create data room: ${error.response?.data?.message || error.message}`);
    });

    const dataRoomId = response.data.id;

    // Grant access to users (conceptual - depends on DocuSeal permissions API)
    const accessGrants = [];
    for (const email of context.propsValue.allowedUsers as string[]) {
      try {
        await axios.post(
          `${context.propsValue.docusealUrl}/api/template_shares`,
          {
            template_id: dataRoomId,
            email,
            permission: 'view',
          },
          {
            headers: {
              'X-Auth-Token': context.propsValue.apiKey,
            },
          }
        );
        accessGrants.push({ email, success: true });
      } catch (error) {
        accessGrants.push({ email, success: false });
      }
    }

    return {
      success: true,
      dataRoomId,
      name: context.propsValue.name,
      url: `${context.propsValue.docusealUrl}/templates/${dataRoomId}`,
      allowedUsers: context.propsValue.allowedUsers,
      accessGrants,
      metadata: {
        dealId: context.propsValue.dealId,
        createdAt: new Date().toISOString(),
      },
    };
  },
});
