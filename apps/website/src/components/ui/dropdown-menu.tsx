"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
	children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
	asChild?: boolean;
	children: React.ReactNode;
}

interface DropdownMenuContentProps {
	align?: "start" | "center" | "end";
	children: React.ReactNode;
	className?: string;
}

interface DropdownMenuItemProps {
	onClick?: () => void;
	className?: string;
	children: React.ReactNode;
}

const DropdownMenuContext = React.createContext<{
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

function DropdownMenu({ children }: DropdownMenuProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<DropdownMenuContext.Provider value={{ open, setOpen }}>
			<div className="relative inline-block">{children}</div>
		</DropdownMenuContext.Provider>
	);
}

function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
	const { open, setOpen } = React.useContext(DropdownMenuContext);

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setOpen(!open);
	};

	if (asChild && React.isValidElement(children)) {
		return React.cloneElement(children as React.ReactElement<any>, {
			onClick: handleClick,
		});
	}

	return (
		<button type="button" onClick={handleClick}>
			{children}
		</button>
	);
}

function DropdownMenuContent({
	align = "end",
	children,
	className,
}: DropdownMenuContentProps) {
	const { open, setOpen } = React.useContext(DropdownMenuContext);
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open, setOpen]);

	if (!open) return null;

	return (
		<div
			ref={ref}
			className={cn(
				"absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
				"animate-in fade-in-0 zoom-in-95",
				align === "end" && "right-0",
				align === "start" && "left-0",
				align === "center" && "left-1/2 -translate-x-1/2",
				className,
			)}
		>
			{children}
		</div>
	);
}

function DropdownMenuItem({
	onClick,
	className,
	children,
}: DropdownMenuItemProps) {
	const { setOpen } = React.useContext(DropdownMenuContext);

	const handleClick = () => {
		onClick?.();
		setOpen(false);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
				"hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
};
