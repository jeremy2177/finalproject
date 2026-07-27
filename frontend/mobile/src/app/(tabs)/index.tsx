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
import { router, useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import Svg, { Line } from 'react-native-svg';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { formatCurrency, formatPercent, AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width - AcaciaSpacing.lg * 2;

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setError('');
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !user) {
        router.replace('/login' as any);
        return;
      }
      if (user) {
        loadDashboard();
      }
    }, [user, authLoading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingSpinner message="Loading Dashboard..." />;
  }

  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <ErrorBanner message={error} />
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { summary, monthlyIncome, openPositions, recentActivity } = data || {};

  const chartLabels = (monthlyIncome || []).slice(-6).map((d: any) => d.label);
  const chartValues = (monthlyIncome || []).slice(-6).map((d: any) => d.totalPremium || 0);

  const hasChartData = chartValues.some((v: number) => v > 0);

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
        {/* Header section */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Covered Calls Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Your real-time options writing and premium harvest overview.
          </Text>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {/* 2x2 Summary Stat Cards Grid */}
        <View style={styles.grid2x2}>
          <View style={styles.gridItem}>
            <StatCard
              label="Total Realized P&L"
              value={formatCurrency(summary?.totalPnL || 0)}
              variant={summary?.totalPnL >= 0 ? 'positive' : 'negative'}
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="Win Rate"
              value={formatPercent(summary?.winRate || 0)}
              variant="accent"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="Open Positions"
              value={`${summary?.openPositions || 0}`}
              subtext={`(${summary?.openTrades || 0} calls sold)`}
              variant="warning"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="30-Day Premium"
              value={formatCurrency(summary?.monthlyIncome || 0)}
              variant="positive"
            />
          </View>
        </View>

        {/* Income History Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income History (Recent Months)</Text>
          {hasChartData ? (
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
                color: (opacity = 1) => `rgba(79, 142, 247, ${opacity})`,
                labelColor: () => AcaciaColors.textSecondary,
                style: {
                  borderRadius: AcaciaRadii.md,
                },
                barPercentage: 0.6,
              }}
              style={styles.chart}
              showValuesOnTopOfBars={false}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>No historical income data</Text>
            </View>
          )}
        </View>

        {/* Open Call Positions */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Open Call Positions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/positions' as any)}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>

          {(!openPositions || openPositions.length === 0) ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Open Positions</Text>
              <Text style={styles.emptyStateText}>
                Log your first covered call purchase.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/add-position' as any)}>
                <Text style={styles.actionButtonText}>Create Position</Text>
              </TouchableOpacity>
            </View>
          ) : (
            openPositions.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={styles.positionItem}
                onPress={() => router.push(`/position/${p.id}` as any)}>
                <View style={styles.positionHeaderRow}>
                  <Text style={styles.tickerText}>{p.ticker}</Text>
                  <Badge status="active" />
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shares:</Text>
                  <Text style={styles.detailValue}>{p.shares_owned}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cost Basis:</Text>
                  <Text style={styles.detailValue}>
                    ${parseFloat(p.avg_cost_basis).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Premium Rec:</Text>
                  <Text style={[styles.detailValue, { color: AcaciaColors.success }]}>
                    ${parseFloat(p.total_premium || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Open Trades:</Text>
                  <Text style={styles.detailValue}>{p.open_trades}</Text>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.deepDiveText}>Detail Deep Dive →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity Feed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {(!recentActivity || recentActivity.length === 0) ? (
            <Text style={styles.emptyText}>No recent trades logged.</Text>
          ) : (
            recentActivity.map((a: any) => (
              <View key={a.id} style={styles.activityRow}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTicker}>{a.ticker}</Text>
                  <Badge status={a.status} />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityMeta}>
                    Opened: {a.opened_at} | Strike: ${parseFloat(a.strike_price).toFixed(2)}
                  </Text>
                  <Text style={styles.activityMeta}>
                    Expiry: {a.expiration_date} | Premium: ${parseFloat(a.premium_received).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/add-position' as any)}
        activeOpacity={0.8}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      </TouchableOpacity>
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
    gap: AcaciaSpacing.lg,
    paddingBottom: AcaciaSpacing['4xl'],
  },
  pageHeader: {
    gap: AcaciaSpacing.xs,
  },
  pageTitle: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  pageSubtitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -AcaciaSpacing.xs,
  },
  gridItem: {
    width: '50%',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.accent,
    fontWeight: '600',
  },
  chart: {
    marginVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.md,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: AcaciaSpacing.lg,
    gap: AcaciaSpacing.sm,
  },
  emptyStateTitle: {
    fontSize: AcaciaFontSizes.base,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  emptyStateText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  actionButton: {
    backgroundColor: AcaciaColors.accent,
    paddingHorizontal: AcaciaSpacing.lg,
    paddingVertical: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    marginTop: AcaciaSpacing.xs,
  },
  actionButtonText: {
    color: AcaciaColors.white,
    fontWeight: '600',
    fontSize: AcaciaFontSizes.sm,
  },
  positionItem: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.md,
    gap: AcaciaSpacing.xs,
  },
  positionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AcaciaSpacing.xs,
  },
  tickerText: {
    fontSize: AcaciaFontSizes.lg,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  detailValue: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  itemFooter: {
    marginTop: AcaciaSpacing.xs,
    paddingTop: AcaciaSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: AcaciaColors.border,
  },
  deepDiveText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.accent,
    fontWeight: '600',
  },
  activityRow: {
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
    paddingVertical: AcaciaSpacing.sm,
    gap: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTicker: {
    fontSize: AcaciaFontSizes.base,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  activityBody: {
    gap: 2,
  },
  activityMeta: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: AcaciaSpacing.lg,
    bottom: AcaciaSpacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AcaciaColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: AcaciaColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
