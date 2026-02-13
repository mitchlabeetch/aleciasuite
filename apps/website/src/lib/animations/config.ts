/**
 * Animation Configuration
 *
 * Named constants for animation timing, easing, and distances.
 * Use these instead of magic numbers in animation definitions.
 *
 * @see CODE_REVIEW.md - Smell #4
 */

// ============================================================================
// Timing Constants
// ============================================================================

/**
 * Animation duration constants (in seconds)
 */
export const ANIMATION_TIMING = {
	/** Quick micro-interactions: 100ms */
	INSTANT: 0.1,
	/** Fast feedback: 150ms */
	FAST: 0.15,
	/** Standard transitions: 300ms */
	NORMAL: 0.3,
	/** Emphasized animations: 500ms */
	SLOW: 0.5,
	/** Page transitions: 750ms */
	PAGE: 0.75,
	/** Dramatic reveals: 1000ms */
	DRAMATIC: 1.0,
} as const;

/**
 * Stagger delay for sequential animations (in seconds)
 */
export const STAGGER = {
	/** Tight stagger for lists: 50ms */
	TIGHT: 0.05,
	/** Normal stagger: 100ms */
	NORMAL: 0.1,
	/** Loose stagger: 150ms */
	LOOSE: 0.15,
} as const;

// ============================================================================
// Easing Constants
// ============================================================================

/**
 * Cubic bezier easing curves
 * Based on Material Design motion principles
 */
export const EASING = {
	/** Standard easing - for most transitions */
	STANDARD: [0.4, 0, 0.2, 1] as const,
	/** Decelerate - for entering elements */
	DECELERATE: [0, 0, 0.2, 1] as const,
	/** Accelerate - for exiting elements */
	ACCELERATE: [0.4, 0, 1, 1] as const,
	/** Sharp - for quick state changes */
	SHARP: [0.4, 0, 0.6, 1] as const,
	/** Bounce - for playful feedback */
	BOUNCE: [0.68, -0.55, 0.265, 1.55] as const,
	/** Linear - for continuous animations */
	LINEAR: [0, 0, 1, 1] as const,
} as const;

/**
 * Spring animation configurations for Framer Motion
 */
export const SPRING = {
	/** Gentle spring - smooth, no overshoot */
	GENTLE: { type: "spring", stiffness: 120, damping: 14 } as const,
	/** Snappy spring - quick response */
	SNAPPY: { type: "spring", stiffness: 250, damping: 20 } as const,
	/** Bouncy spring - visible overshoot */
	BOUNCY: { type: "spring", stiffness: 300, damping: 10 } as const,
	/** Stiff spring - minimal bounce */
	STIFF: { type: "spring", stiffness: 400, damping: 30 } as const,
} as const;

// ============================================================================
// Distance Constants
// ============================================================================

/**
 * Movement distances (in pixels)
 */
export const DISTANCE = {
	/** Subtle movements: 5px */
	SUBTLE: 5,
	/** Small movements: 10px */
	SMALL: 10,
	/** Normal movements: 20px */
	NORMAL: 20,
	/** Large movements: 40px */
	LARGE: 40,
	/** Dramatic movements: 100px */
	DRAMATIC: 100,
	/** Off-screen: 300px */
	OFF_SCREEN: 300,
} as const;

/**
 * Scale values for zoom effects
 */
export const SCALE = {
	/** Subtle shrink: 0.97 */
	SHRINK_SUBTLE: 0.97,
	/** Normal shrink: 0.95 */
	SHRINK: 0.95,
	/** Grow on hover: 1.02 */
	GROW_SUBTLE: 1.02,
	/** Normal grow: 1.05 */
	GROW: 1.05,
	/** Pop effect: 1.1 */
	POP: 1.1,
	/** Start hidden: 0 */
	HIDDEN: 0,
	/** Normal size: 1 */
	NORMAL: 1,
} as const;

// ============================================================================
// Rotation Constants
// ============================================================================

/**
 * Rotation values (in degrees)
 */
export const ROTATION = {
	/** Slight tilt: 2deg */
	TILT: 2,
	/** Small rotation: 5deg */
	SMALL: 5,
	/** Quarter turn: 90deg */
	QUARTER: 90,
	/** Half turn: 180deg */
	HALF: 180,
	/** Full rotation: 360deg */
	FULL: 360,
} as const;

// ============================================================================
// Opacity Constants
// ============================================================================

/**
 * Opacity values
 */
export const OPACITY = {
	/** Fully transparent */
	HIDDEN: 0,
	/** Subtle visibility: 0.1 */
	GHOST: 0.1,
	/** Faded: 0.3 */
	FADED: 0.3,
	/** Semi-transparent: 0.5 */
	SEMI: 0.5,
	/** Slightly muted: 0.7 */
	MUTED: 0.7,
	/** Fully visible */
	VISIBLE: 1,
} as const;

// ============================================================================
// Blur Constants
// ============================================================================

/**
 * Blur values (in pixels)
 */
export const BLUR = {
	/** No blur */
	NONE: 0,
	/** Subtle blur: 2px */
	SUBTLE: 2,
	/** Normal blur: 4px */
	NORMAL: 4,
	/** Strong blur: 8px */
	STRONG: 8,
	/** Heavy blur: 16px */
	HEAVY: 16,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type AnimationTiming =
	(typeof ANIMATION_TIMING)[keyof typeof ANIMATION_TIMING];
export type Easing = (typeof EASING)[keyof typeof EASING];
export type Distance = (typeof DISTANCE)[keyof typeof DISTANCE];
export type Scale = (typeof SCALE)[keyof typeof SCALE];
