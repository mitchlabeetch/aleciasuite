import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag as _Tag } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/actions/convex-marketing";
import { sanitizeHtmlWithSafeLinks } from "@/lib/sanitize";

interface NewsArticle {
	title: string;
	date: string;
	category: string;
	imageUrl?: string;
	content: string;
	excerpt?: string;
}

interface Props {
	params: Promise<{
		slug: string;
		locale: string;
	}>;
}

export async function generateStaticParams() {
	const posts = await getBlogPosts();
	const locales = ["fr", "en"];

	// Generate params for each post in each locale
	const params = locales.flatMap((locale) =>
		posts.map((post) => ({
			locale,
			slug: post.slug,
		}))
	);

	return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, locale } = await params;
	const t = await getTranslations({ locale, namespace: "ArticlePage" });

	const convexArticle = await getBlogPostBySlug(slug).catch(() => null);

	if (!convexArticle) {
		return {
			title: t("notFound"),
		};
	}

	const article: NewsArticle = {
		title: convexArticle.title,
		date: convexArticle.publishedAt
			? new Date(convexArticle.publishedAt).toLocaleDateString()
			: "2024",
		category: convexArticle.category || "Actualité",
		imageUrl: convexArticle.coverImage,
		content: convexArticle.content || "",
		excerpt: convexArticle.excerpt,
	};

	return {
		title: `${article.title} | Alecia`,
		openGraph: {
			title: article.title,
			description: article.excerpt,
			images: [article.imageUrl || "/assets/Alecia/HERO_p800.png"],
			type: "article",
			publishedTime: article.date,
			locale: locale,
		},
	};
}

export default async function ArticlePage({ params }: Props) {
	const { slug, locale } = await params;
	const t = await getTranslations({ locale, namespace: "ArticlePage" });

	const convexArticle = await getBlogPostBySlug(slug).catch((err) => {
		console.error("[ArticlePage] Error fetching article:", err);
		return null;
	});

	if (!convexArticle) {
		notFound();
	}

	// Ensure content is not null/undefined
	const safeContent = convexArticle.content || "";

	const article: NewsArticle = {
		title: convexArticle.title,
		date: convexArticle.publishedAt
			? new Date(convexArticle.publishedAt).toLocaleDateString()
			: "2024",
		category: convexArticle.category || "Actualité",
		imageUrl: convexArticle.coverImage,
		content: safeContent,
		excerpt: convexArticle.excerpt,
	};

	return (
		<article className="min-h-screen bg-white dark:bg-gray-900 pt-24 pb-16">
			{/* Header Image */}
			<div className="relative h-[400px] w-full mb-12">
				<Image
					src={article.imageUrl || "/assets/Alecia/HERO_p800.png"}
					alt={article.title}
					fill
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#061A40]/90 to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto">
					<div className="flex items-center gap-4 text-white/80 text-sm mb-4">
						<span className="bg-[#4370A7] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
							{article.category}
						</span>
						<span className="flex items-center">
							<Calendar className="w-4 h-4 mr-2" />
							{article.date}
						</span>
					</div>
					<h1 className="text-3xl md:text-5xl font-bold text-white font-serif leading-tight">
						{article.title}
					</h1>
				</div>
			</div>

			<div className="max-w-3xl mx-auto px-4 sm:px-6">
				{/* Back Link */}
				<Link
					href="/actualites"
					className="inline-flex items-center text-[#4370A7] hover:text-[#061A40] dark:hover:text-white transition-colors mb-8 font-medium"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					{t("backToNews")}
				</Link>

				{/* Content - XSS Protected via sanitizeHtmlWithSafeLinks */}
				<div
					className="prose prose-lg prose-slate dark:prose-invert max-w-none
					       prose-headings:font-serif prose-headings:text-[#061A40] dark:prose-headings:text-white
					       prose-a:text-[#4370A7] prose-a:no-underline hover:prose-a:underline
					       prose-strong:text-[#061A40] dark:prose-strong:text-white"
					dangerouslySetInnerHTML={{
						__html: sanitizeHtmlWithSafeLinks(article.content),
					}}
				/>
			</div>
		</article>
	);
}
