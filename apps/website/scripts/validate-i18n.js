#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * i18n Translation Key Validator
 *
 * Validates that all translation keys exist in both language files.
 * Prevents runtime errors from missing translations.
 *
 * Usage:
 *   node scripts/validate-i18n.js
 *   npm run validate:i18n
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

function log(message, color = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Flatten nested object to dot notation paths
 * { user: { name: 'John' } } => { 'user.name': 'John' }
 */
function flattenObject(obj, prefix = "") {
	return Object.keys(obj).reduce((acc, key) => {
		const pre = prefix.length ? `${prefix}.` : "";
		if (
			typeof obj[key] === "object" &&
			obj[key] !== null &&
			!Array.isArray(obj[key])
		) {
			Object.assign(acc, flattenObject(obj[key], pre + key));
		} else {
			acc[pre + key] = obj[key];
		}
		return acc;
	}, {});
}

/**
 * Load and parse a JSON translation file
 */
function loadTranslationFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		log(`Error loading ${filePath}: ${error.message}`, "red");
		process.exit(1);
	}
}

/**
 * Main validation function
 */
function validateTranslations() {
	log("\n🌍 i18n Translation Validator\n", "cyan");

	const messagesDir = path.join(__dirname, "../src/messages");

	// Load translation files
	const enPath = path.join(messagesDir, "en.json");
	const frPath = path.join(messagesDir, "fr.json");

	if (!fs.existsSync(enPath) || !fs.existsSync(frPath)) {
		log("❌ Translation files not found", "red");
		log(`Expected: ${enPath} and ${frPath}`, "red");
		process.exit(1);
	}

	log("📂 Loading translation files...", "blue");
	const enTranslations = loadTranslationFile(enPath);
	const frTranslations = loadTranslationFile(frPath);

	// Flatten to get all keys
	const enKeys = Object.keys(flattenObject(enTranslations)).sort();
	const frKeys = Object.keys(flattenObject(frTranslations)).sort();

	log(`   English: ${enKeys.length} keys`, "blue");
	log(`   French:  ${frKeys.length} keys\n`, "blue");

	// Find missing keys in each language
	const missingInFrench = enKeys.filter((key) => !frKeys.includes(key));
	const missingInEnglish = frKeys.filter((key) => !enKeys.includes(key));

	let hasErrors = false;

	// Report missing keys in French
	if (missingInFrench.length > 0) {
		hasErrors = true;
		log(`❌ Missing in French (${missingInFrench.length}):`, "red");
		missingInFrench.forEach((key) => {
			log(`   - ${key}`, "yellow");
		});
		console.log();
	}

	// Report missing keys in English
	if (missingInEnglish.length > 0) {
		hasErrors = true;
		log(`❌ Missing in English (${missingInEnglish.length}):`, "red");
		missingInEnglish.forEach((key) => {
			log(`   - ${key}`, "yellow");
		});
		console.log();
	}

	// Check for empty values
	const enEmpty = enKeys.filter((key) => {
		const flat = flattenObject(enTranslations);
		const value = flat[key];
		return !value || (typeof value === "string" && value.trim() === "");
	});

	const frEmpty = frKeys.filter((key) => {
		const flat = flattenObject(frTranslations);
		const value = flat[key];
		return !value || (typeof value === "string" && value.trim() === "");
	});

	if (enEmpty.length > 0) {
		hasErrors = true;
		log(`⚠️  Empty values in English (${enEmpty.length}):`, "yellow");
		enEmpty.forEach((key) => log(`   - ${key}`, "yellow"));
		console.log();
	}

	if (frEmpty.length > 0) {
		hasErrors = true;
		log(`⚠️  Empty values in French (${frEmpty.length}):`, "yellow");
		frEmpty.forEach((key) => log(`   - ${key}`, "yellow"));
		console.log();
	}

	// Check for suspicious patterns
	const suspiciousPatterns = [
		{ pattern: /TODO|FIXME|XXX/i, name: "TODO markers" },
		{ pattern: /\[.*\]/, name: "Placeholder brackets" },
		{ pattern: /{{.*}}/, name: "Unprocessed variables" },
	];

	for (const { pattern, name } of suspiciousPatterns) {
		const enSuspicious = enKeys.filter((key) => {
			const flat = flattenObject(enTranslations);
			const value = flat[key];
			return typeof value === "string" && pattern.test(value);
		});

		const frSuspicious = frKeys.filter((key) => {
			const flat = flattenObject(frTranslations);
			const value = flat[key];
			return typeof value === "string" && pattern.test(value);
		});

		if (enSuspicious.length > 0 || frSuspicious.length > 0) {
			log(`⚠️  Found ${name}:`, "yellow");
			if (enSuspicious.length > 0) {
				log(`   English: ${enSuspicious.join(", ")}`, "yellow");
			}
			if (frSuspicious.length > 0) {
				log(`   French: ${frSuspicious.join(", ")}`, "yellow");
			}
			console.log();
		}
	}

	// Final report
	if (!hasErrors) {
		log("✅ All translations are in sync!", "green");
		log(`   Total keys: ${enKeys.length}`, "green");
		log("   No missing or empty translations found.\n", "green");
		process.exit(0);
	} else {
		log("❌ Translation validation failed", "red");
		log("   Please fix the issues above before deploying.\n", "red");
		process.exit(1);
	}
}

// Run validation
if (require.main === module) {
	validateTranslations();
}

module.exports = { validateTranslations, flattenObject };
