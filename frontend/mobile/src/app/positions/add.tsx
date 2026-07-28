import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

export default function AddPositionScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ticker: '',
    shares_owned: '',
    avg_cost_basis: '',
    opened_at: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const res = (await api.createPosition({
        ...formData,
        ticker: formData.ticker.toUpperCase(),
        shares_owned: shares,
        avg_cost_basis: parseFloat(formData.avg_cost_basis),
      })) as { id: number };
      router.replace(`/positions/${res.id}/trades/add`);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create position']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScrollView withTabInset={false}>
      <ThemedText type="subtitle" style={styles.title}>
        Log New Position
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Record your stock purchase details
      </ThemedText>

      <Card title="Stock / ETF Details">
        {errors.length > 0 ? <ErrorBanner message={errors.join(' ')} /> : null}

        <FormField label="Ticker Symbol">
          <TextInput
            style={styles.input}
            placeholder="e.g. AAPL"
            placeholderTextColor={Colors.dark.textSecondary}
            autoCapitalize="characters"
            value={formData.ticker}
            onChangeText={(v) => updateField('ticker', v)}
          />
        </FormField>

        <FormField label="Shares Owned" helper="Must be a multiple of 100">
          <TextInput
            style={styles.input}
            placeholder="100, 200, etc."
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="number-pad"
            value={formData.shares_owned}
            onChangeText={(v) => updateField('shares_owned', v)}
          />
        </FormField>

        <FormField label="Average Cost Basis ($)">
          <TextInput
            style={styles.input}
            placeholder="e.g. 145.50"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="decimal-pad"
            value={formData.avg_cost_basis}
            onChangeText={(v) => updateField('avg_cost_basis', v)}
          />
        </FormField>

        <FormField label="Purchase Date">
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.dark.textSecondary}
            value={formData.opened_at}
            onChangeText={(v) => updateField('opened_at', v)}
          />
        </FormField>

        <FormField label="Notes (Optional)">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes about this holding..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
          />
        </FormField>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <ThemedText style={styles.secondaryBtnText}>Cancel</ThemedText>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
            <ThemedText style={styles.primaryBtnText}>
              {loading ? 'Logging...' : 'Log & Proceed'}
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    </ScreenScrollView>
  );
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {helper ? (
        <ThemedText themeColor="textSecondary" style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
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
  helper: {
    fontSize: 11,
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
