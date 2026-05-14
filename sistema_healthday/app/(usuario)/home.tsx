/**
 * app/(usuario)/home.tsx
 * Tela inicial com notícias sobre alimentação e exercícios.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { getNoticias, getUserAtual, type Noticia, type User } from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [user,     setUser]     = useState<User | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function carregar() {
      const u = await getUserAtual();
      setUser(u);
      setNoticias(getNoticias());
      setLoading(false);
    }
    carregar();
  }, []);

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
      <View style={[styles.header, { backgroundColor: tema.background }]}>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Home</Text>
          <LogoHealthDay size={32} />
        </View>

        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Saudação */}
      {user && (
        <Text style={[styles.saudacao, { color: tema.subtext }]}>
          Olá, {user.nome.split(' ')[0]}! 👋
        </Text>
      )}

      {/* Lista de notícias */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {noticias.map((noticia, index) => (
          <View key={noticia.id}>
            <TouchableOpacity style={styles.noticiaCard} activeOpacity={0.8}>
              <Image
                source={{ uri: noticia.imagem }}
                style={styles.noticiaImagem}
                resizeMode="cover"
              />
              <View style={styles.noticiaTituloWrap}>
                <Text style={[styles.noticiaTitulo, { color: tema.text }]}>
                  {noticia.titulo}
                </Text>
                <View style={[
                  styles.categoriaBadge,
                  noticia.categoria === 'alimentacao' && { backgroundColor: HD.primaryLight },
                  noticia.categoria === 'exercicio'   && { backgroundColor: HD.secondaryLight },
                  noticia.categoria === 'saude'       && { backgroundColor: '#E0E7FF' },
                ]}>
                  <Text style={styles.categoriaText}>
                    {noticia.categoria === 'alimentacao' ? '🥗 Alimentação'
                      : noticia.categoria === 'exercicio' ? '🏋️ Exercício'
                      : '❤️ Saúde'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {index < noticias.length - 1 && (
              <View style={[styles.divisor, { backgroundColor: tema.border }]} />
            )}
          </View>
        ))}

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
  notifBtn: {
    position: 'relative',
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  notifIcon:  { fontSize: 22 },
  notifBadge: {
    position: 'absolute',
    top: 6, right: 6,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: HD.accent,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: HD.primary },
  menuBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuIcon:     { fontSize: 22, color: HD.primary },
  saudacao: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  noticiaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 14,
  },
  noticiaImagem: {
    width: 90, height: 80,
    borderRadius: 12,
    backgroundColor: HD.cardLight,
  },
  noticiaTituloWrap: { flex: 1, gap: 8 },
  noticiaTitulo: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoriaText: {
    fontSize: 11,
    fontWeight: '600',
    color: HD.textMedium,
  },
  divisor: { height: 1, marginVertical: 2 },
});