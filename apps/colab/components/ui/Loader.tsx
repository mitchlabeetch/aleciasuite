"use client";

/**
 * Loader Component - French loading states
 * Displays loading animations with French text
 */

import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoaderProps {
	message?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function Loader({ message, size = "md", className }: LoaderProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4",
				className,
			)}
		>
			<motion.div
				animate={{ rotate: 360 }}
				transition={{
					duration: 1,
					repeat: Number.POSITIVE_INFINITY,
					ease: "linear",
				}}
			>
				<Loader2 className={cn(sizeClasses[size], "text-primary")} />
			</motion.div>
			{message && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="text-sm text-muted-foreground"
				>
					{message}
				</motion.p>
			)}
		</div>
	);
}

export function ConfiguringLoader({ className }: { className?: string }) {
	return (
		<Loader
			message={t("loader.configuringAccount")}
			size="lg"
			className={className}
		/>
	);
}

export function ProcessingLoader({ className }: { className?: string }) {
	return (
		<Loader message={t("loader.processing")} size="md" className={className} />
	);
}
