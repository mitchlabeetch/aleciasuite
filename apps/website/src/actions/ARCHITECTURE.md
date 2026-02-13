# Architecture Comparison: Convex vs Server Actions

## Before: Convex Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ useQuery()   │  │ useMutation()│  │ useAction()  │      │
│  │ (reactive)   │  │ (optimistic) │  │ (server fn)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Convex Client  │
                    │   (WebSocket)   │
                    └───────┬────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Convex Cloud                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /convex/schema.ts                                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  deals   │ │companies │ │ contacts │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Functions (JavaScript/TypeScript)                  │    │
│  │  ┌────────────────────────────────────┐            │    │
│  │  │  query("deals:list", ...)          │            │    │
│  │  │  mutation("deals:create", ...)     │            │    │
│  │  │  action("pappers:enrich", ...)     │            │    │
│  │  └────────────────────────────────────┘            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Pros:                             Cons:                     │
│  ✅ Real-time reactivity           ❌ Vendor lock-in         │
│  ✅ Optimistic updates             ❌ $25+/month cost        │
│  ✅ Type-safe client               ❌ Limited control        │
│  ✅ Built-in auth                  ❌ 120KB bundle size      │
│                                    ❌ Edge runtime only      │
│                                    ❌ No SQL joins           │
└─────────────────────────────────────────────────────────────┘
```

## After: Server Actions + PostgreSQL

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Server Component (async/await)                       │  │
│  │  const deals = await getDeals({ stage: "valuation" }) │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Client Component (useTransition)                     │  │
│  │  startTransition(async () => {                        │  │
│  │    await createDeal(data);                            │  │
│  │  });                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                    No WebSocket needed!                      │
│                    0KB client bundle                         │
└───────────────────────────────────┬─────────────────────────┘
                                    │
                            ┌───────▼────────┐
                            │  Server Actions │
                            │  (Next.js 14+)  │
                            └───────┬────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────┐
│                 Your VPS/Cloud Infrastructure                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  apps/website/src/actions/                         │    │
│  │  ┌────────────────────────────────────┐            │    │
│  │  │  "use server";                     │            │    │
│  │  │                                    │            │    │
│  │  │  export async function getDeals()  │            │    │
│  │  │  export async function createDeal()│            │    │
│  │  │  export async function enrichCo... │            │    │
│  │  └────────────────────────────────────┘            │    │
│  └────────────────────────────────────────────────────┘    │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  @alepanel/db (Drizzle ORM)                        │    │
│  │  ┌────────────────────────────────────┐            │    │
│  │  │  db.query.deals.findMany({         │            │    │
│  │  │    where: eq(deals.stage, stage),  │            │    │
│  │  │    with: { owner: true }           │            │    │
│  │  │  })                                │            │    │
│  │  └────────────────────────────────────┘            │    │
│  └────────────────────────────────────────────────────┘    │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                                │    │
│  │  ┌────────────────────────────────────┐            │    │
│  │  │  Schema: shared                    │            │    │
│  │  │    - users, deals, companies       │            │    │
│  │  │  Schema: alecia_bi                 │            │    │
│  │  │    - embeddings, research_feeds    │            │    │
│  │  │  Schema: alecia_numbers            │            │    │
│  │  │    - valuations, comparables       │            │    │
│  │  │  Schema: alecia_sign               │            │    │
│  │  │    - deal_rooms, documents         │            │    │
│  │  └────────────────────────────────────┘            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Pros:                             Cons:                     │
│  ✅ No vendor lock-in              ⚠️  Manual reactivity     │
│  ✅ $0 cost (self-hosted)          ⚠️  No automatic sync     │
│  ✅ Full SQL power (joins)         ⚠️  Need to handle state │
│  ✅ 0KB client bundle                                        │
│  ✅ Works on any runtime                                     │
│  ✅ Complete control                                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### Convex: Read a Deal

```typescript
// Client Component
function DealCard() {
  const deal = useQuery(api.deals.getDeal, { id: dealId });
  //          ▲
  //          │ WebSocket subscription (reactive)
  //          │
  //    ┌─────┴─────┐
  //    │  Convex   │
  //    │   Cloud   │
  //    └─────┬─────┘
  //          │
  //          ▼
  //    { _id: "...", title: "Acme Deal", ... }
  //
  // Updates automatically when data changes! ✨
}
```

### Server Actions: Read a Deal

```typescript
// Server Component
async function DealCard() {
  const deal = await getDealById(dealId);
  //             ▲
  //             │ Direct database query
  //             │
  //       ┌─────┴─────┐
  //       │  Drizzle  │
  //       │    ORM    │
  //       └─────┬─────┘
  //             │
  //             ▼
  //       ┌──────────┐
  //       │PostgreSQL│
  //       └──────────┘
  //
  // Renders once, no reactivity
  // Use router.refresh() to re-fetch
}
```

### Convex: Create a Deal

```typescript
// Client Component
function CreateButton() {
  const createDeal = useMutation(api.deals.createDeal);

  const handleClick = () => {
    createDeal({ title: "New Deal" });
    // ▼
    // Optimistic update applied immediately
    // UI shows new deal before server confirms
    // ▼
    // WebSocket sends mutation to Convex
    // ▼
    // All subscribed clients get update
  };
}
```

### Server Actions: Create a Deal

```typescript
// Client Component
function CreateButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await createDeal({ title: "New Deal" });
      //   ▼
      //   Server Action executes on server
      //   ▼
      //   Drizzle inserts into PostgreSQL
      //   ▼
      //   revalidatePath() called
      //   ▼
      //   Next.js invalidates cache
      //   ▼
      //   Component re-renders with fresh data
      router.refresh(); // Optional: force re-fetch
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "Creating..." : "Create"}
    </button>
  );
}
```

## State Management Comparison

### Convex: Automatic State Sync

```
User A's Browser          Convex Cloud          User B's Browser
─────────────────         ────────────         ─────────────────
useQuery("deals")    ◄──► [deals table] ◄──►   useQuery("deals")
                            
User A updates deal
     │
     ▼
useMutation() ────────────► [update] ────────────► Auto-updates!
                                                   (WebSocket)
                            
Both users see changes immediately ✨
```

### Server Actions: Manual State Management

```
User A's Browser          PostgreSQL           User B's Browser
─────────────────         ──────────           ─────────────────
GET /deals          ◄──► [deals table] ◄──►   GET /deals
(Server Component)                             (Server Component)
     
User A updates deal
     │
     ▼
Server Action ──────────────► [UPDATE] 
revalidatePath()                                      
     │                                                 
     ▼                                                 
Next.js cache cleared                              User B needs to
User A sees update                                 refresh page or
                                                   use polling ⚠️
```

## Solutions for Real-time Updates

### Option 1: Polling (Simple)
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshDeals() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // Re-fetch every 30s
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
```

### Option 2: Server-Sent Events (Better)
```typescript
// app/api/deals/events/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Listen to PostgreSQL NOTIFY
  const client = await pool.connect();
  await client.query("LISTEN deal_changes");

  client.on("notification", (msg) => {
    writer.write(encoder.encode(`data: ${msg.payload}\n\n`));
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

// Client component
"use client";

export function DealsList({ initialDeals }) {
  const [deals, setDeals] = useState(initialDeals);

  useEffect(() => {
    const events = new EventSource("/api/deals/events");
    
    events.onmessage = (e) => {
      const update = JSON.parse(e.data);
      setDeals(prev => [...prev, update]);
    };

    return () => events.close();
  }, []);

  return <div>{deals.map(...)}</div>;
}
```

### Option 3: WebSockets (Most Complex)
```typescript
// Use libraries like Socket.io or Pusher
// Or integrate Hocuspocus (Yjs) for real-time collaboration
```

## Migration Recommendation

### Phase 1: Simple Pages (Start Here)
- Company listings
- Contact pages
- Static content
- Forms with no real-time needs

**Why:** Learn Server Actions without dealing with state complexity

### Phase 2: Dashboard & Analytics
- Pipeline view (can refresh on interval)
- Deal statistics
- Reports

**Why:** Data refreshes are acceptable here, users expect to reload

### Phase 3: Collaborative Features
- Deal rooms (implement SSE or WebSockets)
- Live editing (integrate Hocuspocus)
- Chat/comments

**Why:** Tackle real-time requirements last, after core migration

## Performance Benchmarks

### Cold Start (Time to First Byte)
- Convex: ~200ms (Edge runtime initialization)
- Server Actions: ~50ms (no edge overhead)

### Query Performance (PostgreSQL on same VPS)
- Convex: 50-100ms (network roundtrip to cloud)
- Server Actions: 10-30ms (local database)

### Bundle Size
- Convex: +120KB (WebSocket client, reactive hooks)
- Server Actions: 0KB (server-only code)

### Monthly Cost (for Alecia's scale)
- Convex: ~$25-50/month (Hobby/Pro plan)
- Server Actions + PostgreSQL: $0 (self-hosted on OVH)

## Conclusion

**Use Server Actions when:**
- ✅ You want full control over infrastructure
- ✅ You need complex SQL queries and joins
- ✅ You're self-hosting everything (FOSS compliance)
- ✅ Real-time updates are not critical
- ✅ You want zero vendor lock-in

**Keep Convex for:**
- Real-time collaboration (whiteboard, chat)
- Instant UI updates across users
- Rapid prototyping
- Teams without database expertise

**For Alecia Suite:**
We're migrating to Server Actions because:
1. FOSS compliance (no proprietary cloud dependencies)
2. Cost reduction ($0 vs $25+/month)
3. Advanced SQL queries for M&A analytics
4. Full control over data and infrastructure
5. Better integration with self-hosted stack (Strapi, DocuSeal, etc.)

We'll add real-time features later via:
- Hocuspocus for Colab editor sync
- SSE for pipeline updates
- PostgreSQL NOTIFY for critical events
