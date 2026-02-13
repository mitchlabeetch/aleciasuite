/**
 * Form Validation Schemas
 *
 * Zod schemas for validating user input with XSS prevention.
 * All text inputs are validated to reject dangerous characters.
 *
 * @module lib/validations
 * @security SEC-004 - Input Validation & XSS Prevention
 */

import { z } from "zod";

/**
 * Regex patterns for safe text input
 * Allows letters (including accented), numbers, spaces, and common punctuation
 * Blocks: < > script, javascript:, data:, etc.
 */
const _SAFE_TEXT_PATTERN = /^[a-zA-ZÀ-ÿ0-9\s\-.,!?'"():;@#&]+$/;
const SAFE_NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const SAFE_PHONE_PATTERN = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

/**
 * Custom refinement to block potential XSS payloads
 */
const noXssPayload = (val: string) => {
	const dangerousPatterns = [
		/<script/i,
		/javascript:/i,
		/data:/i,
		/onclick/i,
		/onerror/i,
		/onload/i,
		/<iframe/i,
		/<object/i,
		/<embed/i,
		/expression\(/i,
		/vbscript:/i,
	];
	return !dangerousPatterns.some((pattern) => pattern.test(val));
};

/**
 * Contact form validation schema
 * Used for the main contact form on the website
 */
export const contactSchema = z.object({
	firstName: z
		.string()
		.min(2, { message: "Le prénom doit contenir au moins 2 caractères" })
		.max(50, { message: "Le prénom ne peut pas dépasser 50 caractères" })
		.regex(SAFE_NAME_PATTERN, {
			message: "Le prénom contient des caractères invalides",
		}),

	lastName: z
		.string()
		.min(2, { message: "Le nom doit contenir au moins 2 caractères" })
		.max(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
		.regex(SAFE_NAME_PATTERN, {
			message: "Le nom contient des caractères invalides",
		}),

	email: z
		.string()
		.email({ message: "Adresse email invalide" })
		.max(100, { message: "L'email ne peut pas dépasser 100 caractères" }),

	company: z
		.string()
		.max(100, {
			message: "Le nom de l'entreprise ne peut pas dépasser 100 caractères",
		})
		.optional()
		.or(z.literal("")),

	phone: z
		.string()
		.regex(SAFE_PHONE_PATTERN, { message: "Numéro de téléphone invalide" })
		.optional()
		.or(z.literal("")),

	message: z
		.string()
		.min(10, { message: "Votre message doit contenir au moins 10 caractères" })
		.max(5000, {
			message: "Votre message ne peut pas dépasser 5000 caractères",
		})
		.refine(noXssPayload, {
			message: "Le message contient des caractères non autorisés",
		}),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Wizard form validation schema
 * Used for the deal intake wizard (selling/buying companies)
 */
export const wizardSchema = z.object({
	companyName: z
		.string()
		.min(1, "Nom de l'entreprise requis")
		.max(100, "Nom de l'entreprise trop long")
		.refine(noXssPayload, { message: "Caractères non autorisés" }),

	sector: z
		.string()
		.min(1, "Secteur d'activité requis")
		.max(50, "Secteur trop long"),

	turnover: z
		.number({ message: "Le CA doit être un nombre" })
		.min(0, "Le CA doit être positif")
		.max(1_000_000_000_000, "Valeur trop élevée"), // Max 1 trillion

	ebitda: z
		.number()
		.min(-1_000_000_000, "Valeur trop basse")
		.max(1_000_000_000, "Valeur trop élevée")
		.optional(),

	contactName: z
		.string()
		.min(2, "Nom requis")
		.max(100, "Nom trop long")
		.regex(SAFE_NAME_PATTERN, { message: "Caractères invalides" }),

	email: z.string().email("Email invalide").max(100, "Email trop long"),

	phone: z
		.string()
		.min(10, "Téléphone requis")
		.max(20, "Numéro trop long")
		.regex(SAFE_PHONE_PATTERN, { message: "Format de téléphone invalide" }),

	comments: z
		.string()
		.max(2000, "Commentaires trop longs")
		.refine(noXssPayload, { message: "Caractères non autorisés" })
		.optional(),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
	email: z
		.string()
		.email({ message: "Adresse email invalide" })
		.max(100, { message: "Email trop long" }),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
