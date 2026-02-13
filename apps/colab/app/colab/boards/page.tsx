"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/tailwind/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { createBoard, listBoards } from "@/actions/colab/boards";
import { useSession } from "@alepanel/auth/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function BoardsListPage() {
	// Safe use of useSession
	const { data: session, isPending } = useSession();

	const createBoardAction = createBoard;
	const router = useRouter();

	const [boards, setBoards] = useState<any[]>([]);
	const [isLoadingBoards, setIsLoadingBoards] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newBoardName, setNewBoardName] = useState("");

	useEffect(() => {
		if (!session?.user) {
			setIsLoadingBoards(false);
			return;
		}

		listBoards().then((data) => {
			setBoards(data);
			setIsLoadingBoards(false);
		});
	}, [session]);

	const handleCreateBoard = async () => {
		if (!session?.user || !newBoardName.trim()) return;

		const boardId = await createBoardAction({
			name: newBoardName,
			visibility: "private",
		});

		setNewBoardName("");
		setIsDialogOpen(false);
		router.push(`/colab/boards/${boardId}`);

		// Refresh boards list
		const updatedBoards = await listBoards();
		setBoards(updatedBoards);
	};

	if (isPending || isLoadingBoards) return <div>Chargement...</div>;

	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Tableaux Kanban</h1>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Nouveau tableau
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Créer un nouveau tableau</DialogTitle>
						</DialogHeader>
						<div className="py-4">
							<Input
								placeholder="Nom du tableau..."
								value={newBoardName}
								onChange={(e) => setNewBoardName(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
								Annuler
							</Button>
							<Button
								onClick={handleCreateBoard}
								disabled={!newBoardName.trim()}
							>
								Créer
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{boards?.map(
					(board: { id: string; name: string; createdAt: number }) => (
						<Card
							key={board.id}
							className="cursor-pointer hover:shadow-lg transition-all"
							onClick={() => router.push(`/colab/boards/${board.id}`)}
						>
							<CardHeader>
								<CardTitle>{board.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground">
									Créé le{" "}
									{new Date(board.createdAt).toLocaleDateString("fr-FR")}
								</div>
							</CardContent>
						</Card>
					),
				)}

				{boards?.length === 0 && (
					<div className="col-span-3 text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
						Aucun tableau pour le moment. Créez-en un pour commencer !
					</div>
				)}
			</div>
		</div>
	);
}
