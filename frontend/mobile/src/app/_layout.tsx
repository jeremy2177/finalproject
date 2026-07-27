import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { AcaciaColors } from '../constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: AcaciaColors.surface,
          },
          headerTintColor: AcaciaColors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: AcaciaColors.bg,
          },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="position/[id]" options={{ title: 'Position Detail' }} />
        <Stack.Screen name="position/[id]/edit" options={{ title: 'Edit Position' }} />
        <Stack.Screen name="position/[id]/add-trade" options={{ title: 'Sell Call Option' }} />
      </Stack>
    </AuthProvider>
  );
}
