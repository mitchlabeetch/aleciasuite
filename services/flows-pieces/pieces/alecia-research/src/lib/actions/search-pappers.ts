import { createAction, Property } from "@activepieces/pieces-framework";

export const searchPappers = createAction({
  name: "search_pappers",
  displayName: "Search Pappers",
  description: "Search French companies using Pappers API",
  props: {
    query: Property.ShortText({ displayName: "Search Query", required: true }),
  },
  async run(context) {
    const apiKey = (context.auth as any).pappersApiKey;
    const url = `https://api.pappers.fr/v2/recherche?api_token=${apiKey}&q=${encodeURIComponent(context.propsValue.query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pappers API error: ${res.status}`);
    const data = await res.json();
    return { query: context.propsValue.query, companies: data.resultats };
  },
});
