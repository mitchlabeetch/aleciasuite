"use client";

import Image from "next/image";
import { Link, usePathname as _usePathname } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export function Footer() {
	const t = useTranslations("Footer");
	const currentYear = new Date().getFullYear();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const footerLinks = {
		services: [
			{ href: "/expertises#cession", label: t("services.cession") },
			{ href: "/expertises#levee-de-fonds", label: t("services.levee") },
			{ href: "/expertises#acquisition", label: t("services.acquisition") },
		],
		company: [
			{ href: "/a-propos", label: t("company.about") },
			{ href: "/equipe", label: t("company.team") },
			{ href: "/operations", label: t("company.operations") },
			{ href: "/actualites", label: t("company.news") },
			{ href: "/nous-rejoindre", label: t("company.careers") },
			{ href: "/connexion", label: t("company.privateAccess") },
			{ href: "/admin", label: "Espace Admin", icon: Lock },
		],
		offices: [
			{ label: "Paris", city: "Île-de-France" },
			{ label: "Nice", city: "Sud-Est" },
			{ label: "Aix-en-Provence", city: "Sud-Est" },
			{ label: "Annecy", city: "Rhône-Alpes" },
			{ label: "Lorient", city: "Bretagne" },
		],
	};

	return (
		<footer className="bg-secondary border-t border-[var(--border)] dark:bg-[var(--alecia-midnight)] dark:border-[var(--alecia-corporate)]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Main Footer */}
				<div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{/* Brand Column */}
					<div className="lg:col-span-1">
						<Link
							href="/"
							className="inline-block mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
							aria-label="alecia - Retour à l'accueil"
						>
							{mounted && (
								<>
									<Image
										src="/assets/alecia_logo_blue.svg"
										alt="alecia"
										width={100}
										height={32}
										className="h-8 w-auto dark:hidden"
									/>
									<Image
										src="/assets/alecia_logo.svg"
										alt="alecia"
										width={100}
										height={32}
										className="h-8 w-auto hidden dark:block"
									/>
								</>
							)}
						</Link>
						<p className="text-sm text-muted-foreground dark:text-[var(--alecia-grey-chrome)] mb-4 max-w-xs">
							{t("description")}
						</p>
						{/* Social Links */}
						<a
							href="https://www.linkedin.com/company/alecia-conseil"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 text-sm text-muted-foreground dark:text-[var(--alecia-grey-chrome)] hover:text-[var(--accent)] dark:hover:text-[var(--alecia-sky)] transition-colors"
							aria-label="Suivez alecia sur LinkedIn"
						>
							<svg
								className="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
							</svg>
							LinkedIn
						</a>
					</div>

					{/* Services Column */}
					<nav aria-labelledby="footer-services-heading">
						<h4
							id="footer-services-heading"
							className="text-sm font-semibold text-[var(--foreground)] dark:text-white mb-4"
						>
							{t("servicesTitle")}
						</h4>
						<ul className="space-y-2">
							{footerLinks.services.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground dark:text-[var(--alecia-grey-chrome)] hover:text-[var(--foreground)] dark:hover:text-white transition-colors focus:outline-none focus-visible:underline"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					{/* Company Column */}
					<nav aria-labelledby="footer-company-heading">
						<h4
							id="footer-company-heading"
							className="text-sm font-semibold text-[var(--foreground)] dark:text-white mb-4"
						>
							{/* Changed "Cabinet" to "Notre Structure" */}
							{t("companyTitle")}
						</h4>
						<ul className="space-y-2">
							{footerLinks.company.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground dark:text-[var(--alecia-grey-chrome)] hover:text-[var(--foreground)] dark:hover:text-white transition-colors focus:outline-none focus-visible:underline"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					<div aria-labelledby="footer-offices-heading">
						<h4
							id="footer-offices-heading"
							className="text-sm font-semibold text-[var(--foreground)] dark:text-white mb-4"
						>
							{/* Changed "Bureaux" to "Partout en France" */}
							{t("officesTitle")}
						</h4>
						<ul className="space-y-2">
							{footerLinks.offices.map((office) => (
								<li key={office.label + office.city} className="text-sm">
									<span className="text-[var(--foreground)] dark:text-white font-medium">
										{office.label}
									</span>
									<span className="text-muted-foreground dark:text-[var(--alecia-grey-chrome)]">
										{" "}
										· {office.city}
									</span>
								</li>
							))}
						</ul>
						{/* Removed contact@alecia.fr text link */}
					</div>
				</div>

				<Separator className="bg-[var(--border)] dark:bg-[var(--alecia-corporate)]" />

				{/* Professional Credibility Badges */}
				<div className="py-8 border-b border-[var(--border)] dark:border-[var(--alecia-corporate)]">
					<div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground dark:text-[var(--alecia-grey-chrome)]">
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-[var(--accent)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
							<span>Conseil en Fusion-Acquisition indépendant</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-[var(--accent)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<span>Équipe pluridisciplinaire (M&A, Droit, Finance)</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-5 h-5 text-[var(--accent)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Valorisations 5 m€ - 50 m€</span>
						</div>
					</div>
				</div>

				{/* Bottom Footer */}
				<div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-xs text-muted-foreground dark:text-[var(--alecia-grey-chrome)]">
						© {currentYear} alecia. {t("rights")}
					</p>
					<nav
						aria-label="Liens légaux"
						className="flex items-center gap-6 text-xs"
					>
						<Link
							href="/mentions-legales"
							className="text-muted-foreground dark:text-[var(--alecia-grey-chrome)] hover:text-[var(--foreground)] dark:hover:text-white transition-colors focus:outline-none focus-visible:underline"
						>
							{t("legal")}
						</Link>
						<Link
							href="/politique-de-confidentialite"
							className="text-muted-foreground dark:text-[var(--alecia-grey-chrome)] hover:text-[var(--foreground)] dark:hover:text-white transition-colors focus:outline-none focus-visible:underline"
						>
							{t("privacy")}
						</Link>
						<Link
							href="/admin"
							aria-label="Accès Panel"
							className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
							title="Accès Administrateur"
						>
							<Lock className="w-3 h-3" />
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
}
