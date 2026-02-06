import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-nunito)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  		},
  		letterSpacing: {
  			tighter: '-0.015em',
  			tight: '-0.01em',
  			normal: '0',
  		},
  		lineHeight: {
  			tight: '1.2',
  			snug: '1.3',
  			normal: '1.6',
  		},
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			primary: {
  				DEFAULT: '#0F172A', // slate-900 - dark primary
  				50: '#F8FAFC',
  				100: '#F1F5F9',
  				200: '#E2E8F0',
  				300: '#CBD5E1',
  				400: '#94A3B8',
  				500: '#64748B',
  				600: '#475569',
  				700: '#334155',
  				800: '#1E293B',
  				900: '#0F172A',
  			},
  			accent: {
  				DEFAULT: '#1E40AF', // dark blue
  				50: '#EFF6FF',
  				100: '#DBEAFE',
  				200: '#BFDBFE',
  				300: '#93C5FD',
  				400: '#60A5FA',
  				500: '#3B82F6',
  				600: '#2563EB',
  				700: '#1D4ED8',
  				800: '#1E40AF',
  				900: '#1E3A8A',
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
