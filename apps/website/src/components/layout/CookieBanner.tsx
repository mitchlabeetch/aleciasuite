"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CookieBanner() {
	const t = useTranslations("CookieBanner");
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Check if user has already made a choice
		const consent = localStorage.getItem("alecia-cookie-consent");
		if (!consent) {
			// Small delay to not annoy immediately
			const timer = setTimeout(() => setIsVisible(true), 1000);
			return () => clearTimeout(timer);
		}
	}, []);

	const handleAccept = () => {
		localStorage.setItem("alecia-cookie-consent", "accepted");
		setIsVisible(false);
	};

	const handleRefuse = () => {
		localStorage.setItem("alecia-cookie-consent", "refused");
		setIsVisible(false);
	};

	const handleEssential = () => {
		localStorage.setItem("alecia-cookie-consent", "essential");
		setIsVisible(false);
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-4"
				>
					<div className="max-w-6xl mx-auto">
						<div className="bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
							<div className="flex-1">
								<h3 className="text-base font-bold text-white mb-1 font-bierstadt">
									{t("title")}
								</h3>
								<p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
									{t("description")}{" "}
									<Link
										href="/politique-de-confidentialite"
										className="underline hover:text-white transition-colors"
									>
										{t("privacyLink")}
									</Link>
								</p>
							</div>

							<div className="flex flex-wrap gap-2 w-full lg:w-auto shrink-0">
								<Button
									variant="ghost"
									onClick={handleEssential}
									className="border border-white/40 text-white hover:bg-white/10 hover:text-white whitespace-nowrap text-xs h-8 px-3 font-medium"
								>
									{t("essential")}
								</Button>
								<Button
									variant="ghost"
									onClick={handleRefuse}
									className="text-gray-400 hover:text-white whitespace-nowrap text-xs h-8 px-3"
								>
									{t("refuse")}
								</Button>
								<Button
									onClick={handleAccept}
									className="btn-gold whitespace-nowrap text-xs h-8 px-4"
								>
									{t("accept")}
								</Button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
