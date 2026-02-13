"use client";

/**
 * AppShell Component - Main layout wrapper (v2.0 - BetterAuth + PostgreSQL)
 *
 * Uses the shared @alepanel/ui UnifiedSidebar for consistency
 * across all apps in the monorepo.
 *
 * Features:
 * - Unified sidebar with Colab, Site, CRM categories
 * - Embedded mode detection (iframe/URL params)
 * - Role-based navigation
 * - French localization
 */

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@alepanel/auth/client";
import { ColabBreadcrumbs } from "./ColabBreadcrumbs";
import { Dock } from "@/components/navigation/Dock";
import { ColabHeader } from "./ColabHeader";
import {
	UnifiedSidebar,
	SidebarProvider,
	useSidebar,
	defaultSidebarConfig,
	type SidebarData,
} from "@alepanel/ui";
import { useEffect, useState } from "react";
import { listBoards } from "@/actions/colab/boards";
import { listDocuments } from "@/actions/colab/documents";

interface AppShellProps {
	children: React.ReactNode;
	mode?: "embedded" | "standalone";
	className?: string;
}

function AppShellContent({
	children,
	mode = "standalone",
	className,
}: AppShellProps) {
	const { isCollapsed, isEmbedded } = useSidebar();
	const pathname = usePathname();
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

	// State for dynamic counts
	const [boardCount, setBoardCount] = useState<number | undefined>(undefined);
	const [documentCount, setDocumentCount] = useState<number | undefined>(
		undefined,
	);

	// Fetch dynamic counts from server actions
	useEffect(() => {
		if (!user?.id) return;

		const fetchCounts = async () => {
			try {
				const [boards, documents] = await Promise.all([
					listBoards(),
					listDocuments(),
				]);
				setBoardCount(boards.length);
				setDocumentCount(documents.length);
			} catch (error) {
				console.error("Failed to fetch counts:", error);
				// Keep counts undefined on error
			}
		};

		fetchCounts();
	}, [user?.id]);

	// Build sidebar data with counts
	const sidebarData: SidebarData = {
		boardCount,
		documentCount,
	};

	// Determine user role (default to "user" if not available)
	// BetterAuth stores role in session.user object (extend if needed)
	const userRole = "user"; // TODO: Add role to BetterAuth session

	// Handle navigation
	const handleNavigate = (href: string) => {
		router.push(href);
	};

	// Embedded mode - hide all chrome (sidebar, header) when in iframe
	if (mode === "embedded" || isEmbedded) {
		// Minimal shell - parent (website admin) provides all navigation
		return (
			<div className="relative h-full w-full">
				<main className={cn("h-full p-4", className)}>{children}</main>
			</div>
		);
	}

	// Full standalone shell with unified sidebar
	return (
		<div className="relative min-h-screen flex">
			{/* Unified Sidebar */}
			<UnifiedSidebar
				config={defaultSidebarConfig}
				data={sidebarData}
				locale="fr"
				userRole={userRole}
				currentPath={pathname}
				onNavigate={handleNavigate}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-h-screen">
				<ColabHeader />
				<main
					className={cn(
						"flex-1 transition-all duration-300 ease-in-out",
						className,
					)}
				>
					<div className="container py-6 px-4">{children}</div>
				</main>
				<Dock />
			</div>
		</div>
	);
}

// Wrapper to provide context
export function AppShell(props: AppShellProps) {
	return (
		<SidebarProvider defaultOpenCategories={["colab"]}>
			<AppShellContent {...props} />
		</SidebarProvider>
	);
}
