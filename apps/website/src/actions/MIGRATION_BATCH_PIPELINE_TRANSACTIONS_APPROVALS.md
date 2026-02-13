# Convex to Drizzle Migration - Batch: Pipeline, Transactions, Approvals

## Summary

Successfully ported 3 Convex function files to Next.js Server Actions with Drizzle ORM.

## Files Created

### 1. `/apps/website/src/actions/pipeline.ts` (313 lines)
**Source**: `/convex/pipeline.ts`

**Functions Ported**:
- ✅ `getKanbanColumns` - Get Kanban columns for a board
- ✅ `createKanbanColumn` - Create new column with auto-ordering
- ✅ `reorderKanbanColumns` - Reorder columns by ID array
- ✅ `deleteKanbanColumn` - Delete a column
- ✅ `getEvents` - Get project events with filters
- ✅ `getAllEvents` - Get all events with pagination and enriched data
- ✅ `getActiveUsers` - Get users who have logged events
- ✅ `logEvent` - Log a new event
- ✅ `logEventInternal` - Internal event logging (for automation)

**Key Features**:
- Batch fetching to prevent N+1 queries (user, deal, company enrichment)
- Support for filtering by dealId, companyId, userId, eventTypes
- Pagination with limit/offset
- Full event timeline with metadata support

**TODO - Schema Required**:
```sql
-- Add to packages/db/src/schema/shared.ts or bi.ts:

CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id TEXT,
  name TEXT NOT NULL,
  color TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);

CREATE TABLE project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES shared.contacts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_events_deal_id ON project_events(deal_id);
CREATE INDEX idx_project_events_company_id ON project_events(company_id);
CREATE INDEX idx_project_events_user_id ON project_events(user_id);
CREATE INDEX idx_project_events_created_at ON project_events(created_at DESC);
```

---

### 2. `/apps/website/src/actions/transactions.ts` (463 lines)
**Source**: `/convex/transactions.ts`

**Functions Ported**:
- ✅ `listTransactions` - List all transactions sorted by display order
- ✅ `getTransactionById` - Get single transaction
- ✅ `getTransactionByDeal` - Get transaction linked to a deal
- ✅ `createTransaction` - Create new transaction with auto-ordering
- ✅ `updateTransaction` - Update transaction (dynamic field updates)
- ✅ `removeTransaction` - Delete transaction
- ✅ `reorderTransactions` - Reorder by ID array
- ✅ `duplicateTransaction` - Duplicate with `-copy` suffix

**Key Features**:
- Track record management for M&A advisory firm
- Support for confidential deals (client/acquirer masking)
- Testimonials and case study metadata
- Link to active deals via `dealId`
- Display order management for marketing pages

**TODO - Schema Required**:
```sql
-- Add to packages/db/src/schema/shared.ts:

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_logo TEXT,
  acquirer_name TEXT,
  acquirer_logo TEXT,
  sector TEXT NOT NULL,
  region TEXT,
  year INTEGER NOT NULL,
  mandate_type TEXT NOT NULL,
  description TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  is_client_confidential BOOLEAN DEFAULT false,
  is_acquirer_confidential BOOLEAN DEFAULT false,
  is_prior_experience BOOLEAN NOT NULL DEFAULT false,
  context TEXT,
  intervention TEXT,
  result TEXT,
  testimonial_text TEXT,
  testimonial_author TEXT,
  role_type TEXT,
  deal_size TEXT,
  deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
  key_metrics JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_deal_id ON transactions(deal_id);
CREATE INDEX idx_transactions_year ON transactions(year DESC);
CREATE INDEX idx_transactions_display_order ON transactions(display_order);
```

---

### 3. `/apps/website/src/actions/approvals.ts` (889 lines)
**Source**: `/convex/approvals.ts`

**Functions Ported**:

**Queries**:
- ✅ `getApprovalRequest` - Get single request with all reviews and enriched data
- ✅ `listPendingForUser` - Get user's pending approvals (inbox)
- ✅ `listMyRequests` - Get requests created by user
- ✅ `listByDeal` - Get approvals for a specific deal
- ✅ `listByEntity` - Get approvals for any entity type
- ✅ `getTemplates` - Get approval templates
- ✅ `getDefaultTemplate` - Get default template for entity type

**Mutations**:
- ✅ `createApprovalRequest` - Create new approval request
- ✅ `createFromTemplate` - Create request from template
- ✅ `submitReview` - Submit approve/reject/request changes
- ✅ `cancelRequest` - Cancel request (requester/admin only)
- ✅ `updateRequest` - Update pending request (before reviews)
- ✅ `createTemplate` - Create approval template (sudo/partner)
- ✅ `updateTemplate` - Update template (sudo/partner)
- ✅ `deleteTemplate` - Delete template (sudo/partner)

**Internal Helpers**:
- ✅ `getExpiredRequests` - For cron job
- ✅ `markExpired` - Mark request as expired
- ✅ `getPendingCountForUser` - For notification badges

**Key Features**:
- Generic approval workflow system for documents, teasers, LOIs, emails, data rooms
- Three approval types: `any` (N of M), `all` (unanimous), `sequential` (ordered chain)
- Template system with role-based default reviewers
- Priority levels: low, medium, high, urgent
- Auto-expiry support
- Full audit trail of reviews
- Smart final decision logic (handles early termination for `all` and `sequential`)

**TODO - Schema Required**:
```sql
-- Add to packages/db/src/schema/shared.ts or bi.ts:

CREATE TYPE approval_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'cancelled', 'expired');
CREATE TYPE approval_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE approval_type AS ENUM ('any', 'all', 'sequential');
CREATE TYPE entity_type AS ENUM ('document', 'teaser', 'loi', 'email', 'data_room', 'deal_stage');
CREATE TYPE review_decision AS ENUM ('approved', 'rejected', 'request_changes');

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  requester_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  required_approvals INTEGER NOT NULL,
  approval_type approval_type NOT NULL,
  assigned_reviewers UUID[] NOT NULL,
  current_sequence_index INTEGER,
  status approval_status NOT NULL DEFAULT 'pending',
  priority approval_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  entity_snapshot TEXT,
  template_id UUID REFERENCES approval_templates(id) ON DELETE SET NULL,
  final_decision TEXT,
  final_decision_by UUID REFERENCES shared.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_requester ON approval_requests(requester_id);
CREATE INDEX idx_approval_requests_deal ON approval_requests(deal_id);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_assigned ON approval_requests USING GIN(assigned_reviewers);

CREATE TABLE approval_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  decision review_decision NOT NULL,
  comment TEXT,
  sequence_index INTEGER,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, reviewer_id)
);

CREATE INDEX idx_approval_reviews_request ON approval_reviews(request_id);
CREATE INDEX idx_approval_reviews_reviewer ON approval_reviews(reviewer_id);
CREATE INDEX idx_approval_reviews_request_reviewer ON approval_reviews(request_id, reviewer_id);

CREATE TABLE approval_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entity_types entity_type[] NOT NULL,
  required_approvals INTEGER NOT NULL,
  approval_type approval_type NOT NULL,
  default_reviewer_roles TEXT[] NOT NULL,
  default_priority approval_priority NOT NULL DEFAULT 'medium',
  default_due_days INTEGER,
  auto_expire_days INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES shared.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_templates_active ON approval_templates(is_active);
CREATE INDEX idx_approval_templates_default ON approval_templates(is_default);
```

---

## Migration Pattern Summary

All files follow the same structure:

```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types
export interface CreateInput { ... }

// Queries
export async function getItems() {
  const user = await getAuthenticatedUser();
  // ... Drizzle query
}

// Mutations
export async function createItem(input: CreateInput) {
  const user = await getAuthenticatedUser();
  // ... Drizzle insert/update/delete
  revalidatePath("/relevant-path");
  return result;
}
```

## Key Translation Patterns Applied

| Convex | Drizzle/PostgreSQL |
|--------|-------------------|
| `query({ args, handler })` | `export async function queryName()` |
| `mutation({ args, handler })` | `export async function mutationName()` |
| `ctx.auth.getUserIdentity()` | `getAuthenticatedUser()` |
| `ctx.db.query("table")` | `db.query.table.findMany()` or `db.execute(sql...)` |
| `ctx.db.get(id)` | `db.query.table.findFirst({ where: eq(...) })` |
| `ctx.db.insert("table", data)` | `db.insert(table).values(data).returning()` |
| `ctx.db.patch(id, data)` | `db.update(table).set(data).where(eq(...))` |
| `ctx.db.delete(id)` | `db.delete(table).where(eq(...))` |
| Convex validators (`v.string()`) | TypeScript interfaces |
| `withIndex("by_field")` | `WHERE field = ...` (indexes created in schema) |
| N+1 queries with `Promise.all` | `LEFT JOIN` in SQL or raw queries |

## Next Steps

1. **Add Schema Definitions**:
   - Create migration files in `/infrastructure/postgres/migrations/`
   - Add TypeScript schema definitions to `/packages/db/src/schema/`
   - Run migrations: `pnpm db:migrate`

2. **Replace Drizzle Schema Imports**:
   - Once schema is added, replace `db.execute(sql...)` with proper Drizzle queries
   - Example: `db.query.kanbanColumns.findMany({ where: eq(...) })`

3. **Update Frontend**:
   - Replace Convex `useQuery`/`useMutation` hooks with server actions
   - Use `useTransition` or `useFormState` for mutations
   - Example:
     ```tsx
     // Before (Convex)
     const events = useQuery(api.pipeline.getEvents, { dealId });

     // After (Server Action)
     const events = await getEvents({ dealId });
     // Or with client component:
     const [events, setEvents] = useState([]);
     useEffect(() => {
       getEvents({ dealId }).then(setEvents);
     }, [dealId]);
     ```

4. **Add Revalidation**:
   - All mutations call `revalidatePath()` to invalidate Next.js cache
   - Consider adding `revalidateTag()` for more granular control

5. **Role-Based Access Control**:
   - Approvals template mutations check for `sudo` or `partner` role
   - Add similar checks to other sensitive operations

## Business Logic Preserved

All business logic has been carefully preserved:

- **Pipeline**: Kanban ordering, event batching, user enrichment
- **Transactions**: Display order, slug uniqueness, deal linkage
- **Approvals**: Sequential approval logic, early termination, template defaults, role-based reviewers

## Authentication

All functions use the shared `getAuthenticatedUser()` helper from `/apps/website/src/actions/lib/auth.ts`, which:
- Verifies BetterAuth session
- Returns user object with `id`, `email`, `role`
- Throws error if not authenticated

## Files Modified

None (only new files created).

## Testing Checklist

Before deploying:

- [ ] Add schema definitions and run migrations
- [ ] Test each query function with various filters
- [ ] Test mutations with role-based access (sudo, partner, user)
- [ ] Test approval workflows (any/all/sequential)
- [ ] Test edge cases (empty results, expired approvals, sequential rejection)
- [ ] Verify revalidation paths are correct
- [ ] Check frontend components are updated to use server actions
- [ ] Test error handling (invalid IDs, unauthorized access)

## Notes

- Used raw SQL with `db.execute(sql...)` as placeholder until schema is added
- All TODOs are clearly marked with schema requirements
- Maintained exact same function signatures where possible for easier frontend migration
- Added comprehensive TypeScript types for all inputs/outputs
