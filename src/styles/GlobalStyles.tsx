import { Global } from '@emotion/react';

const customStyles = {
  ':root': {
    // 2025 Modern Dark Theme - Enhanced with glassmorphism and lighting
    '--background-primary': '#0d1117', // Ultra-dark main background (GitHub-inspired)
    '--background-secondary': 'rgba(22, 27, 34, 0.8)', // Glassmorphic sidebar
    '--background-tertiary': 'rgba(33, 38, 45, 0.9)', // Glassmorphic server list
    '--background-floating': 'rgba(13, 17, 23, 0.95)', // Ultra-dark glassmorphic modals
    '--background-accent': 'rgba(56, 62, 70, 0.8)', // Hover states with transparency
    '--background-mobile-primary': '#0d1117',
    '--background-mobile-secondary': 'rgba(22, 27, 34, 0.8)',
    '--background-modifier-hover': 'rgba(79, 84, 92, 0.12)',
    '--background-modifier-active': 'rgba(79, 84, 92, 0.18)',
    '--background-modifier-selected': 'rgba(79, 84, 92, 0.24)',
    '--background-modifier-accent': 'rgba(79, 84, 92, 0.36)',
    '--background-secondary-alt': 'rgba(13, 17, 23, 0.7)', // Glassmorphic cards
    '--background-glass': 'rgba(255, 255, 255, 0.05)', // Pure glassmorphic overlay
    '--background-glass-light': 'rgba(255, 255, 255, 0.08)', // Lighter glass overlay

    // Status colors with enhanced vibrancy for 2025
    '--status-positive': '#22c55e', // Modern green (Tailwind-inspired)
    '--status-positive-darker': '#16a34a',
    '--status-positive-glow': 'rgba(34, 197, 94, 0.3)',
    '--status-danger': '#ef4444', // Modern red
    '--status-danger-darker': '#dc2626',
    '--status-danger-glow': 'rgba(239, 68, 68, 0.3)',
    '--status-warning': '#f59e0b', // Modern amber
    '--status-warning-glow': 'rgba(245, 158, 11, 0.3)',

    // Text colors - enhanced for better readability and hierarchy
    '--text-normal': '#f8fafc', // Near-white for primary text
    '--text-muted': '#94a3b8', // Modern slate for secondary text
    '--text-subtle': '#64748b', // Subtle text for tertiary content
    '--text-link': '#3b82f6', // Modern blue
    '--text-positive': '#22c55e', // Success green
    '--text-warning': '#f59e0b', // Warning amber
    '--text-danger': '#ef4444', // Danger red

    // Interactive elements with modern touch
    '--interactive-normal': '#94a3b8', // Default interactive
    '--interactive-hover': '#e2e8f0', // Hover state
    '--interactive-active': '#ffffff', // Active state
    '--interactive-muted': '#475569', // Disabled state

    // Channel colors
    '--channels-default': '#9ca3af', // Modern gray for channels
    '--channel-text-area-placeholder': 'rgba(248, 250, 252, 0.4)',

    // Brand colors - Updated for 2025 with enhanced vibrancy
    '--brand-experiment': '#6366f1', // Modern indigo
    '--brand-experiment-darker': '#4f46e5',
    '--brand-experiment-lighter': '#818cf8',
    '--brand-experiment-rgb': '99, 102, 241',
    '--brand-experiment-glow': 'rgba(99, 102, 241, 0.4)',

    // Additional colors
    '--control-brand-foreground': '#ffffff',
    '--white': '#ffffff',
    '--green-360': '#22c55e',
    '--primary-dark-300': '#94a3b8',
    '--primary-dark-360': '#64748b',
    '--white-500': '#ffffff',

    // Modern shadows and effects for 2025
    '--elevation-stroke': '0 0 0 1px rgba(255, 255, 255, 0.05)',
    '--elevation-low':
      '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '--elevation-medium':
      '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    '--elevation-high':
      '0 10px 25px rgba(0, 0, 0, 0.3), 0 6px 10px rgba(0, 0, 0, 0.15)',
    '--elevation-glass': '0 8px 32px rgba(0, 0, 0, 0.2)',

    // Glassmorphism blur effects
    '--blur-light': '8px',
    '--blur-medium': '12px',
    '--blur-heavy': '20px',

    // Glow effects for modern lighting
    '--glow-brand': '0 0 20px var(--brand-experiment-glow)',
    '--glow-positive': '0 0 20px var(--status-positive-glow)',
    '--glow-danger': '0 0 20px var(--status-danger-glow)',
    '--glow-warning': '0 0 20px var(--status-warning-glow)',

    // Scrollbars with modern styling
    '--scrollbar-thin-thumb': 'rgba(148, 163, 184, 0.3)',
    '--scrollbar-thin-track': 'transparent',
    '--scrollbar-auto-thumb': 'rgba(148, 163, 184, 0.3)',
    '--scrollbar-auto-track': 'rgba(22, 27, 34, 0.5)',

    // Border styles
    '--border-subtle': 'rgba(255, 255, 255, 0.08)',
    '--border-muted': 'rgba(255, 255, 255, 0.05)',
    '--border-glass': 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#1a1b1e',
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
