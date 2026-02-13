"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useState } from "react";
import { Button } from "../tailwind/ui/button";
import { Card, CardContent } from "../tailwind/ui/card";
import { type DealStage } from "@/actions/deals";

interface Deal {
	id: string;
	title: string;
	stage: DealStage;
	amount?: string | null; // DB returns string | null
	createdAt: number;
	expectedCloseDate?: number;
}

interface CalendarViewProps {
	deals: Deal[];
	onDealClick?: (dealId: string) => void;
}

const stageColors: Record<string, string> = {
	sourcing: "bg-blue-500",
	qualification: "bg-cyan-500",
	initial_meeting: "bg-teal-500",
	analysis: "bg-indigo-500",
	valuation: "bg-violet-500",
	due_diligence: "bg-yellow-500",
	negotiation: "bg-orange-500",
	closing: "bg-purple-500",
	closed_won: "bg-green-500",
	closed_lost: "bg-red-500",
	// Legacy stages
	Lead: "bg-blue-500",
	"NDA Signed": "bg-cyan-500",
	"Offer Received": "bg-yellow-500",
	"Due Diligence": "bg-yellow-500",
	Closing: "bg-purple-500",
	completed: "bg-green-500",
};

import { fr } from "@/lib/i18n";

const DAYS = fr.calendar.days.short;
const MONTHS = fr.calendar.months.long;

export function CalendarView({ deals, onDealClick }: CalendarViewProps) {
	const [currentDate, setCurrentDate] = useState(new Date());

	const { calendarDays, dealsOnDate } = useMemo(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		// First day of month
		const firstDay = new Date(year, month, 1);
		const startingDay = firstDay.getDay();

		// Days in month
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		// Create calendar grid
		const days: (number | null)[] = [];

		// Empty cells before first day
		for (let i = 0; i < startingDay; i++) {
			days.push(null);
		}

		// Days of the month
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(i);
		}

		// Map deals to dates (by expectedCloseDate or createdAt)
		const dealsByDate: Record<string, Deal[]> = {};

		deals.forEach((deal) => {
			const dateToUse = deal.expectedCloseDate || deal.createdAt;
			const date = new Date(dateToUse);
			if (date.getFullYear() === year && date.getMonth() === month) {
				const key = date.getDate().toString();
				if (!dealsByDate[key]) {
					dealsByDate[key] = [];
				}
				dealsByDate[key].push(deal);
			}
		});

		return { calendarDays: days, dealsOnDate: dealsByDate };
	}, [currentDate, deals]);

	const goToPreviousMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const goToNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const goToToday = () => {
		setCurrentDate(new Date());
	};

	const today = new Date();
	const isCurrentMonth =
		today.getFullYear() === currentDate.getFullYear() &&
		today.getMonth() === currentDate.getMonth();

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={goToPreviousMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="icon" onClick={goToNextMonth}>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<h2 className="text-lg font-semibold ml-2">
						{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
					</h2>
				</div>
				<Button variant="outline" size="sm" onClick={goToToday}>
					{fr.calendar.today}
				</Button>
			</div>

			{/* Calendar Grid */}
			<div className="border rounded-lg overflow-hidden">
				{/* Day headers */}
				<div className="grid grid-cols-7 bg-muted/50">
					{DAYS.map((day) => (
						<div
							key={day}
							className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar cells */}
				<div className="grid grid-cols-7">
					{calendarDays.map((day, index) => {
						const dayDeals = day ? dealsOnDate[day.toString()] || [] : [];
						const isToday = isCurrentMonth && day === today.getDate();

						return (
							<div
								key={day !== null ? `day-${day}` : `empty-${index}`}
								className={`min-h-[100px] border-b border-r p-1 ${day ? "bg-background" : "bg-muted/20"}`}
							>
								{day && (
									<>
										<div
											className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
												isToday
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground"
											}`}
										>
											{day}
										</div>
										<div className="space-y-1">
											{dayDeals.slice(0, 3).map((deal) => (
												<Card
													key={deal.id}
													className="cursor-pointer hover:shadow-sm transition-shadow"
													onClick={() => onDealClick?.(deal.id)}
												>
													<CardContent className="p-1.5">
														<div className="flex items-center gap-1">
															<div
																className={`w-2 h-2 rounded-full ${stageColors[deal.stage] || "bg-gray-500"}`}
															/>
															<span className="text-xs truncate flex-1">
																{deal.title}
															</span>
														</div>
													</CardContent>
												</Card>
											))}
											{dayDeals.length > 3 && (
												<div className="text-xs text-muted-foreground text-center">
													+{dayDeals.length - 3} more
												</div>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
				{Object.entries(stageColors)
					.slice(0, 10)
					.map(([stage, color]) => (
						<div key={stage} className="flex items-center gap-1">
							<div className={`w-2 h-2 rounded-full ${color}`} />
							<span className="capitalize">{stage.replace(/_/g, " ")}</span>
						</div>
					))}
			</div>
		</div>
	);
}
