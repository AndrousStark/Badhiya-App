/**
 * (tabs) group layout — the 5-tab authenticated shell.
 *
 * Ghar (Home) · Khata · Dukan · Paisa · More
 *
 * Lucide icons, Hindi labels, saffron active state. Tab bar uses the
 * warm-white surface color with a subtle warm border — matches the rest
 * of the design system (never gray).
 */

import { Tabs } from 'expo-router';
import { Home, BookText, Store, Wallet, LayoutGrid } from 'lucide-react-native';
import { Colors, FontFamily, FontWeight } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.saffron[500],
        tabBarInactiveTintColor: Colors.ink[400],
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.bodySemibold,
          fontSize: 11,
          fontWeight: FontWeight.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ghar',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: 'Khata',
          tabBarIcon: ({ color, size }) => <BookText color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="dukan"
        options={{
          title: 'Dukan',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="paisa"
        options={{
          title: 'Paisa',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
