/**
 * Unit Tests for HTML Sanitization
 *
 * Tests the sanitize utility functions to ensure they properly
 * remove malicious content while preserving safe HTML.
 */

import { describe, it, expect } from "vitest";
import {
	sanitizeHtml,
	sanitizeHtmlWithSafeLinks,
	stripHtml,
} from "@/lib/sanitize";

describe("sanitizeHtml", () => {
	it("should allow safe HTML tags", () => {
		const input = "<p>This is a <strong>safe</strong> paragraph.</p>";
		const result = sanitizeHtml(input);
		expect(result).toContain("<p>");
		expect(result).toContain("<strong>");
		expect(result).toContain("safe");
	});

	it("should remove script tags", () => {
		const input = '<p>Hello</p><script>alert("XSS")</script>';
		const result = sanitizeHtml(input);
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("alert");
		expect(result).toContain("<p>Hello</p>");
	});

	it("should remove onclick handlers", () => {
		const input = '<a href="#" onclick="alert(1)">Click me</a>';
		const result = sanitizeHtml(input);
		expect(result).not.toContain("onclick");
		expect(result).toContain("Click me");
	});

	it("should remove javascript: protocol", () => {
		const input = '<a href="javascript:alert(1)">Click</a>';
		const result = sanitizeHtml(input);
		expect(result).not.toContain("javascript:");
	});

	it("should handle null/undefined input", () => {
		expect(sanitizeHtml(null)).toBe("");
		expect(sanitizeHtml(undefined)).toBe("");
		expect(sanitizeHtml("")).toBe("");
	});

	it("should preserve allowed attributes", () => {
		const input = '<a href="https://example.com" title="Example">Link</a>';
		const result = sanitizeHtml(input);
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('title="Example"');
	});

	it("should remove style attributes to prevent CSS injection", () => {
		const input = '<p style="color: red">Text</p>';
		const result = sanitizeHtml(input);
		expect(result).not.toContain("style=");
	});

	it("should preserve images with safe attributes", () => {
		const input = '<img src="/image.jpg" alt="Description" />';
		const result = sanitizeHtml(input);
		expect(result).toContain('src="/image.jpg"');
		expect(result).toContain('alt="Description"');
	});

	it("should remove iframe tags", () => {
		const input = '<iframe src="https://evil.com"></iframe>';
		const result = sanitizeHtml(input);
		expect(result).not.toContain("<iframe");
	});
});

describe("sanitizeHtmlWithSafeLinks", () => {
	it("should add noopener noreferrer to external links", () => {
		const input = '<a href="https://example.com">External Link</a>';
		const result = sanitizeHtmlWithSafeLinks(input);
		expect(result).toContain('rel="noopener noreferrer"');
		expect(result).toContain('target="_blank"');
	});

	it("should not modify internal links", () => {
		const input = '<a href="/about">Internal Link</a>';
		const result = sanitizeHtmlWithSafeLinks(input);
		expect(result).not.toContain("noopener");
		expect(result).toContain("/about");
	});

	it("should handle multiple external links", () => {
		const input = `
      <a href="https://example.com">Link 1</a>
      <a href="https://another.com">Link 2</a>
    `;
		const result = sanitizeHtmlWithSafeLinks(input);
		const matches = result.match(/noopener noreferrer/g);
		expect(matches).toHaveLength(2);
	});

	it("should preserve existing rel attributes", () => {
		const input = '<a href="https://example.com" rel="sponsored">Link</a>';
		const result = sanitizeHtmlWithSafeLinks(input);
		expect(result).toContain("sponsored");
		expect(result).toContain("noopener noreferrer");
	});
});

describe("stripHtml", () => {
	it("should remove all HTML tags", () => {
		const input = "<p>This is <strong>bold</strong> text.</p>";
		const result = stripHtml(input);
		expect(result).toBe("This is bold text.");
		expect(result).not.toContain("<p>");
		expect(result).not.toContain("<strong>");
	});

	it("should handle complex nested HTML", () => {
		const input =
			'<div><h1>Title</h1><p>Paragraph with <a href="#">link</a>.</p></div>';
		const result = stripHtml(input);
		expect(result).toBe("TitleParagraph with link.");
		expect(result).not.toContain("<");
		expect(result).not.toContain(">");
	});

	it("should handle null/undefined input", () => {
		expect(stripHtml(null)).toBe("");
		expect(stripHtml(undefined)).toBe("");
		expect(stripHtml("")).toBe("");
	});

	it("should preserve HTML entities as-is", () => {
		const input = "&lt;p&gt;Test&lt;/p&gt;";
		const result = stripHtml(input);
		// stripHtml preserves HTML entities, doesn't decode them
		expect(result).toBe("&lt;p&gt;Test&lt;/p&gt;");
	});

	it("should remove scripts completely", () => {
		const input = '<script>alert("XSS")</script>Hello';
		const result = stripHtml(input);
		expect(result).toBe("Hello");
		expect(result).not.toContain("alert");
		expect(result).not.toContain("XSS");
	});
});
