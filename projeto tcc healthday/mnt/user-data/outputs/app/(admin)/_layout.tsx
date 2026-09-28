/**
 * app/(admin)/_layout.tsx
 * Tab bar do painel de administrador — dashboard, usuários, especialistas, relatórios, perfil.
 */

import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <MaterialIcons name={name} size={22} color={HD.white} />
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
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'usuários',
          tabBarIcon: ({ focused }) => <TabIcon name="group" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="especialista"
        options={{
          title: 'especialistas',
          tabBarIcon: ({ focused }) => <TabIcon name="medical-services" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'relatórios',
          tabBarIcon: ({ focused }) => <TabIcon name="assessment" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
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
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: HD.white,
    marginTop: -4,
  },
});
