# Convex to Server Actions Migration Guide

This guide helps you migrate from Convex queries/mutations to Next.js Server Actions with PostgreSQL.

## Quick Reference Table

| Convex Function | Server Action | Notes |
|----------------|---------------|-------|
| `api.deals.getDeals` | `getDeals()` | Now supports filtering |
| `api.deals.getDeal` | `getDealById(id)` | Returns null if not found |
| `api.deals.createDeal` | `createDeal(data)` | Auto-creates stage history |
| `api.deals.updateDeal` | `updateDeal(id, data)` | Auto-revalidates cache |
| `api.deals.updateStage` | `updateDealStage(id, stage, reason?)` | Tracks reason in history |
| `api.companies.enrichFromPappers` | `enrichCompany(id)` | Requires SIREN |
| `api.dataRooms.createRoom` | `createDealRoom(data)` | Auto-creates default folders |

## Step-by-Step Migration

### 1. Update Imports

**Before (Convex):**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
```

**After (Server Actions):**
```typescript
import { getDeals, createDeal } from "@/actions";
import { useTransition } from "react";
```

### 2. Convert Server Components

**Before:**
```typescript
// app/deals/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function DealsPage() {
  const preloadedDeals = await preloadQuery(api.deals.getDeals, {});

  return <DealsList preloadedDeals={preloadedDeals} />;
}
```

**After:**
```typescript
// app/deals/page.tsx
import { getDeals } from "@/actions";

export default async function DealsPage() {
  const deals = await getDeals({ includeArchived: false });

  return <DealsList deals={deals} />;
}
```

### 3. Convert Client Components

**Before:**
```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DealsList() {
  const deals = useQuery(api.deals.getDeals, { stage: "valuation" });
  const createDeal = useMutation(api.deals.createDeal);

  if (deals === undefined) return <Spinner />;

  const handleCreate = () => {
    createDeal({ title: "New Deal", stage: "sourcing" });
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Deal</button>
      {deals.map(deal => <DealCard key={deal._id} deal={deal} />)}
    </div>
  );
}
```

**After:**
```typescript
"use client";

import { createDeal } from "@/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface DealsListProps {
  deals: Awaited<ReturnType<typeof getDeals>>;
}

export function DealsList({ deals }: DealsListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createDeal({ title: "New Deal", stage: "sourcing" });
        router.refresh(); // Refresh server component data
      } catch (error) {
        console.error("Failed to create deal:", error);
      }
    });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? "Creating..." : "Create Deal"}
      </button>
      {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
    </div>
  );
}
```

### 4. Update Form Actions

**Before:**
```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";

export function CreateDealForm() {
  const createDeal = useMutation(api.deals.createDeal);
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    createDeal(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("title")} />
      <button type="submit">Create</button>
    </form>
  );
}
```

**After (Option 1: Progressive Enhancement with Server Actions):**
```typescript
// app/deals/actions.ts (colocated with form)
"use server";

import { createDeal } from "@/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDealAction(formData: FormData) {
  const title = formData.get("title") as string;

  const deal = await createDeal({ title, stage: "sourcing" });

  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

// app/deals/create-form.tsx
export function CreateDealForm() {
  return (
    <form action={createDealAction}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

**After (Option 2: Client-side validation with useTransition):**
```typescript
"use client";

import { createDeal } from "@/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function CreateDealForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    startTransition(async () => {
      const deal = await createDeal(data);
      router.push(`/deals/${deal.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("title", { required: true })} />
      {errors.title && <span>Title is required</span>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### 5. Handle Loading States

**Before (Convex):**
```typescript
const deals = useQuery(api.deals.getDeals);

if (deals === undefined) {
  return <Spinner />;
}
```

**After (Server Components):**
```typescript
// app/deals/page.tsx
import { Suspense } from "react";
import { getDeals } from "@/actions";

async function DealsList() {
  const deals = await getDeals();
  return <div>{/* render deals */}</div>;
}

export default function DealsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DealsList />
    </Suspense>
  );
}
```

**After (Client Components with useTransition):**
```typescript
const [isPending, startTransition] = useTransition();

const handleRefresh = () => {
  startTransition(() => {
    router.refresh();
  });
};

return isPending ? <Spinner /> : <DealsList deals={deals} />;
```

### 6. Optimistic Updates

**Before (Convex):**
```typescript
const updateDeal = useMutation(api.deals.updateDeal);

const handleUpdate = (id, data) => {
  // Convex handles optimistic updates automatically
  updateDeal({ id, ...data });
};
```

**After (Server Actions with useOptimistic):**
```typescript
"use client";

import { updateDeal } from "@/actions";
import { useOptimistic, useTransition } from "react";

export function DealCard({ deal }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDeal, setOptimisticDeal] = useOptimistic(deal);

  const handleUpdate = (data) => {
    setOptimisticDeal({ ...deal, ...data });

    startTransition(async () => {
      await updateDeal(deal.id, data);
    });
  };

  return <div>{optimisticDeal.title}</div>;
}
```

## Data Structure Changes

### ID Format
- **Convex:** `_id: Id<"deals">` (e.g., `"jd7x8y9z..."`)
- **PostgreSQL:** `id: string` (UUID v4, e.g., `"550e8400-e29b-41d4-a716-446655440000"`)

### Timestamps
- **Convex:** `_creationTime: number` (milliseconds since epoch)
- **PostgreSQL:** `createdAt: Date` (ISO timestamp)

### Relations
```typescript
// Convex (manual joins)
const deal = useQuery(api.deals.getDeal, { id: dealId });
const company = useQuery(api.companies.getCompany, {
  id: deal?.companyId
});

// Server Actions (automatic joins via Drizzle)
const deal = await getDealById(dealId);
// deal.company is already populated
```

### Enums
```typescript
// Convex (union literals in schema)
stage: v.union(
  v.literal("sourcing"),
  v.literal("qualification"),
  // ...
)

// PostgreSQL (enum type)
stage: dealStageEnum("stage").default("sourcing").notNull()

// Both support TypeScript type inference
type DealStage = "sourcing" | "qualification" | ...
```

## Common Pitfalls

### 1. Forgetting "use server"
```typescript
// ❌ Wrong - missing directive
export async function createDeal(data) {
  await db.insert(shared.deals).values(data);
}

// ✅ Correct
"use server";

export async function createDeal(data) {
  await db.insert(shared.deals).values(data);
}
```

### 2. Not revalidating cache
```typescript
// ❌ Wrong - UI won't update
export async function createDeal(data) {
  await db.insert(shared.deals).values(data);
}

// ✅ Correct
export async function createDeal(data) {
  await db.insert(shared.deals).values(data);
  revalidatePath("/deals");
}
```

### 3. Calling Server Actions in Server Components without async
```typescript
// ❌ Wrong - missing await
export default function DealsPage() {
  const deals = getDeals(); // Returns Promise
  return <div>{deals.map(...)}</div>; // Error!
}

// ✅ Correct
export default async function DealsPage() {
  const deals = await getDeals();
  return <div>{deals.map(...)}</div>;
}
```

### 4. Not handling errors in Client Components
```typescript
// ❌ Wrong - errors will crash the app
const handleCreate = () => {
  startTransition(async () => {
    await createDeal(data);
  });
};

// ✅ Correct
const handleCreate = () => {
  startTransition(async () => {
    try {
      await createDeal(data);
    } catch (error) {
      setError(error.message);
    }
  });
};
```

## Environment Variables

Update your `.env.local`:

```bash
# Remove Convex
# CONVEX_URL=...
# NEXT_PUBLIC_CONVEX_URL=...

# Add PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/alecia

# Add Pappers API (for company enrichment)
PAPPERS_API_TOKEN=your_pappers_token

# Keep BetterAuth vars (already migrated from Clerk)
BETTER_AUTH_SECRET=...
```

## Testing

### Unit Tests
```typescript
import { createDeal } from "@/actions";
import { db } from "@alepanel/db";

jest.mock("@alepanel/db");
jest.mock("@alepanel/auth");

describe("createDeal", () => {
  it("creates a deal with default values", async () => {
    const mockDeal = { id: "123", title: "Test Deal", stage: "sourcing" };
    db.insert.mockReturnValue({
      returning: jest.fn().mockResolvedValue([mockDeal])
    });

    const result = await createDeal({ title: "Test Deal" });

    expect(result.title).toBe("Test Deal");
    expect(result.stage).toBe("sourcing");
  });
});
```

### Integration Tests
```typescript
import { test, expect } from "@playwright/test";

test("create deal flow", async ({ page }) => {
  await page.goto("/deals");
  await page.click("button:has-text('Create Deal')");
  await page.fill('input[name="title"]', "Test Deal");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/deals\/[0-9a-f-]+/);
  await expect(page.locator("h1")).toContainText("Test Deal");
});
```

## Performance Comparison

| Metric | Convex | Server Actions + PostgreSQL |
|--------|--------|---------------------------|
| Cold start | ~200ms | ~50ms (no edge runtime overhead) |
| Query latency | 50-100ms | 10-30ms (local database) |
| Real-time updates | Native | Requires polling/webhooks |
| Bundle size | +120KB client | 0KB client (runs on server) |
| Cost | $25+/month | $0 (self-hosted) |

## Rollback Plan

If you need to rollback:

1. Keep Convex functions in `/convex` directory (don't delete)
2. Restore `CONVEX_URL` environment variables
3. Revert imports from `@/actions` back to `@/convex/_generated/api`
4. Deploy previous version from git

## Next Steps

1. ✅ Create Server Actions scaffold
2. ⏳ Update one page at a time (start with simple lists)
3. ⏳ Test thoroughly in development
4. ⏳ Deploy to staging environment
5. ⏳ Monitor performance and errors
6. ⏳ Gradually migrate remaining pages
7. ⏳ Remove Convex dependency when 100% migrated

## Resources

- [Next.js Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [BetterAuth Docs](https://www.better-auth.com/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
