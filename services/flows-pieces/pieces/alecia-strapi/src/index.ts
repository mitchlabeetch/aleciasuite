// services/flows-pieces/pieces/alecia-strapi/src/index.ts

import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createBlogPost } from './actions/create-blog-post';

export const aleciaStrapi = createPiece({
  displayName: 'Alecia Strapi',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [createBlogPost],
  triggers: [],
});
