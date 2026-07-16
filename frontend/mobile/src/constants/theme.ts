import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#e8eaf0',
    textSecondary: '#8892aa',
    background: '#0f1117',
    backgroundElement: '#1a1d27',
    backgroundSelected: '#22263a',
    border: '#2e3347',
    accent: '#4f8ef7',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
  dark: {
    text: '#e8eaf0',
    textSecondary: '#8892aa',
    background: '#0f1117',
    backgroundElement: '#1a1d27',
    backgroundSelected: '#22263a',
    border: '#2e3347',
    accent: '#4f8ef7',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const ChartColors = {
  accent: '#4f8ef7',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  border: '#2e3347',
  text: '#8892aa',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

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

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
