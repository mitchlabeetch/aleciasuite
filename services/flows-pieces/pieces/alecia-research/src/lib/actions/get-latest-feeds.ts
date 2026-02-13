import { createAction, Property } from "@activepieces/pieces-framework";

export const getLatestFeeds = createAction({
  name: "get_latest_feeds",
  displayName: "Get Latest Feeds",
  description: "Fetch latest unread RSS feed entries from Miniflux",
  props: {
    category: Property.ShortText({
      displayName: "Category",
      required: false,
    }),
    limit: Property.Number({
      displayName: "Limit",
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const minifluxUrl = (context.auth as any).minifluxUrl;
    const apiKey = (context.auth as any).minifluxApiKey;
    const limit = context.propsValue.limit || 20;
    const url = `${minifluxUrl}/v1/entries?status=unread&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });
    if (!res.ok) throw new Error(`Miniflux API error: ${res.status}`);
    const data = await res.json();
    return { entries: data.entries, total: data.total };
  },
});
