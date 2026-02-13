/**
 * Server-side Text Validation Utilities
 *
 * Provides sanitization and validation for user-generated content
 * stored in Convex. Use these in mutation handlers before storing data.
 *
 * @module convex/lib/validation
 * @security SEC-001 - Input Validation & XSS Prevention
 */

/**
 * Dangerous patterns that indicate XSS/injection attempts
 */
const XSS_PATTERNS = [
	/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
	/javascript:/gi,
	/vbscript:/gi,
	/data:/gi,
	/on\w+\s*=/gi, // onclick=, onerror=, etc.
	/<iframe/gi,
	/<object/gi,
	/<embed/gi,
	/<form/gi,
	/<input[^>]+type\s*=\s*["']?hidden/gi,
	/expression\s*\(/gi, // CSS expression()
	/url\s*\(\s*["']?\s*javascript/gi,
];

/**
 * SQL injection patterns
 */
const SQL_PATTERNS = [
	/;\s*(drop|delete|truncate|alter|create|insert|update)\s+/gi,
	/union\s+(all\s+)?select/gi,
	/--\s*$/gm,
	/\/\*[\s\S]*?\*\//g,
];

/**
 * Check if text contains XSS payload
 * @returns true if text is clean, false if suspicious
 */
export function isCleanText(text: string): boolean {
	return !XSS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if text contains SQL injection patterns
 * Note: Convex doesn't use SQL, but this protects against
 * attacks that might propagate to other systems
 */
export function isCleanSql(text: string): boolean {
	return !SQL_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitize text by removing dangerous patterns
 * Use when you want to store cleaned content rather than reject
 */
export function sanitizeText(text: string): string {
	let clean = text;
	for (const pattern of XSS_PATTERNS) {
		clean = clean.replace(pattern, "[REMOVED]");
	}
	return clean;
}

/**
 * Validate and sanitize user-generated content
 * Returns cleaned text or throws if validation fails
 *
 * @param text - User input to validate
 * @param options - Validation options
 * @throws Error if content is rejected
 */
export function validateContent(
	text: string,
	options: {
		maxLength?: number;
		allowHtml?: boolean;
		fieldName?: string;
	} = {},
): string {
	const {
		maxLength = 10000,
		allowHtml = false,
		fieldName = "content",
	} = options;

	// Length check
	if (text.length > maxLength) {
		throw new Error(
			`${fieldName} exceeds maximum length of ${maxLength} characters`,
		);
	}

	// XSS check
	if (!allowHtml && !isCleanText(text)) {
		throw new Error(`${fieldName} contains disallowed content`);
	}

	// Return sanitized version as extra protection
	return allowHtml ? text : sanitizeText(text);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format (http/https only)
 */
export function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ["http:", "https:"].includes(parsed.protocol);
	} catch {
		return false;
	}
}

/**
 * Validate SIREN format (French company ID - 9 digits)
 */
export function isValidSiren(siren: string): boolean {
	return /^\d{9}$/.test(siren);
}

/**
 * Validate SIRET format (French establishment ID - 14 digits)
 */
export function isValidSiret(siret: string): boolean {
	return /^\d{14}$/.test(siret);
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/\.\./g, "") // No parent directory traversal
		.replace(/[\/\\]/g, "") // No path separators
		.replace(/[<>:"|?*]/g, "") // No special chars
		.slice(0, 255); // Max filename length
}
