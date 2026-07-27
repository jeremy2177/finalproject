import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'positive' | 'negative' | 'warning' | 'accent' | 'danger' | 'default';
  style?: ViewStyle;
}

export function StatCard({ label, value, subtext, variant = 'default', style }: StatCardProps) {
  const getBorderColor = () => {
    switch (variant) {
      case 'positive':
        return AcaciaColors.success;
      case 'negative':
      case 'danger':
        return AcaciaColors.danger;
      case 'warning':
        return AcaciaColors.warning;
      case 'accent':
        return AcaciaColors.accent;
      default:
        return AcaciaColors.border;
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'positive':
        return AcaciaColors.success;
      case 'negative':
      case 'danger':
        return AcaciaColors.danger;
      case 'warning':
        return AcaciaColors.warning;
      default:
        return AcaciaColors.textPrimary;
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getBorderColor(), borderLeftWidth: variant !== 'default' ? 3 : 1 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.lg,
    gap: AcaciaSpacing.xs,
  },
  label: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
  },
  subtext: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
});
