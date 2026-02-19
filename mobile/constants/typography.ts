/**
 * Typography Configuration
 * Yayasan Sahabat Khairat Indonesia - YSKI App
 */

import { TextStyle } from 'react-native';

// Raw tokens
const fontFamily = {
  sans: 'PublicSans-Regular',
  sansMedium: 'PublicSans-Medium',
  sansSemiBold: 'PublicSans-SemiBold',
  sansBold: 'PublicSans-Bold',
};

const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

const letterSpacing = {
  tight: -0.025,
  normal: 0,
  wide: 0.025,
};

// Semantic typography variants used across the app
const h1: TextStyle = {
  fontSize: fontSize['4xl'],
  lineHeight: fontSize['4xl'] * lineHeight.tight,
  fontWeight: fontWeight.bold,
};

const h2: TextStyle = {
  fontSize: fontSize['3xl'],
  lineHeight: fontSize['3xl'] * lineHeight.tight,
  fontWeight: fontWeight.bold,
};

const h3: TextStyle = {
  fontSize: fontSize['2xl'],
  lineHeight: fontSize['2xl'] * lineHeight.tight,
  fontWeight: fontWeight.semibold,
};

const h4: TextStyle = {
  fontSize: fontSize.xl,
  lineHeight: fontSize.xl * lineHeight.tight,
  fontWeight: fontWeight.semibold,
};

const h5: TextStyle = {
  fontSize: fontSize.lg,
  lineHeight: fontSize.lg * lineHeight.tight,
  fontWeight: fontWeight.semibold,
};

const h6: TextStyle = {
  fontSize: fontSize.base,
  lineHeight: fontSize.base * lineHeight.tight,
  fontWeight: fontWeight.semibold,
};

const body1: TextStyle = {
  fontSize: fontSize.base,
  lineHeight: fontSize.base * lineHeight.normal,
  fontWeight: fontWeight.normal,
};

const body2: TextStyle = {
  fontSize: fontSize.sm,
  lineHeight: fontSize.sm * lineHeight.normal,
  fontWeight: fontWeight.normal,
};

const caption: TextStyle = {
  fontSize: fontSize.xs,
  lineHeight: fontSize.xs * lineHeight.normal,
  fontWeight: fontWeight.normal,
};

const button: TextStyle = {
  fontSize: fontSize.sm,
  lineHeight: fontSize.sm * lineHeight.tight,
  fontWeight: fontWeight.semibold,
};

const subtitle1: TextStyle = {
  fontSize: fontSize.base,
  lineHeight: fontSize.base * lineHeight.normal,
  fontWeight: fontWeight.medium,
};

const subtitle2: TextStyle = {
  fontSize: fontSize.sm,
  lineHeight: fontSize.sm * lineHeight.normal,
  fontWeight: fontWeight.medium,
};

export const typography = {
  // Raw tokens
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,

  // Semantic variants
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  body1,
  body2,
  caption,
  button,
  subtitle1,
  subtitle2,
};

export type Typography = typeof typography;
