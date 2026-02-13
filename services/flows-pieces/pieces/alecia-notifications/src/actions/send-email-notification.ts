// services/flows-pieces/pieces/alecia-notifications/src/actions/send-email-notification.ts
// Send email via Microsoft Graph

import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const sendEmailNotification = createAction({
  name: 'send-email',
  displayName: 'Send Email Notification',
  description: 'Send email via Microsoft Graph',
  props: {
    accessToken: Property.ShortText({
      displayName: 'Microsoft Access Token',
      description: 'OAuth access token for Microsoft Graph',
      required: true,
    }),
    to: Property.Array({
      displayName: 'Recipients',
      description: 'Email addresses',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Email Body (HTML)',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      defaultValue: 'normal',
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, context.propsValue.accessToken);
      },
    });

    const message = {
      subject: context.propsValue.subject,
      body: {
        contentType: 'HTML',
        content: context.propsValue.body,
      },
      toRecipients: context.propsValue.to.map((email: string) => ({
        emailAddress: { address: email },
      })),
      ccRecipients: (context.propsValue.cc || []).map((email: string) => ({
        emailAddress: { address: email },
      })),
      importance: context.propsValue.priority || 'normal',
    };

    await client.api('/me/sendMail').post({ message });

    return {
      success: true,
      messageId: `sent_${Date.now()}`,
      recipients: context.propsValue.to,
      subject: context.propsValue.subject,
    };
  },
});
