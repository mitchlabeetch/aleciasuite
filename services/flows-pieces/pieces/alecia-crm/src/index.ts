// services/flows-pieces/pieces/alecia-crm/src/index.ts
// @alecia/piece-crm — Manage deals, companies, and contacts in Alecia BI
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createDeal } from "./lib/actions/create-deal";
import { updateDealStage } from "./lib/actions/update-deal-stage";
import { searchCompanies } from "./lib/actions/search-companies";
import { enrichCompany } from "./lib/actions/enrich-company";
import { onDealCreated } from "./lib/triggers/on-deal-created";
import { onDealStageChanged } from "./lib/triggers/on-deal-stage-changed";

export const aleciaCrm = createPiece({
  displayName: "Alecia CRM",
  description: "Manage deals, companies, and contacts in Alecia BI",
  auth: PieceAuth.SecretText({
    displayName: "Database Connection String",
    required: true,
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.fr/alecia-crm-piece.svg",
  authors: ["alecia"],
  actions: [createDeal, updateDealStage, searchCompanies, enrichCompany],
  triggers: [onDealCreated, onDealStageChanged],
});
