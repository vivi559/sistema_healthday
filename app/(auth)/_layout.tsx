/**
 * app/(auth)/_layout.tsx
 * Layout do grupo de autenticação — login, cadastro, recuperação de senha, etc.
 * Usa Stack simples sem header; cada tela controla sua própria UI.
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="imc" />
      <Stack.Screen name="questionario" />
    </Stack>
  );
}
