"use client";

import * as React from "react";
import { Search, Plus, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ActionSearchBarProps {
	className?: string;
	onSearch?: (query: string) => void;
	onAction?: (action: string) => void;
}

export function ActionSearchBar({
	className,
	onSearch,
	onAction,
}: ActionSearchBarProps) {
	const [query, setQuery] = React.useState("");

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
		onSearch?.(e.target.value);
	};

	return (
		<div
			className={cn("relative flex w-full max-w-2xl items-center", className)}
		>
			<div className="relative w-full">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
					<Search className="h-4 w-4" />
				</div>
				<input
					type="text"
					className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm text-[var(--alecia-midnight)] shadow-sm outline-none placeholder:text-gray-400 focus:border-[var(--alecia-mid-blue)] focus:ring-1 focus:ring-[var(--alecia-mid-blue)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
					placeholder="Rechercher..."
					value={query}
					onChange={handleSearch}
				/>
			</div>

			{/* Quick Actions */}
			<div className="ml-4 flex items-center space-x-2">
				<ActionButton
					label="Deal"
					icon={<Plus className="h-4 w-4" />}
					onClick={() => onAction?.("new-deal")}
					variant="primary"
				/>
				<ActionButton
					label="Contact"
					icon={<User className="h-4 w-4" />}
					onClick={() => onAction?.("search-contact")}
				/>
				<ActionButton
					label="Docs"
					icon={<FileText className="h-4 w-4" />}
					onClick={() => onAction?.("documents")}
				/>
			</div>
		</div>
	);
}

function ActionButton({
	label,
	icon,
	onClick,
	variant = "secondary",
}: {
	label: string;
	icon: React.ReactNode;
	onClick?: () => void;
	variant?: "primary" | "secondary";
}) {
	return (
		<motion.button
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={onClick}
			className={cn(
				"flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-colors",
				variant === "primary"
					? "bg-[var(--alecia-midnight)] text-white hover:opacity-90"
					: "bg-white text-[var(--alecia-midnight)] border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700",
			)}
		>
			{icon}
			<span className="hidden sm:inline-block">{label}</span>
		</motion.button>
	);
}
