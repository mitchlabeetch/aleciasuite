// services/flows-pieces/pieces/alecia-esign/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendSignatureRequest } from './actions/send-signature-request';

export const aleciaEsign = createPiece({
  displayName: 'Alecia E-Sign',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [sendSignatureRequest],
  triggers: [],
});
