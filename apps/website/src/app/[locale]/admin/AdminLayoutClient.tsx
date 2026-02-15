"use client";

import { useSession } from "@alepanel/auth/client";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	Dock,
	Breadcrumbs,
	ActionSearchBar,
	NotificationBell,
} from "@/components/admin";
import {
	UnifiedSidebar,
	SidebarProvider,
	defaultSidebarConfig,
} from "@alepanel/ui";
import { DEFAULT_LOCALE } from "@/lib/constants";

// Type guard for user with role
interface UserWithRole {
	role?: "sudo" | "partner" | "advisor" | "user";
}

/**
 * Admin Layout Client Component
 *
 * This layout provides:
 * - BetterAuth session gate (redirects to sign-in if not authenticated)
 * - Unified sidebar navigation (context-aware: shows Panel items)
 * - Breadcrumbs bar with Action Search
 * - macOS-style bottom dock
 */
export default function AdminLayoutClient({
	children,
}: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, isPending } = useSession();

	// Skip auth check for sign-in page
	if (pathname?.includes('/sign-in')) {
		return <>{children}</>;
	}

	// Loading state
	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--alecia-mid-blue)]" />
			</div>
		);
	}

	// Not authenticated - redirect to sign-in
	if (!session) {
		const locale = pathname?.split('/')[1] || DEFAULT_LOCALE;
		router.push(`/${locale}/admin-sign-in`);
		return null;
	}

	// Extract user role with type safety
	const userRole = (session.user as UserWithRole)?.role || "user";

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-white dark:bg-[#09090b] flex">
				{/* Unified Sidebar - Panel context */}
				<UnifiedSidebar
					config={defaultSidebarConfig}
					appContext="panel"
					currentPath={pathname || ""}
					locale="fr"
					userRole={userRole}
				/>

				{/* Main content area */}
				<div className="flex-1 flex flex-col min-h-screen md:ml-0 pt-16">
					{/* Breadcrumbs bar with Action Search */}
					<div className="border-b border-border bg-muted/30">
						<div className="px-6 py-3 pl-14 md:pl-6 flex items-center justify-between">
							<Breadcrumbs />
							<div className="flex items-center gap-2">
								<ActionSearchBar className="hidden md:flex" />
								<NotificationBell />
							</div>
						</div>
					</div>

					{/* Page content - add bottom padding for Dock */}
					<main className="flex-1 pb-24 px-6">{children}</main>
				</div>
			</div>

			{/* Bottom Dock Navigation */}
			<Dock />
		</SidebarProvider>
	);
}
