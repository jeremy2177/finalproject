import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../services/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { formatCurrency, formatPercent, AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../../constants/theme';

export default function AddTradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [strikePrice, setStrikePrice] = useState('');
  const [premiumReceived, setPremiumReceived] = useState('');
  const [contracts, setContracts] = useState('');
  const [openPrice, setOpenPrice] = useState('');
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState('');
  const [underlyingPriceAtEntry, setUnderlyingPriceAtEntry] = useState('');
  const [ivAtEntry, setIvAtEntry] = useState('');
  const [deltaAtEntry, setDeltaAtEntry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadPosition() {
      if (!id) return;
      try {
        const res = await api.getPositionDetail(id);
        setPosition(res.position);
        setContracts(String(Math.floor(res.position.shares_owned / 100)));
      } catch (err: any) {
        setErrors([err.message || 'Failed to load position data']);
      } finally {
        setLoading(false);
      }
    }
    loadPosition();
  }, [id]);

  // Live Return Projections calculation
  const getProjections = () => {
    if (!position) return { capitalAtRisk: 0, dte: 0, roc: 0, annualized: 0 };

    const c = parseInt(contracts, 10) || 0;
    const capitalAtRisk = parseFloat(position.avg_cost_basis) * c * 100;

    let dte = 0;
    if (openedAt && expirationDate) {
      const opened = new Date(openedAt).getTime();
      const expiry = new Date(expirationDate).getTime();
      const diffTime = expiry - opened;
      dte = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const premium = parseFloat(premiumReceived) || 0;
    const roc = capitalAtRisk > 0 ? (premium / capitalAtRisk) * 100 : 0;
    const annualized = dte > 0 ? roc * (365 / dte) : 0;

    return { capitalAtRisk, dte, roc, annualized };
  };

  const handleOpenPriceChange = (val: string) => {
    setOpenPrice(val);
    const c = parseInt(contracts, 10) || 0;
    const p = parseFloat(val);
    if (!isNaN(p) && c > 0) {
      setPremiumReceived((p * c * 100).toFixed(2));
    }
  };

  const handlePremiumChange = (val: string) => {
    setPremiumReceived(val);
    const c = parseInt(contracts, 10) || 0;
    const p = parseFloat(val);
    if (!isNaN(p) && c > 0) {
      setOpenPrice((p / (c * 100)).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    setErrors([]);

    if (!strikePrice || !premiumReceived || !contracts || !expirationDate) {
      setErrors(['Please fill in all required fields.']);
      return;
    }

    setSaving(true);
    try {
      await api.createTrade(id!, {
        strike_price: parseFloat(strikePrice),
        premium_received: parseFloat(premiumReceived),
        contracts: parseInt(contracts, 10),
        open_price: openPrice ? parseFloat(openPrice) : undefined,
        opened_at: openedAt,
        expiration_date: expirationDate,
        underlying_price_at_entry: underlyingPriceAtEntry ? parseFloat(underlyingPriceAtEntry) : undefined,
        iv_at_entry: ivAtEntry ? parseFloat(ivAtEntry) : undefined,
        delta_at_entry: deltaAtEntry ? parseFloat(deltaAtEntry) : undefined,
        notes: notes || undefined,
      });

      router.replace(`/position/${id}` as any);
    } catch (err: any) {
      setErrors([err.message || 'Failed to log call option.']);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Position Info..." />;
  }

  const { capitalAtRisk, dte, roc, annualized } = getProjections();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Sell Covered Call Option</Text>
          <Text style={styles.subtitle}>
            Record the details of the call option sold against your {position?.ticker} holdings.
          </Text>
        </View>

        {errors.length > 0 && (
          <View style={styles.errorWrapper}>
            {errors.map((err, i) => (
              <ErrorBanner key={i} message={err} />
            ))}
          </View>
        )}

        {/* Live Return Projection Card */}
        <View style={[styles.card, styles.projectionCard]}>
          <Text style={styles.cardTitle}>Live Return Projection</Text>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Capital at Risk:</Text>
            <Text style={styles.projValue}>{formatCurrency(capitalAtRisk)}</Text>
          </View>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Days to Expiry (DTE):</Text>
            <Text style={styles.projValue}>{dte} days</Text>
          </View>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Return on Capital (ROC):</Text>
            <Text style={[styles.projValue, { color: AcaciaColors.success }]}>
              {formatPercent(roc)}
            </Text>
          </View>
          <View style={styles.projRow}>
            <Text style={styles.projLabel}>Annualized Return:</Text>
            <Text style={[styles.projValue, styles.projHighlight]}>
              {formatPercent(annualized)}
            </Text>
          </View>
        </View>

        {/* Trade Details Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Call Option Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Strike Price ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150.00"
              placeholderTextColor={AcaciaColors.textMuted}
              value={strikePrice}
              onChangeText={setStrikePrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Total Premium Received ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 245.00"
              placeholderTextColor={AcaciaColors.textMuted}
              value={premiumReceived}
              onChangeText={handlePremiumChange}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contracts Sold *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor={AcaciaColors.textMuted}
              value={contracts}
              onChangeText={setContracts}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Premium Per Share ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.45"
              placeholderTextColor={AcaciaColors.textMuted}
              value={openPrice}
              onChangeText={handleOpenPriceChange}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Write/Open Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={openedAt}
              onChangeText={setOpenedAt}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Expiration Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={AcaciaColors.textMuted}
              value={expirationDate}
              onChangeText={setExpirationDate}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Underlying Stock Price at Entry ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 147.20"
              placeholderTextColor={AcaciaColors.textMuted}
              value={underlyingPriceAtEntry}
              onChangeText={setUnderlyingPriceAtEntry}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Implied Volatility (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 34.5"
              placeholderTextColor={AcaciaColors.textMuted}
              value={ivAtEntry}
              onChangeText={setIvAtEntry}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Option Delta (Δ)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0.30"
              placeholderTextColor={AcaciaColors.textMuted}
              value={deltaAtEntry}
              onChangeText={setDeltaAtEntry}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Trade Notes (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Earnings play"
              placeholderTextColor={AcaciaColors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, saving && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={saving}>
              <Text style={styles.submitButtonText}>
                {saving ? 'Logging...' : 'Log Trade'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: AcaciaSpacing.xs,
  },
  title: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  subtitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  errorWrapper: {
    gap: AcaciaSpacing.xs,
  },
  card: {
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    padding: AcaciaSpacing.lg,
    gap: AcaciaSpacing.md,
  },
  projectionCard: {
    backgroundColor: AcaciaColors.surface2,
    borderLeftWidth: 4,
    borderLeftColor: AcaciaColors.accent,
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
  projRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  projLabel: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
  },
  projValue: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '600',
    color: AcaciaColors.textPrimary,
  },
  projHighlight: {
    fontSize: AcaciaFontSizes.lg,
    fontWeight: '800',
    color: AcaciaColors.success,
  },
  formGroup: {
    gap: AcaciaSpacing.xs,
  },
  label: {
    fontSize: AcaciaFontSizes.sm,
    fontWeight: '500',
    color: AcaciaColors.textSecondary,
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
  actions: {
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
  submitButton: {
    flex: 1,
    backgroundColor: AcaciaColors.accent,
    paddingVertical: AcaciaSpacing.md,
    borderRadius: AcaciaRadii.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: AcaciaColors.white,
    fontWeight: '600',
    fontSize: AcaciaFontSizes.sm,
  },
});
