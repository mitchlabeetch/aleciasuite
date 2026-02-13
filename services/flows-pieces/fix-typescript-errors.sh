#!/bin/bash
# Fix TypeScript compilation errors across all pieces
cd "/Users/utilisateur/Desktop/alepanel/services/flows-pieces"

echo "Fixing alecia-campaigns..."
# Remove SecretText property and use env var
sed -i '' '/accessToken: Property.SecretText/,/}),/d' pieces/alecia-campaigns/src/actions/send-buyer-outreach.ts
# Fix setTimeout (Node.js global)
sed -i '' '1 a\
/* eslint-disable no-undef */
' pieces/alecia-campaigns/src/actions/send-buyer-outreach.ts
# Update client init to use env
sed -i '' 's/context.propsValue.accessToken/process.env.MICROSOFT_ACCESS_TOKEN || ""/' pieces/alecia-campaigns/src/actions/send-buyer-outreach.ts

echo "Fixing alecia-docgen..."
# Add required field to properties with defaultValue
sed -i '' 's/defaultValue: 60,/defaultValue: 60,\n      required: false,/' pieces/alecia-docgen/src/actions/generate-loi.ts
sed -i '' "s/defaultValue: 'http:\/\/gotenberg:3000',/defaultValue: 'http:\/\/gotenberg:3000',\n      required: false,/" pieces/alecia-docgen/src/actions/generate-loi.ts

echo "Fixing alecia-esign..."
sed -i '' "s/defaultValue: 'http:\/\/docuseal:3000',/defaultValue: 'http:\/\/docuseal:3000',\n      required: false,/" pieces/alecia-esign/src/actions/send-signature-request.ts
# Remove SecretText
sed -i '' '/apiToken: Property.SecretText/,/}),/d' pieces/alecia-esign/src/actions/send-signature-request.ts
sed -i '' 's/context.propsValue.apiToken/process.env.DOCUSEAL_API_TOKEN || ""/' pieces/alecia-esign/src/actions/send-signature-request.ts

echo "Fixing alecia-financial..."
sed -i '' 's/defaultValue: true,/defaultValue: true,\n      required: false,/' pieces/alecia-financial/src/actions/export-valuation-to-excel.ts

echo "Fixing alecia-ai files..."
for file in pieces/alecia-ai/src/lib/actions/*.ts; do
  # Fix API key access
  sed -i '' 's/context.auth/process.env.GROQ_API_KEY || ""/' "$file" 2>/dev/null || true
done

# Fix groq-client.ts
sed -i '' 's/(data as any)/(data as { choices?: { message?: { content?: string } }[] })/' pieces/alecia-ai/src/lib/groq-client.ts

echo "Fixing shared/db.ts import issues..."
# Copy shared/db.ts into each piece that needs it
for piece in alecia-colab alecia-crm alecia-pipeline alecia-notifications alecia-pappers alecia-vdr; do
  if [ -d "pieces/$piece/src/lib" ]; then
    cp pieces/shared/db.ts "pieces/$piece/src/lib/db.ts"
    # Update imports in this piece
    find "pieces/$piece/src" -name "*.ts" -exec sed -i '' 's|../../../../shared/db|../lib/db|g' {} \;
  fi
done

echo "TypeScript error fixes applied!"
