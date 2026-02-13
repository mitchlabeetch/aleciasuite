"use client";

/**
 * UnifiedActivityFeed - Shows recent activities across all tools
 *
 * Displays a chronological feed of:
 * - Deal updates
 * - Colab document changes
 * - Numbers tool activities
 */

import { useState, useEffect } from "react";
import { getUnifiedActivityFeed } from "@/actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
	Briefcase,
	FileText,
	Calculator,
	FileSpreadsheet,
	BarChart3,
	Calendar,
	FileIcon,
	CheckSquare,
	Loader2,
	Clock,
	ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UnifiedActivityFeedProps {
	dealId?: string;
	limit?: number;
	compact?: boolean;
}

const ACTIVITY_TYPE_CONFIG = {
	deal_created: {
		icon: Briefcase,
		label: "Deal cree",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	deal_updated: {
		icon: Briefcase,
		label: "Deal modifie",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	document_created: {
		icon: FileText,
		label: "Document cree",
		color: "text-purple-500",
		bgColor: "bg-purple-500/10",
	},
	document_updated: {
		icon: FileText,
		label: "Document modifie",
		color: "text-purple-500",
		bgColor: "bg-purple-500/10",
	},
	numbers_fee_calc: {
		icon: Calculator,
		label: "Calcul Fees",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	numbers_model: {
		icon: FileSpreadsheet,
		label: "Modele Financier",
		color: "text-indigo-500",
		bgColor: "bg-indigo-500/10",
	},
	numbers_comparable: {
		icon: BarChart3,
		label: "Comparables",
		color: "text-orange-500",
		bgColor: "bg-orange-500/10",
	},
	numbers_timeline: {
		icon: Calendar,
		label: "Timeline",
		color: "text-pink-500",
		bgColor: "bg-pink-500/10",
	},
	numbers_teaser: {
		icon: FileIcon,
		label: "Teaser",
		color: "text-cyan-500",
		bgColor: "bg-cyan-500/10",
	},
	numbers_postdeal: {
		icon: CheckSquare,
		label: "Post-Deal",
		color: "text-teal-500",
		bgColor: "bg-teal-500/10",
	},
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPE_CONFIG;

export function UnifiedActivityFeed({
	dealId,
	limit = 20,
	compact = false,
}: UnifiedActivityFeedProps) {
	const router = useRouter();

	// Fetch activities
	const [activities, setActivities] = useState<any>(undefined);

	useEffect(() => {
		getUnifiedActivityFeed({ limit, dealId }).then(setActivities);
	}, [limit, dealId]);

	if (activities === undefined) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<div className="text-center py-8">
				<Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
				<p className="text-sm text-muted-foreground">
					Aucune activite recente
				</p>
			</div>
		);
	}

	const handleActivityClick = (activity: {
		type: string;
		id: string;
		dealId?: string;
		toolType?: string;
	}) => {
		const actualId = activity.id.split("-").slice(1).join("-");

		switch (activity.toolType) {
			case "deals":
				router.push("/admin/deals");
				break;
			case "colab":
				window.open(
					`${process.env.NEXT_PUBLIC_ALECIA_COLAB_URL || "https://colab.alecia.markets"}/documents/${actualId}`,
					"_blank"
				);
				break;
			case "numbers":
				if (activity.type.includes("fee")) {
					router.push(`/admin/numbers/fee-calculator?id=${actualId}`);
				} else if (activity.type.includes("model")) {
					router.push(`/admin/numbers/financial-model?id=${actualId}`);
				} else if (activity.type.includes("comparable")) {
					router.push(`/admin/numbers/comparables?id=${actualId}`);
				} else if (activity.type.includes("timeline")) {
					router.push(`/admin/numbers/timeline?id=${actualId}`);
				} else if (activity.type.includes("teaser")) {
					router.push(`/admin/numbers/teaser-tracking?id=${actualId}`);
				} else if (activity.type.includes("postdeal")) {
					router.push(`/admin/numbers/post-deal?id=${actualId}`);
				}
				break;
		}
	};

	if (compact) {
		return (
			<div className="space-y-2">
				{(activities as Array<{
					id: string;
					type: ActivityType;
					title: string;
					timestamp: number;
					dealTitle?: string;
					toolType?: string;
					dealId?: string;
				}>).map((activity) => {
					const config = ACTIVITY_TYPE_CONFIG[activity.type];
					const Icon = config?.icon || FileText;
					return (
						<button
							type="button"
							key={activity.id}
							onClick={() => handleActivityClick(activity)}
							className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
						>
							<div className={`p-1.5 rounded ${config?.bgColor || "bg-gray-100"}`}>
								<Icon className={`h-3.5 w-3.5 ${config?.color || "text-gray-500"}`} />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{activity.title}</p>
								<p className="text-xs text-muted-foreground">
									{formatDistanceToNow(activity.timestamp, {
										addSuffix: true,
										locale: fr,
									})}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{(activities as Array<{
				id: string;
				type: ActivityType;
				title: string;
				description?: string;
				timestamp: number;
				dealTitle?: string;
				toolType?: string;
				dealId?: string;
			}>).map((activity) => {
				const config = ACTIVITY_TYPE_CONFIG[activity.type];
				const Icon = config?.icon || FileText;
				return (
					<button
						type="button"
						key={activity.id}
						className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
						onClick={() => handleActivityClick(activity)}
					>
						<div className={`p-2 rounded-lg ${config?.bgColor || "bg-gray-100"}`}>
							<Icon className={`h-5 w-5 ${config?.color || "text-gray-500"}`} />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="font-medium">{activity.title}</p>
									{activity.description && (
										<p className="text-sm text-muted-foreground">
											{activity.description}
										</p>
									)}
								</div>
								<ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
							</div>
							<div className="flex items-center gap-2 mt-2">
								<Badge variant="secondary" className="text-xs">
									{config?.label || "Activite"}
								</Badge>
								{activity.dealTitle && (
									<Badge variant="outline" className="text-xs">
										{activity.dealTitle}
									</Badge>
								)}
								<span className="text-xs text-muted-foreground ml-auto">
									{formatDistanceToNow(activity.timestamp, {
										addSuffix: true,
										locale: fr,
									})}
								</span>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}
