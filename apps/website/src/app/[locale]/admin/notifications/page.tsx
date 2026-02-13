"use client";

/**
 * Notifications Page
 *
 * Full notification management with:
 * - All notifications list
 * - Filter by read/unread
 * - Digest preferences management
 * - Mark as read actions
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
	Bell,
	Check,
	CheckCheck,
	Briefcase,
	MessageSquare,
	FileSignature,
	AtSign,
	CheckSquare,
	ArrowRight,
	Loader2,
	Mail,
	Settings,
} from "lucide-react";
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	getDigestPreferences,
	updateDigestPreferences,
	sendTestDigest,
} from "@/actions";

// Type definitions
interface Notification {
	id: string;
	createdAt: Date;
	recipientId: string;
	triggerId?: string;
	type: string;
	entityType: string;
	entityId: string;
	isRead: boolean;
	payload?: Record<string, unknown>;
	triggerUserName?: string;
	triggerUserAvatar?: string;
}

interface DigestPreferences {
	enabled: boolean;
	frequency: "daily" | "weekly" | "none";
	includeDeals: boolean;
	includeComments: boolean;
	includeMentions: boolean;
	includeSignatures: boolean;
	includeTasks: boolean;
}

// Notification type configuration
const NOTIFICATION_CONFIG: Record<
	string,
	{ icon: React.ElementType; color: string; label: string }
> = {
	mention: {
		icon: AtSign,
		color: "bg-blue-100 text-blue-600",
		label: "Mention",
	},
	task_assigned: {
		icon: CheckSquare,
		color: "bg-purple-100 text-purple-600",
		label: "Tâche assignée",
	},
	task_completed: {
		icon: Check,
		color: "bg-green-100 text-green-600",
		label: "Tâche terminée",
	},
	deal_stage_changed: {
		icon: ArrowRight,
		color: "bg-orange-100 text-orange-600",
		label: "Changement de stage",
	},
	deal_assigned: {
		icon: Briefcase,
		color: "bg-indigo-100 text-indigo-600",
		label: "Deal assigné",
	},
	comment_added: {
		icon: MessageSquare,
		color: "bg-cyan-100 text-cyan-600",
		label: "Nouveau commentaire",
	},
	signature_requested: {
		icon: FileSignature,
		color: "bg-pink-100 text-pink-600",
		label: "Signature requise",
	},
	signature_completed: {
		icon: FileSignature,
		color: "bg-green-100 text-green-600",
		label: "Document signé",
	},
};

// Format date
function formatDate(timestamp: number | Date): string {
	const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (24 * 60 * 60 * 1000));

	if (days === 0) {
		return date.toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	} else if (days === 1) {
		return "Hier";
	} else if (days < 7) {
		return date.toLocaleDateString("fr-FR", { weekday: "long" });
	} else {
		return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
	}
}

// Get notification message
function getNotificationMessage(notification: Notification): string {
	const { type, entityType, payload } = notification;
	const triggerName = notification.triggerUserName || "Quelqu'un";

	switch (type) {
		case "mention":
			return `${triggerName} vous a mentionné dans un ${entityType}`;
		case "task_assigned":
			return `${triggerName} vous a assigné une tâche`;
		case "task_completed":
			return `${triggerName} a terminé une tâche`;
		case "deal_stage_changed":
			return `Deal passé à l'étape ${(payload as { newStage?: string })?.newStage || "suivante"}`;
		case "deal_assigned":
			return `${triggerName} vous a assigné un deal`;
		case "comment_added":
			return `${triggerName} a commenté sur un ${entityType}`;
		case "signature_requested":
			return `${triggerName} demande votre signature`;
		case "signature_completed":
			return `Document signé par ${triggerName}`;
		default:
			return `Nouvelle notification: ${type}`;
	}
}

// Notification card component
function NotificationCard({
	notification,
	onMarkAsRead,
}: {
	notification: Notification;
	onMarkAsRead: (id: string) => void;
}) {
	const config = NOTIFICATION_CONFIG[notification.type] || {
		icon: Bell,
		color: "bg-gray-100 text-gray-600",
		label: notification.type,
	};
	const Icon = config.icon;

	return (
		<div
			className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
				!notification.isRead
					? "bg-primary/5 border-primary/20"
					: "bg-card hover:bg-muted/50"
			}`}
		>
			{/* Icon */}
			<div
				className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}
			>
				<Icon className="h-5 w-5" />
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className={`${!notification.isRead ? "font-medium" : ""}`}>
							{getNotificationMessage(notification)}
						</p>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="secondary" className="text-xs">
								{config.label}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{formatDate(notification.createdAt)}
							</span>
						</div>
					</div>
					{!notification.isRead && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onMarkAsRead(notification.id)}
						>
							<Check className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export default function NotificationsPage() {
	const { toast } = useToast();
	const [selectedTab, setSelectedTab] = useState("all");

	// State
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [digestPrefs, setDigestPrefs] = useState<DigestPreferences | null>(null);
	const [loading, setLoading] = useState(true);

	// Load data
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const [notifs, count, prefs] = await Promise.all([
					getNotifications({ limit: 100 }),
					getUnreadCount(),
					getDigestPreferences(),
				]);
				setNotifications(notifs as Notification[]);
				setUnreadCount(count);
				setDigestPrefs(prefs as DigestPreferences);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	const handleMarkAsRead = async (notificationId: string) => {
		try {
			await markAsRead(notificationId);
			// Re-fetch data
			const [notifs, count] = await Promise.all([
				getNotifications({ limit: 100 }),
				getUnreadCount(),
			]);
			setNotifications(notifs as Notification[]);
			setUnreadCount(count);
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de marquer comme lu.",
				variant: "destructive",
			});
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead();
			// Re-fetch data
			const [notifs, count] = await Promise.all([
				getNotifications({ limit: 100 }),
				getUnreadCount(),
			]);
			setNotifications(notifs as Notification[]);
			setUnreadCount(count);
			toast({ title: "Toutes les notifications marquées comme lues" });
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de marquer comme lues.",
				variant: "destructive",
			});
		}
	};

	const handleUpdateDigestPrefs = async (
		enabled: boolean,
		frequency: "daily" | "weekly" | "none",
	) => {
		try {
			await updateDigestPreferences({ enabled, frequency });
			const prefs = await getDigestPreferences();
			setDigestPrefs(prefs as DigestPreferences);
			toast({ title: "Préférences mises à jour" });
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de mettre à jour les préférences.",
				variant: "destructive",
			});
		}
	};

	const handleSendTestDigest = async () => {
		try {
			const result = await sendTestDigest();
			if (result.success) {
				toast({
					title: "Email de test envoyé",
					description: result.message,
				});
			} else {
				toast({
					title: "Information",
					description: result.message || "Service email non configuré.",
				});
			}
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible d'envoyer l'email de test.",
				variant: "destructive",
			});
		}
	};

	const notificationList = notifications;
	const unreadNotifications = notificationList.filter((n) => !n.isRead);
	const readNotifications = notificationList.filter((n) => n.isRead);

	const displayedNotifications =
		selectedTab === "unread"
			? unreadNotifications
			: selectedTab === "read"
				? readNotifications
				: notificationList;

	const prefs = digestPrefs;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Bell className="h-8 w-8 text-primary" />
						Notifications
					</h1>
					<p className="text-muted-foreground">
						Gérez vos notifications et préférences de digest.
					</p>
				</div>
				{unreadCount > 0 && (
					<Button onClick={handleMarkAllAsRead}>
						<CheckCheck className="h-4 w-4 mr-2" />
						Tout marquer comme lu
					</Button>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{notificationList.length}</p>
						<p className="text-sm text-muted-foreground">Total</p>
					</CardContent>
				</Card>
				<Card className={unreadCount ? "border-primary/50 bg-primary/5" : ""}>
					<CardContent className="pt-4">
						<p
							className={`text-2xl font-bold ${unreadCount ? "text-primary" : ""}`}
						>
							{unreadCount}
						</p>
						<p className="text-sm text-muted-foreground">Non lues</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-4">
						<p className="text-2xl font-bold">{readNotifications.length}</p>
						<p className="text-sm text-muted-foreground">Lues</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Notifications List */}
				<div className="lg:col-span-2 space-y-4">
					<Tabs value={selectedTab} onValueChange={setSelectedTab}>
						<TabsList>
							<TabsTrigger value="all">
								Toutes ({notificationList.length})
							</TabsTrigger>
							<TabsTrigger value="unread">
								Non lues ({unreadNotifications.length})
							</TabsTrigger>
							<TabsTrigger value="read">
								Lues ({readNotifications.length})
							</TabsTrigger>
						</TabsList>

						<TabsContent value={selectedTab} className="mt-4">
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : displayedNotifications.length === 0 ? (
								<Card>
									<CardContent className="py-12 text-center">
										<Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<p className="text-lg font-medium">Aucune notification</p>
										<p className="text-muted-foreground">
											{selectedTab === "unread"
												? "Vous êtes à jour !"
												: "Les notifications apparaîtront ici."}
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="space-y-3">
									{displayedNotifications.map((notification) => (
										<NotificationCard
											key={notification.id}
											notification={notification}
											onMarkAsRead={handleMarkAsRead}
										/>
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>

				{/* Digest Settings */}
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Email Digest
							</CardTitle>
							<CardDescription>
								Recevez un résumé de l&apos;activité par email.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Enable/Disable */}
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">Activer le digest</p>
									<p className="text-sm text-muted-foreground">
										Recevoir des résumés par email
									</p>
								</div>
								<Switch
									checked={prefs?.enabled ?? true}
									onCheckedChange={(checked) =>
										handleUpdateDigestPrefs(
											checked,
											prefs?.frequency || "daily",
										)
									}
								/>
							</div>

							{/* Frequency */}
							<div>
								<p className="font-medium mb-2">Fréquence</p>
								<Select
									value={prefs?.frequency || "daily"}
									onValueChange={(value: "daily" | "weekly" | "none") =>
										handleUpdateDigestPrefs(prefs?.enabled ?? true, value)
									}
									disabled={!prefs?.enabled}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="daily">Quotidien</SelectItem>
										<SelectItem value="weekly">Hebdomadaire</SelectItem>
										<SelectItem value="none">Jamais</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Test button */}
							<Button
								variant="outline"
								className="w-full"
								onClick={handleSendTestDigest}
								disabled={!prefs?.enabled}
							>
								<Mail className="h-4 w-4 mr-2" />
								Envoyer un test
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5" />
								Contenu du Digest
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm">Nouveaux deals</span>
								<Switch checked={prefs?.includeDeals ?? true} disabled />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Mentions</span>
								<Switch checked={prefs?.includeMentions ?? true} disabled />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Tâches</span>
								<Switch checked={prefs?.includeTasks ?? true} disabled />
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Signatures</span>
								<Switch checked={prefs?.includeSignatures ?? true} disabled />
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Plus d&apos;options de personnalisation bientôt disponibles.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
