import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ErrorBanner';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please fill in both username and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Acacia Trades</Text>
              <Text style={styles.subtitle}>Covered Calls Mobile Dashboard</Text>
            </View>

            <ErrorBanner message={error} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor={AcaciaColors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={AcaciaColors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Demo credentials:</Text>
              <Text style={styles.footerSubText}>
                username: <Text style={styles.boldText}>trader</Text> | password: <Text style={styles.boldText}>password123</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: AcaciaColors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: AcaciaSpacing.lg,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: AcaciaColors.surface,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.lg,
    padding: AcaciaSpacing.xl,
    gap: AcaciaSpacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: AcaciaSpacing.md,
  },
  title: {
    fontSize: AcaciaFontSizes['2xl'],
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  subtitle: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    marginTop: AcaciaSpacing.xs,
  },
  formGroup: {
    gap: AcaciaSpacing.xs,
  },
  label: {
    fontSize: AcaciaFontSizes.sm,
    color: AcaciaColors.textSecondary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: AcaciaColors.surface2,
    borderColor: AcaciaColors.border,
    borderWidth: 1,
    borderRadius: AcaciaRadii.md,
    color: AcaciaColors.textPrimary,
    paddingHorizontal: AcaciaSpacing.lg,
    paddingVertical: AcaciaSpacing.md,
    fontSize: AcaciaFontSizes.base,
  },
  button: {
    backgroundColor: AcaciaColors.accent,
    borderRadius: AcaciaRadii.md,
    paddingVertical: AcaciaSpacing.lg,
    alignItems: 'center',
    marginTop: AcaciaSpacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: AcaciaColors.white,
    fontSize: AcaciaFontSizes.base,
    fontWeight: '600',
  },
  footer: {
    marginTop: AcaciaSpacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
  },
  footerSubText: {
    fontSize: AcaciaFontSizes.xs,
    color: AcaciaColors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
});
