"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("ExitIntentModal");

const STORAGE_KEY = "exitIntentShown";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function ExitIntentModal() {
	const t = useTranslations("ExitIntent");
	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// Check if we're on mobile
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		// Don't show on mobile devices
		if (isMobile) {
			return;
		}

		// Check if modal was already shown
		const checkIfShown = () => {
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					const { timestamp } = JSON.parse(stored);
					const now = Date.now();

					// Check if session expired (24 hours)
					if (now - timestamp < SESSION_DURATION) {
						log.debug("Exit intent already shown in this session");
						return true;
					} else {
						// Session expired, remove flag
						localStorage.removeItem(STORAGE_KEY);
						return false;
					}
				}
				return false;
			} catch (error) {
				log.warn("Error reading localStorage", error);
				return false;
			}
		};

		if (checkIfShown()) {
			return;
		}

		// Exit intent detection - when mouse leaves viewport from top
		const handleMouseLeave = (e: MouseEvent) => {
			// Only trigger if mouse is leaving from the top
			if (e.clientY <= 0) {
				log.info("Exit intent detected");
				setIsOpen(true);

				// Mark as shown
				try {
					localStorage.setItem(
						STORAGE_KEY,
						JSON.stringify({ timestamp: Date.now() }),
					);
				} catch (error) {
					log.warn("Error writing to localStorage", error);
				}
			}
		};

		// Add event listener
		document.addEventListener("mouseout", handleMouseLeave);

		return () => {
			document.removeEventListener("mouseout", handleMouseLeave);
		};
	}, [isMobile]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Basic email validation
		if (!email || !email.includes("@")) {
			toast.error(t("invalidEmail"));
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/leads", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					type: "exit_intent_guide",
					email,
					source: "exit_intent_modal",
					message: t("guideRequest"),
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to submit");
			}

			log.info("Exit intent lead submitted successfully");
			setIsSuccess(true);
			toast.success(t("successMessage"));

			// Close modal after 2 seconds
			setTimeout(() => {
				setIsOpen(false);
			}, 2000);
		} catch (error) {
			log.error("Error submitting exit intent lead", error);
			toast.error(t("errorMessage"));
		} finally {
			setIsSubmitting(false);
		}
	};

	// Don't render on mobile
	if (isMobile) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent
				className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-corporate/20"
				aria-describedby="exit-intent-description"
			>
				<AnimatePresence mode="wait">
					{!isSuccess ? (
						<motion.div
							key="form"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
						>
							{/* Header with gradient */}
							<div className="bg-gradient-to-r from-corporate to-corporate/80 p-6 text-white">
								<DialogHeader>
									<DialogTitle className="text-2xl font-playfair text-white">
										{t("headline")}
									</DialogTitle>
									<DialogDescription
										id="exit-intent-description"
										className="text-white/90 mt-2"
									>
										{t("subtext")}
									</DialogDescription>
								</DialogHeader>
							</div>

							{/* Content */}
							<div className="p-6 space-y-6">
								{/* Value Proposition */}
								<div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<Download className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
										<div>
											<h3 className="font-semibold text-corporate mb-1">
												{t("guideTitle")}
											</h3>
											<p className="text-sm text-muted-foreground">
												{t("guideDescription")}
											</p>
										</div>
									</div>
								</div>

								{/* Email Form */}
								<form onSubmit={handleSubmit} className="space-y-4">
									<div className="space-y-2">
										<Label
											htmlFor="exit-intent-email"
											className="text-sm font-medium"
										>
											{t("emailLabel")}
										</Label>
										<Input
											id="exit-intent-email"
											type="email"
											placeholder={t("emailPlaceholder")}
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
											disabled={isSubmitting}
											className="h-11"
											aria-label={t("emailLabel")}
										/>
									</div>

									<Button
										type="submit"
										className="w-full h-11 bg-corporate hover:bg-corporate/90"
										disabled={isSubmitting}
									>
										{isSubmitting ? t("submitting") : t("submitButton")}
									</Button>
								</form>

								{/* Privacy Notice */}
								<p className="text-xs text-muted-foreground text-center">
									{t("privacyNotice")}
								</p>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="success"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
							className="p-12 text-center"
						>
							<CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-corporate mb-2">
								{t("successTitle")}
							</h3>
							<p className="text-muted-foreground">{t("successDescription")}</p>
						</motion.div>
					)}
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	);
}
