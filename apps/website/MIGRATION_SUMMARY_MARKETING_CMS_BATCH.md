# Marketing, CMS, Blog, Forum, Careers, Comments, Visual Editor, Theme - Convex to Server Actions Migration

## Summary

Successfully ported 8 Convex function files to Next.js Server Actions with Drizzle ORM for the Alecia M&A advisory platform.

## Files Created

### 1. `/apps/website/src/actions/marketing.ts` (ported from `convex/marketing.ts`)

**Functions:**
- `getTransactions()` - Get track record with filtering
- `getTransactionBySlug()` - Get single transaction by slug
- `getTransactionFilters()` - Get available filter options
- `getTeamMembers()` - Get team members (uses existing Drizzle schema)
- `getTeamMemberBySlug()` - Get single team member
- `getForumCategories()` - Get public forum categories
- `getConfig()` - Get global config by key
- `getAllConfig()` - Get all config
- `getMarketingKPIs()` - Get active KPIs with localization
- `getAllMarketingKPIs()` - Get all KPIs (admin)
- `upsertMarketingKPI()` - Create or update KPI
- `deleteMarketingKPI()` - Delete KPI
- `getLocationImages()` - Get location images for interactive map
- `upsertLocationImage()` - Create or update location image

**Schema Status:**
- ✅ `teamMembers` - Already in Drizzle schema
- ⚠️ `transactions` - TODO: Add to V007 migration
- ⚠️ `forum_categories` - TODO: Add to V007 migration
- ⚠️ `global_config` - TODO: Add to V007 migration
- ⚠️ `marketing_kpis` - TODO: Add to V007 migration
- ⚠️ `location_images` - TODO: Add to V007 migration

**Notes:**
- Marketing content will migrate to Strapi CE
- All TODO comments added for missing tables
- Uses raw SQL queries for non-schema tables

---

### 2. `/apps/website/src/actions/blog.ts` (ported from `convex/blog.ts`)

**Functions:**
- `getPosts()` - Get blog posts with filtering and author enrichment
- `getPostBySlug()` - Get single post by slug with author info
- `getBlogCategories()` - Get unique categories
- `createPost()` - Create new blog post (requires auth)
- `updatePost()` - Update existing post (author or sudo only)
- `deletePost()` - Delete post (sudo only)
- `generateSlug()` - Generate unique slug from title
- `exportFromColab()` - Export Colab document as draft blog post

**Schema Status:**
- ⚠️ `blog_posts` - TODO: Add to V007 migration

**Business Logic:**
- Slug uniqueness checking
- Auto-set publishedAt when status changes to "published"
- Author ownership validation
- Sudo override for all operations
- French accent removal in slug generation

**Notes:**
- Uses `getAuthenticatedUser()` from auth helper
- Integrates with Colab documents for export
- Calls `revalidatePath()` for Next.js cache invalidation

---

### 3. `/apps/website/src/actions/cms.ts` (ported from `convex/cms.ts`)

**Functions:**
- `getPage()` - Get site page by slug
- `getProposals()` - Get active proposals with enriched data
- `getProposalById()` - Get single proposal with current content
- `updatePage()` - Direct page update (sudo only)
- `createProposal()` - Create proposal for page change (partner/sudo)
- `voteOnProposal()` - Vote for/against proposal (partner/sudo)
- `mergeProposal()` - Merge approved proposal (checks quorum)

**Schema Status:**
- ⚠️ `site_pages` - TODO: Add to V007 migration
- ⚠️ `proposals` - TODO: Add to V007 migration
- ⚠️ `global_settings` - TODO: Add to V007 migration

**Business Logic:**
- Git-style governance workflow
- Quorum checking (default 50% approval rate)
- Vote switching allowed
- Only partners/sudo can propose and vote
- Only sudo can directly update pages

**Notes:**
- Will migrate to Strapi once deployed
- Governance model for content approval
- Tracks votes_for and votes_against arrays

---

### 4. `/apps/website/src/actions/forum.ts` (ported from `convex/forum.ts`)

**Functions:**
- `getThreads()` - Get threads with post counts and activity
- `getThread()` - Get single thread with author info
- `createThread()` - Create thread with initial post
- `updateThread()` - Update thread (author or sudo only)
- `deleteThread()` - Delete thread and all posts (author or sudo only)
- `getPosts()` - Get posts for thread with author enrichment
- `createPost()` - Create new post (checks thread lock status)
- `updatePost()` - Edit post (author or sudo only)
- `deletePost()` - Delete post (author or sudo only)

**Schema Status:**
- ⚠️ `forum_threads` - TODO: Add to V007 migration
- ⚠️ `forum_posts` - TODO: Add to V007 migration

**Business Logic:**
- Thread pinning and locking
- Post content validation (max 10000 chars)
- Thread title validation (max 200 chars)
- Cascade delete (deleting thread deletes all posts)
- Sorting: pinned first, then by last activity

**Notes:**
- Supports deal-specific forums (dealId reference)
- Category filtering
- isEdited flag for edited posts

---

### 5. `/apps/website/src/actions/careers.ts` (ported from `convex/careers.ts`)

**Functions:**
- `listJobOffers()` - Get job offers with optional unpublished
- `getJobOfferById()` - Get single offer by ID
- `getJobOfferBySlug()` - Get single offer by slug
- `createJobOffer()` - Create new job offer
- `updateJobOffer()` - Update existing job offer
- `deleteJobOffer()` - Delete job offer
- `toggleJobOfferPublished()` - Toggle published status

**Schema Status:**
- ⚠️ `job_offers` - TODO: Add to V007 migration

**Business Logic:**
- Auto-increment displayOrder for new offers
- Support for both string and array requirements
- PDF attachment support
- Published/draft status

**Notes:**
- Will migrate to Strapi CMS
- Simple CRUD operations
- No authentication required for public queries

---

### 6. `/apps/website/src/actions/comments.ts` (ported from `convex/comments.ts`)

**Functions:**
- `getComments()` - Get comments for entity with author info
- `getCommentCount()` - Get comment count for entity
- `addComment()` - Add comment with mentions
- `editComment()` - Edit comment (author only)
- `deleteComment()` - Delete comment (author or sudo)

**Schema Status:**
- ⚠️ `comments` - TODO: Add to V007 migration

**Business Logic:**
- Polymorphic references (entity_type + entity_id)
- Supports: deal, company, contact, document, card, board
- @ mentions support with unique deduplication
- Content validation (max 5000 chars)
- isEdited flag for edited comments
- Self-mention prevention

**Notes:**
- Universal commenting system across all entities
- TODO: Implement notification system for mentions
- Uses getAuthenticatedUser() for all mutations

---

### 7. `/apps/website/src/actions/visual-editor.ts` (ported from `convex/visual_editor.ts`)

**Functions:**
- `getEditablePages()` - Get page list with optional locale filter
- `getPageContent()` - Get full page content
- `getPublishedPageContent()` - Get published content only
- `getPendingChanges()` - Get pending changes with approval counts
- `getPageVersions()` - Get version history (last 20)
- `initializePage()` - Initialize page for editing
- `submitChanges()` - Submit changes for approval
- `reviewChange()` - Review and approve/reject changes
- `publishChanges()` - Publish approved changes
- `rollbackToVersion()` - Rollback to previous version
- `updatePageSections()` - Update draft sections
- `deletePendingChange()` - Delete pending change

**Schema Status:**
- ⚠️ `page_content` - TODO: Add to V007 migration
- ⚠️ `pending_changes` - TODO: Add to V007 migration
- ⚠️ `change_approvals` - TODO: Add to V007 migration
- ⚠️ `page_versions` - TODO: Add to V007 migration

**Business Logic:**
- TipTap/ProseMirror JSON content handling
- Approval workflow with configurable threshold
- Auto-approve when threshold met
- Auto-reject when impossible to meet threshold
- Version snapshots before every publish
- Visual diff + code diff tracking
- Change description and AI summary support

**Notes:**
- Most complex workflow (4 related tables)
- Handles visual website editor with approval system
- Auto-publishing on approval
- Comprehensive version history

---

### 8. `/apps/website/src/actions/theme.ts` (ported from `convex/theme.ts`)

**Functions:**
- `getThemeSettings()` - Get current theme with defaults
- `updateThemeSettings()` - Update theme settings
- `resetThemeSettings()` - Reset to default theme

**Schema Status:**
- ⚠️ `global_config` - TODO: Add to V007 migration (shared with marketing.ts)

**Business Logic:**
- Default theme preserved (Navy + Gold)
- Light/dark mode color schemes
- Google Fonts for heading and body
- Merge with defaults to ensure all fields exist

**Default Theme:**
```json
{
  "primaryLight": "#061A40",
  "secondaryLight": "#f59e0b",
  "backgroundLight": "#f8fafc",
  "primaryDark": "#f1f5f9",
  "secondaryDark": "#f59e0b",
  "backgroundDark": "#020617",
  "headingFont": "Playfair Display",
  "bodyFont": "Outfit"
}
```

**Notes:**
- Stores theme in global_config table with key "theme_settings"
- Updates trigger cache revalidation for entire site

---

## Shared Auth Helper

**File:** `/apps/website/src/actions/lib/auth.ts` (already existed)

Uses BetterAuth (@alepanel/auth) for session management:
- `getAuthenticatedUser()` - Throws if not authenticated
- `AuthenticatedUser` type export

---

## Migration Strategy

### Tables to Add in V007 Migration

**Priority 1 (Core Content):**
1. `blog_posts` - Blog content
2. `job_offers` - Careers page
3. `transactions` - Track record
4. `team_members` - Already exists ✅

**Priority 2 (CMS & Governance):**
5. `site_pages` - CMS pages
6. `proposals` - CMS proposals
7. `global_config` - Global configuration
8. `global_settings` - Site settings

**Priority 3 (Community):**
9. `forum_threads` - Forum threads
10. `forum_posts` - Forum posts
11. `forum_categories` - Forum categories
12. `comments` - Universal comments

**Priority 4 (Visual Editor):**
13. `page_content` - Visual editor pages
14. `pending_changes` - Editor change proposals
15. `change_approvals` - Editor approvals
16. `page_versions` - Editor version history

**Priority 5 (Marketing Features):**
17. `marketing_kpis` - Homepage KPIs
18. `location_images` - Interactive map

### Strapi Migration Path

Once Strapi CE is deployed, migrate these content types:
1. Blog posts → Strapi Content Type
2. Job offers → Strapi Content Type
3. Transactions → Strapi Content Type
4. Team members → Strapi Content Type
5. Marketing KPIs → Strapi Content Type

Keep in PostgreSQL:
- Forum (requires complex relationships)
- Comments (polymorphic, used across apps)
- Visual editor (versioning workflow)
- CMS governance (proposals/voting)

---

## Testing Checklist

### Marketing Actions
- [ ] Public transaction list with filters
- [ ] Transaction detail pages
- [ ] Team member directory
- [ ] Team member detail pages
- [ ] Marketing KPIs display
- [ ] Location images for map

### Blog Actions
- [ ] Blog post listing (published only for public)
- [ ] Blog post detail pages
- [ ] Create/edit/delete posts (authenticated)
- [ ] Slug generation and uniqueness
- [ ] Export from Colab

### CMS Actions
- [ ] View proposals
- [ ] Create proposal (partner/sudo)
- [ ] Vote on proposals
- [ ] Merge proposals (quorum check)
- [ ] Direct page update (sudo only)

### Forum Actions
- [ ] Thread listing (pinned + active sorting)
- [ ] Create thread with initial post
- [ ] Reply to threads
- [ ] Edit/delete posts (author or sudo)
- [ ] Thread locking

### Careers Actions
- [ ] Job listing (public)
- [ ] Job detail pages
- [ ] Create/edit/delete offers
- [ ] Toggle published status

### Comments Actions
- [ ] Add comments to deals/companies/contacts
- [ ] @ mentions
- [ ] Edit/delete own comments
- [ ] Comment counts

### Visual Editor Actions
- [ ] Initialize pages
- [ ] Submit changes for approval
- [ ] Review and approve changes
- [ ] Auto-publish on approval
- [ ] Rollback to previous versions

### Theme Actions
- [ ] Get current theme
- [ ] Update theme colors/fonts
- [ ] Reset to defaults

---

## Key Patterns Used

1. **Raw SQL for Missing Tables**: Used `db.execute(sql\`...\`)` with TODO comments
2. **Authentication**: All mutations use `getAuthenticatedUser()`
3. **Authorization**: Role-based checks (sudo, partner, advisor, user)
4. **Cache Invalidation**: `revalidatePath()` after mutations
5. **Validation**: Length limits, content sanitization (basic)
6. **Error Handling**: Clear French error messages
7. **Batch Operations**: Efficient data fetching with JOINs
8. **Soft Deletes**: isActive, isPublished flags where appropriate

---

## Next Steps

1. **Create V007 Migration**: Add all 18 missing tables to PostgreSQL schema
2. **Update Drizzle Schema**: Add TypeScript definitions for all tables
3. **Test Server Actions**: Verify all functions work with real data
4. **Deploy Strapi CE**: Set up CMS for content migration
5. **Create Migration Scripts**: Export Convex data → PostgreSQL
6. **Update Frontend**: Replace Convex hooks with Server Actions
7. **Implement Notifications**: Add notification system for comments/mentions

---

## File Locations

```
/apps/website/src/actions/
├── marketing.ts          # Marketing website public queries + KPIs
├── blog.ts               # Blog CRUD + Colab export
├── cms.ts                # Git-style governance for site pages
├── forum.ts              # Forum threads and posts
├── careers.ts            # Job offers CRUD
├── comments.ts           # Universal commenting system
├── visual-editor.ts      # Visual editor with approval workflow
├── theme.ts              # Theme customization
└── lib/
    └── auth.ts           # Shared BetterAuth helper (already existed)
```

All files follow the pattern:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// TODO comments for missing tables
// Raw SQL queries for non-schema tables
// Type-safe Drizzle queries for existing tables
```
