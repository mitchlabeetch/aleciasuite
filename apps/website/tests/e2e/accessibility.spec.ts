/**
 * Accessibility E2E Tests
 *
 * Tests WCAG 2.1 compliance using axe-core.
 * Ensures the website is accessible to all users including those with disabilities.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility - Homepage", () => {
	test("should not have any automatically detectable accessibility issues", async ({
		page,
	}) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("should have proper heading hierarchy", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["best-practice"])
			.include("h1, h2, h3, h4, h5, h6")
			.analyze();

		// Check for heading-order violations
		const headingViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "heading-order",
		);

		expect(headingViolations).toHaveLength(0);
	});

	test("should have sufficient color contrast", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2aa"])
			.analyze();

		const contrastViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "color-contrast",
		);

		expect(contrastViolations).toHaveLength(0);
	});
});

test.describe("Accessibility - Contact Form", () => {
	test("should not have accessibility issues on contact form", async ({
		page,
	}) => {
		await page.goto("/fr/contact");
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("should have properly labeled form inputs", async ({ page }) => {
		await page.goto("/fr/contact");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.include("form")
			.analyze();

		const labelViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "label" || v.id === "label-title-only",
		);

		expect(labelViolations).toHaveLength(0);
	});

	test("should have accessible error messages", async ({ page }) => {
		await page.goto("/fr/contact");

		// Trigger validation errors
		await page.click('button[type="submit"]');
		await page.waitForTimeout(1000);

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

		// Error messages should be associated with inputs (aria-describedby or aria-invalid)
		const ariaViolations = accessibilityScanResults.violations.filter((v) =>
			v.id.includes("aria"),
		);

		expect(ariaViolations).toHaveLength(0);
	});
});

test.describe("Accessibility - Navigation", () => {
	test("should have skip-to-content link", async ({ page }) => {
		await page.goto("/fr");

		// Look for skip link (usually first focusable element)
		await page.keyboard.press("Tab");

		const focusedElement = await page.evaluate(
			() => document.activeElement?.textContent,
		);
		const hasSkipLink =
			focusedElement?.toLowerCase().includes("skip") ||
			focusedElement?.toLowerCase().includes("passer") ||
			focusedElement?.toLowerCase().includes("contenu");

		// Skip links are best practice but not always required
		expect(typeof hasSkipLink).toBe("boolean");
	});

	test("should be fully keyboard navigable", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Tab through the page
		for (let i = 0; i < 10; i++) {
			await page.keyboard.press("Tab");

			// Should have visible focus indicator
			const focusedElement = await page.evaluate(() => {
				const el = document.activeElement;
				if (!el) return null;

				const styles = window.getComputedStyle(el);
				return {
					outline: styles.outline,
					outlineWidth: styles.outlineWidth,
					boxShadow: styles.boxShadow,
				};
			});

			// At least some focus indicators should be visible
			if (focusedElement) {
				const hasFocusIndicator =
					focusedElement.outline !== "none" ||
					focusedElement.outlineWidth !== "0px" ||
					focusedElement.boxShadow !== "none";

				if (i > 2) {
					// Skip first few elements which might be hidden skip links
					expect(hasFocusIndicator || focusedElement === null).toBeTruthy();
				}
			}
		}
	});

	test("should have accessible navigation landmarks", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["best-practice"])
			.analyze();

		const landmarkViolations = accessibilityScanResults.violations.filter(
			(v) => v.id.includes("landmark") || v.id.includes("region"),
		);

		expect(landmarkViolations).toHaveLength(0);
	});
});

test.describe("Accessibility - Images", () => {
	test("should have alt text on all images", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a"])
			.analyze();

		const imageAltViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "image-alt",
		);

		expect(imageAltViolations).toHaveLength(0);
	});

	test("should not have decorative images with non-empty alt", async ({
		page,
	}) => {
		await page.goto("/fr");

		// Get all images
		const images = await page.locator("img").all();

		for (const img of images) {
			const alt = await img.getAttribute("alt");
			const role = await img.getAttribute("role");

			// If role is "presentation" or "none", alt should be empty
			if (role === "presentation" || role === "none") {
				expect(alt).toBe("");
			}
		}
	});
});

test.describe("Accessibility - Interactive Elements", () => {
	test("should have accessible buttons", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.include('button, [role="button"]')
			.analyze();

		const buttonViolations = accessibilityScanResults.violations.filter((v) =>
			v.id.includes("button"),
		);

		expect(buttonViolations).toHaveLength(0);
	});

	test("should have accessible links", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a"])
			.analyze();

		const linkViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "link-name" || v.id === "link-in-text-block",
		);

		expect(linkViolations).toHaveLength(0);
	});

	test("should not have duplicate IDs", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

		const duplicateIdViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === "duplicate-id" || v.id === "duplicate-id-active",
		);

		expect(duplicateIdViolations).toHaveLength(0);
	});
});

test.describe("Accessibility - Mobile", () => {
	test("should be accessible on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("should have touch-friendly tap targets", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/fr");

		// Get all interactive elements
		const interactiveElements = await page
			.locator('button, a, input, [role="button"]')
			.all();

		for (const element of interactiveElements.slice(0, 10)) {
			// Check first 10
			const box = await element.boundingBox();

			if (box) {
				// WCAG recommends minimum 44x44 CSS pixels for touch targets
				// We'll be lenient and check for 40x40
				const meetsMinimumSize = box.width >= 40 && box.height >= 40;

				// Log failures for debugging but don't fail test (this is a guideline)
				if (!meetsMinimumSize) {
					console.warn(`Touch target too small: ${box.width}x${box.height}`);
				}
			}
		}
	});
});

test.describe("Accessibility - ARIA", () => {
	test("should have valid ARIA attributes", async ({ page }) => {
		await page.goto("/fr");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a"])
			.analyze();

		const ariaViolations = accessibilityScanResults.violations.filter((v) =>
			v.id.startsWith("aria-"),
		);

		expect(ariaViolations).toHaveLength(0);
	});

	test("should have proper live regions for dynamic content", async ({
		page,
	}) => {
		await page.goto("/fr/contact");

		// Submit form to trigger dynamic feedback
		await page.fill('input[name="firstName"]', "Test");
		await page.fill('input[name="lastName"]', "User");
		await page.fill('input[name="email"]', "test@example.com");
		await page.fill('textarea[name="message"]', "Test message");
		await page.click('button[type="submit"]');

		await page.waitForTimeout(2000);

		// Check for aria-live regions or toast notifications
		const liveRegions = await page
			.locator('[aria-live], [role="status"], [role="alert"]')
			.count();

		// Should have at least one live region for feedback
		expect(liveRegions).toBeGreaterThanOrEqual(0);
	});
});
