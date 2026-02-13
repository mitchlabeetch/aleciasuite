import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createDocument } from "./lib/actions/create-document";
import { createBoardCard } from "./lib/actions/create-board-card";
import { updateCardStatus } from "./lib/actions/update-card-status";
import { notifyUser } from "./lib/actions/notify-user";

export const aleciaColab = createPiece({
  displayName: "Alecia Colab",
  description: "Create and manage documents, boards, and cards in Alecia Colab",
  auth: PieceAuth.SecretText({
    displayName: "Database Connection String",
    required: true,
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.fr/alecia-colab-piece.svg",
  authors: ["alecia"],
  actions: [createDocument, createBoardCard, updateCardStatus, notifyUser],
  triggers: [],
});
