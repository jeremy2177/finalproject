import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ModalBottomSheet } from '../../components/ModalBottomSheet';
import { formatCurrency, formatPercent, AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../constants/theme';

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Close trade Modal states
  const [closeTradeModalOpen, setCloseTradeModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState('');

  // Assessment signals states
  const [underlyingPrice, setUnderlyingPrice] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [assessmentResults, setAssessmentResults] = useState<any[] | null>(null);
  const [assessing, setAssessing] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setError('');
      const res = await api.getPositionDetail(id);
      setDetail(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load position details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDeletePosition = () => {
    Alert.alert(
      'Delete Position',
      'Are you sure? This will delete the position and ALL trades logged under it. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePosition(id!);
              router.replace('/(tabs)/positions' as any);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete position: ' + err.message);
            }
          },
        },
      ]
    );
  };

  const handleExpireTrade = (tradeId: number) => {
    Alert.alert(
      'Expire Trade',
      'Mark this call option as Expired OTM (kept 100% premium)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Expire',
          onPress: async () => {
            try {
              await api.expireTrade(tradeId);
              fetchDetail();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to expire trade: ' + err.message);
            }
          },
        },
      ]
    );
  };

  const handleAssignTrade = (tradeId: number) => {
    Alert.alert(
      'Assign Position',
      'Mark this position as Assigned (exercised option)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            try {
              await api.assignTrade(tradeId);
              fetchDetail();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to assign trade: ' + err.message);
            }
          },
        },
      ]
    );
  };

  const openCloseTradeModal = (tradeId: number) => {
    setSelectedTradeId(tradeId);
    setClosePrice('');
    setCloseTradeModalOpen(true);
  };

  const handleCloseTradeSubmit = async () => {
    if (!closePrice || !selectedTradeId) return;
    try {
      await api.closeTrade(selectedTradeId, parseFloat(closePrice));
      setCloseTradeModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to close trade: ' + err.message);
    }
  };

  const runAnalysis = async () => {
    if (!underlyingPrice || !optionPrice) {
      Alert.alert('Input Missing', 'Please enter both current stock and option prices.');
      return;
    }

    setAssessing(true);
    const openTrades = (detail?.trades || []).filter((t: any) => t.status === 'open');
    if (openTrades.length === 0) {
      setAssessmentResults([]);
      setAssessing(false);
      return;
    }

    try {
      const results = await Promise.all(
        openTrades.map(async (t: any) => {
          return await api.assessTrade(
            t.id,
            parseFloat(underlyingPrice),
            parseFloat(optionPrice)
          );
        })
      );
      setAssessmentResults(results);
    } catch (err: any) {
      Alert.alert('Error', 'Analysis failed: ' + err.message);
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Position Details..." />;
  }

  if (error || !detail) {
    return (
      <View style={styles.errorContainer}>
        <ErrorBanner message={error || 'Position not found'} />
        <TouchableOpacity style={styles.retryButton} onPress={fetchDetail}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { position, trades = [], stats = {} } = detail;

  return (
    <View style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.tickerTitle}>{position.ticker}</Text>
            <Badge status={position.status} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/position/${position.id}/edit` as any)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePosition}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.grid2x2}>
          <View style={styles.gridItem}>
            <StatCard
              label="Shares Basis"
              value={`$${parseFloat(position.avg_cost_basis).toFixed(2)}`}
              subtext={`${position.shares_owned} shares`}
              variant="accent"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="Effective Basis"
              value={`$${(stats.effectiveCostBasis || 0).toFixed(2)}`}
              subtext={`-$${(stats.premiumPerShare || 0).toFixed(2)}/sh`}
              variant="positive"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="Total Premium"
              value={formatCurrency(stats.totalPremium || 0)}
              subtext={`${stats.tradeCount || 0} calls sold`}
              variant="positive"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label="Yield on Cost"
              value={formatPercent(stats.yieldOnCost || 0)}
              subtext="Yield vs cost"
              variant="warning"
            />
          </View>
        </View>

        {/* Manage Trades / Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manage Trades</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Realized Trade P&L:</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    (stats.realizedPnL || 0) >= 0
                      ? AcaciaColors.success
                      : AcaciaColors.danger,
                },
              ]}>
              {(stats.realizedPnL || 0) >= 0 ? '+' : ''}
              {formatCurrency(stats.realizedPnL || 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Option Win Rate:</Text>
            <Text style={[styles.infoValue, { color: AcaciaColors.success }]}>
              {formatPercent(stats.winRate || 0)}
            </Text>
          </View>

          {position.status === 'active' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push(`/position/${position.id}/add-trade` as any)}>
              <Text style={styles.primaryButtonText}>+ Sell New Call Contract</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledBanner}>
              <Text style={styles.disabledBannerText}>
                POSITION IS {position.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Option Trade Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Option Trade Log</Text>

          {trades.length === 0 ? (
            <Text style={styles.emptyText}>No call option contracts written yet.</Text>
          ) : (
            trades.map((t: any) => (
              <View key={t.id} style={styles.tradeCard}>
                <View style={styles.tradeCardHeader}>
                  <Text style={styles.tradeTitle}>
                    {t.contracts}x ${parseFloat(t.strike_price).toFixed(2)} Call
                  </Text>
                  <Badge status={t.status} />
                </View>

                <View style={styles.tradeMetaRow}>
                  <Text style={styles.tradeMeta}>Expiry: {t.expiration_date}</Text>
                  <Text style={styles.tradeMeta}>Opened: {t.opened_at}</Text>
                </View>

                <View style={styles.tradeMetaRow}>
                  <Text style={styles.tradeMeta}>
                    Premium Rec: ${parseFloat(t.premium_received).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.tradeMetaBold,
                      {
                        color:
                          t.status === 'open'
                            ? AcaciaColors.textSecondary
                            : (t.profit_loss || 0) >= 0
                            ? AcaciaColors.success
                            : AcaciaColors.danger,
                      },
                    ]}>
                    P&L: {t.status === 'open' ? '--' : formatCurrency(t.profit_loss || 0)}
                  </Text>
                </View>

                {t.status === 'open' ? (
                  <View style={styles.tradeActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnSuccess}
                      onPress={() => openCloseTradeModal(t.id)}>
                      <Text style={styles.actionBtnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnWarning}
                      onPress={() => handleAssignTrade(t.id)}>
                      <Text style={styles.actionBtnText}>Assign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnMuted}
                      onPress={() => handleExpireTrade(t.id)}>
                      <Text style={styles.actionBtnText}>Expire</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.closedAtText}>Closed on {t.closed_at}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Signal Assessment Panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Check Roll / Close Signals</Text>
          <Text style={styles.subtitle}>
            Enter current prices to assess which open options are safe to roll or close.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Current {position.ticker} Stock Price ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 180.50"
              placeholderTextColor={AcaciaColors.textMuted}
              value={underlyingPrice}
              onChangeText={setUnderlyingPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Option Bid Price ($ per share)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.50"
              placeholderTextColor={AcaciaColors.textMuted}
              value={optionPrice}
              onChangeText={setOptionPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, assessing && styles.disabledButton]}
            onPress={runAnalysis}
            disabled={assessing}>
            <Text style={styles.primaryButtonText}>
              {assessing ? 'Analyzing...' : '📊 Run Analysis'}
            </Text>
          </TouchableOpacity>

          {assessmentResults && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>📈 Trade Recommendations</Text>
              {assessmentResults.length === 0 ? (
                <Text style={styles.emptyText}>No open trades to assess</Text>
              ) : (
                assessmentResults.map((a: any) => {
                  const isClose = a.recommendedAction === 'CLOSE';
                  const isRoll = a.recommendedAction === 'ROLL';

                  return (
                    <View key={a.tradeId} style={styles.resultItem}>
                      <View style={styles.resultItemHeader}>
                        <Text style={styles.resultTitle}>
                          {a.ticker} @ ${a.strikePrice.toFixed(2)}
                        </Text>
                        <Badge
                          status={isClose ? 'assigned' : isRoll ? 'open' : 'expired'}
                          label={`→ ${a.recommendedAction}`}
                        />
                      </View>
                      <Text style={styles.resultMeta}>
                        P&L: {formatCurrency(a.currentPnL)} ({a.pnlPercent.toFixed(1)}%) | DTE: {a.dte}d
                      </Text>
                      {a.closeReasons.length > 0 && (
                        <Text style={[styles.signalText, { color: AcaciaColors.danger }]}>
                          Close: {a.closeReasons.join('; ')}
                        </Text>
                      )}
                      {a.rollReasons.length > 0 && (
                        <Text style={[styles.signalText, { color: AcaciaColors.accent }]}>
                          Roll: {a.rollReasons.join('; ')}
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Close Option Trade Modal */}
      <ModalBottomSheet
        visible={closeTradeModalOpen}
        onClose={() => setCloseTradeModalOpen(false)}
        title="Close Option Contract">
        <Text style={styles.modalSub}>
          Enter the premium price per share paid to buy back (BTC) this contract (enter 0 for zero cost).
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0.15"
          placeholderTextColor={AcaciaColors.textMuted}
          value={closePrice}
          onChangeText={setClosePrice}
          keyboardType="decimal-pad"
        />
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCloseTradeModalOpen(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCloseTradeSubmit}>
            <Text style={styles.primaryButtonText}>Close Position</Text>
          </TouchableOpacity>
        </View>
      </ModalBottomSheet>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AcaciaSpacing.sm,
  },
  tickerTitle: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: AcaciaSpacing.xs,
  },
  editButton: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.md,
  },
  editButtonText: {
    color: AcaciaColors.textPrimary,
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.md,
  },
  deleteButtonText: {
    color: AcaciaColors.danger,
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
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
  subtitle: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: AcaciaSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
  },
  infoLabel: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  infoValue: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: AcaciaColors.accent,
    paddingVertical: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: AcaciaColors.white,
    fontWeight: '600',
    fontSize: AcaciaFontSizes.sm,
  },
  disabledBanner: {
    backgroundColor: AcaciaColors.surface2,
    padding: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  disabledBannerText: {
    color: AcaciaColors.textSecondary,
    fontWeight: '700',
    fontSize: AcaciaFontSizes.xs,
  },
  tradeCard: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.md,
    gap: AcaciaSpacing.xs,
  },
  tradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeTitle: {
    fontSize: AcaciaFontSizes.base,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  tradeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeMeta: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  tradeMetaBold: {
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '700',
  },
  tradeActionsRow: {
    flexDirection: 'row',
    gap: AcaciaSpacing.xs,
    marginTop: AcaciaSpacing.xs,
  },
  actionBtnSuccess: {
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.sm,
    alignItems: 'center',
  },
  actionBtnWarning: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.sm,
    alignItems: 'center',
  },
  actionBtnMuted: {
    flex: 1,
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.xs,
    borderRadius: AcaciaRadii.sm,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  closedAtText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textMuted,
    fontStyle: 'italic',
  },
  formGroup: {
    gap: AcaciaSpacing.xs,
  },
  label: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    color: AcaciaColors.textPrimary,
    paddingHorizontal: AcaciaSpacing.md,
    paddingVertical: AcaciaSpacing.md,
    fontSize: AcaciaFontSizes.base,
  },
  resultsContainer: {
    marginTop: AcaciaSpacing.md,
    paddingTop: AcaciaSpacing.md,
    borderTopWidth: 1,
    borderTopColor: AcaciaColors.border,
    gap: AcaciaSpacing.sm,
  },
  resultsHeader: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  resultItem: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.sm,
    padding: AcaciaSpacing.md,
    gap: AcaciaSpacing.xs,
  },
  resultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  resultMeta: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  signalText: {
    fontSize: AcaciaFontSizes.xs,
    fontWeight: '600',
  },
  modalSub: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: AcaciaSpacing.md,
    marginTop: AcaciaSpacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: AcaciaColors.textPrimary,
    fontWeight: '600',
    fontSize: AcaciaFontSizes.sm,
  },
  emptyText: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  disabledButton: {
    opacity: 0.6,
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
