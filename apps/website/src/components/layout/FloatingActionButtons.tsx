"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FloatingActionButtons() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			// Show after scrolling 300px
			setIsVisible(window.scrollY > 300);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const _handleWhatsApp = () => {
		window.open("https://wa.me/33600000000", "_blank");
	};

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
					initial={{ opacity: 0, scale: 0.8, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: 20 }}
					transition={{ duration: 0.3 }}
					className="fixed bottom-6 right-6 z-50 hidden md:flex flex-col gap-3"
				>
					{/* Scroll to Top Button */}
					<Button
						onClick={scrollToTop}
						size="icon"
						className="w-12 h-12 rounded-full shadow-xl bg-[var(--primary)] hover:bg-primary/90 text-white border border-white/10 transition-all hover:scale-110"
						aria-label="Scroll to top"
					>
						<ArrowUp className="w-5 h-5" />
					</Button>

					{/* Contact/WhatsApp Button */}
					<Button
						asChild
						size="icon"
						className="w-12 h-12 rounded-full shadow-xl bg-[var(--primary)] hover:bg-primary/90 text-white border border-white/10 transition-all hover:scale-110"
						aria-label="Contact"
					>
						<Link href="/contact">
							<MessageCircle className="w-5 h-5" />
						</Link>
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
