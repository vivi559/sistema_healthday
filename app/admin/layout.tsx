/**
 * app/(admin)/_layout.tsx
 * Tab bar do painel de administrador — dashboard, usuários, especialistas, relatórios, perfil.
 */

import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { HD } from '@/constants/theme';

function IconDashboard({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>📊</Text>
    </View>
  );
}

function IconUsuarios({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>👥</Text>
    </View>
  );
}

function IconEspecialistas({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>🩺</Text>
    </View>
  );
}

function IconRelatorios({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>📋</Text>
    </View>
  );
}

function IconPerfil({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>⚙️</Text>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: HD.white,
        tabBarInactiveTintColor: HD.white,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'dashboard',
          tabBarIcon: ({ focused }) => <IconDashboard focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'usuários',
          tabBarIcon: ({ focused }) => <IconUsuarios focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="especialistas"
        options={{
          title: 'especialistas',
          tabBarIcon: ({ focused }) => <IconEspecialistas focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'relatórios',
          tabBarIcon: ({ focused }) => <IconRelatorios focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'perfil',
          tabBarIcon: ({ focused }) => <IconPerfil focused={focused} />,
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
  tabBarBackground: {
    flex: 1,
    backgroundColor: HD.tabBar,
    borderRadius: 40,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: HD.primary,
  },
  iconEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: HD.white,
    marginTop: -4,
  },
});
