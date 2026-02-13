"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { useSession } from "@alepanel/auth/client";
import { moveCard as moveCardAction, createCard as createCardAction, reorderList as reorderListAction, createList as createListAction } from "@/actions/colab/boards";
import { Calendar, Kanban, Plus } from "lucide-react";
import { useState } from "react";
import {
	DndContext,
	closestCorners,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CardModal } from "./CardModal";
import { SortableList } from "./SortableList";
import { SortableCard } from "./SortableCard";
import { TimelineView } from "./TimelineView";

interface KanbanBoardProps {
	board: {
		id: string;
		name: string;
		labels?: { id: string; name: string; colorCode: string }[];
	};
	lists: {
		id: string;
		name: string;
		boardId: string;
		index: number;
	}[];
	cards: {
		id: string;
		title: string;
		listId: string;
		index: number;
		labelIds?: string[];
		dueDate?: number;
		description?: string;
		assigneeIds?: string[];
	}[];
	filters?: {
		labelId?: string;
		memberId?: string;
		dueDate?: Date;
	};
}

export function KanbanBoard({
	board,
	lists,
	cards,
	filters,
}: KanbanBoardProps) {
	const { data: session, isPending } = useSession();
	const user = !isPending && session?.user ? session.user : null;

	const [selectedCardId, setSelectedCardId] =
		useState<string | null>(null);
	const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
	const [isCreateListOpen, setIsCreateListOpen] = useState(false);
	const [targetListId, setTargetListId] = useState<string | null>(null);
	const [newCardTitle, setNewCardTitle] = useState("");
	const [newListTitle, setNewListTitle] = useState("");
	const [view, setView] = useState<"kanban" | "timeline">("kanban");
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor),
	);

	const filteredCards = cards.filter((card) => {
		if (
			filters?.labelId &&
			!card.labelIds?.includes(filters.labelId)
		)
			return false;
		if (filters?.memberId && !card.assigneeIds?.includes(filters.memberId))
			return false;
		if (filters?.dueDate && card.dueDate) {
			if (card.dueDate > filters.dueDate.getTime()) return false;
		} else if (filters?.dueDate && !card.dueDate) {
			return false;
		}
		return true;
	});

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over || !user) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// Check if it's a list being moved
		if (activeId.startsWith("list-")) {
			const listId = activeId.replace("list-", "");
			const overListId = overId.replace("list-", "");

			if (activeId !== overId) {
				const oldIndex = lists.findIndex((l) => l.id === listId);
				const newIndex = lists.findIndex((l) => l.id === overListId);

				if (oldIndex !== -1 && newIndex !== -1) {
					await reorderListAction({
						listId,
						newIndex,
					});
				}
			}
			return;
		}

		// It's a card being moved
		const cardId = activeId;
		const activeCard = cards.find((c) => c.id === cardId);

		if (!activeCard) return;

		// Figure out which list the card is being dropped into
		let targetListId: string;
		let newIndex: number;

		// If dropped over another card
		const overCard = cards.find((c) => c.id === overId);
		if (overCard) {
			targetListId = overCard.listId;
			newIndex = cards
				.filter((c) => c.listId === targetListId)
				.findIndex((c) => c.id === overId);
		} else {
			// Dropped over a list
			targetListId = overId;
			newIndex = cards.filter((c) => c.listId === targetListId).length;
		}

		await moveCardAction({
			cardId,
			newListId: targetListId,
			newIndex,
		});
	};

	const openCreateCardDialog = (listId: string) => {
		setTargetListId(listId);
		setNewCardTitle("");
		setIsCreateCardOpen(true);
	};

	const handleCreateCard = async () => {
		if (!user || !targetListId || !newCardTitle.trim()) return;

		await createCardAction({
			title: newCardTitle,
			listId: targetListId,
			sortOrder: cards.filter((c) => c.listId === targetListId).length,
		});

		setIsCreateCardOpen(false);
	};

	const handleCreateList = async () => {
		if (!user || !newListTitle.trim()) return;
		await createListAction({
			title: newListTitle,
			boardId: board.id,
			sortOrder: lists.length,
		});
		setIsCreateListOpen(false);
		setNewListTitle("");
	};

	const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

	return (
		<div className="flex flex-col h-full gap-4">
			<div className="flex items-center gap-2">
				<div className="bg-muted p-1 rounded-md flex items-center gap-1">
					<Button
						variant={view === "kanban" ? "secondary" : "ghost"}
						size="sm"
						onClick={() => setView("kanban")}
						className="gap-2"
					>
						<Kanban className="h-4 w-4" />
						Tableau
					</Button>
					<Button
						variant={view === "timeline" ? "secondary" : "ghost"}
						size="sm"
						onClick={() => setView("timeline")}
						className="gap-2"
					>
						<Calendar className="h-4 w-4" />
						Chronologie
					</Button>
				</div>
			</div>

			{view === "kanban" ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCorners}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={lists.map((l) => `list-${l.id}`)}
						strategy={horizontalListSortingStrategy}
					>
						<div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
							{lists.map((list) => (
								<SortableList
									key={list.id}
									list={list}
									cards={filteredCards.filter((c) => c.listId === list.id)}
									onAddCard={openCreateCardDialog}
									onCardClick={(cardId: string) =>
										setSelectedCardId(cardId)
									}
									boardLabels={board.labels || []}
								/>
							))}

							<div className="w-80 flex-shrink-0">
								<Button
									variant="outline"
									className="w-full h-12 border-dashed"
									onClick={() => setIsCreateListOpen(true)}
								>
									<Plus className="mr-2 h-4 w-4" />
									Ajouter une liste
								</Button>
							</div>
						</div>
					</SortableContext>

					<DragOverlay>
						{activeCard ? (
							<SortableCard
								card={activeCard}
								onClick={() => {}}
								boardLabels={board.labels || []}
							/>
						) : null}
					</DragOverlay>
				</DndContext>
			) : (
				<TimelineView board={board} lists={lists} cards={filteredCards} />
			)}

			{/* Create Card Dialog */}
			<Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ajouter une carte</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<Input
							placeholder="Titre de la carte..."
							value={newCardTitle}
							onChange={(e) => setNewCardTitle(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleCreateCard()}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateCardOpen(false)}
						>
							Annuler
						</Button>
						<Button onClick={handleCreateCard} disabled={!newCardTitle.trim()}>
							Créer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create List Dialog */}
			<Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ajouter une liste</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<Input
							placeholder="Nom de la liste..."
							value={newListTitle}
							onChange={(e) => setNewListTitle(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateListOpen(false)}
						>
							Annuler
						</Button>
						<Button onClick={handleCreateList} disabled={!newListTitle.trim()}>
							Créer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{selectedCardId && (
				<CardModal
					cardId={selectedCardId}
					open={!!selectedCardId}
					onClose={() => setSelectedCardId(null)}
					boardLabels={board.labels || []}
					boardId={board.id}
				/>
			)}
		</div>
	);
}
