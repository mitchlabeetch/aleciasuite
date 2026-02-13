"use client";

/**
 * Calendar Page - Admin Panel
 *
 * Displays synced calendar events from Microsoft 365 and Google Calendar.
 * Allows viewing, filtering, and managing calendar events.
 *
 * @see Phase 2.3: Calendar Sync
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Calendar as CalendarIcon,
	RefreshCw,
	Clock,
	MapPin,
	Users,
	Video,
	Link2,
	ChevronLeft,
	ChevronRight,
	Settings,
	Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getUpcomingEvents, getSyncState, integrations } from "@/actions";

// Type for calendar events from server actions
type CalendarEvent = {
	id: string;
	title: string;
	description?: string;
	startDateTime: number;
	endDateTime: number;
	isAllDay?: boolean;
	location?: string;
	source: "microsoft" | "google" | "manual";
	organizer?: { name?: string; email: string };
	attendees?: Array<{
		name?: string;
		email: string;
		responseStatus?: string;
	}>;
	isOnlineMeeting?: boolean;
	onlineMeetingUrl?: string;
	status?: "confirmed" | "tentative" | "cancelled";
};

export default function CalendarPage() {
	const { toast } = useToast();
	const router = useRouter();
	const [currentDate, setCurrentDate] = useState(new Date());
	const [isSyncing, setIsSyncing] = useState<"microsoft" | "google" | null>(
		null,
	);

	// Get upcoming events
	const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[] | null>(null);

	// Get sync states
	const [microsoftSyncState, setMicrosoftSyncState] = useState<any>(null);
	const [googleSyncState, setGoogleSyncState] = useState<any>(null);

	// Load data on mount
	useEffect(() => {
		getUpcomingEvents(50).then(setUpcomingEvents);
		getSyncState("microsoft").then(setMicrosoftSyncState);
		getSyncState("google").then(setGoogleSyncState);
	}, []);

	// Handle sync
	const handleSync = async (provider: "microsoft" | "google") => {
		setIsSyncing(provider);
		try {
			const now = new Date();
			const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

			// Note: sync functions require date ranges
			const result = await (provider === "microsoft"
				? integrations.fetchMicrosoftCalendarEvents({
						startDate: now.getTime(),
						endDate: thirtyDaysLater.getTime()
					})
				: integrations.fetchGoogleCalendarEvents({
						startDate: now.getTime(),
						endDate: thirtyDaysLater.getTime()
					}));

			toast({
				title: "Synchronisation terminee",
				description: `Calendrier synchronisé.`,
			});
			// Refresh data
			getUpcomingEvents(50).then(setUpcomingEvents);
			getSyncState(provider).then((state) => {
				if (provider === "microsoft") setMicrosoftSyncState(state);
				else setGoogleSyncState(state);
			});
			router.refresh();
		} catch (_err) {
			toast({
				title: "Erreur",
				description: "Impossible de synchroniser le calendrier.",
				variant: "destructive",
			});
		} finally {
			setIsSyncing(null);
		}
	};

	// Navigation
	const goToToday = () => setCurrentDate(new Date());
	const goToPrevWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() - 7);
		setCurrentDate(newDate);
	};
	const goToNextWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() + 7);
		setCurrentDate(newDate);
	};

	// Filter events for current week
	const startOfWeek = new Date(currentDate);
	startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
	startOfWeek.setHours(0, 0, 0, 0);

	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 7);

	const weekEvents =
		upcomingEvents?.filter((event) => {
			const eventDate = new Date(event.startDateTime);
			return eventDate >= startOfWeek && eventDate < endOfWeek;
		}) || [];

	// Group events by day
	const eventsByDay: Record<string, CalendarEvent[]> = {};
	weekEvents.forEach((event) => {
		const dayKey = new Date(event.startDateTime).toISOString().split("T")[0];
		if (!eventsByDay[dayKey]) {
			eventsByDay[dayKey] = [];
		}
		eventsByDay[dayKey].push(event);
	});

	// Format time
	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Format date
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long",
		});
	};

	// Get source badge color
	const getSourceBadge = (source: string) => {
		switch (source) {
			case "microsoft":
				return (
					<Badge variant="outline" className="bg-blue-500/10 text-blue-500">
						Microsoft
					</Badge>
				);
			case "google":
				return (
					<Badge variant="outline" className="bg-green-500/10 text-green-500">
						Google
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="bg-gray-500/10 text-gray-500">
						Manuel
					</Badge>
				);
		}
	};

	// Get days of current week
	const weekDays: Date[] = [];
	for (let i = 0; i < 7; i++) {
		const day = new Date(startOfWeek);
		day.setDate(startOfWeek.getDate() + i);
		weekDays.push(day);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<CalendarIcon className="h-8 w-8" />
						Calendrier
					</h1>
					<p className="text-muted-foreground mt-1">
						Evenements synchronises depuis Microsoft 365 et Google Calendar
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href="/admin/settings/integrations">
							<Settings className="h-4 w-4 mr-2" />
							Integrations
						</Link>
					</Button>
				</div>
			</div>

			{/* Sync Status Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Microsoft Sync Status */}
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded bg-[#0078d4]/10">
									<svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
										<path d="M11 11H0V0H11V11Z" fill="#F25022" />
										<path d="M23 11H12V0H23V11Z" fill="#7FBA00" />
										<path d="M11 23H0V12H11V23Z" fill="#00A4EF" />
										<path d="M23 23H12V12H23V23Z" fill="#FFB900" />
									</svg>
								</div>
								<CardTitle className="text-base">Microsoft 365</CardTitle>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleSync("microsoft")}
								disabled={isSyncing !== null}
							>
								{isSyncing === "microsoft" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4" />
								)}
								<span className="ml-2">Sync</span>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="h-3 w-3" />
							{microsoftSyncState?.lastSyncedAt ? (
								<span>
									Derniere sync:{" "}
									{new Date(microsoftSyncState.lastSyncedAt).toLocaleString(
										"fr-FR",
										{ dateStyle: "short", timeStyle: "short" },
									)}
								</span>
							) : (
								<span>Jamais synchronise</span>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Google Sync Status */}
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded bg-[#4285F4]/10">
									<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</svg>
								</div>
								<CardTitle className="text-base">Google Calendar</CardTitle>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleSync("google")}
								disabled={isSyncing !== null}
							>
								{isSyncing === "google" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4" />
								)}
								<span className="ml-2">Sync</span>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="h-3 w-3" />
							{googleSyncState?.lastSyncedAt ? (
								<span>
									Derniere sync:{" "}
									{new Date(googleSyncState.lastSyncedAt).toLocaleString(
										"fr-FR",
										{ dateStyle: "short", timeStyle: "short" },
									)}
								</span>
							) : (
								<span>Jamais synchronise</span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Calendar View */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Semaine du {formatDate(startOfWeek)}</CardTitle>
							<CardDescription>
								{weekEvents.length} evenement
								{weekEvents.length !== 1 ? "s" : ""} cette semaine
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="icon" onClick={goToPrevWeek}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="sm" onClick={goToToday}>
								Aujourd&apos;hui
							</Button>
							<Button variant="outline" size="icon" onClick={goToNextWeek}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="list" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="list">Liste</TabsTrigger>
							<TabsTrigger value="week">Semaine</TabsTrigger>
						</TabsList>

						{/* List View */}
						<TabsContent value="list" className="space-y-4">
							{weekDays.map((day) => {
								const dayKey = day.toISOString().split("T")[0];
								const dayEvents = eventsByDay[dayKey] || [];
								const isToday =
									day.toDateString() === new Date().toDateString();

								return (
									<div key={dayKey} className="space-y-2">
										<div
											className={`text-sm font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}
										>
											{formatDate(day)}
											{isToday && (
												<Badge className="ml-2" variant="secondary">
													Aujourd&apos;hui
												</Badge>
											)}
										</div>
										{dayEvents.length > 0 ? (
											<div className="space-y-2 pl-4 border-l-2 border-border">
												{dayEvents.map((event) => (
													<div
														key={event.id}
														className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
													>
														<div className="flex items-start justify-between gap-2">
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-2">
																	<h4 className="font-medium truncate">
																		{event.title}
																	</h4>
																	{getSourceBadge(event.source)}
																	{event.status === "tentative" && (
																		<Badge variant="outline">Provisoire</Badge>
																	)}
																	{event.status === "cancelled" && (
																		<Badge variant="destructive">Annule</Badge>
																	)}
																</div>
																<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
																	<span className="flex items-center gap-1">
																		<Clock className="h-3 w-3" />
																		{event.isAllDay
																			? "Toute la journee"
																			: `${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}`}
																	</span>
																	{event.location && (
																		<span className="flex items-center gap-1">
																			<MapPin className="h-3 w-3" />
																			{event.location}
																		</span>
																	)}
																	{event.attendees &&
																		event.attendees.length > 0 && (
																			<span className="flex items-center gap-1">
																				<Users className="h-3 w-3" />
																				{event.attendees.length} participant
																				{event.attendees.length !== 1
																					? "s"
																					: ""}
																			</span>
																		)}
																</div>
															</div>
															<div className="flex items-center gap-1">
																{event.isOnlineMeeting &&
																	event.onlineMeetingUrl && (
																		<Button
																			size="sm"
																			variant="ghost"
																			className="h-8"
																			asChild
																		>
																			<a
																				href={event.onlineMeetingUrl}
																				target="_blank"
																				rel="noopener noreferrer"
																			>
																				<Video className="h-4 w-4 mr-1" />
																				Rejoindre
																			</a>
																		</Button>
																	)}
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<p className="text-sm text-muted-foreground pl-4 border-l-2 border-border py-2">
												Aucun evenement
											</p>
										)}
									</div>
								);
							})}
						</TabsContent>

						{/* Week View (simplified grid) */}
						<TabsContent value="week">
							<div className="grid grid-cols-7 gap-2">
								{weekDays.map((day) => {
									const dayKey = day.toISOString().split("T")[0];
									const dayEvents = eventsByDay[dayKey] || [];
									const isToday =
										day.toDateString() === new Date().toDateString();

									return (
										<div
											key={dayKey}
											className={`min-h-[200px] p-2 rounded-lg border ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
										>
											<div
												className={`text-sm font-medium mb-2 ${isToday ? "text-primary" : ""}`}
											>
												{day.toLocaleDateString("fr-FR", {
													weekday: "short",
													day: "numeric",
												})}
											</div>
											<div className="space-y-1">
												{dayEvents.slice(0, 4).map((event) => (
													<div
														key={event.id}
														className={`text-xs p-1 rounded truncate ${
															event.source === "microsoft"
																? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
																: event.source === "google"
																	? "bg-green-500/10 text-green-700 dark:text-green-300"
																	: "bg-gray-500/10"
														}`}
														title={event.title}
													>
														{!event.isAllDay && (
															<span className="font-medium">
																{formatTime(event.startDateTime)}{" "}
															</span>
														)}
														{event.title}
													</div>
												))}
												{dayEvents.length > 4 && (
													<div className="text-xs text-muted-foreground">
														+{dayEvents.length - 4} autres
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Empty State */}
			{upcomingEvents?.length === 0 && (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">Aucun evenement</h3>
						<p className="text-muted-foreground text-center max-w-md mb-4">
							Connectez votre calendrier Microsoft 365 ou Google Calendar pour
							voir vos evenements ici.
						</p>
						<Button asChild>
							<Link href="/admin/settings/integrations">
								<Link2 className="h-4 w-4 mr-2" />
								Configurer les integrations
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
