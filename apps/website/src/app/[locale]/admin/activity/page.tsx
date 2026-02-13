"use client";

/**
 * Activity Hub - Deal Activity Timeline
 *
 * Unified activity feed across all deals showing status changes, comments,
 * documents, meetings, and other events with real-time updates.
 *
 * Features:
 * - Timeline view of all deal activities
 * - Filter by deal, user, event type
 * - Real-time updates via Convex subscriptions
 * - Quick actions for common tasks
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDeals } from "@/actions";
import { pipeline } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
	Activity,
	ArrowRight,
	Briefcase,
	Building2,
	Calendar,
	FileText,
	Filter,
	Loader2,
	Mail,
	MessageSquare,
	Phone,
	Plus,
	RefreshCw,
	Users,
	X,
} from "lucide-react";

// Type to match pipeline.getAllEvents EventType param
type EventType = "status_change" | "note_added" | "document_uploaded" | "meeting_scheduled" | "email_sent" | "call_logged";

// Type definitions
interface ActivityEvent {
	_id: string;
	_creationTime: number;
	dealId?: string;
	companyId?: string;
	contactId?: string;
	eventType: string;
	title: string;
	description?: string;
	userId: string;
	metadata?: Record<string, unknown>;
	userName: string;
	userAvatar?: string;
	dealTitle?: string;
	companyName?: string;
}

interface ActiveUser {
	_id: string;
	name: string;
	avatarUrl?: string;
}

// Event type configuration
const EVENT_TYPES = {
	status_change: {
		label: "Changement de statut",
		icon: ArrowRight,
		color: "bg-blue-500/10 text-blue-600 border-blue-200",
	},
	note_added: {
		label: "Note ajoutée",
		icon: MessageSquare,
		color: "bg-purple-500/10 text-purple-600 border-purple-200",
	},
	document_uploaded: {
		label: "Document",
		icon: FileText,
		color: "bg-green-500/10 text-green-600 border-green-200",
	},
	meeting_scheduled: {
		label: "Réunion",
		icon: Calendar,
		color: "bg-orange-500/10 text-orange-600 border-orange-200",
	},
	email_sent: {
		label: "Email",
		icon: Mail,
		color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
	},
	call_logged: {
		label: "Appel",
		icon: Phone,
		color: "bg-pink-500/10 text-pink-600 border-pink-200",
	},
} as const;

// Format relative time
function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 7) {
		return new Date(timestamp).toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "short",
			year: days > 365 ? "numeric" : undefined,
		});
	}
	if (days > 0) return `il y a ${days}j`;
	if (hours > 0) return `il y a ${hours}h`;
	if (minutes > 0) return `il y a ${minutes}min`;
	return "à l'instant";
}

// Get user initials
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

// Activity card component
function ActivityCard({ event }: { event: ActivityEvent }) {
	const config = EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || {
		label: event.eventType,
		icon: Activity,
		color: "bg-gray-500/10 text-gray-600 border-gray-200",
	};
	const Icon = config.icon;

	return (
		<div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
			{/* Icon */}
			<div
				className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}
			>
				<Icon className="h-5 w-5" />
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="font-medium text-sm">{event.title}</p>
						{event.description && (
							<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
								{event.description}
							</p>
						)}
					</div>
					<span className="text-xs text-muted-foreground whitespace-nowrap">
						{formatRelativeTime(event._creationTime)}
					</span>
				</div>

				{/* Metadata */}
				<div className="flex items-center gap-3 mt-2 flex-wrap">
					{/* User */}
					<div className="flex items-center gap-1.5">
						<Avatar className="h-5 w-5">
							{event.userAvatar && <AvatarImage src={event.userAvatar} />}
							<AvatarFallback className="text-[8px] bg-primary/10">
								{getInitials(event.userName)}
							</AvatarFallback>
						</Avatar>
						<span className="text-xs text-muted-foreground">
							{event.userName}
						</span>
					</div>

					{/* Deal */}
					{event.dealTitle && (
						<Badge variant="outline" className="text-xs gap-1">
							<Briefcase className="h-3 w-3" />
							{event.dealTitle}
						</Badge>
					)}

					{/* Company */}
					{event.companyName && (
						<Badge variant="outline" className="text-xs gap-1">
							<Building2 className="h-3 w-3" />
							{event.companyName}
						</Badge>
					)}

					{/* Event type */}
					<Badge variant="secondary" className="text-xs">
						{config.label}
					</Badge>
				</div>
			</div>
		</div>
	);
}

// Log event dialog
function LogEventDialog({ onSuccess }: { onSuccess: () => void }) {
	const router = useRouter();
	const { toast } = useToast();
	const [deals, setDeals] = useState<any[] | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		getDeals().then(setDeals);
	}, []);

	const [formData, setFormData] = useState({
		eventType: "note_added" as keyof typeof EVENT_TYPES,
		title: "",
		description: "",
		dealId: "" as string,
	});

	const handleSubmit = async () => {
		if (!formData.title.trim()) {
			toast({
				title: "Erreur",
				description: "Le titre est requis.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await pipeline.logEvent({
				eventType: formData.eventType,
				title: formData.title,
				description: formData.description || undefined,
				dealId: formData.dealId ?? "",
			});

			toast({
				title: "Événement enregistré",
				description: "L'activité a été ajoutée à la timeline.",
			});

			setFormData({
				eventType: "note_added",
				title: "",
				description: "",
				dealId: "",
			});
			setIsOpen(false);
			onSuccess();
			router.refresh();
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible d'enregistrer l'événement.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Ajouter une activité
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nouvelle activité</DialogTitle>
					<DialogDescription>
						Enregistrez une activité dans la timeline.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Event Type */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Type d&apos;événement
						</label>
						<Select
							value={formData.eventType}
							onValueChange={(value) =>
								setFormData((prev) => ({
									...prev,
									eventType: value as keyof typeof EVENT_TYPES,
								}))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(EVENT_TYPES).map(([key, config]) => (
									<SelectItem key={key} value={key}>
										{config.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Deal */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Deal (optionnel)
						</label>
						<Select
							value={formData.dealId}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, dealId: value }))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Sélectionner un deal..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Aucun deal</SelectItem>
								{deals?.map((deal: { _id: string; title: string }) => (
									<SelectItem key={deal._id} value={deal._id}>
										{deal.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Title */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Titre <span className="text-destructive">*</span>
						</label>
						<Input
							placeholder="Ex: Appel de suivi avec le dirigeant"
							value={formData.title}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, title: e.target.value }))
							}
						/>
					</div>

					{/* Description */}
					<div>
						<label className="text-sm font-medium mb-2 block">
							Description (optionnelle)
						</label>
						<Textarea
							placeholder="Détails de l'activité..."
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
						Enregistrer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function ActivityPage() {
	const router = useRouter();
	const { toast: _toast } = useToast();

	// Filters
	const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
	const [userFilter, setUserFilter] = useState<string>("all");
	const [dealFilter, setDealFilter] = useState<string>("all");

	// Data
	const [deals, setDeals] = useState<any[] | null>(null);
	const [users, setUsers] = useState<any[] | null>(null);
	const [eventsResult, setEventsResult] = useState<any | null>(null);

	useEffect(() => {
		getDeals().then(setDeals);
	}, []);

	useEffect(() => {
		pipeline.getActiveUsers().then(setUsers);
	}, []);

	useEffect(() => {
		pipeline.getAllEvents({
			limit: 100,
			eventTypes: eventTypeFilter !== "all" ? [eventTypeFilter as EventType] : undefined,
			userId: userFilter !== "all" ? userFilter : undefined,
			dealId: dealFilter !== "all" ? dealFilter : undefined,
		}).then(setEventsResult);
	}, [eventTypeFilter, userFilter, dealFilter]);

	const events = eventsResult?.events ?? [];
	const total = eventsResult?.total ?? 0;

	// Count active filters
	const activeFilters = [
		eventTypeFilter !== "all",
		userFilter !== "all",
		dealFilter !== "all",
	].filter(Boolean).length;

	const clearFilters = () => {
		setEventTypeFilter("all");
		setUserFilter("all");
		setDealFilter("all");
	};

	// Group events by date
	const groupedEvents: Record<string, ActivityEvent[]> = {};
	events.forEach((event: ActivityEvent) => {
		const date = new Date(event._creationTime).toLocaleDateString("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long",
		});
		if (!groupedEvents[date]) {
			groupedEvents[date] = [];
		}
		groupedEvents[date].push(event);
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Activity className="h-8 w-8 text-primary" />
						Activity Hub
					</h1>
					<p className="text-muted-foreground">
						Suivez toutes les activités sur vos deals en temps réel.
					</p>
				</div>
				<LogEventDialog onSuccess={() => {}} />
			</div>

			{/* Stats */}
			<div className="grid grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
								<Activity className="h-5 w-5 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{total}</p>
								<p className="text-sm text-muted-foreground">
									Activités totales
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
								<Briefcase className="h-5 w-5 text-green-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{deals?.length ?? 0}</p>
								<p className="text-sm text-muted-foreground">Deals actifs</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
								<Users className="h-5 w-5 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">{users?.length ?? 0}</p>
								<p className="text-sm text-muted-foreground">
									Utilisateurs actifs
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
								<Calendar className="h-5 w-5 text-orange-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{Object.keys(groupedEvents).length}
								</p>
								<p className="text-sm text-muted-foreground">
									Jours d&apos;activité
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Filter className="h-4 w-4" />
							Filtres
						</div>

						{/* Event Type Filter */}
						<Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
							<SelectTrigger className="w-45">
								<SelectValue placeholder="Type d'événement" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les types</SelectItem>
								{Object.entries(EVENT_TYPES).map(([key, config]) => (
									<SelectItem key={key} value={key}>
										{config.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* User Filter */}
						<Select value={userFilter} onValueChange={setUserFilter}>
							<SelectTrigger className="w-45">
								<SelectValue placeholder="Utilisateur" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les utilisateurs</SelectItem>
								{users?.map((user: ActiveUser) => (
									<SelectItem key={user._id} value={user._id}>
										{user.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Deal Filter */}
						<Select value={dealFilter} onValueChange={setDealFilter}>
							<SelectTrigger className="w-45">
								<SelectValue placeholder="Deal" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les deals</SelectItem>
								{deals?.map((deal: { _id: string; title: string }) => (
									<SelectItem key={deal._id} value={deal._id}>
										{deal.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Clear filters */}
						{activeFilters > 0 && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								<X className="h-4 w-4 mr-1" />
								Effacer ({activeFilters})
							</Button>
						)}

						<div className="flex-1" />

						{/* Refresh indicator */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<RefreshCw className="h-3 w-3 animate-pulse" />
							Temps réel
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Timeline */}
			{eventsResult === undefined ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : events.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<p className="text-lg font-medium">Aucune activité</p>
						<p className="text-muted-foreground mb-4">
							{activeFilters > 0
								? "Aucune activité ne correspond aux filtres sélectionnés."
								: "Les activités sur vos deals apparaîtront ici."}
						</p>
						{activeFilters > 0 && (
							<Button variant="outline" onClick={clearFilters}>
								Effacer les filtres
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{Object.entries(groupedEvents).map(([date, dateEvents]) => (
						<div key={date}>
							{/* Date header */}
							<div className="flex items-center gap-3 mb-3">
								<div className="h-px flex-1 bg-border" />
								<span className="text-sm font-medium text-muted-foreground capitalize">
									{date}
								</span>
								<div className="h-px flex-1 bg-border" />
							</div>

							{/* Events for this date */}
							<div className="space-y-3">
								{dateEvents.map((event: ActivityEvent) => (
									<ActivityCard key={event._id} event={event} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
