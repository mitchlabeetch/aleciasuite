// services/flows-pieces/pieces/alecia-notifications/src/index.ts
// Alecia Notifications - Multi-channel notification system

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendEmailNotification } from './actions/send-email-notification';
import { createInAppNotification } from './actions/create-in-app-notification';

export const aleciaNotifications = createPiece({
  displayName: 'Alecia Notifications',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [sendEmailNotification, createInAppNotification],
  triggers: [],
});
