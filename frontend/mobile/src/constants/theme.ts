/**
 * Acacia Trades — Theme Constants
 * Matches the web dashboard dark theme design tokens
 */

import { Platform } from 'react-native';

// ─── Acacia Dark Theme Colors ───────────────────────────────
export const AcaciaColors = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surface2: '#22263a',
  border: '#2e3347',
  accent: '#4f8ef7',
  accentHover: '#6ba3ff',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  textPrimary: '#e8eaf0',
  textSecondary: '#8892aa',
  textMuted: '#4a5568',
  white: '#ffffff',
  // Badge backgrounds
  badgeOpen: 'rgba(79, 142, 247, 0.15)',
  badgeClosed: 'rgba(34, 197, 94, 0.15)',
  badgeAssigned: 'rgba(245, 158, 11, 0.15)',
  badgeExpired: 'rgba(136, 146, 170, 0.15)',
  // Badge borders
  badgeOpenBorder: 'rgba(79, 142, 247, 0.3)',
  badgeClosedBorder: 'rgba(34, 197, 94, 0.3)',
  badgeAssignedBorder: 'rgba(245, 158, 11, 0.3)',
  badgeExpiredBorder: 'rgba(136, 146, 170, 0.3)',
  // Login gradient
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  // Chart colors
  chartAccent: 'rgba(79, 142, 247, 0.7)',
  chartSuccess: 'rgba(34, 197, 94, 0.7)',
  chartDanger: 'rgba(239, 68, 68, 0.7)',
} as const;

// ─── Spacing (consistent 4/8pt grid) ───────────────────────
export const AcaciaSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ─── Border Radii ───────────────────────────────────────────
export const AcaciaRadii = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

// ─── Font Sizes ─────────────────────────────────────────────
export const AcaciaFontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

// ─── Font Families ──────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    mono: 'monospace',
  },
})!;

// ─── Helpers ────────────────────────────────────────────────
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Kept for backwards compatibility with existing theme file imports
export const Colors = {
  light: {
    text: AcaciaColors.textPrimary,
    background: AcaciaColors.bg,
    backgroundElement: AcaciaColors.surface,
    backgroundSelected: AcaciaColors.surface2,
    textSecondary: AcaciaColors.textSecondary,
  },
  dark: {
    text: AcaciaColors.textPrimary,
    background: AcaciaColors.bg,
    backgroundElement: AcaciaColors.surface,
    backgroundSelected: AcaciaColors.surface2,
    textSecondary: AcaciaColors.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
