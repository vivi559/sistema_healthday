/**
 * app/(especialista)/perfil.tsx
 * Perfil e configurações do especialista.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Switch, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema, getUserAtual, logout, salvarTema, type User } from '@/constants/Storage';

export default function EspecialistaPerfilScreen() {
  const [user,    setUser]    = useState<User | null>(null);
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const u    = await getUserAtual();
      const dark = await getTema();
      setUser(u); setTemaDark(dark); setLoading(false);
    }
    carregar();
  }, []);

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } },
    ]);
  }

  if (loading) return <View style={[styles.loading, { backgroundColor: tema.background }]}><ActivityIndicator size="large" color={HD.secondary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} backgroundColor={tema.background} />
      <View style={styles.header}><Text style={styles.title}>Meu Perfil</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: tema.card }]}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>🩺</Text></View>
          <Text style={[styles.nome, { color: tema.text }]}>{user?.nome}</Text>
          <View style={styles.badge}><Text style={styles.badgeTxt}>Especialista</Text></View>
          <Text style={[styles.email, { color: tema.subtext }]}>{user?.email}</Text>
        </View>
        <View style={[styles.themeCard, { backgroundColor: tema.card }]}>
          <Switch value={temaDark} onValueChange={async v => { setTemaDark(v); await salvarTema(v); }} trackColor={{ false: HD.divider, true: HD.secondary }} thumbColor={HD.white} />
          <Text style={[styles.temaLabel, { color: tema.text }]}>Tema Escuro</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutTxt}>🚪 Sair</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:    { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, alignItems: 'center' },
  title:     { fontSize: 22, fontWeight: '800', color: HD.secondary },
  scroll:    { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  card:      { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4 },
  avatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: HD.secondaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: HD.secondary },
  avatarEmoji:{ fontSize: 40 },
  nome:      { fontSize: 22, fontWeight: '800' },
  badge:     { backgroundColor: HD.secondaryLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  badgeTxt:  { fontSize: 13, fontWeight: '700', color: HD.secondary },
  email:     { fontSize: 13 },
  themeCard: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  temaLabel: { fontSize: 15, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: HD.accent },
});
