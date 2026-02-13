"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { evaluate } from "mathjs";
import Papa from "papaparse";
import { logger } from "../lib/logger";

/**
 * Calculate any valuation formula with given inputs
 * Uses mathjs for safe expression evaluation
 */
export const calculateValuation = action({
	args: {
		inputs: v.record(v.string(), v.union(v.number(), v.string())),
		formula: v.string(),
	},
	handler: async (_ctx, args) => {
		try {
			const scope = args.inputs;
			const result = evaluate(args.formula, scope);
			return result;
		} catch (error) {
			logger.error("Valuation calculation error", {
				error: String(error),
				formula: args.formula,
			});
			throw new Error(
				"Failed to calculate valuation: " + (error as Error).message,
			);
		}
	},
});

/**
 * Calculate standard M&A valuation multiples
 */
export const calculateMultiples = action({
	args: {
		revenue: v.number(),
		ebitda: v.number(),
		netIncome: v.optional(v.number()),
		equity: v.optional(v.number()),
		sector: v.optional(v.string()),
	},
	handler: async (_ctx, args) => {
		// Industry average multiples (can be enhanced with real-time data)
		const sectorMultiples: Record<
			string,
			{ evRevenue: [number, number]; evEbitda: [number, number] }
		> = {
			tech: { evRevenue: [3, 8], evEbitda: [12, 20] },
			healthcare: { evRevenue: [2, 5], evEbitda: [10, 16] },
			manufacturing: { evRevenue: [0.8, 2], evEbitda: [6, 10] },
			retail: { evRevenue: [0.5, 1.5], evEbitda: [6, 10] },
			services: { evRevenue: [1, 3], evEbitda: [8, 14] },
			default: { evRevenue: [1, 3], evEbitda: [8, 12] },
		};

		const multiples =
			sectorMultiples[args.sector || "default"] || sectorMultiples.default;

		// EV calculations
		const evRevenueMin = args.revenue * multiples.evRevenue[0];
		const evRevenueMax = args.revenue * multiples.evRevenue[1];
		const evRevenueMid = (evRevenueMin + evRevenueMax) / 2;

		const evEbitdaMin = args.ebitda * multiples.evEbitda[0];
		const evEbitdaMax = args.ebitda * multiples.evEbitda[1];
		const evEbitdaMid = (evEbitdaMin + evEbitdaMax) / 2;

		// Weighted average (EBITDA-based more reliable)
		const weightedMin = evRevenueMin * 0.3 + evEbitdaMin * 0.7;
		const weightedMax = evRevenueMax * 0.3 + evEbitdaMax * 0.7;
		const weightedMid = (weightedMin + weightedMax) / 2;

		// Profitability metrics
		const ebitdaMargin = (args.ebitda / args.revenue) * 100;
		const netMargin = args.netIncome
			? (args.netIncome / args.revenue) * 100
			: null;
		const roe =
			args.netIncome && args.equity
				? (args.netIncome / args.equity) * 100
				: null;

		return {
			multiples: {
				sector: args.sector || "default",
				evRevenue: multiples.evRevenue,
				evEbitda: multiples.evEbitda,
			},
			valuations: {
				byRevenue: { min: evRevenueMin, mid: evRevenueMid, max: evRevenueMax },
				byEbitda: { min: evEbitdaMin, mid: evEbitdaMid, max: evEbitdaMax },
				weighted: { min: weightedMin, mid: weightedMid, max: weightedMax },
			},
			metrics: {
				ebitdaMargin: Math.round(ebitdaMargin * 100) / 100,
				netMargin: netMargin ? Math.round(netMargin * 100) / 100 : null,
				roe: roe ? Math.round(roe * 100) / 100 : null,
			},
			summary: {
				estimatedValueRange: `${(weightedMin / 1_000_000).toFixed(1)}M€ - ${(weightedMax / 1_000_000).toFixed(1)}M€`,
				midpoint: `${(weightedMid / 1_000_000).toFixed(1)}M€`,
			},
		};
	},
});

/**
 * Generate a DCF valuation model
 */
export const calculateDCF = action({
	args: {
		currentEbitda: v.number(),
		growthRateYear1to3: v.number(), // e.g., 10 for 10%
		growthRateYear4to5: v.number(),
		terminalGrowthRate: v.number(), // e.g., 2 for 2%
		discountRate: v.number(), // WACC, e.g., 10 for 10%
		depreciationRate: v.optional(v.number()),
		capexRate: v.optional(v.number()),
		taxRate: v.optional(v.number()),
	},
	handler: async (_ctx, args) => {
		const wacc = args.discountRate / 100;
		const g1 = args.growthRateYear1to3 / 100;
		const g2 = args.growthRateYear4to5 / 100;
		const terminalG = args.terminalGrowthRate / 100;
		const tax = (args.taxRate || 25) / 100;
		const depRate = (args.depreciationRate || 5) / 100;
		const capexRate = (args.capexRate || 5) / 100;

		// Project free cash flows
		const projections: {
			year: number;
			ebitda: number;
			fcf: number;
			pv: number;
		}[] = [];
		let ebitda = args.currentEbitda;

		for (let year = 1; year <= 5; year++) {
			const growthRate = year <= 3 ? g1 : g2;
			ebitda = ebitda * (1 + growthRate);

			// Simplified FCF: EBITDA * (1 - tax) + D&A - Capex - ΔWC (assumed 0)
			const depreciation = ebitda * depRate;
			const capex = ebitda * capexRate;
			const ebit = ebitda - depreciation;
			const nopat = ebit * (1 - tax);
			const fcf = nopat + depreciation - capex;

			const pv = fcf / Math.pow(1 + wacc, year);

			projections.push({
				year,
				ebitda: Math.round(ebitda),
				fcf: Math.round(fcf),
				pv: Math.round(pv),
			});
		}

		// Terminal value (Gordon Growth)
		const terminalEbitda = ebitda * (1 + terminalG);
		const terminalFcf = terminalEbitda * (1 - tax) * 0.95; // Simplified
		const terminalValue = terminalFcf / (wacc - terminalG);
		const pvTerminal = terminalValue / Math.pow(1 + wacc, 5);

		// Enterprise Value
		const sumPvCashflows = projections.reduce((sum, p) => sum + p.pv, 0);
		const enterpriseValue = sumPvCashflows + pvTerminal;

		return {
			projections,
			terminalValue: {
				raw: Math.round(terminalValue),
				presentValue: Math.round(pvTerminal),
			},
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
	},
});

/**
 * Parse financial upload from CSV
 */
export const parseFinancialUpload = action({
	args: { fileUrl: v.string() },
	handler: async (_ctx, args) => {
		try {
			const response = await fetch(args.fileUrl);
			if (!response.ok) {
				throw new Error("Failed to fetch file");
			}
			const fileText = await response.text();

			const result = Papa.parse(fileText, {
				header: true,
				dynamicTyping: true,
				skipEmptyLines: true,
			});

			if (result.errors.length > 0) {
				logger.warn("CSV parsing errors", {
					errors: result.errors.slice(0, 5),
				});
			}

			const rows = result.data as Record<string, string | number | null>[];

			// Extract key metrics
			let revenue = 0;
			let ebitda = 0;
			let netIncome = 0;

			// Strategy 1: Column based
			if (rows.length > 0) {
				const firstRow = rows[0];
				if ("Revenue" in firstRow) revenue = Number(firstRow["Revenue"]) || 0;
				if ("Chiffre d'affaires" in firstRow)
					revenue = Number(firstRow["Chiffre d'affaires"]) || 0;
				if ("CA" in firstRow) revenue = Number(firstRow["CA"]) || 0;
				if ("EBITDA" in firstRow) ebitda = Number(firstRow["EBITDA"]) || 0;
				if ("EBE" in firstRow) ebitda = Number(firstRow["EBE"]) || 0;
				if ("Net Income" in firstRow)
					netIncome = Number(firstRow["Net Income"]) || 0;
				if ("Résultat Net" in firstRow)
					netIncome = Number(firstRow["Résultat Net"]) || 0;
			}

			// Strategy 2: Row based (Metric, Value)
			if (revenue === 0 && ebitda === 0) {
				for (const row of rows) {
					const values = Object.values(row);

					// Look for metrics in row values
					const hasRevenue = values.some(
						(val) =>
							typeof val === "string" &&
							(val.toLowerCase().includes("revenue") ||
								val.toLowerCase().includes("chiffre")),
					);
					const hasEbitda = values.some(
						(val) =>
							typeof val === "string" &&
							(val.toLowerCase().includes("ebitda") ||
								val.toLowerCase().includes("ebe")),
					);
					const hasNetIncome = values.some(
						(val) =>
							typeof val === "string" &&
							(val.toLowerCase().includes("net") ||
								val.toLowerCase().includes("résultat")),
					);

					// Find numeric value in row
					const numericValue = values.find((v) => typeof v === "number") as
						| number
						| undefined;

					if (hasRevenue && numericValue && revenue === 0)
						revenue = numericValue;
					if (hasEbitda && numericValue && ebitda === 0) ebitda = numericValue;
					if (hasNetIncome && numericValue && netIncome === 0)
						netIncome = numericValue;
				}
			}

			return {
				revenue,
				ebitda,
				netIncome,
				ebitdaMargin:
					revenue > 0 ? Math.round((ebitda / revenue) * 10000) / 100 : 0,
				raw: rows.slice(0, 10),
				rowCount: rows.length,
			};
		} catch (error) {
			logger.error("Error parsing financial upload", { error: String(error) });
			throw new Error("Failed to parse file");
		}
	},
});
