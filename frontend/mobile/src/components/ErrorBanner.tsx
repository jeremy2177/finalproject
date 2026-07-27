import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

interface ErrorBannerProps {
  message: string;
  style?: ViewStyle;
}

export function ErrorBanner({ message, style }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.md,
    marginVertical: AcaciaSpacing.sm,
  },
  text: {
    color: AcaciaColors.danger,
    fontSize: AcaciaFontSizes.sm,
  },
});
