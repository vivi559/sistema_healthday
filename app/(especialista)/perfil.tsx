/**
 * app/(especialista)/perfil.tsx
 * Tela de perfil do especialista — seguindo o padrão da tela de usuário.
 */

import HeaderEspecialista from '@/components/HeaderEspecialista';
import { ESPECIALIDADES } from '@/constants/CatalogoEspecialista';
import {
  atualizarUsuario,
  getUserAtual,
  getUsuarios,
  logout,
  salvarTema,
  type User,
} from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
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

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// O tipo User do Storage ainda não tem "especialidade"; o campo é salvo junto no JSON.
type Especialista = User & { especialidade?: string };

type MenuItem = {
  id: string;
  icone: IconName;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'info', icone: 'person-outline', label: 'Informações do perfil' },
  { id: 'pacientes', icone: 'groups', label: 'Meus pacientes' },
  { id: 'privacidade', icone: 'lock-outline', label: 'Alterar senha' },
];

export default function PerfilEspecialistaScreen() {
  const { temaDark, setTemaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [user, setUser] = useState<Especialista | null>(null);
  const [alunos, setAlunos] = useState<User[]>([]);
  const [modalPacientes, setModalPacientes] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirma, setSenhaConfirma] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState(false);

  const [nomeEdit, setNomeEdit] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [cidadeEdit, setCidadeEdit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function carregar() {
      const u = await getUserAtual();
      setUser(u);
      if (u) {
        setNomeEdit(u.nome);
        setCidadeEdit(u.cidade || '');
        setEspecialidade((u as Especialista).especialidade || '');
      }
      setLoading(false);
    }
    carregar();
  }, []);

  // Lista de alunos para "Meus pacientes"
  useFocusEffect(
    useCallback(() => {
      getUsuarios()
        .then(l => setAlunos(l.filter(x => x.role === 'usuario')))
        .catch(() => setAlunos([]));
    }, [])
  );

  async function handleTema(valor: boolean) {
    setTemaDark(valor);
    await salvarTema(valor);
    if (user) await atualizarUsuario({ ...user, temaDark: valor });
  }

  async function handleSalvarInfo() {
    if (!user) return;
    if (!nomeEdit.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }
    setSaving(true);
    try {
      const atualizado: Especialista = {
        ...user,
        nome: nomeEdit.trim(),
        cidade: cidadeEdit.trim(),
        especialidade: especialidade.trim(),
      };
      await atualizarUsuario(atualizado);
      setUser(atualizado);
      setModalInfo(false);
      Alert.alert('Salvo!', 'Informações atualizadas com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAlterarSenha() {
    if (!user) return;
    if (senhaAtual !== user.senha) return Alert.alert('Atenção', 'A senha atual está incorreta.');
    if (senhaNova.length < 6) return Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
    if (senhaNova !== senhaConfirma) return Alert.alert('Atenção', 'A confirmação não confere com a nova senha.');
    setSaving(true);
    try {
      const atualizado: Especialista = { ...user, senha: senhaNova };
      await atualizarUsuario(atualizado);
      setUser(atualizado);
      setModalSenha(false);
      Alert.alert('Senha alterada!', 'Use a nova senha no próximo login.');
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar a senha.');
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
    } else if (id === 'pacientes') {
      setModalPacientes(true);
    } else if (id === 'privacidade') {
      setSenhaAtual(''); setSenhaNova(''); setSenhaConfirma('');
      setModalSenha(true);
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

      <View style={{ paddingTop: 40 }}>
        <HeaderEspecialista titulo="Perfil" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Card do perfil ── */}
        <View style={[styles.perfilCard, { backgroundColor: tema.card }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={52} color={HD.textLight} />
            </View>
          </View>

          <Text style={[styles.userId, { color: tema.subtext }]}>id:{user?.id}</Text>
          <Text style={[styles.userName, { color: tema.text }]}>{user?.nome}</Text>
          <Text style={[styles.userLocal, { color: tema.subtext }]}>
            {[user?.cidade, user?.estado, user?.pais].filter(Boolean).join(', ')}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.especialistaBadge}>
              <Text style={styles.especialistaTxt}>{user?.especialidade?.trim() || 'Especialista'}</Text>
            </View>
          </View>
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
                <MaterialIcons name={item.icone} size={22} color={HD.primary} />
                <Text style={[styles.menuItemLabel, { color: tema.text }]}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={tema.subtext} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tema escuro ── */}
        <View style={[styles.bottomCard, { backgroundColor: tema.card }]}>
          <View style={styles.temaRow}>
            <Switch
              value={temaDark}
              onValueChange={handleTema}
              trackColor={{ false: HD.divider, true: HD.primary }}
              thumbColor={HD.white}
            />
            <Text style={[styles.temaLabel, { color: tema.text }]}>Tema Escuro</Text>
          </View>
        </View>

        {/* ── Botão logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutTxt}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal meus pacientes ── */}
      <Modal
        visible={modalPacientes}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalPacientes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>Meus Pacientes</Text>
              <TouchableOpacity onPress={() => setModalPacientes(false)}>
                <MaterialIcons name="close" size={24} color={tema.subtext} />
              </TouchableOpacity>
            </View>
            {alunos.length === 0 ? (
              <Text style={{ color: tema.subtext }}>Nenhum aluno cadastrado ainda.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {alunos.map(a => (
                  <View key={a.id} style={[styles.pacienteRow, { borderBottomColor: tema.border }]}>
                    <Text style={[styles.pacienteNome, { color: tema.text }]}>{a.nome}</Text>
                    <Text style={{ color: tema.subtext, fontSize: 12 }}>
                      ID {a.id}{a.objetivo ? ` · ${a.objetivo === 'perda' ? 'Emagrecimento' : a.objetivo === 'ganho' ? 'Ganho de massa' : 'Manutenção'}` : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal alterar senha ── */}
      <Modal
        visible={modalSenha}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalSenha(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>Alterar senha</Text>
              <TouchableOpacity onPress={() => setModalSenha(false)}>
                <MaterialIcons name="close" size={24} color={tema.subtext} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Senha atual', valor: senhaAtual, set: setSenhaAtual },
              { label: 'Nova senha', valor: senhaNova, set: setSenhaNova },
              { label: 'Confirmar nova senha', valor: senhaConfirma, set: setSenhaConfirma },
            ].map(c => (
              <View key={c.label}>
                <Text style={[styles.inputLabel, { color: tema.subtext }]}>{c.label}</Text>
                <TextInput
                  style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
                  value={c.valor}
                  onChangeText={c.set}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor={HD.placeholder}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.btnSalvar} onPress={handleAlterarSenha} activeOpacity={0.8} disabled={saving}>
              {saving
                ? <ActivityIndicator color={HD.white} />
                : <Text style={styles.btnSalvarTxt}>Alterar senha</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                <MaterialIcons name="close" size={24} color={tema.subtext} />
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

            <Text style={[styles.inputLabel, { color: tema.subtext }]}>Especialidade</Text>
            <TextInput
              style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              value={especialidade}
              onChangeText={setEspecialidade}
              placeholder="Ex: Nutricionista, Personal Trainer"
              placeholderTextColor={HD.placeholder}
            />
            <View style={styles.chipsWrap}>
              {ESPECIALIDADES.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.chip, especialidade === e && styles.chipAtivo]}
                  onPress={() => setEspecialidade(e)}
                >
                  <Text style={[styles.chipTxt, especialidade === e && { color: HD.white }]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.dica, { color: tema.subtext }]}>
              Personal gerencia a lista de exercícios; nutricionista gerencia a lista de alimentos.
            </Text>

            <Text style={[styles.inputLabel, { color: tema.subtext }]}>Cidade</Text>
            <TextInput
              style={[styles.input, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              value={cidadeEdit}
              onChangeText={setCidadeEdit}
              placeholder="Sua cidade"
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
  notifBtn: {
    position: 'relative',
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
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
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },

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
  userId: { fontSize: 12, marginBottom: 4 },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userLocal: { fontSize: 14, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  especialistaBadge: {
    backgroundColor: HD.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  especialistaTxt: { fontSize: 13, fontWeight: '700', color: HD.primaryDark },

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
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemLabel: { fontSize: 15, fontWeight: '500' },

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
  temaLabel: { fontSize: 14, fontWeight: '600' },

  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: HD.accent },

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
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: HD.divider },
  chipAtivo: { backgroundColor: HD.primary },
  chipTxt: { fontSize: 12, fontWeight: '600', color: HD.textMedium },
  dica: { fontSize: 11, marginBottom: 14 },
  pacienteRow: { paddingVertical: 12, borderBottomWidth: 1 },
  pacienteNome: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
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
