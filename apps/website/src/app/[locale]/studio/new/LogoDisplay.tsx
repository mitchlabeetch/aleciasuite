interface LogoDisplayProps {
	logo?: string;
	placeholder: string;
	containerSize: number;
	padding: number;
	placeholderSize: number;
}

export function LogoDisplay({
	logo,
	placeholder,
	containerSize,
	_padding,
	_placeholderSize,
}: LogoDisplayProps) {
	return (
		<div
			style={{
				width: `${containerSize}px`,
				height: `${containerSize}px`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: `${padding}px`,
			}}
		>
			{logo ? (
				<img
					src={logo}
					alt={`Company ${placeholder}`}
					crossOrigin="anonymous"
					style={{
						maxWidth: "100%",
						maxHeight: "100%",
						objectFit: "contain",
					}}
				/>
			) : (
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						opacity: 0.3,
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="80"
						height="80"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 12h.01" />
						<path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
						<path d="M22 13a18.15 18.15 0 0 1-20 0" />
						<rect width="20" height="14" x="2" y="6" rx="2" />
					</svg>
				</div>
			)}
		</div>
	);
}
