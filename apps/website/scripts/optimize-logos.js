/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Logo Optimization Script (JavaScript version)
 * Run with: node scripts/optimize-logos.js
 */

const sharp = require("sharp");
const {
	readdirSync,
	statSync,
	mkdirSync,
	writeFileSync,
	existsSync,
} = require("fs");
const { join } = require("path");
const potrace = require("potrace");
const { promisify } = require("util");

const trace = promisify(potrace.trace);

// Configuration
const CONFIG = {
	inputDir: join(__dirname, "../public/assets/operations"),
	outputDir: join(__dirname, "../public/assets/logos-optimized"),
	reportDir: join(__dirname, "../public/assets/logo-reports"),
	minResolution: 200,
	targetSize: 1000,
	threshold: 128,
};

// Ensure output directories exist
if (!existsSync(CONFIG.outputDir)) {
	mkdirSync(CONFIG.outputDir, { recursive: true });
}
if (!existsSync(CONFIG.reportDir)) {
	mkdirSync(CONFIG.reportDir, { recursive: true });
}

/**
 * Enhance logo contrast and prepare for vectorization
 */
async function enhanceLogo(inputPath) {
	const image = sharp(inputPath);
	const metadata = await image.metadata();

	const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
	const shouldUpscale = maxDimension < CONFIG.targetSize;

	return await image
		.resize(CONFIG.targetSize, CONFIG.targetSize, {
			fit: "inside",
			withoutEnlargement: !shouldUpscale,
			kernel: "lanczos3",
		})
		.flatten({ background: "#ffffff" })
		.normalise()
		.grayscale()
		.threshold(CONFIG.threshold)
		.toFormat("png")
		.toBuffer();
}

/**
 * Convert bitmap to SVG using potrace
 */
async function vectorizeLogo(imageBuffer) {
	return await trace(imageBuffer, {
		background: "transparent",
		color: "#ffffff",
		threshold: CONFIG.threshold,
		optTolerance: 0.2,
		turdSize: 2,
		turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
	});
}

/**
 * Assess logo quality based on resolution
 */
function assessQuality(width, height) {
	const minDimension = Math.min(width, height);

	if (minDimension >= 300) return "high";
	if (minDimension >= 150) return "medium";
	return "low";
}

/**
 * Process a single logo file
 */
async function processLogo(filename) {
	const inputPath = join(CONFIG.inputDir, filename);

	try {
		const metadata = await sharp(inputPath).metadata();
		const originalSize = {
			width: metadata.width || 0,
			height: metadata.height || 0,
		};

		const quality = assessQuality(originalSize.width, originalSize.height);

		if (
			!metadata.format ||
			!["png", "jpg", "jpeg", "webp"].includes(metadata.format)
		) {
			return {
				filename,
				status: "failed",
				originalSize,
				quality,
				error: "Unsupported format",
			};
		}

		console.log(
			`Processing ${filename} (${originalSize.width}x${originalSize.height})...`,
		);

		// Enhance and prepare logo
		const enhanced = await enhanceLogo(inputPath);

		// Vectorize
		const svg = await vectorizeLogo(enhanced);

		// Determine status based on quality
		const status = quality === "low" ? "needs_review" : "success";

		// Save SVG
		const outputFilename = filename.replace(/\.(png|jpe?g|webp)$/i, ".svg");
		const outputPath = join(CONFIG.outputDir, outputFilename);
		writeFileSync(outputPath, svg);

		return {
			filename,
			outputFilename,
			status,
			originalSize,
			quality,
		};
	} catch (error) {
		return {
			filename,
			status: "failed",
			originalSize: { width: 0, height: 0 },
			quality: "low",
			error: error.message || "Unknown error",
		};
	}
}

/**
 * Main execution
 */
async function main() {
	console.log("🎨 Logo Optimization Pipeline for French Companies");
	console.log("===================================================\n");

	// Get all logo files
	const files = readdirSync(CONFIG.inputDir).filter((f) => {
		const fullPath = join(CONFIG.inputDir, f);
		return statSync(fullPath).isFile() && /\.(png|jpe?g|webp)$/i.test(f);
	});

	console.log(`Found ${files.length} logo files to process\n`);

	const results = [];

	// Process each logo with progress
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		console.log(`[${i + 1}/${files.length}]`, "");

		const result = await processLogo(file);
		results.push(result);

		// Show progress
		const icon =
			result.status === "success"
				? "✓"
				: result.status === "needs_review"
					? "⚠"
					: "✗";
		console.log(
			`${icon} ${file} - ${result.status} (${result.quality} quality)\n`,
		);
	}

	// Generate JSON report
	const report = {
		processedAt: new Date().toISOString(),
		total: results.length,
		summary: {
			successful: results.filter((r) => r.status === "success").length,
			needsReview: results.filter((r) => r.status === "needs_review").length,
			failed: results.filter((r) => r.status === "failed").length,
		},
		results,
	};

	const reportPath = join(
		CONFIG.reportDir,
		`optimization-report-${Date.now()}.json`,
	);
	writeFileSync(reportPath, JSON.stringify(report, null, 2));

	// Summary
	console.log("\n===================================================");
	console.log("Summary:");
	console.log(
		`✓ Successful: ${report.summary.successful} (${Math.round((report.summary.successful / results.length) * 100)}%)`,
	);
	console.log(
		`⚠ Needs Review: ${report.summary.needsReview} (${Math.round((report.summary.needsReview / results.length) * 100)}%)`,
	);
	console.log(
		`✗ Failed: ${report.summary.failed} (${Math.round((report.summary.failed / results.length) * 100)}%)`,
	);
	console.log(`\n📊 Full report saved to: ${reportPath}`);

	// Show files that need review
	const needsReview = results.filter((r) => r.status === "needs_review");
	if (needsReview.length > 0) {
		console.log("\n📋 Files needing manual review (low resolution):");
		needsReview.forEach((r) => {
			console.log(
				`   - ${r.filename} (${r.originalSize.width}x${r.originalSize.height})`,
			);
		});
	}

	// Show failed files
	const failed = results.filter((r) => r.status === "failed");
	if (failed.length > 0) {
		console.log("\n❌ Failed files:");
		failed.forEach((r) => {
			console.log(`   - ${r.filename}: ${r.error}`);
		});
	}

	console.log("\n✨ Optimization complete!");
	console.log(`📁 Optimized logos saved to: ${CONFIG.outputDir}`);
}

// Run
main().catch(console.error);
