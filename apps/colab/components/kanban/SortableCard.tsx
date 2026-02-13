"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/tailwind/ui/card";
import { AlignLeft, Calendar } from "lucide-react";

interface SortableCardProps {
	card: {
		id: string;
		title: string;
		description?: string;
		dueDate?: number;
		labelIds?: string[];
	};
	onClick: (cardId: string) => void;
	boardLabels: { id: string; name: string; colorCode: string }[];
}

export function SortableCard({
	card,
	onClick,
	boardLabels,
}: SortableCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: card.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const cardLabels = boardLabels.filter((l) => card.labelIds?.includes(l.id));

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			onClick={() => onClick(card.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick(card.id);
				}
			}}
		>
			<Card
				className={`hover:border-primary/50 transition-colors cursor-pointer ${isDragging ? "shadow-lg rotate-2" : ""}`}
			>
				<CardContent className="p-3 space-y-2">
					{cardLabels.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{cardLabels.map((label) => (
								<span
									key={label.id}
									className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
									style={{ backgroundColor: label.colorCode }}
								>
									{label.name}
								</span>
							))}
						</div>
					)}

					<div className="text-sm font-medium leading-none">{card.title}</div>

					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						{card.dueDate && (
							<div
								className={`flex items-center gap-1 ${card.dueDate < Date.now() ? "text-red-500 font-bold" : ""}`}
							>
								<Calendar className="h-3 w-3" />
								{new Date(card.dueDate).toLocaleDateString("fr-FR")}
							</div>
						)}
						{card.description && <AlignLeft className="h-3 w-3" />}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
