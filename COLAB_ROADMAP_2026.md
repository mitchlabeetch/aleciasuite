# Colab Evolution Roadmap 2026

> **Vision**: Transform Colab from a Notion-like collaboration tool into the definitive M&A deal execution platform for boutique advisory firms.

**Last Updated**: February 2026  
**Tech Stack**: Next.js 15 + PostgreSQL + Drizzle ORM + BetterAuth + Vercel AI SDK + Vercel Blob Storage  
**Target Users**: M&A Partners, Advisors, Analysts at Alecia

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Phase 0: Foundation & Unification](#phase-0-foundation--unification-immediate)
4. [Phase 1: Deal Execution Core](#phase-1-deal-execution-core-0-3-months)
5. [Phase 2: Intelligence & Automation](#phase-2-intelligence--automation-3-6-months)
6. [Phase 3: Scale & Polish](#phase-3-scale--polish-6-12-months)
7. [Technical Architecture](#7-technical-architecture)
8. [Success Metrics](#8-success-metrics)

---

## 1. Executive Summary

### The Problem
Alecia's deal team currently uses 5+ disconnected tools:
- **VDR**: Intralinks/Datasite for document sharing
- **CRM**: Pipedrive for deal tracking
- **Documents**: Google Docs/Word for IMs and Teasers
- **Calendar**: Outlook for meetings
- **Project Management**: Notion/Trello for tasks

### The Solution
A unified platform where:
- Documents, deals, and data rooms live in one place
- Real-time collaboration eliminates version conflicts
- Microsoft/Pipedrive sync keeps external systems updated via OAuth2 and server actions
- AI accelerates document creation and analysis

### Key Differentiators
| Feature | Competitors | Colab |
|---------|-------------|-------|
| VDR + Deal Pipeline | Separate tools | Integrated |
| Real-time collaboration | Limited | Full Yjs/CRDT |
| AI document generation | None | Vercel AI SDK |
| Boutique-focused | Enterprise pricing | Right-sized |

---

## 2. Current State Analysis

### What Works Well
- Document editor with templates (IM, Teaser, LOI, DD Checklist)
- Deal pipeline with Kanban stages
- Presence tracking (who's online)
- BetterAuth authentication with role-based access
- PostgreSQL + Drizzle ORM for real-time database
- Vercel Blob for file storage

### Critical Gaps
| Gap | Business Impact | Priority |
|-----|-----------------|----------|
| No Virtual Data Room | Must use external VDR | CRITICAL |
| Two separate sidebars | Confusing UX | HIGH |
| OAuth not fully wired | Manual data entry | HIGH |
| No true collaborative editing | Risk of data loss | HIGH |
| No email integration | Context switching | MEDIUM |
| No analytics | Blind to pipeline health | MEDIUM |

### Technical Debt
- `AdminSidebar.tsx` duplicates `UnifiedSidebar`
- Yjs installed but unused
- OAuth callbacks missing
- Console.log statements (fixed)
- @ts-ignore violations (fixed)

---

## Phase 0: Foundation & Unification (Immediate)

> **Goal**: Single unified navigation, perfect routing, clear branding

### 0.1 Unified Sidebar

**Problem**: Two sidebar implementations with different configs and LocalStorage keys.

**Solution**: Consolidate to single `UnifiedSidebar` across both apps.

#### Implementation

**Files to Modify**:
- `/packages/ui/src/components/sidebar/config.ts` - Extend config
- `/packages/ui/src/components/sidebar/UnifiedSidebar.tsx` - Add app detection
- `/apps/website/src/components/admin/AdminSidebar.tsx` - Replace with UnifiedSidebar
- `/apps/website/src/components/admin/AdminLayoutClient.tsx` - Use shared provider

**New Config Structure**:
```typescript
// packages/ui/src/components/sidebar/config.ts

export type AppContext = "colab" | "panel";

export interface SidebarConfig {
  categories: SidebarCategory[];
  appContext: AppContext;
  branding: {
    colab: { label: "Colab", color: "blue" };
    panel: { label: "Panel", color: "purple" };
  };
}

export const getSidebarConfig = (appContext: AppContext): SidebarConfig => ({
  appContext,
  branding: {
    colab: { label: "Colab", color: "blue" },
    panel: { label: "Panel", color: "purple" },
  },
  categories: [
    // Colab category - shown in both apps
    {
      id: "colab",
      label: "Workspace",
      icon: "Briefcase",
      defaultOpen: appContext === "colab",
      items: [
        { href: "/documents", label: "Documents", icon: "FileText" },
        { href: "/colab/boards", label: "Kanban", icon: "LayoutGrid" },
        { href: "/pipeline", label: "Pipeline", icon: "TrendingUp" },
        { href: "/presentations", label: "Presentations", icon: "Presentation" },
        { href: "/calendar", label: "Calendar", icon: "Calendar" },
        { href: "/data-rooms", label: "Data Rooms", icon: "FolderLock", badge: "NEW" },
      ],
    },
    // CRM category
    {
      id: "crm",
      label: "CRM",
      icon: "Users",
      defaultOpen: appContext === "panel",
      items: [
        { href: "/admin/crm/deals", label: "Deals", icon: "Handshake" },
        { href: "/admin/crm/companies", label: "Companies", icon: "Building" },
        { href: "/admin/crm/contacts", label: "Contacts", icon: "UserCircle" },
      ],
    },
    // Site category - Panel only
    {
      id: "site",
      label: "Website",
      icon: "Globe",
      visibleIn: ["panel"],
      items: [
        { href: "/admin/blog", label: "Blog", icon: "FileEdit" },
        { href: "/admin/team", label: "Team", icon: "Users" },
        { href: "/admin/operations", label: "Operations", icon: "Settings" },
      ],
    },
    // System category
    {
      id: "system",
      label: "System",
      icon: "Settings",
      items: [
        { href: "/admin/settings", label: "Settings", icon: "Settings" },
        { href: "/admin/kpis", label: "KPIs", icon: "BarChart" },
        { href: "/admin/settings/integrations", label: "Integrations", icon: "Plug" },
      ],
    },
  ],
});
```

**App Detection Logic**:
```typescript
// packages/ui/src/hooks/use-app-context.ts

export function useAppContext(): AppContext {
  if (typeof window === "undefined") return "panel";
  
  const hostname = window.location.hostname;
  
  // Production detection
  if (hostname === "colab.alecia.markets") return "colab";
  if (hostname === "alecia.markets") return "panel";
  
  // Development detection
  const port = window.location.port;
  if (port === "3001") return "colab"; // Colab dev port
  if (port === "3000") return "panel"; // Website dev port
  
  // Fallback to URL path
  if (window.location.pathname.startsWith("/admin")) return "panel";
  return "colab";
}
```

**Branding Badge**:
```tsx
// In UnifiedSidebar.tsx header

const { appContext, branding } = useAppContext();
const currentBrand = branding[appContext];

<div className="flex items-center gap-2 px-4 py-3 border-b">
  <Logo className="h-6 w-6" />
  <span className="font-semibold">Alecia</span>
  <Badge 
    variant="outline" 
    className={cn(
      "text-xs",
      currentBrand.color === "blue" && "border-blue-500 text-blue-600",
      currentBrand.color === "purple" && "border-purple-500 text-purple-600"
    )}
  >
    {currentBrand.label}
  </Badge>
</div>
```

#### Success Criteria
- [ ] Single sidebar codebase for both apps
- [ ] "Colab" badge on colab.alecia.markets
- [ ] "Panel" badge on alecia.markets/admin
- [ ] Seamless navigation between apps
- [ ] Same LocalStorage key for preferences
- [ ] Role-based visibility works consistently

#### Inspiration/References
- [Notion sidebar](https://notion.so) - Workspace switching
- [Linear sidebar](https://linear.app) - Clean categorization
- [Vercel dashboard](https://vercel.com) - Project/team context

---

### 0.2 Cross-App Communication

**Problem**: Colab and Panel are separate Next.js apps with shared Convex database but no real-time sync of UI state.

**Solution**: Leverage Convex reactivity + shared auth context.

#### Implementation

**Shared User Preferences Table**:
```typescript
// convex/schema.ts - Add user_preferences

user_preferences: defineTable({
  userId: v.string(),
  sidebarCollapsed: v.boolean(),
  openCategories: v.array(v.string()),
  theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  lastActiveApp: v.union(v.literal("colab"), v.literal("panel")),
  lastActiveRoute: v.string(),
})
.index("by_user", ["userId"]),
```

**Real-time Preference Sync Hook**:
```typescript
// packages/ui/src/hooks/use-synced-preferences.ts

export function useSyncedPreferences() {
  const { user } = useUser();
  const prefs = useQuery(api.userPreferences.get, 
    user ? { userId: user.id } : "skip"
  );
  const updatePrefs = useMutation(api.userPreferences.update);
  
  // Sync on change
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    updatePrefs({ sidebarCollapsed: collapsed });
  }, [updatePrefs]);
  
  return {
    ...prefs,
    setSidebarCollapsed,
    // ... other setters
  };
}
```

#### Success Criteria
- [ ] Sidebar state persists across apps
- [ ] Theme preference shared
- [ ] "Continue where you left off" navigation
- [ ] Real-time updates via Convex subscriptions

---

### 0.3 OAuth Callback Routes

**Problem**: Microsoft and Pipedrive OAuth flows have no callback handlers.

**Solution**: Create proper OAuth callback routes.

#### Implementation

**Microsoft OAuth Callback**:
```typescript
// apps/website/src/app/api/auth/microsoft/callback/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  
  if (error) {
    return NextResponse.redirect(
      `/admin/settings/integrations?error=${encodeURIComponent(error)}`
    );
  }
  
  if (!code) {
    return NextResponse.redirect(
      `/admin/settings/integrations?error=missing_code`
    );
  }
  
  try {
    // Exchange code for tokens via Convex action
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    
    // Convex action handles token exchange and storage
    await fetch(`${process.env.CONVEX_URL}/api/actions/microsoft.exchangeToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, userId }),
    });
    
    return NextResponse.redirect(
      `/admin/settings/integrations?success=microsoft_connected`
    );
  } catch (err) {
    console.error("Microsoft OAuth error:", err);
    return NextResponse.redirect(
      `/admin/settings/integrations?error=token_exchange_failed`
    );
  }
}
```

**Pipedrive OAuth Callback** (Updated to Server Actions):
```typescript
// apps/website/src/app/api/auth/pipedrive/callback/route.ts

import { NextResponse } from "next/server";
import { exchangePipedriveCode } from "@/actions/integrations/pipedrive-sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.redirect(
      `/admin/settings/integrations?error=missing_code`
    );
  }
  
  try {
    const result = await exchangePipedriveCode(code);
    
    if (result.success) {
      return NextResponse.redirect(
        `/admin/settings/integrations?success=pipedrive_connected`
      );
    } else {
      return NextResponse.redirect(
        `/admin/settings/integrations?error=${result.error}`
      );
    }
  } catch (err) {
    console.error("Pipedrive OAuth error:", err);
    return NextResponse.redirect(
      `/admin/settings/integrations?error=pipedrive_failed`
    );
  }
}
```

**Environment Variables to Add**:
```bash
# .env.example additions

# Microsoft OAuth (Azure AD)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# Pipedrive OAuth
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=https://alecia.markets/api/auth/pipedrive/callback
```

#### Success Criteria
- [ ] Microsoft OAuth flow completes without errors
- [ ] Pipedrive OAuth flow completes without errors
- [ ] Tokens stored securely in Convex
- [ ] Auto-refresh of expired tokens
- [ ] Error states handled gracefully in UI

---

## Phase 1: Deal Execution Core (0-3 months)

> **Goal**: Replace external VDR tools, enable end-to-end deal execution in Colab

### 1.1 Virtual Data Rooms (VDR)

**Business Value**: Eliminate Intralinks/Datasite subscription ($2-5K/month per deal)

#### Schema Design

```typescript
// convex/schema.ts additions

// Data Room container
deal_rooms: defineTable({
  dealId: v.id("deals"),
  name: v.string(),
  status: v.union(
    v.literal("setup"),
    v.literal("active"),
    v.literal("closed"),
    v.literal("archived")
  ),
  settings: v.object({
    watermarkEnabled: v.boolean(),
    downloadRestricted: v.boolean(),
    expiresAt: v.optional(v.number()),
    allowedDomains: v.optional(v.array(v.string())),
  }),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_deal", ["dealId"])
.index("by_status", ["status"]),

// Folder structure within room
deal_room_folders: defineTable({
  roomId: v.id("deal_rooms"),
  parentId: v.optional(v.id("deal_room_folders")),
  name: v.string(),
  order: v.number(),
  // Standard DD categories
  category: v.optional(v.union(
    v.literal("legal"),
    v.literal("financial"),
    v.literal("tax"),
    v.literal("hr"),
    v.literal("ip"),
    v.literal("commercial"),
    v.literal("it"),
    v.literal("environmental"),
    v.literal("other")
  )),
})
.index("by_room", ["roomId"])
.index("by_parent", ["parentId"]),

// Documents in data room
deal_room_documents: defineTable({
  roomId: v.id("deal_rooms"),
  folderId: v.id("deal_room_folders"),
  storageId: v.id("_storage"),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  version: v.number(),
  uploadedBy: v.id("users"),
  uploadedAt: v.number(),
  // Access control
  accessLevel: v.union(
    v.literal("all"),
    v.literal("buyer_group"),
    v.literal("seller_only"),
    v.literal("restricted")
  ),
  restrictedTo: v.optional(v.array(v.string())), // User IDs or email domains
  // Metadata
  ddChecklistItemId: v.optional(v.id("dd_checklist_items")),
  tags: v.optional(v.array(v.string())),
})
.index("by_room", ["roomId"])
.index("by_folder", ["folderId"])
.index("by_checklist_item", ["ddChecklistItemId"]),

// Access audit log
deal_room_access_log: defineTable({
  roomId: v.id("deal_rooms"),
  documentId: v.optional(v.id("deal_room_documents")),
  userId: v.string(),
  userEmail: v.string(),
  action: v.union(
    v.literal("view"),
    v.literal("download"),
    v.literal("print"),
    v.literal("share")
  ),
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  duration: v.optional(v.number()), // View duration in seconds
})
.index("by_room", ["roomId"])
.index("by_document", ["documentId"])
.index("by_user", ["userId"])
.index("by_timestamp", ["timestamp"]),

// Q&A within data room
deal_room_questions: defineTable({
  roomId: v.id("deal_rooms"),
  documentId: v.optional(v.id("deal_room_documents")),
  folderId: v.optional(v.id("deal_room_folders")),
  question: v.string(),
  askedBy: v.string(), // External user email or internal user ID
  askedByName: v.string(),
  askedAt: v.number(),
  answer: v.optional(v.string()),
  answeredBy: v.optional(v.id("users")),
  answeredAt: v.optional(v.number()),
  status: v.union(
    v.literal("open"),
    v.literal("answered"),
    v.literal("clarification_needed"),
    v.literal("declined")
  ),
  isPrivate: v.boolean(), // Only visible to asker and sellers
  attachments: v.optional(v.array(v.id("deal_room_documents"))),
})
.index("by_room", ["roomId"])
.index("by_status", ["status"])
.index("by_asker", ["askedBy"]),

// External user invitations
deal_room_invitations: defineTable({
  roomId: v.id("deal_rooms"),
  email: v.string(),
  name: v.string(),
  company: v.optional(v.string()),
  role: v.union(
    v.literal("viewer"),
    v.literal("downloader"),
    v.literal("questioner")
  ),
  accessLevel: v.union(
    v.literal("all"),
    v.literal("buyer_group"),
    v.literal("restricted")
  ),
  folderAccess: v.optional(v.array(v.id("deal_room_folders"))),
  invitedBy: v.id("users"),
  invitedAt: v.number(),
  acceptedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked")
  ),
})
.index("by_room", ["roomId"])
.index("by_email", ["email"])
.index("by_status", ["status"]),
```

#### UI Components

**Data Room List Page**: `/apps/colab/app/data-rooms/page.tsx`
```tsx
// Grid of data rooms with:
// - Deal name and status badge
// - Document count
// - Active users count
// - Last activity timestamp
// - Quick actions (Enter, Settings, Archive)
```

**Data Room View**: `/apps/colab/app/data-rooms/[roomId]/page.tsx`
```tsx
// Three-panel layout:
// 1. Left: Folder tree (collapsible)
// 2. Center: Document grid/list with previews
// 3. Right: Activity feed + Q&A panel

// Top bar:
// - Upload button (drag & drop)
// - Search within room
// - Filter by folder/tag/date
// - Invite users button
// - Room settings

// Document preview:
// - PDF.js for PDF preview
// - Office Online embed for Word/Excel
// - Image lightbox
```

**Access Analytics Dashboard**: `/apps/colab/app/data-rooms/[roomId]/analytics/page.tsx`
```tsx
// Charts:
// - Document views over time
// - Most viewed documents
// - User engagement heatmap
// - Average time spent per document
// - Download activity
```

#### Tech Stack & Libraries

| Purpose | Library | Reason |
|---------|---------|--------|
| File uploads | `@vercel/blob` | Already integrated, scalable |
| PDF preview | `react-pdf` + `pdfjs-dist` | Best PDF rendering |
| Office preview | Microsoft Office Online embed | Native experience |
| Drag & drop | `react-dropzone` | Industry standard |
| File tree | Custom + `@radix-ui/react-tree` | Accessible, customizable |
| Watermarks | `pdf-lib` | Client-side PDF manipulation |

#### Implementation Steps

1. **Schema & Migrations** (Week 1)
   - Add all tables to schema.ts
   - Create indexes for performance
   - Write seed data for testing

2. **Core CRUD Mutations** (Week 2)
   - `createRoom`, `updateRoom`, `archiveRoom`
   - `createFolder`, `moveFolder`, `deleteFolder`
   - `uploadDocument`, `moveDocument`, `deleteDocument`
   - `logAccess` (automatic on view/download)

3. **Access Control Layer** (Week 3)
   - `checkDocumentAccess(userId, documentId)` query
   - Middleware for all document operations
   - Email domain validation for external users

4. **UI: Room List & Creation** (Week 4)
   - Data room grid component
   - Create room modal with DD template folders
   - Room settings panel

5. **UI: Document Management** (Week 5-6)
   - Folder tree navigation
   - Document upload with progress
   - Preview panel with multiple file types
   - Bulk operations (move, delete, download)

6. **UI: Q&A System** (Week 7)
   - Question submission form
   - Answer workflow for internal team
   - Notification on new questions
   - Export Q&A log

7. **Analytics & Reporting** (Week 8)
   - Access log queries
   - Recharts visualizations
   - Export to Excel

#### Success Criteria
- [ ] Create data room from deal in <30 seconds
- [ ] Upload 100 documents via drag & drop
- [ ] Preview PDF, Word, Excel, Images inline
- [ ] Invite external users via email
- [ ] Track every view/download with timestamp
- [ ] Answer questions with document references
- [ ] Export access log to Excel
- [ ] Watermark PDFs on download (configurable)

#### Inspiration/References
- [Intralinks VDR](https://intralinks.com) - Feature set baseline
- [DocSend](https://docsend.com) - Analytics UX
- [Notion database](https://notion.so) - Folder/document grid UI

---

### 1.2 Real-time Collaborative Editing

**Business Value**: Eliminate version conflicts, enable simultaneous IM drafting

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Colab Editor                          │
├─────────────────────────────────────────────────────────────┤
│  TipTap Editor                                               │
│  ├── @tiptap/extension-collaboration (Yjs binding)         │
│  ├── @tiptap/extension-collaboration-cursor                 │
│  └── Custom extensions (mentions, slash commands)           │
├─────────────────────────────────────────────────────────────┤
│  Yjs Document (Y.Doc)                                        │
│  ├── Shared types: Y.XmlFragment for content                │
│  └── Awareness: cursor positions, selections, user info     │
├─────────────────────────────────────────────────────────────┤
│  Convex Yjs Provider (Custom)                                │
│  ├── Syncs Y.Doc updates to Convex                          │
│  ├── Broadcasts to other clients via Convex subscriptions   │
│  └── Handles offline/reconnection                           │
├─────────────────────────────────────────────────────────────┤
│  Convex Database                                             │
│  ├── colab_documents.content (Y.Doc encoded as base64)      │
│  └── colab_document_updates (incremental updates)           │
└─────────────────────────────────────────────────────────────┘
```

#### Schema Additions

```typescript
// convex/schema.ts additions

// Yjs document updates (for sync)
colab_document_updates: defineTable({
  documentId: v.id("colab_documents"),
  update: v.string(), // Base64-encoded Yjs update
  clientId: v.string(),
  timestamp: v.number(),
})
.index("by_document", ["documentId"])
.index("by_timestamp", ["timestamp"]),

// Extend colab_documents
colab_documents: defineTable({
  // ... existing fields
  yjsState: v.optional(v.string()), // Full Y.Doc state for new clients
  lastYjsUpdate: v.optional(v.number()),
}),
```

#### Convex Yjs Provider

```typescript
// apps/colab/lib/convex-yjs-provider.ts

import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";

export class ConvexYjsProvider {
  private doc: Y.Doc;
  private awareness: Awareness;
  private convex: ConvexReactClient;
  private documentId: string;
  private unsubscribe?: () => void;
  
  constructor(
    doc: Y.Doc,
    convex: ConvexReactClient,
    documentId: string,
    user: { id: string; name: string; color: string }
  ) {
    this.doc = doc;
    this.convex = convex;
    this.documentId = documentId;
    this.awareness = new Awareness(doc);
    
    // Set local user awareness
    this.awareness.setLocalState({
      user,
      cursor: null,
      selection: null,
    });
    
    // Subscribe to document updates from Convex
    this.subscribeToUpdates();
    
    // Send local updates to Convex
    this.doc.on("update", this.handleLocalUpdate);
    
    // Send awareness updates
    this.awareness.on("change", this.handleAwarenessChange);
  }
  
  private subscribeToUpdates() {
    // Use Convex subscription for real-time updates
    this.unsubscribe = this.convex.onUpdate(
      api.colab.documents.subscribeToUpdates,
      { documentId: this.documentId },
      (updates) => {
        updates.forEach((update) => {
          if (update.clientId !== this.getClientId()) {
            const binaryUpdate = this.base64ToUint8Array(update.update);
            Y.applyUpdate(this.doc, binaryUpdate, "remote");
          }
        });
      }
    );
  }
  
  private handleLocalUpdate = (update: Uint8Array, origin: string) => {
    if (origin === "remote") return; // Don't echo remote updates
    
    // Debounce and batch updates
    this.pendingUpdates.push(update);
    this.flushUpdatesDebounced();
  };
  
  private flushUpdates = async () => {
    if (this.pendingUpdates.length === 0) return;
    
    const mergedUpdate = Y.mergeUpdates(this.pendingUpdates);
    this.pendingUpdates = [];
    
    await this.convex.mutation(api.colab.documents.applyUpdate, {
      documentId: this.documentId,
      update: this.uint8ArrayToBase64(mergedUpdate),
      clientId: this.getClientId(),
    });
  };
  
  destroy() {
    this.unsubscribe?.();
    this.doc.off("update", this.handleLocalUpdate);
    this.awareness.off("change", this.handleAwarenessChange);
    this.awareness.destroy();
  }
}
```

#### TipTap Integration

```typescript
// apps/colab/components/editor/CollaborativeEditor.tsx

import { useEditor, EditorContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { ConvexYjsProvider } from "@/lib/convex-yjs-provider";

export function CollaborativeEditor({ documentId }: { documentId: string }) {
  const { user } = useUser();
  const convex = useConvex();
  
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<ConvexYjsProvider | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const p = new ConvexYjsProvider(ydoc, convex, documentId, {
      id: user.id,
      name: user.fullName || user.username || "Anonymous",
      color: getUserColor(user.id),
    });
    
    setProvider(p);
    
    return () => p.destroy();
  }, [ydoc, convex, documentId, user]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), // Disable built-in history
      Collaboration.configure({
        document: ydoc,
        field: "content",
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user?.fullName || "Anonymous",
          color: getUserColor(user?.id || "default"),
        },
      }),
      // ... other extensions
    ],
  });
  
  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <CollaboratorAvatars provider={provider} />
    </div>
  );
}
```

#### Success Criteria
- [ ] Two users edit same document simultaneously
- [ ] See each other's cursors in real-time
- [ ] Changes merge without conflicts
- [ ] Offline edits sync when reconnected
- [ ] Version history preserved
- [ ] <100ms latency for cursor updates
- [ ] <500ms latency for content sync

#### Inspiration/References
- [Liveblocks + TipTap](https://liveblocks.io/docs/get-started/tiptap) - Integration pattern
- [Hocuspocus](https://tiptap.dev/hocuspocus) - Yjs server reference
- [y-websocket](https://github.com/yjs/y-websocket) - Provider pattern

---

### 1.3 Due Diligence Checklist System

**Business Value**: Structured DD process, no missed items, clear accountability

#### Schema Design

```typescript
// convex/schema.ts additions

dd_checklist_templates: defineTable({
  name: v.string(),
  category: v.union(
    v.literal("buy_side"),
    v.literal("sell_side"),
    v.literal("merger")
  ),
  items: v.array(v.object({
    id: v.string(),
    section: v.string(), // "Legal", "Financial", etc.
    item: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("critical"), v.literal("important"), v.literal("standard")),
    suggestedDocuments: v.optional(v.array(v.string())),
  })),
  createdBy: v.id("users"),
  isDefault: v.boolean(),
}),

dd_checklists: defineTable({
  dealId: v.id("deals"),
  templateId: v.optional(v.id("dd_checklist_templates")),
  name: v.string(),
  status: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("review"),
    v.literal("complete")
  ),
  progress: v.number(), // 0-100
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_deal", ["dealId"]),

dd_checklist_items: defineTable({
  checklistId: v.id("dd_checklists"),
  section: v.string(),
  item: v.string(),
  description: v.optional(v.string()),
  priority: v.union(v.literal("critical"), v.literal("important"), v.literal("standard")),
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("received"),
    v.literal("reviewed"),
    v.literal("issue_found"),
    v.literal("not_applicable")
  ),
  assignedTo: v.optional(v.id("users")),
  dueDate: v.optional(v.number()),
  documents: v.optional(v.array(v.id("deal_room_documents"))),
  notes: v.optional(v.string()),
  issueDescription: v.optional(v.string()),
  issueSeverity: v.optional(v.union(
    v.literal("blocker"),
    v.literal("major"),
    v.literal("minor")
  )),
  completedAt: v.optional(v.number()),
  completedBy: v.optional(v.id("users")),
})
.index("by_checklist", ["checklistId"])
.index("by_status", ["status"])
.index("by_assignee", ["assignedTo"]),
```

#### UI Design

**Checklist View**: Notion-style table with:
- Section grouping (collapsible)
- Status dropdown with color coding
- Assignee avatar picker
- Due date with overdue highlighting
- Document attachment slots
- Quick notes inline
- Red flag indicator for issues

**Progress Dashboard**:
- Circular progress by section
- Critical items prioritized
- Overdue items highlighted
- Assignee workload view

#### Success Criteria
- [ ] Create checklist from template in one click
- [ ] Assign items to team members
- [ ] Link documents from data room
- [ ] Track issues with severity
- [ ] Auto-calculate progress percentage
- [ ] Notify assignees of new/overdue items
- [ ] Export checklist to Excel/PDF

---

### 1.4 Email Integration

**Business Value**: Send documents, track communications, single source of truth

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Integration                         │
├─────────────────────────────────────────────────────────────┤
│  Microsoft Graph API (primary)                               │
│  ├── Send mail: POST /me/sendMail                           │
│  ├── Read mail: GET /me/messages                            │
│  └── Attachments: multipart/form-data                       │
├─────────────────────────────────────────────────────────────┤
│  Gmail API (secondary, future)                               │
│  ├── Send: POST /gmail/v1/users/me/messages/send            │
│  └── Read: GET /gmail/v1/users/me/messages                  │
├─────────────────────────────────────────────────────────────┤
│  Convex Tables                                               │
│  ├── deal_emails: Synced email threads                      │
│  ├── email_templates: Reusable templates                    │
│  └── email_tracking: Open/click tracking                    │
└─────────────────────────────────────────────────────────────┘
```

#### Email Templates

Pre-built templates for:
- NDA Request
- Data Room Invitation
- Deal Update to Client
- Meeting Request
- Follow-up after Management Meeting
- LOI Delivery
- Closing Documents

#### Success Criteria
- [ ] Send email from deal context
- [ ] Attach data room documents
- [ ] Use templates with merge fields
- [ ] Track email opens (pixel)
- [ ] Archive deal emails to timeline
- [ ] BCC to deal record automatically

---

## Phase 2: Intelligence & Automation (3-6 months)

> **Goal**: AI-powered insights, automated workflows, advanced analytics

### 2.1 Pipeline Analytics

**Features**:
- Stage conversion funnel
- Average time per stage
- Win/loss analysis
- Revenue pipeline forecast
- Deal source attribution
- Team performance metrics

**Tech Stack**:
- Recharts for visualizations
- Convex aggregation queries
- Date-fns for time calculations

---

### 2.2 Approval Workflows

**Use Cases**:
- Partner approval before sending Teaser
- Compliance review for client communications
- Multi-signature for LOI modifications

**Schema**:
```typescript
approval_workflows: defineTable({
  entityType: v.union(
    v.literal("document"),
    v.literal("loi"),
    v.literal("teaser"),
    v.literal("email")
  ),
  entityId: v.string(),
  dealId: v.id("deals"),
  requiredApprovers: v.array(v.id("users")),
  approvals: v.array(v.object({
    userId: v.id("users"),
    approved: v.boolean(),
    comment: v.optional(v.string()),
    timestamp: v.number(),
  })),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),
  createdBy: v.id("users"),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
}),
```

---

### 2.3 Calendar Sync (Microsoft + Google)

**Features**:
- Two-way sync with Outlook/Google
- Create meetings from deal context
- Auto-add deal participants
- Meeting notes linked to deal
- Availability checking

**Implementation**:
- Microsoft Graph Calendar API
- Google Calendar API
- Convex cron for periodic sync

---

### 2.4 AI Features (Vercel AI SDK)

**Document Generation**:
- Generate Teaser from company data
- Summarize long documents
- Extract key terms from contracts
- Translate documents (FR/EN)

**Deal Intelligence**:
- Similar deal recommendations
- Risk scoring based on DD findings
- Valuation range suggestions

**Tech Stack**:
```typescript
// Using Vercel AI SDK
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateTeaser(companyData: CompanyData) {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an M&A advisor writing a teaser for a company sale.
             Follow the standard teaser format: Investment Highlights,
             Company Overview, Financial Summary, Transaction Overview.`,
    prompt: `Generate a teaser for: ${JSON.stringify(companyData)}`,
  });
  return text;
}
```

---

### 2.5 Advanced Search

**Features**:
- Full-text search across all entities
- Filters by type, date, owner, status
- Saved searches
- Search within PDFs (OCR)

**Tech Stack Options**:
1. **Convex full-text search** (native)
2. **Algolia** (if scale requires)
3. **Vector search** for semantic queries

---

## Phase 3: Scale & Polish (6-12 months)

### 3.1 Mobile & Offline Support

**Approach**: Progressive Web App (PWA)

**Features**:
- Installable on mobile
- Offline document access
- Background sync when online
- Push notifications

**Tech Stack**:
- `next-pwa` for service worker
- IndexedDB for offline storage
- Workbox for caching strategies

---

### 3.2 Valuation Calculator UI

**Features**:
- DCF model builder
- Comparable company analysis
- Precedent transaction analysis
- Sensitivity tables
- Export to Excel/PowerPoint

**Implementation**:
- Connect to existing `valuation_models` table
- Import financials from Excel via Microsoft Graph
- Build interactive input forms
- Generate valuation summary document

---

### 3.3 Slack/Teams Integration

**Features**:
- Post deal updates to channels
- Receive notifications in Slack/Teams
- Quick actions from chat
- Deal summary bot commands

---

## 7. Technical Architecture

### Monorepo Structure

```
alepanel/
├── apps/
│   ├── colab/           # Colab Next.js app (port 3001)
│   └── website/         # Marketing + Admin (port 3000)
├── packages/
│   ├── ui/              # Shared UI components
│   │   ├── sidebar/     # Unified sidebar
│   │   ├── editor/      # Shared editor components
│   │   └── data-room/   # VDR components
│   ├── convex-client/   # Shared Convex hooks
│   └── types/           # Shared TypeScript types
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── colab/           # Colab-specific functions
│   ├── crm/             # CRM functions
│   ├── data-rooms/      # VDR functions
│   └── actions/         # External integrations
└── ...
```

### Key Dependencies

| Purpose | Package | Version |
|---------|---------|---------|
| Framework | Next.js | 15.x |
| Database | Convex | Latest |
| Auth | Clerk | Latest |
| AI | Vercel AI SDK | 4.x |
| Storage | Vercel Blob | Latest |
| Editor | TipTap | 2.x |
| CRDT | Yjs | 13.x |
| Charts | Recharts | 2.x |
| PDF | react-pdf | 9.x |
| Animations | Framer Motion | 12.x |

### Environment Variables

```bash
# Core
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_DOMAIN=

# Storage
BLOB_READ_WRITE_TOKEN=

# AI
OPENAI_API_KEY=

# Microsoft
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# Pipedrive
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=

# Feature Flags
NEXT_PUBLIC_ENABLE_DATA_ROOMS=true
NEXT_PUBLIC_ENABLE_COLLABORATIVE_EDITING=true
```

---

## 8. Success Metrics

### Phase 0 (Immediate)
- [ ] Single sidebar codebase
- [ ] <5% navigation confusion reports
- [ ] OAuth flows complete without errors
- [ ] 100% of team using unified navigation

### Phase 1 (0-3 months)
- [ ] 100% of deals use internal VDR (no Intralinks)
- [ ] <1 document version conflict per week
- [ ] 50% reduction in DD admin time
- [ ] Email tracking active for all deals

### Phase 2 (3-6 months)
- [ ] Pipeline analytics used weekly by partners
- [ ] 100% of external documents go through approval
- [ ] Calendar fully synced for all team members
- [ ] AI generates 80% of first-draft Teasers

### Phase 3 (6-12 months)
- [ ] Mobile app used by 50% of team
- [ ] Valuation models created in Colab (not Excel)
- [ ] Slack/Teams notifications reduce email by 30%

---

## Appendix: Quick Wins (Can Do This Week)

1. **Add "Colab"/"Panel" badge** to sidebar header
2. **Create OAuth callback routes** (empty shells)
3. **Add environment variable docs** to README
4. **Fix remaining duplicate components** (navigation/)
5. **Add Data Rooms link** to sidebar (placeholder page)

---

*Document maintained by the Alecia development team. For questions, contact engineering@alecia.markets*
