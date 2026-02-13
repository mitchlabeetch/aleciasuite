"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Types
export type LoaderVariant = "default" | "save" | "ai" | "upload";
export type LoaderSize = "sm" | "md" | "lg";

interface LoaderProps {
	variant?: LoaderVariant;
	size?: LoaderSize;
	className?: string;
	showText?: boolean;
}

// Configuration
const LOADER_MESSAGES = {
	default: { title: "Chargement...", subtitle: "Veuillez patienter" },
	save: {
		title: "Enregistrement...",
		subtitle: "Sauvegarde des modifications",
	},
	ai: { title: "Analyse IA...", subtitle: "Génération du contenu en cours" },
	upload: { title: "Téléversement...", subtitle: "Envoi de vos fichiers" },
};

// Colors based on Alecia Design System
// light: var(--alecia-midnight) -> hsl(219 83% 14%)
// dark: var(--alecia-blue-pale) -> hsl(207 51% 83%)

export const Loader = ({
	variant = "default",
	size = "md",
	className,
	showText = true,
}: LoaderProps) => {
	const message = LOADER_MESSAGES[variant];

	// Size mapping
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-12 h-12",
		lg: "w-20 h-20",
	};

	const textSizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4",
				className,
			)}
		>
			{/* Breathing Graphic */}
			<div
				className={cn(
					"relative flex items-center justify-center",
					sizeClasses[size],
				)}
			>
				<motion.div
					className="absolute inset-0 rounded-full bg-[var(--alecia-midnight)] dark:bg-[var(--alecia-blue-pale)]"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.7, 0.3],
					}}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				<motion.div
					className="absolute inset-2 rounded-full border-2 border-[var(--alecia-midnight)] dark:border-[var(--alecia-blue-pale)]"
					animate={{
						scale: [1, 1.1, 1],
						opacity: [1, 0.5, 1],
					}}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 0.2,
					}}
				/>
			</div>

			{/* Animated Text */}
			{showText && size !== "sm" && (
				<div className="flex flex-col items-center gap-1 text-center">
					<motion.p
						className={cn(
							"font-medium text-[var(--alecia-midnight)] dark:text-[var(--alecia-blue-pale)]",
							textSizeClasses[size],
						)}
						animate={{ opacity: [0.5, 1, 0.5] }}
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
					>
						{message.title}
					</motion.p>
					<motion.p
						className={cn(
							"text-xs text-muted-foreground",
							size === "lg" ? "text-sm" : "",
						)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						{message.subtitle}
					</motion.p>
				</div>
			)}
		</div>
	);
};

export const InlineLoader = ({ className }: { className?: string }) => {
	return (
		<Loader
			variant="default"
			size="sm"
			showText={false}
			className={className}
		/>
	);
};

export const FullPageLoader = ({
	variant = "default",
	children,
}: {
	variant?: LoaderVariant;
	children?: ReactNode;
}) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-6">
				<Loader variant={variant} size="lg" />
				{children}
			</div>
		</div>
	);
};
