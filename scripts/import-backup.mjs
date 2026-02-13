#!/usr/bin/env node

/**
 * Import backup data to Convex
 * Usage: node scripts/import-backup.mjs
 */

import { readFileSync } from "fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL =
	process.env.NEXT_PUBLIC_CONVEX_URL || "https://hip-iguana-601.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const BACKUP_DIR = "./backups/convex_2026-01-22/extracted";

function loadJSONL(filePath) {
	try {
		const content = readFileSync(filePath, "utf-8");
		return content
			.split("\n")
			.filter((line) => line.trim())
			.map((line) => JSON.parse(line));
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error.message);
		return [];
	}
}

async function importData() {
	console.log("🚀 Starting Convex data import...\n");

	// Import transactions
	console.log("📦 Importing transactions...");
	const transactions = loadJSONL(`${BACKUP_DIR}/transactions/documents.jsonl`);
	if (transactions.length > 0) {
		const result = await client.mutation(api.importBackup.importTransactions, {
			data: transactions,
		});
		console.log(
			`✅ Imported ${result.imported}/${result.total} transactions\n`,
		);
	} else {
		console.log("⚠️  No transactions to import\n");
	}

	// Import blog posts
	console.log("📝 Importing blog posts...");
	const blogPosts = loadJSONL(`${BACKUP_DIR}/blog_posts/documents.jsonl`);
	if (blogPosts.length > 0) {
		const result = await client.mutation(api.importBackup.importBlogPosts, {
			data: blogPosts,
		});
		console.log(`✅ Imported ${result.imported}/${result.total} blog posts\n`);
	} else {
		console.log("⚠️  No blog posts to import\n");
	}

	// Import team members
	console.log("👥 Importing team members...");
	const teamMembers = loadJSONL(`${BACKUP_DIR}/team_members/documents.jsonl`);
	if (teamMembers.length > 0) {
		const result = await client.mutation(api.importBackup.importTeamMembers, {
			data: teamMembers,
		});
		console.log(
			`✅ Imported ${result.imported}/${result.total} team members\n`,
		);
	} else {
		console.log("⚠️  No team members to import\n");
	}

	// Import job offers
	console.log("💼 Importing job offers...");
	const jobOffers = loadJSONL(`${BACKUP_DIR}/job_offers/documents.jsonl`);
	if (jobOffers.length > 0) {
		const result = await client.mutation(api.importBackup.importJobOffers, {
			data: jobOffers,
		});
		console.log(`✅ Imported ${result.imported}/${result.total} job offers\n`);
	} else {
		console.log("⚠️  No job offers to import\n");
	}

	// Import users
	console.log("👤 Importing users...");
	const users = loadJSONL(`${BACKUP_DIR}/users/documents.jsonl`);
	if (users.length > 0) {
		const result = await client.mutation(api.importBackup.importUsers, {
			data: users,
		});
		console.log(`✅ Imported ${result.imported}/${result.total} users\n`);
	} else {
		console.log("⚠️  No users to import\n");
	}

	// Import marketing KPIs
	console.log("📊 Importing marketing KPIs...");
	const marketingKpis = loadJSONL(
		`${BACKUP_DIR}/marketing_kpis/documents.jsonl`,
	);
	if (marketingKpis.length > 0) {
		const result = await client.mutation(api.importBackup.importMarketingKpis, {
			data: marketingKpis,
		});
		console.log(
			`✅ Imported ${result.imported}/${result.total} marketing KPIs\n`,
		);
	} else {
		console.log("⚠️  No marketing KPIs to import\n");
	}

	// Import global config
	console.log("⚙️  Importing global config...");
	const globalConfig = loadJSONL(`${BACKUP_DIR}/global_config/documents.jsonl`);
	if (globalConfig.length > 0) {
		const result = await client.mutation(api.importBackup.importGlobalConfig, {
			data: globalConfig,
		});
		console.log(
			`✅ Imported ${result.imported}/${result.total} global config entries\n`,
		);
	} else {
		console.log("⚠️  No global config to import\n");
	}

	// Import forum categories
	console.log("📁 Importing forum categories...");
	const forumCategories = loadJSONL(
		`${BACKUP_DIR}/forum_categories/documents.jsonl`,
	);
	if (forumCategories.length > 0) {
		const result = await client.mutation(
			api.importBackup.importForumCategories,
			{ data: forumCategories },
		);
		console.log(
			`✅ Imported ${result.imported}/${result.total} forum categories\n`,
		);
	} else {
		console.log("⚠️  No forum categories to import\n");
	}

	console.log("🎉 Import completed successfully!");
}

importData().catch((error) => {
	console.error("❌ Import failed:", error);
	process.exit(1);
});
