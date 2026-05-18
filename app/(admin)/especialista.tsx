/**
 * app/(admin)/especialistas.tsx
 * Tela de aprovação e gerenciamento de especialistas.
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

type StatusFiltro = 'todos' | 'pendente' | 'aprovado' | 'rejeitado';

export default function EspecialistasScreen() {
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState<StatusFiltro>('pendente');

  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const dark = await getTema();
      setTemaDark(dark);
      setLoading(false);
    }
    carregar();
  }, []);

  function handleAprovar(nome: string) {
    Alert.alert('Aprovar', `Confirmar aprovação de ${nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprovar', onPress: () => {} },
    ]);
  }

  function handleRejeitar(nome: string) {
    Alert.alert('Rejeitar', `Confirmar rejeição de ${nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rejeitar', style: 'destructive', onPress: () => {} },
    ]);
  }

  const FILTROS: { label: string; valor: StatusFiltro }[] = [
    { label: 'Pendentes', valor: 'pendente' },
    { label: 'Aprovados', valor: 'aprovado' },
    { label: 'Rejeitados', valor: 'rejeitado' },
    { label: 'Todos', valor: 'todos' },
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
        <Text style={styles.headerTitle}>Especialistas</Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtrosContent}
      >
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.valor}
            style={[
              styles.filtroBtn,
              filtro === f.valor && styles.filtroBtnAtivo,
            ]}
            onPress={() => setFiltro(f.valor)}
          >
            <Text
              style={[
                styles.filtroLabel,
                filtro === f.valor && styles.filtroLabelAtivo,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Estado vazio — substituir por lista real */}
        <View style={[styles.emptyCard, { backgroundColor: tema.card }]}>
          <Text style={styles.emptyIcone}>🩺</Text>
          <Text style={[styles.emptyTxt, { color: tema.subtext }]}>
            Nenhum especialista {filtro === 'todos' ? 'cadastrado' : filtro}.
          </Text>
        </View>

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

  filtrosScroll: { maxHeight: 48 },
  filtrosContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filtroBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: HD.divider,
  },
  filtroBtnAtivo: { backgroundColor: HD.primary },
  filtroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: HD.textLight,
  },
  filtroLabelAtivo: { color: HD.white },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },

  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcone: { fontSize: 40 },
  emptyTxt: { fontSize: 15 },
});
