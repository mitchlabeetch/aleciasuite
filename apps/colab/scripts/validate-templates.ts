import fs from "node:fs";
import path from "node:path";
import "ignore-styles"; // Ignore css imports
import { Editor } from "@tiptap/core";
import type { Schema } from "prosemirror-model";
import "global-jsdom/register"; // Register jsdom globally
import { validationExtensions } from "@/components/editor/extensions/validation";

// Correct path based on where the script is run from.
// If running from apps/web:
const TEMPLATES_DIR = path.join(process.cwd(), "templates");
const LOG_FILE = path.join(process.cwd(), "TEMPLATE_ERRORS.log");

// Clear previous log
if (fs.existsSync(LOG_FILE)) {
	fs.unlinkSync(LOG_FILE);
}

console.log("Building Tiptap Schema...");

let schema: Schema | undefined;
try {
	// We use the Editor class to resolve extensions and build the schema.
	// With global-jsdom/register, document and window are available.
	const editor = new Editor({
		extensions: validationExtensions as any, // Type cast to handle version conflicts between @tiptap/core v2 and v3
		content: "", // Empty content
	});
	schema = editor.schema;
} catch (error) {
	console.error("Failed to build schema:", error);
	process.exit(1);
}

if (!schema) {
	console.error("Failed to build schema: schema is undefined");
	process.exit(1);
}

console.log("Schema built successfully.");

// 2. Validate Templates
if (!fs.existsSync(TEMPLATES_DIR)) {
	// Fallback if running from root
	const altPath = path.join(process.cwd(), "apps/web/templates");
	if (fs.existsSync(altPath)) {
		console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
		console.error(
			`Also checked: ${altPath} but we are running from ${process.cwd()}`,
		);
		process.exit(1);
	}
	console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
	process.exit(1);
}

const files = fs
	.readdirSync(TEMPLATES_DIR)
	.filter((file) => file.endsWith(".json"));

if (files.length === 0) {
	console.log("No JSON templates found.");
	process.exit(0);
}

console.log(`Found ${files.length} templates. Validating...`);

let hasErrors = false;
const errors: string[] = [];

for (const file of files) {
	const filePath = path.join(TEMPLATES_DIR, file);
	console.log(`Validating ${file}...`);

	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const json = JSON.parse(content);

		// 3. Test: strictly parse the JSON into a ProseMirror Node
		schema.nodeFromJSON(json);

		console.log(`  ✅ ${file} is valid.`);
	} catch (err) {
		console.error(`  ❌ ${file} is INVALID.`);
		hasErrors = true;
		let errorMessage = `[${file}] Unknown error`;
		if (err instanceof Error) {
			errorMessage = `[${file}] ${err.message}`;
		}
		errors.push(errorMessage);
	}
}

// 4. Output
if (hasErrors) {
	console.error("Validation failed. Writing errors to TEMPLATE_ERRORS.log");
	fs.writeFileSync(LOG_FILE, errors.join("\n"));
	process.exit(1);
} else {
	console.log("All templates are valid! 🎉");
	process.exit(0);
}
