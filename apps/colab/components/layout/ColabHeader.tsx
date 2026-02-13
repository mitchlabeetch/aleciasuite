"use client";

import { ActionSearchBar } from "@/components/ui/fancy/ActionSearchBar";
import { Button } from "@/components/tailwind/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Menu, PanelLeft, User } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { useSidebar } from "./sidebar-provider";

interface ColabHeaderProps {
	className?: string;
}

// Custom profile button to avoid Clerk runtime errors if provider is missing
function CustomProfileButton() {
	return (
		<Button
			variant="ghost"
			size="icon"
			className="rounded-full"
			title="Profile"
		>
			<div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-input">
				<User className="h-4 w-4" />
			</div>
			<span className="sr-only">Profile</span>
		</Button>
	);
}

export function ColabHeader({ className }: ColabHeaderProps) {
	const { toggleMobile, toggleCollapse, isCollapsed } = useSidebar();

	return (
		<header
			className={cn(
				"sticky top-0 z-40 w-full",
				"border-b border-border",
				"bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				className,
			)}
		>
			<div className="flex h-14 items-center gap-4 px-4">
				{/* Mobile menu button */}
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden"
					onClick={toggleMobile}
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle menu</span>
				</Button>

				{/* Logo */}
				<div className="flex items-center gap-2 mr-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
						{/* Using img tag to bypass next/image issues in dev environment if any */}
						<img
							src="/images/logo.png"
							alt="Alecia Logo"
							width={32}
							height={32}
							className="object-cover"
						/>
					</div>
					<span className="hidden sm:inline-block font-semibold">
						{t("app.name")}
					</span>
				</div>

				{/* Desktop Sidebar Trigger - Moved to right of logo */}
				<Button
					variant="ghost"
					size="icon"
					className="hidden md:flex text-muted-foreground mr-4"
					onClick={toggleCollapse}
					title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					<PanelLeft className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>

				{/* Search bar */}
				<div className="flex-1 max-w-md hidden md:block">
					<ActionSearchBar />
				</div>

				{/* Right side actions */}
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					<div className="h-8 flex items-center justify-center">
						<CustomProfileButton />
					</div>
				</div>
			</div>
		</header>
	);
}
