// packages/ai/src/index.ts
// Alecia Suite — AI Services Package
// Ported from convex/actions/ai.ts (~26k chars)
// Provides: deal summarization, risk scoring, teaser generation,
// valuation suggestions, document summarization, translation, buyer matching

import { db, shared } from "@alepanel/db";

// Groq LLaMA 3.3 70B — fast inference for M&A analysis
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// OpenAI — embeddings + complex reasoning
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  options: AIOptions = {}
): Promise<string> {
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

// TODO: Port each function from convex/actions/ai.ts
// Each function becomes a standalone async function that:
// - Takes parameters directly (no Convex context)
// - Reads/writes PostgreSQL via @alepanel/db
// - Calls Groq/OpenAI APIs directly

export async function generateDealSummary(dealId: string): Promise<string> {
  // TODO: Implement — port from convex/actions/ai.ts:generateDealSummary
  throw new Error("Not yet implemented — port from Convex");
}

export async function scoreDealRisk(
  dealId: string
): Promise<{ score: number; factors: string[] }> {
  // TODO: Implement — port from convex/actions/ai.ts:scoreDealRisk
  throw new Error("Not yet implemented — port from Convex");
}

export async function generateTeaser(dealId: string): Promise<string> {
  // TODO: Implement — port from convex/actions/ai.ts:generateTeaser
  throw new Error("Not yet implemented — port from Convex");
}

export async function suggestValuation(
  dealId: string
): Promise<{ method: string; range: [number, number]; rationale: string }> {
  // TODO: Implement — port from convex/actions/ai.ts:suggestValuation
  throw new Error("Not yet implemented — port from Convex");
}

export async function summarizeDocument(content: string): Promise<string> {
  // TODO: Implement — port from convex/actions/ai.ts:summarizeDocument
  throw new Error("Not yet implemented — port from Convex");
}

export async function extractKeyTerms(
  content: string
): Promise<{ terms: string[]; clauses: string[] }> {
  // TODO: Implement — port from convex/actions/ai.ts:extractKeyTerms
  throw new Error("Not yet implemented — port from Convex");
}

export async function translateDocument(
  content: string,
  direction: "fr-en" | "en-fr"
): Promise<string> {
  // TODO: Implement — port from convex/actions/ai.ts:translateDocument
  throw new Error("Not yet implemented — port from Convex");
}

export async function matchDealBuyer(
  dealId: string
): Promise<{ companyId: string; score: number; reason: string }[]> {
  // TODO: Implement — port from convex/actions/ai.ts:matchDealBuyer
  throw new Error("Not yet implemented — port from Convex");
}
