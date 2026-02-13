// services/flows-pieces/pieces/alecia-financial/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { exportValuationToExcel } from './actions/export-valuation-to-excel';

export const aleciaFinancial = createPiece({
  displayName: 'Alecia Financial',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [exportValuationToExcel],
  triggers: [],
});
