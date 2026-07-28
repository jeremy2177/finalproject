import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function PositionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.dark.backgroundElement },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.dark.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Positions' }} />
      <Stack.Screen name="add" options={{ title: 'Add Position' }} />
      <Stack.Screen name="[id]" options={{ title: 'Position Detail' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Position' }} />
      <Stack.Screen name="[id]/trades/add" options={{ title: 'Sell Call Option' }} />
    </Stack>
  );
}
