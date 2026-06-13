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
			},
		},
	},
	plugins: [],
};
