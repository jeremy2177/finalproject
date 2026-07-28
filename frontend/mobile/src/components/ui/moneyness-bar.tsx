import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChartColors, Colors, Spacing } from '@/constants/theme';

interface StrikeAnalysisItem {
  moneyness: string;
  count: number;
}

const SEGMENT_COLORS: Record<string, string> = {
  OTM: ChartColors.success,
  ATM: ChartColors.warning,
  ITM: ChartColors.danger,
};

export function MoneynessBar({ items }: { items: StrikeAnalysisItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        No moneyness data available.
      </ThemedText>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {items.map((item) => {
          const width = (item.count / total) * 100;
          if (width === 0) return null;
          return (
            <View
              key={item.moneyness}
              style={[
                styles.segment,
                {
                  width: `${width}%`,
                  backgroundColor: SEGMENT_COLORS[item.moneyness] ?? ChartColors.accent,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        {items.map((item) => (
          <View key={item.moneyness} style={styles.labelRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: SEGMENT_COLORS[item.moneyness] ?? ChartColors.accent },
              ]}
            />
            <ThemedText style={styles.labelText}>
              {item.moneyness}: {item.count} ({((item.count / total) * 100).toFixed(0)}%)
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  bar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.dark.border,
  },
  segment: {
    height: '100%',
  },
  labels: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 13,
  },
  empty: {
    fontSize: 14,
    padding: Spacing.two,
  },
});
