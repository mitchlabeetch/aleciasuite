import { Navbar } from "@/components/layout/Navbar";
import { ContactForm } from "@/components/features/contact-form";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("ContactPage");
	return {
		title: t("title"),
		description: t("subtitle"),
	};
}

// Office locations with city images
const offices = [
	{ city: "Paris", region: "Île-de-France", image: "/assets/cities/paris.jpg" },
	{ city: "Nice", region: "Côte d'Azur", image: "/assets/cities/nice.jpg" },
	{
		city: "Aix-en-Provence",
		region: "Provence",
		image: "/assets/cities/aixenprovence.jpg",
	},
	{ city: "Annecy", region: "Rhône-Alpes", image: "/assets/cities/annecy.jpg" },
	{ city: "Lorient", region: "Bretagne", image: "/assets/cities/lorient.jpg" },
];

export default async function ContactPage() {
	const t = await getTranslations("ContactPage");
	const common = await getTranslations("Common");

	return (
		<>
			<Navbar />

			<main className="min-h-screen bg-[var(--background)] pt-24 pb-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
					<Breadcrumbs />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
					{/* Info Side */}
					<div className="bg-secondary p-8 lg:p-16 flex flex-col justify-center">
						<h1 className="font-playfair text-4xl font-bold mb-4 text-gradient-alecia">
							{t("heading")}
						</h1>
						<p className="text-lg text-muted-foreground mb-8">
							{t("description")}
						</p>

						<div className="space-y-6 mb-8">
							<div>
								<h3 className="font-semibold text-lg mb-2 text-[var(--foreground)]">
									{common("headquarters")}
								</h3>
								<p className="text-muted-foreground">
									35 Boulevard Haussmann
									<br />
									75009 Paris
								</p>
							</div>
						</div>

						{/* Beautiful Location Cards */}
						<div className="w-full">
							<h3 className="font-semibold text-lg mb-4 text-[var(--foreground)]">
								{common("implantations")}
							</h3>
							{/* Auto-fit grid that adapts to available space */}
							<div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
								{offices.map((loc) => (
									<div
										key={loc.city}
										className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer transform transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl shadow-lg"
									>
										{/* City Image */}
										<Image
											src={loc.image}
											alt={loc.city}
											fill
											className="object-cover transition-transform duration-700 group-hover:scale-110"
											sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
										/>

										{/* Lighter gradient - only strong at bottom for text area */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

										{/* Inner shadow only at very bottom */}
										<div
											className="absolute inset-x-0 bottom-0 h-1/3"
											style={{
												background:
													"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
											}}
										/>

										{/* Content with responsive text */}
										<div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
											<h4
												className="font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2"
												style={{ fontSize: "clamp(0.875rem, 4vw, 1.25rem)" }}
											>
												{loc.city}
											</h4>
											<p
												className="text-white/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate"
												style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)" }}
											>
												{loc.region}
											</p>
										</div>

										{/* Hover Glow Effect */}
										<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-alecia-midnight/30 to-transparent" />
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Form Side */}
					<div className="p-8 lg:p-16 flex items-start pt-12 lg:pt-16 bg-[var(--background)]">
						<div className="w-full max-w-md mx-auto">
							<ContactForm />
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
