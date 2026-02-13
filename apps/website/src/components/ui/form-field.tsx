import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FormField - Consistent form field wrapper
 *
 * Provides standardized label, required indicator, and error handling.
 *
 * @see Batch 10: UI/UX Refinement - Task 10.4
 */

interface FormFieldProps {
	label: string;
	required?: boolean;
	error?: string;
	hint?: string;
	htmlFor?: string;
	className?: string;
	children: React.ReactNode;
}

export function FormField({
	label,
	required,
	error,
	hint,
	htmlFor,
	className,
	children,
}: FormFieldProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
				{label}
				{required && <span className="text-destructive ml-1">*</span>}
			</label>
			{children}
			{hint && !error && (
				<p className="text-xs text-muted-foreground">{hint}</p>
			)}
			{error && (
				<p className="text-sm text-destructive flex items-center gap-1">
					<svg
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					{error}
				</p>
			)}
		</div>
	);
}

/**
 * Input wrapper with error state styling
 */
interface InputWrapperProps {
	hasError?: boolean;
	children: React.ReactNode;
}

export function InputWrapper({ hasError, children }: InputWrapperProps) {
	return (
		<div
			className={cn(
				"relative",
				hasError &&
					"[&_input]:border-destructive [&_input]:focus:ring-destructive/20",
			)}
		>
			{children}
		</div>
	);
}
