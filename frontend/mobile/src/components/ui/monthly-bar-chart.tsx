import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChartColors, Colors, Spacing } from '@/constants/theme';

export interface MonthlyIncomePoint {
  label: string;
  totalPremium: number;
  netPnL: number;
}

interface MonthlyBarChartProps {
  data: MonthlyIncomePoint[];
  height?: number;
}

export function MonthlyBarChart({ data, height = 200 }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        No income data available
      </ThemedText>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [Math.abs(d.totalPremium), Math.abs(d.netPnL)]),
    1,
  );

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ChartColors.accent }]} />
          <ThemedText themeColor="textSecondary" style={styles.legendText}>
            Premium
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ChartColors.success }]} />
          <ThemedText themeColor="textSecondary" style={styles.legendText}>
            Net P&L
          </ThemedText>
        </View>
      </View>

      <View style={[styles.chart, { height }]}>
        {data.map((point) => {
          const premiumHeight = (Math.abs(point.totalPremium) / maxValue) * (height - 24);
          const pnlHeight = (Math.abs(point.netPnL) / maxValue) * (height - 24);
          const pnlColor = point.netPnL >= 0 ? ChartColors.success : ChartColors.danger;

          return (
            <View key={point.label} style={styles.group}>
              <View style={styles.barPair}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: premiumHeight,
                      backgroundColor: 'rgba(79, 142, 247, 0.75)',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: pnlHeight,
                      backgroundColor: pnlColor + 'BF',
                    },
                  ]}
                />
              </View>
              <ThemedText themeColor="textSecondary" style={styles.label} numberOfLines={1}>
                {point.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingBottom: Spacing.two,
  },
  group: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  bar: {
    width: '42%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    padding: Spacing.four,
  },
});
