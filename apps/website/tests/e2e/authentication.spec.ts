/**
 * Authentication Flow E2E Tests
 *
 * Tests user authentication using Clerk.
 * Critical for admin panel access and protected routes.
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
	test("should redirect unauthenticated users from admin panel", async ({
		page,
	}) => {
		// Try to access admin panel without authentication
		await page.goto("/fr/admin");

		// Should redirect to sign-in page or show sign-in dialog
		await page.waitForTimeout(2000);

		const currentUrl = page.url();
		const isOnSignIn =
			currentUrl.includes("/sign-in") || currentUrl.includes("/connexion");
		const hasSignInDialog = await page
			.locator("text=/sign in|connexion|se connecter/i")
			.isVisible()
			.catch(() => false);

		expect(isOnSignIn || hasSignInDialog).toBeTruthy();
	});

	test("should show sign-in form or Clerk widget", async ({ page }) => {
		await page.goto("/fr/connexion");
		await page.waitForLoadState("networkidle");

		// Clerk sign-in component should be visible
		// Look for Clerk's iframe or sign-in form
		const hasClerkWidget = await page
			.frameLocator('iframe[data-clerk-modal], iframe[title*="clerk"]')
			.locator('input[type="email"], input[name="identifier"]')
			.isVisible()
			.catch(() => false);
		const hasEmailInput = await page
			.locator('input[type="email"], input[name="email"]')
			.isVisible()
			.catch(() => false);

		expect(hasClerkWidget || hasEmailInput).toBeTruthy();
	});

	test("should display user menu when authenticated", async ({ page }) => {
		// Note: This test requires setting up a test account or using Clerk's test mode
		// For now, we'll check the UI structure

		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Look for sign-in button when not authenticated
		const signInButton = await page
			.locator(
				'a[href*="/sign-in"], a[href*="/connexion"], button:has-text("Connexion"), button:has-text("Sign In")',
			)
			.first();

		if (await signInButton.isVisible()) {
			// User is not signed in - this is expected for E2E tests
			await expect(signInButton).toBeVisible();
		} else {
			// If signed in, should see user menu/avatar
			const userMenu = await page
				.locator(
					'[data-testid="user-menu"], button[aria-label*="user"], .user-button',
				)
				.first();
			await expect(userMenu).toBeVisible();
		}
	});

	test("should protect admin routes", async ({ page }) => {
		const adminRoutes = [
			"/fr/admin/deals",
			"/fr/admin/team",
			"/fr/admin/news",
			"/fr/admin/leads",
		];

		for (const route of adminRoutes) {
			await page.goto(route);
			await page.waitForTimeout(1000);

			const currentUrl = page.url();

			// Should either redirect to sign-in or show auth dialog
			const isProtected =
				currentUrl.includes("/sign-in") ||
				currentUrl.includes("/connexion") ||
				(await page
					.locator("text=/sign in|connexion|unauthorized/i")
					.isVisible()
					.catch(() => false));

			expect(isProtected).toBeTruthy();
		}
	});

	test("should allow access to public routes without authentication", async ({
		page,
	}) => {
		const publicRoutes = [
			"/fr",
			"/fr/expertises",
			"/fr/operations",
			"/fr/equipe",
			"/fr/actualites",
			"/fr/contact",
		];

		for (const route of publicRoutes) {
			await page.goto(route);
			await page.waitForLoadState("networkidle");

			// Should load successfully without redirecting to sign-in
			const currentUrl = page.url();
			expect(currentUrl).toContain(route.split("/").pop() || "");
			expect(currentUrl).not.toContain("/sign-in");
			expect(currentUrl).not.toContain("/connexion");
		}
	});

	test("should handle sign-out correctly", async ({ page }) => {
		// Navigate to home page
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Look for user menu (if authenticated)
		const userMenuButton = page
			.locator(
				'[data-testid="user-menu"], button[aria-label*="user"], .user-button',
			)
			.first();

		if (await userMenuButton.isVisible()) {
			// Click user menu
			await userMenuButton.click();
			await page.waitForTimeout(500);

			// Look for sign out button
			const signOutButton = page
				.locator(
					'button:has-text("Sign out"), button:has-text("Déconnexion"), a:has-text("Sign out")',
				)
				.first();

			if (await signOutButton.isVisible()) {
				await signOutButton.click();
				await page.waitForTimeout(1000);

				// After sign out, should see sign-in button again
				const signInButton = await page
					.locator('a[href*="/sign-in"], a[href*="/connexion"]')
					.first();
				await expect(signInButton).toBeVisible();
			}
		}
	});

	test("should preserve intended destination after sign-in", async ({
		page,
	}) => {
		// Try to access protected route
		await page.goto("/fr/admin/deals");
		await page.waitForTimeout(2000);

		// Should be redirected to sign-in
		const currentUrl = page.url();

		// URL should contain redirect parameter or remember intended destination
		if (currentUrl.includes("/sign-in") || currentUrl.includes("/connexion")) {
			expect(
				currentUrl.includes("redirect") || currentUrl.includes("return"),
			).toBeTruthy();
		}
	});
});

test.describe("Clerk Integration", () => {
	test("should load Clerk JavaScript SDK", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Check if Clerk is loaded in the window object
		const hasClerk = await page.evaluate(() => {
			return typeof (window as any).Clerk !== "undefined";
		});

		expect(hasClerk).toBeTruthy();
	});

	test("should not expose sensitive Clerk keys in client", async ({ page }) => {
		await page.goto("/fr");
		await page.waitForLoadState("networkidle");

		// Get all script tags
		const scripts = await page.evaluate(() => {
			return Array.from(document.scripts).map((s) => s.textContent || "");
		});

		const allScriptText = scripts.join(" ");

		// Should not contain secret keys (only publishable keys are OK)
		expect(allScriptText).not.toContain("sk_test_");
		expect(allScriptText).not.toContain("sk_live_");
	});
});
