"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/tailwind/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import { SortableCard } from "./SortableCard";

interface SortableListProps {
	list: {
		id: string;
		name: string;
	};
	cards: {
		id: string;
		title: string;
		description?: string;
		dueDate?: number;
		labelIds?: string[];
	}[];
	onAddCard: (listId: string) => void;
	onCardClick: (cardId: string) => void;
	boardLabels: { id: string; name: string; colorCode: string }[];
}

export function SortableList({
	list,
	cards,
	onAddCard,
	onCardClick,
	boardLabels,
}: SortableListProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDragRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: `list-${list.id}` });

	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: list.id,
		data: { type: "list", listId: list.id },
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setDragRef}
			style={style}
			className="w-80 flex-shrink-0 flex flex-col max-h-full bg-muted/20 rounded-lg border shadow-sm"
		>
			<div
				{...attributes}
				{...listeners}
				className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg cursor-grab active:cursor-grabbing"
			>
				<h3 className="font-semibold text-sm px-1">{list.name}</h3>
				<Button variant="ghost" size="icon" className="h-6 w-6">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</div>

			<div
				ref={setDropRef}
				className={`flex-1 p-2 overflow-y-auto min-h-[100px] transition-colors ${isOver ? "bg-primary/5" : ""}`}
			>
				<SortableContext
					items={cards.map((c) => c.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-2 min-h-[10px]">
						{cards.map((card) => (
							<SortableCard
								key={card.id}
								card={card}
								onClick={onCardClick}
								boardLabels={boardLabels}
							/>
						))}
					</div>
				</SortableContext>

				<Button
					variant="ghost"
					className="w-full justify-start text-muted-foreground mt-2 hover:bg-muted/50"
					onClick={() => onAddCard(list.id)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Ajouter une carte
				</Button>
			</div>
		</div>
	);
}
