import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../constants/theme';

export default function PositionsScreen() {
  const [positions, setPositions] = useState<any[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    ticker: '',
    sort: 'opened',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadTickers() {
      try {
        const res = await api.getTickers();
        setTickers(res || []);
      } catch (err) {
        console.error('Failed to load tickers', err);
      }
    }
    loadTickers();
  }, []);

  const fetchPositions = async () => {
    try {
      setError('');
      const res = await api.getPositions(filters);
      setPositions(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load positions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPositions();
    }, [filters])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPositions();
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading Positions..." />;
  }

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
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.pageTitle}>All Covered Calls</Text>
            <Text style={styles.pageSubtitle}>
              Track and filter underlying positions and harvests.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/add-position' as any)}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <Line x1="12" y1="5" x2="12" y2="19" />
              <Line x1="5" y1="12" x2="19" y2="12" />
            </Svg>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ErrorBanner message={error} />

        {/* Filter Control Panel */}
        <View style={styles.card}>
          <Text style={styles.filterTitle}>Filter & Sort</Text>
          {/* Status filter pills */}
          <View style={styles.pillsRow}>
            {['all', 'active', 'closed', 'assigned'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.pill,
                  filters.status === st && styles.activePill,
                ]}
                onPress={() => setFilters({ ...filters, status: st })}>
                <Text
                  style={[
                    styles.pillText,
                    filters.status === st && styles.activePillText,
                  ]}>
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort selector pills */}
          <Text style={[styles.filterTitle, { marginTop: AcaciaSpacing.xs }]}>Sort By</Text>
          <View style={styles.pillsRow}>
            {[
              { label: 'Date', value: 'opened' },
              { label: 'Ticker', value: 'ticker' },
              { label: 'Status', value: 'status' },
              { label: 'Cost Basis', value: 'cost' },
            ].map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.pill,
                  filters.sort === s.value && styles.activePill,
                ]}
                onPress={() => setFilters({ ...filters, sort: s.value })}>
                <Text
                  style={[
                    styles.pillText,
                    filters.sort === s.value && styles.activePillText,
                  ]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Positions List */}
        {positions.length === 0 ? (
          <EmptyState
            title="No Positions Found"
            message="No matches under current filter criteria."
            actionLabel="Log Position"
            onAction={() => router.push('/(tabs)/add-position' as any)}
          />
        ) : (
          positions.map((p: any) => {
            const isExpanded = expandedId === p.id;
            return (
              <View key={p.id} style={styles.positionCard}>
                <TouchableOpacity
                  style={styles.positionHeader}
                  onPress={() => toggleExpand(p.id)}
                  activeOpacity={0.7}>
                  <View>
                    <Text style={styles.ticker}>{p.ticker}</Text>
                    <Text style={styles.basisText}>
                      Basis: ${parseFloat(p.avg_cost_basis).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <Badge status={p.status} />
                    <Svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={AcaciaColors.textSecondary}
                      strokeWidth="2"
                      style={{
                        transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                      }}>
                      <Polyline points="6 9 12 15 18 9" />
                    </Svg>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.positionBody}>
                    <View style={styles.detailsGrid}>
                      <View style={styles.gridCol}>
                        <Text style={styles.colLabel}>Shares</Text>
                        <Text style={styles.colValue}>{p.shares_owned}</Text>
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.colLabel}>Effective Basis</Text>
                        <Text style={styles.colValue}>
                          ${parseFloat(p.effective_cost_basis || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.colLabel}>Premium Rec.</Text>
                        <Text style={[styles.colValue, { color: AcaciaColors.success }]}>
                          ${parseFloat(p.total_premium || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.colLabel}>Realized P&L</Text>
                        <Text
                          style={[
                            styles.colValue,
                            {
                              color:
                                (p.total_pnl || 0) >= 0
                                  ? AcaciaColors.success
                                  : AcaciaColors.danger,
                            },
                          ]}>
                          ${parseFloat(p.total_pnl || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {p.next_expiry ? (
                      <View style={styles.expiryRow}>
                        <Text style={styles.colLabel}>Next Expiration: </Text>
                        <Text
                          style={[
                            styles.colValue,
                            {
                              color:
                                p.days_to_next_expiry <= 7
                                  ? AcaciaColors.danger
                                  : p.days_to_next_expiry <= 21
                                  ? AcaciaColors.warning
                                  : AcaciaColors.success,
                            },
                          ]}>
                          {p.next_expiry} ({p.days_to_next_expiry}d)
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push(`/position/${p.id}` as any)}>
                        <Text style={styles.secondaryButtonText}>Deep Dive Stats</Text>
                      </TouchableOpacity>
                      {p.status === 'active' && (
                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={() => router.push(`/position/${p.id}/add-trade` as any)}>
                          <Text style={styles.primaryButtonText}>Sell Call Option</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    gap: AcaciaSpacing.xs,
  },
  pageTitle: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  pageSubtitle: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  addButton: {
    backgroundColor: AcaciaColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.sm,
    borderRadius: AcaciaRadii.md,
    gap: AcaciaSpacing.xs,
  },
  addButtonText: {
    color: AcaciaColors.white,
    fontWeight: '600',
    fontSize: AcaciaFontSizes.sm,
  },
  card: {
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.md,
    gap: AcaciaSpacing.xs,
  },
  filterTitle: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AcaciaSpacing.xs,
    marginVertical: AcaciaSpacing.xs,
  },
  pill: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.sm,
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.xs,
  },
  activePill: {
    backgroundColor: AcaciaColors.accent,
    borderColor: AcaciaColors.accent,
  },
  pillText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '500',
  },
  activePillText: {
    color: AcaciaColors.white,
    fontWeight: '700',
  },
  positionCard: {
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    overflow: 'hidden',
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AcaciaSpacing.md,
  },
  ticker: {
    fontSize: AcaciaFontSizes.lg,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  basisText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AcaciaSpacing.sm,
  },
  positionBody: {
    padding: AcaciaSpacing.md,
    borderTopWidth: 1,
    borderTopColor: AcaciaColors.border,
    backgroundColor: 'rgba(34, 38, 58, 0.2)',
    gap: AcaciaSpacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: AcaciaSpacing.sm,
  },
  gridCol: {
    width: '50%',
    gap: 2,
  },
  colLabel: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  colValue: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: AcaciaSpacing.sm,
    marginTop: AcaciaSpacing.xs,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.sm,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: AcaciaColors.textPrimary,
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: AcaciaColors.accent,
    paddingVertical: AcaciaSpacing.sm,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: AcaciaColors.white,
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
  },
});
