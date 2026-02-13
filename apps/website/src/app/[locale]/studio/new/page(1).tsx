/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { Download, Building2, Lock, HelpCircle, RotateCcw } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AccordionItem, Accordion } from "@/components/ui/Accordion";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@/components/ui/tooltip";
import { getHDLogoUrl } from "@/lib/hd-logos";
import { listTransactions } from "@/actions";

// Transaction type from PostgreSQL
interface Transaction {
	_id: string;
	slug: string;
	clientName: string;
	clientLogo?: string;
	acquirerName?: string;
	acquirerLogo?: string;
	sector: string;
	region?: string;
	year: number;
	mandateType: string;
	description?: string;
	isConfidential: boolean;
	isClientConfidential?: boolean;
	isAcquirerConfidential?: boolean;
	isPriorExperience: boolean;
}

// Theme presets with French names
const THEME_PRESETS = [
	{
		id: "deep-corporate",
		name: "Deep Corporate",
		left: "#001F5B",
		center: "#1E3A8A",
		right: "#0F172A",
		textColor: "#FFFFFF",
	},
	{
		id: "midnight",
		name: "Midnight",
		left: "#000000",
		center: "#0F0F0F",
		right: "#1A1A1A",
		textColor: "#FFFFFF",
	},
	{
		id: "forest",
		name: "Forest",
		left: "#064E3B",
		center: "#065F46",
		right: "#022C22",
		textColor: "#FFFFFF",
	},
	{
		id: "bordeaux",
		name: "Bordeaux",
		left: "#4C0519",
		center: "#7F1D1D",
		right: "#2D0606",
		textColor: "#FFFFFF",
	},
	{
		id: "subtle-sand",
		name: "Subtle Sand",
		left: "#F5F5F4",
		center: "#E7E5E4",
		right: "#E7E5E4",
		textColor: "#1F2937",
	},
	{
		id: "iridescent",
		name: "Iridescent",
		left: "#667eea",
		center: "#f093fb",
		right: "#4facfe",
		textColor: "#FFFFFF",
	},
	{
		id: "ocean-depth",
		name: "Ocean Depth",
		left: "#0F2027",
		center: "#203A43",
		right: "#2C5364",
		textColor: "#FFFFFF",
	},
	{
		id: "sunset-glow",
		name: "Sunset Glow",
		left: "#FF512F",
		center: "#DD2476",
		right: "#8E2DE2",
		textColor: "#FFFFFF",
	},
	{
		id: "emerald",
		name: "Emerald",
		left: "#134E4A",
		center: "#047857",
		right: "#065F46",
		textColor: "#FFFFFF",
	},
	{
		id: "royal-purple",
		name: "Royal Purple",
		left: "#4C1D95",
		center: "#6D28D9",
		right: "#5B21B6",
		textColor: "#FFFFFF",
	},
	{
		id: "charcoal",
		name: "Charcoal",
		left: "#1F2937",
		center: "#374151",
		right: "#4B5563",
		textColor: "#FFFFFF",
	},
	{
		id: "copper",
		name: "Copper",
		left: "#7C2D12",
		center: "#C2410C",
		right: "#9A3412",
		textColor: "#FFFFFF",
	},
	{
		id: "arctic",
		name: "Arctic",
		left: "#E0F2FE",
		center: "#BAE6FD",
		right: "#7DD3FC",
		textColor: "#0C4A6E",
	},
	{
		id: "crimson",
		name: "Crimson",
		left: "#7F1D1D",
		center: "#991B1B",
		right: "#450A0A",
		textColor: "#FFFFFF",
	},
	{
		id: "golden-hour",
		name: "Golden Hour",
		left: "#F59E0B",
		center: "#FCD34D",
		right: "#D97706",
		textColor: "#78350F",
	},
];

const TYPOGRAPHY_OPTIONS = [
	{ id: "bierstadt", name: "Bierstadt", fontFamily: "Bierstadt, sans-serif" },
	{ id: "inter", name: "Inter", fontFamily: "Inter, sans-serif" },
	{
		id: "playfair",
		name: "Playfair Display",
		fontFamily: "Playfair Display, serif",
	},
	{
		id: "montserrat",
		name: "Montserrat",
		fontFamily: "Montserrat, sans-serif",
	},
	{ id: "sora", name: "Sora", fontFamily: "Sora, sans-serif" },
	{ id: "work-sans", name: "Work Sans", fontFamily: "Work Sans, sans-serif" },
];

type FormatType = "square" | "landscape";

// Design tokens
const DESIGN_TOKENS = {
	preview: {
		square: { width: 1200, height: 1200, displayWidth: 600 },
		landscape: { width: 1200, height: 800, displayWidth: 700 },
	},
	logo: {
		container: 700, // Increased for larger company logos
		aleciaHeight: 80, // Reduced by 33% from 120
		padding: 80, // Increased padding
	},
	typography: {
		dealType: 48,
		year: 36,
		ampersand: 90, // Reduced by 50% from 180
		bottomMessage: 32,
		placeholder: 96,
	},
	spacing: {
		top: 80,
		bottom: 80,
		logoGap: 40, // Increased gap between logos
		contentGap: 16,
	},
} as const;

// Noise texture SVG (extracted as constant)
const NOISE_TEXTURE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;

// Background pattern SVG definitions
const PATTERN_SVGS = {
	dots: (color: string) => `
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
					<circle cx="2" cy="2" r="1" fill="${color}" opacity="0.1"/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#dots)"/>
		</svg>
	`,
	grid: (color: string) => `
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.1"/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)"/>
		</svg>
	`,
	"diagonal-lines": (color: string) => `
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="diagonal-lines" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="30" stroke="${color}" stroke-width="1" opacity="0.08"/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#diagonal-lines)"/>
		</svg>
	`,
};

// Helper to check if a name indicates confidential
const isConfidentialName = (name?: string): boolean => {
	if (!name) return false;
	const normalized = name.toLowerCase().trim();
	return (
		normalized.includes("confidentiel") ||
		normalized.includes("confidential") ||
		normalized === "confidentiel" ||
		normalized === "confidential"
	);
};

// Convert 0-100 percentage to 2-digit hex opacity (00-FF)
const percentToHex = (percent: number): string => {
	const value = Math.round(Math.max(0, Math.min(100, percent)) * 2.55);
	return value.toString(16).padStart(2, '0');
};

// Calculate luminance of a color to determine if it's light or dark
const getLuminance = (hexColor: string): number => {
	// Remove # if present
	const hex = hexColor.replace("#", "");
	const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
	const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
	const b = Number.parseInt(hex.substring(4, 6), 16) / 255;
	
	// Apply gamma correction
	const [rs, gs, bs] = [r, g, b].map((c) =>
		c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
	);
	
	// Calculate relative luminance
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Constants for text contrast
const LUMINANCE_THRESHOLD = 0.5;
const DARK_TEXT_COLOR = "#1F2937";
const LIGHT_TEXT_COLOR = "#FFFFFF";

/**
 * Determine if text should be light or dark based on background colors
 * @param leftColor - Left gradient color in hex format
 * @param rightColor - Right gradient color in hex format
 * @param centerColor - Center gradient color in hex format
 * @returns Text color (light or dark) for optimal contrast
 */
const getContrastTextColor = (leftColor: string, rightColor: string, centerColor: string): string => {
	// Calculate average luminance of the three colors
	const avgLuminance = (getLuminance(leftColor) + getLuminance(rightColor) + getLuminance(centerColor)) / 3;
	// If background is dark (luminance < threshold), use white text; otherwise use dark text
	return avgLuminance < LUMINANCE_THRESHOLD ? LIGHT_TEXT_COLOR : DARK_TEXT_COLOR;
};

export default function LogoGenPage() {
	// Data fetching
	const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);

	useEffect(() => {
		listTransactions().then((data) => {
			const mapped = data.map(({ id, ...rest }) => ({ _id: id, ...rest }));
			setTransactions(mapped as unknown as Transaction[]);
		});
	}, []);

	// State management
	const [selectedDealId, setSelectedDealId] = useState<string>("");
	const [format, setFormat] = useState<FormatType>("square");
	const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
	const [leftColor, setLeftColor] = useState(THEME_PRESETS[0].left);
	const [rightColor, setRightColor] = useState(THEME_PRESETS[0].right);
	const [centerColor, setCenterColor] = useState(THEME_PRESETS[0].center);
	const [gradientAngle, setGradientAngle] = useState(135);
	const [typography, setTypography] = useState(TYPOGRAPHY_OPTIONS[0]);
	const [dealTypeOverride, setDealTypeOverride] = useState("");
	const [yearOverride, setYearOverride] = useState("");
	const [showYear, setShowYear] = useState(true);
	const [showDealType, setShowDealType] = useState(true);
	const [bottomIcon, setBottomIcon] = useState("none");
	const [bottomText, setBottomText] = useState("");
	const [isExportingHD, setIsExportingHD] = useState(false);
	const [isExportingNormal, setIsExportingNormal] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);
	
	// New state for enhanced features
	const [logoEffect, setLogoEffect] = useState<'none' | 'glow' | 'strong-glow' | 'frame'>('none');
	const [dealTypeOpacity, setDealTypeOpacity] = useState(100);
	const [yearOpacity, setYearOpacity] = useState(85);
	const [taglineOpacity, setTaglineOpacity] = useState(50);
	const [ampersandOpacity, setAmpersandOpacity] = useState(22);
	const [bottomMessageOpacity, setBottomMessageOpacity] = useState(90);
	const [backgroundPattern, setBackgroundPattern] = useState<'none' | 'dots' | 'grid' | 'diagonal-lines'>('none');
	const [noiseIntensity, setNoiseIntensity] = useState(0.03);
	const [vignetteIntensity, setVignetteIntensity] = useState(50);
	const [lineWidth, setLineWidth] = useState(80);
	const [autoContrast, setAutoContrast] = useState(false);
	const [badgePosition, setBadgePosition] = useState<'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('none');
	const [badgeText, setBadgeText] = useState('');
	const [badgeStyle, setBadgeStyle] = useState<'solid' | 'outline' | 'gradient'>('solid');
	const [badgeColor, setBadgeColor] = useState('#667eea');
	
	// UI state for collapsible sections
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({
		basic: true,
		colors: false,
		typography: false,
		effects: false,
		decorative: false,
		export: false,
	});

	const previewRef = useRef<HTMLDivElement>(null);

	// Loading state
	const isLoading = transactions === undefined;

	// Memoized selected transaction
	const selectedTransaction = useMemo(
		() =>
			(transactions as Transaction[] | undefined)?.find(
				(transaction) => transaction._id === selectedDealId,
			),
		[transactions, selectedDealId],
	);

	// Memoized derived values
	const displayDealType = useMemo(
		() =>
			dealTypeOverride || selectedTransaction?.mandateType || "Type de deal",
		[dealTypeOverride, selectedTransaction?.mandateType],
	);

	const displayYear = useMemo(
		() => yearOverride || selectedTransaction?.year?.toString() || "2024",
		[yearOverride, selectedTransaction?.year],
	);

	// Determine logo variant based on theme (white for dark themes, blue for light themes)
	const logoVariant = useMemo(
		() => (selectedTheme.id === "subtle-sand" ? "blue" : "white"),
		[selectedTheme.id],
	);

	const clientLogo = useMemo(() => {
		// First try to get HD logo from curated collection
		if (selectedTransaction?.clientName) {
			const hdLogo = getHDLogoUrl(selectedTransaction.clientName, logoVariant);
			if (hdLogo) return hdLogo;
		}
		// Fallback to transaction's logo URL
		const logo = selectedTransaction?.clientLogo || "";
		if (logo && logo.startsWith("http")) {
			return logo;
		}
		return "";
	}, [
		selectedTransaction?.clientName,
		selectedTransaction?.clientLogo,
		logoVariant,
	]);

	const acquirerLogo = useMemo(() => {
		// First try to get HD logo from curated collection
		if (selectedTransaction?.acquirerName) {
			const hdLogo = getHDLogoUrl(
				selectedTransaction.acquirerName,
				logoVariant,
			);
			if (hdLogo) return hdLogo;
		}
		// Fallback to transaction's logo URL
		const logo = selectedTransaction?.acquirerLogo || "";
		if (logo && logo.startsWith("http")) {
			return logo;
		}
		return "";
	}, [
		selectedTransaction?.acquirerName,
		selectedTransaction?.acquirerLogo,
		logoVariant,
	]);

	// Format dimensions (memoized)
	const dimensions = useMemo(() => DESIGN_TOKENS.preview[format], [format]);

	// Memoized background gradient with 3 colors and custom angle
	const backgroundGradient = useMemo(
		() => `
      radial-gradient(circle at 20% 50%, ${leftColor}22 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, ${rightColor}22 0%, transparent 50%),
      linear-gradient(${gradientAngle}deg, ${leftColor} 0%, ${centerColor} 50%, ${rightColor} 100%)
    `,
		[leftColor, centerColor, rightColor, gradientAngle],
	);

	// Handle theme change (useCallback)
	const handleThemeChange = useCallback((themeId: string) => {
		const theme = THEME_PRESETS.find((preset) => preset.id === themeId);
		if (theme) {
			setSelectedTheme(theme);
			setLeftColor(theme.left);
			setRightColor(theme.right);
			setCenterColor(theme.center);
		}
	}, []);
	
	// Reset all settings to defaults
	const handleReset = useCallback(() => {
		const defaultTheme = THEME_PRESETS[0];
		setSelectedTheme(defaultTheme);
		setLeftColor(defaultTheme.left);
		setRightColor(defaultTheme.right);
		setCenterColor(defaultTheme.center);
		setGradientAngle(135);
		setTypography(TYPOGRAPHY_OPTIONS[0]);
		setDealTypeOverride("");
		setYearOverride("");
		setShowYear(true);
		setShowDealType(true);
		setBottomIcon("none");
		setBottomText("");
		setLogoEffect('none');
		setDealTypeOpacity(100);
		setYearOpacity(85);
		setTaglineOpacity(50);
		setAmpersandOpacity(22);
		setBottomMessageOpacity(90);
		setBackgroundPattern('none');
		setNoiseIntensity(0.03);
		setVignetteIntensity(50);
		setLineWidth(80);
		setAutoContrast(false);
		setBadgePosition('none');
		setBadgeText('');
		setBadgeStyle('solid');
		setBadgeColor('#667eea');
	}, []);
	
	// Logo effect styles
	const logoEffectStyles = useMemo(() => {
		switch (logoEffect) {
			case 'glow':
				return { 
					imgFilter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 20px currentColor)",
					containerStyle: {}
				};
			case 'strong-glow':
				return { 
					imgFilter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 40px currentColor) drop-shadow(0 0 60px currentColor)",
					containerStyle: {}
				};
			case 'frame':
				return { 
					imgFilter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
					containerStyle: { 
						border: "2px solid rgba(255,255,255,0.2)", 
						padding: "12px", 
						borderRadius: "8px" 
					}
				};
			default:
				return { 
					imgFilter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
					containerStyle: {}
				};
		}
	}, [logoEffect]);
	
	// Computed text color based on auto contrast
	const computedTextColor = useMemo(() => {
		if (autoContrast) {
			return getContrastTextColor(leftColor, rightColor, centerColor);
		}
		return selectedTheme.textColor;
	}, [autoContrast, leftColor, rightColor, centerColor, selectedTheme.textColor]);
	
	// Pattern SVG data URL
	const patternDataUrl = useMemo(() => {
		if (backgroundPattern === 'none') return null;
		const svg = PATTERN_SVGS[backgroundPattern](computedTextColor);
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}, [backgroundPattern, computedTextColor]);
	
	// Toggle section
	const toggleSection = useCallback((section: string) => {
		setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
	}, []);

	// Handle export HD with 3x pixel ratio
	const handleExportHD = useCallback(async () => {
		if (!previewRef.current) return;

		setIsExportingHD(true);
		setExportError(null);

		try {
			const dataUrl = await toPng(previewRef.current, {
				cacheBust: true,
				pixelRatio: 3,
				width: dimensions.width,
				height: dimensions.height,
				includeQueryParams: true,
				skipFonts: true,
				style: {
					transform: "scale(1)",
					transformOrigin: "top left",
				},
				filter: (node) => {
					// Skip images with invalid or empty src
					if (node instanceof HTMLImageElement) {
						const src = node.getAttribute("src");
						if (
							!src ||
							src === "" ||
							(!src.startsWith("http") && !src.startsWith("/"))
						) {
							return false;
						}
					}
					return true;
				},
			});

			const link = document.createElement("a");
			link.download = `alecia-deal-${selectedTransaction?.slug || "asset"}-HD-${Date.now()}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error("Export failed:", error);
			setExportError("Échec de l'export. Veuillez réessayer.");
		} finally {
			setIsExportingHD(false);
		}
	}, [dimensions, selectedTransaction?.slug]);

	// Handle export with no upscale
	const handleExport = useCallback(async () => {
		if (!previewRef.current) return;

		setIsExportingNormal(true);
		setExportError(null);

		try {
			const dataUrl = await toPng(previewRef.current, {
				cacheBust: true,
				pixelRatio: 1,
				width: dimensions.width,
				height: dimensions.height,
				includeQueryParams: true,
				skipFonts: true,
				style: {
					transform: "scale(1)",
					transformOrigin: "top left",
				},
				filter: (node) => {
					// Skip images with invalid or empty src
					if (node instanceof HTMLImageElement) {
						const src = node.getAttribute("src");
						if (
							!src ||
							src === "" ||
							(!src.startsWith("http") && !src.startsWith("/"))
						) {
							return false;
						}
					}
					return true;
				},
			});

			const link = document.createElement("a");
			link.download = `alecia-deal-${selectedTransaction?.slug || "asset"}-${Date.now()}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error("Export failed:", error);
			setExportError("Échec de l'export. Veuillez réessayer.");
		} finally {
			setIsExportingNormal(false);
		}
	}, [dimensions, selectedTransaction?.slug]);

	// Get bottom icon component (memoized)
	const BottomIconComponent = useMemo(() => {
		if (!bottomIcon || bottomIcon === "none") return null;
		const icons = LucideIcons as unknown as Record<
			string,
			React.ComponentType<{ className?: string }>
		>;
		return icons[bottomIcon] || null;
	}, [bottomIcon]);

	// Check if client is confidential (use new field if available, else fall back to legacy)
	const isClientConfidential = useMemo(
		() =>
			selectedTransaction?.isClientConfidential ??
			selectedTransaction?.isConfidential ??
			isConfidentialName(selectedTransaction?.clientName),
		[selectedTransaction?.isClientConfidential, selectedTransaction?.isConfidential, selectedTransaction?.clientName],
	);

	// Check if acquirer is confidential (use new field if available, else fall back to legacy)
	const isAcquirerConfidential = useMemo(
		() =>
			selectedTransaction?.isAcquirerConfidential ??
			selectedTransaction?.isConfidential ??
			isConfidentialName(selectedTransaction?.acquirerName),
		[selectedTransaction?.isAcquirerConfidential, selectedTransaction?.isConfidential, selectedTransaction?.acquirerName],
	);

	return (
		<div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
			<div className="container mx-auto px-4 sm:px-6 pt-24 pb-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
					{/* Left: Customization Panel */}
					<div className="lg:col-span-1 space-y-4">
						<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
							<h2 className="text-xl font-semibold mb-4 text-gray-900">
								Paramètres
							</h2>

							<TooltipProvider>
								<Accordion className="space-y-2">
									{/* Basic Settings */}
									<AccordionItem
										title="Paramètres de base"
										isOpen={openSections.basic}
										onToggle={() => toggleSection('basic')}
									>
										{/* Deal Selection */}
										<div className="space-y-2 mb-4">
											<Label htmlFor="deal-select" className="text-gray-700">
												Sélectionner un deal
											</Label>
											{isLoading ? (
												<div className="h-10 bg-gray-100 border border-gray-300 rounded-md animate-pulse" />
											) : (
												<Select
													value={selectedDealId}
													onValueChange={setSelectedDealId}
													disabled={isLoading}
												>
													<SelectTrigger
														id="deal-select"
														className="bg-white border-gray-300"
													>
														<SelectValue placeholder="Choisir une opération..." />
													</SelectTrigger>
													<SelectContent className="bg-white border-gray-300 max-h-60 overflow-y-auto">
														{(transactions as Transaction[] | undefined)?.map(
															(transaction) => (
																<SelectItem
																	key={transaction._id}
																	value={transaction._id}
																	className="text-gray-900"
																>
																	{transaction.clientName} - {transaction.year}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											)}
										</div>

										{/* Format */}
										<div className="space-y-2 mb-4">
											<Label className="text-gray-700">Format</Label>
											<div className="flex flex-wrap gap-2">
												<Button
													variant={format === "square" ? "default" : "outline"}
													onClick={() => setFormat("square")}
													className={`flex-1 min-w-[140px] ${format === "square" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-900"}`}
												>
													Carré (1200x1200)
												</Button>
												<Button
													variant={format === "landscape" ? "default" : "outline"}
													onClick={() => setFormat("landscape")}
													className={`flex-1 min-w-[140px] ${format === "landscape" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-900"}`}
												>
													Paysage (1200x800)
												</Button>
											</div>
										</div>

										{/* Theme Selector */}
										<div className="space-y-2">
											<Label htmlFor="theme-select" className="text-gray-700">
												Thème
											</Label>
											<Select
												value={selectedTheme.id}
												onValueChange={handleThemeChange}
											>
												<SelectTrigger
													id="theme-select"
													className="bg-white border-gray-300"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300">
													{THEME_PRESETS.map((theme) => (
														<SelectItem
															key={theme.id}
															value={theme.id}
															className="text-gray-900"
														>
															{theme.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</AccordionItem>

									{/* Colors & Gradients */}
									<AccordionItem
										title="Couleurs & Dégradés"
										isOpen={openSections.colors}
										onToggle={() => toggleSection('colors')}
									>
										{/* Color Pickers */}
										<div className="space-y-4 mb-4">
											<div className="space-y-2">
												<Label htmlFor="left-color" className="text-gray-700">
													Couleur gauche
												</Label>
												<Input
													id="left-color"
													type="color"
													value={leftColor}
													onChange={(e) => setLeftColor(e.target.value)}
													className="h-12 cursor-pointer bg-white border-gray-300"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="center-color" className="text-gray-700">
													Couleur centrale
												</Label>
												<Input
													id="center-color"
													type="color"
													value={centerColor}
													onChange={(e) => setCenterColor(e.target.value)}
													className="h-12 cursor-pointer bg-white border-gray-300"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="right-color" className="text-gray-700">
													Couleur droite
												</Label>
												<Input
													id="right-color"
													type="color"
													value={rightColor}
													onChange={(e) => setRightColor(e.target.value)}
													className="h-12 cursor-pointer bg-white border-gray-300"
												/>
											</div>
										</div>

										{/* Gradient Angle */}
										<div className="space-y-2 mb-4">
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center justify-between">
														<Label className="text-gray-700 flex items-center gap-1 cursor-help">
															Angle du dégradé
															<HelpCircle className="h-3 w-3" />
														</Label>
														<span className="text-sm text-gray-600">{gradientAngle}°</span>
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>Angle de rotation du dégradé (0-360°)</p>
												</TooltipContent>
											</Tooltip>
											<Slider
												value={[gradientAngle]}
												onValueChange={(v) => setGradientAngle(v[0])}
												min={0}
												max={360}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Auto Contrast */}
										<div className="space-y-2">
											<Tooltip>
												<TooltipTrigger asChild>
													<label className="flex items-center gap-2 cursor-pointer">
														<input
															type="checkbox"
															checked={autoContrast}
															onChange={(e) => setAutoContrast(e.target.checked)}
															className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
														/>
														<span className="text-sm text-gray-700 flex items-center gap-1">
															Contraste automatique
															<HelpCircle className="h-3 w-3" />
														</span>
													</label>
												</TooltipTrigger>
												<TooltipContent>
													<p>Ajuste automatiquement la couleur du texte pour un meilleur contraste</p>
												</TooltipContent>
											</Tooltip>
										</div>
									</AccordionItem>

									{/* Typography & Opacity */}
									<AccordionItem
										title="Typographie & Opacité"
										isOpen={openSections.typography}
										onToggle={() => toggleSection('typography')}
									>
										{/* Typography */}
										<div className="space-y-2 mb-4">
											<Label htmlFor="typography-select" className="text-gray-700">
												Typographie
											</Label>
											<Select
												value={typography.id}
												onValueChange={(id) => {
													const font = TYPOGRAPHY_OPTIONS.find((f) => f.id === id);
													if (font) setTypography(font);
												}}
											>
												<SelectTrigger
													id="typography-select"
													className="bg-white border-gray-300"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300">
													{TYPOGRAPHY_OPTIONS.map((font) => (
														<SelectItem
															key={font.id}
															value={font.id}
															className="text-gray-900"
														>
															{font.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										{/* Deal Type Override */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label htmlFor="deal-type" className="text-gray-700">
													Type de deal (optionnel)
												</Label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={showDealType}
														onChange={(e) => setShowDealType(e.target.checked)}
														className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
													/>
													<span className="text-sm text-gray-600">Afficher</span>
												</label>
											</div>
											<Input
												id="deal-type"
												value={dealTypeOverride}
												onChange={(e) => setDealTypeOverride(e.target.value)}
												placeholder={
													selectedTransaction?.mandateType || "Levée de fonds"
												}
												className="bg-white border-gray-300"
											/>
										</div>

										{/* Deal Type Opacity */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Opacité type de deal</Label>
												<span className="text-sm text-gray-600">{dealTypeOpacity}%</span>
											</div>
											<Slider
												value={[dealTypeOpacity]}
												onValueChange={(v) => setDealTypeOpacity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Year Override */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label htmlFor="year" className="text-gray-700">
													Année (optionnel)
												</Label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={showYear}
														onChange={(e) => setShowYear(e.target.checked)}
														className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
													/>
													<span className="text-sm text-gray-600">Afficher</span>
												</label>
											</div>
											<Input
												id="year"
												value={yearOverride}
												onChange={(e) => setYearOverride(e.target.value)}
												placeholder={
													selectedTransaction?.year?.toString() || "2024"
												}
												className="bg-white border-gray-300"
											/>
										</div>

										{/* Year Opacity */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Opacité année</Label>
												<span className="text-sm text-gray-600">{yearOpacity}%</span>
											</div>
											<Slider
												value={[yearOpacity]}
												onValueChange={(v) => setYearOpacity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Tagline Opacity */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Opacité tagline</Label>
												<span className="text-sm text-gray-600">{taglineOpacity}%</span>
											</div>
											<Slider
												value={[taglineOpacity]}
												onValueChange={(v) => setTaglineOpacity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Ampersand Opacity */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Opacité &amp;</Label>
												<span className="text-sm text-gray-600">{ampersandOpacity}%</span>
											</div>
											<Slider
												value={[ampersandOpacity]}
												onValueChange={(v) => setAmpersandOpacity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>
									</AccordionItem>

									{/* Visual Effects */}
									<AccordionItem
										title="Effets visuels"
										isOpen={openSections.effects}
										onToggle={() => toggleSection('effects')}
									>
										{/* Logo Effect */}
										<div className="space-y-2 mb-4">
											<Tooltip>
												<TooltipTrigger asChild>
													<Label htmlFor="logo-effect" className="text-gray-700 flex items-center gap-1 cursor-help">
														Effet logo
														<HelpCircle className="h-3 w-3" />
													</Label>
												</TooltipTrigger>
												<TooltipContent>
													<p>Ajoute des effets visuels aux logos</p>
												</TooltipContent>
											</Tooltip>
											<Select
												value={logoEffect}
												onValueChange={(value: 'none' | 'glow' | 'strong-glow' | 'frame') => setLogoEffect(value)}
											>
												<SelectTrigger
													id="logo-effect"
													className="bg-white border-gray-300"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300">
													<SelectItem value="none" className="text-gray-900">
														Aucun
													</SelectItem>
													<SelectItem value="glow" className="text-gray-900">
														Lueur
													</SelectItem>
													<SelectItem value="strong-glow" className="text-gray-900">
														Lueur forte
													</SelectItem>
													<SelectItem value="frame" className="text-gray-900">
														Cadre
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Background Pattern */}
										<div className="space-y-2 mb-4">
											<Tooltip>
												<TooltipTrigger asChild>
													<Label htmlFor="bg-pattern" className="text-gray-700 flex items-center gap-1 cursor-help">
														Motif d&apos;arrière-plan
														<HelpCircle className="h-3 w-3" />
													</Label>
												</TooltipTrigger>
												<TooltipContent>
													<p>Ajoute un motif subtil en arrière-plan</p>
												</TooltipContent>
											</Tooltip>
											<Select
												value={backgroundPattern}
												onValueChange={(value: 'none' | 'dots' | 'grid' | 'diagonal-lines') => setBackgroundPattern(value)}
											>
												<SelectTrigger
													id="bg-pattern"
													className="bg-white border-gray-300"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300">
													<SelectItem value="none" className="text-gray-900">
														Aucun
													</SelectItem>
													<SelectItem value="dots" className="text-gray-900">
														Points
													</SelectItem>
													<SelectItem value="grid" className="text-gray-900">
														Grille
													</SelectItem>
													<SelectItem value="diagonal-lines" className="text-gray-900">
														Lignes diagonales
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Noise Intensity */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Intensité bruit</Label>
												<span className="text-sm text-gray-600">{noiseIntensity.toFixed(3)}</span>
											</div>
											<Slider
												value={[noiseIntensity]}
												onValueChange={(v) => setNoiseIntensity(v[0])}
												min={0}
												max={0.1}
												step={0.001}
												className="w-full"
											/>
										</div>

										{/* Vignette Intensity */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Intensité vignette</Label>
												<span className="text-sm text-gray-600">{vignetteIntensity}%</span>
											</div>
											<Slider
												value={[vignetteIntensity]}
												onValueChange={(v) => setVignetteIntensity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>

										{/* Decorative Line Width */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Largeur ligne décorative</Label>
												<span className="text-sm text-gray-600">{lineWidth}px</span>
											</div>
											<Slider
												value={[lineWidth]}
												onValueChange={(v) => setLineWidth(v[0])}
												min={40}
												max={200}
												step={1}
												className="w-full"
											/>
										</div>
									</AccordionItem>

									{/* Decorative Elements */}
									<AccordionItem
										title="Éléments décoratifs"
										isOpen={openSections.decorative}
										onToggle={() => toggleSection('decorative')}
									>
										{/* Badge Position */}
										<div className="space-y-2 mb-4">
											<Label htmlFor="badge-position" className="text-gray-700">
												Position du badge
											</Label>
											<Select
												value={badgePosition}
												onValueChange={(value: 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => setBadgePosition(value)}
											>
												<SelectTrigger
													id="badge-position"
													className="bg-white border-gray-300"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300">
													<SelectItem value="none" className="text-gray-900">
														Aucun
													</SelectItem>
													<SelectItem value="top-left" className="text-gray-900">
														Haut gauche
													</SelectItem>
													<SelectItem value="top-right" className="text-gray-900">
														Haut droite
													</SelectItem>
													<SelectItem value="bottom-left" className="text-gray-900">
														Bas gauche
													</SelectItem>
													<SelectItem value="bottom-right" className="text-gray-900">
														Bas droite
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Badge Text */}
										{badgePosition !== 'none' && (
											<>
												<div className="space-y-2 mb-4">
													<div className="flex items-center justify-between">
														<Label htmlFor="badge-text" className="text-gray-700">
															Texte du badge
														</Label>
														<span className="text-xs text-gray-500">
															{badgeText.length}/20
														</span>
													</div>
													<Input
														id="badge-text"
														value={badgeText}
														onChange={(e) => setBadgeText(e.target.value)}
														maxLength={20}
														placeholder="Nouveau"
														className="bg-white border-gray-300"
													/>
												</div>

												{/* Badge Style */}
												<div className="space-y-2 mb-4">
													<Label htmlFor="badge-style" className="text-gray-700">
														Style du badge
													</Label>
													<Select
														value={badgeStyle}
														onValueChange={(value: 'solid' | 'outline' | 'gradient') => setBadgeStyle(value)}
													>
														<SelectTrigger
															id="badge-style"
															className="bg-white border-gray-300"
														>
															<SelectValue />
														</SelectTrigger>
														<SelectContent className="bg-white border-gray-300">
															<SelectItem value="solid" className="text-gray-900">
																Solide
															</SelectItem>
															<SelectItem value="outline" className="text-gray-900">
																Contour
															</SelectItem>
															<SelectItem value="gradient" className="text-gray-900">
																Dégradé
															</SelectItem>
														</SelectContent>
													</Select>
												</div>

												{/* Badge Color */}
												<div className="space-y-2 mb-4">
													<Label htmlFor="badge-color" className="text-gray-700">
														Couleur du badge
													</Label>
													<Input
														id="badge-color"
														type="color"
														value={badgeColor}
														onChange={(e) => setBadgeColor(e.target.value)}
														className="h-12 cursor-pointer bg-white border-gray-300"
													/>
												</div>
											</>
										)}

										{/* Bottom Message Icon */}
										<div className="space-y-2 mb-4">
											<Label htmlFor="bottom-icon" className="text-gray-700">
												Icône message bas
											</Label>
											<Select value={bottomIcon} onValueChange={setBottomIcon}>
												<SelectTrigger
													id="bottom-icon"
													className="bg-white border-gray-300"
												>
													<SelectValue placeholder="Choisir une icône..." />
												</SelectTrigger>
												<SelectContent className="bg-white border-gray-300 max-h-60">
													<SelectItem value="none" className="text-gray-900">
														Aucune icône
													</SelectItem>
													<SelectItem value="Phone" className="text-gray-900">
														Téléphone
													</SelectItem>
													<SelectItem value="Mail" className="text-gray-900">
														Email
													</SelectItem>
													<SelectItem value="Globe" className="text-gray-900">
														Site web
													</SelectItem>
													<SelectItem
														value="MessageCircle"
														className="text-gray-900"
													>
														Message
													</SelectItem>
													<SelectItem value="Calendar" className="text-gray-900">
														Calendrier
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Bottom Message Text */}
										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between">
												<Label htmlFor="bottom-text" className="text-gray-700">
													Texte message bas
												</Label>
												<span className="text-xs text-gray-500">
													{bottomText.length}/50
												</span>
											</div>
											<Input
												id="bottom-text"
												value={bottomText}
												onChange={(e) => setBottomText(e.target.value)}
												maxLength={50}
												placeholder="Contactez-nous"
												className="bg-white border-gray-300"
											/>
										</div>

										{/* Bottom Message Opacity */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-gray-700">Opacité message bas</Label>
												<span className="text-sm text-gray-600">{bottomMessageOpacity}%</span>
											</div>
											<Slider
												value={[bottomMessageOpacity]}
												onValueChange={(v) => setBottomMessageOpacity(v[0])}
												min={0}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>
									</AccordionItem>
								</Accordion>
							</TooltipProvider>
						</div>

						{/* Export Options */}
						<div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
							<h3 className="text-lg font-semibold mb-4 text-gray-900">
								Options d&apos;export
							</h3>
							
							<div className="space-y-3">
								{/* Error message */}
								{exportError && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
										{exportError}
									</div>
								)}

								{/* Reset Button */}
								<Button
									onClick={handleReset}
									variant="outline"
									className="w-full border-gray-300 hover:bg-gray-100 text-gray-900"
									size="lg"
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									Réinitialiser les paramètres
								</Button>

								{/* HD Export Button */}
								<Button
									onClick={handleExportHD}
									className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
									size="lg"
									disabled={!selectedDealId || isExportingHD}
								>
									{isExportingHD ? (
										<>
											<svg
												className="animate-spin mr-2 h-5 w-5"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<title>Export en cours</title>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Export en cours...
										</>
									) : (
										<>
											<Download className="mr-2 h-5 w-5" />
											Télécharger l&apos;asset HD
										</>
									)}
								</Button>

								{/* Normal Export Button */}
								<Button
									onClick={handleExport}
									variant="outline"
									className="w-full border-gray-300 hover:bg-gray-100 text-gray-900"
									size="lg"
									disabled={!selectedDealId || isExportingNormal}
								>
									{isExportingNormal ? (
										<>
											<svg
												className="animate-spin mr-2 h-5 w-5"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<title>Export en cours</title>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Export en cours...
										</>
									) : (
										<>
											<Download className="mr-2 h-5 w-5" />
											Exporter en taille normale
										</>
									)}
								</Button>
							</div>
						</div>
					</div>

					{/* Right: Preview */}
					<div className="lg:col-span-2">
						<div className="bg-gray-50 rounded-xl p-4 sm:p-8 border border-gray-200">
							<h2 className="text-xl font-semibold mb-6 text-gray-900">
								Aperçu en direct
							</h2>

							<div className="flex items-center justify-center overflow-x-auto">
								<div
									style={{
										width:
											format === "square"
												? `min(100%, ${DESIGN_TOKENS.preview.square.displayWidth}px)`
												: `min(100%, ${DESIGN_TOKENS.preview.landscape.displayWidth}px)`,
										minWidth: "300px",
										aspectRatio: format === "square" ? "1/1" : "3/2",
									}}
								>
									{/* Preview Container */}
									<div
										ref={previewRef}
										id="preview-container"
										style={{
											width: `${dimensions.width}px`,
											height: `${dimensions.height}px`,
											transform: `scale(${dimensions.displayWidth / dimensions.width})`,
											transformOrigin: "top left",
											background: backgroundGradient,
											fontFamily: typography.fontFamily,
											color: computedTextColor,
											position: "relative",
											overflow: "hidden",
										}}
										className="shadow-2xl"
									>
										{/* Noise texture overlay */}
										<div
											style={{
												position: "absolute",
												inset: 0,
												backgroundImage: `url("${NOISE_TEXTURE_SVG}")`,
												opacity: noiseIntensity,
												pointerEvents: "none",
												zIndex: 0,
											}}
										/>
										
										{/* Background Pattern Overlay */}
										{patternDataUrl && (
											<div
												style={{
													position: "absolute",
													inset: 0,
													backgroundImage: `url("${patternDataUrl}")`,
													pointerEvents: "none",
													zIndex: 1,
												}}
											/>
										)}

										{/* Gradient Overlays - Premium diagonal gradients inspired by reference images */}
										{/* Radial glow from top-right corner */}
										<div
											style={{
												position: "absolute",
												inset: 0,
												background: `radial-gradient(circle at 80% 20%, ${selectedTheme.right}22 0%, transparent 50%)`,
												pointerEvents: "none",
												zIndex: 2,
											}}
										/>

										{/* Diagonal sweep from bottom-left */}
										<div
											style={{
												position: "absolute",
												inset: 0,
												background: `linear-gradient(135deg, ${selectedTheme.left}15 0%, transparent 70%)`,
												pointerEvents: "none",
												zIndex: 3,
											}}
										/>

										{/* Subtle vignette effect */}
										<div
											style={{
												position: "absolute",
												inset: 0,
												background: `radial-gradient(ellipse at center, transparent 40%, ${selectedTheme.left}${percentToHex(vignetteIntensity)} 100%)`,
												pointerEvents: "none",
												zIndex: 4,
											}}
										/>

										{/* Radial highlight in center for depth */}
										<div
											style={{
												position: "absolute",
												top: "30%",
												left: "50%",
												transform: "translateX(-50%)",
												width: "40%",
												height: "30%",
												background: `radial-gradient(ellipse at center, ${computedTextColor}08 0%, transparent 70%)`,
												pointerEvents: "none",
												zIndex: 5,
											}}
										/>

										{/* Subtle border frame */}
										<div
											style={{
												position: "absolute",
												inset: 0,
												border: `1px solid ${computedTextColor}30`,
												pointerEvents: "none",
												zIndex: 20,
											}}
										/>

										{/* Alecia Logo at top */}
										<div
											className="absolute left-0 right-0 flex justify-center"
											style={{
												top: `${DESIGN_TOKENS.spacing.top}px`,
												zIndex: 10,
											}}
										>
											<img
												src={
													selectedTheme.id === "subtle-sand"
														? "/assets/logo/logo_blue.png"
														: "/assets/logo/logo_white.png"
												}
												alt="Alecia"
												crossOrigin="anonymous"
												style={{
													height: `${DESIGN_TOKENS.logo.aleciaHeight}px`,
													width: "auto",
													objectFit: "contain",
												}}
											/>
										</div>

										{/* Company A Logo - Left, strictly bounded to canvas */}
										<div
											style={{
												position: "absolute",
												left: format === "landscape" ? "7%" : "9%",
												top: format === "landscape" ? "23%" : "18%",
												width: format === "landscape" ? "35%" : "34%",
												height: format === "landscape" ? "28%" : "24%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												zIndex: 10,
												overflow: "hidden",
												...logoEffectStyles.containerStyle,
											}}
										>
											{clientLogo ? (
												<img
													src={clientLogo}
													alt="Company A"
													crossOrigin="anonymous"
													style={{
														maxWidth: "100%",
														maxHeight: "100%",
														objectFit: "contain",
														filter: logoEffectStyles.imgFilter,
													}}
												/>
											) : isClientConfidential ? (
												<div
													style={{
														width: "100%",
														height: "100%",
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														justifyContent: "center",
														gap: "16px",
														color: computedTextColor,
														opacity: 0.4,
													}}
												>
													<Lock style={{ width: "80px", height: "80px" }} />
													<span
														style={{
															fontSize: "28px",
															fontWeight: "500",
														}}
													>
														Confidentiel
													</span>
												</div>
											) : (
												<div
													style={{
														width: "100%",
														height: "100%",
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														justifyContent: "center",
														gap: "16px",
														color: computedTextColor,
														opacity: 0.4,
													}}
												>
													<Building2 style={{ width: "80px", height: "80px" }} />
													{selectedTransaction?.clientName && (
														<span
															style={{
																fontSize: "24px",
																fontWeight: "600",
																textAlign: "center",
																padding: "0 16px",
																maxWidth: "100%",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{selectedTransaction.clientName}
														</span>
													)}
												</div>
											)}
										</div>

										{/* Company B Logo - Right, strictly bounded to canvas */}
										<div
											style={{
												position: "absolute",
												right: format === "landscape" ? "7%" : "9%",
												top: format === "landscape" ? "23%" : "18%",
												width: format === "landscape" ? "35%" : "34%",
												height: format === "landscape" ? "28%" : "24%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												zIndex: 10,
												overflow: "hidden",
												...logoEffectStyles.containerStyle,
											}}
										>
											{acquirerLogo ? (
												<img
													src={acquirerLogo}
													alt="Company B"
													crossOrigin="anonymous"
													style={{
														maxWidth: "100%",
														maxHeight: "100%",
														objectFit: "contain",
														filter: logoEffectStyles.imgFilter,
													}}
												/>
											) : isAcquirerConfidential ? (
												<div
													style={{
														width: "100%",
														height: "100%",
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														justifyContent: "center",
														gap: "16px",
														color: computedTextColor,
														opacity: 0.4,
													}}
												>
													<Lock style={{ width: "80px", height: "80px" }} />
													<span
														style={{
															fontSize: "28px",
															fontWeight: "500",
														}}
													>
														Confidentiel
													</span>
												</div>
											) : (
												<div
													style={{
														width: "100%",
														height: "100%",
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														justifyContent: "center",
														gap: "16px",
														color: computedTextColor,
														opacity: 0.4,
													}}
												>
													<Building2 style={{ width: "80px", height: "80px" }} />
													{selectedTransaction?.acquirerName && (
														<span
															style={{
																fontSize: "24px",
																fontWeight: "600",
																textAlign: "center",
																padding: "0 16px",
																maxWidth: "100%",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{selectedTransaction.acquirerName}
														</span>
													)}
												</div>
											)}
										</div>

										{/* Ampersand - Centered between logos */}
										<div
											style={{
												position: "absolute",
												top: format === "landscape" ? "30%" : "25%",
												left: "50%",
												transform: "translateX(-50%)",
												height: format === "landscape" ? "28%" : "24%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize:
													format === "landscape"
														? `${DESIGN_TOKENS.typography.ampersand * 0.6}px`
														: `${DESIGN_TOKENS.typography.ampersand}px`,
												fontWeight: "100",
												opacity: ampersandOpacity / 100,
												lineHeight: 1,
												zIndex: 5,
											}}
										>
											&amp;
										</div>

										{/* Decorative line separator */}
										<div
											style={{
												position: "absolute",
												top: format === "landscape" ? "54%" : "46%",
												left: "50%",
												transform: "translateX(-50%)",
												width: `${lineWidth}px`,
												height: "2px",
												background: `linear-gradient(90deg, transparent 0%, ${computedTextColor}60 50%, transparent 100%)`,
												zIndex: 10,
											}}
										/>

										{/* Deal Info - Below logos */}
										{(showDealType || showYear) && (
											<div
												className="absolute left-0 right-0 text-center"
												style={{
													top: format === "landscape" ? "57%" : "49%",
													zIndex: 10,
												}}
											>
												{showDealType && (
													<div
														style={{
															fontSize: `${DESIGN_TOKENS.typography.dealType}px`,
															fontWeight: "600",
															marginBottom: showYear ? "12px" : "0",
															letterSpacing: "-0.02em",
															opacity: dealTypeOpacity / 100,
														}}
													>
														{displayDealType}
													</div>
												)}
												{showYear && (
													<div
														style={{
															fontSize: `${DESIGN_TOKENS.typography.year}px`,
															fontWeight: "400",
															opacity: yearOpacity / 100,
														}}
													>
														{displayYear}
													</div>
												)}
												{/* Subtle tagline */}
												<div
													style={{
														marginTop: "24px",
														fontSize: "18px",
														fontWeight: "300",
														opacity: taglineOpacity / 100,
														letterSpacing: "0.15em",
														textTransform: "uppercase",
													}}
												>
													Conseil M&amp;A
												</div>
											</div>
										)}

										{/* Bottom Message */}
										{((bottomIcon && bottomIcon !== "none") || bottomText) && (
											<div
												className="absolute left-0 right-0 flex items-center justify-center gap-3"
												style={{
													bottom: `${DESIGN_TOKENS.spacing.bottom}px`,
													fontSize: `${DESIGN_TOKENS.typography.bottomMessage}px`,
													opacity: bottomMessageOpacity / 100,
												}}
											>
												{BottomIconComponent && (
													<BottomIconComponent className="w-9 h-9" />
												)}
												{bottomText && <span>{bottomText}</span>}
											</div>
										)}
										
										{/* Badge */}
										{badgePosition !== 'none' && badgeText && (
											<div
												style={{
													position: "absolute",
													...(badgePosition === 'top-left' && { top: "40px", left: "40px" }),
													...(badgePosition === 'top-right' && { top: "40px", right: "40px" }),
													...(badgePosition === 'bottom-left' && { bottom: "40px", left: "40px" }),
													...(badgePosition === 'bottom-right' && { bottom: "40px", right: "40px" }),
													zIndex: 25,
													padding: "12px 24px",
													fontSize: "20px",
													fontWeight: "600",
													borderRadius: "8px",
													textTransform: "uppercase",
													letterSpacing: "0.05em",
													...(badgeStyle === 'solid' && {
														background: badgeColor,
														color: getLuminance(badgeColor) > LUMINANCE_THRESHOLD ? DARK_TEXT_COLOR : LIGHT_TEXT_COLOR,
													}),
													...(badgeStyle === 'outline' && {
														background: "transparent",
														border: `2px solid ${badgeColor}`,
														color: badgeColor,
													}),
													...(badgeStyle === 'gradient' && {
														background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}dd)`,
														color: getLuminance(badgeColor) > LUMINANCE_THRESHOLD ? DARK_TEXT_COLOR : LIGHT_TEXT_COLOR,
													}),
												}}
											>
												{badgeText}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
