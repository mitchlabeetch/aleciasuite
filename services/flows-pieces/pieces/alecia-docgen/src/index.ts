// services/flows-pieces/pieces/alecia-docgen/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { generateLOI } from './actions/generate-loi';

export const aleciaDocgen = createPiece({
  displayName: 'Alecia DocGen',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [generateLOI],
  triggers: [],
});
