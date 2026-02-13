# Colab App Migration Guide: Clerk+Convex → BetterAuth+Server Actions

## Migration Status

### ✅ Completed
1. **CollaborativeEditor.tsx** - Partially migrated (imports updated, needs completion)

### 🔄 Pending Migration

#### Editor Components (3 files)
2. **DocumentEditor.tsx**
3. **extensions/KanbanComponent.tsx**

#### Presentation Components (4 files)
4. **PresentationDashboard.tsx**
5. **PresentationGenerator.tsx**
6. **PresentationList.tsx**
7. **SlideEditor.tsx**

#### Kanban Components (3 files)
8. **kanban/Board.tsx**
9. **kanban/CardModal.tsx**
10. **kanban/TimelineView.tsx**

#### Deal Pipeline Components (4 files)
11. **deal-pipeline/index.tsx**
12. **deal-pipeline/PropertyEditor.tsx**
13. **deal-flow/DealFlowCanvas.tsx**
14. **tailwind/deal-pipeline.tsx**

#### Other Components (8 files)
15. **presence/LiveCursors.tsx**
16. **command-menu.tsx**
17. **ui/fancy/SidebarTree.tsx**
18. **ui/fancy/FileUpload.tsx**
19. **recent-files/RecentFiles.tsx**
20. **version-history/VersionHistorySidebar.tsx**
21. **tailwind/advanced-editor.tsx**
22. **tailwind/export-to-blog-modal.tsx**

---

## Migration Patterns Reference

### 1. Authentication Migration

```typescript
// ❌ OLD (Clerk)
import { useUser } from "@clerk/nextjs";
const { user } = useUser();
const userId = user?.id;
const userName = user?.fullName || user?.firstName;

// ✅ NEW (BetterAuth)
import { useSession } from "@alepanel/auth/client";
const { data: session, isPending } = useSession();
const user = session?.user;
const userId = user?.id;
const userName = user?.name;
```

### 2. Data Fetching Migration

#### Simple useQuery Pattern
```typescript
// ❌ OLD (Convex)
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
const data = useQuery(api.xxx.yyy, args);

// ✅ NEW (Server Actions + useState)
import { useState, useEffect } from "react";
import { fetchXxx } from "@/actions/colab/xxx";

const [data, setData] = useState<any>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchXxx(args)
    .then(setData)
    .finally(() => setIsLoading(false));
}, [/* deps */]);
```

#### useQuery with "skip" Pattern
```typescript
// ❌ OLD
const data = useQuery(api.xxx, condition ? { id } : "skip");

// ✅ NEW
const [data, setData] = useState<any>(null);
useEffect(() => {
  if (!condition) return;
  fetchXxx({ id }).then(setData);
}, [condition, id]);
```

### 3. Mutations Migration

```typescript
// ❌ OLD (Convex)
import { useMutation } from "convex/react";
const doSomething = useMutation(api.xxx.zzz);

await doSomething({ ...args });

// ✅ NEW (Server Actions)
import { doSomething } from "@/actions/colab/xxx";

await doSomething({ ...args });
// Re-fetch if needed
const updated = await fetchXxx(args);
setData(updated);
```

### 4. Type Changes

```typescript
// ❌ OLD
import type { Id } from "@/convex/_generated/dataModel";
interface Props {
  documentId: Id<"colab_documents">;
}

// ✅ NEW
interface Props {
  documentId: string;
}
```

---

## Available Server Actions by Module

### Documents (`@/actions/colab/documents`)
- `listDocuments(args?: { userId?: string; isArchived?: boolean })`
- `getDocument({ id: string })`
- `createDocument({ title: string; content?: any; userId?: string; dealId?: string })`
- `updateDocument({ id: string; title?: string; content?: any; isArchived?: boolean })`
- `archiveDocument({ id: string })`
- `deleteDocument({ id: string })`
- `getDocumentsByDeal({ dealId: string })`

### Boards (`@/actions/colab/boards`)
- `listBoards(args?: { userId?: string })`
- `getBoard({ id: string })`
- `createBoard({ name: string; description?: string; userId?: string; dealId?: string })`
- `updateBoard({ id: string; name?: string; description?: string })`
- `deleteBoard({ id: string })`
- `getBoardCards({ boardId: string })`
- `createCard({ listId: string; title: string; description?: string; ... })`
- `updateCard({ id: string; title?: string; ... })`
- `deleteCard({ id: string })`
- `createList({ boardId: string; name: string; index: number })`
- `updateList({ id: string; name?: string; index?: number })`
- `deleteList({ id: string })`

### Presentations (`@/actions/colab/presentations`)
- `listPresentations(args?: { userId?: string })`
- `getPresentation({ id: string })`
- `createPresentation({ title: string; slides?: any[]; userId?: string; dealId?: string })`
- `updatePresentation({ id: string; title?: string; slides?: any[] })`
- `deletePresentation({ id: string })`

### Presence (`@/actions/colab/presence`)
- `heartbeat({ resourceType: string; resourceId: string; userId: string; userName?: string; userColor?: string; cursorPosition?: { x: number; y: number } })`
- `getActiveUsers({ resourceType: string; resourceId: string })`
- `leaveDocument({ resourceType: string; resourceId: string; userId: string })`

### Yjs Sync (`@/actions/colab/yjs`)
- `getYjsState({ documentId: string })`
- `saveYjsState({ documentId: string; state: Uint8Array })`
- `getYjsUpdates({ documentId: string; fromVersion?: number })`
- `pushYjsUpdate({ documentId: string; update: Uint8Array })`
- `getYjsAwareness({ documentId: string })`
- `updateYjsAwareness({ documentId: string; clientId: string; state: any })`
- `removeYjsAwareness({ documentId: string; clientId: string })`

### Files (`@/actions/colab/files`)
- `saveFile({ storageId: string; fileName: string; fileType: string; size: number; folderId?: string })`
- `listFiles(args?: { folderId?: string })`
- `deleteFile({ id: string })`

### Document Versions (`@/actions/colab/document-versions`)
- `listVersions({ documentId: string })`
- `getVersion({ id: string })`
- `createVersion({ documentId: string; content: string; changeDescription?: string; createdBy?: string })`
- `restoreVersion({ documentId: string; versionNumber: number })`

### Deals (`@/actions/deals`)
- `listDeals(args?: { stage?: string })`
- `getDeal({ id: string })`
- `updateDeal({ id: string; ... })`
- `createDeal({ title: string; stage: string; amount?: number; leadName?: string })`

---

## Step-by-Step Migration Process

### For Each Component File:

1. **Read the file completely** to understand data dependencies
2. **Update imports:**
   - Remove: `@clerk/nextjs`, `convex/react`, `@/convex/_generated/*`
   - Add: `@alepanel/auth/client`, server action imports, `useState`, `useEffect`
3. **Replace authentication:**
   - `useUser()` → `useSession()`
   - `user?.fullName` → `user?.name`
4. **Replace data fetching:**
   - `useQuery` → `useState` + `useEffect` + server action
   - Handle loading states explicitly
5. **Replace mutations:**
   - `useMutation(api.xxx)` → direct server action import
   - Add manual re-fetch after mutations if needed
6. **Update types:**
   - `Id<"xxx">` → `string`
7. **Keep all UI/UX logic intact:**
   - Styling, animations, component structure
   - Event handlers, state management
8. **Test the component** after migration

---

## Special Cases

### Components Using Presence Hooks
Keep imports like `@/hooks/use-presence` and `@/hooks/use-yjs-sync` - these are being migrated internally to use server actions.

### Components Using File Uploads
If using `@vercel/blob`, replace with TODO placeholder that throws an error (as instructed).

### Components Using Convex Actions
```typescript
// ❌ OLD
import { useAction } from "convex/react";
const exportToPdf = useAction(api.actions.documentExport.exportToPdf);

// ✅ NEW
import { exportDocumentToPdf } from "@/actions/colab/exports";
// Use directly as async function
```

---

## Migration Checklist for Each File

- [ ] Read entire file first
- [ ] Update imports (remove Clerk/Convex, add BetterAuth/actions)
- [ ] Replace `useUser()` with `useSession()`
- [ ] Replace all `useQuery` with `useState` + `useEffect` + server action
- [ ] Replace all `useMutation` with direct server action calls
- [ ] Replace `Id<"xxx">` types with `string`
- [ ] Keep all UI/UX/styling intact
- [ ] Keep "use client" directive if present
- [ ] Test component functionality

---

## Common Pitfalls to Avoid

1. **Don't change component props** unless absolutely necessary
2. **Don't remove UI logic** (animations, styles, interactions)
3. **Don't skip loading states** - add explicit `isLoading` states
4. **Don't forget dependencies** in `useEffect` arrays
5. **Don't forget to re-fetch** after mutations if data needs to update

---

## Example: Complete Migration

### Before (Clerk + Convex)
```typescript
"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  documentId: Id<"colab_documents">;
}

export function MyComponent({ documentId }: Props) {
  const { user } = useUser();
  const document = useQuery(api.colab.documents.get, { id: documentId });
  const updateDoc = useMutation(api.colab.documents.update);

  const handleSave = async () => {
    await updateDoc({ id: documentId, title: "New Title" });
  };

  if (!document) return <div>Loading...</div>;

  return <div>{document.title}</div>;
}
```

### After (BetterAuth + Server Actions)
```typescript
"use client";
import { useSession } from "@alepanel/auth/client";
import { useState, useEffect } from "react";
import { getDocument, updateDocument } from "@/actions/colab/documents";

interface Props {
  documentId: string;
}

export function MyComponent({ documentId }: Props) {
  const { data: session, isPending } = useSession();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDocument({ id: documentId })
      .then(setDocument)
      .finally(() => setIsLoading(false));
  }, [documentId]);

  const handleSave = async () => {
    await updateDocument({ id: documentId, title: "New Title" });
    // Re-fetch
    const updated = await getDocument({ id: documentId });
    setDocument(updated);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!document) return <div>Not found</div>;

  return <div>{document.title}</div>;
}
```

---

## Priority Order for Migration

### High Priority (Core Functionality)
1. DocumentEditor.tsx
2. Board.tsx
3. PresentationDashboard.tsx
4. command-menu.tsx

### Medium Priority (Features)
5. CardModal.tsx
6. TimelineView.tsx
7. PresentationList.tsx
8. SlideEditor.tsx
9. PropertyEditor.tsx

### Lower Priority (UI Enhancements)
10-22. Remaining components

---

## Testing After Migration

For each migrated component:
1. Check that authentication works (user data displays correctly)
2. Verify data fetching (lists, details load properly)
3. Test mutations (create, update, delete operations)
4. Confirm loading states display correctly
5. Ensure error handling works
6. Validate real-time features (presence, collaboration)

---

## Notes

- All server actions use the same pattern: async functions that return data or throw errors
- Error handling should be done with try/catch blocks
- Loading states must be managed explicitly (Convex did this automatically)
- The `use-yjs-sync` and `use-presence` hooks are being migrated internally to use server actions, so components using them can keep those imports
- Type safety: server actions return `unknown` - cast to appropriate types as needed

---

## Support

If you encounter migration issues:
1. Check the server action exists and matches the expected API
2. Verify import paths are correct
3. Ensure all dependencies are in useEffect arrays
4. Check that async/await is used correctly with server actions
5. Confirm types are properly cast from `unknown` to expected shapes
