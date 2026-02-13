import { createAction, Property } from "@activepieces/pieces-framework";

export const searchWeb = createAction({
  name: "search_web",
  displayName: "Search Web",
  description: "Search the web using SearXNG meta search engine",
  props: {
    query: Property.ShortText({ displayName: "Search Query", required: true }),
    maxResults: Property.Number({
      displayName: "Max Results",
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const searxngUrl = (context.auth as any).searxngUrl;
    const url = `${searxngUrl}/search?q=${encodeURIComponent(context.propsValue.query)}&format=json&categories=general`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SearXNG error: ${res.status}`);
    const data = await res.json();
    const results = data.results.slice(0, context.propsValue.maxResults || 10);
    return { query: context.propsValue.query, results };
  },
});
