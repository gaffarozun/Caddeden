// Powered by OnSpace.AI
// Caddeden design tokens with light + dark palettes.
// `colors` stays exported as the light palette for backward compatibility
// (screens not yet migrated to useTheme keep working). Migrated screens read
// the active palette from useTheme() and rebuild their StyleSheet via a
// createStyles(colors) factory wrapped in useMemo.
import { Platform } from 'react-native';

export const lightColors = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFAF7',
  surfaceTint: '#F1EFE9',

  primary: '#FF5436',
  primaryDark: '#E23E22',
  primarySoft: '#FFE8E2',

  text: '#1B1B1D',
  textSubtle: '#6E6E73',
  textFaint: '#9A9AA0',

  border: '#ECEAE4',
  borderStrong: '#DED9CF',

  success: '#2E9E6B',
  successSoft: '#E3F4EC',
  warning: '#E0982F',
  warningSoft: '#FBF0DC',
  danger: '#E5484D',
  dangerSoft: '#FBE7E7',

  info: '#3B7CD4',

  overlay: 'rgba(20,18,16,0.55)',
  overlayStrong: 'rgba(20,18,16,0.8)',
  white: '#FFFFFF',
  black: '#000000',
};

// Dark palette. Keys are identical to lightColors so every themed style keeps
// working. `white`/`black` stay fixed (used for text on colored surfaces and
// gradient overlays).
export const darkColors: typeof lightColors = {
  background: '#121113',
  surface: '#1C1B1E',
  surfaceAlt: '#232227',
  surfaceTint: '#2A292E',

  primary: '#FF6A4D',
  primaryDark: '#FF8A72',
  primarySoft: '#3A211B',

  text: '#F3F2F4',
  textSubtle: '#AEADB4',
  textFaint: '#78767E',

  border: '#2E2D33',
  borderStrong: '#3C3B42',

  success: '#3BB37D',
  successSoft: '#163626',
  warning: '#E6A64A',
  warningSoft: '#3A2E16',
  danger: '#F26368',
  dangerSoft: '#3C1D20',

  info: '#5E93DE',

  overlay: 'rgba(0,0,0,0.6)',
  overlayStrong: 'rgba(0,0,0,0.82)',
  white: '#FFFFFF',
  black: '#000000',
};

export type ThemeColors = typeof lightColors;

// Backward-compatible default (light). Do not mutate; migrated code uses useTheme.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.09,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 5 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 9 },
    default: {},
  }),
};

// Business profile: smooth, layered dark stage with warm gold accents.
// Reference proportions scale with screen width; never render a screenshot as UI.
export const businessProfileColors: ThemeColors = {
  ...darkColors,
  background: '#07090A', surface: '#111416', surfaceAlt: '#15191C', surfaceTint: '#1C2023',
  primary: '#F1C77F', primaryDark: '#F5D396', primarySoft: '#30271B',
  text: '#F6F6F5', textSubtle: '#ADB0BC', textFaint: '#858A96',
  border: '#202427', borderStrong: '#33383C',
  success: '#39C87B', danger: '#FF6B73', warning: '#F1C77F',
};
export const businessProfileLayout = {
  maxWidth: 960, coverRatio: 2.06, menuCoverRatio: 2.22,
  actionHeight: 60, menuButtonHeight: 48, campaignHeight: 60,
  menuRowHeight: 80, menuImageSize: 68, logoSize: 60, tabHeight: 52,
};

export const theme = { colors, spacing, radius, fontSize, fontWeight, shadow };
export type Theme = typeof theme;
