import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { Id, Doc } from "./_generated/dataModel";

// ============================================
// KANBAN COLUMNS
// ============================================

export const getKanbanColumns = query({
	args: { boardId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		const columns = await ctx.db
			.query("kanban_columns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
			.collect();

		return columns.sort((a, b) => a.order - b.order);
	},
});

export const createKanbanColumn = mutation({
	args: {
		boardId: v.optional(v.string()),
		name: v.string(),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		// Get max order for this board
		const existing = await ctx.db
			.query("kanban_columns")
			.withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
			.collect();

		const maxOrder = existing.reduce((max, col) => Math.max(max, col.order), 0);

		return await ctx.db.insert("kanban_columns", {
			boardId: args.boardId,
			name: args.name,
			color: args.color,
			order: maxOrder + 1,
		});
	},
});

export const reorderKanbanColumns = mutation({
	args: {
		columnIds: v.array(v.id("kanban_columns")),
	},
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		// Update order based on array position
		await Promise.all(
			args.columnIds.map((id, index) => ctx.db.patch(id, { order: index })),
		);
	},
});

export const deleteKanbanColumn = mutation({
	args: { columnId: v.id("kanban_columns") },
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);
		await ctx.db.delete(args.columnId);
	},
});

// ============================================
// PROJECT EVENTS (Activity Timeline)
// ============================================

export const getEvents = query({
	args: {
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		let events;

		if (args.dealId) {
			events = await ctx.db
				.query("project_events")
				.withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
				.order("desc")
				.take(args.limit ?? 20);
		} else if (args.companyId) {
			events = await ctx.db
				.query("project_events")
				.withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
				.order("desc")
				.take(args.limit ?? 20);
		} else {
			// Get recent events across all
			events = await ctx.db
				.query("project_events")
				.order("desc")
				.take(args.limit ?? 20);
		}

		// Bolt Optimization: Batch fetch users to prevent N+1 queries
		// 1. Collect unique user IDs
		const userIds = [...new Set(events.map((e) => e.userId))];

		// 2. Fetch users in parallel
		const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

		// 3. Create lookup map
		const usersMap = new Map(userIds.map((id, index) => [id, users[index]]));

		// 4. Enrich events
		const enriched = events.map((event) => {
			const user = usersMap.get(event.userId);
			return {
				...event,
				userName: user?.name ?? "Inconnu",
				userAvatar: user?.avatarUrl,
			};
		});

		return enriched;
	},
});

// Get all events with advanced filtering for Activity Hub
export const getAllEvents = query({
	args: {
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
		eventTypes: v.optional(v.array(v.string())),
		userId: v.optional(v.id("users")),
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return { events: [], total: 0 };

		const limit = args.limit ?? 50;
		const offset = args.offset ?? 0;

		// Build query based on filters
		let eventsQuery;

		if (args.userId) {
			eventsQuery = ctx.db
				.query("project_events")
				.withIndex("by_userId", (q) => q.eq("userId", args.userId!));
		} else if (args.dealId) {
			eventsQuery = ctx.db
				.query("project_events")
				.withIndex("by_dealId", (q) => q.eq("dealId", args.dealId));
		} else if (args.companyId) {
			eventsQuery = ctx.db
				.query("project_events")
				.withIndex("by_companyId", (q) => q.eq("companyId", args.companyId));
		} else {
			eventsQuery = ctx.db.query("project_events");
		}

		// Get all matching events for filtering and counting
		let allEvents = await eventsQuery.order("desc").collect();

		// Filter by event types if specified
		if (args.eventTypes && args.eventTypes.length > 0) {
			allEvents = allEvents.filter((e) =>
				args.eventTypes!.includes(e.eventType),
			);
		}

		const total = allEvents.length;

		// Apply pagination
		const paginatedEvents = allEvents.slice(offset, offset + limit);

		// Batch fetch related data
		const userIds = [...new Set(paginatedEvents.map((e) => e.userId))];
		const dealIds = [
			...new Set(paginatedEvents.filter((e) => e.dealId).map((e) => e.dealId!)),
		];
		const companyIds = [
			...new Set(
				paginatedEvents.filter((e) => e.companyId).map((e) => e.companyId!),
			),
		];

		const [users, deals, companies] = await Promise.all([
			Promise.all(userIds.map((id) => ctx.db.get(id))),
			Promise.all(dealIds.map((id) => ctx.db.get(id))),
			Promise.all(companyIds.map((id) => ctx.db.get(id))),
		]);

		const usersMap = new Map(userIds.map((id, i) => [id, users[i]]));
		const dealsMap = new Map(dealIds.map((id, i) => [id, deals[i]]));
		const companiesMap = new Map(companyIds.map((id, i) => [id, companies[i]]));

		// Enrich events
		const enriched = paginatedEvents.map((event) => {
			const eventUser = usersMap.get(event.userId);
			const deal = event.dealId ? dealsMap.get(event.dealId) : null;
			const company = event.companyId
				? companiesMap.get(event.companyId)
				: null;

			return {
				...event,
				userName: eventUser?.name ?? "Inconnu",
				userAvatar: eventUser?.avatarUrl,
				dealTitle: deal?.title,
				companyName: company?.name,
			};
		});

		return { events: enriched, total };
	},
});

// Get all users for filter dropdown
export const getActiveUsers = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		// Get users who have logged events
		const events = await ctx.db.query("project_events").collect();
		const userIds = [...new Set(events.map((e) => e.userId))];

		const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

		return users
			.filter((u): u is NonNullable<typeof u> => u !== null)
			.map((u) => ({
				_id: u._id,
				name: u.name ?? "Inconnu",
				avatarUrl: u.avatarUrl,
			}));
	},
});

export const logEvent = mutation({
	args: {
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
		contactId: v.optional(v.id("contacts")),
		eventType: v.union(
			v.literal("status_change"),
			v.literal("note_added"),
			v.literal("document_uploaded"),
			v.literal("meeting_scheduled"),
			v.literal("email_sent"),
			v.literal("call_logged"),
		),
		title: v.string(),
		description: v.optional(v.string()),
		metadata: v.optional(
			v.record(
				v.string(),
				v.union(v.string(), v.number(), v.boolean(), v.null()),
			),
		),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		return await ctx.db.insert("project_events", {
			...args,
			userId: user._id,
		});
	},
});

// Internal mutation for automatic event logging (e.g., from deal stage changes)
export const logEventInternal = internalMutation({
	args: {
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
		eventType: v.string(),
		title: v.string(),
		userId: v.id("users"),
		metadata: v.optional(
			v.record(
				v.string(),
				v.union(v.string(), v.number(), v.boolean(), v.null()),
			),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("project_events", {
			dealId: args.dealId,
			companyId: args.companyId,
			eventType: args.eventType as
				| "status_change"
				| "note_added"
				| "document_uploaded"
				| "meeting_scheduled"
				| "email_sent"
				| "call_logged",
			title: args.title,
			userId: args.userId,
			metadata: args.metadata,
		});
	},
});
