import { sectors } from "@/data/sectors";

export function SectorGrid() {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
			{sectors.map((sector) => {
				const Icon = sector.icon;
				return (
					<div
						key={sector.id}
						className="group flex flex-col items-center justify-center p-6 bg-secondary rounded-xl transition-all duration-300 hover:bg-[var(--alecia-midnight)] hover:text-white hover:-translate-y-1 hover:shadow-lg"
					>
						<div className="mb-4 p-3 rounded-full bg-blue-50/50 group-hover:bg-white/10 transition-colors">
							<Icon className="w-8 h-8 text-alecia-mid-blue group-hover:text-[var(--alecia-light-blue)] transition-colors" />
						</div>
						<h3 className="text-center font-medium text-lg leading-tight">
							{sector.name}
						</h3>
					</div>
				);
			})}
		</div>
	);
}
