"use client";

import { MotionValue, motion, useSpring, useTransform } from "framer-motion";
import type React from "react";
import { useEffect } from "react";

import "./Counter.css";

type PlaceValue = number | ".";

interface NumberProps {
	mv: MotionValue<number>;
	number: number;
	height: number;
}

function Number({ mv, number, height }: NumberProps) {
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
		<motion.span className="counter-number" style={{ y }}>
			{number}
		</motion.span>
	);
}

interface DigitProps {
	place: PlaceValue;
	value: number;
	height: number;
	digitStyle?: React.CSSProperties;
	springConfig?: { stiffness?: number; damping?: number; mass?: number };
}

function Digit({ place, value, height, digitStyle, springConfig }: DigitProps) {
	if (place === ".") {
		return (
			<span
				className="counter-digit"
				style={{ height, ...digitStyle, width: "fit-content" }}
			>
				.
			</span>
		);
	}

	const valueRoundedToPlace = Math.floor(value / place);
	const animatedValue = useSpring(valueRoundedToPlace, springConfig);

	useEffect(() => {
		animatedValue.set(valueRoundedToPlace);
	}, [animatedValue, valueRoundedToPlace]);

	return (
		<span className="counter-digit" style={{ height, ...digitStyle }}>
			{Array.from({ length: 10 }, (_, i) => (
				<Number key={i} mv={animatedValue} number={i} height={height} />
			))}
		</span>
	);
}

interface CounterProps {
	value: number;
	fontSize?: number;
	padding?: number;
	places?: PlaceValue[];
	gap?: number;
	borderRadius?: number;
	horizontalPadding?: number;
	textColor?: string;
	fontWeight?: React.CSSProperties["fontWeight"];
	containerStyle?: React.CSSProperties;
	counterStyle?: React.CSSProperties;
	digitStyle?: React.CSSProperties;
	gradientHeight?: number;
	gradientFrom?: string;
	gradientTo?: string;
	topGradientStyle?: React.CSSProperties;
	bottomGradientStyle?: React.CSSProperties;
	springConfig?: { stiffness?: number; damping?: number; mass?: number };
}

export default function Counter({
	value,
	fontSize = 100,
	padding = 0,
	places: propPlaces,
	gap = 8,
	borderRadius = 4,
	horizontalPadding = 8,
	textColor = "inherit",
	fontWeight = "inherit",
	containerStyle,
	counterStyle,
	digitStyle,
	gradientHeight = 16,
	gradientFrom: propGradientFrom,
	gradientTo = "transparent",
	topGradientStyle,
	bottomGradientStyle,
	springConfig = { stiffness: 100, damping: 20 },
}: CounterProps) {
	const height = fontSize + padding;

	// Reactively calculate places if not provided as a prop
	const places =
		propPlaces ??
		[...value.toString()].map((ch, i, a) => {
			if (ch === ".") {
				return ".";
			}
			const dotIndex = a.indexOf(".");
			const isInteger = dotIndex === -1;
			const exponent = isInteger
				? a.length - i - 1
				: i < dotIndex
					? dotIndex - i - 1
					: -(i - dotIndex);
			return 10 ** exponent;
		});

	const gradientFrom = propGradientFrom ?? "transparent";

	const defaultCounterStyle: React.CSSProperties = {
		fontSize,
		gap,
		borderRadius,
		paddingLeft: horizontalPadding,
		paddingRight: horizontalPadding,
		color: textColor,
		fontWeight,
	};

	const defaultTopGradientStyle: React.CSSProperties = {
		height: gradientHeight,
		background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
	};

	const defaultBottomGradientStyle: React.CSSProperties = {
		height: gradientHeight,
		background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
	};

	return (
		<span className="counter-container" style={containerStyle}>
			<span
				className="counter-counter"
				style={{ ...defaultCounterStyle, ...counterStyle }}
			>
				{places.map((place, i) => (
					<Digit
						key={place + "-" + i}
						place={place}
						value={value}
						height={height}
						digitStyle={digitStyle}
						springConfig={springConfig}
					/>
				))}
			</span>
			{propGradientFrom && (
				<span className="gradient-container">
					<span
						className="top-gradient"
						style={topGradientStyle ?? defaultTopGradientStyle}
					/>
					<span
						className="bottom-gradient"
						style={bottomGradientStyle ?? defaultBottomGradientStyle}
					/>
				</span>
			)}
		</span>
	);
}
