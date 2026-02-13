"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ExternalLink } from "lucide-react";

/**
 * Discrete Data Room Frame - Board Requirement
 *
 * Embeds Viapazon login within the page maintaining Alecia header and footer.
 * - Shows only the right panel (login form) initially
 * - Expands to show full data room ONLY after successful login
 * - Keeps Alecia branding visible at page level (not modal)
 */
export function DataRoomFrame() {
	const [loading, setLoading] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const VIAPAZON_LOGIN_URL = "https://dataroom.viapazon.com/auth/login";

	useEffect(() => {
		const timer = setTimeout(() => {
			setLoading(false);
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	// Listen for postMessage from Viapazon iframe indicating successful login
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			// Only accept messages from Viapazon domain
			if (event.origin === "https://dataroom.viapazon.com") {
				if (
					event.data.type === "viapazon_login_success" ||
					event.data.authenticated
				) {
					setIsLoggedIn(true);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	const handleIframeLoad = () => {
		setLoading(false);
		// Check if user is authenticated by trying to communicate with iframe
		if (iframeRef.current) {
			// Attempt to detect login state after a short delay
			setTimeout(() => {
				// If the iframe URL has changed from login page, user is likely logged in
				try {
					const currentSrc = iframeRef.current?.src || "";
					if (!currentSrc.includes("/auth/login")) {
						setIsLoggedIn(true);
					}
				} catch (_e) {
					// Cross-origin restriction - cannot access iframe src
					console.log("Cannot check iframe state due to CORS");
				}
			}, 1000);
		}
	};

	return (
		<div className="relative py-12">
			{/* Content */}
			<div className="relative z-10 max-w-7xl mx-auto px-4">
				{/* Main Content */}
				<div className="flex items-center justify-center">
					<div className={isLoggedIn ? "w-full" : "w-full max-w-[500px]"}>
						{/* Card Title */}
						<div className="text-center mb-6">
							<h1 className="text-3xl font-bold text-white mb-2">
								Espace Data Room
							</h1>
							<p className="text-white/80 text-sm">
								Accès sécurisé à vos documents
							</p>
						</div>

						{/* Iframe Container */}
						<div
							className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-in-out border border-white/20"
							style={{ height: isLoggedIn ? "calc(100vh - 300px)" : "620px" }}
						>
							{/* Loading Overlay */}
							{loading && (
								<div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 z-20 rounded-2xl">
									<div className="text-center">
										<Loader2 className="w-8 h-8 animate-spin text-[var(--alecia-mid-blue)] mx-auto mb-3" />
										<p className="text-muted-foreground text-sm">
											Chargement...
										</p>
									</div>
								</div>
							)}

							{/* Iframe view - cropped initially, full after login */}
							<div
								className="relative overflow-hidden transition-all duration-700 ease-in-out"
								style={{
									height: isLoggedIn ? "calc(100vh - 300px)" : "620px",
									width: "100%",
								}}
							>
								{!isLoggedIn ? (
									// Cropped view showing only login panel
									<iframe
										ref={iframeRef}
										src={VIAPAZON_LOGIN_URL}
										className="border-0 absolute"
										style={{
											width: "1200px",
											height: "900px",
											left: "-690px",
											top: "-40px",
											transformOrigin: "top left",
										}}
										onLoad={handleIframeLoad}
										title="Viapazon Data Room Login"
										allow="forms"
									/>
								) : (
									// Full view after login
									<iframe
										src={VIAPAZON_LOGIN_URL}
										className="w-full h-full border-0"
										title="Viapazon Data Room"
										allow="forms; fullscreen"
									/>
								)}
							</div>
						</div>

						{/* Trust Indicators */}
						<div className="mt-6 flex items-center justify-center gap-2 text-white/70 text-xs">
							<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
							<span>Données sécurisées via</span>
							<a
								href={VIAPAZON_LOGIN_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="text-white hover:underline underline-offset-2 transition-colors font-medium"
							>
								Viapazon
							</a>
						</div>

						{/* Help Link */}
						<div className="mt-4 text-center">
							<a
								href={VIAPAZON_LOGIN_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
							>
								<span>Problème de connexion ?</span>
								<ExternalLink className="w-4 h-4" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
