import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  active: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  open: { bg: 'rgba(79, 142, 247, 0.15)', color: '#4f8ef7', border: 'rgba(79, 142, 247, 0.3)' },
  closed: { bg: 'rgba(136, 146, 170, 0.15)', color: '#8892aa', border: 'rgba(136, 146, 170, 0.3)' },
  assigned: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  expired: { bg: 'rgba(136, 146, 170, 0.15)', color: '#8892aa', border: 'rgba(136, 146, 170, 0.3)' },
};

export function Badge({ status }: { status: string }) {
  const style = statusStyles[status] ?? statusStyles.closed;

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <ThemedText style={[styles.text, { color: style.color }]}>{status}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
