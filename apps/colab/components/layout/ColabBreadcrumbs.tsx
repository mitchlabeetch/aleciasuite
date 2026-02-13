"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const routeLabels: Record<string, string> = {
	dashboard: "Dashboard",
	documents: "Documents",
	pipeline: "Pipeline",
	deals: "Deals",
	companies: "Companies",
	calendar: "Calendar",
	settings: "Settings",
	recent: "Recent",
	favorites: "Favorites",
	trash: "Trash",
};

export function ColabBreadcrumbs() {
	const pathname = usePathname();
	const segments = pathname?.split("/").filter(Boolean) || [];

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: "Colab", href: "/dashboard" },
		...segments.map((segment, index) => {
			const href = `/${segments.slice(0, index + 1).join("/")}`;
			const label = routeLabels[segment] || segment;
			return { label, href };
		}),
	];

	return (
		<nav className="flex items-center gap-1 px-4 py-2 text-sm border-b bg-background/95 backdrop-blur">
			<Link
				href="/dashboard"
				className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
			>
				<Home className="h-4 w-4" />
			</Link>
			{breadcrumbs.map((crumb, index) => (
				<div key={index} className="flex items-center gap-1">
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
					{crumb.href && index < breadcrumbs.length - 1 ? (
						<Link
							href={crumb.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{crumb.label}
						</Link>
					) : (
						<span className="font-medium">{crumb.label}</span>
					)}
				</div>
			))}
		</nav>
	);
}
