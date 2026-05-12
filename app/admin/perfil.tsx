/**
 * app/(admin)/perfil.tsx
 * Tela de perfil e configurações do administrador.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import {
  getUserAtual,
  logout,
  salvarTema,
  getTema,
  type User,
} from '@/constants/Storage';

type MenuItem = {
  id: string;
  icone: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'conta',       icone: '🛡️', label: 'Dados da conta admin'      },
  { id: 'seguranca',   icone: '🔒', label: 'Segurança e acesso'         },
  { id: 'logs',        icone: '📝', label: 'Logs de atividade'          },
  { id: 'configuracoes', icone: '⚙️', label: 'Configurações do sistema' },
];

export default function AdminPerfilScreen() {
  const [user,     setUser]     = useState<User | null>(null);
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);

  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const u    = await getUserAtual();
      const dark = await getTema();
      setUser(u);
      setTemaDark(dark);
      setLoading(false);
    }
    carregar();
  }, []);

  async function handleTema(valor: boolean) {
    setTemaDark(valor);
    await salvarTema(valor);
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair do painel admin?', [
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
    if (id === 'conta') {
      Alert.alert('Conta Admin', `ID: ${user?.id}\nEmail: ${user?.email}`);
    } else if (id === 'seguranca') {
      Alert.alert('Segurança', 'Autenticação de dois fatores: desativada.');
    } else if (id === 'logs') {
      Alert.alert('Logs', 'Funcionalidade em desenvolvimento.');
    } else if (id === 'configuracoes') {
      Alert.alert('Configurações', 'Funcionalidade em desenvolvimento.');
    }
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Perfil Admin</Text>
          <View style={styles.logoMini}>
            <Text style={styles.logoMiniEmoji}>🛡️</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card admin */}
        <View style={[styles.perfilCard, { backgroundColor: tema.card }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🛡️</Text>
            </View>
          </View>
          <Text style={[styles.userId, { color: tema.subtext }]}>
            id:{user?.id}
          </Text>
          <Text style={[styles.userName, { color: tema.text }]}>
            {user?.nome}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleTxt}>Administrador</Text>
          </View>
        </View>

        {/* Menu */}
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
                <Text style={[styles.menuItemLabel, { color: tema.text }]}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.menuChevron, { color: tema.subtext }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tema */}
        <View style={[styles.bottomCard, { backgroundColor: tema.card }]}>
          <View style={styles.temaRow}>
            <Switch
              value={temaDark}
              onValueChange={handleTema}
              trackColor={{ false: HD.divider, true: HD.primary }}
              thumbColor={HD.white}
            />
            <Text style={[styles.temaLabel, { color: tema.text }]}>
              Tema Escuro
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutTxt}>🚪 Sair do painel</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: HD.primary },
  logoMini: {
    width: 32, height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: HD.primary,
    backgroundColor: HD.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  logoMiniEmoji: { fontSize: 16 },
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 22, color: HD.primary },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },

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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: HD.primary,
  },
  avatarEmoji: { fontSize: 44 },
  userId: { fontSize: 12, marginBottom: 4 },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  roleBadge: {
    backgroundColor: HD.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleTxt: { fontSize: 13, fontWeight: '700', color: HD.primaryDark },

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
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemIcone: { fontSize: 20 },
  menuItemLabel: { fontSize: 15, fontWeight: '500' },
  menuChevron: { fontSize: 22, fontWeight: '600' },

  bottomCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  temaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  temaLabel: { fontSize: 15, fontWeight: '600' },

  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: HD.accent },
});
