"use client";

/**
 * Toolbar - Barre d'outils dynamique type Dynamic Island
 * Adapté pour Alecia Colab - Interface française
 */

import { cn } from "@/lib/utils";
import {
	Download,
	Edit3,
	FileText,
	Filter,
	History,
	LayoutGrid,
	type LucideIcon,
	Settings,
	Share2,
	SortAsc,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

interface ToolbarItem {
	id: string;
	label: string;
	icon: LucideIcon;
	onClick?: () => void;
}

interface ToolbarProps {
	items?: ToolbarItem[];
	context?: "pipeline" | "editor" | "deal" | "default";
	className?: string;
	onItemClick?: (itemId: string) => void;
}

const buttonVariants = {
	initial: {
		gap: 0,
		paddingLeft: ".5rem",
		paddingRight: ".5rem",
	},
	animate: (isSelected: boolean) => ({
		gap: isSelected ? ".5rem" : 0,
		paddingLeft: isSelected ? "1rem" : ".5rem",
		paddingRight: isSelected ? "1rem" : ".5rem",
	}),
};

const spanVariants = {
	initial: { width: 0, opacity: 0 },
	animate: { width: "auto", opacity: 1 },
	exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring" as const, bounce: 0, duration: 0.4 };

// Configurations contextuelles en français
const contextConfigs: Record<string, ToolbarItem[]> = {
	pipeline: [
		{ id: "filter", label: "Filtrer", icon: Filter },
		{ id: "sort", label: "Trier", icon: SortAsc },
		{ id: "view", label: "Affichage", icon: LayoutGrid },
		{ id: "export", label: "Exporter", icon: Download },
	],
	editor: [
		{ id: "format", label: "Format", icon: Edit3 },
		{ id: "template", label: "Modèle", icon: FileText },
		{ id: "history", label: "Historique", icon: History },
		{ id: "share", label: "Partager", icon: Share2 },
	],
	deal: [
		{ id: "edit", label: "Modifier", icon: Edit3 },
		{ id: "history", label: "Historique", icon: History },
		{ id: "share", label: "Partager", icon: Share2 },
		{ id: "export", label: "Exporter", icon: Download },
	],
	default: [
		{ id: "settings", label: "Paramètres", icon: Settings },
		{ id: "export", label: "Exporter", icon: Download },
	],
};

export default function Toolbar({
	items,
	context = "default",
	className,
	onItemClick,
}: ToolbarProps) {
	const [selected, setSelected] = React.useState<string | null>(null);

	const toolbarItems =
		items || contextConfigs[context] || contextConfigs.default;

	const handleItemClick = (itemId: string) => {
		setSelected(selected === itemId ? null : itemId);
		onItemClick?.(itemId);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"relative flex items-center gap-2 p-2",
				"bg-white dark:bg-black",
				"rounded-xl border border-gray-200 dark:border-gray-800",
				"shadow-sm",
				"transition-all duration-200",
				className,
			)}
		>
			{toolbarItems.map((item) => (
				<motion.button
					key={item.id}
					className={cn(
						"relative flex items-center rounded-lg px-3 py-2",
						"font-medium text-sm transition-colors duration-200",
						selected === item.id
							? "bg-primary text-primary-foreground"
							: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
					)}
					onClick={() => handleItemClick(item.id)}
					animate="animate"
					initial={false}
					custom={selected === item.id}
					transition={transition}
					variants={buttonVariants}
					whileTap={{ scale: 0.95 }}
				>
					<item.icon className="h-4 w-4" />
					<AnimatePresence initial={false}>
						{selected === item.id && (
							<motion.span
								className="overflow-hidden whitespace-nowrap"
								animate="animate"
								exit="exit"
								initial="initial"
								transition={transition}
								variants={spanVariants}
							>
								{item.label}
							</motion.span>
						)}
					</AnimatePresence>
				</motion.button>
			))}
		</motion.div>
	);
}
