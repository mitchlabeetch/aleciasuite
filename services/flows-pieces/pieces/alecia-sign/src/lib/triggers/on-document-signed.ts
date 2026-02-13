import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { docusealApi } from "../docuseal-client";

export const onDocumentSigned = createTrigger({
  name: "on_document_signed",
  displayName: "On Document Signed",
  description: "Triggers when a document is signed",
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await context.store.put("lastChecked", new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete("lastChecked");
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth as any;

    const lastChecked = await context.store.get<string>("lastChecked");
    const now = new Date().toISOString();

    const result = await docusealApi(baseUrl, apiKey, "GET", "/api/submissions?status=completed");

    const newCompletions = result.filter((submission: { created_at: string }) => {
      return lastChecked ? submission.created_at > lastChecked : true;
    });

    await context.store.put("lastChecked", now);

    return newCompletions;
  },
  sampleData: {
    id: "12345",
    template_id: "67890",
    status: "completed",
    created_at: "2026-02-09T10:00:00Z",
  },
});
