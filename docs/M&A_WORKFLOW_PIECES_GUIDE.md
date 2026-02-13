# M&A Workflow Pieces — Implementation Guide

**Status**: 3/9 complete (Pipeline, Notifications, Pappers)
**Remaining**: 6 pieces

---

## ✅ Completed Pieces (1-3)

### 1. alecia-pipeline ✅
- **Actions**: create-deal, update-deal-stage
- **Triggers**: on-deal-stage-changed
- **Database**: PostgreSQL (shared.deals, alecia_bi.deal_activities)

### 2. alecia-notifications ✅
- **Actions**: send-email-notification, create-in-app-notification
- **Integrations**: Microsoft Graph, PostgreSQL

### 3. alecia-pappers ✅
- **Actions**: search-company
- **API**: Pappers.fr (French company registry)

---

## ⏳ Remaining Pieces (4-9)

### 4. alecia-calendar (Microsoft Calendar Integration)

**File**: `services/flows-pieces/pieces/alecia-calendar/src/actions/schedule-meeting.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const scheduleMeeting = createAction({
  name: 'schedule-meeting',
  displayName: 'Schedule Meeting',
  description: 'Create meeting via Microsoft Calendar',
  props: {
    accessToken: Property.SecretText({
      displayName: 'Microsoft Access Token',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Meeting Subject',
      required: true,
    }),
    attendees: Property.Array({
      displayName: 'Attendee Emails',
      required: true,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      defaultValue: 60,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Meeting Description',
      required: false,
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => done(null, context.propsValue.accessToken),
    });

    const startDate = new Date(context.propsValue.startTime);
    const endDate = new Date(
      startDate.getTime() + (context.propsValue.duration || 60) * 60000
    );

    const event = {
      subject: context.propsValue.subject,
      body: {
        contentType: 'HTML',
        content: context.propsValue.body || '',
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      location: {
        displayName: context.propsValue.location || 'Teams',
      },
      attendees: context.propsValue.attendees.map((email: string) => ({
        emailAddress: { address: email },
        type: 'required',
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    };

    const result = await client.api('/me/events').post(event);

    return {
      success: true,
      eventId: result.id,
      joinUrl: result.onlineMeeting?.joinUrl,
      startTime: result.start.dateTime,
      endTime: result.end.dateTime,
    };
  },
});
```

---

### 5. alecia-campaigns (Email Campaign Automation)

**File**: `services/flows-pieces/pieces/alecia-campaigns/src/actions/send-buyer-outreach.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const sendBuyerOutreach = createAction({
  name: 'send-buyer-outreach',
  displayName: 'Send Buyer Outreach',
  description: 'Send personalized email campaign to buyers',
  props: {
    accessToken: Property.SecretText({
      displayName: 'Microsoft Access Token',
      required: true,
    }),
    buyers: Property.Array({
      displayName: 'Buyer List',
      description: 'Array of buyer objects with email, name, company',
      required: true,
    }),
    templateSubject: Property.ShortText({
      displayName: 'Email Subject Template',
      description: 'Use {{name}}, {{company}} placeholders',
      required: true,
    }),
    templateBody: Property.LongText({
      displayName: 'Email Body Template (HTML)',
      description: 'Use {{name}}, {{company}}, {{dealTitle}} placeholders',
      required: true,
    }),
    dealTitle: Property.ShortText({
      displayName: 'Deal Title',
      required: true,
    }),
    attachmentUrls: Property.Array({
      displayName: 'Attachment URLs',
      description: 'URLs to teaser/materials',
      required: false,
    }),
  },
  async run(context) {
    const client = Client.init({
      authProvider: (done) => done(null, context.propsValue.accessToken),
    });

    const results = [];

    for (const buyer of context.propsValue.buyers as any[]) {
      const subject = context.propsValue.templateSubject
        .replace('{{name}}', buyer.name)
        .replace('{{company}}', buyer.company);

      const body = context.propsValue.templateBody
        .replace(/{{name}}/g, buyer.name)
        .replace(/{{company}}/g, buyer.company)
        .replace(/{{dealTitle}}/g, context.propsValue.dealTitle);

      const message = {
        subject,
        body: { contentType: 'HTML', content: body },
        toRecipients: [{ emailAddress: { address: buyer.email } }],
      };

      try {
        await client.api('/me/sendMail').post({ message });
        results.push({ email: buyer.email, success: true });
      } catch (error) {
        results.push({ email: buyer.email, success: false, error });
      }

      // Rate limiting: 1 email per second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      success: true,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    };
  },
});
```

---

### 6. alecia-docgen (Document Generation)

**File**: `services/flows-pieces/pieces/alecia-docgen/src/actions/generate-loi.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const generateLOI = createAction({
  name: 'generate-loi',
  displayName: 'Generate LOI',
  description: 'Generate Letter of Intent from template',
  props: {
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      required: true,
    }),
    buyerName: Property.ShortText({
      displayName: 'Buyer Name',
      required: true,
    }),
    sellerName: Property.ShortText({
      displayName: 'Seller Name',
      required: true,
    }),
    targetCompany: Property.ShortText({
      displayName: 'Target Company',
      required: true,
    }),
    proposedValue: Property.Number({
      displayName: 'Proposed Value (EUR)',
      required: true,
    }),
    exclusivityDays: Property.Number({
      displayName: 'Exclusivity Period (days)',
      defaultValue: 60,
    }),
    dueDate: Property.DateTime({
      displayName: 'Response Due Date',
      required: true,
    }),
  },
  async run(context) {
    // Generate markdown LOI
    const markdown = `
# LETTER OF INTENT

**Date:** ${new Date().toLocaleDateString('fr-FR')}
**From:** ${context.propsValue.buyerName}
**To:** ${context.propsValue.sellerName}
**Re:** Proposed Acquisition of ${context.propsValue.targetCompany}

## 1. Proposed Transaction

${context.propsValue.buyerName} ("Buyer") hereby expresses its intent to acquire 100% of the shares of ${context.propsValue.targetCompany} ("Target") from ${context.propsValue.sellerName} ("Seller").

## 2. Proposed Purchase Price

The proposed purchase price for the Target is **EUR ${context.propsValue.proposedValue.toLocaleString('fr-FR')}**.

## 3. Exclusivity Period

Seller agrees to grant Buyer an exclusive negotiation period of ${context.propsValue.exclusivityDays} days from the date of this LOI.

## 4. Due Diligence

Buyer shall conduct comprehensive due diligence on the Target, including but not limited to financial, legal, operational, and commercial aspects.

## 5. Response Deadline

Seller must respond to this LOI by ${new Date(context.propsValue.dueDate).toLocaleDateString('fr-FR')}.

---

**For Buyer:**
${context.propsValue.buyerName}

**For Seller:**
${context.propsValue.sellerName}
`;

    // Convert to PDF via Gotenberg
    const pdfResponse = await axios.post(
      'http://gotenberg:3000/forms/chromium/convert/markdown',
      {
        files: {
          'index.md': markdown,
        },
      },
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'arraybuffer',
      }
    );

    // Upload to Minio (placeholder - implement actual S3 upload)
    const filename = `loi_${context.propsValue.dealId}_${Date.now()}.pdf`;

    return {
      success: true,
      filename,
      markdown,
      pdfSize: pdfResponse.data.length,
      downloadUrl: `/storage/${filename}`,
    };
  },
});
```

---

### 7. alecia-vdr (Virtual Data Room / DocuSeal)

**File**: `services/flows-pieces/pieces/alecia-vdr/src/actions/create-data-room.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const createDataRoom = createAction({
  name: 'create-data-room',
  displayName: 'Create Data Room',
  description: 'Create a virtual data room in DocuSeal',
  props: {
    docusealUrl: Property.ShortText({
      displayName: 'DocuSeal URL',
      defaultValue: 'https://sign.alecia.fr',
    }),
    apiKey: Property.SecretText({
      displayName: 'DocuSeal API Key',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Data Room Name',
      required: true,
    }),
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      required: true,
    }),
    allowedUsers: Property.Array({
      displayName: 'Allowed User Emails',
      required: true,
    }),
  },
  async run(context) {
    // Create folder structure in DocuSeal
    const response = await axios.post(
      `${context.propsValue.docusealUrl}/api/folders`,
      {
        name: context.propsValue.name,
        metadata: {
          deal_id: context.propsValue.dealId,
          created_by: 'alecia-workflows',
        },
      },
      {
        headers: {
          'X-API-Key': context.propsValue.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    // Grant access to users
    for (const email of context.propsValue.allowedUsers as string[]) {
      await axios.post(
        `${context.propsValue.docusealUrl}/api/folder_permissions`,
        {
          folder_id: response.data.id,
          email,
          permission: 'read',
        },
        {
          headers: { 'X-API-Key': context.propsValue.apiKey },
        }
      );
    }

    return {
      success: true,
      folderId: response.data.id,
      name: context.propsValue.name,
      url: `${context.propsValue.docusealUrl}/folders/${response.data.id}`,
      allowedUsers: context.propsValue.allowedUsers,
    };
  },
});
```

---

### 8. alecia-esign (E-Signature / DocuSeal)

**File**: `services/flows-pieces/pieces/alecia-esign/src/actions/send-signature-request.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const sendSignatureRequest = createAction({
  name: 'send-signature-request',
  displayName: 'Send Signature Request',
  description: 'Request signatures via DocuSeal',
  props: {
    docusealUrl: Property.ShortText({
      displayName: 'DocuSeal URL',
      defaultValue: 'https://sign.alecia.fr',
    }),
    apiKey: Property.SecretText({
      displayName: 'DocuSeal API Key',
      required: true,
    }),
    documentUrl: Property.ShortText({
      displayName: 'Document URL',
      description: 'URL to PDF document',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'Array of {email, name, role}',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      required: false,
    }),
  },
  async run(context) {
    const response = await axios.post(
      `${context.propsValue.docusealUrl}/api/submissions`,
      {
        template_url: context.propsValue.documentUrl,
        signers: (context.propsValue.signers as any[]).map((signer, idx) => ({
          email: signer.email,
          name: signer.name,
          role: signer.role || 'Signer',
          order: idx + 1,
        })),
        subject: context.propsValue.subject,
        message: context.propsValue.message || '',
        send_email: true,
      },
      {
        headers: {
          'X-API-Key': context.propsValue.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      submissionId: response.data.id,
      status: response.data.status,
      signers: response.data.signers.map((s: any) => ({
        email: s.email,
        status: s.status,
      })),
    };
  },
});
```

---

### 9. alecia-financial (Financial Model Export)

**File**: `services/flows-pieces/pieces/alecia-financial/src/actions/export-valuation-to-excel.ts`

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { Pool } from 'pg';
import ExcelJS from 'exceljs';

export const exportValuationToExcel = createAction({
  name: 'export-valuation-to-excel',
  displayName: 'Export Valuation to Excel',
  description: 'Generate Excel from valuation data',
  props: {
    valuationId: Property.ShortText({
      displayName: 'Valuation ID',
      required: true,
    }),
  },
  async run(context) {
    const pool = new Pool({
      host: process.env.DATABASE_HOST || 'alecia-postgres',
      port: 5432,
      database: 'alecia',
      user: 'alecia',
      password: process.env.DATABASE_PASSWORD,
    });

    // Fetch valuation data
    const valuation = await pool.query(
      'SELECT * FROM alecia_numbers.valuations WHERE id = $1',
      [context.propsValue.valuationId]
    );

    if (valuation.rows.length === 0) {
      throw new Error('Valuation not found');
    }

    const data = valuation.rows[0];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Valuation');

    // Headers
    sheet.addRow(['Alecia - Valuation Report']);
    sheet.addRow([]);
    sheet.addRow(['Company:', data.company_name]);
    sheet.addRow(['Date:', new Date().toLocaleDateString('fr-FR')]);
    sheet.addRow([]);

    // Valuation methods
    sheet.addRow(['Method', 'Value (EUR)', 'Weight']);
    sheet.addRow(['DCF', data.dcf_value, data.dcf_weight]);
    sheet.addRow(['Multiples', data.multiples_value, data.multiples_weight]);
    sheet.addRow(['Comparables', data.comparables_value, data.comparables_weight]);
    sheet.addRow([]);
    sheet.addRow(['Weighted Average:', data.final_value]);

    // Save to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to Minio (placeholder)
    const filename = `valuation_${data.id}_${Date.now()}.xlsx`;

    await pool.end();

    return {
      success: true,
      filename,
      fileSize: buffer.length,
      downloadUrl: `/storage/${filename}`,
    };
  },
});
```

---

## 📦 Package.json Files

Create `package.json` for each remaining piece:

```json
// alecia-calendar
{
  "name": "@activepieces/piece-alecia-calendar",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "@microsoft/microsoft-graph-client": "^3.0.0"
  }
}

// alecia-campaigns
{
  "name": "@activepieces/piece-alecia-campaigns",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "@microsoft/microsoft-graph-client": "^3.0.0"
  }
}

// alecia-docgen
{
  "name": "@activepieces/piece-alecia-docgen",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "axios": "^1.6.0"
  }
}

// alecia-vdr
{
  "name": "@activepieces/piece-alecia-vdr",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "axios": "^1.6.0"
  }
}

// alecia-esign
{
  "name": "@activepieces/piece-alecia-esign",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "axios": "^1.6.0"
  }
}

// alecia-financial
{
  "name": "@activepieces/piece-alecia-financial",
  "version": "0.1.0",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "exceljs": "^4.3.0",
    "pg": "^8.11.0"
  }
}
```

---

## ⚙️ Installation

```bash
# Install dependencies for all pieces
cd services/flows-pieces
pnpm install

# Build pieces
pnpm build

# Copy to Activepieces
# (Will be done via Docker volume mount in production)
```

---

## ✅ Completion Checklist

- [x] alecia-pipeline (Deal Pipeline)
- [x] alecia-notifications (Notifications)
- [x] alecia-pappers (Company Research)
- [ ] alecia-calendar (Microsoft Calendar) — Code provided above
- [ ] alecia-campaigns (Email Campaigns) — Code provided above
- [ ] alecia-docgen (Document Generation) — Code provided above
- [ ] alecia-vdr (Virtual Data Room) — Code provided above
- [ ] alecia-esign (E-Signature) — Code provided above
- [ ] alecia-financial (Financial Models) — Code provided above

**Next**: Implement remaining 6 pieces using code templates above, then move to Task #15 (workflow templates).
