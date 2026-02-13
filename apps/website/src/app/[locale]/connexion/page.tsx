import { DataRoomFrame } from "@/components/features/DataRoomFrame";
import { Navbar } from "@/components/layout/Navbar";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Monitor } from "lucide-react";

interface Props {
	params: Promise<{
		locale: string;
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ConnexionPage" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

/**
 * Connexion Page - Viapazon Data Room with Alecia Layout
 *
 * Updated requirement: Maintain Alecia header/footer, iframe loads after auth
 * - Shows Navbar (Alecia header)
 * - Footer is provided by layout, NOT duplicated here
 * - Viapazon iframe in content area
 * - Blue background with pattern overlay
 * - Mobile: Shows message to use desktop
 */
export default function ConnexionPage() {
	return (
		<>
			<Navbar />
			<main
				className="min-h-screen pt-24 relative overflow-hidden"
				style={{
					background:
						"linear-gradient(135deg, var(--alecia-mid-blue) 0%, var(--alecia-midnight) 100%)",
				}}
			>
				{/* Pattern Overlay */}
				<div
					className="absolute inset-0 opacity-10"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					}}
				/>

				{/* Mobile: Show message to use desktop */}
				<div className="relative z-10 md:hidden flex items-center justify-center min-h-[60vh] px-6">
					<div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-sm mx-auto text-center shadow-xl border border-white/20">
						<div className="w-16 h-16 bg-[var(--alecia-blue-corporate)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
							<Monitor className="w-8 h-8 text-[var(--alecia-blue-corporate)]" />
						</div>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">
							Accès depuis un ordinateur
						</h2>
						<p className="text-gray-600 text-sm leading-relaxed">
							L&apos;Espace Data Room est optimisé pour une utilisation sur
							ordinateur. Veuillez vous connecter depuis un appareil avec un
							écran plus large pour une meilleure expérience.
						</p>
					</div>
				</div>

				{/* Desktop: Show DataRoomFrame */}
				<div className="relative z-10 hidden md:block">
					<DataRoomFrame />
				</div>
			</main>
		</>
	);
}
