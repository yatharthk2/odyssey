const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./app/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			// Wired to next/font variables set in pages/_app.tsx (Geist / Geist Mono).
			fontFamily: {
				sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
				mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
			},
			// Tailwind's default `gray` is cool-tinted (gray-900 = #111827, a navy
			// hue) which made the dark theme read blue. Alias it to the truly
			// neutral scale so "black & white" is actually black & white.
			colors: {
				gray: colors.neutral,
				// Aurora accent — drawn from the hero dither-cloud's teal→green→mint
				// ramp (see DitherCanvas PALETTES.aurora). Single source of truth for
				// every accent on the page so the home reads as one composition with
				// the hero. Use ~400 on dark, ~600/700 on light for contrast.
				aurora: {
					50: '#e2fbef',
					100: '#bfe3dc',
					200: '#9ee5c4',
					300: '#7be0a6',
					400: '#34d399',
					500: '#2fb866',
					600: '#168a5f',
					700: '#0f6b70',
					800: '#125a63',
					900: '#0c4f6a',
				},
			},
		},
	},
	plugins: [],
};
