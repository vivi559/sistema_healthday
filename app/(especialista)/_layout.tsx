/**
 * app/(especialista)/_layout.tsx
 * Tab bar do especialista — notícias, treinos, dieta, solicitações e perfil —
 * e a camada que mostra os avisos do app.
 *
 * A barra é desenhada aqui mesmo (em vez da barra padrão do React Navigation)
 * para ficar igual no celular e no navegador: centralizada, com largura máxima
 * em tela grande, acima da área de gestos do celular e com a aba ativa
 * destacada mostrando ícone e nome.
 */

import { AvisosNaTela } from "@/components/EspecialistaUI";
import { HD } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

// Largura máxima da barra: no computador ela não se estica pela tela toda
const LARGURA_BARRA = 560;

// ─── Barra de abas ────────────────────────────────────────────────────────────

function BarraAbas({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const [tecladoAberto, setTecladoAberto] = useState(false);

  // No celular a barra some enquanto o teclado está aberto, para não cobrir os campos
  useEffect(() => {
    if (Platform.OS === "web") return;
    const abrir = Keyboard.addListener("keyboardDidShow", () => setTecladoAberto(true));
    const fechar = Keyboard.addListener("keyboardDidHide", () => setTecladoAberto(false));
    return () => { abrir.remove(); fechar.remove(); };
  }, []);

  if (tecladoAberto) return null;

  // Rotas escondidas pelo expo-router (href: null) não aparecem na barra
  const visiveis = state.routes.filter(route => {
    const estilo = StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle) as ViewStyle | undefined;
    return estilo?.display !== "none";
  });

  // Tamanho do texto calculado pela largura de cada aba, para o maior nome
  // ("Solicitações", ~6,3 × o tamanho da fonte) caber inteiro em qualquer tela
  const larguraBarra = Math.min(width - 24, LARGURA_BARRA);
  const espacoTexto = (larguraBarra - 12 - 4 * (visiveis.length - 1)) / Math.max(visiveis.length, 1) - 4;
  const tamanhoTexto = Math.max(8, Math.min(11, Math.floor((espacoTexto / 6.3) * 2) / 2));

  return (
    <View style={[styles.area, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.barra} accessibilityRole="tablist">
        {visiveis.map(route => {
          const { options } = descriptors[route.key];
          const ativa = state.routes[state.index]?.key === route.key;
          const nome = typeof options.title === "string" ? options.title : route.name;

          function tocar() {
            const evento = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!ativa && !evento.defaultPrevented) navigation.navigate(route.name, route.params);
          }

          function tocarLongo() {
            navigation.emit({ type: "tabLongPress", target: route.key });
          }

          return (
            <Pressable
              key={route.key}
              onPress={tocar}
              onLongPress={tocarLongo}
              style={styles.item}
              accessibilityRole="tab"
              aria-selected={ativa}
              accessibilityLabel={nome}
            >
              {({ pressed }) => (
                <View style={[styles.itemConteudo, ativa && styles.itemAtivo, pressed && !ativa && styles.itemPressionado]}>
                  {options.tabBarIcon?.({ focused: ativa, color: HD.white, size: 22 })}
                  <Text
                    style={[styles.texto, { fontSize: tamanhoTexto }, ativa && styles.textoAtivo]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {nome}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const icone = (name: IconName) => function Icone({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name={name} size={size} color={color} />;
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function EspecialistaLayout() {
  return (
    <View style={styles.raiz}>
      <Tabs tabBar={props => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
        {/* Primeira aba: as notícias são a primeira coisa que o usuário vê ao abrir o app */}
        <Tabs.Screen name="noticias" options={{ title: "Notícias", tabBarIcon: icone("article") }} />
        <Tabs.Screen name="treinos" options={{ title: "Treinos", tabBarIcon: icone("fitness-center") }} />
        <Tabs.Screen name="dieta" options={{ title: "Dieta", tabBarIcon: icone("restaurant") }} />
        <Tabs.Screen name="solicitacoes" options={{ title: "Solicitações", tabBarIcon: icone("assignment") }} />
        <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: icone("person") }} />
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

  // Faixa invisível da largura da tela que centraliza a barra
  area: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 12,
    pointerEvents: "box-none",
  },
  barra: {
    width: "100%",
    maxWidth: LARGURA_BARRA,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 4,
    borderRadius: 32,
    backgroundColor: HD.tabBar,
    elevation: 10,
    shadowColor: HD.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
  },
  itemConteudo: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 24,
  },
  itemAtivo: {
    backgroundColor: HD.primary,
  },
  itemPressionado: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  texto: {
    color: HD.white,
    fontWeight: "600",
    textAlign: "center",
  },
  textoAtivo: {
    fontWeight: "700",
  },
});
