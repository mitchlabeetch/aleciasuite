import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { docusealApi } from "../docuseal-client";

export const onDocumentViewed = createTrigger({
  name: "on_document_viewed",
  displayName: "On Document Viewed",
  description: "Triggers when a document is viewed",
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

    const result = await docusealApi(baseUrl, apiKey, "GET", "/api/submissions");

    const viewedDocs = result.filter((submission: { updated_at: string }) => {
      return lastChecked ? submission.updated_at > lastChecked : true;
    });

    await context.store.put("lastChecked", now);

    return viewedDocs;
  },
  sampleData: {
    id: "12345",
    template_id: "67890",
    status: "pending",
    updated_at: "2026-02-09T10:15:00Z",
  },
});
