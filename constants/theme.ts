import { Platform } from 'react-native';

// Colors
const primaryGreen = '#123530';
const whiteColor = '#fffbf5';
const highlightGreen = '#5EC385';
const purple = '#8401FF';
const blue = '#40A4F2';
const yellow = '#F0C53A';
const darkBlue = '#316CC8';

export const Colors = {
  light: {
    text: primaryGreen,
    background: whiteColor,
    tint: primaryGreen,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryGreen,
    highlight: highlightGreen,
    accentPurple: purple,
    accentBlue: blue,
    accentYellow: yellow,
    accentDarkBlue: darkBlue,
  },
  dark: {
    text: whiteColor,
    background: primaryGreen,
    tint: whiteColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: whiteColor,
    highlight: highlightGreen,
    accentPurple: purple,
    accentBlue: blue,
    accentYellow: yellow,
    accentDarkBlue: darkBlue,
  },
};

// Fonts type
type FontSet = {
  heading: string;
  body: string;
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
};

// Fonts
export const Fonts: FontSet = Platform.select<FontSet>({
  ios: {
    heading: 'Bree',
    body: 'Poppins',
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    heading: 'Bree',
    body: 'Poppins',
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    heading: "Bree, 'Bree Serif', serif",
    body: "Poppins, 'Poppins', sans-serif",
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  default: {
    heading: 'Bree',
    body: 'Poppins',
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
}) as FontSet;

// Typography style type
type TypographyStyle = {
  fontSize: number;
  fontFamily: string;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
};

// Typography
export const Typography: Record<string, TypographyStyle> = {
  heading: { fontSize: 22, fontFamily: Fonts.heading, fontWeight: '400', lineHeight: 28 },
  subHeading: { fontSize: 16, fontFamily: Fonts.body, fontWeight: '600', lineHeight: 22 },
  paragraph: { fontSize: 12, fontFamily: Fonts.body, fontWeight: '400', lineHeight: 18 },
  small: { fontSize: 10, fontFamily: Fonts.body, fontWeight: '400', lineHeight: 14 },
  xsmall: { fontSize: 8, fontFamily: Fonts.body, fontWeight: '400', lineHeight: 12 },
  headingLarge: { fontSize: 28, fontFamily: Fonts.heading, fontWeight: '400', lineHeight: 34 },
  headingSmall: { fontSize: 18, fontFamily: Fonts.heading, fontWeight: '400', lineHeight: 24 },
  paragraphLarge: { fontSize: 14, fontFamily: Fonts.body, fontWeight: '400', lineHeight: 20 },
};

// Font weights separately
export const FontWeights = {
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  light: '300' as const,
};

// Utility functions
export const getFontFamily = (type: keyof FontSet = 'body') => {
  return Fonts[type] || Fonts.body;
};

export const getFontSize = (size: keyof typeof Typography = 'paragraph') => {
  return Typography[size]?.fontSize || 12;
};

// Text Styles
export const TextStyles = {
  heading: { ...Typography.heading, color: Colors.light.text },
  subHeading: { ...Typography.subHeading, color: Colors.light.text },
  paragraph: { ...Typography.paragraph, color: Colors.light.text },
  highlight: { ...Typography.paragraph, color: Colors.light.highlight, fontWeight: FontWeights.semiBold },
  caption: { ...Typography.small, color: Colors.light.icon },
  label: { ...Typography.xsmall, color: Colors.light.icon, fontWeight: FontWeights.semiBold, textTransform: 'uppercase' as const },
};

// Dark Mode Text Styles
export const DarkTextStyles = {
  heading: { ...Typography.heading, color: Colors.dark.text },
  subHeading: { ...Typography.subHeading, color: Colors.dark.text },
  paragraph: { ...Typography.paragraph, color: Colors.dark.text },
  highlight: { ...Typography.paragraph, color: Colors.dark.highlight, fontWeight: FontWeights.semiBold },
  caption: { ...Typography.small, color: Colors.dark.icon },
  label: { ...Typography.xsmall, color: Colors.dark.icon, fontWeight: FontWeights.semiBold, textTransform: 'uppercase' as const },
};

export default {
  Colors,
  Fonts,
  Typography,
  FontWeights,
  TextStyles,
  DarkTextStyles,
  getFontFamily,
  getFontSize,
};
