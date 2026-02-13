"use client";

import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

type DealStage =
	| "sourcing"
	| "due-diligence"
	| "negotiation"
	| "closing"
	| "closed-won"
	| "closed-lost";

export interface StageNodeData {
	stage: DealStage;
	label: string;
	count: number;
}

interface StageNodeProps {
	data: StageNodeData;
	selected?: boolean;
}

const stageColors: Record<
	DealStage,
	{ bg: string; border: string; text: string }
> = {
	sourcing: {
		bg: "bg-blue-500",
		border: "border-blue-600",
		text: "text-white",
	},
	"due-diligence": {
		bg: "bg-yellow-500",
		border: "border-yellow-600",
		text: "text-white",
	},
	negotiation: {
		bg: "bg-orange-500",
		border: "border-orange-600",
		text: "text-white",
	},
	closing: {
		bg: "bg-purple-500",
		border: "border-purple-600",
		text: "text-white",
	},
	"closed-won": {
		bg: "bg-green-500",
		border: "border-green-600",
		text: "text-white",
	},
	"closed-lost": {
		bg: "bg-red-500",
		border: "border-red-600",
		text: "text-white",
	},
};

function StageNode({ data, selected }: StageNodeProps) {
	const colors = stageColors[data.stage] || stageColors.sourcing;

	return (
		<div
			className={`
        ${colors.bg} ${colors.text} rounded-lg shadow-lg border-2 ${colors.border}
        px-6 py-3 min-w-[150px] text-center
        ${selected ? "ring-4 ring-white/50" : ""}
        transition-all
      `}
		>
			{/* Input handle (left) */}
			<Handle
				type="target"
				position={Position.Left}
				className="w-3 h-3 !bg-white"
			/>

			<div className="font-bold text-lg">{data.label}</div>
			<div className="text-sm opacity-90">{data.count} deals</div>

			{/* Output handle (right) */}
			<Handle
				type="source"
				position={Position.Right}
				className="w-3 h-3 !bg-white"
			/>
		</div>
	);
}

export default memo(StageNode);
