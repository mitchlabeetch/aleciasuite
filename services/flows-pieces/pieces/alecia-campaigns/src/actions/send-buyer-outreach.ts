// services/flows-pieces/pieces/alecia-campaigns/src/actions/send-buyer-outreach.ts
/* eslint-disable no-undef */
// Send personalized email campaign to buyers

import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const sendBuyerOutreach = createAction({
  name: 'send-buyer-outreach',
  displayName: 'Send Buyer Outreach',
  description: 'Send personalized email campaign to buyers',
  props: {
    buyers: Property.Array({
      displayName: 'Buyer List',
      description: 'Array of buyer objects with email, name, company',
      required: true,
    }),
    templateSubject: Property.ShortText({
      displayName: 'Email Subject Template',
      description: 'Use {{name}}, {{company}} placeholders',
      required: true,
    }),
    templateBody: Property.LongText({
      displayName: 'Email Body Template (HTML)',
      description: 'Use {{name}}, {{company}}, {{dealTitle}} placeholders',
      required: true,
    }),
    dealTitle: Property.ShortText({
      displayName: 'Deal Title',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      required: false,
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => done(null, process.env.MICROSOFT_ACCESS_TOKEN || ""),
    });

    const results = [];

    for (const buyer of context.propsValue.buyers as any[]) {
      const subject = context.propsValue.templateSubject
        .replace('{{name}}', buyer.name || '')
        .replace('{{company}}', buyer.company || '');

      const body = context.propsValue.templateBody
        .replace(/{{name}}/g, buyer.name || '')
        .replace(/{{company}}/g, buyer.company || '')
        .replace(/{{dealTitle}}/g, context.propsValue.dealTitle);

      const message = {
        subject,
        body: { contentType: 'HTML', content: body },
        toRecipients: [{ emailAddress: { address: buyer.email } }],
      };

      try {
        await client.api('/me/sendMail').post({ message });
        results.push({
          email: buyer.email,
          name: buyer.name,
          success: true,
          sentAt: new Date().toISOString(),
        });
      } catch (error: any) {
        results.push({
          email: buyer.email,
          name: buyer.name,
          success: false,
          error: error.message,
        });
      }

      // Rate limiting: 1 email per second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      success: true,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    };
  },
});
