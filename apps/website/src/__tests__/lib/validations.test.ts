/**
 * Unit Tests for Validation Schemas
 *
 * Tests the Zod validation schemas to ensure they properly reject
 * invalid input and accept valid input, including XSS prevention.
 */

import { describe, it, expect } from "vitest";
import {
	contactSchema,
	wizardSchema,
	newsletterSchema,
} from "@/lib/validations";

describe("Contact Form Validation", () => {
	it("should accept valid contact form data", () => {
		const validData = {
			firstName: "Jean",
			lastName: "Dupont",
			email: "jean.dupont@example.com",
			company: "Acme Corp",
			phone: "+33 6 12 34 56 78",
			message: "Je souhaite obtenir plus d'informations sur vos services.",
		};

		const result = contactSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject email without @ symbol", () => {
		const invalidData = {
			firstName: "Jean",
			lastName: "Dupont",
			email: "invalidemail",
			message: "Test message",
		};

		const result = contactSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject XSS attempts in message field", () => {
		const xssData = {
			firstName: "Jean",
			lastName: "Dupont",
			email: "test@example.com",
			message: '<script>alert("XSS")</script>',
		};

		const result = contactSchema.safeParse(xssData);
		expect(result.success).toBe(false);
	});

	it("should reject javascript: protocol in message", () => {
		const xssData = {
			firstName: "Jean",
			lastName: "Dupont",
			email: "test@example.com",
			message: "Click here: javascript:alert(1)",
		};

		const result = contactSchema.safeParse(xssData);
		expect(result.success).toBe(false);
	});

	it("should reject names that are too short", () => {
		const invalidData = {
			firstName: "J",
			lastName: "D",
			email: "test@example.com",
			message: "Valid message here",
		};

		const result = contactSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should accept French accented characters", () => {
		const validData = {
			firstName: "François",
			lastName: "Müller",
			email: "francois@example.com",
			message:
				"Bonjour, je m'appelle François et je voudrais des informations.",
		};

		const result = contactSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject message that is too long", () => {
		const longMessage = "a".repeat(5001);
		const invalidData = {
			firstName: "Jean",
			lastName: "Dupont",
			email: "test@example.com",
			message: longMessage,
		};

		const result = contactSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("Wizard Form Validation", () => {
	it("should accept valid wizard data", () => {
		const validData = {
			companyName: "Tech Solutions",
			sector: "Technology",
			turnover: 1500000,
			ebitda: 300000,
			contactName: "Marie Dubois",
			email: "marie@techsolutions.com",
			phone: "+33612345678",
			comments: "Looking to sell our company",
		};

		const result = wizardSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject negative turnover", () => {
		const invalidData = {
			companyName: "Test Corp",
			sector: "Services",
			turnover: -1000,
			contactName: "John Doe",
			email: "john@test.com",
			phone: "+33123456789",
		};

		const result = wizardSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject turnover exceeding maximum", () => {
		const invalidData = {
			companyName: "Test Corp",
			sector: "Services",
			turnover: 2_000_000_000_000, // 2 trillion
			contactName: "John Doe",
			email: "john@test.com",
			phone: "+33123456789",
		};

		const result = wizardSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject XSS in company name", () => {
		const xssData = {
			companyName: '<script>alert("hacked")</script>',
			sector: "Tech",
			turnover: 1000000,
			contactName: "John Doe",
			email: "john@test.com",
			phone: "+33123456789",
		};

		const result = wizardSchema.safeParse(xssData);
		expect(result.success).toBe(false);
	});

	it("should reject invalid email format", () => {
		const invalidData = {
			companyName: "Test Corp",
			sector: "Services",
			turnover: 1000000,
			contactName: "John Doe",
			email: "not-an-email",
			phone: "+33123456789",
		};

		const result = wizardSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("Newsletter Validation", () => {
	it("should accept valid email", () => {
		const validData = {
			email: "newsletter@example.com",
		};

		const result = newsletterSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject invalid email", () => {
		const invalidData = {
			email: "invalid.email",
		};

		const result = newsletterSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject email that is too long", () => {
		const longEmail = "a".repeat(100) + "@example.com";
		const invalidData = {
			email: longEmail,
		};

		const result = newsletterSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});
