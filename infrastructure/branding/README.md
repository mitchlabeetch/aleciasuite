# Alecia Suite — Brand Assets

**Version**: 1.0.0 (Placeholder)
**Status**: Development
**Last Updated**: 2026-02-09

## Overview

This directory contains brand assets for the Alecia Suite — a unified M&A advisory platform. These assets are used across all 16 subdomains to maintain consistent branding.

## Files

### Logos
- **logo.svg** — Full horizontal logo (200x60px) with "A" mark + ALECIA wordmark
- **logo-icon.svg** — Square icon (40x40px) for favicons and app icons

### Design System
- **colors.json** — Brand color palette (primary, secondary, accent, semantic)
- **typography.json** — Type system (fonts, sizes, weights, spacing)

## Brand Guidelines

### Colors

**Primary (Blue)**
- Main brand color: `#1e40af` (blue-800)
- Use for: Buttons, links, highlights, CTA elements

**Secondary (Neutral)**
- Neutral tones: `#1e293b` (slate-800) to `#f1f5f9` (slate-100)
- Use for: Text, backgrounds, borders, containers

**Accent (Red)**
- Accent color: `#ef4444` (red-500)
- Use for: Important actions, alerts, destructive operations

### Typography

**Primary Font**: Inter (system fallback)
- Body text: 400, 500 weights
- Headings: 600, 700 weights

**Monospace Font**: JetBrains Mono
- Code blocks, technical data

### Logo Usage

**Full Logo** (`logo.svg`)
- Min width: 120px
- Clear space: 20px on all sides
- Use on light backgrounds

**Icon** (`logo-icon.svg`)
- Min size: 16x16px
- Use for favicons (16x16, 32x32, 180x180)
- Use in navigation, app switchers

## Implementation

These assets are consumed by:

1. **CMS (Strapi)** → `services/cms/config/admin.ts`
2. **Flows (Activepieces)** → `services/flows/branding/`
3. **Sign (DocuSeal)** → `services/sign/.env` + volume mounts
4. **Website** → `apps/website/public/`
5. **Colab** → `apps/colab/public/`

## Status: Placeholder

⚠️ **These are placeholder assets.**

Replace with actual Alecia brand guidelines when available:
- Official logo files (SVG + PNG)
- Brand color specifications (HEX/RGB)
- Typography choices
- Usage guidelines

## Generating Favicons

From `logo-icon.svg`:

```bash
# Requires ImageMagick
convert logo-icon.svg -resize 16x16 favicon-16x16.png
convert logo-icon.svg -resize 32x32 favicon-32x32.png
convert logo-icon.svg -resize 180x180 favicon-180x180.png
convert logo-icon.svg favicon.ico
```

Or use online tool: https://realfavicongenerator.net/

## License

All brand assets are proprietary to Alecia SAS.
Unauthorized use is prohibited.
