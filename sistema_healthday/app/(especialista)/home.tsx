/**
 * app/(especialista)/home.tsx
 * Tela principal do especialista — visão geral e solicitações pendentes.
 */

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import {
  getTema, getUserAtual, getSolicitacoes,
  type User, type SolicitacaoEspecialista,
} from '@/constants/Storage';

export default function EspecialistaHomeScreen() {
  const [user,       setUser]       = useState<User | null>(null);
  const [temaDark,   setTemaDark]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [pendentes,  setPendentes]  = useState<SolicitacaoEspecialista[]>([]);

  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const u    = await getUserAtual();
      const dark = await getTema();
      const sols = await getSolicitacoes();
      setUser(u);
      setTemaDark(dark);
      setPendentes(sols.filter(s => s.status === 'pendente'));
      setLoading(false);
    }
    carregar();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: tema.background }]}>
        <ActivityIndicator size="large" color={HD.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? 'light-content' : 'dark-content'}
        backgroundColor={tema.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: tema.subtext }]}>Olá,</Text>
          <Text style={[styles.userName, { color: tema.text }]}>{user?.nome ?? 'Especialista'}</Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>🩺</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Card boas-vindas */}
        <View style={[styles.card, { backgroundColor: tema.card }]}>
          <Text style={[styles.cardTitle, { color: tema.text }]}>Painel do Especialista</Text>
          <Text style={[styles.cardSub, { color: tema.subtext }]}>
            Gerencie solicitações de pacientes, crie dietas e planos de treino personalizados.
          </Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsRow}>
          {[
            { icone: '📋', label: 'Pendentes',  valor: pendentes.length, cor: HD.secondary },
            { icone: '✅', label: 'Concluídas', valor: '—',              cor: HD.primary   },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: tema.card }]}>
              <Text style={styles.statEmoji}>{s.icone}</Text>
              <Text style={[styles.statVal, { color: s.cor }]}>{s.valor}</Text>
              <Text style={[styles.statLabel, { color: tema.subtext }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Solicitações pendentes */}
        <Text style={[styles.sectionTitle, { color: tema.text }]}>Solicitações Pendentes</Text>

        {pendentes.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: tema.card }]}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={[styles.emptyTxt, { color: tema.subtext }]}>
              Nenhuma solicitação pendente!
            </Text>
          </View>
        ) : (
          pendentes.map(sol => (
            <TouchableOpacity key={sol.id} style={[styles.solCard, { backgroundColor: tema.card }]} activeOpacity={0.8}>
              <View style={styles.solLeft}>
                <Text style={styles.solEmoji}>
                  {sol.tipo === 'dieta' ? '🥗' : sol.tipo === 'treino' ? '🏋️' : '🥗🏋️'}
                </Text>
                <View>
                  <Text style={[styles.solNome, { color: tema.text }]}>{sol.usuarioNome}</Text>
                  <Text style={[styles.solTipo, { color: tema.subtext }]}>
                    Solicitação: {sol.tipo}
                  </Text>
                </View>
              </View>
              <View style={styles.pendenteBadge}>
                <Text style={styles.pendenteTxt}>pendente</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14 },
  userName: { fontSize: 22, fontWeight: '800' },
  badgeWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: HD.secondaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: { fontSize: 24 },

  scroll: { paddingHorizontal: 20, gap: 14 },

  card: {
    borderRadius: 20, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  cardSub:   { fontSize: 13, lineHeight: 19 },

  statsRow:  { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  statEmoji: { fontSize: 26 },
  statVal:   { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800' },

  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 10 },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { fontSize: 14 },

  solCard: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  solLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  solEmoji:     { fontSize: 24 },
  solNome:      { fontSize: 14, fontWeight: '700' },
  solTipo:      { fontSize: 12, marginTop: 2 },
  pendenteBadge:{ backgroundColor: HD.secondaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pendenteTxt:  { fontSize: 11, fontWeight: '700', color: HD.secondary },
});
