import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChartColors, Colors, Spacing } from '@/constants/theme';

interface ConcentrationItem {
  ticker: string;
  exposure: number;
  percentage: number;
}

const BAR_COLORS = [
  ChartColors.accent,
  ChartColors.success,
  ChartColors.warning,
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
];

export function ConcentrationList({ items }: { items: ConcentrationItem[] }) {
  if (items.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        No active open trades.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.ticker} style={styles.row}>
          <View style={styles.header}>
            <ThemedText style={styles.ticker}>{item.ticker}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.exposure}>
              ${item.exposure.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                },
              ]}
            />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.percent}>
            {item.percentage.toFixed(1)}%
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  row: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticker: {
    fontWeight: '700',
    fontSize: 15,
  },
  exposure: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.dark.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percent: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontSize: 14,
    padding: Spacing.three,
  },
});
