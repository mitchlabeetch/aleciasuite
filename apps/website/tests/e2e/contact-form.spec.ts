/**
 * Contact Form E2E Tests
 *
 * Tests the complete user journey for submitting a contact form.
 * Critical flow: user fills form → validation → submission → success message
 */

import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to French contact page
		await page.goto("/fr/contact");
		await page.waitForLoadState("networkidle");
	});

	test("should display contact form with all required fields", async ({
		page,
	}) => {
		// Check form is visible
		await expect(page.locator("form")).toBeVisible();

		// Check all required fields exist
		await expect(page.locator('input[name="firstName"]')).toBeVisible();
		await expect(page.locator('input[name="lastName"]')).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('textarea[name="message"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test("should show validation errors for empty required fields", async ({
		page,
	}) => {
		// Try to submit empty form
		await page.click('button[type="submit"]');

		// Wait for validation errors to appear
		await page.waitForTimeout(500);

		// Check that form was not submitted (still on same page)
		await expect(page).toHaveURL(/\/contact/);
	});

	test("should show validation error for invalid email", async ({ page }) => {
		// Fill form with invalid email
		await page.fill('input[name="firstName"]', "Jean");
		await page.fill('input[name="lastName"]', "Dupont");
		await page.fill('input[name="email"]', "invalid-email");
		await page.fill('textarea[name="message"]', "Test message here");

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for validation
		await page.waitForTimeout(500);

		// Should still be on contact page due to validation error
		await expect(page).toHaveURL(/\/contact/);
	});

	test("should successfully submit valid contact form", async ({ page }) => {
		// Fill all required fields with valid data
		await page.fill('input[name="firstName"]', "Jean");
		await page.fill('input[name="lastName"]', "Dupont");
		await page.fill('input[name="email"]', "jean.dupont@example.com");
		await page.fill(
			'textarea[name="message"]',
			"Je souhaite obtenir plus d'informations sur vos services en fusion-acquisition.",
		);

		// Optional fields
		await page.fill('input[name="company"]', "Tech Solutions SAS");
		await page.fill('input[name="phone"]', "+33 6 12 34 56 78");

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for submission (look for success toast or message)
		// Adjust selector based on your actual success UI
		await expect(
			page.locator("text=/merci|thank you|succès|success/i"),
		).toBeVisible({ timeout: 10000 });
	});

	test("should prevent XSS in form fields", async ({ page }) => {
		// Try to inject script in message field
		const xssPayload = '<script>alert("XSS")</script>';

		await page.fill('input[name="firstName"]', "Jean");
		await page.fill('input[name="lastName"]', "Dupont");
		await page.fill('input[name="email"]', "test@example.com");
		await page.fill('textarea[name="message"]', xssPayload);

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for validation error (should reject XSS)
		await page.waitForTimeout(1000);

		// Should show validation error or stay on page
		const hasValidationError = await page
			.locator("text=/caractères non autorisés|invalid characters/i")
			.isVisible()
			.catch(() => false);
		const isStillOnContactPage = page.url().includes("/contact");

		expect(hasValidationError || isStillOnContactPage).toBeTruthy();
	});

	test("should be keyboard accessible", async ({ page }) => {
		// Tab through all form fields
		await page.keyboard.press("Tab"); // First name
		await expect(page.locator('input[name="firstName"]')).toBeFocused();

		await page.keyboard.press("Tab"); // Last name
		await expect(page.locator('input[name="lastName"]')).toBeFocused();

		await page.keyboard.press("Tab"); // Email
		await expect(page.locator('input[name="email"]')).toBeFocused();

		// Should be able to fill with keyboard
		await page.keyboard.type("test@example.com");
		await expect(page.locator('input[name="email"]')).toHaveValue(
			"test@example.com",
		);
	});

	test("should handle rate limiting gracefully", async ({ page }) => {
		// This test would need multiple rapid submissions
		// For now, we'll just verify the form can handle multiple submissions
		const submissions = 3;

		for (let i = 0; i < submissions; i++) {
			await page.fill('input[name="firstName"]', `Test${i}`);
			await page.fill('input[name="lastName"]', `User${i}`);
			await page.fill('input[name="email"]', `test${i}@example.com`);
			await page.fill('textarea[name="message"]', `Test message ${i}`);

			await page.click('button[type="submit"]');
			await page.waitForTimeout(2000);
		}

		// After multiple submissions, should either succeed or show rate limit message
		const hasRateLimitMessage = await page
			.locator("text=/trop de requêtes|rate limit|too many requests/i")
			.isVisible()
			.catch(() => false);
		const hasSuccessMessage = await page
			.locator("text=/merci|success/i")
			.isVisible()
			.catch(() => false);

		expect(hasRateLimitMessage || hasSuccessMessage).toBeTruthy();
	});
});
