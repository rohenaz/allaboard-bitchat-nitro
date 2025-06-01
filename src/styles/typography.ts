// Typography System for BitChat Nitro
// This provides a consistent set of font sizes and weights across the app

export const typography = {
  // Font sizes with corresponding line heights
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },

  lineHeight: {
    xs: '16px',
    sm: '20px',
    base: '24px',
    lg: '28px',
    xl: '28px',
    '2xl': '32px',
    '3xl': '36px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Pre-defined text styles
  styles: {
    // Headings
    h1: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 700,
    },
    h2: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    h3: {
      fontSize: '18px',
      lineHeight: '24px',
      fontWeight: 600,
    },

    // Body text
    body: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
    },

    // UI elements
    button: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    label: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
    },
  },
} as const;

// Helper function to apply typography styles
export const applyTypography = (style: keyof typeof typography.styles) => {
  return typography.styles[style];
};

// CSS-in-JS helper
export const typographyCSS = {
  h1: `
    font-size: ${typography.styles.h1.fontSize};
    line-height: ${typography.styles.h1.lineHeight};
    font-weight: ${typography.styles.h1.fontWeight};
  `,
  h2: `
    font-size: ${typography.styles.h2.fontSize};
    line-height: ${typography.styles.h2.lineHeight};
    font-weight: ${typography.styles.h2.fontWeight};
  `,
  h3: `
    font-size: ${typography.styles.h3.fontSize};
    line-height: ${typography.styles.h3.lineHeight};
    font-weight: ${typography.styles.h3.fontWeight};
  `,
  body: `
    font-size: ${typography.styles.body.fontSize};
    line-height: ${typography.styles.body.lineHeight};
    font-weight: ${typography.styles.body.fontWeight};
  `,
  bodyLarge: `
    font-size: ${typography.styles.bodyLarge.fontSize};
    line-height: ${typography.styles.bodyLarge.lineHeight};
    font-weight: ${typography.styles.bodyLarge.fontWeight};
  `,
  bodySmall: `
    font-size: ${typography.styles.bodySmall.fontSize};
    line-height: ${typography.styles.bodySmall.lineHeight};
    font-weight: ${typography.styles.bodySmall.fontWeight};
  `,
  button: `
    font-size: ${typography.styles.button.fontSize};
    line-height: ${typography.styles.button.lineHeight};
    font-weight: ${typography.styles.button.fontWeight};
  `,
  label: `
    font-size: ${typography.styles.label.fontSize};
    line-height: ${typography.styles.label.lineHeight};
    font-weight: ${typography.styles.label.fontWeight};
    text-transform: ${typography.styles.label.textTransform};
  `,
  caption: `
    font-size: ${typography.styles.caption.fontSize};
    line-height: ${typography.styles.caption.lineHeight};
    font-weight: ${typography.styles.caption.fontWeight};
  `,
};
