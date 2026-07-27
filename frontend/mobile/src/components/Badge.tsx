import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

export type BadgeStatus = 'open' | 'closed' | 'assigned' | 'expired' | 'active';

interface BadgeProps {
  status: BadgeStatus | string;
  label?: string;
  style?: ViewStyle;
}

export function Badge({ status, label, style }: BadgeProps) {
  const normalized = (status || '').toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'open':
      case 'active':
        return {
          bg: AcaciaColors.badgeOpen,
          color: AcaciaColors.accent,
          border: AcaciaColors.badgeOpenBorder,
        };
      case 'closed':
        return {
          bg: AcaciaColors.badgeClosed,
          color: AcaciaColors.success,
          border: AcaciaColors.badgeClosedBorder,
        };
      case 'assigned':
        return {
          bg: AcaciaColors.badgeAssigned,
          color: AcaciaColors.warning,
          border: AcaciaColors.badgeAssignedBorder,
        };
      case 'expired':
      default:
        return {
          bg: AcaciaColors.badgeExpired,
          color: AcaciaColors.textSecondary,
          border: AcaciaColors.badgeExpiredBorder,
        };
    }
  };

  const badgeStyle = getStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeStyle.bg,
          borderColor: badgeStyle.border,
        },
        style,
      ]}>
      <Text style={[styles.text, { color: badgeStyle.color }]}>
        {label || status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: AcaciaSpacing.sm,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
