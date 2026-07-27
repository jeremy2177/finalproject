import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaSpacing } from '../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={AcaciaColors.accent} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AcaciaColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AcaciaSpacing.xl,
  },
  text: {
    marginTop: AcaciaSpacing.md,
    color: AcaciaColors.textSecondary,
    fontSize: AcaciaFontSizes.sm,
  },
});
