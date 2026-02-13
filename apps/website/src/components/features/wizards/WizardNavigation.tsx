"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";

interface WizardNavigationProps {
	currentStep: number;
	totalSteps: number;
	canProceed: boolean;
	isSubmitting?: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSubmit: () => void;
	submitLabel?: string;
	nextLabel?: string;
	previousLabel?: string;
}

import { useTranslations } from "next-intl";

export function WizardNavigation({
	currentStep,
	totalSteps,
	canProceed,
	isSubmitting = false,
	onPrevious,
	onNext,
	onSubmit,
	submitLabel,
	nextLabel,
	previousLabel,
}: WizardNavigationProps) {
	const t = useTranslations("Wizards.common");
	const isLastStep = currentStep === totalSteps;

	return (
		<div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
			<Button
				variant="outline"
				onClick={onPrevious}
				disabled={currentStep === 1 || isSubmitting}
				className="border-[var(--border)]"
				type="button"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				{previousLabel || t("previous")}
			</Button>

			{!isLastStep ? (
				<Button
					onClick={onNext}
					disabled={!canProceed}
					className="bg-[var(--alecia-navy)] text-white hover:bg-[var(--alecia-midnight)]"
					type="button"
				>
					{nextLabel || t("next")}
					<ArrowRight className="w-4 h-4 ml-2" />
				</Button>
			) : (
				<Button
					onClick={onSubmit}
					disabled={!canProceed || isSubmitting}
					className="bg-[var(--alecia-navy)] text-white hover:bg-[var(--alecia-midnight)]"
					type="button"
				>
					{isSubmitting ? "Envoi..." : submitLabel || t("submit")}
					{!isSubmitting && <Send className="w-4 h-4 ml-2" />}
				</Button>
			)}
		</div>
	);
}
