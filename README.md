# Alepanel Monorepo

A Turborepo monorepo containing the Alecia website and admin panel applications.

## Apps

- `apps/website` - Public-facing Alecia website
- `apps/panel` - Admin panel application with microfrontend support

## Reference Implementation

- `alecia_ref/` - **Reference version** of the Alecia Admin Panel, extracted from `lastcommit_archive/alecia-app`
  - Complete standalone deployment for local reference
  - Contains all visual elements and functions from the previous version
  - Optimized for local development without external dependencies
  - 📚 **Start here:** [alecia_ref/INDEX.md](./alecia_ref/INDEX.md) - Complete documentation index
  - 🚀 **Quick deploy:** [alecia_ref/LOCAL_DEPLOYMENT_GUIDE.md](./alecia_ref/LOCAL_DEPLOYMENT_GUIDE.md)
  - 📖 **Main docs:** [alecia_ref/README.md](./alecia_ref/README.md)
  - 💡 **Usage guide:** [alecia_ref/REFERENCE_USAGE_GUIDE.md](./alecia_ref/REFERENCE_USAGE_GUIDE.md)

## Features

### Microfrontend Architecture

The panel app is configured to support microfrontend architecture with the following features:

#### Multi-Zone Routing

The panel application routes `/colab/*` paths to the Alecia Colab application:

```typescript
// In apps/panel/next.config.ts
async rewrites() {
  return {
    beforeFiles: [
      {
        source: "/colab/:path*",
        destination: "${COLAB_APP_URL}/:path*",
      },
    ],
  };
}
```

#### Security Headers for Iframe Embedding

Security headers are configured to allow iframe embedding from trusted domains:

- **X-Frame-Options**: `SAMEORIGIN`
- **Content-Security-Policy**: Configured with `frame-ancestors` directive for:
  - `alecia.markets` and `*.alecia.markets`
  - `colab.alecia.markets`

## Environment Variables

### Required for Panel App Deployment

Add the following environment variable in Vercel for the panel app:

```bash
COLAB_APP_URL=https://colab.alecia.markets
```

This variable controls where `/colab/*` requests are routed.

## Development

```bash
# Install dependencies
npm install

# Run both apps in development mode
npm run dev

# Run individual apps
npm run dev:website
npm run dev:panel

# Build apps
npm run build:website
npm run build:panel
```

## Deployment

### Vercel Configuration

The repository is configured for Vercel deployment. Make sure to:

1. Set the `COLAB_APP_URL` environment variable in Vercel project settings
2. Deploy the panel app with the appropriate build configuration
3. Deploy the website app separately if needed

See `.env.example` for required environment variables.

## Shared Infrastructure

Both applications share:
- **PostgreSQL + Drizzle ORM**: Unified database with schemas for shared data, business intelligence, collaboration, and more
- **BetterAuth**: Cross-subdomain SSO authentication via `.alecia.markets` cookies
- **Cross-Origin Support**: Properly configured CORS headers for iframe embedding

## Architecture Notes

- The colab tool can be embedded within the admin panel via iframe
- The website's connexion page (`/connexion`) embeds the colab app
- Multi-zone rewrites enable seamless routing between microfrontends
