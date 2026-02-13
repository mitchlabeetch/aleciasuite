// services/flows-pieces/pieces/alecia-pappers/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { searchCompany } from './actions/search-company';

export const aleciaPappers = createPiece({
  displayName: 'Pappers (Alecia)',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Pappers API key from https://www.pappers.fr/api',
  }),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [searchCompany],
  triggers: [],
});
