import { createAction, Property } from "@activepieces/pieces-framework";
import { docusealApi } from "../docuseal-client";

export const createFromTemplate = createAction({
  name: "create_from_template",
  displayName: "Create From Template",
  description: "Create signing request from template with multiple signers",
  props: {
    templateId: Property.ShortText({
      displayName: "Template ID",
      required: true,
    }),
    documentTitle: Property.ShortText({
      displayName: "Document Title",
      required: true,
    }),
    signers: Property.LongText({
      displayName: "Signers",
      required: true,
      description: 'JSON array of signers (e.g., [{"name":"John","email":"john@example.com"}])',
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth as any;

    const parsedSigners = JSON.parse(context.propsValue.signers);

    const submitters = parsedSigners.map((signer: { name: string; email: string }) => ({
      name: signer.name,
      email: signer.email,
      role: "signer",
    }));

    const result = await docusealApi(baseUrl, apiKey, "POST", "/api/submissions", {
      template_id: context.propsValue.templateId,
      send_email: true,
      submitters,
      name: context.propsValue.documentTitle,
    });

    return result;
  },
});
