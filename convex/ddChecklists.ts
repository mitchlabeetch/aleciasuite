import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// PHASE 1.3: DUE DILIGENCE CHECKLIST SYSTEM
// Comprehensive DD tracking for M&A transactions
// ============================================

// ===========================================
// CHECKLIST TEMPLATES
// ===========================================

// Get all templates
export const listTemplates = query({
	args: {
		category: v.optional(
			v.union(
				v.literal("buy_side"),
				v.literal("sell_side"),
				v.literal("merger"),
			),
		),
	},
	handler: async (ctx, args) => {
		if (args.category) {
			return await ctx.db
				.query("dd_checklist_templates")
				.withIndex("by_category", (q) => q.eq("category", args.category!))
				.collect();
		}

		return await ctx.db.query("dd_checklist_templates").collect();
	},
});

// Get a single template
export const getTemplate = query({
	args: { id: v.id("dd_checklist_templates") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

// Create a new template
export const createTemplate = mutation({
	args: {
		name: v.string(),
		category: v.union(
			v.literal("buy_side"),
			v.literal("sell_side"),
			v.literal("merger"),
		),
		items: v.array(
			v.object({
				id: v.string(),
				section: v.string(),
				item: v.string(),
				description: v.optional(v.string()),
				priority: v.union(
					v.literal("critical"),
					v.literal("important"),
					v.literal("standard"),
				),
				suggestedDocuments: v.optional(v.array(v.string())),
			}),
		),
		isDefault: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
			.first();

		if (!user) throw new Error("User not found");

		return await ctx.db.insert("dd_checklist_templates", {
			name: args.name,
			category: args.category,
			items: args.items,
			createdBy: user._id,
			isDefault: args.isDefault ?? false,
			createdAt: Date.now(),
		});
	},
});

// Update a template
export const updateTemplate = mutation({
	args: {
		id: v.id("dd_checklist_templates"),
		name: v.optional(v.string()),
		items: v.optional(
			v.array(
				v.object({
					id: v.string(),
					section: v.string(),
					item: v.string(),
					description: v.optional(v.string()),
					priority: v.union(
						v.literal("critical"),
						v.literal("important"),
						v.literal("standard"),
					),
					suggestedDocuments: v.optional(v.array(v.string())),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);
		await ctx.db.patch(id, filtered);
		return { success: true };
	},
});

// Delete a template
export const deleteTemplate = mutation({
	args: { id: v.id("dd_checklist_templates") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// ===========================================
// CHECKLISTS (Per Deal)
// ===========================================

// List checklists for a deal
export const listChecklists = query({
	args: {
		dealId: v.optional(v.id("deals")),
	},
	handler: async (ctx, args) => {
		if (args.dealId) {
			return await ctx.db
				.query("dd_checklists")
				.withIndex("by_deal", (q) => q.eq("dealId", args.dealId!))
				.collect();
		}
		return await ctx.db.query("dd_checklists").collect();
	},
});

// Get a single checklist with its items
export const getChecklist = query({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		const checklist = await ctx.db.get(args.id);
		if (!checklist) return null;

		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		// Group items by section
		const sections: Record<string, typeof items> = {};
		for (const item of items) {
			if (!sections[item.section]) {
				sections[item.section] = [];
			}
			sections[item.section].push(item);
		}

		// Sort items within each section by order
		for (const section in sections) {
			sections[section].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		}

		return {
			...checklist,
			items,
			sections,
		};
	},
});

// Create a checklist from a template
export const createChecklist = mutation({
	args: {
		dealId: v.id("deals"),
		templateId: v.optional(v.id("dd_checklist_templates")),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		// Create the checklist
		const checklistId = await ctx.db.insert("dd_checklists", {
			dealId: args.dealId,
			templateId: args.templateId,
			name: args.name,
			status: "not_started",
			progress: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// If template provided, copy items
		if (args.templateId) {
			const template = await ctx.db.get(args.templateId);
			if (template) {
				for (let i = 0; i < template.items.length; i++) {
					const item = template.items[i];
					await ctx.db.insert("dd_checklist_items", {
						checklistId,
						section: item.section,
						item: item.item,
						description: item.description,
						priority: item.priority,
						status: "pending",
						order: i,
					});
				}
			}
		}

		return checklistId;
	},
});

// Update checklist status/progress
export const updateChecklist = mutation({
	args: {
		id: v.id("dd_checklists"),
		name: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("not_started"),
				v.literal("in_progress"),
				v.literal("review"),
				v.literal("complete"),
			),
		),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);

		await ctx.db.patch(id, {
			...filtered,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Delete a checklist and its items
export const deleteChecklist = mutation({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		// Delete all items first
		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		for (const item of items) {
			await ctx.db.delete(item._id);
		}

		// Delete the checklist
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// Recalculate checklist progress
export const recalculateProgress = mutation({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		if (items.length === 0) {
			await ctx.db.patch(args.id, { progress: 0, updatedAt: Date.now() });
			return { progress: 0 };
		}

		const completedStatuses = ["received", "reviewed", "not_applicable"];
		const completed = items.filter((i) =>
			completedStatuses.includes(i.status),
		).length;
		const progress = Math.round((completed / items.length) * 100);

		// Update status based on progress
		let status: "not_started" | "in_progress" | "review" | "complete" =
			"not_started";
		if (progress === 100) {
			status = "complete";
		} else if (progress > 0) {
			status = "in_progress";
		}

		await ctx.db.patch(args.id, { progress, status, updatedAt: Date.now() });
		return { progress, status };
	},
});

// ===========================================
// CHECKLIST ITEMS
// ===========================================

// Get items for a checklist (optionally by section)
export const listItems = query({
	args: {
		checklistId: v.id("dd_checklists"),
		section: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		if (args.section) {
			return await ctx.db
				.query("dd_checklist_items")
				.withIndex("by_section", (q) =>
					q.eq("checklistId", args.checklistId).eq("section", args.section!),
				)
				.collect();
		}

		return await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId))
			.collect();
	},
});

// Get a single item
export const getItem = query({
	args: { id: v.id("dd_checklist_items") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

// Add an item to a checklist
export const addItem = mutation({
	args: {
		checklistId: v.id("dd_checklists"),
		section: v.string(),
		item: v.string(),
		description: v.optional(v.string()),
		priority: v.union(
			v.literal("critical"),
			v.literal("important"),
			v.literal("standard"),
		),
		assignedTo: v.optional(v.id("users")),
		dueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Get current max order in section
		const existingItems = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_section", (q) =>
				q.eq("checklistId", args.checklistId).eq("section", args.section),
			)
			.collect();

		const maxOrder = existingItems.reduce(
			(max, item) => Math.max(max, item.order ?? 0),
			-1,
		);

		const itemId = await ctx.db.insert("dd_checklist_items", {
			checklistId: args.checklistId,
			section: args.section,
			item: args.item,
			description: args.description,
			priority: args.priority,
			status: "pending",
			assignedTo: args.assignedTo,
			dueDate: args.dueDate,
			order: maxOrder + 1,
		});

		return itemId;
	},
});

// Update an item
export const updateItem = mutation({
	args: {
		id: v.id("dd_checklist_items"),
		item: v.optional(v.string()),
		description: v.optional(v.string()),
		priority: v.optional(
			v.union(
				v.literal("critical"),
				v.literal("important"),
				v.literal("standard"),
			),
		),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("in_progress"),
				v.literal("received"),
				v.literal("reviewed"),
				v.literal("issue_found"),
				v.literal("not_applicable"),
			),
		),
		assignedTo: v.optional(v.id("users")),
		dueDate: v.optional(v.number()),
		notes: v.optional(v.string()),
		documents: v.optional(v.array(v.id("deal_room_documents"))),
		issueDescription: v.optional(v.string()),
		issueSeverity: v.optional(
			v.union(v.literal("blocker"), v.literal("major"), v.literal("minor")),
		),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const existingItem = await ctx.db.get(id);
		if (!existingItem) throw new Error("Item not found");

		const filtered: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				filtered[key] = value;
			}
		}

		// If status is changing to completed states, record completion
		if (
			args.status &&
			["received", "reviewed", "not_applicable"].includes(args.status) &&
			!["received", "reviewed", "not_applicable"].includes(existingItem.status)
		) {
			const identity = await ctx.auth.getUserIdentity();
			if (identity) {
				const user = await ctx.db
					.query("users")
					.withIndex("by_token", (q) =>
						q.eq("tokenIdentifier", identity.subject),
					)
					.first();
				if (user) {
					filtered.completedAt = Date.now();
					filtered.completedBy = user._id;
				}
			}
		}

		await ctx.db.patch(id, filtered);

		// Recalculate parent checklist progress
		await recalculateProgressInternal(ctx.db, existingItem.checklistId);

		return { success: true };
	},
});

// Delete an item
export const deleteItem = mutation({
	args: { id: v.id("dd_checklist_items") },
	handler: async (ctx, args) => {
		const item = await ctx.db.get(args.id);
		if (!item) throw new Error("Item not found");

		await ctx.db.delete(args.id);

		// Recalculate parent checklist progress
		await recalculateProgressInternal(ctx.db, item.checklistId);

		return { success: true };
	},
});

// Bulk update item statuses
export const bulkUpdateStatus = mutation({
	args: {
		itemIds: v.array(v.id("dd_checklist_items")),
		status: v.union(
			v.literal("pending"),
			v.literal("in_progress"),
			v.literal("received"),
			v.literal("reviewed"),
			v.literal("issue_found"),
			v.literal("not_applicable"),
		),
	},
	handler: async (ctx, args) => {
		let checklistId: Id<"dd_checklists"> | null = null;

		const identity = await ctx.auth.getUserIdentity();
		let userId: Id<"users"> | undefined;
		if (identity) {
			const user = await ctx.db
				.query("users")
				.withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
				.first();
			userId = user?._id;
		}

		for (const itemId of args.itemIds) {
			const item = await ctx.db.get(itemId);
			if (!item) continue;

			checklistId = item.checklistId;

			const updates: Record<string, unknown> = { status: args.status };

			// Record completion if applicable
			if (
				["received", "reviewed", "not_applicable"].includes(args.status) &&
				!["received", "reviewed", "not_applicable"].includes(item.status)
			) {
				updates.completedAt = Date.now();
				if (userId) updates.completedBy = userId;
			}

			await ctx.db.patch(itemId, updates);
		}

		// Recalculate progress once at the end
		if (checklistId) {
			await recalculateProgressInternal(ctx.db, checklistId);
		}

		return { success: true };
	},
});

// ===========================================
// STATISTICS & REPORTING
// ===========================================

// Get checklist statistics
export const getChecklistStats = query({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		const stats = {
			total: items.length,
			pending: 0,
			inProgress: 0,
			received: 0,
			reviewed: 0,
			issueFound: 0,
			notApplicable: 0,
			byPriority: {
				critical: { total: 0, completed: 0 },
				important: { total: 0, completed: 0 },
				standard: { total: 0, completed: 0 },
			},
			bySection: {} as Record<string, { total: number; completed: number }>,
			overdue: 0,
		};

		const now = Date.now();
		const completedStatuses = ["received", "reviewed", "not_applicable"];

		for (const item of items) {
			// By status
			switch (item.status) {
				case "pending":
					stats.pending++;
					break;
				case "in_progress":
					stats.inProgress++;
					break;
				case "received":
					stats.received++;
					break;
				case "reviewed":
					stats.reviewed++;
					break;
				case "issue_found":
					stats.issueFound++;
					break;
				case "not_applicable":
					stats.notApplicable++;
					break;
			}

			// By priority
			if (stats.byPriority[item.priority]) {
				stats.byPriority[item.priority].total++;
				if (completedStatuses.includes(item.status)) {
					stats.byPriority[item.priority].completed++;
				}
			}

			// By section
			if (!stats.bySection[item.section]) {
				stats.bySection[item.section] = { total: 0, completed: 0 };
			}
			stats.bySection[item.section].total++;
			if (completedStatuses.includes(item.status)) {
				stats.bySection[item.section].completed++;
			}

			// Overdue
			if (
				item.dueDate &&
				item.dueDate < now &&
				!completedStatuses.includes(item.status)
			) {
				stats.overdue++;
			}
		}

		return stats;
	},
});

// Get items by assignee
export const getItemsByAssignee = query({
	args: {
		userId: v.id("users"),
		checklistId: v.optional(v.id("dd_checklists")),
	},
	handler: async (ctx, args) => {
		let items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_assignee", (q) => q.eq("assignedTo", args.userId))
			.collect();

		if (args.checklistId) {
			items = items.filter((i) => i.checklistId === args.checklistId);
		}

		return items;
	},
});

// Get overdue items
export const getOverdueItems = query({
	args: {
		checklistId: v.optional(v.id("dd_checklists")),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		let items: Array<{
			_id: Id<"dd_checklist_items">;
			section: string;
			status: string;
			dueDate?: number;
		}>;

		if (args.checklistId) {
			items = await ctx.db
				.query("dd_checklist_items")
				.withIndex("by_checklist", (q) =>
					q.eq("checklistId", args.checklistId!),
				)
				.collect();
		} else {
			items = await ctx.db.query("dd_checklist_items").collect();
		}

		const completedStatuses = ["received", "reviewed", "not_applicable"];
		return items.filter(
			(i) =>
				i.dueDate && i.dueDate < now && !completedStatuses.includes(i.status),
		);
	},
});

// ===========================================
// INTERNAL HELPERS
// ===========================================

async function recalculateProgressInternal(
	db: any,
	checklistId: Id<"dd_checklists">,
): Promise<void> {
	const items = await db
		.query("dd_checklist_items")
		.withIndex("by_checklist", (q: any) => q.eq("checklistId", checklistId))
		.collect();

	if (items.length === 0) {
		await db.patch(checklistId, { progress: 0, updatedAt: Date.now() });
		return;
	}

	const completedStatuses = ["received", "reviewed", "not_applicable"];
	const completed = items.filter((i: any) =>
		completedStatuses.includes(i.status),
	).length;
	const progress = Math.round((completed / items.length) * 100);

	let status: "not_started" | "in_progress" | "review" | "complete" =
		"not_started";
	if (progress === 100) {
		status = "complete";
	} else if (progress > 0) {
		status = "in_progress";
	}

	await db.patch(checklistId, { progress, status, updatedAt: Date.now() });
}

// ============================================
// INTERNAL QUERIES (for notification service)
// ============================================

/**
 * Get checklist by ID (internal - for actions)
 */
export const getChecklistInternal = internalQuery({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		const checklist = await ctx.db.get(args.id);
		if (!checklist) return null;

		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		// Group items by section
		const sections: Record<string, typeof items> = {};
		for (const item of items) {
			if (!sections[item.section]) {
				sections[item.section] = [];
			}
			sections[item.section].push(item);
		}

		return {
			...checklist,
			items,
			sections,
		};
	},
});

/**
 * Get item by ID (internal - for actions)
 */
export const getItemInternal = internalQuery({
	args: { id: v.id("dd_checklist_items") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

/**
 * Get checklist stats (internal - for actions)
 */
export const getChecklistStatsInternal = internalQuery({
	args: { id: v.id("dd_checklists") },
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("dd_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.id))
			.collect();

		const stats = {
			total: items.length,
			pending: 0,
			inProgress: 0,
			received: 0,
			reviewed: 0,
			issueFound: 0,
			notApplicable: 0,
			overdue: 0,
		};

		const now = Date.now();
		const completedStatuses = ["received", "reviewed", "not_applicable"];

		for (const item of items) {
			switch (item.status) {
				case "pending":
					stats.pending++;
					break;
				case "in_progress":
					stats.inProgress++;
					break;
				case "received":
					stats.received++;
					break;
				case "reviewed":
					stats.reviewed++;
					break;
				case "issue_found":
					stats.issueFound++;
					break;
				case "not_applicable":
					stats.notApplicable++;
					break;
			}

			if (
				item.dueDate &&
				item.dueDate < now &&
				!completedStatuses.includes(item.status)
			) {
				stats.overdue++;
			}
		}

		return stats;
	},
});

/**
 * Get all DD checklist items for a deal (internal - for AI scoring)
 * Returns all items from all checklists associated with the deal
 */
export const getItemsForDeal = internalQuery({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		// Get all checklists for this deal
		const checklists = await ctx.db
			.query("dd_checklists")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();

		if (checklists.length === 0) {
			return [];
		}

		// Get all items from all checklists
		const allItems = [];
		for (const checklist of checklists) {
			const items = await ctx.db
				.query("dd_checklist_items")
				.withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
				.collect();
			allItems.push(...items);
		}

		return allItems;
	},
});
