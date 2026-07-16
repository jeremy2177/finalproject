import { GlassView } from 'expo-glass-effect';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const colors = Colors.dark;

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('trader');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}>
          <GlassView style={styles.card} glassEffectStyle="regular">
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Dashboard Login
              </ThemedText>
              <ThemedText themeColor="textSecondary">Covered Calls Trading</ThemedText>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.field}>
                <ThemedText type="smallBold">Username</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Password</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                )}
              </Pressable>
            </View>

            <ThemedText themeColor="textSecondary" style={styles.footer}>
              Demo: trader / password123
            </ThemedText>
          </GlassView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    backgroundColor: colors.backgroundSelected,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: Spacing.two,
  },
});
