"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface WizardStepProps {
	children: ReactNode;
	isActive: boolean;
}

export function WizardStep({ children, isActive }: WizardStepProps) {
	if (!isActive) return null;

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className="w-full"
		>
			{children}
		</motion.div>
	);
}
