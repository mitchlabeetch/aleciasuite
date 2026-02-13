import {
	Briefcase,
	Building2,
	Factory,
	Heart,
	Laptop,
	Leaf as _Leaf,
	ShoppingBag,
	Truck,
	Utensils,
	Anchor as _Anchor,
	Smartphone,
	Plane,
	Zap,
	FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Sector {
	id: string;
	name: string;
	icon: LucideIcon;
	/** EBE (EBITDA) multiple - median value from "Baromètre Absoluce de Valorisation des PME 2025" */
	ebeMultiple: number;
}

/**
 * Sector data with EBE (Excédent Brut d'Exploitation) multiples
 * Source: Baromètre Absoluce de Valorisation des PME 2025 - Tableau 6 (Multiple d'EBIT)
 *
 * Note: These are median sector multiples. Actual multiples vary based on size, growth, margins, etc.
 */
export const sectors: Sector[] = [
	{
		id: "auto",
		name: "Automobile et équipementiers",
		icon: Truck,
		ebeMultiple: 8.9,
	},
	{
		id: "btp",
		name: "Bâtiment et travaux publics",
		icon: Building2,
		ebeMultiple: 10.2,
	},
	{
		id: "commerce",
		name: "Commerce de détail",
		icon: ShoppingBag,
		ebeMultiple: 12.4,
	},
	{ id: "energie", name: "Énergies", icon: Zap, ebeMultiple: 12.6 },
	{
		id: "equipement",
		name: "Équipement personne et maison",
		icon: Briefcase,
		ebeMultiple: 16.8,
	},
	{ id: "immobilier", name: "Immobilier", icon: Building2, ebeMultiple: 19.3 },
	{
		id: "industrie",
		name: "Industrie des biens et services",
		icon: Factory,
		ebeMultiple: 10.6,
	},
	{
		id: "electronique",
		name: "Industrie électronique",
		icon: Smartphone,
		ebeMultiple: 15.1,
	},
	{
		id: "logiciels",
		name: "Logiciels - Data",
		icon: Laptop,
		ebeMultiple: 12.1,
	},
	{ id: "medias", name: "Médias", icon: Smartphone, ebeMultiple: 4.6 },
	{
		id: "agroalimentaire",
		name: "Produits alimentaires et boissons",
		icon: Utensils,
		ebeMultiple: 15.3,
	},
	{
		id: "chimie",
		name: "Ressources et produits chimiques",
		icon: FlaskConical,
		ebeMultiple: 13.0,
	},
	{
		id: "sante",
		name: "Santé - biotechnologie",
		icon: Heart,
		ebeMultiple: 13.7,
	},
	{ id: "transport", name: "Transport", icon: Truck, ebeMultiple: 16.2 },
	{
		id: "tourisme",
		name: "Voyages et loisirs",
		icon: Plane,
		ebeMultiple: 14.5,
	},
];

// Default multiple for sectors not in the list (TOUS SECTEURS median)
const DEFAULT_MULTIPLE = 12.9;

/**
 * Get the EBE multiple for a sector by name or ID
 */
export function getSectorMultiple(sectorNameOrId: string): number {
	const sector = sectors.find(
		(s) => s.name === sectorNameOrId || s.id === sectorNameOrId,
	);
	return sector?.ebeMultiple || DEFAULT_MULTIPLE;
}

/**
 * Calculate valuation based on EBE and sector
 * Uses a +/- 20% range around the sector median multiple
 * @param ebe - Excédent Brut d'Exploitation in millions
 * @param sectorName - Sector name or ID
 * @returns [minValuation, maxValuation] in millions
 */
export function calculateValuation(
	ebe: number,
	sectorName: string,
): [number, number] {
	const multiple = getSectorMultiple(sectorName);
	// Apply +/- 20% variance for range
	const minMultiple = multiple * 0.8;
	const maxMultiple = multiple * 1.2;
	return [
		Math.round(ebe * minMultiple * 10) / 10,
		Math.round(ebe * maxMultiple * 10) / 10,
	];
}
