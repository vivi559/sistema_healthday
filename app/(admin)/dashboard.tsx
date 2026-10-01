/**
 * app/(admin)/dashboard.tsx
 * Tela principal do painel de administrador.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema, type User } from '@/constants/Storage';
import LogoHealthDay from '@/components/LogoHealthDay';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type StatCard = {
  id: string;
  icone: IconName;
  label: string;
  valor: string | number;
  cor: string;
};

const ACOES: { icone: IconName; label: string }[] = [
  { icone: 'how-to-reg', label: 'Aprovar especialistas pendentes' },
  { icone: 'block',      label: 'Gerenciar usuários bloqueados' },
  { icone: 'campaign',   label: 'Enviar notificação global' },
  { icone: 'sync',       label: 'Sincronizar dados' },
];

export default function DashboardScreen() {
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);

  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const dark = await getTema();
      setTemaDark(dark);
      setLoading(false);
    }
    carregar();
  }, []);

  const STATS: StatCard[] = [
    { id: 'usuarios',      icone: 'group',            label: 'Usuários',      valor: '—', cor: HD.primary },
    { id: 'especialistas', icone: 'medical-services', label: 'Especialistas', valor: '—', cor: HD.secondary },
    { id: 'treinos',       icone: 'fitness-center',   label: 'Treinos',       valor: '—', cor: HD.kcal },
    { id: 'dietas',        icone: 'restaurant',       label: 'Dietas',        valor: '—', cor: HD.accent },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tema.background }]}>
        <ActivityIndicator size="large" color={HD.primary} />
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin</Text>
          <LogoHealthDay size={32} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Boas-vindas */}
        <View style={[styles.welcomeCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.welcomeTitle, { color: tema.text }]}>
            Painel de Administração
          </Text>
          <Text style={[styles.welcomeSub, { color: tema.subtext }]}>
            Gerencie usuários, especialistas e conteúdos do Health Day.
          </Text>
        </View>

        {/* Cards de estatísticas */}
        <View style={styles.statsGrid}>
          {STATS.map(stat => (
            <TouchableOpacity
              key={stat.id}
              style={[styles.statCard, { backgroundColor: tema.card }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name={stat.icone} size={26} color={stat.cor} style={styles.statIcone} />
              <Text style={[styles.statValor, { color: stat.cor }]}>{stat.valor}</Text>
              <Text style={[styles.statLabel, { color: tema.subtext }]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ações rápidas */}
        <View style={[styles.acoesCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.acoesTitle, { color: tema.text }]}>Ações Rápidas</Text>
          {ACOES.map((acao, idx, arr) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.acaoItem,
                idx < arr.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: tema.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.acaoLeft}>
                <MaterialIcons name={acao.icone} size={22} color={HD.primary} />
                <Text style={[styles.acaoLabel, { color: tema.text }]}>{acao.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={tema.subtext} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: HD.primary,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },

  // Welcome card
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIcone: { marginBottom: 6 },
  statValor: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600' },

  // Ações card
  acoesCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    paddingTop: 16,
  },
  acoesTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  acaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  acaoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  acaoLabel: { fontSize: 15, fontWeight: '500' },
});
