"use client";

/**
 * RoomPresence - Indicateurs de présence pour une room/document
 * Combinaison des avatars, curseurs et indicateurs de saisie
 */

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/tailwind/ui/tooltip";
import { cn } from "@/lib/utils";
import { Edit3, Eye, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface RoomUser {
	id: string;
	name: string;
	color: string;
	status?: "viewing" | "editing" | "idle";
	lastActive?: number;
}

interface RoomPresenceProps {
	users: RoomUser[];
	maxVisible?: number;
	showStatus?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeConfig = {
	sm: { avatar: "w-6 h-6 text-xs", icon: "h-2 w-2" },
	md: { avatar: "w-8 h-8 text-sm", icon: "h-2.5 w-2.5" },
	lg: { avatar: "w-10 h-10 text-base", icon: "h-3 w-3" },
};

const statusConfig = {
	viewing: { icon: Eye, color: "bg-blue-500", label: "Consulte" },
	editing: { icon: Edit3, color: "bg-green-500", label: "Modifie" },
	idle: { icon: null, color: "bg-gray-400", label: "Inactif" },
};

function getInitials(name: string): string {
	const parts = name.split(" ");
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

/**
 * Avatar utilisateur avec indicateur de statut
 */
function UserAvatar({
	user,
	size,
	showStatus,
}: {
	user: RoomUser;
	size: "sm" | "md" | "lg";
	showStatus: boolean;
}) {
	const config = sizeConfig[size];
	const status = user.status ? statusConfig[user.status] : null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<motion.div
					className="relative cursor-pointer"
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0, opacity: 0 }}
					whileHover={{ scale: 1.1, zIndex: 10 }}
					transition={{ type: "spring", stiffness: 500, damping: 30 }}
				>
					<div
						className={cn(
							config.avatar,
							"rounded-full flex items-center justify-center font-medium text-white ring-2 ring-background",
						)}
						style={{ backgroundColor: user.color }}
					>
						{getInitials(user.name)}
					</div>

					{/* Indicateur de statut */}
					{showStatus && status && user.status !== "idle" && (
						<motion.div
							className={cn(
								"absolute -bottom-0.5 -right-0.5 rounded-full p-0.5",
								status.color,
								"ring-2 ring-background",
							)}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.1 }}
						>
							{status.icon && (
								<status.icon className={cn(config.icon, "text-white")} />
							)}
						</motion.div>
					)}
				</motion.div>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<div className="text-center">
					<p className="font-medium">{user.name}</p>
					{showStatus && status && (
						<p className="text-xs text-muted-foreground">{status.label}</p>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

/**
 * Composant principal de présence room
 */
export default function RoomPresence({
	users,
	maxVisible = 5,
	showStatus = true,
	size = "md",
	className,
}: RoomPresenceProps) {
	if (users.length === 0) return null;

	const visibleUsers = users.slice(0, maxVisible);
	const hiddenCount = users.length - maxVisible;

	return (
		<TooltipProvider>
			<div className={cn("flex items-center gap-2", className)}>
				{/* Icône utilisateurs */}
				<div className="flex items-center gap-1 text-muted-foreground">
					<Users className="h-4 w-4" />
					<span className="text-sm font-medium">{users.length}</span>
				</div>

				{/* Avatars empilés */}
				<div className="flex -space-x-2">
					<AnimatePresence mode="popLayout">
						{visibleUsers.map((user) => (
							<UserAvatar
								key={user.id}
								user={user}
								size={size}
								showStatus={showStatus}
							/>
						))}
					</AnimatePresence>

					{/* Compteur pour utilisateurs masqués */}
					{hiddenCount > 0 && (
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.div
									className={cn(
										sizeConfig[size].avatar,
										"rounded-full flex items-center justify-center font-medium",
										"bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
										"ring-2 ring-background cursor-pointer",
									)}
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									whileHover={{ scale: 1.1 }}
								>
									+{hiddenCount}
								</motion.div>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} utilisateur
									{hiddenCount > 1 ? "s" : ""}
								</p>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>
		</TooltipProvider>
	);
}

/**
 * Version compacte pour les barres de titre
 */
export function CompactRoomPresence({
	users,
	className,
}: {
	users: RoomUser[];
	className?: string;
}) {
	if (users.length === 0) return null;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"flex items-center gap-1.5 px-2 py-1 rounded-md",
							"bg-muted/50 hover:bg-muted transition-colors cursor-pointer",
							className,
						)}
					>
						<div className="flex -space-x-1.5">
							{users.slice(0, 3).map((user) => (
								<div
									key={user.id}
									className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white ring-1 ring-background"
									style={{ backgroundColor: user.color }}
								>
									{user.name.charAt(0).toUpperCase()}
								</div>
							))}
						</div>
						<span className="text-xs text-muted-foreground">
							{users.length} en ligne
						</span>
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<div className="space-y-1">
						{users.map((user) => (
							<div key={user.id} className="flex items-center gap-2">
								<div
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: user.color }}
								/>
								<span className="text-sm">{user.name}</span>
							</div>
						))}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
