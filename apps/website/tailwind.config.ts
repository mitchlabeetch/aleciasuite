import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-bierstadt)", "sans-serif"],
				serif: ["var(--font-playfair)", "serif"],
			},
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				primary: "var(--primary)",
				border: "var(--border)",
				input: "var(--input)",
				card: "var(--card)",
				accent: "var(--accent)",
				muted: {
					DEFAULT: "var(--foreground-muted)",
					foreground: "var(--foreground-muted)",
				},
				alecia: {
					midnight: "var(--alecia-blue-midnight)",
					corporate: "var(--alecia-blue-corporate)",
					mid: "var(--alecia-mid-blue)",
					"mid-blue": "var(--alecia-mid-blue)",
					light: "var(--alecia-blue-light)",
					pale: "var(--alecia-blue-pale)",
					ice: "var(--alecia-blue-ice)",
					red: "var(--alecia-red-accent)",
					gold: "var(--alecia-gold)",
					titanium: "var(--alecia-grey-titanium)",
					steel: "var(--alecia-grey-steel)",
					chrome: "var(--alecia-grey-chrome)",
					cloud: "var(--alecia-grey-cloud)",
					"off-white": "var(--alecia-off-white)",
				},
			},
			backgroundColor: {
				secondary: "var(--background-secondary)",
			},
		},
	},
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require("@tailwindcss/typography"),
	],
};
export default config;
