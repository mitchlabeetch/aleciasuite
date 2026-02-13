// services/flows-pieces/pieces/alecia-campaigns/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendBuyerOutreach } from './actions/send-buyer-outreach';

export const aleciaCampaigns = createPiece({
  displayName: 'Alecia Campaigns',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [sendBuyerOutreach],
  triggers: [],
});
