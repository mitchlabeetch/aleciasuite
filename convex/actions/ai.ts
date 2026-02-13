"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { logger } from "../lib/logger";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	type ActionResult,
} from "../lib/env";

// --- Lazy Client Initialization ---
// Clients are only created when actually needed, avoiding startup crashes

function getGroqClient(): Groq | null {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) return null;
	return new Groq({ apiKey });
}

function getOpenAIClient(): OpenAI | null {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) return null;
	return new OpenAI({ apiKey });
}

// --- Constants: Model Strategy ---
const MODELS = {
	fast: "llama3-8b-8192",
	smart: "llama3-70b-8192",
	embedding: "text-embedding-3-small",
};

// --- Actions with Graceful Error Handling ---

export const generateSummary = action({
	args: { text: v.string() },
	handler: async (_ctx, args): Promise<ActionResult<string>> => {
		// Check if Groq is configured
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const completion = await groq.chat.completions.create({
				messages: [
					{
						role: "system",
						content:
							"You are a helpful assistant. Summarize the user text concisely.",
					},
					{ role: "user", content: args.text },
				],
				model: MODELS.fast,
			});
			const summary =
				completion.choices[0]?.message?.content || "No summary generated.";
			return actionSuccess(summary);
		} catch (error) {
			logger.error("Error generating summary (Groq)", { error: String(error) });
			return actionError("Failed to generate summary. Please try again later.");
		}
	},
});

export const generateDiffSummary = action({
	args: { oldContent: v.string(), newContent: v.string() },
	handler: async (_ctx, args): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const completion = await groq.chat.completions.create({
				messages: [
					{
						role: "system",
						content:
							"You are an expert editor. Analyze the changes between two text versions.",
					},
					{
						role: "user",
						content: `Compare the following versions and provide a concise natural language explanation of key changes for a governance vote:\n\nOld:\n${args.oldContent}\n\nNew:\n${args.newContent}`,
					},
				],
				model: MODELS.smart,
			});
			const summary =
				completion.choices[0]?.message?.content || "No diff summary.";
			return actionSuccess(summary);
		} catch (error) {
			logger.error("Error generating diff summary (Groq)", {
				error: String(error),
			});
			return actionError(
				"Failed to generate diff summary. Please try again later.",
			);
		}
	},
});

export const generateDealEmbedding = action({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args): Promise<ActionResult<{ embedded: boolean }>> => {
		const integrationError = checkIntegration("openai");
		if (integrationError) return integrationError;

		const openai = getOpenAIClient();
		if (!openai) {
			return actionError(
				"OpenAI API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const deal = await ctx.runQuery(internal.deals.getDeal, {
				dealId: args.dealId,
			});
			if (!deal) {
				return actionError("Deal not found", "NOT_FOUND");
			}

			const textToEmbed = `Title: ${deal.title}\nStage: ${deal.stage}\nAmount: ${deal.amount}`;

			const response = await openai.embeddings.create({
				model: MODELS.embedding,
				input: textToEmbed,
				encoding_format: "float",
			});

			const vector = response.data[0].embedding;

			await ctx.runMutation(internal.matchmaker.saveDealEmbedding, {
				dealId: args.dealId,
				vector,
			});

			return actionSuccess({ embedded: true });
		} catch (error) {
			logger.error("Error generating deal embedding", { error: String(error) });
			return actionError("Failed to generate embedding. Please try again.");
		}
	},
});

export const explainMatch = action({
	args: { dealId: v.id("deals"), contactId: v.id("contacts") },
	handler: async (ctx, args): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const deal = await ctx.runQuery(internal.deals.getDeal, {
				dealId: args.dealId,
			});
			const contact = await ctx.runQuery(internal.crm.getContact, {
				contactId: args.contactId,
			});

			if (!deal || !contact) {
				return actionError("Deal or contact not found", "NOT_FOUND");
			}

			const prompt = `
        Contexte: M&A Deal Matchmaking.
        Deal Cible: ${deal.title} (Montant: ${deal.amount}, Étape: ${deal.stage})
        Acquéreur Potentiel: ${contact.fullName} (Société: ${contact.companyName}, Rôle: ${contact.role}, Tags: ${contact.tags?.join(", ")})

        Tâche: Explique en UNE phrase concise (français) pourquoi cet acquéreur est pertinent pour ce deal.
        `;

			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
			});

			const explanation =
				completion.choices[0]?.message?.content || "Analyse impossible.";
			return actionSuccess(explanation);
		} catch (error) {
			logger.error("Error explaining match", { error: String(error) });
			return actionError("Failed to explain match. Please try again.");
		}
	},
});

// ============================================
// PHASE 2.4: AI FEATURES
// ============================================

/**
 * Deal Risk Scoring - Analyze DD findings and calculate risk score
 * Returns a score 0-100 and detailed risk analysis
 */
export const scoreDealRisk = action({
	args: { dealId: v.id("deals") },
	handler: async (
		ctx,
		args,
	): Promise<
		ActionResult<{
			score: number;
			level: "low" | "medium" | "high" | "critical";
			summary: string;
			factors: Array<{
				category: string;
				severity: "blocker" | "major" | "minor" | "none";
				description: string;
			}>;
		}>
	> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			// Get deal info
			const deal = await ctx.runQuery(internal.deals.getDeal, {
				dealId: args.dealId,
			});
			if (!deal) {
				return actionError("Deal not found", "NOT_FOUND");
			}

			// Get DD checklist items if they exist
			const ddItems = await ctx.runQuery(
				internal.ddChecklists.getItemsForDeal,
				{
					dealId: args.dealId,
				},
			);

			// Calculate raw metrics
			const issuesFound =
				ddItems?.filter(
					(item: { status: string }) => item.status === "issue_found",
				) || [];
			const blockers = issuesFound.filter(
				(item: { issueSeverity?: string }) => item.issueSeverity === "blocker",
			);
			const majors = issuesFound.filter(
				(item: { issueSeverity?: string }) => item.issueSeverity === "major",
			);
			const minors = issuesFound.filter(
				(item: { issueSeverity?: string }) => item.issueSeverity === "minor",
			);
			const totalItems = ddItems?.length || 0;
			const completedItems =
				ddItems?.filter(
					(item: { status: string }) =>
						item.status === "reviewed" || item.status === "not_applicable",
				)?.length || 0;

			// Build context for AI analysis
			const ddSummary = issuesFound
				.map(
					(item: {
						section: string;
						item: string;
						issueDescription?: string;
						issueSeverity?: string;
					}) =>
						`- [${item.issueSeverity?.toUpperCase() || "UNKNOWN"}] ${item.section}: ${item.item} - ${item.issueDescription || "No description"}`,
				)
				.join("\n");

			const prompt = `Tu es un analyste M&A expert évaluant le risque d'un deal.

DEAL: ${deal.title}
Stage: ${deal.stage}
Montant: ${deal.amount ? `${(deal.amount / 1_000_000).toFixed(1)}M€` : "Non spécifié"}

STATISTIQUES DD:
- Items complétés: ${completedItems}/${totalItems}
- Problèmes identifiés: ${issuesFound.length}
  - Bloquants: ${blockers.length}
  - Majeurs: ${majors.length}
  - Mineurs: ${minors.length}

ISSUES DÉTAILLÉES:
${ddSummary || "Aucun problème identifié"}

TÂCHE: Analyse les risques et génère un rapport structuré en JSON avec:
1. "score": Score de risque de 0 (aucun risque) à 100 (très risqué)
2. "level": "low" (<25), "medium" (25-50), "high" (50-75), ou "critical" (>75)
3. "summary": Résumé exécutif en 2-3 phrases (français)
4. "factors": Liste des facteurs de risque principaux avec "category", "severity" (blocker/major/minor/none), et "description"

Réponds UNIQUEMENT avec le JSON valide, sans markdown ni texte autour.`;

			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.3,
			});

			const content = completion.choices[0]?.message?.content || "{}";

			// Parse AI response
			try {
				const analysis = JSON.parse(content);
				return actionSuccess({
					score: analysis.score || 0,
					level: analysis.level || "low",
					summary: analysis.summary || "Analyse non disponible",
					factors: analysis.factors || [],
				});
			} catch {
				// If parsing fails, generate a simple score based on metrics
				const calculatedScore = Math.min(
					100,
					blockers.length * 30 + majors.length * 15 + minors.length * 5,
				);
				return actionSuccess({
					score: calculatedScore,
					level:
						calculatedScore > 75
							? "critical"
							: calculatedScore > 50
								? "high"
								: calculatedScore > 25
									? "medium"
									: "low",
					summary: `Deal avec ${blockers.length} problème(s) bloquant(s), ${majors.length} majeur(s), et ${minors.length} mineur(s).`,
					factors: issuesFound.slice(0, 5).map(
						(item: {
							section: string;
							issueDescription?: string;
							issueSeverity?: string;
						}) => ({
							category: item.section,
							severity: (item.issueSeverity === "blocker" ||
							item.issueSeverity === "major" ||
							item.issueSeverity === "minor" ||
							item.issueSeverity === "none"
								? item.issueSeverity
								: "minor") as "none" | "blocker" | "major" | "minor",
							description: item.issueDescription || "Issue identifiée",
						}),
					),
				});
			}
		} catch (error) {
			logger.error("Error scoring deal risk", { error: String(error) });
			return actionError("Failed to score deal risk. Please try again.");
		}
	},
});

/**
 * Document Summarization - Summarize long documents
 * Supports different summary lengths and styles
 */
export const summarizeDocument = action({
	args: {
		content: v.string(),
		style: v.optional(
			v.union(v.literal("brief"), v.literal("detailed"), v.literal("bullets")),
		),
		maxLength: v.optional(v.number()),
		language: v.optional(v.union(v.literal("fr"), v.literal("en"))),
	},
	handler: async (_ctx, args): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const style = args.style || "brief";
		const language = args.language || "fr";
		const maxLength = args.maxLength || 300;

		const styleInstructions = {
			brief: `Résumé concis en ${maxLength} mots maximum`,
			detailed: `Résumé détaillé couvrant tous les points clés en ${maxLength * 2} mots maximum`,
			bullets: `Liste à puces des points clés (max 10 points)`,
		};

		const prompt = `Tu es un assistant expert en M&A.

DOCUMENT À RÉSUMER:
${args.content.slice(0, 15000)} ${args.content.length > 15000 ? "... [tronqué]" : ""}

INSTRUCTIONS:
- Langue: ${language === "fr" ? "Français" : "English"}
- Style: ${styleInstructions[style]}
- Focus sur les informations pertinentes pour une transaction M&A
- Identifie les points critiques, chiffres clés, et risques éventuels

RÉSUMÉ:`;

		try {
			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.3,
				max_tokens: maxLength * 2,
			});

			const summary =
				completion.choices[0]?.message?.content || "Résumé non disponible.";
			return actionSuccess(summary);
		} catch (error) {
			logger.error("Error summarizing document", { error: String(error) });
			return actionError("Failed to summarize document. Please try again.");
		}
	},
});

/**
 * Generate Teaser - Create a teaser document from company data
 */
export const generateTeaser = action({
	args: {
		companyName: v.string(),
		sector: v.optional(v.string()),
		description: v.optional(v.string()),
		revenue: v.optional(v.number()),
		ebitda: v.optional(v.number()),
		employees: v.optional(v.number()),
		location: v.optional(v.string()),
		highlights: v.optional(v.array(v.string())),
		dealType: v.optional(
			v.union(
				v.literal("cession"),
				v.literal("acquisition"),
				v.literal("levee"),
			),
		),
	},
	handler: async (
		_ctx,
		args,
	): Promise<
		ActionResult<{ teaser: string; sections: Record<string, string> }>
	> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const dealType = args.dealType || "cession";
		const dealTypeLabel =
			dealType === "cession"
				? "cession"
				: dealType === "acquisition"
					? "acquisition"
					: "levée de fonds";

		const prompt = `Tu es un banquier d'affaires senior rédigeant un teaser pour une ${dealTypeLabel}.

INFORMATIONS SUR L'ENTREPRISE:
- Nom: ${args.companyName}
- Secteur: ${args.sector || "Non spécifié"}
- Description: ${args.description || "Non fournie"}
- Chiffre d'affaires: ${args.revenue ? `${(args.revenue / 1_000_000).toFixed(1)}M€` : "Confidentiel"}
- EBITDA: ${args.ebitda ? `${(args.ebitda / 1_000_000).toFixed(2)}M€` : "Confidentiel"}
- Effectifs: ${args.employees || "Non spécifié"} personnes
- Localisation: ${args.location || "France"}
${args.highlights?.length ? `- Points forts: ${args.highlights.join(", ")}` : ""}

GÉNÈRE UN TEASER PROFESSIONNEL avec les sections suivantes en JSON:
{
  "investmentHighlights": "3-5 puces sur les atouts clés de l'investissement",
  "companyOverview": "Description de l'entreprise et son positionnement (2-3 paragraphes)",
  "financialSummary": "Synthèse financière avec les métriques clés",
  "transactionOverview": "Description de l'opportunité de transaction",
  "nextSteps": "Prochaines étapes pour les investisseurs intéressés"
}

IMPORTANT:
- Style professionnel et factuel
- Langue française
- Évite les superlatifs excessifs
- Mets en avant les chiffres clés
- Réponds UNIQUEMENT avec le JSON valide`;

		try {
			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.7,
				max_tokens: 2000,
			});

			const content = completion.choices[0]?.message?.content || "{}";

			try {
				const sections = JSON.parse(content);
				const teaser = `
# ${args.companyName} - Teaser Confidentiel

## Points Clés de l'Investissement
${sections.investmentHighlights || "N/A"}

## Présentation de l'Entreprise
${sections.companyOverview || "N/A"}

## Synthèse Financière
${sections.financialSummary || "N/A"}

## Opportunité de Transaction
${sections.transactionOverview || "N/A"}

## Prochaines Étapes
${sections.nextSteps || "N/A"}

---
*Document confidentiel préparé par Alecia*
        `.trim();

				return actionSuccess({ teaser, sections });
			} catch {
				return actionError("Failed to parse teaser content", "API_ERROR");
			}
		} catch (error) {
			logger.error("Error generating teaser", { error: String(error) });
			return actionError("Failed to generate teaser. Please try again.");
		}
	},
});

/**
 * Suggest Valuation Range - AI-powered valuation suggestions
 */
export const suggestValuation = action({
	args: {
		companyName: v.string(),
		sector: v.optional(v.string()),
		revenue: v.optional(v.number()),
		ebitda: v.optional(v.number()),
		growth: v.optional(v.number()), // YoY growth percentage
		employees: v.optional(v.number()),
		context: v.optional(v.string()), // Additional context
	},
	handler: async (
		_ctx,
		args,
	): Promise<
		ActionResult<{
			lowRange: number;
			midRange: number;
			highRange: number;
			methodology: string;
			multiples: {
				revenue: { low: number; mid: number; high: number };
				ebitda: { low: number; mid: number; high: number };
			};
			considerations: string[];
		}>
	> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		if (!args.revenue && !args.ebitda) {
			return actionError(
				"Revenue or EBITDA is required for valuation",
				"MISSING_CONFIG",
			);
		}

		const prompt = `Tu es un analyste M&A senior spécialisé en valorisation.

ENTREPRISE À VALORISER:
- Nom: ${args.companyName}
- Secteur: ${args.sector || "Non spécifié"}
- Chiffre d'affaires: ${args.revenue ? `${(args.revenue / 1_000_000).toFixed(1)}M€` : "Non fourni"}
- EBITDA: ${args.ebitda ? `${(args.ebitda / 1_000_000).toFixed(2)}M€` : "Non fourni"}
- Croissance YoY: ${args.growth ? `${args.growth}%` : "Non spécifié"}
- Effectifs: ${args.employees || "Non spécifié"}
${args.context ? `- Contexte: ${args.context}` : ""}

GÉNÈRE UNE ESTIMATION DE VALORISATION en JSON avec:
{
  "lowRange": valorisation basse en euros,
  "midRange": valorisation médiane en euros,
  "highRange": valorisation haute en euros,
  "methodology": "Explication de la méthodologie utilisée (2-3 phrases)",
  "multiples": {
    "revenue": { "low": multiple bas CA, "mid": multiple médian CA, "high": multiple haut CA },
    "ebitda": { "low": multiple bas EBITDA, "mid": multiple médian EBITDA, "high": multiple haut EBITDA }
  },
  "considerations": ["3-5 facteurs importants à considérer"]
}

IMPORTANT:
- Base tes multiples sur les transactions récentes du secteur
- Prends en compte la taille de l'entreprise (PME/ETI discount)
- Ajuste pour la croissance et la rentabilité
- Réponds UNIQUEMENT avec le JSON valide`;

		try {
			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.4,
				max_tokens: 1000,
			});

			const content = completion.choices[0]?.message?.content || "{}";

			try {
				const valuation = JSON.parse(content);
				return actionSuccess({
					lowRange: valuation.lowRange || 0,
					midRange: valuation.midRange || 0,
					highRange: valuation.highRange || 0,
					methodology: valuation.methodology || "Méthodologie non disponible",
					multiples: valuation.multiples || {
						revenue: { low: 0, mid: 0, high: 0 },
						ebitda: { low: 0, mid: 0, high: 0 },
					},
					considerations: valuation.considerations || [],
				});
			} catch {
				// Fallback with simple calculation
				const revenue = args.revenue || 0;
				const ebitda = args.ebitda || 0;

				const revenueMultiple = 1.5;
				const ebitdaMultiple = 6;

				const valuationFromRevenue = revenue * revenueMultiple;
				const valuationFromEbitda = ebitda * ebitdaMultiple;
				const midRange = ebitda ? valuationFromEbitda : valuationFromRevenue;

				return actionSuccess({
					lowRange: midRange * 0.7,
					midRange,
					highRange: midRange * 1.3,
					methodology:
						"Valorisation basée sur des multiples standards du marché.",
					multiples: {
						revenue: { low: 1.0, mid: 1.5, high: 2.0 },
						ebitda: { low: 4.5, mid: 6.0, high: 7.5 },
					},
					considerations: [
						"Cette estimation est indicative",
						"Une analyse détaillée est recommandée",
						"Les multiples varient selon le secteur",
					],
				});
			}
		} catch (error) {
			logger.error("Error suggesting valuation", { error: String(error) });
			return actionError("Failed to suggest valuation. Please try again.");
		}
	},
});

/**
 * Extract Key Terms - Extract key terms from contracts and legal documents
 */
export const extractKeyTerms = action({
	args: {
		content: v.string(),
		documentType: v.optional(
			v.union(
				v.literal("loi"),
				v.literal("nda"),
				v.literal("spa"),
				v.literal("contract"),
				v.literal("other"),
			),
		),
	},
	handler: async (
		_ctx,
		args,
	): Promise<
		ActionResult<{
			terms: Array<{
				term: string;
				value: string;
				category: string;
				importance: "high" | "medium" | "low";
			}>;
			summary: string;
			risks: string[];
		}>
	> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const docType = args.documentType || "other";
		const docTypeLabels: Record<string, string> = {
			loi: "Letter of Intent (LOI)",
			nda: "Non-Disclosure Agreement (NDA)",
			spa: "Share Purchase Agreement (SPA)",
			contract: "Contrat commercial",
			other: "Document juridique",
		};

		const prompt = `Tu es un avocat M&A expert analysant un document.

TYPE DE DOCUMENT: ${docTypeLabels[docType]}

CONTENU:
${args.content.slice(0, 12000)} ${args.content.length > 12000 ? "... [tronqué]" : ""}

EXTRAIT LES TERMES CLÉS en JSON avec:
{
  "terms": [
    {
      "term": "Nom du terme (ex: Prix d'acquisition, Date de closing, etc.)",
      "value": "Valeur extraite du document",
      "category": "financial" | "timeline" | "legal" | "condition" | "other",
      "importance": "high" | "medium" | "low"
    }
  ],
  "summary": "Résumé exécutif du document en 2-3 phrases",
  "risks": ["Liste des points d'attention ou risques identifiés"]
}

IMPORTANT:
- Extrait TOUS les termes quantifiables (prix, dates, pourcentages)
- Identifie les conditions suspensives
- Note les clauses inhabituelles
- Réponds UNIQUEMENT avec le JSON valide`;

		try {
			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.2,
				max_tokens: 2000,
			});

			const content = completion.choices[0]?.message?.content || "{}";

			try {
				const extracted = JSON.parse(content);
				return actionSuccess({
					terms: extracted.terms || [],
					summary: extracted.summary || "Résumé non disponible",
					risks: extracted.risks || [],
				});
			} catch {
				return actionError("Failed to parse extracted terms", "API_ERROR");
			}
		} catch (error) {
			logger.error("Error extracting key terms", { error: String(error) });
			return actionError("Failed to extract key terms. Please try again.");
		}
	},
});

/**
 * Translate Document - Translate documents between French and English
 */
export const translateDocument = action({
	args: {
		content: v.string(),
		targetLanguage: v.union(v.literal("fr"), v.literal("en")),
		style: v.optional(
			v.union(v.literal("formal"), v.literal("casual"), v.literal("legal")),
		),
	},
	handler: async (_ctx, args): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("groq");
		if (integrationError) return integrationError;

		const groq = getGroqClient();
		if (!groq) {
			return actionError(
				"Groq API key is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const style = args.style || "formal";
		const targetLang = args.targetLanguage === "fr" ? "français" : "anglais";
		const styleInstructions = {
			formal: "style professionnel et formel",
			casual: "style courant et accessible",
			legal: "style juridique précis, en conservant la terminologie légale",
		};

		const prompt = `Tu es un traducteur professionnel spécialisé en M&A.

TRADUIS le texte suivant en ${targetLang} avec un ${styleInstructions[style]}.

TEXTE ORIGINAL:
${args.content.slice(0, 15000)}

INSTRUCTIONS:
- Conserve le formatage original (markdown, listes, etc.)
- Maintiens la précision des termes techniques
- Adapte les expressions idiomatiques
- Ne traduis PAS les noms propres, acronymes standards, et termes légaux reconnus

TRADUCTION:`;

		try {
			const completion = await groq.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: MODELS.smart,
				temperature: 0.3,
				max_tokens: 4000,
			});

			const translation =
				completion.choices[0]?.message?.content || "Traduction non disponible.";
			return actionSuccess(translation);
		} catch (error) {
			logger.error("Error translating document", { error: String(error) });
			return actionError("Failed to translate document. Please try again.");
		}
	},
});
