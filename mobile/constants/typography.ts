/**
 * Typography Configuration
 * Clicky Foundation - YSKI App
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: 'PublicSans-Regular',
    sansMedium: 'PublicSans-Medium',
    sansSemiBold: 'PublicSans-SemiBold',
    sansBold: 'PublicSans-Bold',
  },
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Letter Spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
} as const;

export type Typography = typeof typography;
