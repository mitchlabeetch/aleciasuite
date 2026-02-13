"use node";

/**
 * PDF Watermarking Utility
 *
 * Adds watermarks to PDF documents for VDR security.
 * Uses pdf-lib for PDF manipulation in Node.js runtime.
 *
 * Features:
 * - User email/name watermark
 * - Timestamp watermark
 * - Diagonal text across pages
 * - Semi-transparent overlay
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface WatermarkOptions {
	/** User's email address to display on watermark */
	userEmail: string;
	/** User's name (optional, displayed with email) */
	userName?: string;
	/** Text opacity (0-1, default 0.15) */
	opacity?: number;
	/** Font size (default 48) */
	fontSize?: number;
	/** Rotation angle in degrees (default -45) */
	rotation?: number;
	/** Include timestamp (default true) */
	includeTimestamp?: boolean;
	/** Additional custom text line */
	customText?: string;
}

/**
 * Add a diagonal watermark to all pages of a PDF
 *
 * @param pdfBytes - The original PDF as a Uint8Array or ArrayBuffer
 * @param options - Watermark configuration options
 * @returns The watermarked PDF as a Uint8Array
 */
export async function addWatermarkToPdf(
	pdfBytes: Uint8Array | ArrayBuffer,
	options: WatermarkOptions,
): Promise<Uint8Array> {
	const {
		userEmail,
		userName,
		opacity = 0.15,
		fontSize = 48,
		rotation = -45,
		includeTimestamp = true,
		customText,
	} = options;

	// Load the existing PDF
	const pdfDoc = await PDFDocument.load(pdfBytes);

	// Get the Helvetica font (always available)
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

	// Build watermark text lines
	const lines: string[] = [];

	if (userName) {
		lines.push(userName);
	}
	lines.push(userEmail);

	if (includeTimestamp) {
		const now = new Date();
		const timestamp =
			now.toISOString().split("T")[0] +
			" " +
			now.toTimeString().split(" ")[0].slice(0, 5);
		lines.push(`Downloaded: ${timestamp}`);
	}

	if (customText) {
		lines.push(customText);
	}

	// Combine lines into single watermark text
	const watermarkText = lines.join(" - ");

	// Apply watermark to all pages
	const pages = pdfDoc.getPages();

	for (const page of pages) {
		const { width, height } = page.getSize();

		// Calculate text dimensions
		const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

		// Position watermark in center of page
		// We need to account for rotation when positioning
		const centerX = width / 2;
		const centerY = height / 2;

		// Draw watermark text (repeated pattern for coverage)
		const positions = [
			{ x: centerX, y: centerY }, // Center
			{ x: centerX - width * 0.3, y: centerY + height * 0.25 }, // Top-left area
			{ x: centerX + width * 0.3, y: centerY - height * 0.25 }, // Bottom-right area
		];

		for (const pos of positions) {
			page.drawText(watermarkText, {
				x: pos.x - textWidth / 2,
				y: pos.y,
				size: fontSize,
				font,
				color: rgb(0.5, 0.5, 0.5), // Gray color
				opacity,
				rotate: degrees(rotation),
			});
		}
	}

	// Save the modified PDF
	return pdfDoc.save();
}

/**
 * Check if a file is a PDF based on its content type
 */
export function isPdfFile(contentType: string): boolean {
	return (
		contentType === "application/pdf" ||
		contentType === "application/x-pdf" ||
		contentType.endsWith("/pdf")
	);
}

/**
 * Check if a file is a PDF based on its filename
 */
export function isPdfFileName(fileName: string): boolean {
	return fileName.toLowerCase().endsWith(".pdf");
}

/**
 * Generate a watermark text for a given user and document
 */
export function generateWatermarkText(
	userEmail: string,
	documentName?: string,
): string {
	const timestamp = new Date().toISOString().split("T")[0];
	const parts = [userEmail, timestamp];
	if (documentName) {
		parts.push(documentName);
	}
	return parts.join(" | ");
}
