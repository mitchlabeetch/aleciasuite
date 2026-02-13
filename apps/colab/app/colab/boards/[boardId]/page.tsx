"use client";

import { KanbanBoard } from "@/components/kanban/Board";
import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/tailwind/ui/popover";
import { getBoard } from "@/actions/colab/boards";
import { Calendar as CalendarIcon, Filter, Tag } from "lucide-react";
import React, { useState, useEffect } from "react";

interface PageProps {
	params: Promise<{
		boardId: string;
	}>;
}

export default function SingleBoardPage({ params }: PageProps) {
	const { boardId } = React.use(params);
	const [boardData, setBoardData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getBoard(boardId).then((data) => {
			setBoardData(data);
			setIsLoading(false);
		});
	}, [boardId]);

	const [filters, setFilters] = useState<{
		labelId?: string;
		dueDate?: Date;
	}>({});

	if (isLoading || !boardData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	const activeFilterCount = Object.keys(filters).length;

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)]">
			<div className="border-b px-6 py-3 bg-background flex items-center justify-between">
				<div className="flex items-center gap-4">
					<h1 className="text-xl font-bold">{boardData.title}</h1>
					<div className="h-6 w-px bg-border" />

					{/* Filter Bar */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={activeFilterCount > 0 ? "bg-secondary" : ""}
							>
								<Filter className="mr-2 h-4 w-4" />
								Filtres
								{activeFilterCount > 0 && (
									<Badge variant="secondary" className="ml-2 px-1 h-5">
										{activeFilterCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-4" align="start">
							<div className="space-y-4">
								<h4 className="font-medium leading-none">Filtrer par</h4>

								{/* Labels Filter */}
								<div className="space-y-2">
									<span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
										<Tag className="h-3 w-3" /> Étiquettes
									</span>
									<div className="flex flex-wrap gap-2">
										<Badge
											variant={
												filters.labelId === undefined ? "default" : "outline"
											}
											className="cursor-pointer"
											onClick={() =>
												setFilters((prev) => {
													const { labelId, ...rest } = prev;
													return rest;
												})
											}
										>
											Tous
										</Badge>
										{boardData.labels?.map((label: any) => (
											<Badge
												key={label.id}
												style={{
													backgroundColor:
														filters.labelId === label.id
															? label.colorCode
															: undefined,
													borderColor: label.colorCode,
													color:
														filters.labelId === label.id
															? "white"
															: label.colorCode,
												}}
												variant="outline"
												className="cursor-pointer"
												onClick={() =>
													setFilters((prev) => ({
														...prev,
														labelId: label.id,
													}))
												}
											>
												{label.name}
											</Badge>
										))}
									</div>
								</div>

								{/* Due Date Filter (Simple) */}
								<div className="space-y-2">
									<span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
										<CalendarIcon className="h-3 w-3" /> Échéance
									</span>
									<div className="flex gap-2">
										<Button
											variant={filters.dueDate ? "secondary" : "outline"}
											size="sm"
											className="h-7 text-xs"
											onClick={() =>
												setFilters((prev) =>
													filters.dueDate
														? (({ dueDate, ...rest }) => rest)(prev)
														: { ...prev, dueDate: new Date() },
												)
											}
										>
											En retard ou aujourd'hui
										</Button>
									</div>
								</div>

								{activeFilterCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										className="w-full text-muted-foreground"
										onClick={() => setFilters({})}
									>
										Effacer tout
									</Button>
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Right side options if any */}
				<div className="flex items-center gap-2">
					{/* Avatars of members could go here */}
				</div>
			</div>

			<div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-muted/20">
				<KanbanBoard
					board={boardData}
					lists={boardData.lists}
					cards={boardData.cards}
					filters={filters}
				/>
			</div>
		</div>
	);
}
