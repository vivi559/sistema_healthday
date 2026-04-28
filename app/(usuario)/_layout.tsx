/**
 * app/(usuario)/_layout.tsx
 * Tab bar principal do usuário — home, treinos, dieta, agenda, perfil.
 */

import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { HD } from '@/constants/theme';

// ─── Ícones em emoji/texto (sem biblioteca externa) ───────────────────────────

function IconHome({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>🏠</Text>
    </View>
  );
}

function IconTreinos({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>🏋️</Text>
    </View>
  );
}

function IconDieta({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>🥗</Text>
    </View>
  );
}

function IconAgenda({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>📅</Text>
    </View>
  );
}

function IconPerfil({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>👤</Text>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function UsuarioLayout() {
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
        name="home"
        options={{
          title: 'home',
          tabBarIcon: ({ focused }) => <IconHome focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'treinos',
          tabBarIcon: ({ focused }) => <IconTreinos focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dieta"
        options={{
          title: 'dieta',
          tabBarIcon: ({ focused }) => <IconDieta focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'agenda',
          tabBarIcon: ({ focused }) => <IconAgenda focused={focused} />,
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
  // Tab bar pill cinza
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

  // Ícone
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

  // Label
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: HD.white,
    marginTop: -4,
  },
});