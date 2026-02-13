"use client";

import { useSession } from "@alepanel/auth/client";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { KanbanSquare, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { listBoards } from "@/actions/colab/boards";

export const KanbanComponent = ({ node, updateAttributes }: NodeViewProps) => {
	const { data: session, isPending } = useSession();
	const { boardId } = node.attrs;
	const [boards, setBoards] = useState<Array<{ id: string; title: string }>>([]);

	useEffect(() => {
		async function loadBoards() {
			if (!isPending && session?.user?.id) {
				const data = await listBoards();
				setBoards(data);
			}
		}
		loadBoards();
	}, [session?.user?.id, isPending]);

	// If no board is selected, we'll just pick the first one for now or show a selector
	// For this implementation, let's show a simple selector

	const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
		boardId,
	);

	useEffect(() => {
		if (boardId) {
			setSelectedBoardId(boardId);
		}
	}, [boardId]);

	const handleSelect = (id: string) => {
		updateAttributes({ boardId: id });
		setSelectedBoardId(id);
	};

	if (isPending) {
		return (
			<NodeViewWrapper className="my-4 flex items-center justify-center p-8 border rounded-lg bg-muted/50">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</NodeViewWrapper>
		);
	}

	if (boards.length === 0) {
		return (
			<NodeViewWrapper className="my-4 p-4 border rounded-lg bg-muted/20">
				<div className="flex flex-col items-center gap-2 text-muted-foreground">
					<KanbanSquare className="h-8 w-8" />
					<p>Aucun tableau Kanban disponible.</p>
				</div>
			</NodeViewWrapper>
		);
	}

	if (!selectedBoardId) {
		return (
			<NodeViewWrapper className="my-4 p-4 border rounded-lg bg-background shadow-sm">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2 border-b pb-2">
						<KanbanSquare className="h-5 w-5 text-primary" />
						<h3 className="font-medium">Insérer un tableau Kanban</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{boards.map((board: { id: string; title: string }) => (
							<button
								type="button"
								key={board.id}
								onClick={() => handleSelect(board.id)}
								className="flex items-center gap-2 p-3 text-left border rounded hover:bg-muted transition-colors"
							>
								<span className="font-medium">{board.title}</span>
							</button>
						))}
					</div>
				</div>
			</NodeViewWrapper>
		);
	}

	const selectedBoard = boards.find(
		(b: { id: string }) => b.id === selectedBoardId,
	);

	return (
		<NodeViewWrapper className="my-4">
			<div className="border rounded-lg overflow-hidden bg-background shadow-sm">
				<div className="flex items-center justify-between p-3 bg-muted/30 border-b">
					<div className="flex items-center gap-2">
						<KanbanSquare className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium">
							{selectedBoard?.title || "Tableau introuvable"}
						</span>
					</div>
					<button
						type="button"
						onClick={() => updateAttributes({ boardId: "" })}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						Changer
					</button>
				</div>
				<div className="p-4 min-h-[200px] flex items-center justify-center bg-muted/10 text-muted-foreground text-sm italic">
					{/* Note: Full Kanban embedding would require more complex logic/components.
                 For this "editor enhancement" task, we are showing a preview/placeholder logic.
                 Real rendering would duplicate the Kanban Board component here.
             */}
					(Aperçu du tableau Kanban "{selectedBoard?.title}")
				</div>
			</div>
		</NodeViewWrapper>
	);
};
