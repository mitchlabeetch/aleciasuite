"use client";

import { Calendar, GitBranch, LayoutGrid, Table } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../tailwind/ui/tabs";

export type ViewType = "kanban" | "table" | "calendar" | "flow";

interface ViewSwitcherProps {
	currentView: ViewType;
	onViewChange: (view: ViewType) => void;
	showFlowView?: boolean;
}

const views: { value: ViewType; label: string; icon: React.ReactNode }[] = [
	{
		value: "kanban",
		label: "Kanban",
		icon: <LayoutGrid className="h-4 w-4" />,
	},
	{ value: "table", label: "Table", icon: <Table className="h-4 w-4" /> },
	{
		value: "calendar",
		label: "Calendar",
		icon: <Calendar className="h-4 w-4" />,
	},
	{ value: "flow", label: "Flow", icon: <GitBranch className="h-4 w-4" /> },
];

export function ViewSwitcher({
	currentView,
	onViewChange,
	showFlowView = true,
}: ViewSwitcherProps) {
	const visibleViews = showFlowView
		? views
		: views.filter((v) => v.value !== "flow");

	return (
		<Tabs
			value={currentView}
			onValueChange={(v) => onViewChange(v as ViewType)}
		>
			<TabsList className="grid grid-cols-4 w-[300px]">
				{visibleViews.map((view) => (
					<TabsTrigger
						key={view.value}
						value={view.value}
						className="flex items-center gap-1.5 text-xs"
					>
						{view.icon}
						<span className="hidden sm:inline">{view.label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
