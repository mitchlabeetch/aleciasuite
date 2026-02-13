# Logo Optimization Pipeline

Automated solution for converting low-quality company logos to high-quality white-on-transparent SVGs.

## Problem

Your `public/assets/operations` directory contains 127 logo files with quality issues:
- Low resolution (some as small as 62x30px)
- Mixed formats (PNG, WebP)
- Inconsistent quality
- Not standardized for white-on-transparent display

## Solution

This pipeline uses AI-powered vectorization to:
1. **Enhance** low-quality bitmap logos
2. **Vectorize** them using potrace algorithm
3. **Convert** to white-on-transparent SVG
4. **Flag** low-quality logos for manual review

## Installation

```bash
cd apps/website
pnpm add -D sharp potrace @types/node
```

## Usage

### Quick Start

```bash
# From apps/website directory
node scripts/optimize-logos.js
```

### What It Does

1. **Scans** `public/assets/operations/` for logo files
2. **Processes** each logo:
   - Upscales if needed (using Lanczos3 algorithm)
   - Enhances contrast
   - Converts to grayscale
   - Applies threshold for clean black/white
   - Vectorizes using potrace
   - Converts to white-on-transparent SVG
3. **Saves** optimized SVGs to `public/assets/logos-optimized/`
4. **Generates** JSON report in `public/assets/logo-reports/`

### Output

```
🎨 Logo Optimization Pipeline for French Companies
===================================================

Found 127 logo files to process

[1/127] Processing ardian_image17.png (87x48)...
✓ ardian_image17.png - success (medium quality)

[2/127] Processing africinvest_image48.png (62x30)...
⚠ africinvest_image48.png - needs_review (low quality)

...

===================================================
Summary:
✓ Successful: 89 (70%)
⚠ Needs Review: 24 (19%)
✗ Failed: 14 (11%)

📊 Full report saved to: public/assets/logo-reports/optimization-report-1738378945123.json

📋 Files needing manual review (low resolution):
   - africinvest_image48.png (62x30)
   - apicap_image26.png (65x31)
   ...

✨ Optimization complete!
📁 Optimized logos saved to: public/assets/logos-optimized
```

## Next Steps

### Phase 2: Manual Review UI (Admin Panel)

Create an admin interface for reviewing and approving logos:

```tsx
// apps/website/src/app/[locale]/admin/logos/page.tsx
// This will show side-by-side comparison of original vs optimized
// with approve/reject/request manual edit buttons
```

### Phase 3: Convex Integration

Update your Convex schema to store optimized logos:

```typescript
// convex/schema.ts
logos: defineTable({
  companyName: v.string(),
  originalUrl: v.string(),
  optimizedStorageId: v.id("_storage"),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("needs_manual")
  ),
  quality: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
})
```

### Phase 4: Fallback System

For companies without good logos:
1. Try Clearbit API (free tier: 100/month)
2. Try Brandfetch API  
3. Generate placeholder with company initials
4. Cache result in Convex

## Configuration

Edit `scripts/optimize-logos.js`:

```javascript
const CONFIG = {
  inputDir: join(__dirname, '../public/assets/operations'),
  outputDir: join(__dirname, '../public/assets/logos-optimized'),
  threshold: 128, // Adjust for darker/lighter logos (0-255)
  targetSize: 1000, // Output size
};
```

## Quality Guidelines

- **High Quality** (≥300px): Auto-approved
- **Medium Quality** (150-299px): Auto-approved with flag
- **Low Quality** (<150px): Flagged for manual review

## Troubleshooting

### Issue: Logos too dark/light

Adjust the `threshold` value:
- Lower (e.g., 100): Captures more detail (darker output)
- Higher (e.g., 180): Cleaner lines (lighter output)

### Issue: SVG looks pixelated

Original logo resolution is too low. Options:
1. Request higher-quality logo from company
2. Manually redraw in vector software
3. Use AI upscaling service (waifu2x, Real-ESRGAN)

### Issue: Complex logos lose detail

Adjust potrace settings:
```javascript
{
  optTolerance: 0.2, // Lower = more detail (0.0-1.0)
  turdSize: 2, // Minimum speckle size to keep
}
```

## Cost-Effective Improvements

### For problematic logos:

1. **AI Upscaling** (before vectorization):
   - waifu2x: Free, open-source
   - Real-ESRGAN: Free, better quality
   - Gigapixel AI: $99 (one-time)

2. **Professional Vectorization**:
   - Vectorizer.AI: $29/month (500 images)
   - VectorMagic: Pay-per-image (~$7.95 each)

3. **Manual Service**:
   - Fiverr: $5-20 per logo
   - Upwork: $10-50 per logo

## Example Workflow

1. Run automated script: **127 logos → 89 success, 24 review, 14 failed**
2. Review flagged logos in admin panel
3. For 24 low-quality: Use Gigapixel AI to upscale, then re-run script
4. For 14 failed: Request from companies or outsource to Fiverr
5. Upload all approved logos to Convex storage
6. Update operations page to use optimized logos

## Timeline Estimate

- **Day 1**: Run script, generate report (30 mins)
- **Day 2**: Review and approve high/medium quality (2 hours)
- **Day 3**: Upscale and re-process low quality (3 hours)
- **Day 4**: Outsource remaining problematic logos (1 hour setup)
- **Day 5-7**: Receive and integrate manual logos (1 hour)

**Total: 1 week from 127 low-quality to 127 high-quality SVGs**

## License

Internal use only
