"use client";

import * as React from "react";
import {
	Home,
	Users,
	Briefcase,
	Folder,
	Settings,
	type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DockItem {
	label: string;
	icon: LucideIcon;
	href: string;
}

const DOCK_ITEMS: DockItem[] = [
	{ label: "Accueil", icon: Home, href: "/admin/dashboard" },
	{ label: "CRM", icon: Users, href: "/admin/crm" },
	{ label: "Deals", icon: Briefcase, href: "/admin/deals" },
	{ label: "Documents", icon: Folder, href: "/admin/documents" },
	{ label: "Paramètres", icon: Settings, href: "/admin/settings" },
];

export function Dock() {
	const pathname = usePathname();

	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
			<div className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
				{DOCK_ITEMS.map((item) => (
					<DockIcon
						key={item.href}
						item={item}
						isActive={
							pathname?.includes(item.href) ||
							(item.href === "/admin/dashboard" && pathname?.endsWith("/admin"))
						}
					/>
				))}
			</div>
		</div>
	);
}

function DockIcon({ item, isActive }: { item: DockItem; isActive: boolean }) {
	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<Link href={item.href}>
			<motion.div
				className={cn(
					"relative flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-colors",
					isActive
						? "bg-[var(--alecia-midnight)] text-white shadow-lg"
						: "text-[var(--alecia-midnight)] hover:bg-white/50 dark:text-white dark:hover:bg-white/10",
				)}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				whileHover={{ scale: 1.1, y: -5 }}
				whileTap={{ scale: 0.95 }}
			>
				<item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />

				{/* Tooltip */}
				<AnimatePresence>
					{isHovered && (
						<motion.div
							initial={{ opacity: 0, y: 10, scale: 0.8 }}
							animate={{ opacity: 1, y: -40, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.8 }}
							className="absolute whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-[var(--alecia-midnight)] shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"
						>
							{item.label}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Active Indicator Dot */}
				{isActive && (
					<motion.div
						layoutId="admin-active-dot"
						className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--alecia-mid-blue)]"
					/>
				)}
			</motion.div>
		</Link>
	);
}
