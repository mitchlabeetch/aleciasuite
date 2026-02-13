# Logo Migration to Database

This script migrates all transactions to use the new optimized SVG logos.

## Prerequisites

1. Make sure you have run the logo optimization script:
```bash
node scripts/optimize-logos.js
```

2. Ensure your `.env.local` has the Convex URL:
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Running the Migration

```bash
cd apps/website
node scripts/migrate-logos-to-db.js
```

## What It Does

1. Fetches all transactions from Convex
2. For each transaction's client/acquirer logo:
   - Extracts the original filename
   - Checks if an optimized SVG exists in `public/assets/logos-optimized/`
   - Updates the transaction with the new path if found
3. Performs bulk update to Convex database
4. Reports statistics:
   - How many logos were successfully updated
   - How many logos are missing optimized versions
   - Any errors encountered

## Expected Output

```
🎨 Transaction Logo Migration Tool
===================================

📥 Fetching transactions from Convex...
Found 50 transactions

✓ Alecia: ardian_image17.svg
✓ Safe Group: safe_group_logo_safe_group.svg
⚠ Africinvest: No optimized version of africinvest_image48.png
...

📤 Updating 45 transactions...

===================================
Migration Results:
✓ Successfully updated: 45
✗ Failed: 0

Logo Statistics:
  • Client logos updated: 38
  • Acquirer logos updated: 35
  • No changes needed: 5
  • Client logos missing: 7
  • Acquirer logos missing: 10

✨ Migration complete!
```

## Troubleshooting

### "CONVEX_URL not found"
Make sure your `.env.local` file has:
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### "No optimized version found"
This means the logo optimization script hasn't processed this file yet, or the file was skipped. You can:
1. Check if the original logo exists in `public/assets/operations/`
2. Re-run `optimize-logos.js` if needed
3. Manually create the SVG version

### Module not found errors
Install dependencies:
```bash
npm install convex
```

## Next Steps

After migration:
1. Check the studio page to see the new logos in action
2. Review any logos that couldn't be migrated (they'll use original versions as fallback)
3. For missing logos, either:
   - Get higher quality source files
   - Use Vectorizer.AI for professional conversion
   - Outsource to Fiverr for manual recreation

## Rollback

If you need to revert, you can:
1. Update transactions back to original paths
2. Or keep the optimized paths and they'll fallback to originals if SVG is missing
