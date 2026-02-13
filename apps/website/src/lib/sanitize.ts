/**
 * HTML Sanitization Utility
 *
 * Protects against XSS attacks by sanitizing HTML content before rendering.
 * Uses isomorphic-dompurify which works on both server and client side.
 *
 * @module lib/sanitize
 * @security Critical - SEC-001 XSS Prevention
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Simple Markdown to HTML converter
 * Handles basic markdown syntax for article content
 */
function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Escape HTML entities first to prevent XSS
	html = html
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

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

	// Single newlines to <br> within paragraphs
	html = html.replace(/([^>])\n([^<])/g, "$1<br>$2");

	return html;
}

/**
 * Configuration for allowed HTML elements and attributes.
 * Restrictive by default, allowing only safe content elements.
 */
const SANITIZE_CONFIG = {
	// Allow common HTML elements for article content
	ALLOWED_TAGS: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"br",
		"hr",
		"ul",
		"ol",
		"li",
		"strong",
		"em",
		"b",
		"i",
		"u",
		"s",
		"a",
		"img",
		"blockquote",
		"pre",
		"code",
		"table",
		"thead",
		"tbody",
		"tr",
		"th",
		"td",
		"div",
		"span",
		"figure",
		"figcaption",
	],
	// Allow safe attributes only
	ALLOWED_ATTR: [
		"href",
		"src",
		"alt",
		"title",
		"class",
		"id",
		"target",
		"rel",
		"width",
		"height",
		"loading", // for lazy loading images
	],
	// Force body transformation
	FORCE_BODY: true,
	// Return safe empty string if input is invalid
	RETURN_DOM_FRAGMENT: false,
	RETURN_DOM: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks.
 *
 * @param dirty - Untrusted HTML string from database or user input
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * import { sanitizeHtml } from '@/lib/sanitize';
 *
 * // Safe usage
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
 * ```
 *
 * @security This function MUST be used whenever rendering untrusted HTML.
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
	if (!dirty) return "";

	return DOMPurify.sanitize(dirty, SANITIZE_CONFIG);
}

/**
 * Sanitize HTML and automatically add security attributes to external links.
 * Also converts Markdown to HTML if the content appears to be Markdown.
 *
 * - Adds `target="_blank"` to external links
 * - Adds `rel="noopener noreferrer"` to prevent tabnapping attacks
 *
 * @param dirty - Untrusted HTML or Markdown string
 * @returns Sanitized HTML with safe external links
 *
 * @example
 * ```tsx
 * import { sanitizeHtmlWithSafeLinks } from '@/lib/sanitize';
 *
 * // For article content with external links
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlWithSafeLinks(article.content) }} />
 * ```
 */
export function sanitizeHtmlWithSafeLinks(
	dirty: string | undefined | null,
): string {
	if (!dirty) return "";

	// Detect if content is Markdown (contains markdown patterns but no HTML tags)
	const hasMarkdownPatterns = /(\*\*[^*]+\*\*|^###?\s|^-\s)/m.test(dirty);
	const hasHtmlTags = /<[a-z][\s\S]*>/i.test(dirty);

	// Convert Markdown to HTML if needed
	const htmlContent =
		hasMarkdownPatterns && !hasHtmlTags ? markdownToHtml(dirty) : dirty;

	const clean = sanitizeHtml(htmlContent);

	// Add noopener noreferrer to all external links (https:// or http://)
	// This prevents tabnapping attacks where the new tab could modify window.opener
	return clean.replace(
		/<a\s+([^>]*href=["']https?:\/\/[^"']*["'][^>]*)>/gi,
		(match, attributes) => {
			// Check if rel already exists
			if (/rel=/i.test(attributes)) {
				// Append to existing rel
				return match.replace(
					/rel=["']([^"']*)["']/i,
					'rel="$1 noopener noreferrer"',
				);
			}
			// Add rel attribute
			return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
		},
	);
}

/**
 * Strip all HTML tags from a string.
 * Useful for generating plain text excerpts or meta descriptions.
 *
 * @param html - HTML string to strip
 * @returns Plain text without any HTML tags
 */
export function stripHtml(html: string | undefined | null): string {
	if (!html) return "";

	// Use DOMPurify with no allowed tags to strip everything
	return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
