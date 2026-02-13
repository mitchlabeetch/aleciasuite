import { createAction, Property } from "@activepieces/pieces-framework";
import { docusealApi } from "../docuseal-client";

export const getSigningStatus = createAction({
  name: "get_signing_status",
  displayName: "Get Signing Status",
  description: "Check the status of a signing request",
  props: {
    submissionId: Property.ShortText({
      displayName: "Submission ID",
      required: true,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth as any;

    const result = await docusealApi(
      baseUrl,
      apiKey,
      "GET",
      `/api/submissions/${context.propsValue.submissionId}`
    );

    return result;
  },
});
