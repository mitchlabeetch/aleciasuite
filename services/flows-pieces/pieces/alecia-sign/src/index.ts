import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createSigningRequest } from "./lib/actions/create-signing-request";
import { createFromTemplate } from "./lib/actions/create-from-template";
import { getSigningStatus } from "./lib/actions/get-signing-status";
import { uploadToDataRoom } from "./lib/actions/upload-to-data-room";
import { onDocumentSigned } from "./lib/triggers/on-document-signed";
import { onDocumentViewed } from "./lib/triggers/on-document-viewed";
import { onSigningExpired } from "./lib/triggers/on-signing-expired";

export const aleciaSign = createPiece({
  displayName: "Alecia Sign",
  description: "E-signature and data room management via DocuSeal",
  auth: PieceAuth.CustomAuth({
    required: true,
    props: {
      apiKey: PieceAuth.SecretText({
        displayName: "API Key",
        required: true,
      }),
      baseUrl: Property.ShortText({
        displayName: "DocuSeal URL",
        required: true,
        defaultValue: "https://sign.alecia.fr",
      }),
    },
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.fr/alecia-sign-piece.svg",
  authors: ["alecia"],
  actions: [
    createSigningRequest,
    createFromTemplate,
    getSigningStatus,
    uploadToDataRoom,
  ],
  triggers: [
    onDocumentSigned,
    onDocumentViewed,
    onSigningExpired,
  ],
});
