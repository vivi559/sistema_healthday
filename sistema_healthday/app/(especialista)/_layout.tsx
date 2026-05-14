/**
 * app/(especialista)/_layout.tsx
 * Tab bar do painel do especialista.
 * NOVO: pasta (especialista) não existia — login/index quebravam ao rotear para /(especialista).
 */

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { HD } from '@/constants/theme';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>{emoji}</Text>
    </View>
  );
}

export default function EspecialistaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: HD.white,
        tabBarInactiveTintColor: HD.white,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'início',
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'pacientes',
          tabBarIcon: ({ focused }) => <Icon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="solicitacoes"
        options={{
          title: 'pedidos',
          tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'perfil',
          tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 70,
    borderRadius: 40,
    backgroundColor: HD.tabBar,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: HD.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tabBarBackground: { flex: 1, backgroundColor: HD.tabBar, borderRadius: 40 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive:  { backgroundColor: HD.secondary },
  iconEmoji:       { fontSize: 20 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: HD.white, marginTop: -4 },
});
