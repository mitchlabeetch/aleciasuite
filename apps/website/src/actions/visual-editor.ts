"use server";

// Visual Website Editor Actions
// Ported from convex/visual_editor.ts
// Handles TipTap/ProseMirror content with approval workflow

import { db, shared, eq, desc, sql, and } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

interface PageContent {
  id: string;
  path: string;
  locale: string;
  sections: unknown;
  theme?: unknown;
  version: number;
  publishedAt?: number;
  publishedBy?: string;
  createdAt: number;
  updatedAt: number;
}

interface PendingChange {
  id: string;
  pageContentId: string;
  pagePath: string;
  pageLocale: string;
  changedBy: string;
  changedByName: string;
  changeType: string;
  description?: string;
  visualDiff: {
    before: string;
    after: string;
    changesSummary: string[];
  };
  codeDiff: {
    before: unknown;
    after: unknown;
    delta?: unknown;
  };
  status: "pending" | "approved" | "rejected" | "cancelled";
  requiredApprovals: number;
  approvedAt?: number;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface ChangeApproval {
  id: string;
  changeId: string;
  userId: string;
  userName: string;
  approved: boolean;
  comment?: string;
  createdAt: number;
}

interface PageVersion {
  id: string;
  pageContentId: string;
  pagePath: string;
  version: number;
  sections: unknown;
  theme?: unknown;
  publishedBy: string;
  publishedByName: string;
  publishedAt: number;
  changeDescription?: string;
}

// ============================================
// QUERIES
// ============================================

export async function getEditablePages(locale?: string) {
  const conditions = locale
    ? [eq(shared.pageContent.locale, locale)]
    : [];

  const pages = await db
    .select({
      id: shared.pageContent.id,
      path: shared.pageContent.path,
      locale: shared.pageContent.locale,
      version: shared.pageContent.version,
      publishedAt: shared.pageContent.publishedAt,
      updatedAt: shared.pageContent.updatedAt,
    })
    .from(shared.pageContent)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return pages;
}

export async function getPageContent(path: string, locale: string) {
  const [page] = await db
    .select()
    .from(shared.pageContent)
    .where(
      and(
        eq(shared.pageContent.path, path),
        eq(shared.pageContent.locale, locale)
      )
    )
    .limit(1);

  return (page as PageContent) || null;
}

export async function getPublishedPageContent(path: string, locale: string) {
  const [page] = await db
    .select({
      id: shared.pageContent.id,
      path: shared.pageContent.path,
      locale: shared.pageContent.locale,
      sections: shared.pageContent.sections,
      version: shared.pageContent.version,
      publishedAt: shared.pageContent.publishedAt,
    })
    .from(shared.pageContent)
    .where(
      and(
        eq(shared.pageContent.path, path),
        eq(shared.pageContent.locale, locale),
        sql`${shared.pageContent.publishedAt} IS NOT NULL`
      )
    )
    .limit(1);

  return page || null;
}

export async function getPendingChanges(args?: {
  pageContentId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
}) {
  const conditions = [];

  if (args?.pageContentId) {
    conditions.push(eq(shared.pendingChanges.pageContentId, args.pageContentId));
  }

  if (args?.status) {
    conditions.push(eq(shared.pendingChanges.status, args.status));
  }

  const changes = await db
    .select()
    .from(shared.pendingChanges)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Enrich with approval counts
  const enriched = await Promise.all(
    changes.map(async (change) => {
      const approvals = await db
        .select()
        .from(shared.changeApprovals)
        .where(eq(shared.changeApprovals.changeId, change.id));

      return {
        ...change,
        approvalCount: approvals.filter((a) => a.approved).length,
        rejectionCount: approvals.filter((a) => !a.approved).length,
        approvals: approvals as ChangeApproval[],
      };
    })
  );

  return enriched;
}

export async function getPageVersions(pageContentId: string) {
  const versions = await db
    .select()
    .from(shared.pageVersions)
    .where(eq(shared.pageVersions.pageContentId, pageContentId))
    .orderBy(desc(shared.pageVersions.version))
    .limit(20);

  return versions as PageVersion[];
}

// ============================================
// MUTATIONS
// ============================================

export async function initializePage(data: {
  path: string;
  locale: string;
  initialSections?: unknown;
}) {
  const [existing] = await db
    .select()
    .from(shared.pageContent)
    .where(
      and(
        eq(shared.pageContent.path, data.path),
        eq(shared.pageContent.locale, data.locale)
      )
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const now = Date.now();

  const [page] = await db
    .insert(shared.pageContent)
    .values({
      path: data.path,
      locale: data.locale,
      sections: data.initialSections || [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return page.id;
}

export async function submitChanges(data: {
  pageContentId: string;
  changedBy: string;
  changedByName: string;
  changeType: string;
  description?: string;
  visualDiff: {
    before: string;
    after: string;
    changesSummary: string[];
  };
  codeDiff: {
    before: unknown;
    after: unknown;
    delta?: unknown;
  };
  requiredApprovals: number;
}) {
  const [page] = await db
    .select({
      path: shared.pageContent.path,
      locale: shared.pageContent.locale,
    })
    .from(shared.pageContent)
    .where(eq(shared.pageContent.id, data.pageContentId))
    .limit(1);

  if (!page) {
    throw new Error("Page not found");
  }

  const now = Date.now();

  const [change] = await db
    .insert(shared.pendingChanges)
    .values({
      pageContentId: data.pageContentId,
      pagePath: page.path,
      pageLocale: page.locale,
      changedBy: data.changedBy,
      changedByName: data.changedByName,
      changeType: data.changeType,
      description: data.description,
      visualDiff: data.visualDiff,
      codeDiff: data.codeDiff,
      status: "pending",
      requiredApprovals: data.requiredApprovals,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/editor/changes");
  return change.id;
}

export async function reviewChange(data: {
  changeId: string;
  userId: string;
  userName: string;
  approved: boolean;
  comment?: string;
}) {
  const _user = await getAuthenticatedUser();

  // Check if user already reviewed
  const [existingReview] = await db
    .select()
    .from(shared.changeApprovals)
    .where(
      and(
        eq(shared.changeApprovals.userId, data.userId),
        eq(shared.changeApprovals.changeId, data.changeId)
      )
    )
    .limit(1);

  if (existingReview) {
    throw new Error("You have already reviewed this change");
  }

  // Record approval
  await db.insert(shared.changeApprovals).values({
    changeId: data.changeId,
    userId: data.userId,
    userName: data.userName,
    approved: data.approved,
    comment: data.comment,
    createdAt: Date.now(),
  });

  // Check if we have enough approvals or rejections
  const [change] = await db
    .select()
    .from(shared.pendingChanges)
    .where(eq(shared.pendingChanges.id, data.changeId))
    .limit(1);

  if (!change) {
    throw new Error("Change not found");
  }

  const allApprovals = await db
    .select()
    .from(shared.changeApprovals)
    .where(eq(shared.changeApprovals.changeId, data.changeId));

  const approvalCount = allApprovals.filter((a) => a.approved).length;
  const rejectionCount = allApprovals.filter((a) => !a.approved).length;

  // Auto-approve if threshold met
  if (approvalCount >= change.requiredApprovals) {
    const now = Date.now();
    await db
      .update(shared.pendingChanges)
      .set({
        status: "approved",
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(shared.pendingChanges.id, data.changeId));

    // Auto-publish approved changes
    await publishChangesInternal(data.changeId, data.userId, data.userName);
  }

  // Auto-reject if more rejections than approvals possible
  const totalReviewers = approvalCount + rejectionCount;
  if (rejectionCount > totalReviewers - change.requiredApprovals) {
    await db
      .update(shared.pendingChanges)
      .set({
        status: "rejected",
        updatedAt: Date.now(),
      })
      .where(eq(shared.pendingChanges.id, data.changeId));
  }

  revalidatePath("/editor/changes");
  return { approvalCount, rejectionCount };
}

async function publishChangesInternal(
  changeId: string,
  publishedBy: string,
  publishedByName: string
) {
  const [change] = await db
    .select()
    .from(shared.pendingChanges)
    .where(eq(shared.pendingChanges.id, changeId))
    .limit(1);

  if (!change) {
    throw new Error("Change not found");
  }

  const [page] = await db
    .select()
    .from(shared.pageContent)
    .where(eq(shared.pageContent.id, change.pageContentId))
    .limit(1);

  if (!page) {
    throw new Error("Page not found");
  }

  // Create version snapshot BEFORE applying changes
  const now = Date.now();
  await db.insert(shared.pageVersions).values({
    pageContentId: change.pageContentId,
    pagePath: page.path,
    version: page.version,
    sections: page.sections,
    theme: page.theme,
    publishedBy,
    publishedByName,
    publishedAt: now,
    changeDescription: change.description,
  });

  // Apply changes to page
  const newVersion = page.version + 1;
  const codeDiff = change.codeDiff as { before: unknown; after: unknown; delta?: unknown };
  await db
    .update(shared.pageContent)
    .set({
      sections: codeDiff.after as any,
      version: newVersion,
      publishedAt: now,
      publishedBy,
      updatedAt: now,
    })
    .where(eq(shared.pageContent.id, change.pageContentId));

  // Mark change as published
  await db
    .update(shared.pendingChanges)
    .set({
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(shared.pendingChanges.id, changeId));

  revalidatePath(`/${page.path}`);
}

export async function publishChanges(data: {
  changeId: string;
  publishedBy: string;
  publishedByName: string;
}) {
  await publishChangesInternal(
    data.changeId,
    data.publishedBy,
    data.publishedByName
  );

  revalidatePath("/editor/changes");
  return { success: true };
}

export async function rollbackToVersion(data: {
  versionId: string;
  publishedBy: string;
  publishedByName: string;
}) {
  const [version] = await db
    .select()
    .from(shared.pageVersions)
    .where(eq(shared.pageVersions.id, data.versionId))
    .limit(1);

  if (!version) {
    throw new Error("Version not found");
  }

  const [page] = await db
    .select()
    .from(shared.pageContent)
    .where(eq(shared.pageContent.id, version.pageContentId))
    .limit(1);

  if (!page) {
    throw new Error("Page not found");
  }

  // Create snapshot of current state before rollback
  const now = Date.now();
  await db.insert(shared.pageVersions).values({
    pageContentId: version.pageContentId,
    pagePath: page.path,
    version: page.version,
    sections: page.sections,
    theme: page.theme,
    publishedBy: data.publishedBy,
    publishedByName: data.publishedByName,
    publishedAt: now,
    changeDescription: `Rollback to version ${version.version}`,
  });

  // Restore old version
  const newVersion = page.version + 1;
  await db
    .update(shared.pageContent)
    .set({
      sections: version.sections,
      theme: version.theme,
      version: newVersion,
      publishedAt: now,
      publishedBy: data.publishedBy,
      updatedAt: now,
    })
    .where(eq(shared.pageContent.id, version.pageContentId));

  revalidatePath(`/${page.path}`);
  return { newVersion };
}

export async function updatePageSections(
  pageContentId: string,
  sections: unknown
) {
  await db
    .update(shared.pageContent)
    .set({
      sections,
      updatedAt: Date.now(),
    })
    .where(eq(shared.pageContent.id, pageContentId));
}

export async function deletePendingChange(changeId: string) {
  // Delete all approvals first (handled by cascade in schema, but being explicit)
  await db
    .delete(shared.changeApprovals)
    .where(eq(shared.changeApprovals.changeId, changeId));

  // Delete the change
  await db
    .delete(shared.pendingChanges)
    .where(eq(shared.pendingChanges.id, changeId));

  revalidatePath("/editor/changes");
}
