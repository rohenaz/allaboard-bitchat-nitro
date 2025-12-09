import { Global } from '@emotion/react';

const customStyles = {
	':root': {
		// Map Discord-like semantic colors to shadcn theme variables
		'--background-primary': 'hsl(var(--background))',
		'--background-secondary': 'hsl(var(--card))',
		'--background-tertiary': 'hsl(var(--muted))',
		'--background-floating': 'hsl(var(--popover))',
		'--background-accent': 'hsl(var(--accent))',
		'--background-mobile-primary': 'hsl(var(--background))',
		'--background-mobile-secondary': 'hsl(var(--card))',
		'--background-modifier-hover': 'hsl(var(--accent) / 0.12)',
		'--background-modifier-active': 'hsl(var(--accent) / 0.18)',
		'--background-modifier-selected': 'hsl(var(--accent) / 0.24)',
		'--background-modifier-accent': 'hsl(var(--accent) / 0.36)',
		'--background-secondary-alt': 'hsl(var(--card) / 0.7)',
		'--background-glass': 'hsl(var(--background) / 0.05)',
		'--background-glass-light': 'hsl(var(--foreground) / 0.08)',

		// Status colors using shadcn chart colors and destructive
		'--status-positive': 'hsl(var(--chart-2))',
		'--status-positive-darker': 'hsl(var(--chart-2) / 0.8)',
		'--status-positive-glow': 'hsl(var(--chart-2) / 0.3)',
		'--status-danger': 'hsl(var(--destructive))',
		'--status-danger-darker': 'hsl(var(--destructive) / 0.8)',
		'--status-danger-glow': 'hsl(var(--destructive) / 0.3)',
		'--status-warning': 'hsl(var(--chart-4))',
		'--status-warning-glow': 'hsl(var(--chart-4) / 0.3)',

		// Text colors mapped to shadcn foreground variants
		'--text-normal': 'hsl(var(--foreground))',
		'--text-muted': 'hsl(var(--muted-foreground))',
		'--text-subtle': 'hsl(var(--muted-foreground) / 0.7)',
		'--text-link': 'hsl(var(--primary))',
		'--text-positive': 'hsl(var(--chart-2))',
		'--text-warning': 'hsl(var(--chart-4))',
		'--text-danger': 'hsl(var(--destructive))',

		// Interactive elements using primary and muted
		'--interactive-normal': 'hsl(var(--muted-foreground))',
		'--interactive-hover': 'hsl(var(--foreground))',
		'--interactive-active': 'hsl(var(--primary))',
		'--interactive-muted': 'hsl(var(--muted-foreground) / 0.5)',

		// Channel colors
		'--channels-default': 'hsl(var(--muted-foreground))',
		'--channel-text-area-placeholder': 'hsl(var(--muted-foreground) / 0.4)',

		// Brand colors using primary
		'--brand-experiment': 'hsl(var(--primary))',
		'--brand-experiment-darker': 'hsl(var(--primary) / 0.8)',
		'--brand-experiment-lighter': 'hsl(var(--primary) / 1.2)',
		'--brand-experiment-rgb': 'var(--primary)',
		'--brand-experiment-glow': 'hsl(var(--primary) / 0.4)',
		'--brand-experiment-hover': 'hsl(var(--primary) / 0.9)',

		// Additional colors
		'--control-brand-foreground': 'hsl(var(--primary-foreground))',
		'--white': 'hsl(var(--background))',
		'--green-360': 'hsl(var(--chart-2))',
		'--primary-dark-300': 'hsl(var(--muted-foreground))',
		'--primary-dark-360': 'hsl(var(--muted-foreground) / 0.7)',
		'--white-500': 'hsl(var(--foreground))',

		// Modern shadows and effects
		'--elevation-stroke': '0 0 0 1px hsl(var(--border))',
		'--elevation-low':
			'0 1px 3px hsl(var(--foreground) / 0.12), 0 1px 2px hsl(var(--foreground) / 0.24)',
		'--elevation-medium':
			'0 4px 6px hsl(var(--foreground) / 0.1), 0 2px 4px hsl(var(--foreground) / 0.06)',
		'--elevation-high':
			'0 10px 25px hsl(var(--foreground) / 0.3), 0 6px 10px hsl(var(--foreground) / 0.15)',
		'--elevation-glass': '0 8px 32px hsl(var(--foreground) / 0.2)',

		// Glassmorphism blur effects
		'--blur-light': '8px',
		'--blur-medium': '12px',
		'--blur-heavy': '20px',

		// Glow effects for modern lighting
		'--glow-brand': '0 0 20px hsl(var(--primary) / 0.4)',
		'--glow-positive': '0 0 20px hsl(var(--chart-2) / 0.3)',
		'--glow-danger': '0 0 20px hsl(var(--destructive) / 0.3)',
		'--glow-warning': '0 0 20px hsl(var(--chart-4) / 0.3)',

		// Scrollbars with modern styling
		'--scrollbar-thin-thumb': 'hsl(var(--muted-foreground) / 0.3)',
		'--scrollbar-thin-track': 'transparent',
		'--scrollbar-thin-thumb-hover': 'hsl(var(--muted-foreground) / 0.5)',
		'--scrollbar-auto-thumb': 'hsl(var(--muted-foreground) / 0.3)',
		'--scrollbar-auto-track': 'hsl(var(--muted) / 0.5)',

		// Border styles
		'--border-subtle': 'hsl(var(--border) / 0.5)',
		'--border-muted': 'hsl(var(--border) / 0.3)',
		'--border-glass': 'hsl(var(--border))',
	},
	'html, body': {
		margin: 0,
		padding: 0,
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
		fontSize: '16px',
		lineHeight: '1.5',
		color: 'var(--text-normal)',
		backgroundColor: 'var(--background-primary)',
		WebkitFontSmoothing: 'antialiased',
		MozOsxFontSmoothing: 'grayscale',
		// Enable hardware acceleration for smooth animations
		transform: 'translateZ(0)',
		// Better text rendering
		textRendering: 'optimizeLegibility',
		fontFeatureSettings: '"kern" 1',
	},
	'*': {
		boxSizing: 'border-box' as const,
	},
	'#root': {
		height: '100vh',
		overflow: 'hidden',
	},
	// Scrollbar styling
	'::-webkit-scrollbar': {
		width: '8px',
		height: '8px',
	},
	'::-webkit-scrollbar-track': {
		backgroundColor: 'transparent',
	},
	'::-webkit-scrollbar-thumb': {
		backgroundColor: 'var(--scrollbar-thin-thumb)',
		borderRadius: '4px',
		border: '2px solid transparent',
		backgroundClip: 'padding-box',
	},
	'::-webkit-scrollbar-thumb:hover': {
		backgroundColor: 'var(--scrollbar-thin-thumb-hover)',
	},
	// Remove focus outlines, use custom focus states
	'*:focus': {
		outline: 'none',
	},
	// Enhanced smooth transitions with modern timing
	'button, a, input, textarea, [data-interactive]': {
		transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
	},

	// Modern typography hierarchy
	'h1, h2, h3, h4, h5, h6': {
		margin: 0,
		fontWeight: 700,
		letterSpacing: '-0.025em',
		lineHeight: '1.25',
	},
	h1: {
		fontSize: '2.25rem',
		fontWeight: 800,
	},
	h2: {
		fontSize: '1.875rem',
		fontWeight: 700,
	},
	h3: {
		fontSize: '1.5rem',
		fontWeight: 600,
	},
	p: {
		margin: 0,
		lineHeight: '1.6',
	},

	// Modern button styles with glassmorphism support
	button: {
		background: 'none',
		border: 'none',
		color: 'inherit',
		font: 'inherit',
		cursor: 'pointer',
		position: 'relative',
		overflow: 'hidden',
		// Better tap targets on mobile
		minHeight: '44px',
		minWidth: '44px',
	},

	// Glassmorphic button variant
	'.btn-glass': {
		background: 'var(--background-glass)',
		backdropFilter: 'blur(var(--blur-light))',
		border: '1px solid var(--border-glass)',
		borderRadius: '12px',
	},

	// Clean input styling with modern focus states
	'input, textarea': {
		background: 'transparent',
		border: 'none',
		color: 'var(--text-normal)',
		fontFamily: 'inherit',
		outline: 'none',
	},

	// Modern focus states
	'input:focus, textarea:focus, button:focus-visible': {
		boxShadow: '0 0 0 2px var(--brand-experiment-glow)',
		borderColor: 'var(--brand-experiment)',
	},

	// Glassmorphism utility classes
	'.glass': {
		background: 'var(--background-glass)',
		backdropFilter: 'blur(var(--blur-medium))',
		WebkitBackdropFilter: 'blur(var(--blur-medium))',
		border: '1px solid var(--border-glass)',
	},

	'.glass-light': {
		background: 'var(--background-glass-light)',
		backdropFilter: 'blur(var(--blur-light))',
		WebkitBackdropFilter: 'blur(var(--blur-light))',
		border: '1px solid var(--border-subtle)',
	},

	// Modern hover effects
	'.hover-glow:hover': {
		boxShadow: 'var(--glow-brand)',
		transform: 'translateY(-1px)',
	},

	'.hover-lift:hover': {
		transform: 'translateY(-2px)',
		boxShadow: 'var(--elevation-medium)',
	},

	// Subtle animations for modern feel
	'@keyframes fadeIn': {
		from: { opacity: 0, transform: 'translateY(10px)' },
		to: { opacity: 1, transform: 'translateY(0)' },
	},

	'@keyframes slideIn': {
		from: { opacity: 0, transform: 'translateX(-20px)' },
		to: { opacity: 1, transform: 'translateX(0)' },
	},

	'@keyframes pulse': {
		'0%, 100%': { opacity: 1 },
		'50%': { opacity: 0.8 },
	},

	// Animation utility classes
	'.animate-fade-in': {
		animation: 'fadeIn 0.3s ease-out',
	},

	'.animate-slide-in': {
		animation: 'slideIn 0.3s ease-out',
	},

	'.animate-pulse': {
		animation: 'pulse 2s infinite',
	},
};

export const GlobalStyles = () => (
	<>
		<Global styles={customStyles} />
	</>
);
