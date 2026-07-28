import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingView } from '@/components/ui/loading-view';
import { MonthlyBarChart } from '@/components/ui/monthly-bar-chart';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { StatCard } from '@/components/ui/stat-card';
import { ChartColors, Colors, formatCurrency, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

interface DashboardData {
  summary: {
    totalPnL: number;
    winRate: number;
    openPositions: number;
    openTrades: number;
    monthlyIncome: number;
  };
  monthlyIncome: { label: string; totalPremium: number; netPnL: number }[];
  openPositions: {
    id: number;
    ticker: string;
    shares_owned: number;
    avg_cost_basis: number;
    total_premium: number;
    open_trades: number;
  }[];
  recentActivity: {
    id: number;
    opened_at: string;
    ticker: string;
    strike_price: string;
    expiration_date: string;
    contracts: number;
    premium_received: string;
    status: string;
    profit_loss?: string;
  }[];
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = (await api.getDashboard()) as DashboardData;
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
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

  const { summary, monthlyIncome, openPositions, recentActivity } = data;

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Covered Calls Dashboard
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Your real-time options writing and premium harvest overview.
        </ThemedText>
      </View>

      <View style={styles.statGrid}>
        <StatCard
          label="Total Realized P&L"
          value={`${summary.totalPnL >= 0 ? '+' : ''}${formatCurrency(summary.totalPnL)}`}
          variant={summary.totalPnL >= 0 ? 'positive' : 'negative'}
          valueColor={summary.totalPnL >= 0 ? ChartColors.success : ChartColors.danger}
        />
        <StatCard
          label="Win Rate"
          value={`${summary.winRate.toFixed(2)}%`}
          variant="accent"
          valueColor={ChartColors.success}
        />
        <StatCard
          label="Open Positions"
          value={`${summary.openPositions}`}
          subtitle={`${summary.openTrades} calls sold`}
          variant="warning"
        />
        <StatCard
          label="30-Day Premium"
          value={formatCurrency(summary.monthlyIncome)}
          variant="positive"
          valueColor={ChartColors.success}
        />
      </View>

      <Card title="Income History (12 Months)">
        <MonthlyBarChart data={monthlyIncome} />
      </Card>

      <Card
        title="Open Call Positions"
        action={
          <Link href="/positions" asChild>
            <Pressable>
              <ThemedText style={styles.link}>View All</ThemedText>
            </Pressable>
          </Link>
        }>
        {openPositions.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary">No open positions</ThemedText>
            <Link href="/positions/add" asChild>
              <Pressable style={styles.primaryBtn}>
                <ThemedText style={styles.primaryBtnText}>Create Position</ThemedText>
              </Pressable>
            </Link>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {openPositions.map((p) => (
              <View key={p.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <ThemedText style={styles.ticker}>{p.ticker}</ThemedText>
                  <Badge status="active" />
                </View>
                <ThemedText themeColor="textSecondary" style={styles.detail}>
                  Shares: {p.shares_owned}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.detail}>
                  Cost Basis: ${p.avg_cost_basis.toFixed(2)}
                </ThemedText>
                <ThemedText style={[styles.detail, { color: ChartColors.success }]}>
                  Premium: ${p.total_premium.toFixed(2)}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.detail}>
                  Open Trades: {p.open_trades}
                </ThemedText>
                <Link href={`/positions/${p.id}`} asChild>
                  <Pressable style={styles.secondaryBtn}>
                    <ThemedText style={styles.secondaryBtnText}>Detail</ThemedText>
                  </Pressable>
                </Link>
              </View>
            ))}
          </ScrollView>
        )}
      </Card>

      <Card title="Recent Activity">
        {recentActivity.length === 0 ? (
          <ThemedText themeColor="textSecondary">No trades or positions logged yet.</ThemedText>
        ) : (
          <FlatList
            data={recentActivity}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item: a }) => (
              <View style={styles.activityRow}>
                <View style={styles.activityMain}>
                  <ThemedText style={styles.activityTicker}>{a.ticker}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.activityMeta}>
                    {a.opened_at} · ${parseFloat(a.strike_price).toFixed(2)} · {a.contracts}c
                  </ThemedText>
                </View>
                <View style={styles.activityRight}>
                  <Badge status={a.status} />
                  <ThemedText style={{ color: ChartColors.success, fontSize: 13 }}>
                    ${parseFloat(a.premium_received).toFixed(2)}
                  </ThemedText>
                  {a.status !== 'open' ? (
                    <ThemedText
                      style={{
                        color:
                          parseFloat(a.profit_loss || '0') >= 0
                            ? ChartColors.success
                            : ChartColors.danger,
                        fontSize: 12,
                      }}>
                      {parseFloat(a.profit_loss || '0') >= 0 ? '+' : ''}$
                      {parseFloat(a.profit_loss || '0').toFixed(2)}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            )}
          />
        )}
      </Card>

      <Link href="/positions/add" asChild>
        <Pressable style={styles.fab}>
          <ThemedText style={styles.fabText}>+</ThemedText>
        </Pressable>
      </Link>
    </ScreenScrollView>
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
  subtitle: {
    fontSize: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  link: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  positionCard: {
    width: 200,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginRight: Spacing.two,
    gap: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticker: {
    fontSize: 18,
    fontWeight: '700',
  },
  detail: {
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  activityMain: {
    flex: 1,
    gap: 2,
  },
  activityTicker: {
    fontWeight: '700',
    fontSize: 15,
  },
  activityMeta: {
    fontSize: 11,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
