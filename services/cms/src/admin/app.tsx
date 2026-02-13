// services/cms/src/admin/app.tsx
// Alecia CMS theme customization

export default {
  config: {
    locales: ['fr'],
    translations: {
      fr: {
        'app.components.LeftMenu.navbrand.title': 'Alecia CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Panneau d\'administration',
        'Auth.form.welcome.title': 'Bienvenue sur Alecia CMS',
        'Auth.form.welcome.subtitle': 'Connectez-vous à votre espace',
      },
    },
    auth: {
      logo: '../../../infrastructure/branding/logo.svg',
    },
    head: {
      favicon: '../../../infrastructure/branding/logo-icon.svg',
    },
    menu: {
      logo: '../../../infrastructure/branding/logo-icon.svg',
    },
    theme: {
      light: {
        colors: {
          primary100: '#eff6ff',
          primary200: '#dbeafe',
          primary500: '#3b82f6',
          primary600: '#2563eb',
          primary700: '#1d4ed8',
          danger700: '#b91c1c',
        },
      },
    },
  },
  bootstrap() {},
};
