"use client";

import {
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type OnConnect,
	Panel,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useMemo, useState, useEffect } from "react";
import "@xyflow/react/dist/style.css";

import { listDeals } from "@/actions/deals";

import { GitBranch, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "../tailwind/ui/button";
import DealNode from "./nodes/DealNode";
import StageNode from "./nodes/StageNode";
import type { DealStage } from "../../lib/types";

const nodeTypes = {
	deal: DealNode,
	stage: StageNode,
};

const stageLabels: Record<DealStage, string> = {
	sourcing: "Sourcing",
	qualification: "Qualification",
	initial_meeting: "Initial Meeting",
	analysis: "Analysis",
	valuation: "Valuation",
	due_diligence: "Due Diligence",
	negotiation: "Negotiation",
	closing: "Closing",
	closed_won: "Won",
	closed_lost: "Lost",
	// Legacy stages
	Lead: "Lead",
	"NDA Signed": "NDA Signed",
	"Offer Received": "Offer Received",
	"Due Diligence": "Due Diligence",
	Closing: "Closing",
	completed: "Completed",
};

// Pipeline stages for visualization (active deals only)
const pipelineStages: DealStage[] = [
	"sourcing",
	"qualification",
	"initial_meeting",
	"analysis",
	"valuation",
	"due_diligence",
	"negotiation",
	"closing",
];

interface DealFlowCanvasProps {
	onDealClick?: (dealId: string) => void;
}

export default function DealFlowCanvas({ onDealClick }: DealFlowCanvasProps) {
	const [viewMode, setViewMode] = useState<"stages" | "deals">("stages");
	const [deals, setDeals] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

	useEffect(() => {
		if (!isConvexConfigured) {
			setIsLoading(false);
			return;
		}

		async function loadDeals() {
			try {
				const dealsData = await listDeals();
				setDeals(dealsData);
			} catch (error) {
				console.error("Failed to load deals:", error);
				setDeals([]);
			} finally {
				setIsLoading(false);
			}
		}

		loadDeals();
	}, [isConvexConfigured]);

	// Transform deals to nodes based on view mode
	const { initialNodes, initialEdges } = useMemo(() => {
		if (viewMode === "stages") {
			// Stage-focused view: show pipeline stages as connected nodes
			const stageNodes: Node[] = pipelineStages.map((stage, index) => ({
				id: `stage-${stage}`,
				type: "stage",
				position: { x: index * 250, y: 100 },
				data: {
					stage,
					label: stageLabels[stage],
					count: deals.filter((d: { stage: string }) => d.stage === stage)
						.length,
				},
			}));

			const stageEdges: Edge[] = pipelineStages
				.slice(0, -1)
				.map((stage, index) => ({
					id: `edge-${stage}-${pipelineStages[index + 1]}`,
					source: `stage-${stage}`,
					target: `stage-${pipelineStages[index + 1]}`,
					animated: true,
					style: { stroke: "#888", strokeWidth: 2 },
				}));

			return { initialNodes: stageNodes, initialEdges: stageEdges };
		}
		// Deal-focused view: show individual deals
		const dealsByStage = pipelineStages.reduce(
			(acc, stage) => {
				acc[stage] = deals.filter((d: { stage: string }) => d.stage === stage);
				return acc;
			},
			{} as Record<DealStage, typeof deals>,
		);

		const dealNodes: Node[] = [];

		pipelineStages.forEach((stage, stageIndex) => {
			dealsByStage[stage].forEach(
				(
					deal: {
						id: string;
						stage: string;
						title?: string;
						valuation?: string | number;
						lead?: string;
						priority?: string;
						createdAt?: number;
						nodePosition?: { x: number; y: number };
					},
					dealIndex: number,
				) => {
					dealNodes.push({
						id: deal.id,
						type: "deal",
						position: deal.nodePosition || {
							x: stageIndex * 280,
							y: 50 + dealIndex * 160,
						},
						data: {
							company: deal.title, // Keep 'company' in data for backward compatibility with node rendering
							stage: deal.stage,
							valuation: deal.valuation,
							lead: deal.lead,
							priority: deal.priority,
							createdAt: deal.createdAt,
						},
					});
				},
			);
		});

		return { initialNodes: dealNodes, initialEdges: [] };
	}, [deals, viewMode]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect: OnConnect = useCallback(
		(params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
		[setEdges],
	);

	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			if (node.type === "deal" && onDealClick) {
				onDealClick(node.id);
			}
		},
		[onDealClick],
	);

	// Update nodes when data changes
	useMemo(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, initialEdges, setNodes, setEdges]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[500px] border rounded-lg">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isConvexConfigured) {
		return (
			<div className="flex flex-col items-center justify-center h-[500px] border rounded-lg text-muted-foreground">
				<GitBranch className="h-12 w-12 mb-4 opacity-50" />
				<p className="font-medium">Deal Flow Visualization</p>
				<p className="text-sm">
					Configure Convex to enable real-time flow view
				</p>
			</div>
		);
	}

	return (
		<div className="h-[600px] border rounded-lg overflow-hidden">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				nodeTypes={nodeTypes}
				fitView
				proOptions={{ hideAttribution: true }}
				className="bg-gray-50 dark:bg-gray-900"
			>
				<Panel position="top-left" className="flex gap-2">
					<Button
						size="sm"
						variant={viewMode === "stages" ? "default" : "outline"}
						onClick={() => setViewMode("stages")}
					>
						<LayoutGrid className="h-4 w-4 mr-1" />
						Stages
					</Button>
					<Button
						size="sm"
						variant={viewMode === "deals" ? "default" : "outline"}
						onClick={() => setViewMode("deals")}
					>
						<GitBranch className="h-4 w-4 mr-1" />
						Deals
					</Button>
				</Panel>
				<Controls />
				<MiniMap
					nodeStrokeColor="#888"
					nodeColor={(node) => {
						if (node.type === "stage") return "#3b82f6";
						return "#f3f4f6";
					}}
				/>
				<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
			</ReactFlow>
		</div>
	);
}
