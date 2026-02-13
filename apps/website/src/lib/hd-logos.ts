/**
 * HD Logo Mapping Utility
 *
 * Maps company names to curated HD logo files.
 * Blue versions are used for light backgrounds, white versions for dark backgrounds.
 */

// List of available HD logos (extracted from blue_versions and white_versions)
const HD_LOGOS = [
	"a-plus-finance",
	"apax-partners",
	"apicap",
	"ardian",
	"bnp-paribas",
	"bolden",
	"bpi-france",
	"caisse-epargne-bretagne",
	"caisse-epargne-groupe",
	"capelli",
	"cc-c",
	"cei",
	"cipres-assurances",
	"come-to-paris",
	"corse-gsm",
	"credit-agricole",
	"credit-mutuel-equity",
	"delta-drone",
	"dogs-security",
	"dougen-prim",
	"e-leclerc",
	"editions-365",
	"entrepreneur-invest",
	"ergon-capital",
	"eurasia-groupe",
	"european-university",
	"extendam",
	"filiassur",
	"finaxy",
	"finorpa",
	"five-arrows",
	"fleurus",
	"french-food-capital",
	"gault-fremont",
	"generis-capital-partners",
	"groupe-guillin",
	"haudecoeur",
	"hmr",
	"holly-diner",
	"isp-system",
	"jardin-molinari",
	"kanope",
	"keller-williams",
	"kfc",
	"laba-archi",
	"le-wagon",
	"lerosey",
	"les-ateliers-peyrache",
	"link-4-life",
	"lovial",
	"maison-bracq",
	"mediawan",
	"metagram",
	"next-stage",
	"omnes-education",
	"opteven",
	"patchwork",
	"patie-michel",
	"perseus",
	"pixiel-group",
	"realites",
	"redpill",
	"riverbank",
	"safe-groupe",
	"sia-partners",
	"signes",
	"soleo",
	"sophie-lebreuilly",
	"temelio",
	"uside",
	"wyz-group",
	"xlr-consulting",
	"y2a-experts",
	"LOGO-EI", // Special case
];

// File extensions map (some logos are webp)
const LOGO_EXTENSIONS: Record<string, string> = {
	kanope: "webp",
	"wyz-group": "webp",
	"LOGO-EI": "webp",
};

/**
 * Normalize a company name to a slug format for matching
 */
function normalizeCompanyName(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove accents
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
		.replace(/^-+|-+$/g, "") // Trim dashes
		.replace(/--+/g, "-"); // Collapse multiple dashes
}

/**
 * Find the best matching HD logo for a company name
 * Returns the logo slug if found, null otherwise
 */
function findMatchingLogo(companyName: string): string | null {
	if (!companyName) return null;

	const normalized = normalizeCompanyName(companyName);

	// Exact match
	if (HD_LOGOS.includes(normalized)) {
		return normalized;
	}

	// Partial match (company name contains logo name or vice versa)
	for (const logo of HD_LOGOS) {
		const logoNormalized = logo.toLowerCase();
		if (
			normalized.includes(logoNormalized) ||
			logoNormalized.includes(normalized)
		) {
			return logo;
		}
	}

	// Word-based matching (any word matches)
	const normalizedWords = normalized.split("-").filter((w) => w.length > 2);
	for (const logo of HD_LOGOS) {
		const logoWords = logo
			.toLowerCase()
			.split("-")
			.filter((w) => w.length > 2);
		for (const word of normalizedWords) {
			if (logoWords.some((lw) => lw.includes(word) || word.includes(lw))) {
				return logo;
			}
		}
	}

	return null;
}

/**
 * Get the file extension for a logo
 */
function getLogoExtension(logoSlug: string): string {
	return LOGO_EXTENSIONS[logoSlug] || "png";
}

/**
 * Get the HD logo URL for a company name
 *
 * @param companyName - The company name to find a logo for
 * @param variant - "white" for dark backgrounds, "blue" for light backgrounds
 * @returns The URL to the HD logo, or null if not found
 */
export function getHDLogoUrl(
	companyName: string,
	variant: "white" | "blue" = "white",
): string | null {
	const logoSlug = findMatchingLogo(companyName);
	if (!logoSlug) return null;

	const ext = getLogoExtension(logoSlug);
	// Handle special filenames
	const filename =
		logoSlug === "gault-fremont" ? "gault-fremont_upscaled" : logoSlug;

	return `/assets/logos/${variant}/${filename}.${ext}`;
}

/**
 * Get both white and blue HD logo URLs for a company name
 */
export function getHDLogoUrls(companyName: string): {
	white: string | null;
	blue: string | null;
} {
	return {
		white: getHDLogoUrl(companyName, "white"),
		blue: getHDLogoUrl(companyName, "blue"),
	};
}

/**
 * Check if an HD logo exists for a company name
 */
export function hasHDLogo(companyName: string): boolean {
	return findMatchingLogo(companyName) !== null;
}
