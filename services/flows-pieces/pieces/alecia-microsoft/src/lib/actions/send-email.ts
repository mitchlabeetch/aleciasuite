import { createAction, Property } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const sendEmail = createAction({
  name: "send_email",
  displayName: "Send Email",
  description: "Send an email via Outlook",
  props: {
    to: Property.ShortText({
      displayName: "To",
      required: true,
      description: "Recipient email address",
    }),
    subject: Property.ShortText({
      displayName: "Subject",
      required: true,
    }),
    body: Property.LongText({
      displayName: "Body",
      required: true,
      description: "HTML content",
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const message = {
      message: {
        subject: context.propsValue.subject,
        body: {
          contentType: "HTML",
          content: context.propsValue.body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: context.propsValue.to,
            },
          },
        ],
      },
    };

    await client.api("/me/sendMail").post(message);

    return { success: true };
  },
});
