import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { ClientProviders } from "./ClientProviders";
import Providers from "./providers";

export const dynamic = "force-dynamic";

const title = "Alecia Colab - Plateforme de collaboration M&A";
const description =
	"Alecia Colab est une plateforme complète de centralisation des connaissances et de collaboration M&A. Rationalisez les flux de travail, la due diligence et la planification d'intégration.";

export const metadata: Metadata = {
	title,
	description,
	openGraph: { title, description },
	twitter: { title, description, card: "summary_large_image", creator: "@alecia" },
	metadataBase: new URL("https://colab.alecia.fr"),
	icons: { icon: "/icon.png", shortcut: "/icon.png" },
};

export const viewport: Viewport = {
	themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body>
				<a href="#main-content" className="skip-to-content">
					Aller au contenu principal
				</a>
				<ClientProviders>
					<Providers>
						<main id="main-content" tabIndex={-1}>
							{children}
						</main>
					</Providers>
				</ClientProviders>
				{/* Plausible Analytics */}
				<Script
					defer
					data-domain="colab.alecia.fr"
					src="https://analytics.alecia.fr/js/script.js"
					strategy="afterInteractive"
				/>
			</body>
		</html>
	);
}
