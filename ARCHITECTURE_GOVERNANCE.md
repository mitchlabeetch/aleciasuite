# Alecia Ecosystem - Architecture Governance

## How Sync Is Guaranteed Post-Migration

This document explains the architectural patterns that ensure perfect synchronization
between the Website/Admin Panel and Colab applications.

---

## 1. Single Source of Truth Principle

### 1.1 Convex Backend (SINGLE)

```
alepanel/convex/              ← ONE folder, used by BOTH apps
├── schema.ts                 ← ONE schema definition
├── deals.ts                  ← ONE deals implementation
├── users.ts                  ← ONE users implementation
├── colab/                    ← Colab-specific (but same DB)
│   ├── documents.ts
│   └── boards.ts
└── lib/                      ← Shared utilities
```

**Why This Works:**
```typescript
// apps/website imports from:
import { api } from "../../../convex/_generated/api";

// apps/colab imports from:
import { api } from "../../../convex/_generated/api";

// SAME IMPORT PATH = SAME CODE = GUARANTEED SYNC
```

### 1.2 Schema Changes Auto-Propagate

When you modify `convex/schema.ts`:

1. **Single deployment** pushes to Convex
2. **Both apps** use the same generated types
3. **TypeScript errors** appear in BOTH apps if breaking changes occur
4. **Cannot deploy** with type mismatches

```bash
# One command deploys for BOTH apps
npx convex deploy
```

---

## 2. Shared Packages (TypeScript Enforcement)

### 2.1 packages/ui - Shared Layout Components

```typescript
// packages/ui/layout/SharedSidebar.tsx
interface SidebarProps {
  mode: "admin" | "colab";    // Explicitly typed
  items: SidebarItem[];       // Shared interface
}

export function SharedSidebar({ mode, items }: SidebarProps) {
  // Single implementation, used by both apps
}
```

**Sync Mechanism:** If you change `SidebarProps`, TypeScript will error in both apps until they're updated.

### 2.2 packages/convex-types - Shared Type Exports

```typescript
// packages/convex-types/src/deals.ts
import { Doc, Id } from "../../convex/_generated/dataModel";

// Shared types - used by BOTH apps
export type Deal = Doc<"deals">;
export type DealId = Id<"deals">;
export type DealStage = Deal["stage"];

// Utility types
export interface DealWithCompany extends Deal {
  companyName: string;
  companyLogo: string | null;
}
```

**Sync Mechanism:** Types are generated from schema → imported by both apps → always in sync.

---

## 3. Build-Time Enforcement

### 3.1 Turborepo Dependency Graph

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // Packages build FIRST
      "outputs": [".next/**"]
    }
  }
}
```

**Build Order:**
1. `packages/convex-types` builds → generates types from schema
2. `packages/ui` builds → uses shared types
3. `apps/website` builds → imports from packages
4. `apps/colab` builds → imports from packages

**If ANY step fails, deployment stops.**

### 3.2 Single CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy All
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install
        run: npm ci
      
      - name: Typecheck ALL apps
        run: npm run typecheck   # Checks BOTH apps
      
      - name: Deploy Convex
        run: npx convex deploy   # SINGLE backend deployment
      
      - name: Build ALL apps
        run: npm run build       # Builds BOTH apps
      
      # Vercel auto-deploys from same repo
```

**If Colab breaks, the entire build fails. You cannot deploy a broken state.**

---

## 4. Communication Between Apps

### 4.1 Shared Convex Queries (Real-Time Sync)

```typescript
// convex/deals.ts - SINGLE implementation
export const getDeals = query({
  handler: async (ctx) => {
    return await ctx.db.query("deals").collect();
  },
});

// apps/website uses it:
const deals = useQuery(api.deals.getDeals);

// apps/colab uses it:
const deals = useQuery(api.deals.getDeals);

// SAME DATA, REAL-TIME SYNC via Convex subscriptions
```

**Sync Mechanism:** Both apps subscribe to the same Convex queries → see same data in real-time.

### 4.2 Cross-App Navigation

```typescript
// packages/ui/utils/navigation.ts
export const ROUTES = {
  // Website routes
  website: {
    home: "https://alecia.markets",
    admin: "https://alecia.markets/admin",
    deals: "https://alecia.markets/admin/deals",
  },
  // Colab routes
  colab: {
    home: "https://colab.alecia.markets",
    dashboard: "https://colab.alecia.markets/dashboard",
    documents: "https://colab.alecia.markets/documents",
  },
} as const;

// Navigate from Admin to Colab document
function openColabDocument(docId: string) {
  window.open(`${ROUTES.colab.documents}/${docId}`, "_blank");
}
```

**Sync Mechanism:** Route constants in shared package → any change updates both apps.

### 4.3 PostMessage Bridge (For Embedded Mode)

```typescript
// packages/ui/bridge/ColabBridge.ts
export interface ColabMessage {
  type: "navigate" | "sync" | "close";
  payload: unknown;
}

// Parent (Admin Panel) sends to Colab iframe
export function sendToColab(iframe: HTMLIFrameElement, message: ColabMessage) {
  iframe.contentWindow?.postMessage(message, "https://colab.alecia.markets");
}

// Child (Colab) listens
export function listenForAdminMessages(callback: (msg: ColabMessage) => void) {
  window.addEventListener("message", (event) => {
    if (event.origin === "https://alecia.markets") {
      callback(event.data as ColabMessage);
    }
  });
}
```

**Sync Mechanism:** Bridge interface in shared package → type-safe communication → compile error if mismatched.

---

## 5. Adding New Features (Workflow)

### 5.1 Example: Adding "Deal Comments" to Colab

**Step 1: Add to Schema (ONE place)**
```typescript
// convex/schema.ts
colab_deal_comments: defineTable({
  dealId: v.id("deals"),      // References SHARED deals table
  content: v.string(),
  authorId: v.id("users"),    // References SHARED users table
  createdAt: v.number(),
})
```

**Step 2: Add Mutations (ONE place)**
```typescript
// convex/colab/comments.ts
export const addComment = mutation({
  args: {
    dealId: v.id("deals"),    // Type from shared schema
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Writes to shared database
  },
});
```

**Step 3: Use in Colab UI**
```typescript
// apps/colab/components/DealComments.tsx
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";

export function DealComments({ dealId }: { dealId: Id<"deals"> }) {
  const addComment = useMutation(api.colab.comments.addComment);
  // ...
}
```

**Step 4: (Optional) Also show in Admin Panel**
```typescript
// apps/website/components/admin/deals/DealDetail.tsx
// Uses SAME query, SAME data, SAME types
import { api } from "../../../../convex/_generated/api";

export function DealDetail({ dealId }: { dealId: Id<"deals"> }) {
  const comments = useQuery(api.colab.comments.getByDeal, { dealId });
  // Shows Colab comments in Admin Panel - automatically!
}
```

**No sync required - it's the same code!**

---

## 6. Preventing Drift (Governance Rules)

### 6.1 Mandatory Lint Rules

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["**/apps/website/**"],
            "message": "Cannot import from website in colab - use packages/"
          },
          {
            "group": ["**/apps/colab/**"],
            "message": "Cannot import from colab in website - use packages/"
          }
        ]
      }
    ]
  }
}
```

**Prevents:** Apps importing directly from each other (which would create coupling).

### 6.2 Shared Code MUST Be in Packages

```
✅ ALLOWED:
  apps/website → packages/ui
  apps/colab → packages/ui
  apps/* → convex/

❌ FORBIDDEN:
  apps/website → apps/colab
  apps/colab → apps/website
```

### 6.3 Pre-Commit Hooks

```json
// package.json
{
  "scripts": {
    "precommit": "turbo run typecheck lint"
  }
}
```

**Every commit must pass typecheck across ALL apps.**

---

## 7. Summary: Why Sync Is Guaranteed

| Mechanism | What It Prevents |
|-----------|------------------|
| **Single convex/ folder** | Schema drift, function conflicts |
| **Shared packages/** | Component/type divergence |
| **Turborepo build order** | Deploying broken state |
| **Single CI/CD pipeline** | Independent broken deploys |
| **TypeScript everywhere** | Runtime type mismatches |
| **Convex subscriptions** | Stale data between apps |
| **ESLint import rules** | Accidental tight coupling |

---

## 8. Migration Guarantees

After migration:

1. **Cannot have two schemas** - there's only one `schema.ts`
2. **Cannot have conflicting functions** - there's only one `deals.ts`
3. **Cannot deploy inconsistent state** - single build must pass
4. **Cannot lose data sync** - Convex handles real-time subscriptions
5. **Cannot have incompatible types** - TypeScript enforces across apps

---

*Created: 2026-01-22*
*Governance Level: MANDATORY*
