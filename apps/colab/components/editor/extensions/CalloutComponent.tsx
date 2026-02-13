import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
} from "@tiptap/react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const CalloutComponent = ({ node }: NodeViewProps) => {
	const { type } = node.attrs;

	const getIcon = () => {
		switch (type) {
			case "info":
				return <Info className="h-5 w-5 text-blue-500" />;
			case "warning":
				return <AlertTriangle className="h-5 w-5 text-amber-500" />;
			case "success":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "error":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			default:
				return <Info className="h-5 w-5 text-blue-500" />;
		}
	};

	const getBorderColor = () => {
		switch (type) {
			case "info":
				return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30";
			case "warning":
				return "border-l-amber-500 bg-amber-50 dark:bg-amber-950/30";
			case "success":
				return "border-l-green-500 bg-green-50 dark:bg-green-950/30";
			case "error":
				return "border-l-red-500 bg-red-50 dark:bg-red-950/30";
			default:
				return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30";
		}
	};

	return (
		<NodeViewWrapper className="my-4">
			<div
				className={cn(
					"flex gap-3 rounded-r-lg border-l-4 p-4",
					getBorderColor(),
				)}
			>
				<div className="select-none" contentEditable={false}>
					{getIcon()}
				</div>
				<NodeViewContent className="flex-1 min-w-0" />
			</div>
		</NodeViewWrapper>
	);
};
