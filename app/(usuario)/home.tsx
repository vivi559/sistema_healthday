/**
 * app/(usuario)/home.tsx
 * Tela inicial com notícias criadas pelos especialistas.
 * Clique na notícia abre modal com texto completo.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { getNoticias, getUserAtual, type Noticia, type User } from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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

  const [noticias,       setNoticias]       = useState<Noticia[]>([]);
  const [user,           setUser]           = useState<User | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [noticiaAberta,  setNoticiaAberta]  = useState<Noticia | null>(null);

  // Recarrega ao focar a tela (pega notícias novas do especialista)
  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        const u = await getUserAtual();
        const n = await getNoticias();
        setUser(u);
        setNoticias(n);
        setLoading(false);
      }
      carregar();
    }, [])
  );

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
        {noticias.length === 0 ? (
          <View style={styles.vazioWrap}>
            <Text style={styles.vazioEmoji}>📰</Text>
            <Text style={[styles.vazioTxt, { color: tema.subtext }]}>
              Nenhuma notícia disponível ainda.{'\n'}Os especialistas publicarão em breve!
            </Text>
          </View>
        ) : (
          noticias.map((noticia, index) => (
            <View key={noticia.id}>
              <TouchableOpacity
                style={styles.noticiaCard}
                activeOpacity={0.8}
                onPress={() => setNoticiaAberta(noticia)}
              >
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
                  <Text style={[styles.noticiaAutor, { color: tema.subtext }]}>
                    ✍️ {noticia.autorNome} · {noticia.criadaEm}
                  </Text>
                </View>
              </TouchableOpacity>

              {index < noticias.length - 1 && (
                <View style={[styles.divisor, { backgroundColor: tema.border }]} />
              )}
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal de detalhe da notícia */}
      <Modal
        visible={!!noticiaAberta}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNoticiaAberta(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
            {/* Header do modal */}
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setNoticiaAberta(null)} style={styles.modalFecharBtn}>
                <Text style={[styles.modalFechar, { color: tema.subtext }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Imagem */}
              {noticiaAberta?.imagem ? (
                <Image
                  source={{ uri: noticiaAberta.imagem }}
                  style={styles.modalImagem}
                  resizeMode="cover"
                />
              ) : null}

              {/* Badge categoria */}
              <View style={[
                styles.categoriaBadge,
                styles.modalCategoriaBadge,
                noticiaAberta?.categoria === 'alimentacao' && { backgroundColor: HD.primaryLight },
                noticiaAberta?.categoria === 'exercicio'   && { backgroundColor: HD.secondaryLight },
                noticiaAberta?.categoria === 'saude'       && { backgroundColor: '#E0E7FF' },
              ]}>
                <Text style={styles.categoriaText}>
                  {noticiaAberta?.categoria === 'alimentacao' ? '🥗 Alimentação'
                    : noticiaAberta?.categoria === 'exercicio' ? '🏋️ Exercício'
                    : '❤️ Saúde'}
                </Text>
              </View>

              {/* Título */}
              <Text style={[styles.modalTitulo, { color: tema.text }]}>
                {noticiaAberta?.titulo}
              </Text>

              {/* Autor e data */}
              <Text style={[styles.modalAutor, { color: tema.subtext }]}>
                ✍️ {noticiaAberta?.autorNome} · {noticiaAberta?.criadaEm}
              </Text>

              {/* Texto completo */}
              <Text style={[styles.modalDescricao, { color: tema.text }]}>
                {noticiaAberta?.descricao}
              </Text>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
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

  // Saudação
  saudacao: { fontSize: 16, fontWeight: '600', paddingHorizontal: 20, marginBottom: 8 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Vazio
  vazioWrap: { alignItems: 'center', marginTop: 80, gap: 16 },
  vazioEmoji: { fontSize: 48 },
  vazioTxt:   { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // Card notícia
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
  noticiaTituloWrap: { flex: 1, gap: 6 },
  noticiaTitulo: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  noticiaAutor: { fontSize: 11 },
  categoriaBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoriaText: { fontSize: 11, fontWeight: '600', color: HD.textMedium },
  divisor: { height: 1, marginVertical: 2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  modalFecharBtn: { padding: 4 },
  modalFechar:    { fontSize: 20, fontWeight: '700' },
  modalImagem: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: HD.cardLight,
  },
  modalCategoriaBadge: { marginBottom: 12 },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  modalAutor: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalDescricao: {
    fontSize: 15,
    lineHeight: 24,
  },
});