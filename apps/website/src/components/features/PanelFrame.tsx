"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const COLAB_URL =
	process.env.NEXT_PUBLIC_ALECIA_COLAB_URL || "https://colab.alecia.markets";

export function PanelFrame() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	// We'll use a timeout to detect if the iframe takes too long to load (potential block)
	useEffect(() => {
		const timer = setTimeout(() => {
			// If still loading after 5 seconds, it might be slow or blocked
		}, 5000);
		return () => clearTimeout(timer);
	}, []);

	const handleLoad = () => {
		setLoading(false);
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	return (
		<div className="relative w-full" style={{ height: "calc(100vh - 65px)" }}>
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] z-10">
					<Loader2 className="w-8 h-8 animate-spin text-alecia-mid-blue" />
				</div>
			)}

			{error ? (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
					<h3 className="text-xl font-bold mb-2">
						Impossible de charger le Panel Admin
					</h3>
					<p className="text-muted-foreground mb-4">
						Le service est peut-être indisponible ou bloqué par votre
						navigateur.
					</p>
					<a
						href={COLAB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-3 bg-[var(--alecia-mid-blue)] text-white rounded-lg hover:bg-[var(--alecia-dark-blue)] transition-colors"
					>
						Ouvrir sur Colab
					</a>
				</div>
			) : (
				<iframe
					src={`${COLAB_URL}?embed=true`}
					className="w-full h-full border-0"
					onLoad={handleLoad}
					onError={handleError}
					title="Alecia Admin Panel"
					// Sandbox attributes to allow scripts/forms but maintain some security
					sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
				/>
			)}
		</div>
	);
}
