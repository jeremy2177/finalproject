import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HarvestTimeline } from '@/components/ui/harvest-timeline';
import { LoadingView } from '@/components/ui/loading-view';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { StatCard } from '@/components/ui/stat-card';
import { ChartColors, Colors, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

interface Trade {
  id: number;
  opened_at: string;
  contracts: number;
  strike_price: string;
  expiration_date: string;
  premium_received: string;
  status: string;
  profit_loss?: string;
  annualized_return?: number;
  closed_at?: string;
}

interface AssessmentResult {
  tradeId: number;
  ticker: string;
  strikePrice: number;
  recommendedAction: string;
  currentPnL: number;
  pnlPercent: number;
  dte: number;
  currentUnderlyingPrice: number;
  spreadPercent: number;
  closeReasons: string[];
  rollReasons: string[];
}

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState('');

  const [underlyingPrice, setUnderlyingPrice] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[] | null>(null);
  const [assessing, setAssessing] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.getPositionDetail(id);
      setDetail(res as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load position details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDeletePosition = () => {
    Alert.alert(
      'Delete Position',
      'This will delete the position and ALL historical trades. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePosition(id);
              router.replace('/positions');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            }
          },
        },
      ],
    );
  };

  const handleExpireTrade = (tradeId: number) => {
    Alert.alert('Expire Option', 'Mark as expired (OTM, kept 100% premium)?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Expire',
        onPress: async () => {
          try {
            await api.expireTrade(tradeId);
            fetchDetail();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to expire');
          }
        },
      },
    ]);
  };

  const handleAssignTrade = (tradeId: number) => {
    Alert.alert('Assign Option', 'Mark as assigned and close underlying position?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: async () => {
          try {
            await api.assignTrade(tradeId);
            fetchDetail();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign');
          }
        },
      },
    ]);
  };

  const handleCloseTradeSubmit = async () => {
    if (!closePrice || !selectedTradeId) return;
    try {
      await api.closeTrade(selectedTradeId, parseFloat(closePrice));
      setCloseModalOpen(false);
      fetchDetail();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to close trade');
    }
  };

  const runAnalysis = async () => {
    if (!underlyingPrice || !optionPrice || !detail) {
      Alert.alert('Error', 'Please enter both prices');
      return;
    }

    setAssessing(true);
    const trades = detail.trades as Trade[];
    const openTrades = trades.filter((t) => t.status === 'open');

    if (openTrades.length === 0) {
      setAssessmentResults([]);
      setAssessing(false);
      return;
    }

    try {
      const results = await Promise.all(
        openTrades.map((t) =>
          api.assessTrade(t.id, parseFloat(underlyingPrice), parseFloat(optionPrice)),
        ),
      );
      setAssessmentResults(results as AssessmentResult[]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAssessing(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) {
    return (
      <ScreenScrollView withTabInset={false}>
        <ErrorBanner message={error} />
      </ScreenScrollView>
    );
  }
  if (!detail) return null;

  const position = detail.position as Record<string, unknown>;
  const trades = detail.trades as Trade[];
  const stats = detail.stats as Record<string, number>;
  const monthlyData = detail.monthlyData as { label: string; premium: number; pnl: number }[];

  const actionColor = (action: string) =>
    action === 'CLOSE' ? ChartColors.danger : action === 'ROLL' ? ChartColors.warning : Colors.dark.textSecondary;

  return (
    <ScreenScrollView withTabInset={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="subtitle" style={styles.title}>
            {position.ticker as string}
          </ThemedText>
          <Badge status={position.status as string} />
        </View>
        <View style={styles.headerActions}>
          <Link href={`/positions/${id}/edit`} asChild>
            <Pressable style={styles.secondaryBtn}>
              <ThemedText style={styles.secondaryBtnText}>Edit</ThemedText>
            </Pressable>
          </Link>
          <Pressable style={styles.dangerBtn} onPress={handleDeletePosition}>
            <ThemedText style={styles.dangerBtnText}>Delete</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.statGrid}>
        <StatCard
          label="Shares Cost Basis"
          value={`$${parseFloat(String(position.avg_cost_basis)).toFixed(2)}`}
          subtitle={`${position.shares_owned} shares`}
          variant="accent"
        />
        <StatCard
          label="Effective Cost Basis"
          value={`$${stats.effectiveCostBasis.toFixed(2)}`}
          subtitle={`-$${stats.premiumPerShare.toFixed(2)}/share offset`}
          variant="positive"
          valueColor={ChartColors.success}
        />
        <StatCard
          label="Total Premium"
          value={`$${stats.totalPremium.toFixed(2)}`}
          subtitle={`${stats.tradeCount} contracts`}
          variant="positive"
          valueColor={ChartColors.success}
        />
        <StatCard
          label="Yield on Cost"
          value={`${stats.yieldOnCost.toFixed(2)}%`}
          variant="warning"
          valueColor={ChartColors.success}
        />
      </View>

      <Card title="Premium Harvest Progression">
        <HarvestTimeline data={monthlyData} />
      </Card>

      <Card title="Manage Trades">
        <View style={styles.metricRow}>
          <ThemedText themeColor="textSecondary">Realized P&L</ThemedText>
          <ThemedText style={{ color: stats.realizedPnL >= 0 ? ChartColors.success : ChartColors.danger, fontWeight: '700' }}>
            {stats.realizedPnL >= 0 ? '+' : ''}${stats.realizedPnL.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText themeColor="textSecondary">Win Rate</ThemedText>
          <ThemedText style={{ color: ChartColors.success, fontWeight: '700' }}>
            {stats.winRate.toFixed(2)}%
          </ThemedText>
        </View>
        {position.status === 'active' ? (
          <Link href={`/positions/${id}/trades/add`} asChild>
            <Pressable style={styles.primaryBtn}>
              <ThemedText style={styles.primaryBtnText}>Sell New Call Contract</ThemedText>
            </Pressable>
          </Link>
        ) : null}
      </Card>

      <Card title="Option Trade Log">
        {trades.length === 0 ? (
          <ThemedText themeColor="textSecondary">No trades logged yet.</ThemedText>
        ) : (
          trades.map((t) => (
            <View key={t.id} style={styles.tradeRow}>
              <View style={styles.tradeMain}>
                <ThemedText style={styles.tradeStrike}>
                  ${parseFloat(t.strike_price).toFixed(2)} · {t.contracts}c
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.tradeMeta}>
                  {t.opened_at} → {t.expiration_date}
                </ThemedText>
                <ThemedText style={{ color: ChartColors.success, fontSize: 13 }}>
                  Premium: ${parseFloat(t.premium_received).toFixed(2)}
                </ThemedText>
              </View>
              <View style={styles.tradeRight}>
                <Badge status={t.status} />
                {t.status !== 'open' ? (
                  <ThemedText
                    style={{
                      color: parseFloat(t.profit_loss || '0') >= 0 ? ChartColors.success : ChartColors.danger,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                    {parseFloat(t.profit_loss || '0') >= 0 ? '+' : ''}$
                    {parseFloat(t.profit_loss || '0').toFixed(2)}
                  </ThemedText>
                ) : (
                  <View style={styles.tradeActions}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedTradeId(t.id);
                        setClosePrice('');
                        setCloseModalOpen(true);
                      }}>
                      <ThemedText style={styles.actionBtnText}>Close</ThemedText>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleAssignTrade(t.id)}>
                      <ThemedText style={styles.actionBtnText}>Assign</ThemedText>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleExpireTrade(t.id)}>
                      <ThemedText style={styles.actionBtnText}>Expire</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </Card>

      <Card title="Check Roll/Close Signals">
        <View style={styles.assessForm}>
          <View style={styles.assessField}>
            <ThemedText type="smallBold">Current {position.ticker as string} Price</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 180.50"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="decimal-pad"
              value={underlyingPrice}
              onChangeText={setUnderlyingPrice}
            />
          </View>
          <View style={styles.assessField}>
            <ThemedText type="smallBold">Option Bid Price</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.50"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="decimal-pad"
              value={optionPrice}
              onChangeText={setOptionPrice}
            />
          </View>
          <Pressable style={styles.primaryBtn} onPress={runAnalysis} disabled={assessing}>
            <ThemedText style={styles.primaryBtnText}>
              {assessing ? 'Analyzing...' : 'Run Analysis'}
            </ThemedText>
          </Pressable>
        </View>

        {assessmentResults && (
          <View style={styles.assessResults}>
            {assessmentResults.length === 0 ? (
              <ThemedText themeColor="textSecondary">No open trades to assess</ThemedText>
            ) : (
              assessmentResults.map((a) => (
                <View key={a.tradeId} style={styles.assessCard}>
                  <View style={styles.assessHeader}>
                    <ThemedText style={styles.assessTicker}>
                      {a.ticker} @ ${a.strikePrice.toFixed(2)}
                    </ThemedText>
                    <ThemedText style={[styles.assessAction, { color: actionColor(a.recommendedAction) }]}>
                      → {a.recommendedAction}
                    </ThemedText>
                  </View>
                  <ThemedText themeColor="textSecondary" style={styles.assessDetail}>
                    P&L: {a.currentPnL >= 0 ? '+' : ''}${a.currentPnL.toFixed(2)} ({a.pnlPercent.toFixed(1)}%) · DTE: {a.dte}d
                  </ThemedText>
                  {a.closeReasons.length > 0 ? (
                    <ThemedText style={{ color: ChartColors.warning, fontSize: 12 }}>
                      Close: {a.closeReasons.join('; ')}
                    </ThemedText>
                  ) : null}
                  {a.rollReasons.length > 0 ? (
                    <ThemedText style={{ color: ChartColors.accent, fontSize: 12 }}>
                      Roll: {a.rollReasons.join('; ')}
                    </ThemedText>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </Card>

      <Modal visible={closeModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Close Option Contract</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.modalBody}>
              Enter buyback price per share (BTC).
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0.15"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="decimal-pad"
              value={closePrice}
              onChangeText={setClosePrice}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setCloseModalOpen(false)}>
                <ThemedText style={styles.secondaryBtnText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleCloseTradeSubmit}>
                <ThemedText style={styles.primaryBtnText}>Close Position</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: Spacing.two,
  },
  tradeMain: {
    flex: 1,
    gap: 2,
  },
  tradeStrike: {
    fontWeight: '700',
    fontSize: 15,
  },
  tradeMeta: {
    fontSize: 11,
  },
  tradeRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tradeActions: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assessForm: {
    gap: Spacing.two,
  },
  assessField: {
    gap: Spacing.one,
  },
  input: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    color: Colors.dark.text,
    fontSize: 16,
  },
  assessResults: {
    marginTop: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: Spacing.three,
  },
  assessCard: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 8,
    padding: Spacing.two,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  assessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessTicker: {
    fontWeight: '600',
    fontSize: 14,
  },
  assessAction: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  assessDetail: {
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  dangerBtnText: {
    color: ChartColors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
});
