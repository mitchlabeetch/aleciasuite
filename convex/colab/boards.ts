/**
 * Colab Boards Module
 *
 * Advanced Kanban board system with lists, cards, labels, and checklists.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// --- Boards ---

export const createBoard = mutation({
	args: {
		name: v.string(),
		visibility: v.union(
			v.literal("private"),
			v.literal("workspace"),
			v.literal("public"),
		),
		backgroundUrl: v.optional(v.string()),
		workspaceId: v.optional(v.string()),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const boardId = await ctx.db.insert("colab_boards", {
			name: args.name,
			visibility: args.visibility,
			backgroundUrl: args.backgroundUrl,
			workspaceId: args.workspaceId,
			createdBy: args.userId,
			createdAt: Date.now(),
		});

		// Create default lists
		const defaultLists = ["À faire", "En cours", "Terminé"];
		await Promise.all(
			defaultLists.map((name, index) =>
				ctx.db.insert("colab_lists", {
					name,
					boardId,
					index: index,
					createdAt: Date.now(),
				}),
			),
		);

		return boardId;
	},
});

export const getBoard = query({
	args: { boardId: v.id("colab_boards") },
	handler: async (ctx, args) => {
		const board = await ctx.db.get(args.boardId);
		if (!board) return null;

		const lists = await ctx.db
			.query("colab_lists")
			.withIndex("by_board", (q) => q.eq("boardId", args.boardId))
			.collect();

		// Sort lists by index
		lists.sort((a, b) => a.index - b.index);

		const cards = await Promise.all(
			lists.map(async (list) => {
				const listCards = await ctx.db
					.query("colab_cards")
					.withIndex("by_list", (q) => q.eq("listId", list._id))
					.collect();
				return listCards;
			}),
		);

		const flatCards = cards.flat().sort((a, b) => a.index - b.index);

		const labels = await ctx.db
			.query("colab_labels")
			.withIndex("by_board", (q) => q.eq("boardId", args.boardId))
			.collect();

		return {
			...board,
			lists,
			cards: flatCards,
			labels,
		};
	},
});

export const listBoards = query({
	args: { userId: v.optional(v.string()), workspaceId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		// Return empty array if not authenticated
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const userId = args.userId || identity.subject;

		// Basic implementation: fetch boards created by user or in workspace
		// In production, would handle complex visibility rules
		const boards = await ctx.db
			.query("colab_boards")
			.withIndex("by_user", (q) => q.eq("createdBy", userId))
			.collect();

		if (args.workspaceId) {
			const workspaceId = args.workspaceId;
			const workspaceBoards = await ctx.db
				.query("colab_boards")
				.withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
				.collect();
			// Merge unique boards (simple dedupe)
			const boardIds = new Set(boards.map((b) => b._id));
			for (const b of workspaceBoards) {
				if (!boardIds.has(b._id)) {
					boards.push(b);
				}
			}
		}

		return boards.sort((a, b) => b.createdAt - a.createdAt);
	},
});

export const deleteBoard = mutation({
	args: { boardId: v.id("colab_boards") },
	handler: async (ctx, args) => {
		// Delete all lists (which will cascade to cards)
		const lists = await ctx.db
			.query("colab_lists")
			.withIndex("by_board", (q) => q.eq("boardId", args.boardId))
			.collect();

		for (const list of lists) {
			// Delete cards in list
			const cards = await ctx.db
				.query("colab_cards")
				.withIndex("by_list", (q) => q.eq("listId", list._id))
				.collect();
			for (const card of cards) {
				await ctx.db.delete(card._id);
			}
			await ctx.db.delete(list._id);
		}

		// Delete labels
		const labels = await ctx.db
			.query("colab_labels")
			.withIndex("by_board", (q) => q.eq("boardId", args.boardId))
			.collect();
		for (const label of labels) {
			await ctx.db.delete(label._id);
		}

		// Delete board
		await ctx.db.delete(args.boardId);
	},
});

// --- Lists ---

export const createList = mutation({
	args: {
		name: v.string(),
		boardId: v.id("colab_boards"),
		index: v.number(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("colab_lists", {
			name: args.name,
			boardId: args.boardId,
			index: args.index,
			createdAt: Date.now(),
		});
	},
});

export const reorderList = mutation({
	args: {
		listId: v.id("colab_lists"),
		newIndex: v.number(),
	},
	handler: async (ctx, args) => {
		const list = await ctx.db.get(args.listId);
		if (!list) throw new Error("List not found");

		const lists = await ctx.db
			.query("colab_lists")
			.withIndex("by_board", (q) => q.eq("boardId", list.boardId))
			.collect();

		lists.sort((a, b) => a.index - b.index);

		const currentIndex = lists.findIndex((l) => l._id === args.listId);
		if (currentIndex === -1) return;

		// Remove from current position
		lists.splice(currentIndex, 1);
		// Insert at new position
		lists.splice(args.newIndex, 0, list);

		// Update indices
		await Promise.all(
			lists.map((l, i) => {
				if (l.index !== i) {
					return ctx.db.patch(l._id, { index: i });
				}
				return Promise.resolve();
			}),
		);
	},
});

export const updateList = mutation({
	args: {
		listId: v.id("colab_lists"),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.listId, { name: args.name });
	},
});

export const deleteList = mutation({
	args: {
		listId: v.id("colab_lists"),
	},
	handler: async (ctx, args) => {
		// Delete cards in the list
		const cards = await ctx.db
			.query("colab_cards")
			.withIndex("by_list", (q) => q.eq("listId", args.listId))
			.collect();
		for (const card of cards) {
			await ctx.db.delete(card._id);
		}
		await ctx.db.delete(args.listId);
	},
});

// --- Cards ---

export const createCard = mutation({
	args: {
		title: v.string(),
		listId: v.id("colab_lists"),
		index: v.number(),
		createdBy: v.string(),
	},
	handler: async (ctx, args) => {
		const cardId = await ctx.db.insert("colab_cards", {
			title: args.title,
			listId: args.listId,
			index: args.index,
			createdBy: args.createdBy,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		await ctx.db.insert("colab_card_activities", {
			cardId,
			userId: args.createdBy,
			action: "a créé la carte",
			createdAt: Date.now(),
		});

		return cardId;
	},
});

export const moveCard = mutation({
	args: {
		cardId: v.id("colab_cards"),
		newListId: v.id("colab_lists"),
		newIndex: v.number(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const card = await ctx.db.get(args.cardId);
		if (!card) throw new Error("Card not found");

		const oldListId = card.listId;
		const newListId = args.newListId;

		if (oldListId === newListId) {
			// Reorder within the same list
			const cards = await ctx.db
				.query("colab_cards")
				.withIndex("by_list", (q) => q.eq("listId", oldListId))
				.collect();

			cards.sort((a, b) => a.index - b.index);

			const currentIndex = cards.findIndex((c) => c._id === args.cardId);
			if (currentIndex === -1) return;

			cards.splice(currentIndex, 1);
			cards.splice(args.newIndex, 0, card);

			await Promise.all(
				cards.map((c, i) => {
					if (c.index !== i) {
						return ctx.db.patch(c._id, { index: i, updatedAt: Date.now() });
					}
					return Promise.resolve();
				}),
			);
		} else {
			// Move to a different list
			// 1. Remove from old list and update indices there
			const oldListCards = await ctx.db
				.query("colab_cards")
				.withIndex("by_list", (q) => q.eq("listId", oldListId))
				.collect();
			oldListCards.sort((a, b) => a.index - b.index);
			const oldIndex = oldListCards.findIndex((c) => c._id === args.cardId);
			oldListCards.splice(oldIndex, 1);

			await Promise.all(
				oldListCards.map((c, i) => {
					if (c.index !== i) {
						return ctx.db.patch(c._id, { index: i });
					}
					return Promise.resolve();
				}),
			);

			// 2. Insert into new list and update indices there
			const newListCards = await ctx.db
				.query("colab_cards")
				.withIndex("by_list", (q) => q.eq("listId", newListId))
				.collect();
			newListCards.sort((a, b) => a.index - b.index);

			// Update the moving card
			await ctx.db.patch(args.cardId, {
				listId: newListId,
				index: args.newIndex,
				updatedAt: Date.now(),
			});

			const movedCard = { ...card, listId: newListId, index: args.newIndex };
			newListCards.splice(args.newIndex, 0, movedCard);

			await Promise.all(
				newListCards.map((c, i) => {
					if (c._id !== args.cardId) {
						if (c.index !== i) {
							return ctx.db.patch(c._id, { index: i });
						}
					} else {
						if (c.index !== i) {
							return ctx.db.patch(c._id, { index: i });
						}
					}
					return Promise.resolve();
				}),
			);

			await ctx.db.insert("colab_card_activities", {
				cardId: args.cardId,
				userId: args.userId,
				action: "a déplacé la carte",
				details: { from: oldListId, to: newListId },
				createdAt: Date.now(),
			});
		}
	},
});

export const getCard = query({
	args: { cardId: v.id("colab_cards") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.cardId);
	},
});

export const updateCard = mutation({
	args: {
		cardId: v.id("colab_cards"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		dueDate: v.optional(v.number()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		dependsOn: v.optional(v.array(v.id("colab_cards"))),
		labelIds: v.optional(v.array(v.id("colab_labels"))),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const { cardId, userId, ...updates } = args;
		await ctx.db.patch(cardId, {
			...updates,
			updatedAt: Date.now(),
		});

		await ctx.db.insert("colab_card_activities", {
			cardId,
			userId,
			action: "a mis à jour la carte",
			details: Object.keys(updates),
			createdAt: Date.now(),
		});
	},
});

export const deleteCard = mutation({
	args: {
		cardId: v.id("colab_cards"),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.cardId);
		// Note: In a real app we'd delete activities, checklists, etc.
	},
});

// --- Labels ---

export const getLabels = query({
	args: { boardId: v.id("colab_boards") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("colab_labels")
			.withIndex("by_board", (q) => q.eq("boardId", args.boardId))
			.collect();
	},
});

export const addLabel = mutation({
	args: {
		name: v.string(),
		colorCode: v.string(),
		boardId: v.id("colab_boards"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("colab_labels", args);
	},
});

// --- Checklists ---

export const getChecklists = query({
	args: { cardId: v.id("colab_cards") },
	handler: async (ctx, args) => {
		const checklists = await ctx.db
			.query("colab_checklists")
			.withIndex("by_card", (q) => q.eq("cardId", args.cardId))
			.collect();

		// Sort checklists by order
		checklists.sort((a, b) => a.order - b.order);

		// Fetch items for each checklist
		const checklistsWithItems = await Promise.all(
			checklists.map(async (checklist) => {
				const items = await ctx.db
					.query("colab_checklist_items")
					.withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
					.collect();
				// Sort items
				items.sort((a, b) => a.order - b.order);
				return { ...checklist, items };
			}),
		);

		return checklistsWithItems;
	},
});

export const addChecklist = mutation({
	args: {
		name: v.string(),
		cardId: v.id("colab_cards"),
	},
	handler: async (ctx, args) => {
		// get max order
		const existing = await ctx.db
			.query("colab_checklists")
			.withIndex("by_card", (q) => q.eq("cardId", args.cardId))
			.collect();
		const order = existing.length;
		return await ctx.db.insert("colab_checklists", { ...args, order });
	},
});

export const deleteChecklist = mutation({
	args: { checklistId: v.id("colab_checklists") },
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("colab_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId))
			.collect();
		for (const item of items) await ctx.db.delete(item._id);
		await ctx.db.delete(args.checklistId);
	},
});

export const addChecklistItem = mutation({
	args: {
		content: v.string(),
		checklistId: v.id("colab_checklists"),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("colab_checklist_items")
			.withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId))
			.collect();
		const order = existing.length;
		return await ctx.db.insert("colab_checklist_items", {
			content: args.content,
			checklistId: args.checklistId,
			completed: false,
			order,
		});
	},
});

export const toggleChecklistItem = mutation({
	args: {
		itemId: v.id("colab_checklist_items"),
		completed: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.itemId, { completed: args.completed });
	},
});

export const deleteChecklistItem = mutation({
	args: { itemId: v.id("colab_checklist_items") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.itemId);
	},
});

// --- Activities ---

export const getCardActivities = query({
	args: { cardId: v.id("colab_cards") },
	handler: async (ctx, args) => {
		const activities = await ctx.db
			.query("colab_card_activities")
			.withIndex("by_card", (q) => q.eq("cardId", args.cardId))
			.collect();
		return activities.sort((a, b) => b.createdAt - a.createdAt);
	},
});
