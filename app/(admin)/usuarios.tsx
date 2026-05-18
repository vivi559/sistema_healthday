/**
 * app/(admin)/relatorios.tsx
 * Tela de relatórios e métricas gerais do app.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema } from '@/constants/Storage';

export default function RelatoriosScreen() {
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

  const RELATORIOS = [
    { id: 'usuarios_ativos',  icone: '👥', label: 'Usuários ativos este mês',   valor: '—' },
    { id: 'novos_cadastros',  icone: '✅', label: 'Novos cadastros',             valor: '—' },
    { id: 'treinos_criados',  icone: '🏋️', label: 'Treinos criados',             valor: '—' },
    { id: 'dietas_criadas',   icone: '🥗', label: 'Dietas criadas',              valor: '—' },
    { id: 'media_imc',        icone: '📊', label: 'IMC médio dos usuários',      valor: '—' },
    { id: 'especialistas_ok', icone: '🩺', label: 'Especialistas aprovados',     valor: '—' },
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
        <Text style={styles.headerTitle}>Relatórios</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Período */}
        <View style={[styles.periodoCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.periodoLabel, { color: tema.subtext }]}>Período atual</Text>
          <Text style={[styles.periodoValor, { color: tema.text }]}>
            {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Métricas */}
        <View style={[styles.metricasCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.metricasTitle, { color: tema.text }]}>Métricas Gerais</Text>
          {RELATORIOS.map((r, idx, arr) => (
            <View
              key={r.id}
              style={[
                styles.metricaItem,
                idx < arr.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: tema.border,
                },
              ]}
            >
              <View style={styles.metricaLeft}>
                <Text style={styles.metricaIcone}>{r.icone}</Text>
                <Text style={[styles.metricaLabel, { color: tema.text }]}>{r.label}</Text>
              </View>
              <Text style={[styles.metricaValor, { color: HD.primary }]}>{r.valor}</Text>
            </View>
          ))}
        </View>

        {/* Exportar */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => Alert.alert('Exportar', 'Funcionalidade em desenvolvimento.')}
          activeOpacity={0.8}
        >
          <Text style={styles.exportTxt}>📤 Exportar Relatório</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: HD.primary,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },

  periodoCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  periodoLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  periodoValor: { fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },

  metricasCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    paddingTop: 16,
  },
  metricasTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  metricaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metricaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  metricaIcone: { fontSize: 20 },
  metricaLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  metricaValor: { fontSize: 16, fontWeight: '800' },

  exportBtn: {
    backgroundColor: HD.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: HD.primaryDark,
  },
});
