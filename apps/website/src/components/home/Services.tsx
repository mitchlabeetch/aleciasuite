"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Handshake, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export function Services() {
	const t = useTranslations("Services");

	const services = [
		{
			title: t("cards.cession.title"),
			description: t("cards.cession.description"),
			icon: Handshake,
			href: "/ceder",
			delay: 0.1,
		},
		{
			title: t("cards.levee.title"),
			description: t("cards.levee.description"),
			icon: TrendingUp,
			href: "/expertises#levee-de-fonds",
			delay: 0.2,
		},
		{
			title: t("cards.acquisition.title"),
			description: t("cards.acquisition.description"),
			icon: Search,
			href: "/acquerir",
			delay: 0.3,
		},
	];

	return (
		<section className="py-24 bg-gray-50 dark:bg-gray-900/50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-3xl md:text-4xl font-bold text-[#061A40] dark:text-white mb-6 font-serif">
						{t("title")}
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300">
						{t("subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{services.map((service, _index) => (
						<motion.div
							key={service.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: service.delay }}
						>
							<Link
								href={service.href}
								className="group flex flex-col h-full bg-white dark:bg-[#061A40] p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:-translate-y-1"
							>
								<div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#E3F2FD] dark:bg-[#163E64] text-[#061A40] dark:text-white group-hover:scale-110 transition-transform duration-300">
									<service.icon className="w-7 h-7" />
								</div>

								<h3 className="text-2xl font-bold text-[#061A40] dark:text-white mb-4 font-sans">
									{service.title}
								</h3>

								<p className="text-gray-600 dark:text-gray-300 mb-8 flex-grow leading-relaxed">
									{service.description}
								</p>

								<div className="flex items-center text-[#4370A7] font-semibold group-hover:text-[#061A40] dark:group-hover:text-white transition-colors">
									{t("learnMore")}
									<ArrowRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
								</div>
							</Link>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
