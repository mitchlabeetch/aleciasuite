"use client";

import { Handle, Position } from "@xyflow/react";
import { Building, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { memo } from "react";
import { Badge } from "../../tailwind/ui/badge";

type DealStage =
	| "sourcing"
	| "due-diligence"
	| "negotiation"
	| "closing"
	| "closed-won"
	| "closed-lost";
type Priority = "high" | "medium" | "low";

export interface DealNodeData {
	company: string;
	stage: DealStage;
	valuation?: string;
	lead?: string;
	priority?: Priority;
	createdAt?: number;
}

interface DealNodeProps {
	data: DealNodeData;
	selected?: boolean;
}

const stageColors: Record<DealStage, string> = {
	sourcing: "bg-blue-100 text-blue-800 border-blue-300",
	"due-diligence": "bg-yellow-100 text-yellow-800 border-yellow-300",
	negotiation: "bg-orange-100 text-orange-800 border-orange-300",
	closing: "bg-purple-100 text-purple-800 border-purple-300",
	"closed-won": "bg-green-100 text-green-800 border-green-300",
	"closed-lost": "bg-red-100 text-red-800 border-red-300",
};

const priorityIndicators: Record<Priority, string> = {
	high: "🔴",
	medium: "🟡",
	low: "🟢",
};

function DealNode({ data, selected }: DealNodeProps) {
	const stageStyle = stageColors[data.stage] || stageColors.sourcing;

	return (
		<div
			className={`
        bg-white dark:bg-gray-900 rounded-lg shadow-md border-2 p-3 min-w-[200px]
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-gray-200 dark:border-gray-700"}
        transition-all hover:shadow-lg
      `}
		>
			{/* Input handle (top) */}
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 !bg-gray-400"
			/>

			{/* Company name with icon */}
			<div className="flex items-center gap-2 mb-2">
				<Building className="h-4 w-4 text-muted-foreground shrink-0" />
				<span className="font-semibold text-sm truncate">{data.company}</span>
				{data.priority && (
					<span className="text-xs" title={`${data.priority} priority`}>
						{priorityIndicators[data.priority]}
					</span>
				)}
			</div>

			{/* Stage badge */}
			<Badge className={`${stageStyle} text-xs mb-2`}>
				{data.stage.replace("-", " ")}
			</Badge>

			{/* Details */}
			<div className="space-y-1 text-xs text-muted-foreground">
				{data.valuation && (
					<div className="flex items-center gap-1">
						<DollarSign className="h-3 w-3" />
						<span>{data.valuation}</span>
					</div>
				)}
				{data.lead && (
					<div className="flex items-center gap-1">
						<TrendingUp className="h-3 w-3" />
						<span>{data.lead}</span>
					</div>
				)}
				{data.createdAt && (
					<div className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						<span>{new Date(data.createdAt).toLocaleDateString()}</span>
					</div>
				)}
			</div>

			{/* Output handle (bottom) */}
			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 !bg-gray-400"
			/>
		</div>
	);
}

export default memo(DealNode);
