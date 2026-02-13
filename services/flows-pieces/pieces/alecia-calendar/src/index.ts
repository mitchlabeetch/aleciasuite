// services/flows-pieces/pieces/alecia-calendar/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { scheduleMeeting } from './actions/schedule-meeting';

export const aleciaCalendar = createPiece({
  displayName: 'Alecia Calendar',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [scheduleMeeting],
  triggers: [],
});
