"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.scrollY > 400) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener("scroll", toggleVisibility);

		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40"
				>
					<Button
						size="icon"
						onClick={scrollToTop}
						className="rounded-full shadow-xl bg-[var(--primary)] hover:bg-primary/90 text-white border border-white/10 w-12 h-12"
						aria-label="Retour en haut"
					>
						<ArrowUp className="h-5 w-5" />
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
