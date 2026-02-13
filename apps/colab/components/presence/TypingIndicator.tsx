"use client";

/**
 * TypingIndicator - Indicateur de saisie en temps réel
 * Inspiré des bonnes pratiques Liveblocks
 */

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface TypingUser {
	id: string;
	name: string;
	color: string;
}

interface TypingIndicatorProps {
	users: TypingUser[];
	className?: string;
}

/**
 * Animation des points de saisie
 */
function TypingDots({ color }: { color: string }) {
	return (
		<span className="inline-flex gap-0.5 ml-1">
			{[0, 1, 2].map((i) => (
				<motion.span
					key={i}
					className="w-1.5 h-1.5 rounded-full"
					style={{ backgroundColor: color }}
					animate={{
						y: [0, -4, 0],
					}}
					transition={{
						duration: 0.6,
						repeat: Number.POSITIVE_INFINITY,
						delay: i * 0.1,
						ease: "easeInOut",
					}}
				/>
			))}
		</span>
	);
}

/**
 * Composant indicateur de saisie
 */
export function TypingIndicator({ users, className }: TypingIndicatorProps) {
	if (users.length === 0) return null;

	const formatTypingText = (): string => {
		if (users.length === 1) {
			return `${users[0].name} est en train d'écrire`;
		}
		if (users.length === 2) {
			return `${users[0].name} et ${users[1].name} écrivent`;
		}
		return `${users[0].name} et ${users.length - 1} autres écrivent`;
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				className={cn(
					"flex items-center gap-2 text-sm text-muted-foreground",
					className,
				)}
			>
				{/* Avatars des utilisateurs qui écrivent */}
				<div className="flex -space-x-2">
					{users.slice(0, 3).map((user) => (
						<div
							key={user.id}
							className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white ring-2 ring-background"
							style={{ backgroundColor: user.color }}
						>
							{user.name.charAt(0).toUpperCase()}
						</div>
					))}
				</div>

				{/* Texte et animation */}
				<span className="flex items-center">
					{formatTypingText()}
					<TypingDots color={users[0]?.color || "#888"} />
				</span>
			</motion.div>
		</AnimatePresence>
	);
}

/**
 * Hook pour gérer l'état de saisie
 */
export function useTypingIndicator() {
	const [isTyping, setIsTyping] = React.useState(false);
	const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	const startTyping = React.useCallback(() => {
		setIsTyping(true);

		// Reset timeout si déjà en cours
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Arrêter après 2 secondes d'inactivité
		timeoutRef.current = setTimeout(() => {
			setIsTyping(false);
		}, 2000);
	}, []);

	const stopTyping = React.useCallback(() => {
		setIsTyping(false);
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}, []);

	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return { isTyping, startTyping, stopTyping };
}

import React from "react";
