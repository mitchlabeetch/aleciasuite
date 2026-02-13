import { mutation } from "../_generated/server";

/**
 * One-time migration to convert Markdown blog posts to HTML format
 * Run with: npx convex run migrations/convertBlogToHtml:convertArticles --prod
 */

function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Headers (### before ## before #)
	html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
	html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
	html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

	// Bold (**text**)
	html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

	// Italic (*text* or _text_)
	html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
	html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

	// Links [text](url)
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// Unordered lists (- item)
	html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
	// Wrap consecutive <li> elements in <ul>
	html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

	// Paragraphs (double newlines)
	html = html.replace(/\n\n+/g, "</p><p>");
	html = `<p>${html}</p>`;

	// Clean up empty paragraphs
	html = html.replace(/<p><\/p>/g, "");
	html = html.replace(/<p>(<h[1-6]>)/g, "$1");
	html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
	html = html.replace(/<p>(<ul>)/g, "$1");
	html = html.replace(/(<\/ul>)<\/p>/g, "$1");

	// Single newlines to <br> within paragraphs (but not after block elements)
	html = html.replace(/([^>])\n([^<])/g, "$1<br>$2");

	// Clean up any remaining newlines inside paragraphs
	html = html.replace(/<p>\s+/g, "<p>");
	html = html.replace(/\s+<\/p>/g, "</p>");

	return html;
}

export const convertArticles = mutation({
	args: {},
	handler: async (ctx) => {
		const posts = await ctx.db.query("blog_posts").collect();
		const updates = [];

		for (const post of posts) {
			// Check if content looks like Markdown (has markdown patterns but no HTML tags)
			const hasMarkdownPatterns = /(\*\*[^*]+\*\*|^###?\s|^-\s)/m.test(
				post.content,
			);
			const hasHtmlTags = /<[a-z][\s\S]*>/i.test(post.content);

			if (hasMarkdownPatterns && !hasHtmlTags) {
				const htmlContent = markdownToHtml(post.content);
				await ctx.db.patch(post._id, { content: htmlContent });
				updates.push({
					slug: post.slug,
					title: post.title,
					status: "converted",
					previewBefore: post.content.substring(0, 100),
					previewAfter: htmlContent.substring(0, 100),
				});
			} else {
				updates.push({
					slug: post.slug,
					title: post.title,
					status: "already_html",
				});
			}
		}

		return {
			message: `Processed ${posts.length} articles`,
			updates,
		};
	},
});
