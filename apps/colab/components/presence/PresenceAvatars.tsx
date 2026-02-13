"use client";

import { Users } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../tailwind/ui/tooltip";

interface PresenceUser {
	userId: string;
	userName?: string;
	userColor?: string;
}

interface PresenceAvatarsProps {
	users: PresenceUser[];
	maxDisplay?: number;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "w-6 h-6 text-xs",
	md: "w-8 h-8 text-sm",
	lg: "w-10 h-10 text-base",
};

export function PresenceAvatars({
	users,
	maxDisplay = 4,
	size = "md",
}: PresenceAvatarsProps) {
	if (users.length === 0) return null;

	const displayUsers = users.slice(0, maxDisplay);
	const extraCount = users.length - maxDisplay;

	const getInitials = (name?: string) => {
		if (!name) return "?";
		const parts = name.split(" ");
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	};

	return (
		<TooltipProvider>
			<div className="flex items-center -space-x-2">
				{displayUsers.map((user) => (
					<Tooltip key={user.userId}>
						<TooltipTrigger asChild>
							<div
								className={`
                  ${sizeClasses[size]} rounded-full flex items-center justify-center
                  font-medium text-white ring-2 ring-background cursor-pointer
                  transition-transform hover:scale-110 hover:z-10
                `}
								style={{ backgroundColor: user.userColor || "#888" }}
							>
								{getInitials(user.userName)}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{user.userName || "Anonymous"}</p>
						</TooltipContent>
					</Tooltip>
				))}

				{extraCount > 0 && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={`
                  ${sizeClasses[size]} rounded-full flex items-center justify-center
                  font-medium bg-muted text-muted-foreground ring-2 ring-background
                `}
							>
								+{extraCount}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{extraCount} more user{extraCount > 1 ? "s" : ""}
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}

interface PresenceIndicatorProps {
	users: PresenceUser[];
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
	if (users.length === 0) return null;

	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<div className="flex items-center gap-1">
				<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
				<Users className="h-4 w-4" />
				<span>{users.length} active</span>
			</div>
			<PresenceAvatars users={users} size="sm" />
		</div>
	);
}
