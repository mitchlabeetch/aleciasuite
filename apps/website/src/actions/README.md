# Server Actions - Convex Replacement

This directory contains Next.js Server Actions that replace Convex queries and mutations with PostgreSQL + Drizzle ORM.

## Architecture

```
apps/website/src/actions/
├── index.ts           # Central export point for all actions
├── deals.ts           # Deal CRUD & pipeline management
├── companies.ts       # Company management with Pappers enrichment
├── contacts.ts        # Contact management with CRM sync
├── numbers.ts         # M&A financial tools (valuations, DD, fees)
└── data-rooms.ts      # Virtual data rooms & document management
```

## Migration from Convex

### Before (Convex)
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Client Component
const deals = useQuery(api.deals.getDeals, { stage: "valuation" });
const createDeal = useMutation(api.deals.createDeal);
```

### After (Server Actions)
```typescript
import { getDeals, createDeal } from "@/actions";

// Server Component
const deals = await getDeals({ stage: "valuation" });

// Client Component with useTransition
const [isPending, startTransition] = useTransition();

const handleCreate = () => {
  startTransition(async () => {
    await createDeal({ title: "New Deal", stage: "sourcing" });
  });
};
```

## Authentication

All Server Actions automatically verify authentication via BetterAuth:

```typescript
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return session.user;
}
```

Unauthorized requests will throw an error that can be caught in the client.

## Database Access

Server Actions use Drizzle ORM with PostgreSQL schemas:

```typescript
import { db, shared } from "@alepanel/db";
import { numbers as aleciaNumbers } from "@alepanel/db";
import { sign as aleciaSign } from "@alepanel/db";

// Query with relations
const deal = await db.query.deals.findFirst({
  where: eq(shared.deals.id, dealId),
  with: {
    owner: true,
    company: true,
  },
});

// Insert
const [newDeal] = await db.insert(shared.deals).values({...}).returning();

// Update
await db.update(shared.deals).set({...}).where(eq(shared.deals.id, id));
```

## Revalidation

Server Actions automatically revalidate Next.js cache using `revalidatePath`:

```typescript
revalidatePath("/deals");              // Revalidate list page
revalidatePath(`/deals/${id}`);        // Revalidate detail page
revalidatePath("/pipeline");           // Revalidate dashboard
```

This ensures the UI updates immediately after mutations.

## File Organization

### deals.ts
- `getDeals(filters?)` - List deals with filtering
- `getDealById(id)` - Single deal with relations
- `createDeal(data)` - Create new deal
- `updateDeal(id, data)` - Update deal
- `updateDealStage(id, stage, reason?)` - Stage transition with history
- `archiveDeal(id)` - Soft delete
- `restoreDeal(id)` - Unarchive
- `getPipelineStats()` - Dashboard metrics
- `getDealStageHistory(dealId)` - Stage transition audit trail

### companies.ts
- `getCompanies(filters?)` - List companies
- `getCompanyById(id)` - Single company
- `getCompanyBySiren(siren)` - Lookup by French SIREN
- `createCompany(data)` - Create company
- `updateCompany(id, data)` - Update company
- `deleteCompany(id)` - Delete (with cascade checks)
- `enrichCompany(id)` - Fetch data from Pappers API
- `searchCompanies(query)` - Autocomplete search
- `getCompaniesForUser(userId)` - Related companies

### contacts.ts
- `getContacts(filters?)` - List contacts
- `getContactById(id)` - Single contact
- `getContactByEmail(email)` - Lookup by email (dedup)
- `getContactByExternalId(externalId)` - OAuth sync lookup
- `createContact(data)` - Create contact
- `updateContact(id, data)` - Update contact
- `deleteContact(id)` - Delete contact
- `searchContacts(query)` - Autocomplete search
- `getContactsForCompany(companyId)` - Company contacts
- `bulkCreateContacts(contacts[])` - Batch import

### numbers.ts
- `getValuations(dealId)` - List valuations for deal
- `createValuation(data)` - Create valuation
- `updateValuation(id, data)` - Update valuation
- `getComparables(dealId)` - List comparable companies
- `createComparable(data)` - Add comparable
- `bulkCreateComparables(comparables[])` - Batch import
- `getDDChecklist(dealId)` - List DD checklists
- `createDDChecklist(data)` - Create checklist
- `getDDChecklistItems(checklistId)` - Checklist items
- `createDDChecklistItem(data)` - Add item
- `toggleDDChecklistItem(itemId, completed)` - Mark complete
- `getFeeCalculation(dealId)` - Get fee calculation
- `saveFeeCalculation(data)` - Save/update fees

### data-rooms.ts
- `getDealRoom(dealId)` - Get room for deal
- `createDealRoom(data)` - Create room with default folders
- `updateDealRoom(id, data)` - Update room settings
- `getFolders(roomId)` - List folders
- `createFolder(data)` - Create folder
- `getDocuments(roomId, folderId?)` - List documents
- `uploadDocument(data)` - Record uploaded document
- `deleteDocument(id)` - Delete document
- `logAccess({roomId, documentId?, action})` - Audit trail
- `getAccessLog(roomId, limit)` - View access history
- `getQuestions(roomId)` - Q&A system
- `createQuestion(data)` - Ask question
- `answerQuestion(data)` - Answer question
- `inviteToRoom(data)` - External invitations
- `getRoomInvitations(roomId)` - List invitations

## TypeScript Types

All actions export TypeScript types for inputs and filters:

```typescript
import type { CreateDealInput, DealFilters } from "@/actions";

const filters: DealFilters = {
  stage: "valuation",
  search: "Acme Corp",
  priority: "high",
};

const newDeal: CreateDealInput = {
  title: "Acme Corp Acquisition",
  stage: "sourcing",
  amount: "5000000",
  currency: "EUR",
};
```

## Error Handling

Server Actions throw errors that should be caught in the client:

```typescript
"use client";

import { createDeal } from "@/actions";
import { useTransition } from "react";

export function CreateDealButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createDeal({ title: "New Deal" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  return (
    <>
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? "Creating..." : "Create Deal"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
}
```

## TODOs & Future Enhancements

### Pappers Integration (companies.ts)
- ✅ Basic enrichment implemented
- ⏳ Add webhook for automatic updates
- ⏳ Cache Pappers responses to reduce API calls

### OAuth Sync (contacts.ts)
- ✅ External ID tracking for Microsoft/Pipedrive
- ⏳ Build Activepieces custom pieces for sync
- ⏳ Add conflict resolution UI

### Data Rooms (data-rooms.ts)
- ✅ Basic CRUD implemented
- ⏳ Integrate Minio for actual file storage
- ⏳ Add PDF watermarking via Stirling-PDF
- ⏳ Integrate DocuSeal for e-signatures

### Performance Optimization
- ⏳ Add `IN` clause support for batch queries
- ⏳ Implement proper array contains for tag filtering
- ⏳ Add Redis caching for frequently accessed data
- ⏳ Optimize N+1 queries with proper eager loading

### Analytics & Audit
- ✅ Deal stage history tracking
- ✅ Data room access logging
- ⏳ Add comprehensive audit log for all mutations
- ⏳ Build analytics dashboard queries

## Related Documentation

- [Database Schema](/packages/db/src/schema/) - Drizzle table definitions
- [Authentication](/packages/auth/) - BetterAuth configuration
- [Convex Schema](/convex/schema.ts) - Original schema reference
- [Alecia Suite Architecture](/docs/plans/2026-02-07-alecia-suite-ecosystem.md) - Full system design
