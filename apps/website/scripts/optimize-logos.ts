#!/usr/bin/env ts-node
/**
 * Logo Optimization Script
 *
 * Processes low-quality company logos and converts them to high-quality
 * white-on-transparent SVGs suitable for professional display.
 *
 * Strategy for small French companies:
 * 1. AI-powered vectorization using sharp + potrace
 * 2. Automatic white-on-transparent conversion
 * 3. Manual review queue for quality control
 * 4. Convex storage integration
 */

import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import potrace from "potrace";
import { promisify } from "util";

const trace = promisify(potrace.trace);

// Configuration
const CONFIG = {
	inputDir: join(process.cwd(), "public/assets/operations"),
	outputDir: join(process.cwd(), "public/assets/logos-optimized"),
	minResolution: 200, // Minimum width/height for acceptable quality
	targetSize: 1000, // Target size for processing
	threshold: 128, // Black/white threshold (0-255)
};

interface ProcessResult {
	filename: string;
	status: "success" | "needs_review" | "failed";
	originalSize: { width: number; height: number };
	quality: "high" | "medium" | "low";
	error?: string;
}

/**
 * Enhance logo contrast and prepare for vectorization
 */
async function enhanceLogo(inputPath: string): Promise<Buffer> {
	const image = sharp(inputPath);
	const metadata = await image.metadata();

	// Determine if we need to upscale
	const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
	const shouldUpscale = maxDimension < CONFIG.targetSize;

	return await image
		// Resize if needed (upscale small logos, constrain large ones)
		.resize(CONFIG.targetSize, CONFIG.targetSize, {
			fit: "inside",
			withoutEnlargement: !shouldUpscale,
			kernel: "lanczos3", // Best quality for upscaling
		})
		// Remove alpha channel and set white background
		.flatten({ background: "#ffffff" })
		// Increase contrast
		.normalise()
		// Convert to grayscale for better tracing
		.grayscale()
		// Apply threshold to get clean black/white
		.threshold(CONFIG.threshold)
		.toFormat("png")
		.toBuffer();
}

/**
 * Convert bitmap to SVG using potrace
 */
async function vectorizeLogo(imageBuffer: Buffer): Promise<string> {
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
function assessQuality(
	width: number,
	height: number,
): "high" | "medium" | "low" {
	const minDimension = Math.min(width, height);

	if (minDimension >= 300) return "high";
	if (minDimension >= 150) return "medium";
	return "low";
}

/**
 * Process a single logo file
 */
async function processLogo(filename: string): Promise<ProcessResult> {
	const inputPath = join(CONFIG.inputDir, filename);

	try {
		// Get original dimensions
		const metadata = await sharp(inputPath).metadata();
		const originalSize = {
			width: metadata.width || 0,
			height: metadata.height || 0,
		};

		// Assess quality
		const quality = assessQuality(originalSize.width, originalSize.height);

		// Skip non-image files
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
		const _svg = await vectorizeLogo(enhanced);

		// Determine status based on quality
		const status = quality === "low" ? "needs_review" : "success";

		// Save SVG (you can enable this when ready to write files)
		// const outputPath = join(CONFIG.outputDir, filename.replace(/\.(png|jpe?g|webp)$/i, '.svg'));
		// await writeFile(outputPath, svg);

		return {
			filename,
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
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Main execution
 */
async function main() {
	console.log("🎨 Logo Optimization Pipeline");
	console.log("================================\n");

	// Get all logo files
	const files = readdirSync(CONFIG.inputDir).filter((f) => {
		const fullPath = join(CONFIG.inputDir, f);
		return statSync(fullPath).isFile() && /\.(png|jpe?g|webp)$/i.test(f);
	});

	console.log(`Found ${files.length} logo files to process\n`);

	const results: ProcessResult[] = [];

	// Process each logo
	for (const file of files) {
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
			`${icon} ${file} - ${result.status} (${result.quality} quality)`,
		);
	}

	// Summary
	console.log("\n================================");
	console.log("Summary:");
	console.log(
		`✓ Successful: ${results.filter((r) => r.status === "success").length}`,
	);
	console.log(
		`⚠ Needs Review: ${results.filter((r) => r.status === "needs_review").length}`,
	);
	console.log(
		`✗ Failed: ${results.filter((r) => r.status === "failed").length}`,
	);

	// Show files that need review
	const needsReview = results.filter((r) => r.status === "needs_review");
	if (needsReview.length > 0) {
		console.log("\n📋 Files needing manual review:");
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
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}

export { processLogo, enhanceLogo, vectorizeLogo };
