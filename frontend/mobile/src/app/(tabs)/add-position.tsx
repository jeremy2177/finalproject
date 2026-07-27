import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { api } from '../../services/api';
import { ErrorBanner } from '../../components/ErrorBanner';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../constants/theme';

export default function AddPositionScreen() {
  const [ticker, setTicker] = useState('');
  const [sharesOwned, setSharesOwned] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrors([]);

    if (!ticker || !sharesOwned || !costBasis || !openedAt) {
      setErrors(['Please fill in all required fields.']);
      return;
    }

    const shares = parseInt(sharesOwned, 10);
    if (isNaN(shares) || shares < 100 || shares % 100 !== 0) {
      setErrors(['Shares owned must be a multiple of 100 (representing standard contracts).']);
      return;
    }

    const basis = parseFloat(costBasis);
    if (isNaN(basis) || basis <= 0) {
      setErrors(['Please enter a valid cost basis.']);
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPosition({
        ticker: ticker.toUpperCase(),
        shares_owned: shares,
        avg_cost_basis: basis,
        opened_at: openedAt,
        notes: notes || undefined,
      });

      // Clear form
      setTicker('');
      setSharesOwned('');
      setCostBasis('');
      setNotes('');

      // Redirect to sell call option trade screen for new position
      router.push(`/position/${res.id}/add-trade` as any);
    } catch (err: any) {
      setErrors([err.message || 'An error occurred while creating position.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Log New Underlying Position</Text>
          <Text style={styles.subtitle}>
            Record your stock or ETF purchase details. Options contracts are mapped to these share holdings.
          </Text>
        </View>

        {errors.length > 0 && (
          <View style={styles.errorWrapper}>
            {errors.map((err, i) => (
              <ErrorBanner key={i} message={err} />
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock / ETF Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ticker Symbol *</Text>
            <TextInput
              style={[styles.input, { textTransform: 'uppercase' }]}
              placeholder="e.g. AAPL"
              placeholderTextColor={AcaciaColors.textMuted}
              value={ticker}
              onChangeText={(val) => setTicker(val.toUpperCase())}
              autoCapitalize="characters"
            />
            <Text style={styles.helperText}>Capital letters only (e.g. MSFT, SPY)</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Shares Owned *</Text>
            <TextInput
              style={styles.input}
              placeholder="100, 200, etc."
              placeholderTextColor={AcaciaColors.textMuted}
              value={sharesOwned}
              onChangeText={setSharesOwned}
              keyboardType="number-pad"
            />
            <Text style={[styles.helperText, { color: AcaciaColors.warning }]}>
              Must be a multiple of 100 (1 standard contract)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Average Cost Basis ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 145.50"
              placeholderTextColor={AcaciaColors.textMuted}
              value={costBasis}
              onChangeText={setCostBasis}
              keyboardType="decimal-pad"
            />
            <Text style={styles.helperText}>Your average purchase price per share</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={AcaciaColors.textMuted}
              value={openedAt}
              onChangeText={setOpenedAt}
            />
            <Text style={styles.helperText}>When you bought the underlying shares</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter notes or comments regarding this holding..."
              placeholderTextColor={AcaciaColors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push('/(tabs)/positions' as any)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.submitButtonText}>
                {loading ? 'Logging...' : 'Log & Proceed →'}
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
  cardTitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
    paddingBottom: AcaciaSpacing.sm,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
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
