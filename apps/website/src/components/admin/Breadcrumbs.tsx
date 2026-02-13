"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_TITLES: Record<string, string> = {
	admin: "Admin",
	dashboard: "Tableau de bord",
	deals: "Dossiers",
	crm: "CRM",
	companies: "Sociétés",
	contacts: "Contacts",
	documents: "Documents",
	settings: "Paramètres",
	colab: "Colab",
	forum: "Forum",
	signatures: "Signatures",
	research: "Recherche",
	transactions: "Track Record",
	blog: "Blog",
	team: "Équipe",
	careers: "Carrières",
	tiles: "Galerie",
	reporting: "Reporting",
	governance: "Gouvernance",
	"business-intelligence": "Business Intelligence",
};

export function Breadcrumbs() {
	const pathname = usePathname();

	if (!pathname) return null;

	// Remove locale prefix and split into segments
	const segments = pathname
		.replace(/^\/[a-z]{2}\//, "/")
		.split("/")
		.filter(Boolean);

	// Don't show breadcrumbs on root admin page
	if (segments.length <= 1) return null;

	const breadcrumbs = segments.map((segment, index) => {
		const href = "/" + segments.slice(0, index + 1).join("/");
		const title =
			ROUTE_TITLES[segment] ||
			segment.charAt(0).toUpperCase() + segment.slice(1);
		const isLast = index === segments.length - 1;

		return { href, title, isLast, segment };
	});

	return (
		<nav
			aria-label="Breadcrumb"
			className="flex items-center space-x-1 text-sm"
		>
			<Link
				href="/admin"
				className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
			>
				<Home className="h-4 w-4" />
			</Link>

			{breadcrumbs.slice(1).map(({ href, title, isLast }) => (
				<div key={href} className="flex items-center">
					<ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
					{isLast ? (
						<span className="font-medium text-[var(--alecia-midnight)] dark:text-white">
							{title}
						</span>
					) : (
						<Link
							href={href}
							className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
						>
							{title}
						</Link>
					)}
				</div>
			))}
		</nav>
	);
}
