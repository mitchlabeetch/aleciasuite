"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { logger } from "../lib/logger";
import { actionSuccess, actionError, type ActionResult } from "../lib/env";

/**
 * Document Export Actions
 *
 * Export documents to PDF and DOCX formats.
 * Uses html-to-docx for Word documents and pdf generation.
 */

/**
 * Export document content to DOCX format
 */
export const exportToDocx = action({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ base64: string; filename: string }>> => {
		try {
			// Get document
			const document = await ctx.runQuery(
				internal.colab.documents.getInternal,
				{
					id: args.documentId,
				},
			);

			if (!document) {
				return actionError("Document not found", "NOT_FOUND");
			}

			const htmlContent = document.content || "<p>Empty document</p>";
			const title = document.title || "Untitled";

			// Dynamically import html-to-docx
			const HTMLtoDOCX = (await import("html-to-docx")).default;

			// Wrap HTML content in proper document structure
			const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            h1 { font-size: 24pt; margin-bottom: 12pt; }
            h2 { font-size: 18pt; margin-bottom: 10pt; }
            h3 { font-size: 14pt; margin-bottom: 8pt; }
            p { margin-bottom: 8pt; }
            ul, ol { margin-left: 20pt; }
            li { margin-bottom: 4pt; }
            blockquote {
              border-left: 3pt solid #ccc;
              padding-left: 12pt;
              margin-left: 0;
              color: #666;
            }
            code {
              font-family: 'Courier New', monospace;
              background-color: #f4f4f4;
              padding: 2pt 4pt;
            }
            pre {
              background-color: #f4f4f4;
              padding: 12pt;
              overflow-x: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1pt solid #ddd;
              padding: 8pt;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
        </body>
        </html>
      `;

			// Convert to DOCX
			const docxBuffer = await HTMLtoDOCX(fullHtml, null, {
				table: { row: { cantSplit: true } },
				footer: true,
				pageNumber: true,
			});

			// Convert blob/buffer to base64
			let base64: string;
			if (docxBuffer instanceof Blob) {
				const arrayBuffer = await docxBuffer.arrayBuffer();
				base64 = Buffer.from(arrayBuffer).toString("base64");
			} else {
				base64 = Buffer.from(docxBuffer as ArrayBuffer).toString("base64");
			}
			const filename = `${sanitizeFilename(title)}.docx`;

			logger.info("[Export] Document exported to DOCX", {
				documentId: args.documentId,
				filename,
			});

			return actionSuccess({ base64, filename });
		} catch (error) {
			logger.error("[Export] DOCX export failed", { error: String(error) });
			return actionError(
				`Failed to export document: ${(error as Error).message}`,
				"EXPORT_ERROR",
			);
		}
	},
});

/**
 * Export document content to PDF format
 */
export const exportToPdf = action({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ base64: string; filename: string }>> => {
		try {
			// Get document
			const document = await ctx.runQuery(
				internal.colab.documents.getInternal,
				{
					id: args.documentId,
				},
			);

			if (!document) {
				return actionError("Document not found", "NOT_FOUND");
			}

			const htmlContent = document.content || "<p>Empty document</p>";
			const title = document.title || "Untitled";

			// Use pdf-lib to create PDF
			const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
			const { convert } = await import("html-to-text");

			// Convert HTML to plain text for PDF
			const plainText = convert(htmlContent, {
				wordwrap: 80,
				selectors: [
					{ selector: "h1", format: "heading" },
					{ selector: "h2", format: "heading" },
					{ selector: "h3", format: "heading" },
					{ selector: "ul", format: "unorderedList" },
					{ selector: "ol", format: "orderedList" },
					{ selector: "a", format: "anchor" },
					{ selector: "img", format: "skip" },
				],
			});

			// Create PDF
			const pdfDoc = await PDFDocument.create();
			const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
			const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

			const fontSize = 11;
			const titleFontSize = 18;
			const lineHeight = fontSize * 1.4;
			const margin = 50;
			const pageWidth = 595; // A4 width in points
			const pageHeight = 842; // A4 height in points
			const maxWidth = pageWidth - 2 * margin;

			// Split text into lines
			const lines = plainText.split("\n");
			let page = pdfDoc.addPage([pageWidth, pageHeight]);
			let y = pageHeight - margin;

			// Add title
			page.drawText(title, {
				x: margin,
				y: y,
				size: titleFontSize,
				font: boldFont,
				color: rgb(0, 0, 0),
			});
			y -= titleFontSize + 20;

			// Add content
			for (const line of lines) {
				// Check if we need a new page
				if (y < margin + lineHeight) {
					page = pdfDoc.addPage([pageWidth, pageHeight]);
					y = pageHeight - margin;
				}

				// Word wrap long lines
				const words = line.split(" ");
				let currentLine = "";

				for (const word of words) {
					const testLine = currentLine ? `${currentLine} ${word}` : word;
					const textWidth = font.widthOfTextAtSize(testLine, fontSize);

					if (textWidth > maxWidth && currentLine) {
						page.drawText(currentLine, {
							x: margin,
							y: y,
							size: fontSize,
							font: font,
							color: rgb(0, 0, 0),
						});
						y -= lineHeight;
						currentLine = word;

						if (y < margin + lineHeight) {
							page = pdfDoc.addPage([pageWidth, pageHeight]);
							y = pageHeight - margin;
						}
					} else {
						currentLine = testLine;
					}
				}

				if (currentLine) {
					page.drawText(currentLine, {
						x: margin,
						y: y,
						size: fontSize,
						font: font,
						color: rgb(0, 0, 0),
					});
					y -= lineHeight;
				} else {
					// Empty line
					y -= lineHeight / 2;
				}
			}

			// Add page numbers
			const pages = pdfDoc.getPages();
			for (let i = 0; i < pages.length; i++) {
				const pageNum = pages[i];
				pageNum.drawText(`${i + 1} / ${pages.length}`, {
					x: pageWidth / 2 - 20,
					y: 25,
					size: 10,
					font: font,
					color: rgb(0.5, 0.5, 0.5),
				});
			}

			// Serialize to bytes
			const pdfBytes = await pdfDoc.save();
			const base64 = Buffer.from(pdfBytes).toString("base64");
			const filename = `${sanitizeFilename(title)}.pdf`;

			logger.info("[Export] Document exported to PDF", {
				documentId: args.documentId,
				filename,
				pages: pages.length,
			});

			return actionSuccess({ base64, filename });
		} catch (error) {
			logger.error("[Export] PDF export failed", { error: String(error) });
			return actionError(
				`Failed to export document: ${(error as Error).message}`,
				"EXPORT_ERROR",
			);
		}
	},
});

/**
 * Export document content to HTML format (for download)
 */
export const exportToHtml = action({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ base64: string; filename: string }>> => {
		try {
			// Get document
			const document = await ctx.runQuery(
				internal.colab.documents.getInternal,
				{
					id: args.documentId,
				},
			);

			if (!document) {
				return actionError("Document not found", "NOT_FOUND");
			}

			const htmlContent = document.content || "<p>Empty document</p>";
			const title = document.title || "Untitled";

			// Create full HTML document
			const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 { font-size: 2em; margin-bottom: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.2em; }
    p { margin: 1em 0; }
    ul, ol { padding-left: 2em; }
    li { margin: 0.5em 0; }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #666;
      background: #f9f9f9;
    }
    code {
      font-family: 'Monaco', 'Menlo', monospace;
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f4f4f4; }
    img { max-width: 100%; height: auto; }
    a { color: #0066cc; }
    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${htmlContent}
  <footer style="margin-top: 3em; padding-top: 1em; border-top: 1px solid #eee; color: #999; font-size: 0.9em;">
    Exported on ${new Date().toLocaleDateString("fr-FR")}
  </footer>
</body>
</html>`;

			const base64 = Buffer.from(fullHtml).toString("base64");
			const filename = `${sanitizeFilename(title)}.html`;

			logger.info("[Export] Document exported to HTML", {
				documentId: args.documentId,
				filename,
			});

			return actionSuccess({ base64, filename });
		} catch (error) {
			logger.error("[Export] HTML export failed", { error: String(error) });
			return actionError(
				`Failed to export document: ${(error as Error).message}`,
				"EXPORT_ERROR",
			);
		}
	},
});

// Helper functions
function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "")
		.replace(/\s+/g, "_")
		.slice(0, 100);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
