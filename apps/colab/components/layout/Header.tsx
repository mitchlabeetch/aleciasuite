"use client";

/**
 * Header Component - Top navigation bar
 * Features: Logo, search, notifications, profile
 */

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bell, Menu, Search } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

interface HeaderProps {
	onMenuClick?: () => void;
	className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
	return (
		<header
			className={cn(
				"sticky top-0 z-40 w-full",
				"border-b border-border",
				"bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				className,
			)}
		>
			<div className="container flex h-16 items-center gap-4 px-4">
				{/* Mobile menu button */}
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden"
					onClick={onMenuClick}
				>
					<Menu className="h-5 w-5" />
				</Button>

				{/* Logo */}
				<div className="flex items-center gap-2 mr-4">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
						A
					</div>
					<span className="hidden sm:inline-block font-semibold">
						{t("app.name")}
					</span>
				</div>

				{/* Workspace Switcher */}
				<div className="hidden md:block">
					<WorkspaceSwitcher />
				</div>

				{/* Search bar */}
				<div className="flex-1 max-w-md hidden md:flex">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder={t("search.placeholder")}
							className="pl-10 w-full"
						/>
					</div>
				</div>

				{/* Right side actions */}
				<div className="ml-auto flex items-center gap-2">
					{/* Notifications */}
					<Button variant="ghost" size="icon" className="relative">
						<Bell className="h-5 w-5" />
						<Badge
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
							variant="destructive"
						>
							3
						</Badge>
					</Button>

					{/* Profile - Mock user */}
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
							U
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
