import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { formatCurrency, formatPercent, AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width - AcaciaSpacing.lg * 2;

type TabType = 'tab-overview' | 'tab-income' | 'tab-performance' | 'tab-risk';

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('tab-overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setError('');
      const res = await api.getStatistics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Calculating Statistics..." />;
  }

  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <ErrorBanner message={error} />
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    summary = {},
    monthlyIncome = [],
    rolling = {},
    incomeTicker = [],
    annualizedTicker = [],
    performance = {},
    risk = {},
  } = data || {};

  const chartLabels = monthlyIncome.map((d: any) => d.label);
  const chartValues = monthlyIncome.map((d: any) => d.totalPremium || 0);

  return (
    <View style={styles.flexContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AcaciaColors.accent}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Advanced Analytics</Text>
          <Text style={styles.subtitle}>
            Deep analytics engine for historical covered calls options performance.
          </Text>
        </View>

        <ErrorBanner message={error} />

        {/* Tab selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabBar}>
            {[
              { id: 'tab-overview', label: 'Overview' },
              { id: 'tab-income', label: 'Income' },
              { id: 'tab-performance', label: 'Performance' },
              { id: 'tab-risk', label: 'Risk Analysis' },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tabButton,
                  activeTab === t.id && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab(t.id as TabType)}>
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === t.id && styles.activeTabButtonText,
                  ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'tab-overview' && (
          <View style={styles.sectionGap}>
            <View style={styles.grid2x2}>
              <View style={styles.gridItem}>
                <StatCard
                  label="Total Premium"
                  value={formatCurrency(summary.totalPremium || 0)}
                  subtext="Gross premium harvested"
                  variant="accent"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Realized P&L"
                  value={formatCurrency(summary.totalPnL || 0)}
                  subtext="Net profit / loss"
                  variant={summary.totalPnL >= 0 ? 'positive' : 'negative'}
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Option Win Rate"
                  value={formatPercent(summary.winRate || 0)}
                  subtext={`${summary.winCount || 0}/${summary.totalClosedTrades || 0} wins`}
                  variant="positive"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Avg Trade Yield"
                  value={formatPercent(summary.avgReturnPerTrade || 0)}
                  subtext="Mean ROC per trade"
                  variant="warning"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Portfolio Key Indicators</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Mean Annualized Return:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.success }]}>
                  {formatPercent(summary.avgAnnualizedReturn || 0)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Average Days Option Held:</Text>
                <Text style={styles.metricValue}>{summary.avgDaysHeld || 0} Days</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Active Open Positions:</Text>
                <Text style={styles.metricValue}>{summary.openPositions || 0}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Assignment Frequency:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.warning }]}>
                  {formatPercent(summary.assignmentRate || 0)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ticker Performance Ranking</Text>
              {annualizedTicker.length === 0 ? (
                <Text style={styles.emptyText}>No closed trade rankings yet.</Text>
              ) : (
                annualizedTicker.map((t: any) => (
                  <View key={t.ticker} style={styles.tableRow}>
                    <Text style={styles.tableTicker}>{t.ticker}</Text>
                    <Text style={styles.tableText}>{t.trade_count} trades</Text>
                    <Text style={[styles.tableText, { color: AcaciaColors.success }]}>
                      {formatPercent(t.avg_annualized || 0)} ARR
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ─── TAB 2: INCOME ANALYTICS ─── */}
        {activeTab === 'tab-income' && (
          <View style={styles.sectionGap}>
            <View style={styles.grid3Col}>
              <View style={styles.gridItemSmall}>
                <StatCard
                  label="30-Day Income"
                  value={formatCurrency(rolling.r30 || 0)}
                  variant="positive"
                />
              </View>
              <View style={styles.gridItemSmall}>
                <StatCard
                  label="60-Day Income"
                  value={formatCurrency(rolling.r60 || 0)}
                  variant="positive"
                />
              </View>
              <View style={styles.gridItemSmall}>
                <StatCard
                  label="90-Day Income"
                  value={formatCurrency(rolling.r90 || 0)}
                  variant="positive"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Monthly Premium Income</Text>
              {chartValues.length > 0 ? (
                <BarChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartValues }],
                  }}
                  width={screenWidth - AcaciaSpacing.lg * 2}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: AcaciaColors.surface,
                    backgroundGradientFrom: AcaciaColors.surface,
                    backgroundGradientTo: AcaciaColors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    labelColor: () => AcaciaColors.textSecondary,
                    style: { borderRadius: AcaciaRadii.md },
                    barPercentage: 0.6,
                  }}
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.emptyText}>No monthly data available</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Income Generated By Ticker</Text>
              {incomeTicker.map((t: any) => (
                <View key={t.ticker} style={styles.tableRow}>
                  <Text style={styles.tableTicker}>{t.ticker}</Text>
                  <Text style={styles.tableText}>{t.trade_count} trades</Text>
                  <Text style={[styles.tableText, { color: AcaciaColors.success }]}>
                    ${parseFloat(t.total_premium || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── TAB 3: PERFORMANCE ─── */}
        {activeTab === 'tab-performance' && (
          <View style={styles.sectionGap}>
            <View style={styles.grid2x2}>
              <View style={styles.gridItem}>
                <StatCard
                  label="🏆 Best Single Trade"
                  value={
                    performance.bestTrade
                      ? `+$${parseFloat(performance.bestTrade.profit_loss).toFixed(2)}`
                      : '--'
                  }
                  subtext={performance.bestTrade ? `${performance.bestTrade.ticker}` : ''}
                  variant="positive"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="🚨 Worst Single Trade"
                  value={
                    performance.worstTrade
                      ? `$${parseFloat(performance.worstTrade.profit_loss).toFixed(2)}`
                      : '--'
                  }
                  subtext={performance.worstTrade ? `${performance.worstTrade.ticker}` : ''}
                  variant="negative"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Avg DTE (Entry)"
                  value={`${performance.avgDTE || 0} Days`}
                  subtext="Target range 30-45d"
                  variant="accent"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Avg Implied Vol (IV)"
                  value={
                    performance.avgIV > 0
                      ? formatPercent(performance.avgIV)
                      : '--'
                  }
                  subtext="Vol premium thickener"
                  variant="warning"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trading Win/Loss Streaks</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Longest Win Streak:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.success }]}>
                  {performance.maxWinStreak || 0} Wins
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Longest Loss Streak:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.danger }]}>
                  {performance.maxLossStreak || 0} Losses
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Current Win Streak:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.success }]}>
                  {performance.currentWinStreak || 0} Wins
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Current Loss Streak:</Text>
                <Text style={[styles.metricValue, { color: AcaciaColors.danger }]}>
                  {performance.currentLossStreak || 0} Losses
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Moneyness Strike Distribution</Text>
              {(!performance.strikeAnalysis || performance.strikeAnalysis.length === 0) ? (
                <Text style={styles.emptyText}>No moneyness data recorded.</Text>
              ) : (
                performance.strikeAnalysis.map((sa: any, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableTicker}>{sa.moneyness}</Text>
                    <Text style={styles.tableText}>{sa.count} trades</Text>
                    <Text style={[styles.tableText, { color: AcaciaColors.success }]}>
                      {formatPercent(sa.avg_roc || 0)} ROC
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ─── TAB 4: RISK ANALYSIS ─── */}
        {activeTab === 'tab-risk' && (
          <View style={styles.sectionGap}>
            <View style={styles.grid2x2}>
              <View style={styles.gridItem}>
                <StatCard
                  label="Max Exposure"
                  value={formatCurrency(risk.maxExposure || 0)}
                  subtext="Bound assignment capital"
                  variant="danger"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Assignment Rate"
                  value={formatPercent(risk.assignmentRate || 0)}
                  subtext={`${risk.assignedCount || 0} assignments`}
                  variant="warning"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Max Drawdown"
                  value={formatCurrency(risk.maxDrawdown || 0)}
                  subtext="Peak-to-valley loss"
                  variant="danger"
                />
              </View>
              <View style={styles.gridItem}>
                <StatCard
                  label="Single Ticker Risk"
                  value={
                    risk.concentration && risk.concentration.length > 0
                      ? formatPercent(risk.concentration[0].percentage)
                      : '0.0%'
                  }
                  subtext={risk.concentration?.[0]?.ticker || 'None'}
                  variant="accent"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ticker Risk Concentration Breakdown</Text>
              {(!risk.concentration || risk.concentration.length === 0) ? (
                <Text style={styles.emptyText}>No open trades to calculate risk distribution.</Text>
              ) : (
                risk.concentration.map((c: any) => (
                  <View key={c.ticker} style={styles.tableRow}>
                    <Text style={styles.tableTicker}>{c.ticker}</Text>
                    <Text style={styles.tableText}>
                      ${c.exposure.toLocaleString()}
                    </Text>
                    <Text style={[styles.tableText, { color: AcaciaColors.accent }]}>
                      {formatPercent(c.percentage || 0, 1)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: AcaciaColors.bg,
  },
  container: {
    padding: AcaciaSpacing.lg,
    gap: AcaciaSpacing.md,
    paddingBottom: AcaciaSpacing['4xl'],
  },
  header: {
    gap: AcaciaSpacing.xs,
  },
  title: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  subtitle: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  tabScroll: {
    marginHorizontal: -AcaciaSpacing.lg,
    paddingHorizontal: AcaciaSpacing.lg,
  },
  tabBar: {
    flexDirection: 'row',
    gap: AcaciaSpacing.xs,
    paddingVertical: AcaciaSpacing.xs,
  },
  tabButton: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.sm,
    borderRadius: AcaciaRadii.md,
  },
  activeTabButton: {
    backgroundColor: AcaciaColors.accent,
    borderColor: AcaciaColors.accent,
  },
  tabButtonText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: AcaciaColors.white,
  },
  sectionGap: {
    gap: AcaciaSpacing.md,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -AcaciaSpacing.xs,
  },
  grid3Col: {
    flexDirection: 'row',
    marginHorizontal: -AcaciaSpacing.xs,
  },
  gridItem: {
    width: '50%',
    padding: AcaciaSpacing.xs,
  },
  gridItemSmall: {
    width: '33.33%',
    padding: AcaciaSpacing.xs,
  },
  card: {
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.lg,
    gap: AcaciaSpacing.md,
  },
  cardTitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
    paddingBottom: AcaciaSpacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: AcaciaSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
  },
  metricLabel: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  metricValue: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: AcaciaSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
  },
  tableTicker: {
    fontSize: AcaciaFontSizes.base,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  tableText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  chart: {
    marginVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.md,
  },
  emptyText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    paddingVertical: AcaciaSpacing.sm,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: AcaciaColors.bg,
    padding: AcaciaSpacing.lg,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: AcaciaColors.surface2,
    padding: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
    marginTop: AcaciaSpacing.md,
  },
  retryText: {
    color: AcaciaColors.textPrimary,
    fontWeight: '600',
  },
});
