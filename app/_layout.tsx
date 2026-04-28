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
          <Stack.Screen name="index"                  options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/welcome"         options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/questionario" options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/home"         options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/dieta"        options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/treinos"      options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/agenda"       options={{ headerShown: false }} />
          <Stack.Screen name="(usuario)/perfil"       options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TemaProvider>
  );
}