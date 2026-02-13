"use client";

/**
 * AvatarGroup - Groupe d'avatars pour collaboration
 * Adapté pour Alecia Colab - Intégration présence
 */

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/tailwind/ui/tooltip";
import { cn } from "@/lib/utils";

interface AvatarData {
	id: string;
	name?: string;
	imageUrl?: string;
	color?: string;
}

interface AvatarGroupProps {
	avatars: AvatarData[];
	max?: number;
	size?: "sm" | "md" | "lg";
	spacing?: "tight" | "normal" | "loose";
	className?: string;
}

const sizeConfig = {
	sm: "w-6 h-6 text-xs",
	md: "w-8 h-8 text-sm",
	lg: "w-10 h-10 text-base",
};

const spacingConfig = {
	tight: "-space-x-3",
	normal: "-space-x-2",
	loose: "-space-x-1",
};

function getInitials(name?: string): string {
	if (!name) return "?";
	const parts = name.split(" ");
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

function Avatar({
	avatar,
	size,
}: {
	avatar: AvatarData;
	size: "sm" | "md" | "lg";
}) {
	const sizeClass = sizeConfig[size];

	if (avatar.imageUrl) {
		return (
			<img
				src={avatar.imageUrl}
				alt={avatar.name || "Avatar"}
				className={cn(
					sizeClass,
					"rounded-full object-cover ring-2 ring-white dark:ring-gray-900",
				)}
			/>
		);
	}

	return (
		<div
			className={cn(
				sizeClass,
				"rounded-full flex items-center justify-center font-medium text-white ring-2 ring-white dark:ring-gray-900",
			)}
			style={{ backgroundColor: avatar.color || "#6366f1" }}
		>
			{getInitials(avatar.name)}
		</div>
	);
}

export default function AvatarGroup({
	avatars,
	max = 4,
	size = "md",
	spacing = "normal",
	className,
}: AvatarGroupProps) {
	if (avatars.length === 0) return null;

	const visibleAvatars = avatars.slice(0, max);
	const hiddenCount = avatars.length - max;
	const spacingClass = spacingConfig[spacing];

	return (
		<TooltipProvider>
			<div className={cn("flex items-center", spacingClass, className)}>
				{visibleAvatars.map((avatar) => (
					<Tooltip key={avatar.id}>
						<TooltipTrigger asChild>
							<div className="relative cursor-pointer transition-transform hover:scale-110 hover:z-10">
								<Avatar avatar={avatar} size={size} />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{avatar.name || "Utilisateur"}</p>
						</TooltipContent>
					</Tooltip>
				))}

				{hiddenCount > 0 && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									sizeConfig[size],
									"rounded-full flex items-center justify-center",
									"bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
									"font-medium ring-2 ring-white dark:ring-gray-900",
								)}
							>
								+{hiddenCount}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} collaborateur
								{hiddenCount > 1 ? "s" : ""}
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}

/**
 * Hook pour transformer les données de présence en avatars
 */
export function usePresenceAvatars(
	presenceUsers: Array<{
		userId: string;
		userName?: string;
		userColor?: string;
	}>,
): AvatarData[] {
	return presenceUsers.map((user) => ({
		id: user.userId,
		name: user.userName,
		color: user.userColor,
	}));
}
