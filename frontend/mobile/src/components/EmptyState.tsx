import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: AcaciaSpacing['2xl'],
    borderWidth: 2,
    borderColor: AcaciaColors.border,
    borderStyle: 'dashed',
    borderRadius: AcaciaRadii.lg,
    backgroundColor: 'rgba(26, 29, 39, 0.3)',
    marginVertical: AcaciaSpacing.md,
  },
  title: {
    fontSize: AcaciaFontSizes.lg,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
    marginBottom: AcaciaSpacing.xs,
  },
  message: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    textAlign: 'center',
    marginBottom: AcaciaSpacing.lg,
  },
  button: {
    backgroundColor: AcaciaColors.accent,
    paddingHorizontal: AcaciaSpacing.lg,
    paddingVertical: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
  },
  buttonText: {
    color: AcaciaColors.white,
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
  },
});
