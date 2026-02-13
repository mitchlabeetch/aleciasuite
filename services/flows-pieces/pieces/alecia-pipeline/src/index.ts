// services/flows-pieces/pieces/alecia-pipeline/src/index.ts
// Alecia Pipeline - Deal Pipeline Management

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createDeal } from './actions/create-deal';
import { updateDealStage } from './actions/update-deal-stage';
import { onDealStageChanged } from './triggers/on-deal-stage-changed';

export const alециaPipeline = createPiece({
  displayName: 'Alecia Pipeline',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [createDeal, updateDealStage],
  triggers: [onDealStageChanged],
});
