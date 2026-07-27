import React from 'react';
import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { AcaciaColors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: AcaciaColors.surface,
        },
        headerTintColor: AcaciaColors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: AcaciaColors.surface,
          borderTopColor: AcaciaColors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: AcaciaColors.accent,
        tabBarInactiveTintColor: AcaciaColors.textSecondary,
        sceneStyle: {
          backgroundColor: AcaciaColors.bg,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'acacia Trades',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <Rect x="3" y="3" width="7" height="9" />
              <Rect x="14" y="3" width="7" height="5" />
              <Rect x="14" y="12" width="7" height="9" />
              <Rect x="3" y="16" width="7" height="5" />
            </Svg>
          ),
        }}
      />
      <Tabs.Screen
        name="positions"
        options={{
          title: 'Positions',
          headerTitle: 'Covered Call Positions',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </Svg>
          ),
        }}
      />
      <Tabs.Screen
        name="add-position"
        options={{
          title: 'Add',
          headerTitle: 'Add New Position',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <Circle cx="12" cy="12" r="10" />
              <Line x1="12" y1="8" x2="12" y2="16" />
              <Line x1="8" y1="12" x2="16" y2="12" />
            </Svg>
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          headerTitle: 'Trading Statistics',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <Line x1="18" y1="20" x2="18" y2="10" />
              <Line x1="12" y1="20" x2="12" y2="4" />
              <Line x1="6" y1="20" x2="6" y2="14" />
            </Svg>
          ),
        }}
      />
    </Tabs>
  );
}
