import { createAction, Property } from "@activepieces/pieces-framework";
import { docusealApi } from "../docuseal-client";

export const createSigningRequest = createAction({
  name: "create_signing_request",
  displayName: "Create Signing Request",
  description: "Create a new signing request",
  props: {
    templateId: Property.ShortText({
      displayName: "Template ID",
      required: true,
    }),
    signerName: Property.ShortText({
      displayName: "Signer Name",
      required: true,
    }),
    signerEmail: Property.ShortText({
      displayName: "Signer Email",
      required: true,
    }),
    message: Property.LongText({
      displayName: "Message",
      required: false,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth as any;

    const result = await docusealApi(baseUrl, apiKey, "POST", "/api/submissions", {
      template_id: context.propsValue.templateId,
      send_email: true,
      submitters: [
        {
          name: context.propsValue.signerName,
          email: context.propsValue.signerEmail,
          role: "signer",
        },
      ],
      message: context.propsValue.message,
    });

    return result;
  },
});
