import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  withTabInset?: boolean;
}

export function ScreenScrollView({
  children,
  withTabInset = true,
  contentContainerStyle,
  ...rest
}: ScreenScrollViewProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            withTabInset && { paddingBottom: BottomTabInset + Spacing.four },
            contentContainerStyle,
          ]}
          {...rest}>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  inner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three,
  },
});
