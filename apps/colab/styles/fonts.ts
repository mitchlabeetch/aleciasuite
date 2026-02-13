import localFont from "next/font/local";

// Use local CalSans for titles to avoid build-time Google Font fetches.
const titleFont = localFont({
	src: "./CalSans-SemiBold.otf",
	variable: "--font-title",
});

// Use Bierstadt for default/body text to keep a readable regular weight.
const defaultFont = localFont({
	src: [
		{
			path: "./bierstadt.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "./bierstadt-bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-default",
});

// Font role aliases maintain legacy naming while pointing to local fallbacks.
export const cal = titleFont;
export const crimsonBold = titleFont;
export const inconsolataBold = titleFont;
export const inter = defaultFont;
export const crimson = defaultFont;
export const inconsolata = defaultFont;

export const titleFontMapper = {
	Default: cal.variable,
	Serif: crimsonBold.variable,
	Mono: inconsolataBold.variable,
};

export const defaultFontMapper = {
	Default: inter.variable,
	Serif: crimson.variable,
	Mono: inconsolata.variable,
};
