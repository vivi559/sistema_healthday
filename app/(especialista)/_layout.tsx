/**
 * app/(especialista)/_layout.tsx
 * Tab bar do especialista — notícias, treinos, dieta, solicitações e perfil —
 * e a camada que mostra os avisos do app.
 *
 * A barra vem de components/BarraAbas.tsx, a mesma usada pelo usuário.
 */

import BarraAbas, { iconeAba } from "@/components/BarraAbas";
import { AvisosNaTela } from "@/components/EspecialistaUI";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function EspecialistaLayout() {
  return (
    <View style={styles.raiz}>
      <Tabs tabBar={props => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
        {/* Primeira aba: as notícias são a primeira coisa que o usuário vê ao abrir o app */}
        <Tabs.Screen name="noticias" options={{ title: "Notícias", tabBarIcon: iconeAba("article") }} />
        <Tabs.Screen name="treinos" options={{ title: "Treinos", tabBarIcon: iconeAba("fitness-center") }} />
        <Tabs.Screen name="dieta" options={{ title: "Dieta", tabBarIcon: iconeAba("restaurant") }} />
        <Tabs.Screen name="solicitacoes" options={{ title: "Solicitações", tabBarIcon: iconeAba("assignment") }} />
        <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: iconeAba("person") }} />
      </Tabs>
      {/* Avisos e confirmações das telas do especialista, por cima das abas */}
      <AvisosNaTela />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
});
