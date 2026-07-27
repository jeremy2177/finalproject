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
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../../../constants/theme';

export default function EditPositionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticker, setTicker] = useState('');
  const [status, setStatus] = useState('active');
  const [sharesOwned, setSharesOwned] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPosition() {
      if (!id) return;
      try {
        const res = await api.getPositionDetail(id);
        const pos = res.position;
        setTicker(pos.ticker);
        setStatus(pos.status);
        setSharesOwned(String(pos.shares_owned));
        setCostBasis(String(pos.avg_cost_basis));
        setNotes(pos.notes || '');
      } catch (err: any) {
        setErrors([err.message || 'Failed to load position data']);
      } finally {
        setLoading(false);
      }
    }
    loadPosition();
  }, [id]);

  const handleSubmit = async () => {
    setErrors([]);

    const shares = parseInt(sharesOwned, 10);
    if (isNaN(shares) || shares < 100 || shares % 100 !== 0) {
      setErrors(['Shares owned must be a multiple of 100.']);
      return;
    }

    const basis = parseFloat(costBasis);
    if (isNaN(basis) || basis <= 0) {
      setErrors(['Please enter a valid cost basis.']);
      return;
    }

    setSaving(true);
    try {
      await api.updatePosition(id!, {
        ticker: ticker.toUpperCase(),
        status,
        shares_owned: shares,
        avg_cost_basis: basis,
        notes: notes || undefined,
      });

      router.replace(`/position/${id}` as any);
    } catch (err: any) {
      setErrors([err.message || 'Failed to save changes.']);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Position Data..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Edit Position Details</Text>
          <Text style={styles.subtitle}>
            Modify parameters or update status fields for this holding.
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
          <Text style={styles.cardTitle}>Holding Parameters</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ticker Symbol</Text>
            <TextInput
              style={[styles.input, { textTransform: 'uppercase' }]}
              value={ticker}
              onChangeText={(val) => setTicker(val.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {['active', 'closed', 'assigned'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusPill,
                    status === st && styles.activeStatusPill,
                  ]}
                  onPress={() => setStatus(st)}>
                  <Text
                    style={[
                      styles.statusPillText,
                      status === st && styles.activeStatusPillText,
                    ]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Shares Owned</Text>
            <TextInput
              style={styles.input}
              value={sharesOwned}
              onChangeText={setSharesOwned}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Average Cost Basis ($)</Text>
            <TextInput
              style={styles.input}
              value={costBasis}
              onChangeText={setCostBasis}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Position Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
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
                {saving ? 'Saving...' : 'Save Changes'}
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
  statusRow: {
    flexDirection: 'row',
    gap: AcaciaSpacing.xs,
  },
  statusPill: {
    flex: 1,
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    paddingVertical: AcaciaSpacing.sm,
    borderRadius: AcaciaRadii.sm,
    alignItems: 'center',
  },
  activeStatusPill: {
    backgroundColor: AcaciaColors.accent,
    borderColor: AcaciaColors.accent,
  },
  statusPillText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    fontWeight: '600',
  },
  activeStatusPillText: {
    color: AcaciaColors.white,
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
