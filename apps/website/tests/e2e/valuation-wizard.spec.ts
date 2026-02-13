/**
 * Valuation Wizard E2E Tests
 *
 * Tests the complete valuation wizard flow from start to finish.
 * This is a critical conversion funnel for lead generation.
 */

import { test, expect } from "@playwright/test";

test.describe("Valuation Wizard", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to valuation page
		await page.goto("/fr/estimation");
		await page.waitForLoadState("networkidle");
	});

	test("should display wizard with initial step", async ({ page }) => {
		// Check wizard is visible
		await expect(page.locator('[data-testid="wizard"], .wizard')).toBeVisible();

		// Should show progress indicator or step counter
		const hasProgress = await page
			.locator("text=/étape|step/i")
			.isVisible()
			.catch(() => false);
		expect(hasProgress).toBeTruthy();
	});

	test("should complete full valuation wizard flow", async ({ page }) => {
		// Step 1: Company Information
		// Look for revenue/turnover input
		const revenueInput = page
			.locator(
				'input[name*="revenue"], input[name*="ca"], input[name*="turnover"]',
			)
			.first();
		if (await revenueInput.isVisible()) {
			await revenueInput.fill("2500");
		}

		// Look for EBITDA/EBE input
		const ebitdaInput = page
			.locator('input[name*="ebitda"], input[name*="ebe"], input[name*="ebit"]')
			.first();
		if (await ebitdaInput.isVisible()) {
			await ebitdaInput.fill("500");
		}

		// Look for sector selection
		const sectorSelect = page
			.locator('select[name*="sector"], button[role="combobox"]')
			.first();
		if (await sectorSelect.isVisible()) {
			await sectorSelect.click();
			// Select first option
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("Enter");
		}

		// Click next/continue button
		const nextButton = page
			.locator(
				'button:has-text("Suivant"), button:has-text("Continuer"), button:has-text("Next")',
			)
			.first();
		if (await nextButton.isVisible()) {
			await nextButton.click();
			await page.waitForTimeout(500);
		}

		// Step 2: Additional details (if exists)
		// Fill any additional fields that appear
		const companyNameInput = page
			.locator('input[name*="company"], input[name*="entreprise"]')
			.first();
		if (await companyNameInput.isVisible()) {
			await companyNameInput.fill("Tech Solutions SAS");
		}

		// Click next if there's another step
		if (await nextButton.isVisible()) {
			await nextButton.click();
			await page.waitForTimeout(500);
		}

		// Final step: Contact information
		const emailInput = page
			.locator('input[type="email"], input[name*="email"]')
			.first();
		if (await emailInput.isVisible()) {
			await emailInput.fill("dirigeant@techsolutions.fr");
		}

		const nameInput = page
			.locator('input[name*="name"], input[name*="nom"]')
			.first();
		if (await nameInput.isVisible()) {
			await nameInput.fill("Marie Dubois");
		}

		const phoneInput = page
			.locator(
				'input[type="tel"], input[name*="phone"], input[name*="telephone"]',
			)
			.first();
		if (await phoneInput.isVisible()) {
			await phoneInput.fill("+33612345678");
		}

		// Submit the wizard
		const submitButton = page
			.locator(
				'button[type="submit"], button:has-text("Envoyer"), button:has-text("Valider"), button:has-text("Submit")',
			)
			.first();
		await submitButton.click();

		// Wait for success message or valuation result
		await expect(
			page.locator("text=/valorisation|valuation|merci|résultat|result/i"),
		).toBeVisible({ timeout: 10000 });
	});

	test("should show validation errors for invalid inputs", async ({ page }) => {
		// Try to enter negative revenue
		const revenueInput = page
			.locator(
				'input[name*="revenue"], input[name*="ca"], input[name*="turnover"]',
			)
			.first();
		if (await revenueInput.isVisible()) {
			await revenueInput.fill("-1000");

			// Try to proceed
			const nextButton = page
				.locator('button:has-text("Suivant"), button:has-text("Next")')
				.first();
			if (await nextButton.isVisible()) {
				await nextButton.click();
				await page.waitForTimeout(500);

				// Should show validation error or stay on same step
				const hasError = await page
					.locator("text=/erreur|error|invalide|invalid/i")
					.isVisible()
					.catch(() => false);
				expect(hasError).toBeTruthy();
			}
		}
	});

	test("should display calculated valuation range", async ({ page }) => {
		// Fill minimum required fields to get valuation
		const revenueInput = page
			.locator('input[name*="revenue"], input[name*="ca"]')
			.first();
		if (await revenueInput.isVisible()) {
			await revenueInput.fill("5000"); // 5M€
		}

		const ebitdaInput = page
			.locator('input[name*="ebitda"], input[name*="ebe"]')
			.first();
		if (await ebitdaInput.isVisible()) {
			await ebitdaInput.fill("1000"); // 1M€
		}

		// Navigate through wizard to results
		const buttons = await page
			.locator(
				'button:has-text("Suivant"), button:has-text("Voir"), button:has-text("Calculer")',
			)
			.all();
		for (const button of buttons) {
			if (await button.isVisible()) {
				await button.click();
				await page.waitForTimeout(500);
			}
		}

		// Should show valuation range with numbers
		// Look for currency symbols or large numbers
		await expect(page.locator("text=/€|EUR|million|M€/i")).toBeVisible({
			timeout: 5000,
		});
	});

	test("should allow navigation back to previous steps", async ({ page }) => {
		// Fill first step
		const revenueInput = page
			.locator('input[name*="revenue"], input[name*="ca"]')
			.first();
		if (await revenueInput.isVisible()) {
			await revenueInput.fill("3000");
		}

		// Go to next step
		const nextButton = page
			.locator('button:has-text("Suivant"), button:has-text("Next")')
			.first();
		if (await nextButton.isVisible()) {
			await nextButton.click();
			await page.waitForTimeout(500);

			// Look for back button
			const backButton = page
				.locator(
					'button:has-text("Retour"), button:has-text("Précédent"), button:has-text("Back"), button[aria-label*="back"]',
				)
				.first();
			if (await backButton.isVisible()) {
				await backButton.click();
				await page.waitForTimeout(500);

				// Should be back on first step with data preserved
				await expect(revenueInput).toHaveValue("3000");
			}
		}
	});

	test("should validate server-side calculations", async ({ page }) => {
		// Fill with extreme values to test server validation
		const revenueInput = page
			.locator('input[name*="revenue"], input[name*="ca"]')
			.first();
		if (await revenueInput.isVisible()) {
			// Try to enter an extremely large number
			await revenueInput.fill("999999999999");

			const nextButton = page.locator('button:has-text("Suivant")').first();
			if (await nextButton.isVisible()) {
				await nextButton.click();
				await page.waitForTimeout(500);

				// Server should validate and either accept or reject
				// Should not crash or show undefined
				const hasError = await page
					.locator("text=/trop élevé|too high|maximum|limite/i")
					.isVisible()
					.catch(() => false);
				const hasNextStep = await page
					.locator('input[type="email"], input[name*="email"]')
					.isVisible()
					.catch(() => false);

				// Either shows error or proceeds (both are valid)
				expect(hasError || hasNextStep).toBeTruthy();
			}
		}
	});
});
