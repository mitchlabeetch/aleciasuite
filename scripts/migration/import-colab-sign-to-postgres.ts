import { Pool } from "pg";
import { readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",
  password: process.env.POSTGRES_PASSWORD,
});

const idMapRaw = JSON.parse(readFileSync("scripts/migration/data/id-map.json", "utf-8"));
const idMap = new Map<string, string>(Object.entries(idMapRaw));

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

function loadJson(dir: string, file: string): any[] {
  try {
    return JSON.parse(readFileSync(`scripts/migration/data/${dir}/${file}.json`, "utf-8"));
  } catch {
    console.warn(`  ⚠ File not found: ${dir}/${file}.json`);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Phase 1: alecia_colab schema
// ──────────────────────────────────────────────────────────────────────────────

// 1. documents — FK: owner_id → users, deal_id → deals
async function importDocuments() {
  const items = loadJson("colab", "colab_documents");
  for (const d of items) {
    const pgId = mapId(d._id);
    const ownerId = d.ownerId || d.userId || d.createdBy;
    const ownerUuid = ownerId ? mapId(ownerId) : null;
    const dealId = d.dealId ? mapId(d.dealId) : null;
    const parentId = d.parentId ? mapId(d.parentId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.documents (id, title, content, parent_id, owner_id, deal_id, icon, cover_image_url, is_template, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        d.title || "Untitled",
        JSON.stringify(d.content || {}),
        parentId,
        ownerUuid,
        dealId,
        d.icon,
        d.coverImageUrl || d.coverImage,
        d.isTemplate || false,
        d.isArchived || false,
        new Date(d._creationTime),
        d.updatedAt ? new Date(d.updatedAt) : new Date(d._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} documents`);
}

// 2. document_versions — FK: document_id → documents, edited_by → users
async function importDocumentVersions() {
  const items = loadJson("colab", "colab_document_versions");
  for (const v of items) {
    const pgId = mapId(v._id);
    const documentId = v.documentId ? mapId(v.documentId) : null;
    const editedBy = v.editedBy || v.userId;
    const editorUuid = editedBy ? mapId(editedBy) : null;
    if (!documentId || !editorUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.document_versions (id, document_id, version, content, edited_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        documentId,
        v.version || 1,
        JSON.stringify(v.content || {}),
        editorUuid,
        new Date(v._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} document_versions`);
}

// 3. boards — FK: owner_id → users, deal_id → deals
async function importBoards() {
  const items = loadJson("colab", "colab_boards");
  for (const b of items) {
    const pgId = mapId(b._id);
    const ownerId = b.createdBy || b.ownerId;
    const ownerUuid = ownerId ? mapId(ownerId) : null;
    const dealId = b.dealId ? mapId(b.dealId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.boards (id, title, description, deal_id, owner_id, is_template, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        b.name || b.title || "Untitled Board",
        b.description,
        dealId,
        ownerUuid,
        b.isTemplate || false,
        new Date(b._creationTime),
        new Date(b._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} boards`);
}

// 4. lists — FK: board_id → boards
async function importLists() {
  const items = loadJson("colab", "colab_lists");
  for (const l of items) {
    const pgId = mapId(l._id);
    const boardId = l.boardId ? mapId(l.boardId) : null;
    if (!boardId) continue;
    await pool.query(
      `INSERT INTO alecia_colab.lists (id, board_id, title, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        boardId,
        l.name || l.title || "Untitled",
        l.index ?? l.sortOrder ?? 0,
        new Date(l._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} lists`);
}

// 5. labels — FK: board_id → boards
async function importLabels() {
  const items = loadJson("colab", "colab_labels");
  for (const l of items) {
    const pgId = mapId(l._id);
    const boardId = l.boardId ? mapId(l.boardId) : null;
    if (!boardId) continue;
    await pool.query(
      `INSERT INTO alecia_colab.labels (id, board_id, name, color, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        boardId,
        l.name,
        l.colorCode || l.color || "#666",
        new Date(l._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} labels`);
}

// 6. cards — FK: list_id → lists, assignee_id → users
async function importCards() {
  const items = loadJson("colab", "colab_cards");
  for (const c of items) {
    const pgId = mapId(c._id);
    const listId = c.listId ? mapId(c.listId) : null;
    const assigneeId = c.createdBy ? mapId(c.createdBy) : null;
    if (!listId) continue;
    await pool.query(
      `INSERT INTO alecia_colab.cards (id, list_id, title, description, assignee_id, due_date, labels, attachments, sort_order, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        listId,
        c.title || "Untitled",
        c.description,
        assigneeId,
        c.dueDate ? new Date(c.dueDate) : null,
        JSON.stringify(c.labelIds || []),
        JSON.stringify(c.attachments || []),
        c.index ?? c.sortOrder ?? 0,
        false,
        new Date(c._creationTime),
        c.updatedAt ? new Date(c.updatedAt) : new Date(c._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} cards`);
}

// 7. checklists — FK: card_id → cards
async function importChecklists() {
  const items = loadJson("colab", "colab_checklists");
  for (const c of items) {
    const pgId = mapId(c._id);
    const cardId = c.cardId ? mapId(c.cardId) : null;
    if (!cardId) continue;
    await pool.query(
      `INSERT INTO alecia_colab.checklists (id, card_id, title, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        cardId,
        c.name || c.title || "Checklist",
        c.index ?? c.sortOrder ?? 0,
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} checklists`);
}

// 8. checklist_items — FK: checklist_id → checklists
async function importChecklistItems() {
  const items = loadJson("colab", "colab_checklist_items");
  for (const i of items) {
    const pgId = mapId(i._id);
    const checklistId = i.checklistId ? mapId(i.checklistId) : null;
    if (!checklistId) continue;
    await pool.query(
      `INSERT INTO alecia_colab.checklist_items (id, checklist_id, label, is_completed, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        checklistId,
        i.label || i.text || "",
        i.isCompleted || false,
        i.index ?? i.sortOrder ?? 0,
        new Date(i._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} checklist_items`);
}

// 9. presentations — FK: owner_id → users, deal_id → deals
async function importPresentations() {
  const items = loadJson("colab", "colab_presentations");
  for (const p of items) {
    const pgId = mapId(p._id);
    const ownerId = p.userId || p.ownerId;
    const ownerUuid = ownerId ? mapId(ownerId) : null;
    const dealId = p.dealId ? mapId(p.dealId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.presentations (id, title, slides, deal_id, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        p.title || "Untitled",
        JSON.stringify(p.slides || []),
        dealId,
        ownerUuid,
        new Date(p._creationTime),
        p.updatedAt ? new Date(p.updatedAt) : new Date(p._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} presentations`);
}

// 10. comments — FK: author_id → users
async function importComments() {
  const items = loadJson("bi", "comments");
  for (const c of items) {
    const pgId = mapId(c._id);
    const authorId = c.authorId || c.userId;
    const authorUuid = authorId ? mapId(authorId) : null;
    if (!authorUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.comments (id, entity_type, entity_id, author_id, content, mentions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        c.entityType || c.type || "deal",
        c.entityId ? mapId(c.entityId) : mapId(c.targetId || c._id),
        authorUuid,
        c.content || c.text || "",
        c.mentions || [],
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} comments`);
}

// 11. yjs_state — Yjs CRDT binary state (special handling)
async function importYjsState() {
  const items = loadJson("colab", "colab_yjs_documents");
  for (const y of items) {
    // Yjs stores binary state as array of numbers
    const state = y.state ? Buffer.from(y.state) : null;
    if (!state) continue;
    const docName = y.documentName || y.documentId || y._id;
    await pool.query(
      `INSERT INTO alecia_colab.yjs_state (document_name, state, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_name) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at`,
      [
        docName,
        state,
        y.updatedAt ? new Date(y.updatedAt) : new Date(y._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} yjs_state entries`);
}

// 12. files — FK: document_id → documents, board_id → boards, owner_id → users
async function importFiles() {
  const items = loadJson("colab", "colab_files");
  for (const f of items) {
    const pgId = mapId(f._id);
    const documentId = f.documentId ? mapId(f.documentId) : null;
    const boardId = f.boardId ? mapId(f.boardId) : null;
    const ownerId = f.userId || f.ownerId;
    const ownerUuid = ownerId ? mapId(ownerId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.files (id, document_id, board_id, owner_id, filename, mime_type, file_size, minio_key, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        documentId,
        boardId,
        ownerUuid,
        f.filename || f.name || "file",
        f.mimeType || f.contentType,
        f.fileSize || f.size,
        f.storageId || f.minioKey || `legacy/${f._id}`,
        new Date(f._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} files`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Phase 2: alecia_sign schema
// ──────────────────────────────────────────────────────────────────────────────

// 1. deal_rooms — FK: deal_id → deals, created_by → users
async function importDealRooms() {
  const items = loadJson("sign", "deal_rooms");
  for (const r of items) {
    const pgId = mapId(r._id);
    const dealId = r.dealId ? mapId(r.dealId) : null;
    const createdBy = r.createdBy ? mapId(r.createdBy) : null;
    if (!dealId || !createdBy) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_rooms (id, deal_id, name, description, is_active, watermark_enabled, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        r.name || "Data Room",
        r.description,
        r.isActive !== false,
        r.watermarkEnabled !== false,
        createdBy,
        new Date(r._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_rooms`);
}

// 2. deal_room_folders — FK: room_id → deal_rooms
async function importDealRoomFolders() {
  const items = loadJson("sign", "deal_room_folders");
  for (const f of items) {
    const pgId = mapId(f._id);
    const roomId = f.roomId ? mapId(f.roomId) : null;
    const parentId = f.parentId ? mapId(f.parentId) : null;
    if (!roomId) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_room_folders (id, room_id, parent_id, name, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        roomId,
        parentId,
        f.name || "Folder",
        f.sortOrder ?? f.index ?? 0,
        new Date(f._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_room_folders`);
}

// 3. deal_room_documents — FK: folder_id → deal_room_folders, uploaded_by → users
async function importDealRoomDocuments() {
  const items = loadJson("sign", "deal_room_documents");
  for (const d of items) {
    const pgId = mapId(d._id);
    const folderId = d.folderId ? mapId(d.folderId) : null;
    const uploadedBy = d.uploadedBy || d.userId;
    const uploaderUuid = uploadedBy ? mapId(uploadedBy) : null;
    if (!folderId || !uploaderUuid) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_room_documents (id, folder_id, filename, mime_type, file_size, minio_key, version, uploaded_by, is_confidential, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        folderId,
        d.filename || d.name || "document",
        d.mimeType || d.contentType,
        d.fileSize || d.size,
        d.storageId || d.minioKey || `legacy/${d._id}`,
        d.version || 1,
        uploaderUuid,
        d.isConfidential || false,
        new Date(d._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_room_documents`);
}

// 4. deal_room_access_log — FK: room_id → deal_rooms, user_id → users, document_id → deal_room_documents
async function importDealRoomAccessLog() {
  const items = loadJson("sign", "deal_room_access_log");
  for (const a of items) {
    const pgId = mapId(a._id);
    const roomId = a.roomId ? mapId(a.roomId) : null;
    const userId = a.userId ? mapId(a.userId) : null;
    const documentId = a.documentId ? mapId(a.documentId) : null;
    if (!roomId) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_room_access_log (id, room_id, user_id, document_id, action, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        roomId,
        userId,
        documentId,
        a.action || "view",
        a.ipAddress,
        a.userAgent,
        new Date(a._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_room_access_log entries`);
}

// 5. deal_room_questions — FK: room_id → deal_rooms, asked_by → users, answered_by → users, document_id → deal_room_documents
async function importDealRoomQuestions() {
  const items = loadJson("sign", "deal_room_questions");
  for (const q of items) {
    const pgId = mapId(q._id);
    const roomId = q.roomId ? mapId(q.roomId) : null;
    const askedBy = q.askedBy ? mapId(q.askedBy) : null;
    const answeredBy = q.answeredBy ? mapId(q.answeredBy) : null;
    const documentId = q.documentId ? mapId(q.documentId) : null;
    if (!roomId || !askedBy) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_room_questions (id, room_id, document_id, asked_by, question, answer, answered_by, answered_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        roomId,
        documentId,
        askedBy,
        q.question || "",
        q.answer,
        answeredBy,
        q.answeredAt ? new Date(q.answeredAt) : null,
        q.status || "pending",
        new Date(q._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_room_questions`);
}

// 6. deal_room_invitations — FK: room_id → deal_rooms, invited_by → users
async function importDealRoomInvitations() {
  const items = loadJson("sign", "deal_room_invitations");
  for (const i of items) {
    const pgId = mapId(i._id);
    const roomId = i.roomId ? mapId(i.roomId) : null;
    const invitedBy = i.invitedBy ? mapId(i.invitedBy) : null;
    if (!roomId || !invitedBy) continue;
    await pool.query(
      `INSERT INTO alecia_sign.deal_room_invitations (id, room_id, email, role, token, invited_by, accepted_at, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        roomId,
        i.email || "",
        i.role || "viewer",
        i.token || uuidv4(),
        invitedBy,
        i.acceptedAt ? new Date(i.acceptedAt) : null,
        i.expiresAt ? new Date(i.expiresAt) : null,
        new Date(i._creationTime),
      ]
    );
  }
  console.log(`  ✓ Imported ${items.length} deal_room_invitations`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Alecia Colab + Sign Import to PostgreSQL ===\n");
  console.log("Loading ID map...");
  console.log(`  → ${idMap.size} existing mappings loaded\n`);

  // Phase 1: alecia_colab
  console.log("── Phase 1: alecia_colab schema ──");
  await importDocuments();
  await importDocumentVersions();
  await importBoards();
  await importLists();
  await importLabels();
  await importCards();
  await importChecklists();
  await importChecklistItems();
  await importPresentations();
  await importComments();
  await importYjsState();
  await importFiles();

  // Phase 2: alecia_sign
  console.log("\n── Phase 2: alecia_sign schema ──");
  await importDealRooms();
  await importDealRoomFolders();
  await importDealRoomDocuments();
  await importDealRoomAccessLog();
  await importDealRoomQuestions();
  await importDealRoomInvitations();

  // Save updated ID map
  writeFileSync(
    "scripts/migration/data/id-map.json",
    JSON.stringify(Object.fromEntries(idMap), null, 2)
  );
  console.log(`\n✓ ID map updated: ${idMap.size} total mappings`);

  console.log("\n=== Colab + Sign import complete ===");
  await pool.end();
}

main();
