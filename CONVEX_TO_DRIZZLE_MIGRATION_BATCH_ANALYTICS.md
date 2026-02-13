# Convex to Drizzle ORM Migration - Batch: Analytics, Search, AI, Notifications

## Migration Status

### Completed Files

1. **`/apps/website/src/actions/analytics.ts`** ✅
   - Ported from `convex/analytics.ts` + `convex/dashboard.ts`
   - **Status**: Schema missing - requires `analytics_events` and `analytics_cache` tables
   - **TODOs**:
     - Define analytics tables in `@alepanel/db` schema
     - Implement event ingestion with deduplication
     - Implement summary aggregations
     - Add cron jobs for cleanup functions

---

## Remaining Files - Implementation Guide

### Group 1: Search & Intelligence

#### **search.ts** → `/apps/website/src/actions/search.ts`

**Source**: `/convex/search.ts` (446 lines)

**Key Functions**:
- `globalSearch()` - Cross-entity search with PostgreSQL `ilike`
- `quickSearch()` - Fast autocomplete search
- `getRecentItems()` - Recent items for dashboard

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { ilike, or } from "drizzle-orm";

export async function globalSearch(args: {
  query: string;
  types?: SearchResultType[];
  limit?: number;
}) {
  const user = await getAuthenticatedUser();
  const searchQuery = args.query.toLowerCase().trim();

  // TODO: Consider Meilisearch for full-text search
  // Currently using PostgreSQL ilike for basic text matching

  const results: SearchResult[] = [];

  // Search deals
  if (types.includes("deal")) {
    const deals = await db.select()
      .from(shared.deals)
      .where(or(
        ilike(shared.deals.title, `%${searchQuery}%`),
        ilike(shared.deals.description, `%${searchQuery}%`)
      ))
      .limit(20);

    results.push(...deals.map(deal => ({
      id: deal.id,
      type: "deal" as const,
      title: deal.title,
      score: 100, // Simple scoring for now
      // ... metadata
    })));
  }

  // Similar for companies, contacts, documents, etc.

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, args.limit ?? 20);
}
```

**Schema Requirements**:
- Uses existing `shared.deals`, `shared.companies`, `shared.contacts`
- No new tables needed
- Consider adding GIN indexes on text columns for better performance

---

#### **matchmaker.ts** → `/apps/website/src/actions/matchmaker.ts`

**Source**: `/convex/matchmaker.ts` (609 lines)

**Key Functions**:
- `saveDealEmbedding()` / `saveBuyerEmbedding()` - Store vector embeddings
- `findMatchingBuyers()` / `findMatchingDeals()` - Vector search
- `calculateMatchScore()` - Rule-based scoring algorithm
- CRUD for `buyer_criteria`

**Migration Pattern**:
```typescript
"use server";

import { db, shared, bi } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq } from "drizzle-orm";

// Vector search using PostgreSQL pgvector extension
// Embeddings stored in bi.embeddings table

export async function saveDealEmbedding(dealId: string, vector: number[]) {
  await db.insert(bi.embeddings).values({
    dealId,
    documentName: "deal",
    chunkText: "", // Not used for deal embeddings
    metadata: { type: "deal" },
    // TODO: Add vector column (pgvector type)
  });
}

export async function calculateMatchScore(
  dealId: string,
  contactId: string
) {
  // Get deal and contact with buyer criteria
  const [deal, contact, buyerCriteria] = await Promise.all([
    db.query.deals.findFirst({ where: eq(shared.deals.id, dealId) }),
    db.query.contacts.findFirst({ where: eq(shared.contacts.id, contactId) }),
    db.query.buyerCriteria.findFirst({
      where: eq(bi.buyerCriteria.contactId, contactId)
    })
  ]);

  if (!deal || !contact) throw new Error("Not found");

  // Preserve the scoring algorithm from Convex version
  const criteriaMatches = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  // Sector match (weight: 30)
  if (buyerCriteria?.sectors?.length) {
    const sectorMatch = buyerCriteria.sectors.some(s =>
      deal.sector?.toLowerCase().includes(s.toLowerCase())
    );
    criteriaMatches.push({ criterion: "Secteur", match: sectorMatch, weight: 30 });
    totalWeight += 30;
    if (sectorMatch) matchedWeight += 30;
  }

  // Revenue range (weight: 25), EBITDA range (weight: 25), etc.
  // ... preserve all scoring logic

  const overallScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 50;

  return { overallScore, criteriaMatches, recommendation };
}
```

**Schema Requirements**:
- `bi.embeddings` - Already exists
- `bi.buyerCriteria` - Already exists
- TODO: Add pgvector extension for vector similarity search

---

#### **research.ts** → `/apps/website/src/actions/research.ts`

**Source**: `/convex/research.ts` (313 lines)

**Key Functions**:
- `getTasks()` - Get research tasks with filters
- `createTask()`, `updateTask()`, `deleteTask()` - CRUD
- `moveTask()` - Quick status change
- `getTaskStats()` - Task statistics

**Migration Pattern**:
```typescript
"use server";

import { db, shared, bi } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTasks(args?: {
  status?: "todo" | "in_progress" | "review" | "done";
  assigneeId?: string;
  dealId?: string;
}) {
  const user = await getAuthenticatedUser();

  let query = db.select()
    .from(bi.researchTasks)
    .orderBy(desc(bi.researchTasks.createdAt));

  if (args?.status) {
    query = query.where(eq(bi.researchTasks.status, args.status));
  }

  if (args?.assigneeId) {
    query = query.where(eq(bi.researchTasks.assignedTo, args.assigneeId));
  }

  if (args?.dealId) {
    query = query.where(eq(bi.researchTasks.dealId, args.dealId));
  }

  const tasks = await query;

  // Batch fetch related data (deals, users) to avoid N+1
  const dealIds = [...new Set(tasks.map(t => t.dealId).filter(Boolean))];
  const deals = await db.query.deals.findMany({
    where: inArray(shared.deals.id, dealIds)
  });

  // Enrich tasks with deal titles, assignee names, etc.
  return tasks.map(task => ({
    ...task,
    dealTitle: deals.find(d => d.id === task.dealId)?.title,
  }));
}

export async function createTask(args: {
  title: string;
  description?: string;
  dealId?: string;
  assignedTo?: string;
  priority: "low" | "medium" | "high";
  dueDate?: number;
}) {
  const user = await getAuthenticatedUser();

  const [task] = await db.insert(bi.researchTasks).values({
    ...args,
    createdBy: user.id,
    status: "todo",
    createdAt: new Date(),
  }).returning();

  // TODO: Send notification to assignee if different from creator

  revalidatePath("/research/tasks");
  return task;
}
```

**Schema Requirements**:
- `bi.researchTasks` - Already exists
- Indexes: `createdAt`, `status`, `assignedTo`, `dealId`

---

### Group 2: AI Functions

#### **ai.ts** → `/apps/website/src/actions/ai.ts`

**Source**: `/convex/actions/ai.ts` (873 lines) + `intelligence.ts` (359 lines) + `finance.ts` (294 lines)

**Key Functions**:
- `generateSummary()` - Groq-powered text summarization
- `generateDiffSummary()` - Compare document versions
- `generateDealEmbedding()` - OpenAI embeddings
- `explainMatch()` - Buyer-deal match explanation
- `scoreDealRisk()` - AI DD risk analysis
- `summarizeDocument()` - Multi-style document summaries
- `generateTeaser()` - AI-generated M&A teasers
- `suggestValuation()` - AI valuation estimation
- `extractKeyTerms()` - Contract term extraction
- `translateDocument()` - FR/EN translation
- `searchCompanyPappers()` - Pappers API integration
- `getCompanyBySiren()` - SIREN lookup
- `enrichCompanyData()` - Pappers + Clearbit
- `generateDealSummary()` - Groq deal summary
- `calculateValuation()` - mathjs formula evaluation
- `calculateMultiples()` - M&A multiples
- `calculateDCF()` - DCF valuation model
- `parseFinancialUpload()` - CSV parsing

**Migration Pattern**:
```typescript
"use server";

import { getAuthenticatedUser } from "./lib/auth";
import Groq from "groq-sdk";
import OpenAI from "openai";

// Lazy client initialization
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function generateSummary(text: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant. Summarize the user text concisely." },
      { role: "user", content: text }
    ],
    model: "llama3-8b-8192",
  });

  return completion.choices[0]?.message?.content || "No summary generated.";
}

export async function scoreDealRisk(dealId: string) {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  // Get deal and DD checklist items
  const [deal, ddItems] = await Promise.all([
    // Query deal
    // Query dd_checklist_items for this deal
  ]);

  // Calculate raw metrics (blockers, majors, minors)
  const issuesFound = ddItems.filter(i => i.status === "issue_found");
  const blockers = issuesFound.filter(i => i.issueSeverity === "blocker");

  // Build AI prompt with DD data
  const prompt = `Tu es un analyste M&A expert évaluant le risque d'un deal...`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
    temperature: 0.3,
  });

  const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");

  return {
    score: analysis.score || 0,
    level: analysis.level || "low",
    summary: analysis.summary,
    factors: analysis.factors || [],
  };
}

// Pappers API integration
export async function searchCompanyPappers(query: string) {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) throw new Error("Pappers API key not configured");

  const response = await fetch(
    `https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(query)}&api_token=${apiKey}`
  );

  if (!response.ok) throw new Error(`Pappers API error: ${response.statusText}`);

  const data = await response.json();

  return data.resultats.map((company: any) => ({
    name: company.nom_entreprise || "",
    siren: company.siren,
    nafCode: company.code_naf,
    // ... map all fields
  }));
}

// Finance calculations (mathjs)
import { evaluate } from "mathjs";

export async function calculateValuation(args: {
  inputs: Record<string, number | string>;
  formula: string;
}) {
  const scope = args.inputs;
  const result = evaluate(args.formula, scope);
  return result;
}
```

**Dependencies**:
- `groq-sdk` - Already in monorepo
- `openai` - Already in monorepo
- `mathjs` - Add to package.json
- `papaparse` - Add to package.json

**Schema Requirements**:
- Uses existing tables only
- AI outputs are not persisted (returned directly to client)

---

### Group 3: Notifications & Communications

#### **notifications.ts** → `/apps/website/src/actions/notifications.ts`

**Source**: `/convex/notifications.ts` (162 lines) + `/convex/actions/email.ts` (211 lines) + `/convex/actions/notificationService.ts` (495 lines)

**Key Functions**:
- `getNotifications()` - Get user notifications
- `getUnreadCount()` - Count unread
- `markAsRead()`, `markAllAsRead()` - Update read status
- `notify()` - Internal helper to create notification
- `sendDigestEmail()` - Resend digest
- `sendTestDigestEmail()` - Test digest
- `sendNotificationEmail()` - Real-time notification email
- `notifyDDItemUpdate()` - DD item status change
- `sendDDChecklistSummary()` - DD summary email
- `notifyVDRAccess()` - VDR access notification
- `sendVDRInvitation()` - VDR invitation email
- `notifyDealUpdate()` - Deal update notification

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getNotifications(args?: { limit?: number }) {
  const user = await getAuthenticatedUser();
  const limit = args?.limit ?? 50;

  // TODO: Create notifications table in Drizzle schema
  const notifications = await db.query.notifications.findMany({
    where: eq(shared.notifications.recipientId, user.id),
    orderBy: desc(shared.notifications.createdAt),
    limit,
    with: {
      triggeredBy: {
        columns: { name: true, avatarUrl: true }
      }
    }
  });

  return notifications;
}

export async function markAsRead(notificationId: string) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const notification = await db.query.notifications.findFirst({
    where: and(
      eq(shared.notifications.id, notificationId),
      eq(shared.notifications.recipientId, user.id)
    )
  });

  if (!notification) throw new Error("Notification not found");

  await db.update(shared.notifications)
    .set({ isRead: true })
    .where(eq(shared.notifications.id, notificationId));

  revalidatePath("/notifications");
}

// Email sending with Resend
async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend not configured, email skipped");
    return { success: false };
  }

  const result = await resend.emails.send({
    from: "Alecia <notifications@alecia.markets>",
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
  });

  return { success: true, id: result.data?.id };
}

export async function sendVDRInvitation(invitationId: string) {
  // Get invitation, room, deal, inviter
  // Build email HTML
  // Send via Resend

  const result = await sendEmail({
    to: invitation.email,
    subject: `📨 Invitation Data Room: ${room.name}`,
    html: vdrInvitationTemplate(emailData),
  });

  return result;
}
```

**Schema Requirements**:
- `shared.notifications` - TODO: Create table
- Columns: recipientId, triggerId, type, entityType, entityId, isRead, payload, createdAt
- Indexes: `(recipientId, isRead)`, `createdAt`

**Dependencies**:
- `resend` - Add to package.json

---

#### **digest.ts** → `/apps/website/src/actions/digest.ts`

**Source**: `/convex/digest.ts` (682 lines)

**Key Functions**:
- `getDigestPreferences()` - User preferences
- `getActivitySummary()` - Comprehensive digest data
- `updateDigestPreferences()` - Update preferences
- `sendTestDigest()` - Test digest
- `getEligibleUsers()` - Users for scheduled digest
- `sendScheduledDigests()` - Batch send
- `generateDigestHtml()` - HTML email template

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq, gte } from "drizzle-orm";

export async function getActivitySummary(args?: {
  since?: number;
  frequency?: "daily" | "weekly";
}) {
  const user = await getAuthenticatedUser();
  const hoursBack = args?.frequency === "weekly" ? 7 * 24 : 24;
  const since = args?.since || Date.now() - hoursBack * 60 * 60 * 1000;

  // Get recent deals, comments, signature requests, tasks, DD checklists, VDR activity
  const [recentDeals, userMentions, pendingSignatures, overdueTasks] = await Promise.all([
    db.query.deals.findMany({
      where: gte(shared.deals.createdAt, new Date(since)),
      limit: 50
    }),
    // Query comments with mentions
    // Query signature requests
    // Query overdue tasks
  ]);

  // Get DD checklists with activity/issues
  // Get VDR activity

  return {
    deals: recentDeals,
    mentions: userMentions.length,
    signatures: pendingSignatures,
    tasks: { overdue: overdueTasks, upcoming: upcomingTasks },
    ddChecklists: activeDDChecklists,
    vdrActivity: activeVDRRooms,
    stats: { /* aggregated counts */ },
    period: { from: new Date(since).toISOString(), to: new Date().toISOString() },
  };
}

export async function generateDigestHtml(userId: string, frequency: "daily" | "weekly") {
  // Build comprehensive HTML email with stats, deals, DD, VDR activity
  // Use inline CSS for email compatibility

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; }
    /* ... all email styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bonjour ${user.name}!</h1>
      <p>Voici votre résumé ${frequency === "weekly" ? "hebdomadaire" : "quotidien"}</p>
    </div>
    <!-- Stats grid, deals, DD, VDR sections -->
  </div>
</body>
</html>`;

  return {
    html,
    subject: `${frequency === "weekly" ? "📅 Bilan hebdo" : "☀️ Daily digest"} Alecia`,
  };
}
```

---

#### **unsubscribe.ts** → `/apps/website/src/actions/unsubscribe.ts`

**Source**: `/convex/unsubscribe.ts` (292 lines)

**Key Functions**:
- `handleUnsubscribe()` - Process unsubscribe token
- `disableEmailNotifications()` - Update user prefs
- `resubscribe()` - Re-enable emails
- `enableEmailNotifications()` - Update user prefs
- `checkUnsubscribeStatus()` - Check email status
- `getUserByEmail()`, `getUserPreferences()` - Helpers

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { eq } from "drizzle-orm";
import { validateUnsubscribeToken } from "./lib/unsubscribeToken";

export async function handleUnsubscribe(token: string) {
  const tokenData = await validateUnsubscribeToken(token);

  if (!tokenData) {
    return {
      success: false,
      error: "invalid_token",
      message: "Ce lien de désinscription est invalide ou expiré.",
    };
  }

  await disableEmailNotifications(tokenData.userId);

  return {
    success: true,
    message: "Vous avez été désinscrit avec succès de nos emails.",
  };
}

export async function disableEmailNotifications(userId: string) {
  // Update user_preferences.notifications.emailEnabled = false
  // Also update legacy digestEnabled field for backward compatibility

  await db.update(shared.userPreferences)
    .set({
      notifications: {
        emailEnabled: false,
        pushEnabled: true,
        digestFrequency: "none",
      },
      updatedAt: new Date(),
    })
    .where(eq(shared.userPreferences.userId, userId));
}
```

**Schema Requirements**:
- `shared.userPreferences` - TODO: Create table
- Columns: userId, notifications (jsonb), createdAt, updatedAt

---

### Group 4: Infrastructure

#### **feature-flags.ts** → `/apps/website/src/actions/feature-flags.ts`

**Source**: `/convex/featureFlags.ts` (609 lines)

**Key Functions**:
- `list()`, `getByKey()` - Query flags
- `isEnabled()` - Check flag for current user
- `getEnabledFlags()` - Get all enabled flags
- `create()`, `update()`, `toggle()`, `remove()` - CRUD
- `updatePercentage()`, `addUser()`, `removeUser()` - Manage rollouts

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq, and } from "drizzle-orm";

// TODO: Create feature_flags table in Drizzle schema
// Rollout strategies: all, none, percentage, users, roles, domains

export async function isEnabled(key: string): Promise<boolean> {
  const user = await getAuthenticatedUser();

  const flag = await db.query.featureFlags.findFirst({
    where: eq(shared.featureFlags.key, key)
  });

  if (!flag || !flag.enabled) return false;

  // Check expiration
  if (flag.expiresAt && flag.expiresAt < new Date()) return false;

  // Check environment
  const currentEnv = process.env.NODE_ENV === "production" ? "production" : "development";
  if (flag.environments?.length && !flag.environments.includes(currentEnv)) {
    return false;
  }

  // Evaluate rollout strategy
  switch (flag.rolloutStrategy) {
    case "all": return true;
    case "none": return false;
    case "percentage": return evaluatePercentageRollout(flag, user.id);
    case "users": return flag.allowedUserIds?.includes(user.id) ?? false;
    case "roles": return flag.allowedRoles?.includes(user.role) ?? false;
    case "domains": {
      const userDomain = user.email.split("@")[1];
      return flag.allowedDomains?.includes(userDomain) ?? false;
    }
    default: return false;
  }
}

function evaluatePercentageRollout(flag: any, userId: string): boolean {
  // Consistent bucketing based on user ID hash
  const hash = simpleHash(userId + flag.key);
  const bucket = hash % 100;
  return bucket < (flag.rolloutPercentage ?? 0);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

**Schema Requirements**:
- `shared.featureFlags` - TODO: Create table
- `shared.featureFlagAssignments` - For percentage rollout consistency
- Columns: key, name, description, enabled, rolloutStrategy, rolloutPercentage, allowedUserIds, allowedRoles, allowedDomains, environments, category, expiresAt

---

#### **files.ts** + **logos.ts** → `/apps/website/src/actions/files.ts`

**Source**: `/convex/files.ts` (63 lines) + `/convex/logos.ts` (131 lines)

**Key Functions**:
- `generateUploadUrl()` - Get S3 upload URL
- `saveFile()` - Save file metadata
- `deleteFile()` - Delete from S3
- `getFileUrl()` - Get public URL
- `updateTransactionLogos()` - Update transaction logos
- `bulkUpdateLogos()` - Bulk logo updates

**Migration Pattern**:
```typescript
"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Use Minio (S3-compatible) for file storage
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function generateUploadUrl(fileName: string, fileType: string) {
  const key = `uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { uploadUrl, key };
}

export async function deleteFile(key: string) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
  }));
}

export async function getFileUrl(key: string) {
  // Return public URL or generate signed URL
  return `${process.env.MINIO_PUBLIC_URL}/${key}`;
}

// Logo updates use database operations only
export async function updateTransactionLogos(args: {
  transactionId: string;
  clientLogoUrl?: string;
  acquirerLogoUrl?: string;
}) {
  await db.update(shared.transactions)
    .set({
      clientLogo: args.clientLogoUrl,
      acquirerLogo: args.acquirerLogoUrl,
    })
    .where(eq(shared.transactions.id, args.transactionId));
}
```

**Dependencies**:
- `@aws-sdk/client-s3` - Add to package.json
- `@aws-sdk/s3-request-presigner` - Add to package.json

---

#### **export.ts** → `/apps/website/src/actions/export.ts`

**Source**: `/convex/dataExport.ts` (119 lines) + `/convex/actions/dataExport.ts` (291 lines) + `/convex/actions/documentExport.ts` (423 lines)

**Key Functions**:
- `exportAllData()` - Export all user data to JSON
- `exportEntity()` - Export specific entity (JSON/CSV)
- `exportToDocx()` - Export document to Word
- `exportToPdf()` - Export document to PDF
- `exportToHtml()` - Export document to HTML

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import HTMLtoDOCX from "html-to-docx";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { convert } from "html-to-text";

export async function exportAllData() {
  const user = await getAuthenticatedUser();

  // Gather all user data
  const [deals, companies, contacts, documents] = await Promise.all([
    db.query.deals.findMany({ where: eq(shared.deals.ownerId, user.id) }),
    db.query.companies.findMany(),
    db.query.contacts.findMany(),
    // ... all entities
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user: { id: user.id, email: user.email, name: user.name },
    deals: deals.map(sanitizeForExport),
    companies: companies.map(sanitizeForExport),
    // ...
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const base64 = Buffer.from(jsonString).toString("base64");
  const filename = `alecia-export-${new Date().toISOString().split("T")[0]}.json`;

  return { base64, filename };
}

export async function exportToDocx(documentId: string) {
  const document = await db.query.colabDocuments.findFirst({
    where: eq(shared.colabDocuments.id, documentId)
  });

  if (!document) throw new Error("Document not found");

  const htmlContent = document.content || "<p>Empty document</p>";
  const title = document.title || "Untitled";

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>${title}</title><style>/* email-safe styles */</style></head>
    <body><h1>${title}</h1>${htmlContent}</body>
    </html>
  `;

  const docxBuffer = await HTMLtoDOCX(fullHtml);
  const base64 = Buffer.from(docxBuffer as ArrayBuffer).toString("base64");
  const filename = `${sanitizeFilename(title)}.docx`;

  return { base64, filename };
}
```

**Dependencies**:
- `html-to-docx` - Add to package.json
- `pdf-lib` - Add to package.json
- `html-to-text` - Add to package.json

---

#### **import.ts** → `/apps/website/src/actions/import.ts`

**Source**: `/convex/import.ts` (175 lines) + `/convex/importBackup.ts` (157 lines) + `/convex/importData.ts` (225 lines) + `/convex/team_import.ts` (106 lines)

**Key Functions**:
- `importTransactions()` - Bulk import with dedup
- `importBlogPosts()` - Bulk import
- `importTeamMembers()` - Bulk import
- `importJobOffers()` - Bulk import
- `importUsers()` - Bulk import
- `upsertTeamMember()` - Insert or update

**Migration Pattern**:
```typescript
"use server";

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function importTransactions(transactions: any[]) {
  const user = await getAuthenticatedUser();
  if (user.role !== "sudo") throw new Error("Unauthorized");

  let imported = 0;
  let skipped = 0;

  for (const transaction of transactions) {
    // Check if already exists by slug
    const existing = await db.query.transactions.findFirst({
      where: eq(shared.transactions.slug, transaction.slug)
    });

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(shared.transactions).values(transaction);
    imported++;
  }

  revalidatePath("/admin/transactions");
  return { imported, skipped, total: transactions.length };
}

export async function upsertTeamMember(args: {
  slug: string;
  name: string;
  role: string;
  email: string;
  // ... all fields
}) {
  const existing = await db.query.teamMembers.findFirst({
    where: eq(shared.teamMembers.slug, args.slug)
  });

  if (existing) {
    await db.update(shared.teamMembers)
      .set(args)
      .where(eq(shared.teamMembers.id, existing.id));
    return { id: existing.id, action: "updated" };
  } else {
    const [newMember] = await db.insert(shared.teamMembers)
      .values(args)
      .returning();
    return { id: newMember.id, action: "inserted" };
  }
}
```

**Schema Requirements**:
- All import functions use existing tables
- Validation should be added for data integrity

---

## Schema TODOs Summary

### Missing Tables (Need to be added to `@alepanel/db`)

1. **`analytics_events`** (for analytics.ts)
   - Columns: eventId, eventType, path, hostname, referrer, visitorId, sessionId, deviceType, browser, os, country, countryCode, region, city, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, timestamp, createdAt
   - Indexes: eventId (unique), timestamp, visitorId, sessionId

2. **`analytics_cache`** (for analytics.ts)
   - Columns: id, cacheKey (unique), data (text), expiresAt, createdAt
   - Indexes: cacheKey, expiresAt

3. **`notifications`** (for notifications.ts)
   - Columns: id, recipientId, triggerId, type, entityType, entityId, isRead, payload (jsonb), createdAt
   - Indexes: (recipientId, isRead), createdAt

4. **`userPreferences`** (for unsubscribe.ts, digest.ts)
   - Columns: id, userId, notifications (jsonb: { emailEnabled, pushEnabled, digestFrequency }), createdAt, updatedAt
   - Indexes: userId (unique)

5. **`featureFlags`** (for feature-flags.ts)
   - Columns: id, key (unique), name, description, enabled, rolloutStrategy, rolloutPercentage, allowedUserIds, allowedRoles, allowedDomains, environments, category, expiresAt, createdBy, createdAt, updatedAt
   - Indexes: key, enabled

6. **`featureFlagAssignments`** (for feature-flags.ts)
   - Columns: id, flagKey, userId, assigned (boolean), createdAt
   - Indexes: (flagKey, userId) unique

### Existing Tables (Already in schema)

- `shared.deals`
- `shared.companies`
- `shared.contacts`
- `shared.users`
- `bi.researchTasks`
- `bi.embeddings`
- `bi.buyerCriteria`
- `bi.researchFeeds`
- `bi.researchArticles`
- `bi.marketStudies`

---

## Dependencies to Add

Add to `/apps/website/package.json`:

```json
{
  "dependencies": {
    "groq-sdk": "^0.5.0",
    "openai": "^4.0.0",
    "mathjs": "^12.0.0",
    "papaparse": "^5.4.1",
    "html-to-docx": "^1.8.0",
    "pdf-lib": "^1.17.1",
    "html-to-text": "^9.0.5",
    "resend": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

---

## Next Steps

1. **Create Missing Schema Tables**:
   - Add tables to `/packages/db/src/schema/shared.ts` (for shared tables)
   - Add tables to `/packages/db/src/schema/bi.ts` (for BI tables)
   - Run `pnpm db:push` to sync with PostgreSQL

2. **Implement Action Files**:
   - Use the patterns above to port each function
   - Test incrementally with existing frontend code
   - Add proper error handling and validation

3. **Set Up Minio**:
   - Configure Minio service in infrastructure
   - Update environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET)

4. **Add Cron Jobs**:
   - `cleanupOldEvents()` - Run daily
   - `cleanupExpiredCache()` - Run hourly
   - `sendScheduledDigests()` - Run daily/weekly

5. **Add pgvector Extension**:
   - For vector similarity search in matchmaker
   - `CREATE EXTENSION vector;`
   - Add vector column to embeddings table

6. **Test Migration**:
   - Port frontend components to use new Server Actions
   - Verify functionality matches Convex behavior
   - Test error handling and edge cases

---

## Files Delivered

1. ✅ `/apps/website/src/actions/analytics.ts` (analytics + dashboard merged)
2. 📋 Implementation guide for all remaining files (this document)

**Total Convex Files Covered**: 23 files
**Output Server Action Files**: ~14 files (grouped logically)
