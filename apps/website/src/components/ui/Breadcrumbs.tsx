"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
	const pathname = usePathname();
	// Handle empty pathname or root
	const segments = pathname
		? pathname.split("/").filter((segment) => segment !== "")
		: [];

	if (segments.length === 0) return null;

	return (
		<nav aria-label="Breadcrumb" className="mb-6">
			<ol className="flex items-center space-x-2 text-sm text-muted-foreground">
				<li>
					<Link
						href="/"
						className="hover:text-[var(--accent)] transition-colors flex items-center"
					>
						<Home className="w-4 h-4" />
						<span className="sr-only">Accueil</span>
					</Link>
				</li>
				{segments.map((segment, index) => {
					const isLast = index === segments.length - 1;
					const href = `/${segments.slice(0, index + 1).join("/")}`;

					// Format segment name: "nous-rejoindre" -> "Nous rejoindre"
					const name = segment
						.replace(/-/g, " ")
						.replace(/^\w/, (c) => c.toUpperCase());

					return (
						<li key={href} className="flex items-center">
							<ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />
							{isLast ? (
								<span
									className="font-medium text-[var(--foreground)]"
									aria-current="page"
								>
									{name}
								</span>
							) : (
								<Link
									href={href}
									className="hover:text-[var(--accent)] transition-colors"
								>
									{name}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
