"use client";

import { Progress } from "@/components/ui/progress";

interface WizardProgressProps {
	currentStep: number;
	totalSteps: number;
	title: string;
}

export function WizardProgress({
	currentStep,
	totalSteps,
	title,
}: WizardProgressProps) {
	const progress = (currentStep / totalSteps) * 100;

	return (
		<div className="mb-8">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-[var(--foreground)]">
					{title}
				</h2>
				<span className="text-sm text-muted-foreground">
					Étape {currentStep} / {totalSteps}
				</span>
			</div>
			<Progress value={progress} className="h-2" />
		</div>
	);
}
