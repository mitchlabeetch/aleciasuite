"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex w-full touch-none select-none items-center py-2 cursor-pointer",
			className,
		)}
		{...props}
	>
		{/* Invisible expanded hitbox for easier clicking */}
		<div className="absolute inset-x-0 -inset-y-2 z-0" />

		<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary transition-all duration-200 hover:h-2.5">
			<SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[var(--alecia-navy)] to-[var(--alecia-blue-corporate)] transition-all duration-300" />
		</SliderPrimitive.Track>

		<SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--alecia-navy)] bg-white shadow-lg ring-offset-background transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alecia-navy)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95" />

		{/* Support for second thumb for range sliders */}
		{props.defaultValue && (props.defaultValue as number[]).length > 1 && (
			<SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--alecia-navy)] bg-white shadow-lg ring-offset-background transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alecia-navy)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95" />
		)}
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
