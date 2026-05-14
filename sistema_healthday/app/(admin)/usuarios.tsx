/**
 * app/(admin)/usuarios.tsx
 * Tela de listagem e gerenciamento de usuários.
 * CORRIGIDO: arquivo estava com o conteúdo de relatorios.tsx (código duplicado/errado).
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
  TextInput,
} from 'react-native';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema, getUsuarios, type User } from '@/constants/Storage';

type FiltroRole = 'todos' | 'usuario' | 'especialista' | 'admin';

export default function UsuariosScreen() {
  const [temaDark,  setTemaDark]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [usuarios,  setUsuarios]  = useState<User[]>([]);
  const [filtro,    setFiltro]    = useState<FiltroRole>('todos');
  const [busca,     setBusca]     = useState('');

  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const dark  = await getTema();
      const users = await getUsuarios();
      setTemaDark(dark);
      setUsuarios(users);
      setLoading(false);
    }
    carregar();
  }, []);

  const FILTROS: { label: string; valor: FiltroRole }[] = [
    { label: 'Todos',        valor: 'todos' },
    { label: 'Usuários',     valor: 'usuario' },
    { label: 'Especialistas', valor: 'especialista' },
    { label: 'Admins',       valor: 'admin' },
  ];

  const usuariosFiltrados = usuarios.filter(u => {
    const matchRole  = filtro === 'todos' || u.role === filtro;
    const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email.toLowerCase().includes(busca.toLowerCase());
    return matchRole && matchBusca;
  });

  function handleDetalhes(user: User) {
    Alert.alert(
      user.nome,
      `ID: ${user.id}\nEmail: ${user.email}\nRole: ${user.role}\nCadastro: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}`,
      [{ text: 'Fechar' }]
    );
  }

  const roleEmoji: Record<string, string> = {
    usuario:      '👤',
    especialista: '🩺',
    admin:        '🛡️',
  };

  const roleColor: Record<string, string> = {
    usuario:      HD.primary,
    especialista: HD.secondary,
    admin:        HD.accent,
  };

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
        <Text style={styles.headerTitle}>Usuários</Text>
        <Text style={[styles.headerCount, { color: tema.subtext }]}>
          {usuariosFiltrados.length} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Busca */}
      <View style={styles.buscaWrap}>
        <TextInput
          style={[styles.buscaInput, { backgroundColor: tema.card, color: tema.text }]}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor={HD.placeholder}
          value={busca}
          onChangeText={setBusca}
        />
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
            style={[styles.filtroBtn, filtro === f.valor && styles.filtroBtnAtivo]}
            onPress={() => setFiltro(f.valor)}
          >
            <Text style={[styles.filtroLabel, filtro === f.valor && styles.filtroLabelAtivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {usuariosFiltrados.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: tema.card }]}>
            <Text style={styles.emptyIcone}>👥</Text>
            <Text style={[styles.emptyTxt, { color: tema.subtext }]}>
              Nenhum usuário encontrado.
            </Text>
          </View>
        ) : (
          usuariosFiltrados.map(user => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, { backgroundColor: tema.card }]}
              onPress={() => handleDetalhes(user)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarCircle, { borderColor: roleColor[user.role] }]}>
                <Text style={styles.avatarEmoji}>{roleEmoji[user.role]}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: tema.text }]}>{user.nome}</Text>
                <Text style={[styles.userEmail, { color: tema.subtext }]}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: roleColor[user.role] + '22' }]}>
                <Text style={[styles.roleTxt, { color: roleColor[user.role] }]}>
                  {user.role}
                </Text>
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
  container:        { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: HD.primary },
  headerCount: { fontSize: 13, marginTop: 2 },

  buscaWrap: { paddingHorizontal: 20, marginBottom: 8 },
  buscaInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },

  filtrosScroll:   { maxHeight: 48 },
  filtrosContent:  { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filtroBtn:       { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: HD.divider },
  filtroBtnAtivo:  { backgroundColor: HD.primary },
  filtroLabel:     { fontSize: 13, fontWeight: '600', color: HD.textLight },
  filtroLabelAtivo:{ color: HD.white },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },

  userCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  avatarCircle: {
    width: 48, height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HD.divider,
  },
  avatarEmoji:  { fontSize: 22 },
  userInfo:     { flex: 1 },
  userName:     { fontSize: 15, fontWeight: '700' },
  userEmail:    { fontSize: 12, marginTop: 2 },
  roleBadge:    { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  roleTxt:      { fontSize: 11, fontWeight: '700' },

  emptyCard:    { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12 },
  emptyIcone:   { fontSize: 40 },
  emptyTxt:     { fontSize: 15 },
});
