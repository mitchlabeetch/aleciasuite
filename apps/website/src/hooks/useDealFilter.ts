import { useState, useMemo } from "react";

export function useDealFilter(deals: any[]) {
	const [selectedSector, setSelectedSector] = useState<string>("All");
	const [selectedType, setSelectedType] = useState<string>("All");
	const [selectedRegion, setSelectedRegion] = useState<string>("All");

	const filteredDeals = useMemo(() => {
		return (
			deals
				.filter((deal) => {
					const sectorMatch =
						selectedSector === "All" || deal.sector === selectedSector;
					const typeMatch =
						selectedType === "All" || deal.mandateType === selectedType;
					const regionMatch =
						selectedRegion === "All" || deal.region === selectedRegion;
					return sectorMatch && typeMatch && regionMatch;
				})
				// Sort by year, most recent first
				.sort((a, b) => (b.year || 0) - (a.year || 0))
		);
	}, [deals, selectedSector, selectedType, selectedRegion]);

	// Extract unique sectors for the filter UI
	const sectors = useMemo(() => {
		const allSectors = deals.map((d) => d.sector);
		return ["All", ...Array.from(new Set(allSectors))];
	}, [deals]);

	// Extract unique types for the filter UI
	const types = useMemo(() => {
		const allTypes = deals.map((d) => d.mandateType);
		return ["All", ...Array.from(new Set(allTypes))];
	}, [deals]);

	// Extract unique regions for the filter UI (only regions with operations)
	const regions = useMemo(() => {
		const allRegions = deals.map((d) => d.region).filter(Boolean) as string[];
		return ["All", ...Array.from(new Set(allRegions)).sort()];
	}, [deals]);

	return {
		selectedSector,
		setSelectedSector,
		selectedType,
		setSelectedType,
		selectedRegion,
		setSelectedRegion,
		filteredDeals,
		sectors,
		types,
		regions,
	};
}
