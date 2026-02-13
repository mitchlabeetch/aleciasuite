"use client";

/**
 * Counter - Compteur animé pour valeurs financières
 * Adapté pour Alecia Colab - Format français (500 m€)
 */

import { cn } from "@/lib/utils";
import {
	type MotionValue,
	motion,
	useSpring,
	useTransform,
} from "framer-motion";
import type React from "react";
import { useEffect } from "react";

type PlaceValue = number | ".";

interface NumberProps {
	mv: MotionValue<number>;
	number: number;
	height: number;
}

function AnimatedNumber({ mv, number, height }: NumberProps) {
	const y = useTransform(mv, (latest) => {
		const placeValue = latest % 10;
		const offset = (10 + number - placeValue) % 10;
		let memo = offset * height;
		if (offset > 5) {
			memo -= 10 * height;
		}
		return memo;
	});

	return (
		<motion.span
			className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center"
			style={{ y }}
		>
			{number}
		</motion.span>
	);
}

interface DigitProps {
	place: PlaceValue;
	value: number;
	height: number;
}

function Digit({ place, value, height }: DigitProps) {
	if (place === ".") {
		return (
			<span
				className="relative font-variant-numeric-tabular-nums"
				style={{ height, width: "0.5ch" }}
			>
				,
			</span>
		);
	}

	const valueRoundedToPlace = Math.floor(value / place);
	const animatedValue = useSpring(valueRoundedToPlace, {
		stiffness: 100,
		damping: 20,
	});

	useEffect(() => {
		animatedValue.set(valueRoundedToPlace);
	}, [animatedValue, valueRoundedToPlace]);

	return (
		<span
			className="relative font-variant-numeric-tabular-nums"
			style={{ height, width: "1ch" }}
		>
			{Array.from({ length: 10 }, (_, i) => (
				<AnimatedNumber key={i} mv={animatedValue} number={i} height={height} />
			))}
		</span>
	);
}

interface CounterProps {
	value: number;
	fontSize?: number;
	suffix?: string;
	prefix?: string;
	className?: string;
	textColor?: string;
	fontWeight?: React.CSSProperties["fontWeight"];
}

/**
 * Formatte un nombre en format français (m pour millions)
 * Ex: 500000000 -> "500 m"
 */
function formatValue(value: number): { displayValue: number; suffix: string } {
	if (value >= 1000000000) {
		return { displayValue: value / 1000000000, suffix: " Md" };
	}
	if (value >= 1000000) {
		return { displayValue: value / 1000000, suffix: " m" };
	}
	if (value >= 1000) {
		return { displayValue: value / 1000, suffix: " k" };
	}
	return { displayValue: value, suffix: "" };
}

export default function Counter({
	value,
	fontSize = 48,
	suffix = "€",
	prefix,
	className,
	textColor = "inherit",
	fontWeight = 600,
}: CounterProps) {
	const height = fontSize;
	const { displayValue, suffix: autoSuffix } = formatValue(value);

	// Générer les places pour le nombre formaté
	const valueStr = displayValue.toFixed(displayValue % 1 === 0 ? 0 : 1);
	const places: PlaceValue[] = [...valueStr].map((ch, i, a) => {
		if (ch === ".") return ".";
		const dotIndex = a.indexOf(".");
		const isInteger = dotIndex === -1;
		const exponent = isInteger
			? a.length - i - 1
			: i < dotIndex
				? dotIndex - i - 1
				: -(i - dotIndex);
		return 10 ** exponent;
	});

	return (
		<span className={cn("relative inline-block", className)}>
			<span
				className="flex overflow-hidden leading-none"
				style={{
					fontSize,
					color: textColor,
					fontWeight,
					gap: 2,
					borderRadius: 4,
				}}
			>
				{prefix && <span>{prefix}</span>}
				{places.map((place, index) => (
					<Digit
						key={`${place}-${index}`}
						place={place}
						value={displayValue}
						height={height}
					/>
				))}
				<span className="ml-1">
					{autoSuffix}
					{suffix}
				</span>
			</span>
		</span>
	);
}

/**
 * Composant simplifié pour les montants M&A
 * Format: "500 m€" (espace avant m€)
 */
export function MoneyCounter({
	value,
	className,
	size = "lg",
}: {
	value: number;
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const sizeConfig = {
		sm: { fontSize: 24, fontWeight: 500 },
		md: { fontSize: 36, fontWeight: 600 },
		lg: { fontSize: 48, fontWeight: 700 },
	};

	const config = sizeConfig[size];

	return (
		<Counter
			value={value}
			fontSize={config.fontSize}
			fontWeight={config.fontWeight}
			suffix="€"
			className={className}
		/>
	);
}
