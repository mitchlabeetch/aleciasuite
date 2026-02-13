/**
 * Unit Tests for Utility Functions
 *
 * Tests common utility functions like currency formatting and className merging.
 */

import { describe, it, expect } from "vitest";
import { formatCurrency, cn } from "@/lib/utils";

describe("formatCurrency", () => {
	it("should format numbers as EUR by default", () => {
		const result = formatCurrency(1000);
		expect(result).toContain("1");
		expect(result).toContain("000");
		expect(result).toContain("€");
	});

	it("should format large numbers correctly", () => {
		const result = formatCurrency(1500000);
		// Should be formatted with spaces as thousand separators in French
		expect(result).toBeTruthy();
		expect(result).toContain("€");
	});

	it("should handle zero", () => {
		const result = formatCurrency(0);
		expect(result).toContain("0");
		expect(result).toContain("€");
	});

	it("should round decimals to whole numbers", () => {
		const result = formatCurrency(1234.56);
		expect(result).not.toContain(",56");
		expect(result).not.toContain(".56");
	});

	it("should support different locales", () => {
		const frResult = formatCurrency(1000, "fr-FR");
		const enResult = formatCurrency(1000, "en-US");
		// Both should contain the number and currency, but formatted differently
		expect(frResult).toBeTruthy();
		expect(enResult).toBeTruthy();
	});

	it("should support different currencies", () => {
		const eurResult = formatCurrency(1000, "en-US", "EUR");
		const usdResult = formatCurrency(1000, "en-US", "USD");
		expect(eurResult).toContain("€");
		expect(usdResult).toContain("$");
	});
});

describe("cn (className utility)", () => {
	it("should merge multiple class names", () => {
		const result = cn("class1", "class2", "class3");
		expect(result).toContain("class1");
		expect(result).toContain("class2");
		expect(result).toContain("class3");
	});

	it("should handle conditional classes", () => {
		const result = cn("base", true && "conditional", false && "excluded");
		expect(result).toContain("base");
		expect(result).toContain("conditional");
		expect(result).not.toContain("excluded");
	});

	it("should handle undefined and null", () => {
		const result = cn("base", undefined, null, "end");
		expect(result).toContain("base");
		expect(result).toContain("end");
	});

	it("should merge Tailwind conflicting classes correctly", () => {
		// tailwind-merge should keep only the last conflicting class
		const result = cn("p-4", "p-8");
		expect(result).toContain("p-8");
		expect(result).not.toContain("p-4");
	});

	it("should handle arrays of classes", () => {
		const result = cn(["class1", "class2"], "class3");
		expect(result).toContain("class1");
		expect(result).toContain("class2");
		expect(result).toContain("class3");
	});

	it("should handle objects", () => {
		const result = cn({
			active: true,
			inactive: false,
			base: true,
		});
		expect(result).toContain("active");
		expect(result).toContain("base");
		expect(result).not.toContain("inactive");
	});
});
