import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [
			"p",
			"br",
			"strong",
			"em",
			"u",
			"s",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"blockquote",
			"ul",
			"ol",
			"li",
			"a",
			"code",
			"pre",
			"img",
		],
		ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
		ALLOW_DATA_ATTR: false,
	});
}

/**
 * Validate and sanitize slug (URL-friendly string)
 */
export function validateSlug(slug: string): {
	valid: boolean;
	sanitized: string;
	error?: string;
} {
	// Remove leading/trailing whitespace
	let sanitized = slug.trim();

	// Convert to lowercase
	sanitized = sanitized.toLowerCase();

	// Replace spaces and special chars with hyphens
	sanitized = sanitized.replace(/[^a-z0-9-]/g, "-");

	// Remove consecutive hyphens
	sanitized = sanitized.replace(/-+/g, "-");

	// Remove leading/trailing hyphens
	sanitized = sanitized.replace(/^-+|-+$/g, "");

	// Validate format
	const slugRegex = /^[a-z0-9-]+$/;
	if (!slugRegex.test(sanitized)) {
		return {
			valid: false,
			sanitized,
			error:
				"Le slug ne peut contenir que des lettres minuscules, chiffres et tirets",
		};
	}

	// Check minimum length
	if (sanitized.length < 3) {
		return {
			valid: false,
			sanitized,
			error: "Le slug doit contenir au moins 3 caractères",
		};
	}

	return { valid: true, sanitized };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
	valid: boolean;
	error?: string;
} {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email)) {
		return {
			valid: false,
			error: "Adresse email invalide",
		};
	}

	return { valid: true };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
	try {
		new URL(url);
		return { valid: true };
	} catch {
		return {
			valid: false,
			error: "URL invalide",
		};
	}
}

/**
 * Auto-generate slug from title
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove accents
		.replace(/[^a-z0-9\s-]/g, "") // Remove special chars
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/-+/g, "-") // Remove consecutive hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(text: string): string {
	return text
		.trim()
		.replace(/[<>]/g, "") // Remove HTML angle brackets
		.slice(0, 1000); // Limit length
}

/**
 * Validate required field
 */
export function validateRequired(
	value: string,
	fieldName: string,
): { valid: boolean; error?: string } {
	if (!value || value.trim().length === 0) {
		return {
			valid: false,
			error: `${fieldName} est requis`,
		};
	}
	return { valid: true };
}
