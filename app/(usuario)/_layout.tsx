/**
 * app/(usuario)/_layout.tsx
 * Tab bar principal do usuário — home, treinos, dieta, agenda, perfil.
 *
 * A barra vem de components/BarraAbas.tsx, a mesma usada pelo especialista.
 */

import BarraAbas, { iconeAba } from "@/components/BarraAbas";
import { Tabs } from "expo-router";

export default function UsuarioLayout() {
  return (
    <Tabs tabBar={props => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: iconeAba("home") }} />
      <Tabs.Screen name="treinos" options={{ title: "Treinos", tabBarIcon: iconeAba("fitness-center") }} />
      <Tabs.Screen name="dieta" options={{ title: "Dieta", tabBarIcon: iconeAba("restaurant") }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda", tabBarIcon: iconeAba("event") }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: iconeAba("person") }} />
    </Tabs>
  );
}
