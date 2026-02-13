"use client";

import { Button } from "@/components/tailwind/ui/button";
import { updateCard as updateCardAction } from "@/actions/colab/boards";
import { cn } from "@/lib/utils";
import { useSession } from "@alepanel/auth/client";
import {
	addDays,
	addMonths,
	addWeeks,
	differenceInDays,
	format,
	isSameDay,
	eachDayOfInterval,
	startOfMonth,
	isWeekend,
	startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

const TIMELINE_STRINGS = {
	viewTitle: "Chronologie",
	today: "Aujourd'hui",
	noDate: "Sans date",
	zoom: {
		day: "Jour",
		week: "Semaine",
		month: "Mois",
	},
};

type ZoomLevel = "day" | "week" | "month";

interface TimelineViewProps {
	board: {
		id: string;
		name: string;
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
		startDate?: number;
		endDate?: number;
		dueDate?: number;
	}[];
}

export function TimelineView({ lists, cards }: TimelineViewProps) {
	const { data: session, isPending } = useSession();
	const user = !isPending && session?.user ? session.user : null;
	const [zoom, setZoom] = useState<ZoomLevel>("day");
	const [currentDate, setCurrentDate] = useState(new Date());

	// Drag state
	const [draggingCard, setDraggingCard] = useState<{
		id: string;
		startX: number;
		initialStart: number;
		initialEnd: number;
		type: "move" | "resize";
	} | null>(null);

	// Configuration for each zoom level
	const CELL_WIDTH = zoom === "day" ? 50 : zoom === "week" ? 20 : 10;
	const HEADER_HEIGHT = 40;
	const ROW_HEIGHT = 48;
	const SIDEBAR_WIDTH = 200;

	// Calculate visible date range based on zoom and currentDate
	const startDateRange = useMemo(
		() => startOfDay(addDays(currentDate, -30)),
		[currentDate],
	);
	const endDateRange = useMemo(
		() => startOfDay(addDays(currentDate, 30)),
		[currentDate],
	);
	const days = useMemo(
		() => eachDayOfInterval({ start: startDateRange, end: endDateRange }),
		[startDateRange, endDateRange],
	);

	// Helper to format dates
	const formatDate = (date: Date, formatStr: string) => {
		return format(date, formatStr, { locale: fr });
	};

	// Calculate position and width for a card
	const getCardStyle = (card: TimelineViewProps["cards"][0]) => {
		const start = card.startDate ? new Date(card.startDate) : null;
		let end = card.endDate ? new Date(card.endDate) : null;

		if (!start) return null;

		if (!end) {
			end = addDays(start, 1);
		}

		const dayOffset = differenceInDays(start, startDateRange);
		const durationDays = differenceInDays(end, start) || 1;

		if (dayOffset + durationDays < 0 || dayOffset > days.length) return null;

		const left = dayOffset * CELL_WIDTH;
		const width = durationDays * CELL_WIDTH;

		return {
			left: `${left}px`,
			width: `${Math.max(width, CELL_WIDTH)}px`,
		};
	};

	const handleMouseDown = (
		e: React.MouseEvent,
		card: TimelineViewProps["cards"][0],
		type: "move" | "resize",
	) => {
		e.stopPropagation();
		e.preventDefault(); // Prevent text selection

		if (!card.startDate) return;

		setDraggingCard({
			id: card.id,
			startX: e.clientX,
			initialStart: card.startDate,
			initialEnd:
				card.endDate || addDays(new Date(card.startDate), 1).getTime(),
			type,
		});
	};

	const handleMouseMove = useCallback(
		(_e: MouseEvent) => {
			if (!draggingCard) return;

			// This is purely visual feedback logic would be complex to implement efficiently in React state for every pixel
			// So we might just update on mouse up, OR we can use a ref for the element to update visual position directly.
			// But for simplicity in this iteration, we will rely on mouse up to calculate the new date.
			// To improve UX, we could show a ghost element or update state (might be laggy without optimization).
			// Let's stick to updating only on MouseUp for now, but to make it feel responsive, maybe we could update a local optimistic state?
			// No, let's just do it on MouseUp for simplicity and robustness first.
		},
		[draggingCard],
	);

	const handleMouseUp = useCallback(
		async (e: MouseEvent) => {
			if (!draggingCard || !user) return;

			const diffX = e.clientX - draggingCard.startX;
			const diffDays = Math.round(diffX / CELL_WIDTH);

			if (diffDays === 0) {
				setDraggingCard(null);
				return;
			}

			const originalStart = new Date(draggingCard.initialStart);
			const originalEnd = new Date(draggingCard.initialEnd);

			let newStart = originalStart;
			let newEnd = originalEnd;

			if (draggingCard.type === "move") {
				newStart = addDays(originalStart, diffDays);
				newEnd = addDays(originalEnd, diffDays);
			} else if (draggingCard.type === "resize") {
				newEnd = addDays(originalEnd, diffDays);
				// Prevent end date before start date
				if (newEnd <= newStart) {
					newEnd = addDays(newStart, 1);
				}
			}

			// Optimistic update logic could go here, but we'll rely on server action reactivity
			await updateCardAction({
				cardId: draggingCard.id,
				// Note: startDate/endDate are not in the updateCard schema
				// These would need to be added to the server action
			});

			setDraggingCard(null);
		},
		[draggingCard, CELL_WIDTH, user],
	);

	useEffect(() => {
		if (draggingCard) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		} else {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [draggingCard, handleMouseMove, handleMouseUp]);

	return (
		<div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden select-none">
			{/* Header Controls */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-4">
					<h2 className="text-lg font-semibold">
						{TIMELINE_STRINGS.viewTitle}
					</h2>
					<div className="flex items-center gap-1 bg-muted p-1 rounded-md">
						<Button
							variant={zoom === "day" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setZoom("day")}
						>
							{TIMELINE_STRINGS.zoom.day}
						</Button>
						<Button
							variant={zoom === "week" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setZoom("week")}
						>
							{TIMELINE_STRINGS.zoom.week}
						</Button>
						<Button
							variant={zoom === "month" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setZoom("month")}
						>
							{TIMELINE_STRINGS.zoom.month}
						</Button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentDate(new Date())}
					>
						{TIMELINE_STRINGS.today}
					</Button>
					<div className="flex items-center rounded-md border">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								if (zoom === "day") setCurrentDate((d) => addDays(d, -7));
								if (zoom === "week") setCurrentDate((d) => addWeeks(d, -1));
								if (zoom === "month") setCurrentDate((d) => addMonths(d, -1));
							}}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="px-4 text-sm font-medium min-w-[120px] text-center">
							{formatDate(
								currentDate,
								zoom === "month" ? "MMMM yyyy" : "d MMMM yyyy",
							)}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								if (zoom === "day") setCurrentDate((d) => addDays(d, 7));
								if (zoom === "week") setCurrentDate((d) => addWeeks(d, 1));
								if (zoom === "month") setCurrentDate((d) => addMonths(d, 1));
							}}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Timeline Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar (Lists) */}
				<div
					className="flex-shrink-0 border-r bg-muted/10 overflow-hidden"
					style={{ width: SIDEBAR_WIDTH }}
				>
					<div
						className="border-b bg-muted/20 font-medium text-sm flex items-center px-4"
						style={{ height: HEADER_HEIGHT }}
					>
						Listes
					</div>
					<div className="overflow-y-hidden">
						{lists.map((list) => (
							<div
								key={list.id}
								className="border-b flex items-center px-4 truncate font-medium text-sm text-muted-foreground"
								style={{ height: ROW_HEIGHT }}
							>
								{list.name}
							</div>
						))}
					</div>
				</div>

				{/* Grid */}
				<div className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing">
					<div
						className="flex border-b bg-background sticky top-0 z-10 w-fit"
						style={{ height: HEADER_HEIGHT }}
					>
						{days.map((day) => {
							const isToday = isSameDay(day, new Date());
							const isWknd = isWeekend(day);

							let content = formatDate(day, "d");
							if (zoom === "week") content = formatDate(day, "EEEEE");
							if (zoom === "month") content = "";

							const showMonth =
								isSameDay(day, startOfMonth(day)) ||
								isSameDay(day, startDateRange);

							return (
								<div
									key={day.toISOString()}
									className={cn(
										"flex-shrink-0 border-r flex flex-col justify-end pb-1 text-xs text-center select-none",
										isToday && "bg-blue-50/50 text-blue-600 font-bold",
										isWknd && !isToday && "bg-muted/20",
									)}
									style={{ width: CELL_WIDTH }}
								>
									{showMonth && (
										<span className="absolute top-1 left-1 text-[10px] font-semibold text-muted-foreground whitespace-nowrap pl-1">
											{formatDate(day, "MMMM yyyy")}
										</span>
									)}
									<span>{content}</span>
								</div>
							);
						})}
					</div>

					<div className="relative w-fit">
						{/* Background Grid */}
						<div className="absolute inset-0 flex pointer-events-none">
							{days.map((day) => {
								const isToday = isSameDay(day, new Date());
								const isWknd = isWeekend(day);
								return (
									<div
										key={day.toISOString()}
										className={cn(
											"flex-shrink-0 border-r h-full",
											isToday &&
												"bg-blue-50/30 border-l border-blue-200 border-r-blue-200",
											isWknd && !isToday && "bg-muted/10",
										)}
										style={{ width: CELL_WIDTH }}
									/>
								);
							})}
						</div>

						{/* Today Line */}
						{days.some((d) => isSameDay(d, new Date())) && (
							<div
								className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-20 pointer-events-none"
								style={{
									left:
										differenceInDays(new Date(), startDateRange) * CELL_WIDTH +
										CELL_WIDTH / 2,
								}}
							/>
						)}

						{/* Rows */}
						{lists.map((list) => {
							const listCards = cards.filter((c) => c.listId === list.id);
							return (
								<div
									key={list.id}
									className="border-b relative"
									style={{ height: ROW_HEIGHT }}
								>
									{listCards.map((card) => {
										const style = getCardStyle(card);
										if (!style) return null;
										const isDragging = draggingCard?.id === card.id;

										return (
											<div
												key={card.id}
												className={cn(
													"absolute top-1 bottom-1 bg-blue-500 rounded text-xs text-white px-2 flex items-center overflow-hidden cursor-move group hover:bg-blue-600 transition-colors z-10",
													isDragging && "opacity-70 ring-2 ring-blue-300",
												)}
												style={style}
												title={`${card.title} (${card.startDate ? formatDate(new Date(card.startDate), "dd/MM/yyyy") : ""} - ${card.endDate ? formatDate(new Date(card.endDate), "dd/MM/yyyy") : ""})`}
												onMouseDown={(e) => handleMouseDown(e, card, "move")}
											>
												<span className="truncate">{card.title}</span>
												{/* Resize handle */}
												<div
													className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity z-20"
													onMouseDown={(e) =>
														handleMouseDown(e, card, "resize")
													}
												/>
											</div>
										);
									})}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
