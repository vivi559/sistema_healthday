/**
 * app/_layout.tsx
 * Layout raiz — registra todos os grupos de rotas do app.
 * CORRIGIDO: adicionados (admin), (especialista) e todas as telas (auth).
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { TemaProvider } from '@/context/TemaContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TemaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Splash */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Autenticação */}
          <Stack.Screen name="(auth)/welcome"   options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login"     options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/cadastro"  options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/imc"       options={{ headerShown: false }} />

          {/* Área do usuário (tab bar gerenciada pelo próprio _layout) */}
          <Stack.Screen name="(usuario)"        options={{ headerShown: false }} />

          {/* Área do administrador — CORRIGIDO: era "admin", deve ser "(admin)" */}
          <Stack.Screen name="(admin)"          options={{ headerShown: false }} />

          {/* Área do especialista — CORRIGIDO: pasta não existia */}
          <Stack.Screen name="(especialista)"   options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TemaProvider>
  );
}
