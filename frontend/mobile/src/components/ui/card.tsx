import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function Card({ title, children, action }: CardProps) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
