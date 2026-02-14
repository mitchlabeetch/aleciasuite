"use server";

/**
 * Colab Boards Server Actions
 *
 * Advanced Kanban board system with lists, cards, labels, and checklists.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// --- Boards ---

export async function createBoard(args: {
  name: string;
  visibility: "private" | "workspace" | "public";
  backgroundUrl?: string;
  workspaceId?: string;
}) {
  const user = await getAuthenticatedUser();

  const [board] = await db
    .insert(colab.boards)
    .values({
      title: args.name,
      description: `Visibility: ${args.visibility}`, // Store visibility in description for now
      ownerId: user.id,
      dealId: null,
      isTemplate: false,
    })
    .returning();

  // Create default lists
  const defaultLists = ["À faire", "En cours", "Terminé"];
  await Promise.all(
    defaultLists.map((title, index) =>
      db.insert(colab.lists).values({
        title,
        boardId: board.id,
        sortOrder: index,
      })
    )
  );

  revalidatePath("/colab/boards");
  return board.id;
}

export async function getBoard(boardId: string) {
  const user = await getAuthenticatedUser();

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, boardId),
  });

  if (!board) return null;

  // Check ownership
  if (board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get lists
  const lists = await db.query.lists.findMany({
    where: eq(colab.lists.boardId, boardId),
    orderBy: (lists, { asc }) => [asc(lists.sortOrder)],
  });

  // Get all cards for this board
  const allCards = await Promise.all(
    lists.map(async (list) => {
      const cards = await db.query.cards.findMany({
        where: eq(colab.cards.listId, list.id),
        orderBy: (cards, { asc }) => [asc(cards.sortOrder)],
      });
      return cards;
    })
  );

  const flatCards = allCards.flat();

  // Get labels
  const labels = await db.query.labels.findMany({
    where: eq(colab.labels.boardId, boardId),
  });

  return {
    ...board,
    lists,
    cards: flatCards,
    labels,
  };
}

export async function listBoards(args?: { workspaceId?: string }) {
  const user = await getAuthenticatedUser();

  // Get boards owned by user
  const boards = await db.query.boards.findMany({
    where: eq(colab.boards.ownerId, user.id),
    orderBy: desc(colab.boards.createdAt),
  });

  // TODO: Add workspace filtering when workspace system is implemented
  // For now, just return user's boards

  return boards;
}

export async function deleteBoard(boardId: string) {
  const user = await getAuthenticatedUser();

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get all lists
  const lists = await db.query.lists.findMany({
    where: eq(colab.lists.boardId, boardId),
  });

  // Delete cards in each list (cascade should handle this, but being explicit)
  for (const list of lists) {
    const cards = await db.query.cards.findMany({
      where: eq(colab.cards.listId, list.id),
    });
    for (const card of cards) {
      await db.delete(colab.cards).where(eq(colab.cards.id, card.id));
    }
    await db.delete(colab.lists).where(eq(colab.lists.id, list.id));
  }

  // Delete labels
  await db.delete(colab.labels).where(eq(colab.labels.boardId, boardId));

  // Delete board
  await db.delete(colab.boards).where(eq(colab.boards.id, boardId));

  revalidatePath("/colab/boards");
}

// --- Lists ---

export async function createList(args: {
  title: string;
  boardId: string;
  sortOrder: number;
}) {
  const user = await getAuthenticatedUser();

  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, args.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const [list] = await db
    .insert(colab.lists)
    .values({
      title: args.title,
      boardId: args.boardId,
      sortOrder: args.sortOrder,
    })
    .returning();

  revalidatePath(`/colab/boards/${args.boardId}`);
  return list.id;
}

export async function reorderList(args: { listId: string; newIndex: number }) {
  const user = await getAuthenticatedUser();

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, args.listId),
  });

  if (!list) throw new Error("List not found");

  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get all lists for this board
  const lists = await db.query.lists.findMany({
    where: eq(colab.lists.boardId, list.boardId),
    orderBy: (lists, { asc }) => [asc(lists.sortOrder)],
  });

  // Reorder in memory
  const currentIndex = lists.findIndex((l) => l.id === args.listId);
  if (currentIndex === -1) return;

  lists.splice(currentIndex, 1);
  lists.splice(args.newIndex, 0, list);

  // Update all indices
  await Promise.all(
    lists.map((l, i) => {
      if (l.sortOrder !== i) {
        return db
          .update(colab.lists)
          .set({ sortOrder: i })
          .where(eq(colab.lists.id, l.id));
      }
      return Promise.resolve();
    })
  );

  revalidatePath(`/colab/boards/${list.boardId}`);
}

export async function updateList(args: { listId: string; title: string }) {
  const user = await getAuthenticatedUser();

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, args.listId),
  });

  if (!list) throw new Error("List not found");

  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(colab.lists)
    .set({ title: args.title })
    .where(eq(colab.lists.id, args.listId));

  revalidatePath(`/colab/boards/${list.boardId}`);
}

export async function deleteList(listId: string) {
  const user = await getAuthenticatedUser();

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, listId),
  });

  if (!list) throw new Error("List not found");

  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Delete cards in the list (cascade should handle this)
  await db.delete(colab.cards).where(eq(colab.cards.listId, listId));

  // Delete list
  await db.delete(colab.lists).where(eq(colab.lists.id, listId));

  revalidatePath(`/colab/boards/${list.boardId}`);
}

// --- Cards ---

export async function createCard(args: {
  title: string;
  listId: string;
  sortOrder: number;
}) {
  const user = await getAuthenticatedUser();

  // Verify list ownership via board
  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, args.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const [card] = await db
    .insert(colab.cards)
    .values({
      title: args.title,
      listId: args.listId,
      sortOrder: args.sortOrder,
      description: null,
      assigneeId: null,
      dueDate: null,
      labels: [],
      attachments: [],
      isArchived: false,
    })
    .returning();

  // TODO: Create activity log entry (need to add card_activities table)

  revalidatePath(`/colab/boards/${board.id}`);
  return card.id;
}

export async function moveCard(args: {
  cardId: string;
  newListId: string;
  newIndex: number;
}) {
  const user = await getAuthenticatedUser();

  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, args.cardId),
  });

  if (!card) throw new Error("Card not found");

  const oldListId = card.listId;
  const newListId = args.newListId;

  // Verify ownership via board
  const oldList = await db.query.lists.findFirst({
    where: eq(colab.lists.id, oldListId),
  });

  if (!oldList) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, oldList.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (oldListId === newListId) {
    // Reorder within the same list
    const cards = await db.query.cards.findMany({
      where: eq(colab.cards.listId, oldListId),
      orderBy: (cards, { asc }) => [asc(cards.sortOrder)],
    });

    const currentIndex = cards.findIndex((c) => c.id === args.cardId);
    if (currentIndex === -1) return;

    cards.splice(currentIndex, 1);
    cards.splice(args.newIndex, 0, card);

    await Promise.all(
      cards.map((c, i) => {
        if (c.sortOrder !== i) {
          return db
            .update(colab.cards)
            .set({ sortOrder: i, updatedAt: new Date() })
            .where(eq(colab.cards.id, c.id));
        }
        return Promise.resolve();
      })
    );
  } else {
    // Move to a different list
    // 1. Remove from old list and update indices
    const oldListCards = await db.query.cards.findMany({
      where: eq(colab.cards.listId, oldListId),
      orderBy: (cards, { asc }) => [asc(cards.sortOrder)],
    });

    const oldIndex = oldListCards.findIndex((c) => c.id === args.cardId);
    oldListCards.splice(oldIndex, 1);

    await Promise.all(
      oldListCards.map((c, i) => {
        if (c.sortOrder !== i) {
          return db
            .update(colab.cards)
            .set({ sortOrder: i })
            .where(eq(colab.cards.id, c.id));
        }
        return Promise.resolve();
      })
    );

    // 2. Insert into new list and update indices
    const newListCards = await db.query.cards.findMany({
      where: eq(colab.cards.listId, newListId),
      orderBy: (cards, { asc }) => [asc(cards.sortOrder)],
    });

    // Update the moving card
    await db
      .update(colab.cards)
      .set({
        listId: newListId,
        sortOrder: args.newIndex,
        updatedAt: new Date(),
      })
      .where(eq(colab.cards.id, args.cardId));

    const movedCard = { ...card, listId: newListId, sortOrder: args.newIndex };
    newListCards.splice(args.newIndex, 0, movedCard);

    await Promise.all(
      newListCards.map((c, i) => {
        if (c.id !== args.cardId && c.sortOrder !== i) {
          return db
            .update(colab.cards)
            .set({ sortOrder: i })
            .where(eq(colab.cards.id, c.id));
        }
        return Promise.resolve();
      })
    );

    // TODO: Create activity log
  }

  revalidatePath(`/colab/boards/${board.id}`);
}

export async function getCard(cardId: string) {
  const user = await getAuthenticatedUser();

  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, cardId),
  });

  if (!card) return null;

  // Verify ownership via board
  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return card;
}

export async function updateCard(args: {
  cardId: string;
  title?: string;
  description?: string;
  dueDate?: Date;
  assigneeId?: string;
  labels?: any[];
}) {
  const user = await getAuthenticatedUser();

  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, args.cardId),
  });

  if (!card) throw new Error("Card not found");

  // Verify ownership
  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const { cardId, ...updates } = args;

  await db
    .update(colab.cards)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(colab.cards.id, cardId));

  // TODO: Create activity log

  revalidatePath(`/colab/boards/${board.id}`);
}

export async function deleteCard(cardId: string) {
  const user = await getAuthenticatedUser();

  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, cardId),
  });

  if (!card) throw new Error("Card not found");

  // Verify ownership
  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(colab.cards).where(eq(colab.cards.id, cardId));

  revalidatePath(`/colab/boards/${board.id}`);
}

// --- Labels ---

export async function getLabels(boardId: string) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return await db.query.labels.findMany({
    where: eq(colab.labels.boardId, boardId),
  });
}

export async function addLabel(args: {
  name: string;
  color: string;
  boardId: string;
}) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, args.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const [label] = await db
    .insert(colab.labels)
    .values({
      name: args.name,
      color: args.color,
      boardId: args.boardId,
    })
    .returning();

  revalidatePath(`/colab/boards/${args.boardId}`);
  return label.id;
}

// --- Checklists ---

export async function getChecklists(cardId: string) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const checklists = await db.query.checklists.findMany({
    where: eq(colab.checklists.cardId, cardId),
    orderBy: (checklists, { asc }) => [asc(checklists.sortOrder)],
  });

  // Fetch items for each checklist
  const checklistsWithItems = await Promise.all(
    checklists.map(async (checklist) => {
      const items = await db.query.checklistItems.findMany({
        where: eq(colab.checklistItems.checklistId, checklist.id),
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      });
      return { ...checklist, items };
    })
  );

  return checklistsWithItems;
}

export async function addChecklist(args: { title: string; cardId: string }) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, args.cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get max order
  const existing = await db.query.checklists.findMany({
    where: eq(colab.checklists.cardId, args.cardId),
  });

  const sortOrder = existing.length;

  const [checklist] = await db
    .insert(colab.checklists)
    .values({
      title: args.title,
      cardId: args.cardId,
      sortOrder,
    })
    .returning();

  revalidatePath(`/colab/boards/${board.id}`);
  return checklist.id;
}

export async function deleteChecklist(checklistId: string) {
  const user = await getAuthenticatedUser();

  const checklist = await db.query.checklists.findFirst({
    where: eq(colab.checklists.id, checklistId),
  });

  if (!checklist) throw new Error("Checklist not found");

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, checklist.cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Delete items (cascade should handle this)
  await db
    .delete(colab.checklistItems)
    .where(eq(colab.checklistItems.checklistId, checklistId));

  // Delete checklist
  await db.delete(colab.checklists).where(eq(colab.checklists.id, checklistId));

  revalidatePath(`/colab/boards/${board.id}`);
}

export async function addChecklistItem(args: {
  label: string;
  checklistId: string;
}) {
  const user = await getAuthenticatedUser();

  const checklist = await db.query.checklists.findFirst({
    where: eq(colab.checklists.id, args.checklistId),
  });

  if (!checklist) throw new Error("Checklist not found");

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, checklist.cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get max order
  const existing = await db.query.checklistItems.findMany({
    where: eq(colab.checklistItems.checklistId, args.checklistId),
  });

  const sortOrder = existing.length;

  const [item] = await db
    .insert(colab.checklistItems)
    .values({
      label: args.label,
      checklistId: args.checklistId,
      isCompleted: false,
      sortOrder,
    })
    .returning();

  revalidatePath(`/colab/boards/${board.id}`);
  return item.id;
}

export async function toggleChecklistItem(args: {
  itemId: string;
  isCompleted: boolean;
}) {
  const user = await getAuthenticatedUser();

  const item = await db.query.checklistItems.findFirst({
    where: eq(colab.checklistItems.id, args.itemId),
  });

  if (!item) throw new Error("Item not found");

  const checklist = await db.query.checklists.findFirst({
    where: eq(colab.checklists.id, item.checklistId),
  });

  if (!checklist) throw new Error("Checklist not found");

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, checklist.cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(colab.checklistItems)
    .set({ isCompleted: args.isCompleted })
    .where(eq(colab.checklistItems.id, args.itemId));

  revalidatePath(`/colab/boards/${board.id}`);
}

export async function deleteChecklistItem(itemId: string) {
  const user = await getAuthenticatedUser();

  const item = await db.query.checklistItems.findFirst({
    where: eq(colab.checklistItems.id, itemId),
  });

  if (!item) throw new Error("Item not found");

  const checklist = await db.query.checklists.findFirst({
    where: eq(colab.checklists.id, item.checklistId),
  });

  if (!checklist) throw new Error("Checklist not found");

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(colab.cards.id, checklist.cardId),
  });

  if (!card) throw new Error("Card not found");

  const list = await db.query.lists.findFirst({
    where: eq(colab.lists.id, card.listId),
  });

  if (!list) throw new Error("List not found");

  const board = await db.query.boards.findFirst({
    where: eq(colab.boards.id, list.boardId),
  });

  if (!board || board.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(colab.checklistItems).where(eq(colab.checklistItems.id, itemId));

  revalidatePath(`/colab/boards/${board.id}`);
}
