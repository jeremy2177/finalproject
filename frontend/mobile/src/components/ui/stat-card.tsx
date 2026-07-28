import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

type Variant = 'default' | 'accent' | 'positive' | 'negative' | 'warning' | 'danger';

const borderColors: Record<Variant, string> = {
  default: Colors.dark.border,
  accent: Colors.dark.accent,
  positive: Colors.dark.success,
  negative: Colors.dark.danger,
  warning: Colors.dark.warning,
  danger: Colors.dark.danger,
};

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: Variant;
  valueColor?: string;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = 'default',
  valueColor,
  style,
}: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: borderColors[variant] }, style]}>
      <ThemedText themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </ThemedText>
      {subtitle ? (
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flex: 1,
    minWidth: '45%',
    gap: 4,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
