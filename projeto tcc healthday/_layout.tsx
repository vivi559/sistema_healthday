/**
 * app/(usuario)/_layout.tsx
 * Tab bar principal do usuário — home, treinos, dieta, agenda, perfil.
 */

import { HD } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, View } from "react-native";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

// ─── Ícone da tab (Material Icons) ────────────────────────────────────────────

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <MaterialIcons name={name} size={22} color={HD.white} />
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
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "home",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: "treinos",
          tabBarIcon: ({ focused }) => <TabIcon name="fitness-center" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dieta"
        options={{
          title: "dieta",
          tabBarIcon: ({ focused }) => <TabIcon name="restaurant" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "agenda",
          tabBarIcon: ({ focused }) => <TabIcon name="event" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "perfil",
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Tab bar pill cinza
  tabBar: {
    position: "absolute",
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
    paddingBottom: Platform.OS === "ios" ? 8 : 0,
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
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: HD.primary,
  },

  // Label
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: HD.white,
    marginTop: -4,
  },
});
