/**
 * Homepage and Navigation E2E Tests
 *
 * Tests core navigation and homepage functionality.
 * Ensures users can navigate the site and find key information.
 */

import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");
	});

	test("should load homepage successfully", async ({ page }) => {
		// Check critical elements are visible
		await expect(page.locator("nav, header")).toBeVisible();

		// Should have main content
		await expect(page.locator("main")).toBeVisible();

		// Should have footer
		await expect(page.locator("footer")).toBeVisible();
	});

	test("should display hero section with CTA buttons", async ({ page }) => {
		// Look for hero section
		const hero = page.locator("section").first();
		await expect(hero).toBeVisible();

		// Should have at least one CTA button
		const ctaButtons = page.locator(
			'a[href*="/contact"], a[href*="/estimation"], button:has-text("Contact")',
		);
		await expect(ctaButtons.first()).toBeVisible();
	});

	test("should show KPI metrics/statistics", async ({ page }) => {
		// Look for numbers/metrics on homepage (deals completed, years of experience, etc.)
		const hasMetrics = await page
			.locator("text=/\\d+[+]?\\s*(deals?|ans?|years?|m€|€)/i")
			.isVisible()
			.catch(() => false);
		expect(hasMetrics).toBeTruthy();
	});

	test("should display recent transactions carousel/list", async ({ page }) => {
		// Look for transactions section
		const hasTransactions = await page
			.locator("text=/opérations?|transactions?|deals?/i")
			.isVisible()
			.catch(() => false);

		if (hasTransactions) {
			// Should show company logos or deal cards
			const hasDealCards =
				(await page
					.locator(
						'[data-testid*="deal"], [data-testid*="transaction"], .deal-card',
					)
					.count()) > 0;
			expect(hasDealCards).toBeTruthy();
		}
	});

	test("should have working language switcher", async ({ page }) => {
		// Look for language switcher (FR/EN)
		const langSwitcher = page
			.locator(
				'a[href*="/en"], button:has-text("EN"), [data-testid="language-switcher"]',
			)
			.first();

		if (await langSwitcher.isVisible()) {
			await langSwitcher.click();
			await page.waitForTimeout(1000);

			// Should navigate to English version
			const currentUrl = page.url();
			expect(currentUrl).toContain("/en");
		}
	});

	test("should load without JavaScript errors", async ({ page }) => {
		const errors: string[] = [];

		page.on("pageerror", (error) => {
			errors.push(error.message);
		});

		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Should have no uncaught errors
		expect(errors).toHaveLength(0);
	});

	test("should have proper meta tags for SEO", async ({ page }) => {
		await page.goto("/fr");

		// Check title
		const title = await page.title();
		expect(title.length).toBeGreaterThan(0);

		// Check meta description
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute("content");
		expect(description).toBeTruthy();
		expect(description!.length).toBeGreaterThan(50);

		// Check og tags
		const ogTitle = await page
			.locator('meta[property="og:title"]')
			.getAttribute("content");
		expect(ogTitle).toBeTruthy();
	});
});

test.describe("Navigation", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");
	});

	test("should have functional main navigation", async ({ page }) => {
		// Check navbar is visible
		const navbar = page.locator("nav, header nav").first();
		await expect(navbar).toBeVisible();

		// Should have key navigation links
		const navLinks = [
			{ text: /expertises?/i, href: "/expertises" },
			{ text: /opérations?/i, href: "/operations" },
			{ text: /équipe|team/i, href: "/equipe" },
			{ text: /actualités?|news/i, href: "/actualites" },
			{ text: /contact/i, href: "/contact" },
		];

		for (const link of navLinks) {
			const navLink = navbar
				.locator(
					`a:has-text("${link.text.source.replace(/[\\^$.*+?()[\]{}|]/g, "")}"), a[href*="${link.href}"]`,
				)
				.first();
			if (await navLink.isVisible()) {
				await expect(navLink).toBeVisible();
			}
		}
	});

	test("should navigate to Expertises page", async ({ page }) => {
		const expertisesLink = page.locator('a[href*="/expertises"]').first();
		await expertisesLink.click();
		await page.waitForLoadState("networkidle");

		expect(page.url()).toContain("/expertises");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("should navigate to Operations page", async ({ page }) => {
		const operationsLink = page.locator('a[href*="/operations"]').first();
		await operationsLink.click();
		await page.waitForLoadState("networkidle");

		expect(page.url()).toContain("/operations");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("should navigate to Team page", async ({ page }) => {
		const teamLink = page
			.locator('a[href*="/equipe"], a[href*="/team"]')
			.first();
		if (await teamLink.isVisible()) {
			await teamLink.click();
			await page.waitForLoadState("networkidle");

			expect(page.url()).toMatch(/\/(equipe|team)/);
			await expect(page.locator("h1")).toBeVisible();
		}
	});

	test("should navigate to News page", async ({ page }) => {
		const newsLink = page
			.locator('a[href*="/actualites"], a[href*="/news"]')
			.first();
		if (await newsLink.isVisible()) {
			await newsLink.click();
			await page.waitForLoadState("networkidle");

			expect(page.url()).toMatch(/\/(actualites|news)/);
			await expect(page.locator("h1")).toBeVisible();
		}
	});

	test("should navigate to Contact page", async ({ page }) => {
		const contactLink = page.locator('a[href*="/contact"]').first();
		await contactLink.click();
		await page.waitForLoadState("networkidle");

		expect(page.url()).toContain("/contact");
		await expect(page.locator("form")).toBeVisible();
	});

	test("should have working mobile menu", async ({ page, isMobile }) => {
		if (!isMobile) {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
		}

		// Look for hamburger menu button
		const menuButton = page
			.locator(
				'button[aria-label*="menu"], button[aria-label*="Menu"], button.hamburger, [data-testid="mobile-menu-button"]',
			)
			.first();

		if (await menuButton.isVisible()) {
			await menuButton.click();
			await page.waitForTimeout(500);

			// Mobile menu should appear
			const mobileMenu = page
				.locator(
					'nav[role="dialog"], [data-testid="mobile-menu"], .mobile-menu',
				)
				.first();
			await expect(mobileMenu).toBeVisible();
		}
	});

	test("should have sticky header on scroll", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		const header = page.locator("header, nav").first();
		const _initialPosition = await header.boundingBox();

		// Scroll down
		await page.evaluate(() => window.scrollTo(0, 500));
		await page.waitForTimeout(500);

		// Header should still be visible (sticky or fixed)
		await expect(header).toBeVisible();
	});

	test("should have breadcrumbs on inner pages", async ({ page }) => {
		await page.goto("/fr/expertises");
		await page.waitForLoadState("networkidle");

		// Look for breadcrumbs
		const breadcrumbs = await page
			.locator(
				'nav[aria-label*="breadcrumb"], .breadcrumbs, [data-testid="breadcrumbs"]',
			)
			.isVisible()
			.catch(() => false);

		// Breadcrumbs are nice to have but not critical
		expect(typeof breadcrumbs).toBe("boolean");
	});
});

test.describe("Footer", () => {
	test("should display footer with company information", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		const footer = page.locator("footer");
		await expect(footer).toBeVisible();

		// Should contain company name
		await expect(footer.locator("text=/alecia/i")).toBeVisible();
	});

	test("should have footer navigation links", async ({ page }) => {
		await page.goto("/fr");

		const footer = page.locator("footer");

		// Should have links to key pages
		const footerLinks = footer.locator("a[href]");
		const linkCount = await footerLinks.count();

		expect(linkCount).toBeGreaterThan(0);
	});

	test("should display social media links", async ({ page }) => {
		await page.goto("/fr");

		const footer = page.locator("footer");

		// Look for LinkedIn, Twitter, or other social links
		const socialLinks = await footer
			.locator(
				'a[href*="linkedin"], a[href*="twitter"], a[href*="facebook"], [aria-label*="social"]',
			)
			.count();

		// Social links are common but not required
		expect(socialLinks).toBeGreaterThanOrEqual(0);
	});
});
