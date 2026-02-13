/**
 * AI, Intelligence & Finance Server Actions
 *
 * Merged from convex/actions/ai.ts + intelligence.ts + finance.ts
 * Groq (LLaMA) for text, OpenAI for embeddings, Pappers for company data
 */

"use server";

import { db, shared, bi, eq } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// LAZY CLIENT INITIALIZATION
// ============================================

async function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const { default: Groq } = await import("groq-sdk");
  return new Groq({ apiKey });
}

async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey });
}

const MODELS = {
  fast: "llama3-8b-8192",
  smart: "llama3-70b-8192",
  embedding: "text-embedding-3-small",
};

// ============================================
// TEXT AI (GROQ)
// ============================================

/**
 * Generate a concise summary of text
 */
export async function generateSummary(text: string): Promise<string> {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant. Summarize the user text concisely." },
      { role: "user", content: text },
    ],
    model: MODELS.fast,
  });

  return completion.choices[0]?.message?.content || "No summary generated.";
}

/**
 * Generate a diff summary between two document versions
 */
export async function generateDiffSummary(oldContent: string, newContent: string): Promise<string> {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert editor. Analyze the changes between two text versions.",
      },
      {
        role: "user",
        content: `Compare the following versions and provide a concise natural language explanation of key changes for a governance vote:\n\nOld:\n${oldContent}\n\nNew:\n${newContent}`,
      },
    ],
    model: MODELS.smart,
  });

  return completion.choices[0]?.message?.content || "No diff summary.";
}

/**
 * Generate embedding for a deal and store in bi.embeddings
 */
export async function generateDealEmbedding(dealId: string) {
  const openai = await getOpenAIClient();
  if (!openai) throw new Error("OpenAI API key not configured");

  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, dealId),
  });
  if (!deal) throw new Error("Deal not found");

  const textToEmbed = `Title: ${deal.title}\nStage: ${deal.stage}\nAmount: ${deal.amount}`;

  const response = await openai.embeddings.create({
    model: MODELS.embedding,
    input: textToEmbed,
    encoding_format: "float",
  });

  const vector = response.data[0].embedding;

  await db.insert(bi.embeddings).values({
    dealId,
    documentName: "deal",
    chunkText: textToEmbed,
    metadata: { type: "deal" },
    createdAt: new Date(),
    // TODO: Store vector when pgvector column exists
  });

  return { embedded: true };
}

/**
 * Explain why a buyer matches a deal
 */
export async function explainMatch(dealId: string, contactId: string): Promise<string> {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const [deal, contact] = await Promise.all([
    db.query.deals.findFirst({ where: eq(shared.deals.id, dealId) }),
    db.query.contacts.findFirst({ where: eq(shared.contacts.id, contactId) }),
  ]);

  if (!deal || !contact) throw new Error("Deal or contact not found");

  const prompt = `
    Contexte: M&A Deal Matchmaking.
    Deal Cible: ${deal.title} (Montant: ${deal.amount}, Étape: ${deal.stage})
    Acquéreur Potentiel: ${contact.fullName} (Rôle: ${contact.role})

    Tâche: Explique en UNE phrase concise (français) pourquoi cet acquéreur est pertinent pour ce deal.
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content || "Pas d'explication disponible.";
}

/**
 * AI-powered deal risk scoring from DD data
 */
export async function scoreDealRisk(dealId: string) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, dealId),
  });
  if (!deal) throw new Error("Deal not found");

  // TODO: Query DD checklist items for this deal when schema supports it
  const prompt = `Tu es un analyste M&A expert. Évalue le risque du deal "${deal.title}" (montant: ${deal.amount}, étape: ${deal.stage}).
Réponds en JSON: {"score": 0-100, "level": "low|medium|high|critical", "summary": "...", "factors": [{"category": "...", "severity": "blocker|major|minor|none", "description": "..."}]}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.3,
  });

  try {
    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      score: analysis.score || 0,
      level: analysis.level || "low",
      summary: analysis.summary || "",
      factors: analysis.factors || [],
    };
  } catch {
    return { score: 0, level: "low", summary: "Unable to analyze", factors: [] };
  }
}

/**
 * Summarize a document with custom style and language
 */
export async function summarizeDocument(
  content: string,
  style: "brief" | "detailed" | "bullets",
  language: "fr" | "en"
) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const stylePrompts = {
    brief: "Fais un résumé très concis en 2-3 phrases.",
    detailed: "Fais un résumé détaillé et structuré.",
    bullets: "Fais une liste à puces des points clés.",
  };

  const langPrompts = {
    fr: "Réponds en français.",
    en: "Respond in English.",
  };

  const prompt = `${stylePrompts[style]} ${langPrompts[language]}\n\nDocument:\n${content}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.fast,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content || "No summary generated.";
}

/**
 * Generate a teaser document for M&A deal marketing
 */
export async function generateTeaser(args: {
  companyName: string;
  sector?: string;
  description?: string;
  revenue?: number;
  ebitda?: number;
  employees?: number;
  location?: string;
  dealType: "cession" | "acquisition" | "levee";
}) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const dealTypeLabels = {
    cession: "cession d'entreprise",
    acquisition: "opportunité d'acquisition",
    levee: "levée de fonds",
  };

  const prompt = `Tu es un expert M&A. Génère un teaser professionnel (1 page) pour une ${dealTypeLabels[args.dealType]}.

Entreprise: ${args.companyName}
${args.sector ? `Secteur: ${args.sector}` : ""}
${args.description ? `Description: ${args.description}` : ""}
${args.revenue ? `CA: ${(args.revenue / 1_000_000).toFixed(1)}M€` : ""}
${args.ebitda ? `EBITDA: ${(args.ebitda / 1_000_000).toFixed(1)}M€` : ""}
${args.employees ? `Effectifs: ${args.employees}` : ""}
${args.location ? `Localisation: ${args.location}` : ""}

Format attendu:
# Teaser - [Nom entreprise]

## Vue d'ensemble
[Présentation attractive de l'entreprise]

## Activité et positionnement
[Description de l'activité et des forces]

## Chiffres clés
[Métriques financières et opérationnelles]

## Opportunité
[Pourquoi cette ${dealTypeLabels[args.dealType]} est attractive]

Ton: professionnel, concis, attractif pour investisseurs/acquéreurs.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.7,
  });

  return { teaser: completion.choices[0]?.message?.content || "No teaser generated." };
}

/**
 * Suggest valuation range for a company based on sector and financials
 */
export async function suggestValuation(args: {
  companyName: string;
  sector?: string;
  revenue?: number;
  ebitda?: number;
  growth?: number;
}) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  // First, use our calculateMultiples for initial estimate
  let baseValuation: any = null;
  if (args.revenue && args.ebitda) {
    baseValuation = await calculateMultiples({
      revenue: args.revenue,
      ebitda: args.ebitda,
      sector: args.sector?.toLowerCase(),
    });
  }

  const prompt = `Tu es un expert en valorisation M&A. Estime une fourchette de valorisation pour:

Entreprise: ${args.companyName}
${args.sector ? `Secteur: ${args.sector}` : ""}
${args.revenue ? `CA: ${(args.revenue / 1_000_000).toFixed(1)}M€` : ""}
${args.ebitda ? `EBITDA: ${(args.ebitda / 1_000_000).toFixed(1)}M€` : ""}
${args.growth ? `Croissance: ${args.growth}%` : ""}

${baseValuation ? `\nCalcul automatique (multiples sectoriels):\n${JSON.stringify(baseValuation.summary, null, 2)}` : ""}

Réponds en JSON:
{
  "lowRange": <valeur basse en euros>,
  "midRange": <valeur médiane en euros>,
  "highRange": <valeur haute en euros>,
  "methodology": "Méthodologie utilisée (EV/EBITDA, EV/Revenue, etc.)",
  "considerations": ["Point 1", "Point 2", ...]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.3,
  });

  try {
    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      lowRange: analysis.lowRange || (baseValuation?.valuations.weighted.min || 0),
      midRange: analysis.midRange || (baseValuation?.valuations.weighted.mid || 0),
      highRange: analysis.highRange || (baseValuation?.valuations.weighted.max || 0),
      methodology: analysis.methodology || "Multiples sectoriels moyens",
      considerations: analysis.considerations || [],
    };
  } catch {
    // Fallback to calculated multiples
    if (baseValuation) {
      return {
        lowRange: baseValuation.valuations.weighted.min,
        midRange: baseValuation.valuations.weighted.mid,
        highRange: baseValuation.valuations.weighted.max,
        methodology: `Multiples ${baseValuation.multiples.sector} (EV/EBITDA ${baseValuation.multiples.evEbitda[0]}-${baseValuation.multiples.evEbitda[1]}x)`,
        considerations: ["Basé sur les multiples sectoriels moyens", "Ajuster selon les spécificités de l'entreprise"],
      };
    }
    return {
      lowRange: 0,
      midRange: 0,
      highRange: 0,
      methodology: "Données insuffisantes",
      considerations: ["Veuillez fournir au moins le CA ou l'EBITDA"],
    };
  }
}

/**
 * Extract key terms from legal/contractual documents
 */
export async function extractKeyTerms(
  content: string,
  documentType: "loi" | "nda" | "spa" | "contract" | "other"
) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const docTypeLabels = {
    loi: "Letter of Intent",
    nda: "Non-Disclosure Agreement",
    spa: "Share Purchase Agreement",
    contract: "Contrat commercial",
    other: "Document juridique",
  };

  const prompt = `Tu es un expert juridique M&A. Analyse ce ${docTypeLabels[documentType]} et extrais les termes clés.

Document:
${content}

Réponds en JSON:
{
  "terms": [
    {
      "term": "Nom du terme",
      "value": "Valeur ou description",
      "category": "Prix|Date|Condition|Garantie|Autre",
      "importance": "high|medium|low"
    }
  ],
  "summary": "Résumé du document en 2-3 phrases",
  "risks": ["Point d'attention 1", "Point d'attention 2", ...]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.3,
  });

  try {
    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      terms: analysis.terms || [],
      summary: analysis.summary || "",
      risks: analysis.risks || [],
    };
  } catch {
    return {
      terms: [],
      summary: "Unable to analyze document",
      risks: [],
    };
  }
}

/**
 * Translate document with M&A-specific terminology
 */
export async function translateDocument(
  content: string,
  targetLanguage: "fr" | "en",
  style: "formal" | "casual" | "legal"
) {
  const groq = await getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const stylePrompts = {
    formal: "Utilise un ton formel et professionnel.",
    casual: "Utilise un ton naturel et fluide.",
    legal: "Utilise la terminologie juridique précise et le ton contractuel.",
  };

  const langPrompts = {
    fr: "Traduis en français.",
    en: "Translate to English.",
  };

  const prompt = `${langPrompts[targetLanguage]} ${stylePrompts[style]} Contexte: M&A / Finance d'entreprise.

Texte à traduire:
${content}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODELS.smart,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "No translation generated.";
}

// ============================================
// PAPPERS (INTELLIGENCE)
// ============================================

/**
 * Search companies via Pappers API
 */
export async function searchCompanyPappers(query: string) {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) throw new Error("Pappers API key not configured");

  const response = await fetch(
    `https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(query)}&api_token=${apiKey}`
  );

  if (!response.ok) throw new Error(`Pappers API error: ${response.statusText}`);

  const data = await response.json();

  return data.resultats.map((company: any) => ({
    name: company.nom_entreprise || "",
    siren: company.siren,
    nafCode: company.code_naf,
    nafLabel: company.libelle_code_naf,
    vatNumber: company.numero_tva_intracommunautaire,
    address: {
      street: `${company.siege?.adresse_ligne_1 || ""} ${company.siege?.adresse_ligne_2 || ""}`.trim(),
      city: company.siege?.ville || "",
      zip: company.siege?.code_postal || "",
      country: company.siege?.pays || "France",
    },
    financials: {
      revenue: company.chiffre_affaires,
      ebitda: company.resultat,
      year: company.annee_comptes,
    },
  }));
}

/**
 * Get detailed company by SIREN
 */
export async function getCompanyBySirenPappers(siren: string) {
  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) throw new Error("Pappers API key not configured");

  if (!/^\d{9}$/.test(siren)) {
    throw new Error("Invalid SIREN format. Expected 9 digits.");
  }

  const response = await fetch(
    `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${apiKey}`
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Pappers API error: ${response.statusText}`);
  }

  const company = await response.json();

  return {
    name: company.nom_entreprise || "",
    siren: company.siren,
    siret: company.siret_siege,
    nafCode: company.code_naf,
    nafLabel: company.libelle_code_naf,
    vatNumber: company.numero_tva_intracommunautaire,
    address: {
      street: `${company.siege?.adresse_ligne_1 || ""} ${company.siege?.adresse_ligne_2 || ""}`.trim(),
      city: company.siege?.ville || "",
      zip: company.siege?.code_postal || "",
      country: company.siege?.pays || "France",
    },
    financials: {
      revenue: company.chiffre_affaires,
      ebitda: company.resultat,
      history: company.finances?.map((f: any) => ({
        year: f.annee,
        revenue: f.chiffre_affaires,
        ebitda: f.resultat,
      })) || [],
    },
    effectif: company.effectif,
    formeJuridique: company.forme_juridique,
    dateCreation: company.date_creation,
    capital: company.capital,
    dirigeants: company.dirigeants?.map((d: any) => ({
      nom: d.nom,
      prenom: d.prenom,
      fonction: d.fonction,
    })) || [],
  };
}

// ============================================
// FINANCE CALCULATIONS
// ============================================

/**
 * Calculate any valuation formula with given inputs (mathjs)
 */
export async function calculateValuation(args: {
  inputs: Record<string, number | string>;
  formula: string;
}) {
  const { evaluate } = await import("mathjs");
  try {
    const result = evaluate(args.formula, args.inputs);
    return result;
  } catch (error) {
    throw new Error("Failed to calculate valuation: " + (error as Error).message);
  }
}

/**
 * Calculate standard M&A valuation multiples
 */
export async function calculateMultiples(args: {
  revenue: number;
  ebitda: number;
  netIncome?: number;
  equity?: number;
  sector?: string;
}) {
  const sectorMultiples: Record<string, { evRevenue: [number, number]; evEbitda: [number, number] }> = {
    tech: { evRevenue: [3, 8], evEbitda: [12, 20] },
    healthcare: { evRevenue: [2, 5], evEbitda: [10, 16] },
    manufacturing: { evRevenue: [0.8, 2], evEbitda: [6, 10] },
    retail: { evRevenue: [0.5, 1.5], evEbitda: [6, 10] },
    services: { evRevenue: [1, 3], evEbitda: [8, 14] },
    default: { evRevenue: [1, 3], evEbitda: [8, 12] },
  };

  const multiples = sectorMultiples[args.sector || "default"] || sectorMultiples.default;

  const evRevenueMin = args.revenue * multiples.evRevenue[0];
  const evRevenueMax = args.revenue * multiples.evRevenue[1];
  const evEbitdaMin = args.ebitda * multiples.evEbitda[0];
  const evEbitdaMax = args.ebitda * multiples.evEbitda[1];

  const weightedMin = evRevenueMin * 0.3 + evEbitdaMin * 0.7;
  const weightedMax = evRevenueMax * 0.3 + evEbitdaMax * 0.7;
  const weightedMid = (weightedMin + weightedMax) / 2;

  const ebitdaMargin = (args.ebitda / args.revenue) * 100;
  const netMargin = args.netIncome ? (args.netIncome / args.revenue) * 100 : null;

  return {
    multiples: { sector: args.sector || "default", evRevenue: multiples.evRevenue, evEbitda: multiples.evEbitda },
    valuations: {
      byRevenue: { min: evRevenueMin, mid: (evRevenueMin + evRevenueMax) / 2, max: evRevenueMax },
      byEbitda: { min: evEbitdaMin, mid: (evEbitdaMin + evEbitdaMax) / 2, max: evEbitdaMax },
      weighted: { min: weightedMin, mid: weightedMid, max: weightedMax },
    },
    metrics: {
      ebitdaMargin: Math.round(ebitdaMargin * 100) / 100,
      netMargin: netMargin ? Math.round(netMargin * 100) / 100 : null,
    },
    summary: {
      estimatedValueRange: `${(weightedMin / 1_000_000).toFixed(1)}M€ - ${(weightedMax / 1_000_000).toFixed(1)}M€`,
      midpoint: `${(weightedMid / 1_000_000).toFixed(1)}M€`,
    },
  };
}

/**
 * Generate a DCF valuation model
 */
export async function calculateDCF(args: {
  currentEbitda: number;
  growthRateYear1to3: number;
  growthRateYear4to5: number;
  terminalGrowthRate: number;
  discountRate: number;
  depreciationRate?: number;
  capexRate?: number;
  taxRate?: number;
}) {
  const wacc = args.discountRate / 100;
  const g1 = args.growthRateYear1to3 / 100;
  const g2 = args.growthRateYear4to5 / 100;
  const terminalG = args.terminalGrowthRate / 100;
  const tax = (args.taxRate || 25) / 100;
  const depRate = (args.depreciationRate || 5) / 100;
  const capexRate = (args.capexRate || 5) / 100;

  const projections: { year: number; ebitda: number; fcf: number; pv: number }[] = [];
  let ebitda = args.currentEbitda;

  for (let year = 1; year <= 5; year++) {
    const growthRate = year <= 3 ? g1 : g2;
    ebitda = ebitda * (1 + growthRate);

    const depreciation = ebitda * depRate;
    const capex = ebitda * capexRate;
    const ebit = ebitda - depreciation;
    const nopat = ebit * (1 - tax);
    const fcf = nopat + depreciation - capex;
    const pv = fcf / Math.pow(1 + wacc, year);

    projections.push({ year, ebitda: Math.round(ebitda), fcf: Math.round(fcf), pv: Math.round(pv) });
  }

  const terminalEbitda = ebitda * (1 + terminalG);
  const terminalFcf = terminalEbitda * (1 - tax) * 0.95;
  const terminalValue = terminalFcf / (wacc - terminalG);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, 5);

  const sumPvCashflows = projections.reduce((sum, p) => sum + p.pv, 0);
  const enterpriseValue = sumPvCashflows + pvTerminal;

  return {
    projections,
    terminalValue: { raw: Math.round(terminalValue), presentValue: Math.round(pvTerminal) },
    enterpriseValue: Math.round(enterpriseValue),
    summary: {
      ev: `${(enterpriseValue / 1_000_000).toFixed(1)}M€`,
      impliedMultiple: `${(enterpriseValue / args.currentEbitda).toFixed(1)}x EBITDA`,
    },
    assumptions: {
      wacc: `${args.discountRate}%`,
      growthPhase1: `${args.growthRateYear1to3}%`,
      growthPhase2: `${args.growthRateYear4to5}%`,
      terminalGrowth: `${args.terminalGrowthRate}%`,
    },
  };
}

/**
 * Parse financial data from CSV content
 */
export async function parseFinancialUpload(csvContent: string) {
  const { default: Papa } = await import("papaparse");

  const result = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const rows = result.data as Record<string, string | number | null>[];

  let revenue = 0, ebitda = 0, netIncome = 0;

  // Strategy 1: Column-based
  if (rows.length > 0) {
    const first = rows[0];
    if ("Revenue" in first) revenue = Number(first["Revenue"]) || 0;
    if ("Chiffre d'affaires" in first) revenue = Number(first["Chiffre d'affaires"]) || 0;
    if ("CA" in first) revenue = Number(first["CA"]) || 0;
    if ("EBITDA" in first) ebitda = Number(first["EBITDA"]) || 0;
    if ("EBE" in first) ebitda = Number(first["EBE"]) || 0;
    if ("Net Income" in first) netIncome = Number(first["Net Income"]) || 0;
    if ("Résultat Net" in first) netIncome = Number(first["Résultat Net"]) || 0;
  }

  // Strategy 2: Row-based (Metric, Value)
  if (revenue === 0 && ebitda === 0) {
    for (const row of rows) {
      const values = Object.values(row);
      const hasRevenue = values.some((v) => typeof v === "string" && (v.toLowerCase().includes("revenue") || v.toLowerCase().includes("chiffre")));
      const hasEbitda = values.some((v) => typeof v === "string" && (v.toLowerCase().includes("ebitda") || v.toLowerCase().includes("ebe")));
      const hasNet = values.some((v) => typeof v === "string" && (v.toLowerCase().includes("net") || v.toLowerCase().includes("résultat")));
      const numVal = values.find((v) => typeof v === "number") as number | undefined;

      if (hasRevenue && numVal && revenue === 0) revenue = numVal;
      if (hasEbitda && numVal && ebitda === 0) ebitda = numVal;
      if (hasNet && numVal && netIncome === 0) netIncome = numVal;
    }
  }

  return {
    revenue,
    ebitda,
    netIncome,
    ebitdaMargin: revenue > 0 ? Math.round((ebitda / revenue) * 10000) / 100 : 0,
    raw: rows.slice(0, 10),
    rowCount: rows.length,
  };
}
