/*
Formats a number to Alecia's strict financial format.
Rule: Space between number and unit, lowercase unit letter.
Example: 50000000 -> "50 m€"
*/
export function formatFinancialValue(value: number | null | undefined): string {
	if (value == null) return "N/A";
	if (value >= 1_000_000) {
		const millions = Math.round(value / 1_000_000);
		return `${millions} m€`;
	}
	if (value >= 1_000) {
		const thousands = Math.round(value / 1_000);
		return `${thousands} k€`;
	}
	return `${value.toLocaleString("fr-FR")} €`;
}
