// services/flows-pieces/pieces/alecia-vdr/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createDataRoom } from './actions/create-data-room';

export const aleciaVdr = createPiece({
  displayName: 'Alecia VDR',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [createDataRoom],
  triggers: [],
});
