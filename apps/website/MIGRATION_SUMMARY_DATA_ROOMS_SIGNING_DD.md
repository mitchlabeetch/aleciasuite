# Data Rooms, Signing, and DD Checklists Migration Summary

## Files Ported (Convex → Next.js Server Actions)

### 1. `/apps/website/src/actions/data-rooms-public.ts`
**Source:** `/convex/dataRoomsPublic.ts`

Token-based public access to Virtual Data Rooms for external buyers and advisors.

**Key Functions:**
- `validateAccessToken(token)` - Validates invitation token and returns access details
- `getRoomPublic(token)` - Get room info for external user
- `listFoldersPublic(token)` - List accessible folders
- `listDocumentsPublic(token, folderId)` - List documents in a folder
- `listAllDocumentsPublic(token)` - List all documents in room
- `listQuestionsPublic(token)` - Get Q&A for the room
- `askQuestionPublic(token, question, documentId?)` - Ask a new question
- `logAccessPublic(token, action, documentId?)` - Log access events
- `downloadDocumentPublic(token, documentId)` - Download with watermark support

**Security:**
- No authentication required (token-based)
- Token expiry validation
- Role-based permissions (viewer cannot download)
- All access logged to `sign.dealRoomAccessLog`

**Schema Used:**
- `sign.dealRoomInvitations` - Token validation
- `sign.dealRooms` - Room metadata
- `sign.dealRoomFolders` - Folder structure
- `sign.dealRoomDocuments` - Document metadata
- `sign.dealRoomQuestions` - Q&A system
- `sign.dealRoomAccessLog` - Access audit trail

---

### 2. `/apps/website/src/actions/signing.ts`
**Source:** `/convex/signing.ts`

E-signature management with DocuSeal integration and audit trail tracking.

**Key Functions:**
- `getSignRequests(dealId?)` - List signature requests
- `getSignRequestsBySigner(signerEmail)` - Get requests for a specific signer
- `createSignRequest(data)` - Create new signature request
- `recordSignatureEvent(data)` - Record signing events (sent, signed, declined, etc.)
- `getSignatureAuditTrail(dealId)` - Get full audit trail for a deal
- `getDocumentSignatureTrail(documentId)` - Get audit trail for a document
- `handleDocuSealWebhook(payload)` - Process DocuSeal webhook events
- `getSignatureStats(dealId)` - Get signature statistics
- `getDealSigners(dealId)` - Get all signers for a deal

**DocuSeal Integration:**
- Webhook handler maps DocuSeal events to audit trail
- Tracks: sent, opened, signed, declined, expired, completed, voided
- Records IP address and signature hash

**Schema Used:**
- `sign.signingAuditTrail` - Complete signing history
- `shared.deals` - Deal verification

---

### 3. `/apps/website/src/actions/dd-checklists.ts`
**Source:** `/convex/ddChecklists.ts`

Due diligence checklist management for M&A transactions.

**Key Functions:**

**Checklists:**
- `listChecklists(dealId?)` - List checklists for a deal or all
- `getChecklist(id)` - Get checklist with all items
- `createChecklist(data)` - Create new checklist
- `updateChecklist(id, data)` - Update checklist metadata
- `deleteChecklist(id)` - Delete checklist and all items
- `recalculateProgress(id)` - Recalculate completion percentage

**Items:**
- `listItems(checklistId)` - Get all items in a checklist
- `getItem(id)` - Get single item
- `addItem(data)` - Add new item to checklist
- `updateItem(id, data)` - Update item (auto-tracks completion)
- `deleteItem(id)` - Delete item
- `bulkUpdateStatus(itemIds, isCompleted)` - Bulk complete/uncomplete items

**Statistics:**
- `getChecklistStats(id)` - Get completion statistics
- `getOverdueChecklists(dealId?)` - Find overdue checklists
- `getDealChecklistSummary(dealId)` - Overall DD progress for a deal
- `getItemsByAssignee(userId, dealId?)` - Get items assigned to a user

**Auto-tracking:**
- Progress percentage auto-calculated on item completion
- Status auto-updated (not_started → in_progress → complete)
- Completion timestamp and user tracked

**Schema Used:**
- `numbers.ddChecklists` - Checklist metadata
- `numbers.ddChecklistItems` - Individual checklist items
- `shared.deals` - Deal verification

---

### 4. `/apps/website/src/actions/dd-templates.ts`
**Source:** `/convex/ddTemplates.ts`

Pre-built DD checklist templates for quick deal setup.

**Key Functions:**
- `listTemplates()` - Get all available templates
- `getTemplate(category)` - Get specific template
- `createChecklistFromTemplate(dealId, category, name?)` - Create checklist from template
- `createStandardDDPackage(dealId)` - Create all standard DD checklists
- `findTemplateByName(name)` - Search template by name
- `getTemplateStats()` - Get template statistics

**Built-in Templates:**
1. **Legal DD** - 8 items (corporate, contracts, litigation)
2. **Financial DD** - 10 items (financials, revenue, working capital)
3. **Tax DD** - 5 items (returns, compliance, planning)
4. **HR DD** - 7 items (org chart, contracts, equity)
5. **IP DD** - 5 items (patents, trademarks, software)
6. **Commercial DD** - 6 items (customers, suppliers, sales)
7. **IT DD** - 5 items (infrastructure, security, compliance)
8. **Environmental DD** - 3 items (permits, audits, safety)
9. **Regulatory DD** - 3 items (antitrust, FDI, sector-specific)

**Note:** Templates are static constants (no DB storage). If you need user-created templates, add a `numbers.ddTemplates` table.

---

## Migration Notes

### Differences from Convex

1. **Authentication:**
   - Convex: `ctx.auth.getUserIdentity()` + `getAuthenticatedUser(ctx)`
   - Server Actions: `getAuthenticatedUser()` helper from `./lib/auth`

2. **Database Queries:**
   - Convex: `ctx.db.query().withIndex().collect()`
   - Drizzle: `db.query.tableName.findMany({ where, with })`

3. **Mutations:**
   - Convex: `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()`
   - Drizzle: `db.insert().values().returning()`, `db.update().set().where()`

4. **Relations:**
   - Convex: Manual batching with `batchGet()`
   - Drizzle: Built-in `with` relations

5. **Revalidation:**
   - Convex: Automatic reactive updates
   - Server Actions: Manual `revalidatePath()` calls

### Schema Mapping

**Convex → Drizzle:**
- `deal_rooms` → `sign.dealRooms`
- `deal_room_folders` → `sign.dealRoomFolders`
- `deal_room_documents` → `sign.dealRoomDocuments`
- `deal_room_access_log` → `sign.dealRoomAccessLog`
- `deal_room_questions` → `sign.dealRoomQuestions`
- `deal_room_invitations` → `sign.dealRoomInvitations`
- `signing_audit_trail` → `sign.signingAuditTrail`
- `dd_checklists` → `numbers.ddChecklists`
- `dd_checklist_items` → `numbers.ddChecklistItems`

### Missing from Original Convex

**dataRoomsPublic.ts:**
- PDF watermarking function (references `lib/pdfWatermark` which doesn't exist yet)
- Minio storage integration (references `ctx.storage` which is Convex-specific)
- Internal queries/mutations (not needed in Server Actions)

**signing.ts:**
- Full DocuSeal API integration (webhook handler provided, but no outbound API calls)
- Email notifications for signature requests

**ddChecklists.ts:**
- Template seeding (moved to `dd-templates.ts` as static data)
- Some Convex-specific batch operations

---

## Usage Examples

### 1. Public Data Room Access (External Buyers)

```typescript
// Validate invitation token
const result = await validateAccessToken(token);
if (result.valid) {
  // Get room folders
  const folders = await listFoldersPublic(token);

  // Get documents in a folder
  const docs = await listDocumentsPublic(token, folderId);

  // Log view access
  await logAccessPublic(token, "view", documentId);

  // Download (if not viewer)
  const download = await downloadDocumentPublic(token, documentId);
}
```

### 2. E-Signature Workflow

```typescript
// Create signature request
const request = await createSignRequest({
  dealId: deal.id,
  signerEmail: "buyer@example.com",
  signerName: "John Buyer",
  title: "NDA Signature Request",
  expiresInDays: 7,
});

// Record signing event
await recordSignatureEvent({
  dealId: deal.id,
  signerEmail: "buyer@example.com",
  signerName: "John Buyer",
  action: "signed",
  signatureHash: "sha256...",
});

// Get stats
const stats = await getSignatureStats(deal.id);
// { total: 5, signed: 3, pending: 2, ... }
```

### 3. DD Checklist Management

```typescript
// Create from template
const checklist = await createChecklistFromTemplate(
  dealId,
  "financial",
  "Q4 2024 Financial DD"
);

// Or create standard package
const checklists = await createStandardDDPackage(dealId);

// Add custom item
await addItem({
  checklistId: checklist.id,
  label: "Verify Q3 revenue adjustments",
  notes: "Check accruals and deferrals",
  sortOrder: 100,
});

// Mark items complete
await updateItem(itemId, { isCompleted: true });

// Bulk complete
await bulkUpdateStatus([id1, id2, id3], true);

// Get progress
const stats = await getChecklistStats(checklist.id);
// { total: 15, completed: 8, pending: 7 }
```

---

## Next Steps

1. **Minio Integration:**
   - Add pre-signed URL generation for document downloads
   - Implement PDF watermarking (references missing `lib/pdfWatermark`)

2. **DocuSeal Integration:**
   - Add outbound API calls to create signature requests
   - Set up webhook endpoint to call `handleDocuSealWebhook()`

3. **Email Notifications:**
   - Send invitation emails for data room access
   - Send signature request emails
   - Send DD checklist assignment notifications

4. **Frontend Integration:**
   - Create React components that call these Server Actions
   - Add optimistic updates with `useOptimistic()`
   - Add loading states with `useFormStatus()`

5. **Testing:**
   - Test token expiry handling
   - Test access control (viewer vs contributor vs admin)
   - Test checklist progress calculation
   - Test signature audit trail

---

## File Locations

```
apps/website/src/actions/
├── data-rooms.ts              # Authenticated data room management (already existed)
├── data-rooms-public.ts       # NEW: Public token-based access
├── signing.ts                 # NEW: E-signature management
├── dd-checklists.ts          # NEW: DD checklist CRUD
├── dd-templates.ts           # NEW: DD templates
└── lib/
    └── auth.ts               # Shared auth helper (already existed)
```

All files follow the same pattern:
1. Start with `"use server";`
2. Import from `@alepanel/db`
3. Use `getAuthenticatedUser()` (except public routes)
4. Call `revalidatePath()` after mutations
5. Export TypeScript interfaces for type safety
