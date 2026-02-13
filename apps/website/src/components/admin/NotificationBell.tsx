"use client";

/**
 * NotificationBell - Header notification bell with dropdown
 *
 * Features:
 * - Unread count badge
 * - Real-time updates via server actions
 * - Notification list with mark as read
 * - Link to full notifications page
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions";
import { Button } from "@/components/ui/button";

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
	X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

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

// Get initials from name
function _getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

// Format relative time
function formatRelativeTime(timestamp: number | Date): string {
	const now = Date.now();
	const time = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
	const diff = now - time;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}j`;
	if (hours > 0) return `${hours}h`;
	if (minutes > 0) return `${minutes}m`;
	return "maintenant";
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

// Individual notification item
function NotificationItem({
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
			className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
				!notification.isRead ? "bg-primary/5" : ""
			}`}
			onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
		>
			{/* Icon */}
			<div
				className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}
			>
				<Icon className="h-4 w-4" />
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
					{getNotificationMessage(notification)}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					{formatRelativeTime(notification.createdAt)}
				</p>
			</div>

			{/* Unread indicator */}
			{!notification.isRead && (
				<div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
			)}
		</div>
	);
}

export function NotificationBell() {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [notifications, setNotifications] = useState<Notification[] | null>(null);
	const [unreadCount, setUnreadCount] = useState<number>(0);

	// Load data on mount and when dropdown opens
	useEffect(() => {
		if (isOpen) {
			getNotifications({ limit: 10 }).then(setNotifications);
			getUnreadCount().then(setUnreadCount);
		}
	}, [isOpen]);

	// Initial load
	useEffect(() => {
		getUnreadCount().then(setUnreadCount);
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleMarkAsRead = async (notificationId: string) => {
		try {
			await markAsRead(notificationId);
			// Refresh data
			getNotifications({ limit: 10 }).then(setNotifications);
			getUnreadCount().then(setUnreadCount);
			router.refresh();
		} catch (error) {
			console.error("Failed to mark as read:", error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead();
			// Refresh data
			getNotifications({ limit: 10 }).then(setNotifications);
			getUnreadCount().then(setUnreadCount);
			router.refresh();
		} catch (error) {
			console.error("Failed to mark all as read:", error);
		}
	};

	const notificationList = (notifications || []) as Notification[];
	const count = unreadCount || 0;

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Bell button */}
			<Button
				variant="ghost"
				size="icon"
				className="relative"
				onClick={() => setIsOpen(!isOpen)}
			>
				<Bell className="h-5 w-5" />
				{count > 0 && (
					<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
						{count > 9 ? "9+" : count}
					</span>
				)}
			</Button>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
						<h3 className="font-semibold">Notifications</h3>
						<div className="flex items-center gap-2">
							{count > 0 && (
								<Button
									variant="ghost"
									size="sm"
									className="text-xs h-7"
									onClick={handleMarkAllAsRead}
								>
									<CheckCheck className="h-3 w-3 mr-1" />
									Tout lire
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => setIsOpen(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Notification list */}
					<div className="max-h-[400px] overflow-y-auto">
						{notifications === null ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : notificationList.length === 0 ? (
							<div className="py-8 text-center">
								<Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">
									Aucune notification
								</p>
							</div>
						) : (
							<div className="divide-y">
								{notificationList.map((notification) => (
									<NotificationItem
										key={notification.id}
										notification={notification}
										onMarkAsRead={handleMarkAsRead}
									/>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					{notificationList.length > 0 && (
						<div className="border-t p-2">
							<Link
								href="/admin/notifications"
								className="block w-full text-center text-sm text-primary hover:underline py-2"
								onClick={() => setIsOpen(false)}
							>
								Voir toutes les notifications
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
