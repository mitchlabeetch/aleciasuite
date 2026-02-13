"use client";

/**
 * Alert - Composants d'alerte
 * Adapté pour Alecia Colab - Interface française
 */

import { cn } from "@/lib/utils";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Info,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
	variant?: AlertVariant;
	title?: string;
	children: React.ReactNode;
	dismissible?: boolean;
	onDismiss?: () => void;
	className?: string;
}

const variantConfig = {
	info: {
		icon: Info,
		bg: "bg-blue-50 dark:bg-blue-950/30",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-800 dark:text-blue-200",
		iconColor: "text-blue-500 dark:text-blue-400",
	},
	success: {
		icon: CheckCircle2,
		bg: "bg-green-50 dark:bg-green-950/30",
		border: "border-green-200 dark:border-green-800",
		text: "text-green-800 dark:text-green-200",
		iconColor: "text-green-500 dark:text-green-400",
	},
	warning: {
		icon: AlertTriangle,
		bg: "bg-yellow-50 dark:bg-yellow-950/30",
		border: "border-yellow-200 dark:border-yellow-800",
		text: "text-yellow-800 dark:text-yellow-200",
		iconColor: "text-yellow-500 dark:text-yellow-400",
	},
	error: {
		icon: AlertCircle,
		bg: "bg-red-50 dark:bg-red-950/30",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-800 dark:text-red-200",
		iconColor: "text-red-500 dark:text-red-400",
	},
};

export default function Alert({
	variant = "info",
	title,
	children,
	dismissible = false,
	onDismiss,
	className,
}: AlertProps) {
	const [isVisible, setIsVisible] = useState(true);
	const config = variantConfig[variant];
	const Icon = config.icon;

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.2 }}
					role="alert"
					className={cn(
						"relative flex gap-3 rounded-lg border p-4",
						config.bg,
						config.border,
						className,
					)}
				>
					<Icon
						className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)}
					/>

					<div className="flex-1">
						{title && (
							<h5 className={cn("font-medium mb-1", config.text)}>{title}</h5>
						)}
						<div className={cn("text-sm", config.text)}>{children}</div>
					</div>

					{dismissible && (
						<button
							onClick={handleDismiss}
							className={cn(
								"flex-shrink-0 p-1 rounded-md",
								"hover:bg-black/5 dark:hover:bg-white/5",
								"transition-colors duration-150",
								config.text,
							)}
							aria-label="Fermer l'alerte"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

/**
 * Alertes pré-configurées en français
 */

export function AlertSucces({
	children,
	title = "Succès",
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<Alert variant="success" title={title}>
			{children}
		</Alert>
	);
}

export function AlertErreur({
	children,
	title = "Erreur",
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<Alert variant="error" title={title}>
			{children}
		</Alert>
	);
}

export function AlertAvertissement({
	children,
	title = "Attention",
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<Alert variant="warning" title={title}>
			{children}
		</Alert>
	);
}

export function AlertInfo({
	children,
	title = "Information",
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<Alert variant="info" title={title}>
			{children}
		</Alert>
	);
}
