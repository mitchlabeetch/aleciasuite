import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { PressReleaseCard } from "@/components/features/news/PressReleaseCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getTranslations } from "next-intl/server";
import { getBlogPosts } from "@/lib/actions/convex-marketing";
import { logger } from "@/lib/logger";

export default async function NewsIndexPage() {
	const t = await getTranslations("NewsPage");

	// Fetch from Convex with proper error handling
	const convexNews = await getBlogPosts().catch((error) => {
		logger.error("Failed to fetch blog posts in actualites page:", error);
		return [];
	});

	// Transform Convex data to match the expected structure
	const newsArticles = convexNews.map((p) => ({
		title: p.title,
		slug: p.slug,
		excerpt: p.excerpt || "",
		content: p.content,
		date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "2024",
		category: p.category || "Actualité",
		imageUrl: p.coverImage || undefined,
	}));

	return (
		<div className="min-h-screen bg-background pt-24 pb-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<Breadcrumbs />
				<div className="mb-12">
					<h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-6 text-gradient-alecia">
						{t("title")}
					</h1>
					<p className="text-xl text-muted-foreground max-w-3xl">
						{t("subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{newsArticles.map((article) => {
						if (article.category === "Communiqué") {
							return (
								<div key={article.slug} className="h-full">
									<PressReleaseCard
										title={article.title}
										date={article.date}
										image={article.imageUrl}
										slug={article.slug}
										pdfUrl={
											"pdfUrl" in article
												? (article.pdfUrl as string | undefined)
												: undefined
										}
									/>
								</div>
							);
						}

						return (
							<Link
								href={`/actualites/${article.slug}`}
								key={article.slug}
								className="flex flex-col bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-border h-full"
							>
								<div className="relative h-64 w-full overflow-hidden bg-secondary">
									{article.imageUrl ? (
										<Image
											src={article.imageUrl}
											alt={article.title}
											fill
											className="object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
											<Calendar className="w-16 h-16" />
										</div>
									)}
									<div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
										{article.category}
									</div>
								</div>

								<div className="flex flex-col grow p-8">
									<div className="flex items-center text-muted-foreground text-sm mb-4">
										<Calendar className="w-4 h-4 mr-2" />
										{article.date}
									</div>

									<h2 className="text-xl font-bold text-foreground mb-4 font-playfair line-clamp-2">
										{article.title}
									</h2>

									<p className="text-muted-foreground mb-6 line-clamp-3 grow">
										{article.excerpt}
									</p>

									<div className="flex items-center text-primary font-semibold mt-auto">
										{t("readMore")}
										<ArrowRight className="ml-2 w-4 h-4" />
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}
