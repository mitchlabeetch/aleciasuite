// services/flows-pieces/pieces/alecia-pipedrive/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { syncDealToPipedrive } from './actions/sync-deal-to-pipedrive';

export const aleciaPipedrive = createPiece({
  displayName: 'Alecia Pipedrive',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [syncDealToPipedrive],
  triggers: [],
});
