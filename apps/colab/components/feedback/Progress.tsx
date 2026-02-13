"use client";

/**
 * Progress - Barre de progression avec labels
 * Adapté pour Alecia Colab - Interface française
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressProps {
	value: number;
	title?: string;
	subtitle?: string;
	showPercentage?: boolean;
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "success" | "warning" | "error";
}

const variantColors = {
	default: "bg-blue-500",
	success: "bg-green-500",
	warning: "bg-yellow-500",
	error: "bg-red-500",
};

const sizeConfig = {
	sm: { height: "h-1", text: "text-xs" },
	md: { height: "h-2", text: "text-sm" },
	lg: { height: "h-3", text: "text-base" },
};

export default function Progress({
	value,
	title,
	subtitle,
	showPercentage = true,
	className,
	size = "md",
	variant = "default",
}: ProgressProps) {
	const clampedValue = Math.min(100, Math.max(0, value));
	const config = sizeConfig[size];
	const colorClass = variantColors[variant];

	return (
		<div className={cn("w-full space-y-2", className)}>
			{(title || subtitle || showPercentage) && (
				<div className="flex items-start justify-between">
					<div>
						{title && (
							<p
								className={cn(
									"font-medium text-gray-900 dark:text-white",
									config.text,
								)}
							>
								{title}
							</p>
						)}
						{subtitle && (
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{subtitle}
							</p>
						)}
					</div>
					{showPercentage && (
						<span
							className={cn(
								"font-medium text-gray-900 dark:text-white",
								config.text,
							)}
						>
							{Math.round(clampedValue)}%
						</span>
					)}
				</div>
			)}

			<div
				className={cn(
					"w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
					config.height,
				)}
			>
				<motion.div
					className={cn("h-full rounded-full", colorClass)}
					initial={{ width: 0 }}
					animate={{ width: `${clampedValue}%` }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				/>
			</div>
		</div>
	);
}

/**
 * Composants pré-configurés pour cas d'usage courants
 */

export function ProgressEtudeMarche({ value }: { value: number }) {
	return (
		<Progress
			value={value}
			title="Étude de marché"
			subtitle="Analyse en cours..."
			variant={value >= 100 ? "success" : "default"}
		/>
	);
}

export function ProgressSauvegarde({ value }: { value: number }) {
	return (
		<Progress
			value={value}
			title="Sauvegarde"
			subtitle="Enregistrement des modifications"
			size="sm"
		/>
	);
}

export function ProgressIA({ value, task }: { value: number; task: string }) {
	return (
		<Progress
			value={value}
			title="Analyse IA"
			subtitle={task}
			variant={value >= 100 ? "success" : "default"}
		/>
	);
}
