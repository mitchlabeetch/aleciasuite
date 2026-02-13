/**
 * Export utilities for Alecia Numbers
 *
 * Provides Excel and PDF export functionality for all Numbers tools
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ============================================
// Types
// ============================================

export interface ExportColumn {
	key: string;
	header: string;
	width?: number;
	format?: "text" | "number" | "currency" | "percent" | "date";
}

export interface ExportOptions {
	filename: string;
	sheetName?: string;
	title?: string;
	subtitle?: string;
	includeTimestamp?: boolean;
}

// ============================================
// Excel Export
// ============================================

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends Record<string, unknown>>(
	data: T[],
	columns: ExportColumn[],
	options: ExportOptions
): void {
	const { filename, sheetName = "Data", title, subtitle, includeTimestamp = true } = options;

	// Create workbook
	const wb = XLSX.utils.book_new();

	// Prepare header row
	const headers = columns.map((col) => col.header);

	// Prepare data rows
	const rows = data.map((item) =>
		columns.map((col) => {
			const value = item[col.key];

			// Format values based on column type
			if (col.format === "currency" && typeof value === "number") {
				return value;
			}
			if (col.format === "percent" && typeof value === "number") {
				return value / 100;
			}
			return value;
		})
	);

	// Create worksheet data
	const wsData: unknown[][] = [];

	// Add title if provided
	if (title) {
		wsData.push([title]);
		if (subtitle) {
			wsData.push([subtitle]);
		}
		if (includeTimestamp) {
			wsData.push([`Exporte le ${new Date().toLocaleDateString("fr-FR")} a ${new Date().toLocaleTimeString("fr-FR")}`]);
		}
		wsData.push([]); // Empty row
	}

	// Add headers and data
	wsData.push(headers);
	wsData.push(...rows);

	// Create worksheet
	const ws = XLSX.utils.aoa_to_sheet(wsData);

	// Set column widths
	const colWidths = columns.map((col) => ({
		wch: col.width || Math.max(col.header.length, 12),
	}));
	ws["!cols"] = colWidths;

	// Apply number formats
	const dataStartRow = title ? (subtitle ? 5 : 4) : 1;
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

	for (let R = dataStartRow; R <= range.e.r; R++) {
		for (let C = 0; C <= range.e.c; C++) {
			const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
			const cell = ws[cellRef];
			if (!cell) continue;

			const column = columns[C];
			if (column?.format === "currency") {
				cell.z = '#,##0.00 "EUR"';
			} else if (column?.format === "percent") {
				cell.z = "0.0%";
			} else if (column?.format === "number") {
				cell.z = "#,##0";
			}
		}
	}

	// Add worksheet to workbook
	XLSX.utils.book_append_sheet(wb, ws, sheetName);

	// Generate file
	const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
	const blob = new Blob([excelBuffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	// Download
	const finalFilename = `${filename}${includeTimestamp ? `_${formatDateForFilename(new Date())}` : ""}.xlsx`;
	saveAs(blob, finalFilename);
}

/**
 * Export multiple sheets to Excel
 */
export function exportMultiSheetExcel(
	sheets: Array<{
		name: string;
		data: Record<string, unknown>[];
		columns: ExportColumn[];
	}>,
	options: ExportOptions
): void {
	const { filename, includeTimestamp = true } = options;

	const wb = XLSX.utils.book_new();

	for (const sheet of sheets) {
		const headers = sheet.columns.map((col) => col.header);
		const rows = sheet.data.map((item) =>
			sheet.columns.map((col) => item[col.key])
		);

		const wsData = [headers, ...rows];
		const ws = XLSX.utils.aoa_to_sheet(wsData);

		const colWidths = sheet.columns.map((col) => ({
			wch: col.width || Math.max(col.header.length, 12),
		}));
		ws["!cols"] = colWidths;

		XLSX.utils.book_append_sheet(wb, ws, sheet.name);
	}

	const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
	const blob = new Blob([excelBuffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	const finalFilename = `${filename}${includeTimestamp ? `_${formatDateForFilename(new Date())}` : ""}.xlsx`;
	saveAs(blob, finalFilename);
}

/**
 * Export financial model to Excel with multiple sheets
 */
export function exportFinancialModelToExcel(
	years: Array<{
		year: number;
		isProjection: boolean;
		revenue?: number;
		cogs?: number;
		opex?: number;
		ebitda?: number;
		depreciation?: number;
		ebit?: number;
		interestExpense?: number;
		ebt?: number;
		taxes?: number;
		netIncome?: number;
		cash?: number;
		receivables?: number;
		inventory?: number;
		totalCurrentAssets?: number;
		ppe?: number;
		totalAssets?: number;
		payables?: number;
		shortTermDebt?: number;
		longTermDebt?: number;
		totalLiabilities?: number;
		totalEquity?: number;
		cfo?: number;
		capex?: number;
		cfi?: number;
		debtChange?: number;
		dividends?: number;
		cff?: number;
		netCashFlow?: number;
	}>,
	companyName: string
): void {
	const wb = XLSX.utils.book_new();

	// Income Statement sheet
	const incomeData = [
		["Compte de Resultat", companyName],
		[""],
		["Ligne", ...years.map((y) => `${y.year}${y.isProjection ? " (P)" : ""}`)],
		["Chiffre d'affaires", ...years.map((y) => y.revenue)],
		["(-) Cout des ventes", ...years.map((y) => -(y.cogs as number))],
		["Marge brute", ...years.map((y) => (y.revenue as number) - (y.cogs as number))],
		["(-) Charges d'exploitation", ...years.map((y) => -(y.opex as number))],
		["EBITDA", ...years.map((y) => y.ebitda)],
		["(-) D&A", ...years.map((y) => -(y.depreciation as number))],
		["EBIT", ...years.map((y) => y.ebit)],
		["(-) Charges financieres", ...years.map((y) => -(y.interestExpense as number))],
		["Resultat avant impot", ...years.map((y) => y.ebt)],
		["(-) Impots", ...years.map((y) => -(y.taxes as number))],
		["Resultat net", ...years.map((y) => y.netIncome)],
	];

	const wsIncome = XLSX.utils.aoa_to_sheet(incomeData);
	XLSX.utils.book_append_sheet(wb, wsIncome, "Compte de Resultat");

	// Balance Sheet
	const balanceData = [
		["Bilan", companyName],
		[""],
		["Ligne", ...years.map((y) => `${y.year}${y.isProjection ? " (P)" : ""}`)],
		["ACTIF", ...years.map(() => "")],
		["Tresorerie", ...years.map((y) => y.cash)],
		["Creances clients", ...years.map((y) => y.receivables)],
		["Stocks", ...years.map((y) => y.inventory)],
		["Total actif circulant", ...years.map((y) => y.totalCurrentAssets)],
		["Immobilisations", ...years.map((y) => y.ppe)],
		["Total Actif", ...years.map((y) => y.totalAssets)],
		["PASSIF", ...years.map(() => "")],
		["Dettes fournisseurs", ...years.map((y) => y.payables)],
		["Dette court terme", ...years.map((y) => y.shortTermDebt)],
		["Dette long terme", ...years.map((y) => y.longTermDebt)],
		["Total Passif", ...years.map((y) => y.totalLiabilities)],
		["Capitaux propres", ...years.map((y) => y.totalEquity)],
	];

	const wsBalance = XLSX.utils.aoa_to_sheet(balanceData);
	XLSX.utils.book_append_sheet(wb, wsBalance, "Bilan");

	// Cash Flow
	const cashFlowData = [
		["Flux de Tresorerie", companyName],
		[""],
		["Ligne", ...years.map((y) => `${y.year}${y.isProjection ? " (P)" : ""}`)],
		["Flux operationnels (CFO)", ...years.map((y) => y.cfo)],
		["Investissements (CAPEX)", ...years.map((y) => y.capex)],
		["Flux d'investissement (CFI)", ...years.map((y) => y.cfi)],
		["Variation dette", ...years.map((y) => y.debtChange)],
		["Dividendes", ...years.map((y) => y.dividends)],
		["Flux de financement (CFF)", ...years.map((y) => y.cff)],
		["Variation nette", ...years.map((y) => y.netCashFlow)],
	];

	const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowData);
	XLSX.utils.book_append_sheet(wb, wsCashFlow, "Cash Flow");

	// Generate and save
	const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
	const blob = new Blob([excelBuffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `Modele_Financier_${companyName.replace(/\s+/g, "_")}_${formatDateForFilename(new Date())}.xlsx`);
}

// ============================================
// PDF Export (via print dialog)
// ============================================

/**
 * Export current view to PDF using browser print
 */
export function exportToPDF(title: string): void {
	// Store original title
	const originalTitle = document.title;
	document.title = title;

	// Trigger print dialog (user can save as PDF)
	window.print();

	// Restore original title
	setTimeout(() => {
		document.title = originalTitle;
	}, 1000);
}

// ============================================
// CSV Export
// ============================================

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
	data: T[],
	columns: ExportColumn[],
	options: ExportOptions
): void {
	const { filename, includeTimestamp = true } = options;

	const headers = columns.map((col) => col.header);
	const rows = data.map((item) =>
		columns.map((col) => {
			const value = item[col.key];
			// Escape commas and quotes
			if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
				return `"${value.replace(/"/g, '""')}"`;
			}
			return value;
		})
	);

	const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
	const finalFilename = `${filename}${includeTimestamp ? `_${formatDateForFilename(new Date())}` : ""}.csv`;
	saveAs(blob, finalFilename);
}

// ============================================
// Helpers
// ============================================

function formatDateForFilename(date: Date): string {
	return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Format number for display
 */
export function formatNumber(value: number, decimals = 0): string {
	if (Math.abs(value) >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (Math.abs(value) >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toFixed(decimals);
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Format percent for display
 */
export function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`;
}
