import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from 'components/haptic-tab';
import { IconSymbol } from 'components/ui/icon-symbol';
import { Colors } from 'constants/theme';
import { useColorScheme } from 'hooks/use-color-scheme';
import { AuthGate } from '@/features/auth/AuthGate';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </AuthGate>
  );
}
