import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { searchWeb } from "./lib/actions/search-web";
import { searchPappers } from "./lib/actions/search-pappers";
import { enrichCompany } from "./lib/actions/enrich-company";
import { getLatestFeeds } from "./lib/actions/get-latest-feeds";
import { semanticSearch } from "./lib/actions/semantic-search";

export const aleciaResearch = createPiece({
  displayName: "Alecia Research",
  description: "Web search, Pappers enrichment, RSS feeds, and semantic search",
  auth: PieceAuth.CustomAuth({
    required: true,
    props: {
      pappersApiKey: PieceAuth.SecretText({ displayName: "Pappers API Key", required: true }),
      searxngUrl: Property.ShortText({ displayName: "SearXNG URL", required: false, defaultValue: "https://search.alecia.fr" }),
      minifluxUrl: Property.ShortText({ displayName: "Miniflux URL", required: false, defaultValue: "https://feeds.alecia.fr" }),
      minifluxApiKey: PieceAuth.SecretText({ displayName: "Miniflux API Key", required: false }),
    },
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.fr/alecia-research-piece.svg",
  authors: ["alecia"],
  actions: [
    searchWeb,
    searchPappers,
    enrichCompany,
    getLatestFeeds,
    semanticSearch,
  ],
  triggers: [],
});
