// services/cms/config/admin.ts
// Alecia CMS admin panel configuration

export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: false,
    promoteEE: false,
  },
  // Branding
  url: env('PUBLIC_ADMIN_URL', '/admin'),
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
  forgotPassword: {
    from: 'noreply@alecia.fr',
    replyTo: 'support@alecia.fr',
  },
  // Custom logo and favicon
  logo: {
    light: '../../../infrastructure/branding/logo.svg',
    dark: '../../../infrastructure/branding/logo.svg',
  },
  favicon: '../../../infrastructure/branding/logo-icon.svg',
  // Localization
  locales: ['fr', 'en'],
  // Theme customization
  theme: {
    colors: {
      primary100: '#eff6ff',
      primary200: '#dbeafe',
      primary500: '#3b82f6',
      primary600: '#2563eb',
      primary700: '#1d4ed8',
      danger700: '#b91c1c',
    },
  },
});
