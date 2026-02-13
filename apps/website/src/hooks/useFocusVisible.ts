/**
 * useFocusVisible Hook
 *
 * WCAG 2.1 AA Compliance: 2.4.7 Focus Visible
 * Distinguishes between keyboard and mouse focus
 * Allows styling focus indicators only for keyboard navigation
 *
 * Usage:
 * const { isFocusVisible, focusProps } = useFocusVisible();
 * <button {...focusProps} className={isFocusVisible ? 'focus-ring' : ''}>
 */

"use client";

import { useState, useRef, useCallback } from "react";

interface FocusVisibleResult {
	isFocusVisible: boolean;
	focusProps: {
		onFocus: () => void;
		onBlur: () => void;
		onMouseDown: () => void;
		onKeyDown: (e: React.KeyboardEvent) => void;
	};
}

export function useFocusVisible(): FocusVisibleResult {
	const [isFocusVisible, setIsFocusVisible] = useState(false);
	const hadKeyboardEvent = useRef(false);

	const onFocus = useCallback(() => {
		if (hadKeyboardEvent.current) {
			setIsFocusVisible(true);
		}
	}, []);

	const onBlur = useCallback(() => {
		setIsFocusVisible(false);
		hadKeyboardEvent.current = false;
	}, []);

	const onMouseDown = useCallback(() => {
		hadKeyboardEvent.current = false;
		setIsFocusVisible(false);
	}, []);

	const onKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Tab") {
			hadKeyboardEvent.current = true;
		}
	}, []);

	return {
		isFocusVisible,
		focusProps: {
			onFocus,
			onBlur,
			onMouseDown,
			onKeyDown,
		},
	};
}
