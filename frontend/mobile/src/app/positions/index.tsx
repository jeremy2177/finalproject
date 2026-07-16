import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingView } from '@/components/ui/loading-view';
import { PillSelector } from '@/components/ui/pill-selector';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { ChartColors, Colors, Spacing } from '@/constants/theme';
import { api, type PositionFilters } from '@/services/api';

interface Position {
  id: number;
  ticker: string;
  shares_owned: number;
  avg_cost_basis: string | number;
  effective_cost_basis: number;
  total_premium: number;
  total_pnl: number;
  trade_count: number;
  next_expiry?: string;
  days_to_next_expiry?: number;
  status: string;
}

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
  { label: 'Assigned', value: 'assigned' },
];

const SORT_OPTIONS = [
  { label: 'Opened', value: 'opened' },
  { label: 'Ticker', value: 'ticker' },
  { label: 'Status', value: 'status' },
  { label: 'Cost', value: 'cost' },
];

export default function PositionsScreen() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [filters, setFilters] = useState<PositionFilters>({
    status: 'all',
    ticker: '',
    sort: 'opened',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    api.getTickers().then((res) => setTickers(res as string[])).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadPositions() {
      setLoading(true);
      try {
        const res = (await api.getPositions(filters)) as Position[];
        setPositions(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load positions');
      } finally {
        setLoading(false);
      }
    }
    loadPositions();
  }, [filters]);

  return (
    <ScreenScrollView withTabInset={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="subtitle" style={styles.title}>
            Positions
          </ThemedText>
          <Link href="/positions/add" asChild>
            <Pressable style={styles.addBtn}>
              <ThemedText style={styles.addBtnText}>+ Add</ThemedText>
            </Pressable>
          </Link>
        </View>
        <ThemedText themeColor="textSecondary">
          Track underlying holdings and premium harvests
        </ThemedText>
      </View>

      <Card>
        <ThemedText type="smallBold" style={styles.filterLabel}>
          Status
        </ThemedText>
        <PillSelector
          options={STATUS_OPTIONS}
          value={filters.status ?? 'all'}
          onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
        />

        <ThemedText type="smallBold" style={styles.filterLabel}>
          Ticker
        </ThemedText>
        <PillSelector
          options={[{ label: 'All Tickers', value: '' }, ...tickers.map((t) => ({ label: t, value: t }))]}
          value={filters.ticker ?? ''}
          onChange={(ticker) => setFilters((prev) => ({ ...prev, ticker }))}
        />

        <ThemedText type="smallBold" style={styles.filterLabel}>
          Sort By
        </ThemedText>
        <PillSelector
          options={SORT_OPTIONS}
          value={filters.sort ?? 'opened'}
          onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))}
        />
      </Card>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : positions.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No positions found under current filters.
          </ThemedText>
          <Link href="/positions/add" asChild>
            <Pressable style={styles.addBtn}>
              <ThemedText style={styles.addBtnText}>Log Position</ThemedText>
            </Pressable>
          </Link>
        </Card>
      ) : (
        <FlatList
          data={positions}
          scrollEnabled={false}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item: p }) => {
            const expanded = expandedId === p.id;
            return (
              <Pressable
                style={styles.positionItem}
                onPress={() => setExpandedId(expanded ? null : p.id)}>
                <View style={styles.positionHeader}>
                  <View>
                    <ThemedText style={styles.ticker}>{p.ticker}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.basis}>
                      Basis: ${parseFloat(String(p.avg_cost_basis)).toFixed(2)}
                    </ThemedText>
                  </View>
                  <Badge status={p.status} />
                </View>

                {expanded && (
                  <View style={styles.expanded}>
                    <View style={styles.detailGrid}>
                      <DetailCell label="Shares" value={String(p.shares_owned)} />
                      <DetailCell label="Effective Basis" value={`$${p.effective_cost_basis.toFixed(2)}`} />
                      <DetailCell label="Premium" value={`$${p.total_premium.toFixed(2)}`} success />
                      <DetailCell
                        label="Realized P&L"
                        value={`$${p.total_pnl.toFixed(2)}`}
                        success={p.total_pnl >= 0}
                        danger={p.total_pnl < 0}
                      />
                      {p.next_expiry ? (
                        <DetailCell
                          label="Next Expiry"
                          value={`${p.next_expiry} (${p.days_to_next_expiry}d)`}
                        />
                      ) : null}
                    </View>
                    <View style={styles.actions}>
                      <Link href={`/positions/${p.id}`} asChild>
                        <Pressable style={styles.secondaryBtn}>
                          <ThemedText style={styles.secondaryBtnText}>Details</ThemedText>
                        </Pressable>
                      </Link>
                      {p.status === 'active' ? (
                        <Link href={`/positions/${p.id}/trades/add`} asChild>
                          <Pressable style={styles.primaryBtn}>
                            <ThemedText style={styles.primaryBtnText}>Sell Call</ThemedText>
                          </Pressable>
                        </Link>
                      ) : null}
                    </View>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </ScreenScrollView>
  );
}

function DetailCell({
  label,
  value,
  success,
  danger,
}: {
  label: string;
  value: string;
  success?: boolean;
  danger?: boolean;
}) {
  const color = success ? ChartColors.success : danger ? ChartColors.danger : Colors.dark.text;
  return (
    <View style={styles.detailCell}>
      <ThemedText themeColor="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText style={{ color, fontWeight: '600', fontSize: 14 }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  addBtn: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterLabel: {
    marginBottom: -Spacing.one,
  },
  empty: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  positionItem: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticker: {
    fontSize: 16,
    fontWeight: '700',
  },
  basis: {
    fontSize: 12,
    marginTop: 2,
  },
  expanded: {
    marginTop: Spacing.three,
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: Spacing.three,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  detailCell: {
    width: '47%',
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.dark.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
