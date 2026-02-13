"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetTitle,
} from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "next-intl";

export function Navbar() {
	const t = useTranslations("Navbar");
	const [isOpen, setIsOpen] = useState(false);
	const [showExpertises, setShowExpertises] = useState(false);
	const pathname = usePathname();

	const navigationItems = [
		{ href: "/expertises", label: t("expertises"), hasSubmenu: true },
		{ href: "/operations", label: t("operations") },
		{ href: "/equipe", label: t("team") },
		{ href: "/nous-rejoindre", label: t("careers") },
		{ href: "/actualites", label: t("news") },
		{ href: "/connexion", label: t("clientArea") },
	];

	const expertiseSubmenu = [
		{ href: "/expertises#cession", label: t("submenu.cession") },
		{ href: "/expertises#levee-de-fonds", label: t("submenu.levee") },
		{ href: "/expertises#acquisition", label: t("submenu.acquisition") },
	];

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-[var(--border)] transition-all duration-300">
			<nav
				// Reduced container size by ~15% (max-w-7xl -> max-w-6xl which is smaller, or custom width)
				// Ensure children are centered vertically (items-center)
				className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
				aria-label="Navigation principale"
			>
				<div className="flex items-center justify-between h-16 md:h-[65px]">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
						aria-label={`alecia - ${t("home")}`}
					>
						<Image
							src="/assets/alecia_logo_blue.svg"
							alt="alecia"
							width={100}
							height={32}
							className="h-8 w-auto md:h-6"
							priority
						/>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-2" role="menubar">
						{navigationItems.map((item) => (
							<div
								key={item.href}
								className="relative"
								role="none"
								onMouseEnter={() => item.hasSubmenu && setShowExpertises(true)}
								onMouseLeave={() => item.hasSubmenu && setShowExpertises(false)}
							>
								<Link
									href={item.href}
									className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg ${
										pathname === item.href ||
										pathname.startsWith(item.href + "/")
											? "text-[var(--accent)] bg-[var(--accent)]/10"
											: "text-muted-foreground hover:text-[var(--foreground)]"
									}`}
									role="menuitem"
									aria-haspopup={item.hasSubmenu ? "true" : undefined}
									aria-expanded={item.hasSubmenu ? showExpertises : undefined}
									aria-current={
										pathname === item.href ||
										pathname.startsWith(item.href + "/")
											? "page"
											: undefined
									}
								>
									{item.label}
									{item.hasSubmenu && (
										<ChevronDown className="w-4 h-4" aria-hidden="true" />
									)}
								</Link>

								{/* Mega Menu for Expertises */}
								{item.hasSubmenu && (
									<AnimatePresence>
										{showExpertises && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 10 }}
												transition={{ duration: 0.15 }}
												className="absolute top-full left-0 mt-1 w-64 bg-secondary border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
												role="menu"
												aria-label="Sous-menu Expertises"
											>
												{expertiseSubmenu.map((subItem) => (
													<Link
														key={subItem.href}
														href={subItem.href}
														className="block px-4 py-3 text-sm text-muted-foreground hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
														role="menuitem"
													>
														{subItem.label}
													</Link>
												))}
											</motion.div>
										)}
									</AnimatePresence>
								)}
							</div>
						))}
					</div>

					{/* Right side: Theme Toggle & CTA */}
					<div className="hidden md:flex items-center gap-3">
						<LanguageSwitcher />

						{/* CTA Button */}
						<Button
							asChild
							className="btn-gold rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
						>
							<Link href="/contact">{t("contact")}</Link>
						</Button>
					</div>

					{/* Mobile Menu Trigger */}
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild className="md:hidden">
							<button
								type="button"
								className="p-2 text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
								aria-label="Ouvrir le menu de navigation"
							>
								<Menu className="w-6 h-6" aria-hidden="true" />
							</button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-80 bg-[var(--background)] border-[var(--border)]"
						>
							<SheetTitle className="sr-only">Menu de navigation</SheetTitle>
							<div className="flex flex-col h-full py-6">
								{/* Mobile Logo (Replaces 'alecia made in' text with actual logo) */}
								<div className="flex items-center justify-start mb-8 px-2">
									<Image
										src="/assets/alecia_logo_blue.svg"
										alt="alecia"
										width={100}
										height={32}
										className="h-8 w-auto"
										priority
									/>
								</div>

								{/* Mobile Navigation */}
								<nav
									className="flex-1 space-y-1"
									aria-label="Navigation mobile"
								>
									{navigationItems.map((item) => (
										<div key={item.href}>
											<Link
												href={item.href}
												onClick={() => setIsOpen(false)}
												className={`flex items-center justify-between px-4 py-3 text-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg ${
													pathname === item.href ||
													pathname.startsWith(item.href + "/")
														? "text-[var(--accent)] bg-[var(--accent)]/10"
														: "text-[var(--foreground)] hover:text-[var(--accent)]"
												}`}
											>
												{item.label}
												{item.hasSubmenu && (
													<ChevronDown className="w-5 h-5" aria-hidden="true" />
												)}
											</Link>
											{item.hasSubmenu && (
												<div className="pl-8 space-y-1">
													{expertiseSubmenu.map((subItem) => (
														<Link
															key={subItem.href}
															href={subItem.href}
															onClick={() => setIsOpen(false)}
															className="block py-2 text-muted-foreground hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
														>
															{subItem.label}
														</Link>
													))}
												</div>
											)}
										</div>
									))}
								</nav>

								{/* Mobile Footer */}
								<div className="space-y-4 pt-6 border-t border-[var(--border)]">
									<div className="flex justify-center pb-2">
										<LanguageSwitcher />
									</div>

									<Button asChild className="btn-gold w-full rounded-lg">
										<Link href="/contact" onClick={() => setIsOpen(false)}>
											{t("contact")}
										</Link>
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
}
