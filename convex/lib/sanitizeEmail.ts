// HTML sanitization for email templates
// Prevents XSS attacks by escaping HTML special characters in user-provided content

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * This function should be used on ALL user-provided content that gets
 * interpolated into email templates.
 *
 * @param text - The user input to escape
 * @returns The escaped string safe for HTML interpolation
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string | undefined | null): string {
	if (!text) return "";

	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}
