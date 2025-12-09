import { Global } from '@emotion/react';

const customStyles = {
	'html, body': {
		margin: 0,
		padding: 0,
		fontFamily: 'var(--font-sans)',
		fontSize: '16px',
		lineHeight: '1.5',
		color: 'var(--foreground)',
		backgroundColor: 'var(--background)',
		WebkitFontSmoothing: 'antialiased',
		MozOsxFontSmoothing: 'grayscale',
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
		backgroundColor: 'var(--muted-foreground)',
		borderRadius: '4px',
		opacity: 0.3,
	},
	'::-webkit-scrollbar-thumb:hover': {
		opacity: 0.5,
	},
	'*:focus': {
		outline: 'none',
	},
	'button, a, input, textarea': {
		transition: 'all 0.15s ease',
	},
	'h1, h2, h3, h4, h5, h6, p': {
		margin: 0,
	},
	button: {
		background: 'none',
		border: 'none',
		color: 'inherit',
		font: 'inherit',
		cursor: 'pointer',
	},
	'input, textarea': {
		background: 'transparent',
		border: 'none',
		color: 'inherit',
		fontFamily: 'inherit',
		outline: 'none',
	},
};

export const GlobalStyles = () => <Global styles={customStyles} />;
