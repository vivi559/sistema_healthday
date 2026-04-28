/**
 * app/(usuario)/dieta.tsx
 * Tela de dieta com refeições expansíveis e busca de alimentos.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import {
  alimentosSeed,
  getDietaUsuario,
  getUserAtual,
  inicializarStorage,
  type Dieta,
  type RefeicaoDieta,
} from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Tela = 'dieta' | 'busca';

export default function DietaScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [tela,       setTela]       = useState<Tela>('dieta');
  const [dieta,      setDieta]      = useState<Dieta | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [expandidos, setExpandidos] = useState<string[]>(['Janta']);
  const [busca,      setBusca]      = useState('');

  useEffect(() => {
    async function carregar() {
      await inicializarStorage();
      const user = await getUserAtual();
      if (user) {
        const d = await getDietaUsuario(user.id);
        if (!d) {
          const dietaSeed = await getDietaUsuario('0001');
          setDieta(dietaSeed);
        } else {
          setDieta(d);
        }
      }
      setLoading(false);
    }
    carregar();
  }, []);

  function toggleRefeicao(tipo: string) {
    setExpandidos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  }

  function calcKcalRefeicao(refeicao: RefeicaoDieta): number {
    return refeicao.alimentos.reduce((acc, item) => {
      return acc + Math.round((item.alimento.kcalPor100g * item.gramas) / 100);
    }, 0);
  }

  const alimentosFiltrados = alimentosSeed.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tema.background }]}>
        <ActivityIndicator size="large" color={HD.primary} />
      </View>
    );
  }

  // ── Tela de busca ──────────────────────────────────────────────────────────
  if (tela === 'busca') {
    return (
      <View style={[styles.container, { backgroundColor: tema.background }]}>
        <StatusBar
          barStyle={temaDark ? 'light-content' : 'dark-content'}
          backgroundColor={tema.background}
        />

        <View style={[styles.header, { backgroundColor: tema.background }]}>
          <TouchableOpacity onPress={() => setTela('dieta')} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Dieta</Text>
            <LogoHealthDay size={32} />
          </View>
          <View style={{ width: 70 }} />
        </View>

        <View style={[styles.buscaContainer, { backgroundColor: tema.card }]}>
          <Text style={styles.buscaIcon}>🔍</Text>
          <TextInput
            style={[styles.buscaInput, { color: tema.text }]}
            placeholder="Pesquise o Alimento"
            placeholderTextColor={HD.placeholder}
            value={busca}
            onChangeText={setBusca}
            autoFocus
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {alimentosFiltrados.map((alimento, index) => (
            <View key={alimento.id}>
              <TouchableOpacity style={styles.alimentoItem} activeOpacity={0.7}>
                <View>
                  <Text style={[styles.alimentoNome, { color: tema.text }]}>{alimento.nome}</Text>
                  <Text style={[styles.alimentoKcal, { color: tema.subtext }]}>{alimento.kcalPor100g}kcal/100g</Text>
                </View>
                <Text style={[styles.alimentoSeta, { color: tema.subtext }]}>›</Text>
              </TouchableOpacity>
              {index < alimentosFiltrados.length - 1 && (
                <View style={[styles.divisor, { backgroundColor: tema.border }]} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Tela principal ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? 'light-content' : 'dark-content'}
        backgroundColor={tema.background}
      />

      <View style={[styles.header, { backgroundColor: tema.background }]}>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dieta</Text>
          <LogoHealthDay size={32} />
        </View>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sem dieta */}
        {!dieta ? (
          <View style={styles.semDieta}>
            <Text style={styles.semDietaEmoji}>🥗</Text>
            <Text style={[styles.semDietaTitulo, { color: tema.text }]}>Nenhuma dieta encontrada</Text>
            <Text style={[styles.semDietaSub, { color: tema.subtext }]}>
              Complete o questionário de perfil para receber sua dieta personalizada.
            </Text>
          </View>
        ) : (
          <>
            {/* Banner */}
            <View style={[styles.bannerCard, { backgroundColor: tema.card }]}>
              <Text style={styles.bannerEmoji}>🥦🥕🍅</Text>
              <Text style={[styles.bannerTitulo, { color: tema.subtext }]}>{dieta.titulo}</Text>
              <View style={styles.macrosRow}>
                <View style={[styles.macroItem, { backgroundColor: HD.primary }]}>
                  <Text style={styles.macroLabel}>Carbo{'\n'}Total</Text>
                  <Text style={styles.macroValor}>{dieta.carboTotal}g</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: HD.secondary }]}>
                  <Text style={styles.macroLabel}>Proteínas{'\n'}Total</Text>
                  <Text style={styles.macroValor}>{dieta.proteinasTotal}g</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: HD.accent }]}>
                  <Text style={styles.macroLabel}>Gorduras{'\n'}Total</Text>
                  <Text style={styles.macroValor}>{dieta.gordurasTotal}g</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.macroLabel}>Kcal{'\n'}Total</Text>
                  <Text style={styles.macroValor}>{dieta.kcalTotal}</Text>
                </View>
              </View>
            </View>

            {/* Refeições */}
            {dieta.refeicoes.map((refeicao) => {
              const isExpanded = expandidos.includes(refeicao.tipo);
              const kcal = calcKcalRefeicao(refeicao);
              return (
                <View key={refeicao.tipo} style={[styles.refeicaoCard, { backgroundColor: tema.card }]}>
                  <TouchableOpacity
                    style={styles.refeicaoHeader}
                    onPress={() => toggleRefeicao(refeicao.tipo)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.refeicaoHeaderLeft}>
                      <Text style={[styles.refeicaoTitulo, { color: tema.text }]}>{refeicao.tipo}</Text>
                      <TouchableOpacity onPress={() => setTela('busca')} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.refeicaoHeaderRight}>
                      <Text style={[styles.refeicaoKcal, { color: tema.subtext }]}>{kcal}Kcal</Text>
                      <Text style={[styles.refeicaoSeta, { color: tema.subtext }]}>{isExpanded ? '∧' : '∨'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.alimentosLista}>
                      {refeicao.alimentos.map((item, idx) => {
                        const kcalItem = Math.round(
                          (item.alimento.kcalPor100g * item.gramas) / 100
                        );
                        return (
                          <View key={idx} style={styles.alimentoRow}>
                            <Text style={[styles.alimentoRowNome, { color: tema.subtext }]}>
                              {item.gramas}g de {item.alimento.nome}
                            </Text>
                            <View style={styles.alimentoRowRight}>
                              <Text style={[styles.alimentoRowKcal, { color: tema.subtext }]}>{kcalItem}Kcal</Text>
                              <TouchableOpacity>
                                <Text style={[styles.alimentoEditIcon, { color: tema.subtext }]}>✎</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <View style={[styles.divisor, { backgroundColor: tema.border }]} />
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  notifBtn:     { position: 'relative', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notifIcon:    { fontSize: 22 },
  notifBadge:   { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: HD.accent },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: HD.primary },
  menuBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuIcon:     { fontSize: 22, color: HD.primary },
  backBtn:      { paddingVertical: 8, paddingRight: 8 },
  backText:     { fontSize: 15, color: HD.primary, fontWeight: '600' },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  semDieta:      { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  semDietaEmoji: { fontSize: 56, marginBottom: 16 },
  semDietaTitulo:{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  semDietaSub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  bannerCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerEmoji:  { fontSize: 40, marginBottom: 6 },
  bannerTitulo: { fontSize: 14, marginBottom: 14 },
  macrosRow:    { flexDirection: 'row', gap: 6, width: '100%' },
  macroItem:    { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center' },
  macroLabel:   { fontSize: 9, color: HD.white, textAlign: 'center', lineHeight: 12, marginBottom: 4 },
  macroValor:   { fontSize: 12, fontWeight: '800', color: HD.white },

  refeicaoCard:        { borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  refeicaoHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  refeicaoHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refeicaoTitulo:      { fontSize: 16, fontWeight: '700' },
  addBtn:              { width: 24, height: 24, borderRadius: 12, backgroundColor: HD.textDark, alignItems: 'center', justifyContent: 'center' },
  addBtnText:          { color: HD.white, fontSize: 16, lineHeight: 20 },
  refeicaoHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refeicaoKcal:        { fontSize: 14, fontWeight: '500' },
  refeicaoSeta:        { fontSize: 16 },
  alimentosLista:      { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  alimentoRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alimentoRowNome:     { fontSize: 13, flex: 1 },
  alimentoRowRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alimentoRowKcal:     { fontSize: 13 },
  alimentoEditIcon:    { fontSize: 16 },

  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buscaIcon:    { fontSize: 18 },
  buscaInput:   { flex: 1, fontSize: 15 },
  alimentoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  alimentoNome: { fontSize: 15, fontWeight: '600' },
  alimentoKcal: { fontSize: 13, marginTop: 2 },
  alimentoSeta: { fontSize: 22 },
  divisor:      { height: 1, marginHorizontal: 16 },
});