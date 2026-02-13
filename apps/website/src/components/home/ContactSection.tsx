"use client";

import { Link } from "@/i18n/navigation";
import { Button as _Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ValuationWizard } from "@/components/features/wizards/ValuationWizard";
import { memo } from "react";

export const ContactSection = memo(function ContactSection() {
	const t = useTranslations("ContactSection");
	const tHero = useTranslations("HeroVideo");

	return (
		<section className="pt-8 md:pt-16 pb-12 md:pb-16 px-4 bg-secondary dark:bg-[var(--alecia-corporate)]">
			<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
				{/* Left: Presentation */}
				<div>
					<h2 className="font-playfair text-4xl font-semibold mb-6 text-gradient-alecia dark:text-white">
						{t("title")}
					</h2>
					<p className="text-muted-foreground dark:text-alecia-light text-lg mb-6 leading-relaxed">
						{t("description")}
					</p>

					{/* CTA Buttons moved from hero section */}
					<div className="flex flex-col gap-4 justify-center max-w-md mx-auto md:mx-0 mb-8">
						<Link
							href="/ceder"
							className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 btn-gold text-lg px-8 py-6 rounded-xl"
						>
							{tHero("sellCta")}
							<ArrowRight className="ml-2 w-5 h-5" />
						</Link>
						<Link
							href="/acquerir"
							className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-white shadow-sm h-10 text-lg px-8 py-6 rounded-xl border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200"
						>
							{tHero("investCta")}
						</Link>
					</div>
				</div>

				{/* Right: Valuation Wizard (Replaces map and old office list) */}
				<div className="w-full">
					<ValuationWizard />
				</div>
			</div>
		</section>
	);
});
