"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { useDeals } from "@/hooks/use-convex";
import { cn } from "@/lib/utils";
import type { ColabDeal } from "@/lib/types";
import {
	Briefcase,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Video,
	MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];

export function CalendarClient() {
	const { deals, isLoading } = useDeals();
	const [currentDate, setCurrentDate] = useState(new Date());

	// Get first and last day of current month for event query
	const monthStart = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		1,
	).getTime();
	const monthEnd = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth() + 1,
		0,
		23,
		59,
		59,
	).getTime();

	// TODO: Implement server action for calendar events
	// For now, use empty array as placeholder
	const calendarEvents: any[] = [];

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		// 0 = Sunday, 1 = Monday, etc.
		// We want 0 = Monday, 6 = Sunday for the grid
		const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
		return (day + 6) % 7;
	};

	const prevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const nextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const currentMonthName = MONTHS[currentDate.getMonth()];
	const currentYear = currentDate.getFullYear();
	const daysInMonth = getDaysInMonth(currentDate);
	const firstDay = getFirstDayOfMonth(currentDate);

	// Generate calendar grid cells
	const days: (number | null)[] = [];
	// Empty cells for previous month
	for (let i = 0; i < firstDay; i++) {
		days.push(null);
	}
	// Days of current month
	for (let i = 1; i <= daysInMonth; i++) {
		days.push(i);
	}

	// Filter deals for the displayed month
	const dealsInMonth = deals?.filter((deal: ColabDeal) => {
		if (!deal.expectedCloseDate) return false;
		const dealDate = new Date(deal.expectedCloseDate);
		return (
			dealDate.getMonth() === currentDate.getMonth() &&
			dealDate.getFullYear() === currentDate.getFullYear()
		);
	});

	const getDealsForDay = (day: number) => {
		return dealsInMonth?.filter((deal: ColabDeal) => {
			const dealDate = new Date(deal.expectedCloseDate!); // Checked in filter above
			return dealDate.getDate() === day;
		});
	};

	// Get calendar events for a specific day
	const getEventsForDay = (day: number) => {
		if (!calendarEvents) return [];
		return calendarEvents.filter((event: any) => {
			const eventDate = new Date(event.startDateTime);
			return eventDate.getDate() === day;
		});
	};

	// Format event time
	const formatEventTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get source color
	const getSourceColor = (source: string) => {
		switch (source) {
			case "google":
				return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
			case "microsoft":
				return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
			default:
				return "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300";
		}
	};

	return (
		<AppShell>
			<div className="flex flex-col h-full space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CalendarIcon className="h-6 w-6 text-primary" />
						<h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
					</div>
					<div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
						<Button variant="ghost" size="icon" onClick={prevMonth}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="min-w-[140px] text-center font-medium">
							{currentMonthName} {currentYear}
						</span>
						<Button variant="ghost" size="icon" onClick={nextMonth}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
					<div className="w-[100px]" />{" "}
					{/* Spacer for centering alignment if needed, or actions */}
				</div>

				{isLoading ? (
					<div className="flex-1 flex items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : (
					<div className="flex-1 border rounded-lg overflow-hidden bg-background flex flex-col shadow-sm">
						{/* Weekday Headers */}
						<div className="grid grid-cols-7 border-b bg-muted/30">
							{WEEKDAYS.map((day) => (
								<div
									key={day}
									className="py-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0"
								>
									{day}
								</div>
							))}
						</div>

						{/* Calendar Grid */}
						<div className="grid grid-cols-7 flex-1 auto-rows-fr">
							{days.map((day, index) => {
								const dayDeals = day ? getDealsForDay(day) : [];
								const dayEvents = day ? getEventsForDay(day) : [];
								const isToday =
									day === new Date().getDate() &&
									currentDate.getMonth() === new Date().getMonth() &&
									currentDate.getFullYear() === new Date().getFullYear();

								return (
									<div
										key={`calendar-day-${index}-${day ?? "empty"}`}
										className={cn(
											"min-h-[120px] p-2 border-b border-r last:border-r-0 relative transition-colors hover:bg-muted/10",
											!day && "bg-muted/5",
											(index + 1) % 7 === 0 && "border-r-0", // Remove right border for last column
											index >= days.length - 7 && "border-b-0", // Remove bottom border for last row (approx)
										)}
									>
										{day && (
											<>
												<div
													className={cn(
														"flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1",
														isToday
															? "bg-primary text-primary-foreground"
															: "text-foreground",
													)}
												>
													{day}
												</div>
												<div className="space-y-1 overflow-y-auto max-h-[80px]">
													{/* Calendar Events */}
													{dayEvents.map((event: any) => (
														<div
															key={event.id}
															className={cn(
																"group flex flex-col gap-0.5 p-1.5 rounded-md border text-xs hover:opacity-80 transition-colors cursor-pointer",
																getSourceColor(event.source),
															)}
															title={`${event.title}${event.location ? ` - ${event.location}` : ""}`}
														>
															<div className="font-semibold truncate flex items-center gap-1">
																{event.isOnlineMeeting ? (
																	<Video className="h-3 w-3 opacity-70" />
																) : event.location ? (
																	<MapPin className="h-3 w-3 opacity-70" />
																) : (
																	<CalendarIcon className="h-3 w-3 opacity-70" />
																)}
																{event.title}
															</div>
															{!event.isAllDay && (
																<div className="text-[10px] opacity-80 pl-4">
																	{formatEventTime(event.startDateTime)}
																</div>
															)}
														</div>
													))}
													{/* Deals */}
													{dayDeals?.map(
														(deal: {
															id: string;
															title?: string;
															stage?: string;
															valuation?: string | number;
															dueDate?: number | null;
														}) => (
															<div
																key={deal.id}
																className="group flex flex-col gap-0.5 p-1.5 rounded-md bg-primary/10 border border-primary/20 text-xs hover:bg-primary/20 transition-colors cursor-pointer"
																title={`${deal.title} - ${deal.stage}`}
															>
																<div className="font-semibold truncate flex items-center gap-1">
																	<Briefcase className="h-3 w-3 opacity-70" />
																	{deal.title}
																</div>
																{deal.valuation && (
																	<div className="text-[10px] opacity-80 pl-4">
																		{deal.valuation}
																	</div>
																)}
																<Badge
																	variant="outline"
																	className="text-[10px] h-4 px-1 w-fit bg-background/50 border-primary/20"
																>
																	{deal.stage}
																</Badge>
															</div>
														),
													)}
												</div>
											</>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</AppShell>
	);
}
