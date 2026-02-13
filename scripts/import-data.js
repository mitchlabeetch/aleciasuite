#!/usr/bin/env node
/**
 * Import Script - Load JSONL data into Convex
 *
 * This script reads JSONL files from /data directory and imports them into Convex
 * using the import mutations defined in convex/importData.ts
 *
 * Usage:
 *   node scripts/import-data.js
 *   npm run import-data
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DATA_DIR = path.join(__dirname, "../data");

/**
 * Read a JSONL file and return array of objects
 */
function readJsonl(filename) {
	const filepath = path.join(DATA_DIR, filename);

	if (!fs.existsSync(filepath)) {
		console.log(`⚠️  File not found: ${filename}`);
		return [];
	}

	const content = fs.readFileSync(filepath, "utf-8");
	const lines = content
		.trim()
		.split("\n")
		.filter((line) => line.trim());

	return lines
		.map((line) => {
			try {
				return JSON.parse(line);
			} catch (e) {
				console.error(`Error parsing line in ${filename}:`, e.message);
				return null;
			}
		})
		.filter(Boolean);
}

/**
 * Import data to Convex using mutation
 */
function importToConvex(mutationName, data) {
	console.log(`\n📦 Importing ${data.length} records via ${mutationName}...`);

	if (data.length === 0) {
		console.log("⚠️  No data to import, skipping.");
		return;
	}

	// Prepare JSON argument
	const argsJson = JSON.stringify({ [getArgsKey(mutationName)]: data });

	try {
		// Write to temp file to avoid command line length limits
		const tempFile = path.join(__dirname, "../.convex-import-temp.json");
		fs.writeFileSync(tempFile, argsJson);

		// Run Convex mutation
		const result = execSync(
			`npx convex run ${mutationName} --args "$(cat ${tempFile})"`,
			{
				cwd: path.join(__dirname, ".."),
				encoding: "utf-8",
				stdio: "pipe",
			},
		);

		// Clean up temp file
		fs.unlinkSync(tempFile);

		console.log("✅ Import result:", result.trim());
	} catch (error) {
		console.error("❌ Import failed:", error.message);
		if (error.stderr) {
			console.error("Error output:", error.stderr.toString());
		}
	}
}

/**
 * Get the argument key name for a mutation
 */
function getArgsKey(mutationName) {
	const mapping = {
		"importData:importTeamMembers": "members",
		"importData:importTransactions": "transactions",
		"importData:importBlogPosts": "posts",
		"importData:importJobOffers": "offers",
	};
	return mapping[mutationName] || "data";
}

/**
 * Main import process
 */
async function main() {
	console.log("🚀 Starting Convex data import...\n");
	console.log(`📂 Reading from: ${DATA_DIR}\n`);

	// Import Team Members
	const teamMembers = readJsonl("team_members.jsonl");
	console.log(`Found ${teamMembers.length} team members`);
	if (teamMembers.length > 0) {
		importToConvex("importData:importTeamMembers", teamMembers);
	}

	// Import Transactions
	const transactions = readJsonl("transactions.jsonl");
	console.log(`Found ${transactions.length} transactions`);
	if (transactions.length > 0) {
		importToConvex("importData:importTransactions", transactions);
	}

	// Import Blog Posts
	const blogPosts = readJsonl("blog_posts.jsonl");
	console.log(`Found ${blogPosts.length} blog posts`);
	if (blogPosts.length > 0) {
		importToConvex("importData:importBlogPosts", blogPosts);
	}

	// Import Job Offers
	const jobOffers = readJsonl("job_offers.jsonl");
	console.log(`Found ${jobOffers.length} job offers`);
	if (jobOffers.length > 0) {
		importToConvex("importData:importJobOffers", jobOffers);
	}

	console.log("\n✨ Import process complete!\n");
}

// Run the import
main().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
