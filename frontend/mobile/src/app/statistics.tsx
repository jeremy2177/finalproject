import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ConcentrationList } from '@/components/ui/concentration-list';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingView } from '@/components/ui/loading-view';
import { MoneynessBar } from '@/components/ui/moneyness-bar';
import { MonthlyBarChart } from '@/components/ui/monthly-bar-chart';
import { PillSelector } from '@/components/ui/pill-selector';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { StatCard } from '@/components/ui/stat-card';
import { ChartColors, Colors, formatCurrency, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

type TabKey = 'overview' | 'income' | 'performance' | 'risk';

const TAB_OPTIONS: { label: string; value: TabKey }[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Income', value: 'income' },
  { label: 'Performance', value: 'performance' },
  { label: 'Risk', value: 'risk' },
];

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getStatistics();
        setData(res as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingView />;
  if (error) {
    return (
      <ScreenScrollView>
        <ErrorBanner message={error} />
      </ScreenScrollView>
    );
  }
  if (!data) return null;

  const summary = data.summary as Record<string, number>;
  const monthlyIncome = data.monthlyIncome as { label: string; totalPremium: number; netPnL: number }[];
  const rolling = data.rolling as { r30: number; r60: number; r90: number };
  const incomeTicker = data.incomeTicker as {
    ticker: string;
    trade_count: number;
    total_premium: number;
    net_pnl: number;
  }[];
  const annualizedTicker = data.annualizedTicker as {
    ticker: string;
    trade_count: number;
    closed: number;
    wins: number;
    avg_annualized: number;
  }[];
  const performance = data.performance as Record<string, unknown>;
  const risk = data.risk as Record<string, unknown>;

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Advanced Statistics
        </ThemedText>
        <ThemedText themeColor="textSecondary">Deep analytics for your covered call portfolio</ThemedText>
      </View>

      <PillSelector options={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              label="Total Premium Harvested"
              value={formatCurrency(summary.totalPremium)}
              variant="accent"
              valueColor={ChartColors.success}
            />
            <StatCard
              label="Realized P&L"
              value={`${summary.totalPnL >= 0 ? '+' : ''}${formatCurrency(summary.totalPnL)}`}
              variant={summary.totalPnL >= 0 ? 'positive' : 'negative'}
              valueColor={summary.totalPnL >= 0 ? ChartColors.success : ChartColors.danger}
            />
            <StatCard
              label="Option Win Rate"
              value={`${summary.winRate.toFixed(2)}%`}
              subtitle={`${summary.winCount} wins / ${summary.totalClosedTrades} closed`}
              variant="positive"
              valueColor={ChartColors.success}
            />
            <StatCard
              label="Avg Trade Yield (ROC)"
              value={`${summary.avgReturnPerTrade.toFixed(2)}%`}
              variant="warning"
              valueColor={ChartColors.success}
            />
          </View>

          <Card title="Portfolio Performance Indicators">
            <MetricRow label="Mean Annualized Return" value={`${summary.avgAnnualizedReturn.toFixed(2)}%`} positive />
            <MetricRow label="Average Days Option Held" value={`${summary.avgDaysHeld} Days`} />
            <MetricRow label="Open Positions Active" value={`${summary.openPositions}`} />
            <MetricRow label="Assignment Frequency" value={`${summary.assignmentRate.toFixed(2)}%`} warning />
          </Card>

          <Card title="Ticker Performance Ranking">
            {annualizedTicker.length === 0 ? (
              <ThemedText themeColor="textSecondary">No closed trade data available.</ThemedText>
            ) : (
              <FlatList
                data={annualizedTicker}
                scrollEnabled={false}
                keyExtractor={(t) => t.ticker}
                renderItem={({ item: t }) => (
                  <View style={styles.tableRow}>
                    <ThemedText style={styles.tableTicker}>{t.ticker}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.tableCell}>
                      {t.trade_count} trades
                    </ThemedText>
                    <ThemedText style={[styles.tableCell, { color: ChartColors.success }]}>
                      {t.closed > 0 ? ((t.wins / t.closed) * 100).toFixed(1) : '0.0'}%
                    </ThemedText>
                    <ThemedText style={[styles.tableCell, { color: ChartColors.success }]}>
                      {t.avg_annualized.toFixed(2)}%
                    </ThemedText>
                  </View>
                )}
              />
            )}
          </Card>
        </>
      )}

      {activeTab === 'income' && (
        <>
          <View style={styles.statGrid}>
            <StatCard label="30-Day Premium" value={formatCurrency(rolling.r30)} variant="positive" valueColor={ChartColors.success} />
            <StatCard label="60-Day Premium" value={formatCurrency(rolling.r60)} variant="positive" valueColor={ChartColors.success} />
            <StatCard label="90-Day Premium" value={formatCurrency(rolling.r90)} variant="positive" valueColor={ChartColors.success} />
          </View>

          <Card title="Monthly Premium Income">
            <MonthlyBarChart data={monthlyIncome} height={240} />
          </Card>

          <Card title="Premium Income By Ticker">
            <FlatList
              data={incomeTicker}
              scrollEnabled={false}
              keyExtractor={(t) => t.ticker}
              renderItem={({ item: t }) => (
                <View style={styles.incomeRow}>
                  <ThemedText style={styles.tableTicker}>{t.ticker}</ThemedText>
                  <ThemedText themeColor="textSecondary">{t.trade_count} trades</ThemedText>
                  <ThemedText style={{ color: ChartColors.success }}>${t.total_premium.toFixed(2)}</ThemedText>
                  <ThemedText style={{ color: t.net_pnl >= 0 ? ChartColors.success : ChartColors.danger }}>
                    {t.net_pnl >= 0 ? '+' : ''}${t.net_pnl.toFixed(2)}
                  </ThemedText>
                </View>
              )}
            />
          </Card>
        </>
      )}

      {activeTab === 'performance' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              label="Best Single Trade P&L"
              value={
                performance.bestTrade
                  ? `+$${(performance.bestTrade as { profit_loss: number }).profit_loss.toFixed(2)}`
                  : '--'
              }
              variant="positive"
              valueColor={ChartColors.success}
            />
            <StatCard
              label="Worst Single Trade P&L"
              value={
                performance.worstTrade
                  ? `$${(performance.worstTrade as { profit_loss: number }).profit_loss.toFixed(2)}`
                  : '--'
              }
              variant="negative"
              valueColor={ChartColors.danger}
            />
            <StatCard label="Avg Days to Expiry" value={`${performance.avgDTE} Days`} variant="accent" />
            <StatCard
              label="Avg Implied Volatility"
              value={
                (performance.avgIV as number) > 0
                  ? `${(performance.avgIV as number).toFixed(2)}%`
                  : '--'
              }
              variant="warning"
              valueColor={ChartColors.warning}
            />
          </View>

          <Card title="Trading Win/Loss Streaks">
            <MetricRow label="Longest Winning Streak" value={`${performance.maxWinStreak} Wins`} positive />
            <MetricRow label="Longest Losing Streak" value={`${performance.maxLossStreak} Losses`} danger />
            <MetricRow label="Current Winning Streak" value={`${performance.currentWinStreak} Wins`} positive />
            <MetricRow label="Current Losing Streak" value={`${performance.currentLossStreak} Losses`} danger />
          </Card>

          <Card title="Moneyness Strike Distribution">
            <MoneynessBar
              items={
                (performance.strikeAnalysis as { moneyness: string; count: number }[]) ?? []
              }
            />
          </Card>
        </>
      )}

      {activeTab === 'risk' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              label="Max Assignment Exposure"
              value={formatCurrency(risk.maxExposure as number)}
              variant="danger"
              valueColor={ChartColors.danger}
            />
            <StatCard
              label="Assignment Rate"
              value={`${(risk.assignmentRate as number).toFixed(2)}%`}
              subtitle={`${risk.assignedCount} / ${risk.totalClosedTrades} closed`}
              variant="warning"
              valueColor={ChartColors.warning}
            />
            <StatCard
              label="Max Drawdown"
              value={`$${(risk.maxDrawdown as number).toFixed(2)}`}
              variant="danger"
              valueColor={ChartColors.danger}
            />
            <StatCard
              label="Max Single Ticker Risk"
              value={
                (risk.concentration as { percentage: number; ticker: string }[])?.length > 0
                  ? `${(risk.concentration as { percentage: number }[])[0].percentage.toFixed(1)}%`
                  : '0.0%'
              }
              subtitle={
                (risk.concentration as { ticker: string }[])?.[0]?.ticker
                  ? `Ticker: ${(risk.concentration as { ticker: string }[])[0].ticker}`
                  : undefined
              }
              variant="accent"
            />
          </View>

          <Card title="Risk Exposure Concentration">
            <ConcentrationList
              items={
                (risk.concentration as { ticker: string; exposure: number; percentage: number }[]) ??
                []
              }
            />
          </Card>
        </>
      )}
    </ScreenScrollView>
  );
}

function MetricRow({
  label,
  value,
  positive,
  danger,
  warning,
}: {
  label: string;
  value: string;
  positive?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  const color = positive
    ? ChartColors.success
    : danger
      ? ChartColors.danger
      : warning
        ? ChartColors.warning
        : Colors.dark.text;

  return (
    <View style={styles.metricRow}>
      <ThemedText themeColor="textSecondary" style={styles.metricLabel}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  metricLabel: {
    fontSize: 14,
    flex: 1,
  },
  metricValue: {
    fontWeight: '700',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tableTicker: {
    fontWeight: '700',
    width: 60,
  },
  tableCell: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: Spacing.one,
  },
});
