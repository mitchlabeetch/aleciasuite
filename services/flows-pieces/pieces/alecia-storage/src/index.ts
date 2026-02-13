// services/flows-pieces/pieces/alecia-storage/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { uploadFile } from './actions/upload-file';

export const aleciaStorage = createPiece({
  displayName: 'Alecia Storage',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [uploadFile],
  triggers: [],
});
