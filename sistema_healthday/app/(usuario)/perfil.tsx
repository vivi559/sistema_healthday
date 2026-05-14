/**
 * app/(usuario)/perfil.tsx
 * Tela de perfil com informações, configurações e tema escuro global.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import {
  atualizarUsuario,
  getUserAtual,
  logout,
  salvarTema,
  type User,
} from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type MenuItem = {
  id: string;
  icone: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'info',        icone: '👤', label: 'Informações do perfil'  },
  { id: 'historico',   icone: '📋', label: 'Histórico de progressão' },
  { id: 'idioma',      icone: '🌐', label: 'Idioma'                  },
  { id: 'privacidade', icone: '🔒', label: 'Privacidade e Segurança' },
];

export default function PerfilScreen() {
  const { temaDark, setTemaDark } = useTema(); // ← lê e altera o tema global
  const tema = temaDark ? darkTheme : lightTheme;

  const [user,      setUser]      = useState<User | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [modalInfo, setModalInfo] = useState(false);

  // Campos editáveis
  const [nomeEdit,   setNomeEdit]   = useState('');
  const [cidadeEdit, setCidadeEdit] = useState('');
  const [estadoEdit, setEstadoEdit] = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    async function carregar() {
      const u = await getUserAtual();
      setUser(u);
      if (u) {
        setNomeEdit(u.nome);
        setCidadeEdit(u.cidade || '');
        setEstadoEdit(u.estado || '');
      }
      setLoading(false);
    }
    carregar();
  }, []);

  async function handleTema(valor: boolean) {
    setTemaDark(valor);           // ← atualiza contexto global (reflete em todas as telas)
    await salvarTema(valor);
    if (user) await atualizarUsuario({ ...user, temaDark: valor });
  }

  async function handleSalvarInfo() {
    if (!user) return;
    setSaving(true);
    try {
      const atualizado = { ...user, nome: nomeEdit, cidade: cidadeEdit, estado: estadoEdit };
      await atualizarUsuario(atualizado);
      setUser(atualizado);
      setModalInfo(false);
      Alert.alert('✅ Salvo!', 'Informações atualizadas com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  function handleMenuItem(id: string) {
    if (id === 'info') {
      setModalInfo(true);
    } else if (id === 'historico') {
      Alert.alert(
        'Histórico',
        `IMC atual: ${user?.imc ?? '—'}\nPeso: ${user?.peso ?? '—'} kg\nAltura: ${user?.altura ?? '—'} cm`,
      );
    } else if (id === 'idioma') {
      Alert.alert('Idioma', 'Português (Brasil)');
    } else if (id === 'privacidade') {
      Alert.alert('Privacidade', 'Seus dados são armazenados localmente com segurança.');
    }
  }

  function handleSerProfissional() {
    Alert.alert(
      '🩺 Seja um Profissional',
      'Para se tornar um especialista no Health Day, entre em contato com o administrador.',
      [{ text: 'OK' }],
    );
  }

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

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Perfil</Text>
          {/* Logo no lugar da maçã */}
          <LogoHealthDay size={32} />
        </View>

        <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Card do perfil ── */}
        <View style={[styles.perfilCard, { backgroundColor: tema.card }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          </View>

          <Text style={[styles.userId,    { color: tema.subtext }]}>id:{user?.id}</Text>
          <Text style={[styles.userName,  { color: tema.text    }]}>{user?.nome}</Text>
          <Text style={[styles.userLocal, { color: tema.subtext }]}>
            {[user?.cidade, user?.estado, user?.pais].filter(Boolean).join(', ')}
          </Text>

          {user?.imc && (
            <View style={styles.imcBadge}>
              <Text style={styles.imcTxt}>IMC: {user.imc}</Text>
            </View>
          )}
        </View>

        {/* ── Menu de opções ── */}
        <View style={[styles.menuCard, { backgroundColor: tema.card }]}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: tema.border,
                },
              ]}
              onPress={() => handleMenuItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcone}>{item.icone}</Text>
                <Text style={[styles.menuItemLabel, { color: tema.text }]}>{item.label}</Text>
              </View>
              <Text style={[styles.menuChevron, { color: tema.subtext }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tema escuro + Seja Profissional ── */}
        <View style={[styles.bottomCard, { backgroundColor: tema.card }]}>
          <View style={styles.temaRow}>
            <View style={styles.temaLeft}>
              <Switch
                value={temaDark}
                onValueChange={handleTema}
                trackColor={{ false: HD.divider, true: HD.primary }}
                thumbColor={HD.white}
              />
              <Text style={[styles.temaLabel, { color: tema.text }]}>
                Tema{'\n'}Escuro
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profBtn}
              onPress={handleSerProfissional}
              activeOpacity={0.8}
            >
              <View style={styles.profIcone}>
                <Text style={styles.profIconeTxt}>＋</Text>
              </View>
              <Text style={[styles.profLabel, { color: tema.text }]}>
                Seja um{'\n'}Profissional
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Botão logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutTxt}>🚪 Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal editar informações ── */}
      <Modal
        visible={modalInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>Informações do Perfil</Text>
              <TouchableOpacity onPress={() => setModalInfo(false)}>
                <Text style={[styles.modalFechar, { color: tema.subtext }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: tema.subtext }]}>Nome</Text>
            <TextInput
              style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              value={nomeEdit}
              onChangeText={setNomeEdit}
              placeholder="Seu nome"
              placeholderTextColor={HD.placeholder}
            />

            <Text style={[styles.inputLabel, { color: tema.subtext }]}>Cidade</Text>
            <TextInput
              style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              value={cidadeEdit}
              onChangeText={setCidadeEdit}
              placeholder="Sua cidade"
              placeholderTextColor={HD.placeholder}
            />

            <Text style={[styles.inputLabel, { color: tema.subtext }]}>Estado</Text>
            <TextInput
              style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              value={estadoEdit}
              onChangeText={setEstadoEdit}
              placeholder="Seu estado"
              placeholderTextColor={HD.placeholder}
            />

            <TouchableOpacity
              style={styles.btnSalvar}
              onPress={handleSalvarInfo}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={HD.white} />
                : <Text style={styles.btnSalvarTxt}>Salvar</Text>
              }
            </TouchableOpacity>
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
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: HD.primary,
  },
  menuBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 22, color: HD.primary },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

  // Card perfil
  perfilCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: HD.divider,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: HD.primary,
  },
  avatarEmoji: { fontSize: 44 },
  userId:    { fontSize: 12, marginBottom: 4 },
  userName:  { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userLocal: { fontSize: 14, marginBottom: 12 },
  imcBadge:  {
    backgroundColor: HD.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  imcTxt: { fontSize: 13, fontWeight: '700', color: HD.primaryDark },

  // Menu card
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  menuItemLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemIcone: { fontSize: 20 },
  menuItemLabel: { fontSize: 15, fontWeight: '500' },
  menuChevron:   { fontSize: 22, fontWeight: '600' },

  // Card tema + profissional
  bottomCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  temaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  temaLeft: { alignItems: 'center', gap: 6 },
  temaLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  profBtn:   { alignItems: 'center', gap: 6 },
  profIcone: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: HD.textDark,
    alignItems: 'center', justifyContent: 'center',
  },
  profIconeTxt: { color: HD.white, fontSize: 24, fontWeight: '700', lineHeight: 30 },
  profLabel:    { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Logout
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: HD.accent },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 18, fontWeight: '800' },
  modalFechar: { fontSize: 20, fontWeight: '700' },
  inputLabel:  { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  btnSalvar: {
    backgroundColor: HD.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSalvarTxt: { fontSize: 16, fontWeight: '700', color: HD.white },
});