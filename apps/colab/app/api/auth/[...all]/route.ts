// apps/colab/app/api/auth/[...all]/route.ts
// BetterAuth catch-all route handler for Colab app
// Shares the same auth config as website — cross-subdomain SSO via .alecia.fr cookie

import { auth } from "@alepanel/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
