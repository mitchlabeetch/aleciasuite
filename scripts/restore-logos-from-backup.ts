/**
 * Restore logo URLs from backup
 * This script reads the backup transactions and restores the logo URLs
 */

import { readFileSync } from "fs";
import { join } from "path";

const backupPath = join(
	process.cwd(),
	"backups/convex_2026-01-22/extracted/transactions/documents.jsonl"
);

// Read backup file line by line
const backupContent = readFileSync(backupPath, "utf-8");
const backupLines = backupContent.trim().split("\n");

console.log(`Found ${backupLines.length} transactions in backup`);

// Parse each line and extract logo URLs
const logoUpdates: Array<{
	_id: string;
	clientName: string;
	clientLogo?: string;
	acquirerLogo?: string;
}> = [];

for (const line of backupLines) {
	const doc = JSON.parse(line);
	if (doc.clientLogo || doc.acquirerLogo) {
		logoUpdates.push({
			_id: doc._id,
			clientName: doc.clientName,
			clientLogo: doc.clientLogo,
			acquirerLogo: doc.acquirerLogo,
		});
	}
}

console.log(`\nTransactions with logos to restore: ${logoUpdates.length}`);

// Generate Convex mutation calls
console.log("\n=== Convex Mutation Calls ===\n");

for (const update of logoUpdates) {
	const args: any = { id: update._id };
	if (update.clientLogo) args.clientLogo = update.clientLogo;
	if (update.acquirerLogo) args.acquirerLogo = update.acquirerLogo;

	console.log(`npx convex run transactions:update --prod '${JSON.stringify(args)}'`);
}

console.log(`\n=== Total: ${logoUpdates.length} updates ===`);
