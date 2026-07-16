import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingView } from '@/components/ui/loading-view';
import { ScreenScrollView } from '@/components/ui/screen-scroll-view';
import { ChartColors, Colors, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

export default function AddTradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [position, setPosition] = useState<{ ticker: string; avg_cost_basis: string | number; shares_owned: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    strike_price: '',
    premium_received: '',
    contracts: '',
    open_price: '',
    opened_at: new Date().toISOString().split('T')[0],
    expiration_date: '',
    underlying_price_at_entry: '',
    iv_at_entry: '',
    delta_at_entry: '',
    notes: '',
  });

  useEffect(() => {
    async function loadPosition() {
      try {
        const res = (await api.getPositionDetail(id)) as { position: typeof position };
        setPosition(res.position);
        setFormData((prev) => ({
          ...prev,
          contracts: String(Math.floor((res.position?.shares_owned ?? 0) / 100)),
        }));
      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'Failed to load position']);
      } finally {
        setLoading(false);
      }
    }
    loadPosition();
  }, [id]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'open_price' && value && prev.contracts) {
        updated.premium_received = (parseFloat(value) * parseInt(prev.contracts, 10) * 100).toFixed(2);
      } else if (name === 'premium_received' && value && prev.contracts) {
        updated.open_price = (parseFloat(value) / (parseInt(prev.contracts, 10) * 100)).toFixed(2);
      } else if (name === 'contracts' && value) {
        if (prev.open_price) {
          updated.premium_received = (parseFloat(prev.open_price) * parseInt(value, 10) * 100).toFixed(2);
        } else if (prev.premium_received) {
          updated.open_price = (parseFloat(prev.premium_received) / (parseInt(value, 10) * 100)).toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    setErrors([]);
    setSaving(true);
    try {
      await api.createTrade(id, {
        ...formData,
        strike_price: parseFloat(formData.strike_price),
        premium_received: parseFloat(formData.premium_received),
        contracts: parseInt(formData.contracts, 10),
        open_price: formData.open_price ? parseFloat(formData.open_price) : undefined,
        underlying_price_at_entry: formData.underlying_price_at_entry
          ? parseFloat(formData.underlying_price_at_entry)
          : undefined,
        iv_at_entry: formData.iv_at_entry ? parseFloat(formData.iv_at_entry) : undefined,
        delta_at_entry: formData.delta_at_entry ? parseFloat(formData.delta_at_entry) : undefined,
      });
      router.replace(`/positions/${id}`);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create trade']);
    } finally {
      setSaving(false);
    }
  };

  const getProjections = () => {
    if (!position) return { capitalAtRisk: 0, dte: 0, roc: 0, annualized: 0 };

    const contracts = parseInt(formData.contracts, 10) || 0;
    const capitalAtRisk = parseFloat(String(position.avg_cost_basis)) * contracts * 100;

    let dte = 0;
    if (formData.opened_at && formData.expiration_date) {
      const opened = new Date(formData.opened_at);
      const expiry = new Date(formData.expiration_date);
      dte = Math.max(0, Math.ceil((expiry.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const premium = parseFloat(formData.premium_received) || 0;
    const roc = capitalAtRisk > 0 ? (premium / capitalAtRisk) * 100 : 0;
    const annualized = dte > 0 ? roc * (365 / dte) : 0;

    return { capitalAtRisk, dte, roc, annualized };
  };

  if (loading) return <LoadingView />;

  const { capitalAtRisk, dte, roc, annualized } = getProjections();

  return (
    <ScreenScrollView withTabInset={false}>
      <ThemedText type="subtitle" style={styles.title}>
        Sell Covered Call
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Log call option sold against {position?.ticker}
      </ThemedText>

      <Card title="Call Option Details">
        {errors.length > 0 ? <ErrorBanner message={errors.join(' ')} /> : null}

        <FormField label="Strike Price ($)">
          <TextInput
            style={styles.input}
            placeholder="e.g. 150.00"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="decimal-pad"
            value={formData.strike_price}
            onChangeText={(v) => updateField('strike_price', v)}
          />
        </FormField>

        <FormField label="Total Premium Received ($)">
          <TextInput
            style={styles.input}
            placeholder="e.g. 245.00"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="decimal-pad"
            value={formData.premium_received}
            onChangeText={(v) => updateField('premium_received', v)}
          />
        </FormField>

        <FormField label="Contracts Sold">
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={formData.contracts}
            onChangeText={(v) => updateField('contracts', v)}
          />
        </FormField>

        <FormField label="Premium Per Share ($)">
          <TextInput
            style={styles.input}
            placeholder="e.g. 2.45"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="decimal-pad"
            value={formData.open_price}
            onChangeText={(v) => updateField('open_price', v)}
          />
        </FormField>

        <FormField label="Write/Open Date">
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.dark.textSecondary}
            value={formData.opened_at}
            onChangeText={(v) => updateField('opened_at', v)}
          />
        </FormField>

        <FormField label="Expiration Date">
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.dark.textSecondary}
            value={formData.expiration_date}
            onChangeText={(v) => updateField('expiration_date', v)}
          />
        </FormField>

        <FormField label="Underlying Price ($)" helper="Optional">
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={formData.underlying_price_at_entry}
            onChangeText={(v) => updateField('underlying_price_at_entry', v)}
          />
        </FormField>

        <FormField label="Implied Volatility (%)" helper="Optional">
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={formData.iv_at_entry}
            onChangeText={(v) => updateField('iv_at_entry', v)}
          />
        </FormField>

        <FormField label="Option Delta" helper="Optional">
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={formData.delta_at_entry}
            onChangeText={(v) => updateField('delta_at_entry', v)}
          />
        </FormField>

        <FormField label="Trade Notes" helper="Optional">
          <TextInput
            style={styles.input}
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
          />
        </FormField>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <ThemedText style={styles.secondaryBtnText}>Cancel</ThemedText>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={saving}>
            <ThemedText style={styles.primaryBtnText}>
              {saving ? 'Logging...' : 'Log Trade'}
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      <Card title="Live Return Projection">
        <ProjectionRow label="Capital at Risk" value={`$${capitalAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <ProjectionRow label="Days to Expiry (DTE)" value={`${dte} days`} />
        <ProjectionRow label="Return on Capital (ROC)" value={`${roc.toFixed(2)}%`} success />
        <ProjectionRow label="Annualized Return" value={`${annualized.toFixed(2)}%`} success large />
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

function ProjectionRow({
  label,
  value,
  success,
  large,
}: {
  label: string;
  value: string;
  success?: boolean;
  large?: boolean;
}) {
  return (
    <View style={styles.projectionRow}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText
        style={{
          fontWeight: '700',
          fontSize: large ? 22 : 16,
          color: success ? ChartColors.success : Colors.dark.text,
        }}>
        {value}
      </ThemedText>
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
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
});
