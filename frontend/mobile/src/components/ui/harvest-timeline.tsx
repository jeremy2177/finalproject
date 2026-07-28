import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChartColors, Colors, Spacing } from '@/constants/theme';

interface HarvestPoint {
  label: string;
  premium: number;
  pnl: number;
}

export function HarvestTimeline({ data }: { data: HarvestPoint[] }) {
  if (data.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        Not enough data to render progression.
      </ThemedText>
    );
  }

  const maxPremium = Math.max(...data.map((d) => d.premium), 1);

  return (
    <View style={styles.container}>
      {data.map((point, index) => {
        const isLast = index === data.length - 1;
        const barWidth = `${Math.max((point.premium / maxPremium) * 100, 8)}%`;

        return (
          <View key={point.label} style={styles.step}>
            <View style={styles.timeline}>
              <View style={styles.dot} />
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.label}>{point.label}</ThemedText>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth as `${number}%` }]} />
              </View>
              <View style={styles.values}>
                <ThemedText style={{ color: ChartColors.accent, fontSize: 12 }}>
                  Premium: ${point.premium.toFixed(2)}
                </ThemedText>
                <ThemedText
                  style={{
                    color: point.pnl >= 0 ? ChartColors.success : ChartColors.danger,
                    fontSize: 12,
                  }}>
                  P&L: {point.pnl >= 0 ? '+' : ''}${point.pnl.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeline: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ChartColors.accent,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.dark.border,
    marginTop: 4,
    minHeight: 40,
  },
  content: {
    flex: 1,
    gap: 4,
    paddingBottom: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: ChartColors.accent,
    borderRadius: 3,
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  empty: {
    fontSize: 14,
    padding: Spacing.three,
    textAlign: 'center',
  },
});
