import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingView } from '@/components/ui/loading-view';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

const STATUS_OPTIONS = ['active', 'closed', 'assigned'];

export default function EditPositionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState({
    ticker: '',
    status: 'active',
    shares_owned: '',
    avg_cost_basis: '',
    notes: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPosition() {
      try {
        const res = (await api.getPositionDetail(id)) as { position: Record<string, unknown> };
        const p = res.position;
        setFormData({
          ticker: p.ticker as string,
          status: p.status as string,
          shares_owned: String(p.shares_owned),
          avg_cost_basis: String(p.avg_cost_basis),
          notes: (p.notes as string) || '',
        });
      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'Failed to load position']);
      } finally {
        setLoading(false);
      }
    }
    loadPosition();
  }, [id]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setErrors([]);
    const shares = parseInt(formData.shares_owned, 10);
    if (isNaN(shares) || shares < 100 || shares % 100 !== 0) {
      setErrors(['Shares must be a multiple of 100.']);
      return;
    }

    setSaving(true);
    try {
      await api.updatePosition(id, {
        ...formData,
        ticker: formData.ticker.toUpperCase(),
        shares_owned: shares,
        avg_cost_basis: parseFloat(formData.avg_cost_basis),
      });
      router.replace(`/positions/${id}`);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save changes']);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <ScreenScrollView withTabInset={false}>
      <ThemedText type="subtitle" style={styles.title}>
        Edit Position
      </ThemedText>

      <Card title="Modify Holding Parameters">
        {errors.length > 0 ? <ErrorBanner message={errors.join(' ')} /> : null}

        <View style={styles.field}>
          <ThemedText type="smallBold">Ticker Symbol</ThemedText>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            value={formData.ticker}
            onChangeText={(v) => updateField('ticker', v)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Status</ThemedText>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.statusPill, formData.status === s && styles.statusPillActive]}
                onPress={() => updateField('status', s)}>
                <ThemedText
                  style={[styles.statusText, formData.status === s && styles.statusTextActive]}>
                  {s}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Shares Owned</ThemedText>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={formData.shares_owned}
            onChangeText={(v) => updateField('shares_owned', v)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Average Cost Basis ($)</ThemedText>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={formData.avg_cost_basis}
            onChangeText={(v) => updateField('avg_cost_basis', v)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Notes</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
          />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <ThemedText style={styles.secondaryBtnText}>Cancel</ThemedText>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={saving}>
            <ThemedText style={styles.primaryBtnText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: Spacing.one,
  },
  field: {
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSelected,
  },
  statusPillActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    textTransform: 'capitalize',
  },
  statusTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryBtnText: {
    fontWeight: '600',
  },
});
