# Colab Migration - Completion Checklist

## ✅ Completed (Phase 1)

- [x] Port boards.ts (42 functions) - Kanban system
- [x] Port documents.ts (7 functions) - Document CRUD
- [x] Port document-versions.ts (5 functions) - Version history
- [x] Port presentations.ts (5 functions) - Presentation management
- [x] Port presence.ts (4 functions) - User presence
- [x] Create placeholder files.ts (5 functions, needs Minio)
- [x] Create placeholder property-definitions.ts (6 functions, needs table)
- [x] Create placeholder yjs.ts (9 functions, 4 working, 5 need tables)
- [x] Create index.ts with all exports
- [x] Create comprehensive README.md

## 🔨 TODO (Phase 2) - Schema Additions

### High Priority

- [ ] **Add colab.files table** to `/packages/db/src/schema/colab.ts`:
  ```typescript
  export const files = aleciaColab.table("files", {
    id: uuid("id").primaryKey().defaultRandom(),
    fileKey: text("file_key").notNull(), // Minio object key
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    size: integer("size").notNull(),
    folderId: uuid("folder_id"), // optional folder organization
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
  ```

- [ ] **Add colab.propertyDefinitions table**:
  ```typescript
  export const propertyDefinitions = aleciaColab.table("property_definitions", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox'
    options: jsonb("options").default([]), // for select/multiselect
    order: integer("order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
  ```

- [ ] **Create migration file**: `/infrastructure/postgres/migrations/V005__colab_files_and_properties.sql`

### Medium Priority (for full Hocuspocus support)

- [ ] **Add colab.yjsUpdates table**:
  ```typescript
  export const yjsUpdates = aleciaColab.table("yjs_updates", {
    id: uuid("id").primaryKey().defaultRandom(),
    documentName: text("document_name").notNull(),
    update: bytea("update").notNull(),
    version: integer("version").notNull(),
    clientId: text("client_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
  ```

- [ ] **Add colab.yjsAwareness table**:
  ```typescript
  export const yjsAwareness = aleciaColab.table("yjs_awareness", {
    id: uuid("id").primaryKey().defaultRandom(),
    documentName: text("document_name").notNull(),
    clientId: text("client_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    userName: text("user_name"),
    userColor: text("user_color"),
    cursor: jsonb("cursor"),
    lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow(),
  });
  ```

- [ ] **Add indexes** for Yjs performance:
  ```sql
  CREATE INDEX idx_yjs_updates_document_version ON alecia_colab.yjs_updates(document_name, version);
  CREATE INDEX idx_yjs_awareness_document_client ON alecia_colab.yjs_awareness(document_name, client_id);
  CREATE INDEX idx_yjs_awareness_last_seen ON alecia_colab.yjs_awareness(last_seen);
  ```

### Low Priority (enhancements)

- [ ] **Add colab.cardActivities table** (for audit trail):
  ```typescript
  export const cardActivities = aleciaColab.table("card_activities", {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  });
  ```

- [ ] **Create comments.ts** server actions (table already exists)

- [ ] **Add folders table** for file organization

## 🔧 TODO (Phase 3) - Minio Integration

- [ ] **Install Minio client**:
  ```bash
  pnpm add minio
  ```

- [ ] **Create Minio utility** at `/packages/storage/src/minio.ts`:
  ```typescript
  import * as Minio from 'minio';

  export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });

  export const BUCKET_NAME = 'alecia-colab-files';
  ```

- [ ] **Implement generateUploadUrl** in files.ts:
  ```typescript
  const fileKey = `${user.id}/${Date.now()}-${fileName}`;
  const uploadUrl = await minioClient.presignedPutObject(
    BUCKET_NAME,
    fileKey,
    3600 // 1 hour expiry
  );
  ```

- [ ] **Implement getFileUrl** for signed download URLs

- [ ] **Implement deleteFile** with Minio cleanup

## 🧪 TODO (Phase 4) - Testing & Validation

- [ ] Add Zod validation schemas for all action arguments
- [ ] Add error handling tests
- [ ] Add permission/authorization tests
- [ ] Test drag-and-drop reordering edge cases
- [ ] Test concurrent edits (Yjs sync)
- [ ] Load test presence heartbeat system

## 📚 TODO (Phase 5) - Documentation

- [ ] Create API documentation for all actions
- [ ] Add JSDoc comments with examples
- [ ] Create integration guide for React components
- [ ] Document Hocuspocus setup for Yjs sync
- [ ] Create migration guide from Convex to Server Actions

## 🔐 TODO (Phase 6) - Security Enhancements

- [ ] Implement workspace/team sharing permissions
- [ ] Add deal-based access control
- [ ] Implement role-based permissions (viewer, editor, admin)
- [ ] Add rate limiting for mutations
- [ ] Sanitize JSONB content before storage
- [ ] Add audit logging for sensitive operations

## 📊 TODO (Phase 7) - Performance

- [ ] Add database indexes:
  ```sql
  CREATE INDEX idx_boards_owner ON alecia_colab.boards(owner_id);
  CREATE INDEX idx_lists_board ON alecia_colab.lists(board_id);
  CREATE INDEX idx_cards_list ON alecia_colab.cards(list_id);
  CREATE INDEX idx_documents_owner ON alecia_colab.documents(owner_id);
  CREATE INDEX idx_presence_document_lastseen ON alecia_colab.presence(document_name, last_seen_at);
  ```

- [ ] Implement database transactions for multi-step operations
- [ ] Add connection pooling configuration
- [ ] Set up query performance monitoring
- [ ] Optimize getBoard query (reduce N+1)

## 🚀 TODO (Phase 8) - Deployment

- [ ] Set up production PostgreSQL connection
- [ ] Configure Minio/S3 bucket with CORS
- [ ] Set up Hocuspocus WebSocket server
- [ ] Configure environment variables
- [ ] Run migrations on production
- [ ] Set up monitoring and alerts

---

## Quick Start Guide

### 1. Complete Schema (do this first)
```bash
cd /Users/utilisateur/Desktop/alepanel/packages/db
# Edit src/schema/colab.ts to add missing tables
# Create migration file in /infrastructure/postgres/migrations/
# Run: pnpm db:migrate
```

### 2. Test Existing Functions
```typescript
// In a Next.js page or API route
import { createBoard, listBoards } from "@/actions/colab";

const boardId = await createBoard({
  name: "Test Board",
  visibility: "private"
});

const boards = await listBoards();
console.log(boards); // Should show your new board
```

### 3. Implement Minio (files only)
```bash
pnpm add minio
# Create /packages/storage package
# Update files.ts with Minio integration
```

### 4. Set up Hocuspocus (real-time sync)
```bash
# In services/hocuspocus directory
pnpm add @hocuspocus/server @hocuspocus/extension-database
# Configure to use yjs.ts actions as backend
```

---

## Migration Priority Order

**Week 1**: Schema additions (files, propertyDefinitions)
**Week 2**: Minio integration + test file uploads
**Week 3**: Yjs tables + Hocuspocus setup
**Week 4**: Testing + permission system
**Week 5**: Performance optimization + deployment

---

## Breaking Changes from Convex

1. **IDs**: UUIDs instead of Convex's auto-generated IDs
2. **Timestamps**: JavaScript Date objects instead of Unix milliseconds
3. **No real-time subscriptions**: Use React Query or SWR for polling
4. **Manual revalidation**: Must call revalidatePath() after mutations
5. **File storage**: Minio/S3 instead of Convex storage

---

## Support Needed

If you need help with:
- **Schema design**: See example tables above
- **Minio setup**: Check infrastructure/minio/docker-compose.yml
- **Hocuspocus**: See services/hocuspocus/README.md
- **Permissions**: Implement in getAuthenticatedUser() helper
