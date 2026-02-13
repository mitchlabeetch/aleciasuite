"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { logger } from "../lib/logger";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	hasEnv,
	type ActionResult,
} from "../lib/env";

/**
 * Pappers API Response Types
 */
interface PappersCompany {
	nom_entreprise?: string;
	siren: string;
	code_naf?: string;
	libelle_code_naf?: string;
	numero_tva_intracommunautaire?: string;
	siege?: {
		adresse_ligne_1?: string;
		adresse_ligne_2?: string;
		ville?: string;
		code_postal?: string;
		pays?: string;
	};
	chiffre_affaires?: number;
	resultat?: number;
	annee_comptes?: number;
	effectif?: string;
	forme_juridique?: string;
	date_creation?: string;
	capital?: number;
	dirigeants?: Array<{
		nom?: string;
		prenom?: string;
		fonction?: string;
	}>;
}

interface PappersDetailedResponse {
	nom_entreprise?: string;
	siren: string;
	siret_siege?: string;
	code_naf?: string;
	libelle_code_naf?: string;
	numero_tva_intracommunautaire?: string;
	siege?: PappersCompany["siege"];
	chiffre_affaires?: number;
	resultat?: number;
	effectif?: string;
	forme_juridique?: string;
	date_creation?: string;
	capital?: number;
	dirigeants?: PappersCompany["dirigeants"];
	finances?: Array<{
		annee: number;
		chiffre_affaires?: number;
		resultat?: number;
	}>;
}

/**
 * Search companies via Pappers API
 */
export const searchCompanyPappers = action({
	args: { query: v.string() },
	handler: async (_ctx, args) => {
		// Check if Pappers is configured
		const integrationError = checkIntegration("pappers");
		if (integrationError) return integrationError;

		const apiKey = process.env.PAPPERS_API_KEY;
		if (!apiKey) {
			return actionError(
				"Pappers API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const response = await fetch(
				`https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(args.query)}&api_token=${apiKey}`,
				{ method: "GET" },
			);

			if (!response.ok) {
				return actionError(
					`Pappers API error: ${response.statusText}`,
					"API_ERROR",
				);
			}

			const data = await response.json();

			// Map Pappers result to our schema
			const companies = data.resultats.map((company: PappersCompany) => ({
				name: company.nom_entreprise || "",
				siren: company.siren,
				nafCode: company.code_naf,
				nafLabel: company.libelle_code_naf,
				vatNumber: company.numero_tva_intracommunautaire,
				address: {
					street:
						`${company.siege?.adresse_ligne_1 || ""} ${company.siege?.adresse_ligne_2 || ""}`.trim(),
					city: company.siege?.ville || "",
					zip: company.siege?.code_postal || "",
					country: company.siege?.pays || "France",
				},
				financials: {
					revenue: company.chiffre_affaires,
					ebitda: company.resultat,
					year: company.annee_comptes,
				},
				effectif: company.effectif,
				formeJuridique: company.forme_juridique,
				pappersId: company.siren,
			}));

			return actionSuccess(companies);
		} catch (error) {
			logger.error("Error searching Pappers", { error: String(error) });
			return actionError("Failed to search companies. Please try again.");
		}
	},
});

/**
 * Get detailed company information by SIREN
 */
export const getCompanyBySiren = action({
	args: { siren: v.string() },
	handler: async (_ctx, args) => {
		// Check if Pappers is configured
		const integrationError = checkIntegration("pappers");
		if (integrationError) return integrationError;

		const apiKey = process.env.PAPPERS_API_KEY;
		if (!apiKey) {
			return actionError(
				"Pappers API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		// Validate SIREN format (9 digits)
		if (!/^\d{9}$/.test(args.siren)) {
			return actionError(
				"Invalid SIREN format. Expected 9 digits.",
				"API_ERROR",
			);
		}

		try {
			const response = await fetch(
				`https://api.pappers.fr/v2/entreprise?siren=${args.siren}&api_token=${apiKey}`,
				{ method: "GET" },
			);

			if (!response.ok) {
				if (response.status === 404) {
					return actionSuccess(null); // Company not found - valid response
				}
				return actionError(
					`Pappers API error: ${response.statusText}`,
					"API_ERROR",
				);
			}

			const company: PappersDetailedResponse = await response.json();

			return actionSuccess({
				name: company.nom_entreprise || "",
				siren: company.siren,
				siret: company.siret_siege,
				nafCode: company.code_naf,
				nafLabel: company.libelle_code_naf,
				vatNumber: company.numero_tva_intracommunautaire,
				address: {
					street:
						`${company.siege?.adresse_ligne_1 || ""} ${company.siege?.adresse_ligne_2 || ""}`.trim(),
					city: company.siege?.ville || "",
					zip: company.siege?.code_postal || "",
					country: company.siege?.pays || "France",
				},
				financials: {
					revenue: company.chiffre_affaires,
					ebitda: company.resultat,
					history:
						company.finances?.map((f) => ({
							year: f.annee,
							revenue: f.chiffre_affaires,
							ebitda: f.resultat,
						})) || [],
				},
				effectif: company.effectif,
				formeJuridique: company.forme_juridique,
				dateCreation: company.date_creation,
				capital: company.capital,
				dirigeants:
					company.dirigeants?.map((d) => ({
						name: `${d.prenom || ""} ${d.nom || ""}`.trim(),
						role: d.fonction,
					})) || [],
			});
		} catch (error) {
			logger.error("Error fetching company by SIREN", {
				error: String(error),
				siren: args.siren,
			});
			return actionError("Failed to fetch company details. Please try again.");
		}
	},
});

/**
 * Enrich company data using Pappers SIREN lookup + Clearbit for logo
 * This function gracefully handles missing Pappers API key - it will still return
 * the logo URL if domain is provided.
 */
export const enrichCompanyData = action({
	args: {
		siren: v.optional(v.string()),
		domain: v.optional(v.string()),
	},
	handler: async (_ctx, args) => {
		let pappersData = null;

		// Fetch from Pappers if SIREN provided AND Pappers is configured
		if (args.siren && hasEnv("PAPPERS_API_KEY")) {
			const apiKey = process.env.PAPPERS_API_KEY;
			try {
				const response = await fetch(
					`https://api.pappers.fr/v2/entreprise?siren=${args.siren}&api_token=${apiKey}`,
					{ method: "GET" },
				);

				if (response.ok) {
					const company: PappersDetailedResponse = await response.json();
					pappersData = {
						name: company.nom_entreprise,
						nafCode: company.code_naf,
						nafLabel: company.libelle_code_naf,
						formeJuridique: company.forme_juridique,
						capital: company.capital,
						effectif: company.effectif,
						dateCreation: company.date_creation,
						address: {
							street:
								`${company.siege?.adresse_ligne_1 || ""} ${company.siege?.adresse_ligne_2 || ""}`.trim(),
							city: company.siege?.ville || "",
							zip: company.siege?.code_postal || "",
						},
						financials: {
							revenue: company.chiffre_affaires,
							ebitda: company.resultat,
							history: company.finances?.slice(0, 3) || [],
						},
						dirigeants:
							company.dirigeants?.slice(0, 5).map((d) => ({
								name: `${d.prenom || ""} ${d.nom || ""}`.trim(),
								role: d.fonction,
							})) || [],
					};
				}
			} catch (error) {
				logger.error("Pappers enrichment failed", { error: String(error) });
				// Don't throw - graceful degradation, continue without Pappers data
			}
		}

		// Build enriched response - always succeeds, even with partial data
		return actionSuccess({
			...pappersData,
			logoUrl: args.domain ? `https://logo.clearbit.com/${args.domain}` : null,
			enrichedAt: new Date().toISOString(),
			pappersAvailable: hasEnv("PAPPERS_API_KEY"),
		});
	},
});

/**
 * Generate AI-powered deal summary using Groq
 */
export const generateDealSummary = action({
	args: {
		companyName: v.string(),
		sector: v.optional(v.string()),
		revenue: v.optional(v.number()),
		ebitda: v.optional(v.number()),
		dealType: v.union(
			v.literal("cession"),
			v.literal("acquisition"),
			v.literal("levee"),
		),
	},
	handler: async (_ctx, args) => {
		// Check if Groq is configured
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const prompt = `Tu es un assistant spécialisé en fusions-acquisitions (M&A) pour un cabinet de conseil français.
Génère un résumé professionnel pour un dossier de ${args.dealType === "cession" ? "cession" : args.dealType === "acquisition" ? "acquisition" : "levée de fonds"}.

Informations:
- Société: ${args.companyName}
- Secteur: ${args.sector || "Non spécifié"}
- Chiffre d'affaires: ${args.revenue ? `${(args.revenue / 1_000_000).toFixed(1)}M€` : "Non communiqué"}
- EBITDA: ${args.ebitda ? `${(args.ebitda / 1_000_000).toFixed(2)}M€` : "Non communiqué"}

Génère un résumé de 3-4 phrases professionnel et factuel en français.`;

		try {
			const response = await fetch(
				"https://api.groq.com/openai/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: "llama-3.3-70b-versatile",
						messages: [{ role: "user", content: prompt }],
						temperature: 0.7,
						max_tokens: 300,
					}),
				},
			);

			if (!response.ok) {
				return actionError(
					`Groq API error: ${response.statusText}`,
					"API_ERROR",
				);
			}

			const data = await response.json();
			return actionSuccess({
				summary: data.choices[0]?.message?.content || "Résumé non disponible",
				generatedAt: new Date().toISOString(),
			});
		} catch (error) {
			logger.error("Error generating deal summary", { error: String(error) });
			return actionError("Failed to generate summary. Please try again.");
		}
	},
});
