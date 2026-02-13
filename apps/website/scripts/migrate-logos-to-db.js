#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Migrate Transaction Logos to Optimized SVGs
 *
 * This script:
 * 1. Fetches all transactions from Convex
 * 2. Maps original logo filenames to optimized SVG versions
 * 3. Updates transactions with new logo paths
 */

// Load environment variables from .env.local
require("dotenv").config({
	path: require("path").join(__dirname, "../.env.local"),
});

const { ConvexHttpClient } = require("convex/browser");
const { readdirSync } = require("fs");
const { join, basename } = require("path");

// Initialize Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
	console.error("❌ Error: CONVEX_URL not found in environment");
	console.log("Please set NEXT_PUBLIC_CONVEX_URL in your .env.local file");
	process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const OPTIMIZED_DIR = join(__dirname, "../public/assets/logos-optimized");

/**
 * Get filename without path
 */
function getFilename(path) {
	if (!path) return null;
	return basename(path);
}

/**
 * Convert original filename to optimized SVG filename
 */
function getOptimizedFilename(originalFilename) {
	if (!originalFilename) return null;

	// Remove any existing path
	const filename = basename(originalFilename);

	// Replace extension with .svg
	return filename.replace(/\.(png|jpe?g|webp)$/i, ".svg");
}

/**
 * Check if optimized file exists
 */
function optimizedFileExists(filename) {
	if (!filename) return false;

	try {
		const files = readdirSync(OPTIMIZED_DIR);
		return files.includes(filename);
	} catch (error) {
		console.error("Error reading optimized directory:", error.message);
		return false;
	}
}

/**
 * Main migration function
 */
async function migrateLogos() {
	console.log("🎨 Transaction Logo Migration Tool");
	console.log("===================================\n");

	try {
		// Fetch all transactions
		console.log("📥 Fetching transactions from Convex...");
		const transactions = await client.query(
			"logos:getTransactionsForLogoMigration",
		);

		console.log(`Found ${transactions.length} transactions\n`);

		// Prepare updates
		const updates = [];
		const stats = {
			total: transactions.length,
			clientUpdated: 0,
			acquirerUpdated: 0,
			noChange: 0,
			clientMissing: 0,
			acquirerMissing: 0,
		};

		for (const transaction of transactions) {
			const update = {
				transactionId: transaction._id,
			};

			let hasUpdate = false;

			// Check client logo
			if (transaction.clientLogo) {
				const originalFilename = getFilename(transaction.clientLogo);
				const optimizedFilename = getOptimizedFilename(originalFilename);

				if (optimizedFilename && optimizedFileExists(optimizedFilename)) {
					update.clientLogoUrl = `/assets/logos-optimized/${optimizedFilename}`;
					stats.clientUpdated++;
					hasUpdate = true;
					console.log(`✓ ${transaction.clientName}: ${optimizedFilename}`);
				} else {
					stats.clientMissing++;
					console.log(
						`⚠ ${transaction.clientName}: No optimized version of ${originalFilename}`,
					);
				}
			}

			// Check acquirer logo
			if (transaction.acquirerLogo) {
				const originalFilename = getFilename(transaction.acquirerLogo);
				const optimizedFilename = getOptimizedFilename(originalFilename);

				if (optimizedFilename && optimizedFileExists(optimizedFilename)) {
					update.acquirerLogoUrl = `/assets/logos-optimized/${optimizedFilename}`;
					stats.acquirerUpdated++;
					hasUpdate = true;
				} else {
					stats.acquirerMissing++;
				}
			}

			if (hasUpdate) {
				updates.push(update);
			} else {
				stats.noChange++;
			}
		}

		// Execute bulk update
		if (updates.length > 0) {
			console.log(`\n📤 Updating ${updates.length} transactions...`);

			const result = await client.mutation("logos:bulkUpdateLogos", {
				updates,
			});

			console.log("\n===================================");
			console.log("Migration Results:");
			console.log(`✓ Successfully updated: ${result.successful}`);
			console.log(`✗ Failed: ${result.failed}`);
			console.log(`\nLogo Statistics:`);
			console.log(`  • Client logos updated: ${stats.clientUpdated}`);
			console.log(`  • Acquirer logos updated: ${stats.acquirerUpdated}`);
			console.log(`  • No changes needed: ${stats.noChange}`);
			console.log(`  • Client logos missing: ${stats.clientMissing}`);
			console.log(`  • Acquirer logos missing: ${stats.acquirerMissing}`);

			if (result.failed > 0) {
				console.log("\n❌ Failed updates:");
				result.results
					.filter((r) => !r.success)
					.forEach((r) => console.log(`  - ${r.id}: ${r.error}`));
			}
		} else {
			console.log(
				"\n⚠ No updates needed - all transactions already up to date",
			);
		}

		console.log("\n✨ Migration complete!");
	} catch (error) {
		console.error("\n❌ Migration failed:", error.message);
		if (error.stack) {
			console.error("\nStack trace:", error.stack);
		}
		process.exit(1);
	}
}

// Run migration
migrateLogos().catch(console.error);
