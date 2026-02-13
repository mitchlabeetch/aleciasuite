"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function MobileFooter() {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const t = useTranslations("mobileCta");

	const phone = "+33 1 89 16 00 00"; // Based on legacy info
	const _email = "contact@alecia.markets";
	const whatsapp = "+33600000000"; // Placeholder or based on user pref

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// Show when scrolling up or near top
			if (currentScrollY < lastScrollY || currentScrollY < 100) {
				setIsVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				// Hide when scrolling down past 100px
				setIsVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	const handleCall = () => {
		window.location.href = `tel:${phone.replace(/\s/g, "")}`;
	};

	const handleEmail = () => {
		window.location.href = "/contact";
	};

	const handleWhatsApp = () => {
		window.open(`https://wa.me/${whatsapp.replace(/\+/g, "")}`, "_blank");
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ duration: 0.3 }}
					className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
				>
					<div className="bg-white/80 dark:bg-[#061a40]/90 backdrop-blur-lg border-t border-[var(--border)] px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
						<div className="flex items-center justify-around gap-2 max-w-sm mx-auto">
							{/* Call Button */}
							<button
								onClick={handleCall}
								className="flex flex-col items-center gap-1 flex-1 py-1 text-[var(--foreground)] hover:text-[var(--alecia-navy)] transition-colors rounded-lg"
								aria-label={t("call")}
							>
								<div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
									<Phone className="w-5 h-5" />
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider">
									{t("call")}
								</span>
							</button>

							{/* Email Button */}
							<button
								onClick={handleEmail}
								className="flex flex-col items-center gap-1 flex-1 py-1 text-[var(--foreground)] hover:text-[var(--alecia-navy)] transition-colors rounded-lg"
								aria-label={t("email")}
							>
								<div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
									<Mail className="w-5 h-5" />
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider">
									{t("email")}
								</span>
							</button>

							{/* WhatsApp Button */}
							<button
								onClick={handleWhatsApp}
								className="flex flex-col items-center gap-1 flex-1 py-1 text-[var(--foreground)] hover:text-[#25D366] transition-colors rounded-lg"
								aria-label="WhatsApp"
							>
								<div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
									<MessageCircle className="w-5 h-5" />
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider">
									WhatsApp
								</span>
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
