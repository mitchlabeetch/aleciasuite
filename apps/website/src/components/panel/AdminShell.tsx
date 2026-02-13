"use client";

import { useEffect as _useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Home,
	Users,
	Briefcase,
	Folder,
	Settings,
	Search,
	Plus as _Plus,
	User,
	FileText as _FileText,
	LogOut,
	Moon,
	Sun,
	ChevronRight as _ChevronRight,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

/* =============================================================================
   ADMIN COMPONENTS (PORTED FROM PANEL)
   ============================================================================= */

// --- Action Buttons ---
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
					: "bg-white text-[var(--alecia-midnight)] border border-[var(--alecia-grey-chrome)] hover:bg-[var(--alecia-grey-light)]",
			)}
		>
			{icon}
			<span className="hidden sm:inline-block">{label}</span>
		</motion.button>
	);
}

// --- Search Bar ---
export function ActionSearchBar({ className }: { className?: string }) {
	return (
		<div
			className={cn("relative flex w-full max-w-2xl items-center", className)}
		>
			<div className="relative w-full">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--alecia-grey-dark)]">
					<Search className="h-4 w-4" />
				</div>
				<input
					type="text"
					className="h-10 w-full rounded-full border border-[var(--alecia-grey-chrome)] bg-white pl-10 pr-4 text-sm text-[var(--alecia-midnight)] shadow-sm outline-none placeholder:text-[var(--alecia-grey-dark)] focus:border-[var(--alecia-mid-blue)]"
					placeholder="Rechercher..."
				/>
			</div>
			<div className="ml-4 flex items-center space-x-2">
				<ActionButton
					label="Deal"
					icon={<_Plus className="h-4 w-4" />}
					variant="primary"
				/>
				<ActionButton label="Contact" icon={<User className="h-4 w-4" />} />
			</div>
		</div>
	);
}

// --- Profile Dropdown ---
export function ProfileDropdown() {
	const { setTheme, theme } = useTheme();

	return (
		<DropdownMenuPrimitive.Root>
			<DropdownMenuPrimitive.Trigger className="outline-none">
				<div className="flex items-center gap-2 rounded-full border border-[var(--alecia-grey-chrome)] bg-white/50 p-1 pl-3 pr-1 backdrop-blur-sm transition-colors hover:bg-white">
					<span className="hidden text-sm font-medium text-[var(--alecia-midnight)] sm:block">
						Admin Alecia
					</span>
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--alecia-midnight)] text-white">
						<span className="text-xs font-bold">AL</span>
					</div>
				</div>
			</DropdownMenuPrimitive.Trigger>

			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/20 bg-white/90 p-1 text-[var(--alecia-midnight)] shadow-xl backdrop-blur-xl"
					sideOffset={5}
				>
					<DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-semibold text-[var(--alecia-grey-dark)]">
						Mon Compte
					</DropdownMenuPrimitive.Label>
					<DropdownMenuPrimitive.Item className="relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--alecia-cloud)]">
						<User className="mr-2 h-4 w-4" />
						<span>Mon Profil</span>
					</DropdownMenuPrimitive.Item>
					<DropdownMenuPrimitive.Item
						className="relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--alecia-cloud)]"
						onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
					>
						{theme === "dark" ? (
							<Sun className="mr-2 h-4 w-4" />
						) : (
							<Moon className="mr-2 h-4 w-4" />
						)}
						<span>Thème: {theme === "dark" ? "Sombre" : "Clair"}</span>
					</DropdownMenuPrimitive.Item>
					<DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-[var(--alecia-grey-chrome)]/50" />
					<DropdownMenuPrimitive.Item className="relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm text-[var(--alecia-red)] outline-none transition-colors focus:bg-[var(--alecia-red)]/10">
						<LogOut className="mr-2 h-4 w-4" />
						<span>Déconnexion</span>
					</DropdownMenuPrimitive.Item>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}

// --- Dock Navigation ---
const DOCK_ITEMS = [
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
			<div className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">
				{DOCK_ITEMS.map((item) => (
					<DockIcon
						key={item.href}
						item={item}
						isActive={pathname?.includes(item.href)}
					/>
				))}
			</div>
		</div>
	);
}

interface DockItem {
	label: string;
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	href: string;
}

function DockIcon({ item, isActive }: { item: DockItem; isActive: boolean }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Link href={item.href}>
			<motion.div
				className={cn(
					"relative flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-colors",
					isActive
						? "bg-[var(--alecia-midnight)] text-white shadow-lg"
						: "text-[var(--alecia-midnight)] hover:bg-white/50",
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				whileHover={{ scale: 1.1, y: -5 }}
				whileTap={{ scale: 0.95 }}
			>
				<item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
				<AnimatePresence>
					{isHovered && (
						<motion.div
							initial={{ opacity: 0, y: 10, scale: 0.8 }}
							animate={{ opacity: 1, y: -40, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.8 }}
							className="absolute whitespace-nowrap rounded-lg border border-[var(--alecia-grey-chrome)] bg-white px-2 py-1 text-xs font-semibold text-[var(--alecia-midnight)] shadow-xl"
						>
							{item.label}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</Link>
	);
}

// --- Main Layout Wrapper ---
export function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[var(--alecia-white)] dark:bg-[var(--alecia-midnight)] text-[var(--alecia-midnight)]">
			{/* Admin Header */}
			<header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--alecia-grey-chrome)]/50 bg-white/80 px-6 backdrop-blur-md">
				<div className="flex items-center gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--alecia-midnight)] to-[var(--alecia-mid-blue)] text-white shadow-lg">
						<span className="font-playfair text-xl font-bold">A</span>
					</div>
					<span className="font-playfair text-lg font-bold">Alecia Panel</span>
				</div>

				<div className="flex flex-1 justify-center px-8">
					<ActionSearchBar className="w-full max-w-xl" />
				</div>

				<div className="flex items-center gap-4">
					<ProfileDropdown />
				</div>
			</header>

			<main className="flex-1 px-6 py-8 pb-32">
				<div className="mx-auto max-w-7xl">{children}</div>
			</main>

			<Dock />
		</div>
	);
}
