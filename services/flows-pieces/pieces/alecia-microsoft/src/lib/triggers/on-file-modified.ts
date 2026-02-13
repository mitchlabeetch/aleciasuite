import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { Client } from "@microsoft/microsoft-graph-client";

export const onFileModified = createTrigger({
  name: "on_file_modified",
  displayName: "On File Modified",
  description: "Triggers when a file is modified in OneDrive",
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const result = await client.api("/me/drive/root/delta").get();

    if (result["@odata.deltaLink"]) {
      await context.store.put("deltaToken", result["@odata.deltaLink"]);
    }
  },
  async onDisable(context) {
    await context.store.delete("deltaToken");
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, (context.auth as any).access_token);
      },
    });

    const deltaToken = await context.store.get<string>("deltaToken");

    let result;
    if (deltaToken) {
      result = await client.api(deltaToken).get();
    } else {
      result = await client.api("/me/drive/root/delta").get();
    }

    if (result["@odata.deltaLink"]) {
      await context.store.put("deltaToken", result["@odata.deltaLink"]);
    }

    const changedItems = result.value.filter(
      (item: { file?: unknown; deleted?: unknown }) => item.file && !item.deleted
    );

    return changedItems;
  },
  sampleData: {
    id: "01ABCDEF123456",
    name: "sample-file.xlsx",
    lastModifiedDateTime: "2026-02-09T10:30:00Z",
    file: {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  },
});
