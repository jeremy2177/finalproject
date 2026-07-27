import { GlassView } from 'expo-glass-effect';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [username, setUsername] = useState('trader');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    if (newMode === 'signup') {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
    } else {
      setUsername('trader');
      setPassword('password123');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, email.trim() || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <GlassView style={styles.card} glassEffectStyle="regular">
              <View style={styles.header}>
                <ThemedText type="subtitle" style={styles.title}>
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </ThemedText>
                <ThemedText themeColor="textSecondary">Covered Calls Trading</ThemedText>
              </View>

              {/* Mode Selector Tabs */}
              <View style={styles.tabContainer}>
                <Pressable
                  style={[styles.tab, mode === 'login' && styles.tabActive]}
                  onPress={() => switchMode('login')}>
                  <ThemedText
                    style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                    Sign In
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                  onPress={() => switchMode('signup')}>
                  <ThemedText
                    style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </ThemedText>
                </Pressable>
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
                    placeholder="Enter username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {mode === 'signup' && (
                  <View style={styles.field}>
                    <ThemedText type="smallBold">Email (Optional)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email address"
                      placeholderTextColor={colors.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={styles.field}>
                  <ThemedText type="smallBold">Password</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {mode === 'signup' && (
                  <View style={styles.field}>
                    <ThemedText type="smallBold">Confirm Password</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor={colors.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                )}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    </ThemedText>
                  )}
                </Pressable>
              </View>

              {/* Mode toggle footer */}
              <Pressable
                onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                style={styles.toggleFooter}>
                <ThemedText themeColor="textSecondary" style={styles.footerText}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <ThemedText style={styles.linkText}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </ThemedText>
                </ThemedText>
              </Pressable>

              {mode === 'login' && (
                <ThemedText themeColor="textSecondary" style={styles.footer}>
                  Demo credentials: trader / password123
                </ThemedText>
              )}
            </GlassView>
          </ScrollView>
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
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
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
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSelected,
    borderRadius: 10,
    padding: 3,
    marginBottom: Spacing.one,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.backgroundElement,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
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
  toggleFooter: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: Spacing.one,
  },
});
