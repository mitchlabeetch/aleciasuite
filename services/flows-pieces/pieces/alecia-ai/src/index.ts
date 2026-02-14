import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { generateDealSummary } from "./lib/actions/generate-deal-summary";
import { scoreDealRisk } from "./lib/actions/score-deal-risk";
import { generateTeaser } from "./lib/actions/generate-teaser";
import { suggestValuation } from "./lib/actions/suggest-valuation";
import { summarizeDocument } from "./lib/actions/summarize-document";
import { translateDocument } from "./lib/actions/translate-document";
import { generateEmbedding } from "./lib/actions/generate-embedding";

export const aleciaAi = createPiece({
  displayName: "Alecia AI",
  description: "AI-powered M&A deal analysis, risk scoring, and document intelligence",
  auth: PieceAuth.SecretText({
    displayName: "Groq API Key",
    required: true,
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.markets/alecia-ai-piece.svg",
  authors: ["alecia"],
  actions: [
    generateDealSummary,
    scoreDealRisk,
    generateTeaser,
    suggestValuation,
    summarizeDocument,
    translateDocument,
    generateEmbedding,
  ],
  triggers: [],
});
