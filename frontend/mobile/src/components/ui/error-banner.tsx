import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner}>
      <ThemedText style={styles.text}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  text: {
    color: Colors.dark.danger,
    fontSize: 14,
  },
});
