"use server";

// CMS Actions (Git-style governance)
// Ported from convex/cms.ts
// TODO: Migrate to Strapi CMS once deployed

import { db, shared, eq, desc, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Proposal {
  id: string;
  targetPageId: string;
  title: string;
  diffSnapshot: string;
  authorId: string;
  votesFor: string[];
  votesAgainst: string[];
  status: "voting" | "merged" | "rejected";
  aiSummary?: string;
  createdAt: Date;
}

// ============================================
// QUERIES
// ============================================

export async function getPage(slug: string) {
  const [page] = await db
    .select()
    .from(shared.sitePages)
    .where(eq(shared.sitePages.slug, slug))
    .limit(1);

  return (page as SitePage) || null;
}

export async function getProposals() {
  const result = await db
    .select({
      id: shared.proposals.id,
      targetPageId: shared.proposals.targetPageId,
      title: shared.proposals.title,
      diffSnapshot: shared.proposals.diffSnapshot,
      authorId: shared.proposals.authorId,
      votesFor: shared.proposals.votesFor,
      votesAgainst: shared.proposals.votesAgainst,
      status: shared.proposals.status,
      aiSummary: shared.proposals.aiSummary,
      createdAt: shared.proposals.createdAt,
      author_name: shared.users.fullName,
      page_title: shared.sitePages.title,
      page_slug: shared.sitePages.slug,
    })
    .from(shared.proposals)
    .leftJoin(shared.users, eq(shared.proposals.authorId, shared.users.id))
    .leftJoin(shared.sitePages, eq(shared.proposals.targetPageId, shared.sitePages.id))
    .where(eq(shared.proposals.status, "voting"))
    .orderBy(desc(shared.proposals.createdAt));

  return result.map((r) => ({
    ...r,
    votesFor: r.votesFor || [],
    votesAgainst: r.votesAgainst || [],
  }));
}

export async function getProposalById(id: string) {
  const [result] = await db
    .select({
      id: shared.proposals.id,
      targetPageId: shared.proposals.targetPageId,
      title: shared.proposals.title,
      diffSnapshot: shared.proposals.diffSnapshot,
      authorId: shared.proposals.authorId,
      votesFor: shared.proposals.votesFor,
      votesAgainst: shared.proposals.votesAgainst,
      status: shared.proposals.status,
      aiSummary: shared.proposals.aiSummary,
      createdAt: shared.proposals.createdAt,
      author_name: shared.users.fullName,
      page_title: shared.sitePages.title,
      page_slug: shared.sitePages.slug,
      current_content: shared.sitePages.content,
    })
    .from(shared.proposals)
    .leftJoin(shared.users, eq(shared.proposals.authorId, shared.users.id))
    .leftJoin(shared.sitePages, eq(shared.proposals.targetPageId, shared.sitePages.id))
    .where(eq(shared.proposals.id, id))
    .limit(1);

  if (!result) return null;

  return {
    ...result,
    votesFor: result.votesFor || [],
    votesAgainst: result.votesAgainst || [],
  };
}

// ============================================
// MUTATIONS
// ============================================

// Sudo direct update
export async function updatePage(data: {
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
}) {
  const user = await getAuthenticatedUser();

  if (user.role !== "sudo") {
    throw new Error("Permission denied: Only Sudo can directly update pages.");
  }

  const [existing] = await db
    .select()
    .from(shared.sitePages)
    .where(eq(shared.sitePages.slug, data.slug))
    .limit(1);

  if (existing) {
    await db
      .update(shared.sitePages)
      .set({
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(shared.sitePages.id, existing.id));
  } else {
    await db.insert(shared.sitePages).values({
      slug: data.slug,
      title: data.title,
      content: data.content,
      isPublished: data.isPublished,
    });
  }

  revalidatePath(`/${data.slug}`);
}

// Partner proposal creation
export async function createProposal(data: {
  slug: string;
  title: string;
  newContent: string;
  aiSummary?: string;
}) {
  const user = await getAuthenticatedUser();

  if (user.role !== "partner" && user.role !== "sudo") {
    throw new Error("Permission denied: Role cannot propose changes.");
  }

  const [page] = await db
    .select()
    .from(shared.sitePages)
    .where(eq(shared.sitePages.slug, data.slug))
    .limit(1);

  if (!page) {
    throw new Error("Page not found. Sudo must create it first.");
  }

  await db.insert(shared.proposals).values({
    targetPageId: page.id,
    title: data.title,
    diffSnapshot: data.newContent,
    authorId: user.id,
    votesFor: [],
    votesAgainst: [],
    status: "voting",
    aiSummary: data.aiSummary,
  });

  revalidatePath("/cms/proposals");
}

export async function voteOnProposal(data: {
  proposalId: string;
  vote: "for" | "against";
}) {
  const user = await getAuthenticatedUser();

  if (user.role !== "partner" && user.role !== "sudo") {
    throw new Error("Unauthorized to vote");
  }

  const [proposal] = await db
    .select()
    .from(shared.proposals)
    .where(eq(shared.proposals.id, data.proposalId))
    .limit(1);

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "voting") {
    throw new Error("Voting is closed");
  }

  // Remove existing vote if any to allow switching
  const votesFor = proposal.votesFor || [];
  const votesAgainst = proposal.votesAgainst || [];

  const cleanVotesFor = votesFor.filter((id) => id !== user.id);
  const cleanVotesAgainst = votesAgainst.filter((id) => id !== user.id);

  if (data.vote === "for") {
    await db
      .update(shared.proposals)
      .set({
        votesFor: [...cleanVotesFor, user.id],
        votesAgainst: cleanVotesAgainst,
      })
      .where(eq(shared.proposals.id, data.proposalId));
  } else {
    await db
      .update(shared.proposals)
      .set({
        votesFor: cleanVotesFor,
        votesAgainst: [...cleanVotesAgainst, user.id],
      })
      .where(eq(shared.proposals.id, data.proposalId));
  }

  revalidatePath("/cms/proposals");
}

export async function mergeProposal(proposalId: string) {
  const user = await getAuthenticatedUser();

  if (user.role !== "sudo" && user.role !== "partner") {
    throw new Error("Unauthorized");
  }

  const [proposal] = await db
    .select()
    .from(shared.proposals)
    .where(eq(shared.proposals.id, proposalId))
    .limit(1);

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "voting") {
    throw new Error("Proposal is not active");
  }

  // Check Quorum
  const [settings] = await db
    .select()
    .from(shared.globalConfig)
    .where(eq(shared.globalConfig.key, "governance"))
    .limit(1);

  const quorumPercent =
    (settings?.value as any)?.quorumPercentage ?? 50;

  // Fetch all voting eligible users
  const partners = await db
    .select()
    .from(shared.users)
    .where(sql`${shared.users.role} IN ('partner', 'sudo')`);

  const totalEligible = partners.length;
  const votesFor = proposal.votesFor || [];
  const votesForCount = votesFor.length;

  const approvalRate = (votesForCount / totalEligible) * 100;

  if (approvalRate < quorumPercent) {
    throw new Error(
      `Quorum not met. Current: ${approvalRate.toFixed(1)}%, Required: ${quorumPercent}%`
    );
  }

  // Merge
  await db
    .update(shared.sitePages)
    .set({
      content: proposal.diffSnapshot,
      updatedAt: new Date(),
    })
    .where(eq(shared.sitePages.id, proposal.targetPageId));

  await db
    .update(shared.proposals)
    .set({ status: "merged" })
    .where(eq(shared.proposals.id, proposalId));

  revalidatePath("/cms/proposals");
}
