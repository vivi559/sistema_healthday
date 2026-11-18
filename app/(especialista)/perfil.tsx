/**
 * app/(especialista)/perfil.tsx
 * Tela de perfil do especialista — seguindo o padrão da tela de usuário.
 */

import { AvisosNaTela, Cabecalho, LARGURA_MAXIMA, avisar, confirmar } from '@/components/EspecialistaUI';
import { getAlunos } from '@/constants/EspecialistaStorage';
import {
  atualizarUsuario,
  getUserAtual,
  logout,
  type User,
} from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// O especialista guarda a especialidade junto com os dados do usuário
type Especialista = User & { especialidade?: string };

type MenuItem = {
  id: string;
  icone: IconName;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'info', icone: 'person-outline', label: 'Informações do perfil' },
  { id: 'pacientes', icone: 'groups', label: 'Meus pacientes' },
  { id: 'idioma', icone: 'language', label: 'Idioma' },
  { id: 'privacidade', icone: 'lock-outline', label: 'Privacidade e Segurança' },
];

export default function PerfilEspecialistaScreen() {
  const { temaDark, setTemaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [user, setUser] = useState<Especialista | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState(false);

  const [nomeEdit, setNomeEdit] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [cidadeEdit, setCidadeEdit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function carregar() {
      const u: Especialista | null = await getUserAtual();
      setUser(u);
      if (u) {
        setNomeEdit(u.nome);
        setCidadeEdit(u.cidade || '');
        setEspecialidade(u.especialidade || '');
      }
      setLoading(false);
    }
    carregar();
  }, []);

  async function handleTema(valor: boolean) {
    await setTemaDark(valor); // já salva a preferência
    if (user) {
      const atualizado = { ...user, temaDark: valor };
      await atualizarUsuario(atualizado);
      setUser(atualizado);
    }
  }

  async function handleSalvarInfo() {
    if (!user) return;
    if (!nomeEdit.trim()) return avisar('Atenção', 'Informe o seu nome.');
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
      avisar('Salvo!', 'Informações atualizadas com sucesso.');
    } catch {
      avisar('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    confirmar('Sair', 'Deseja sair da conta?', async () => {
      await logout();
      router.replace('/(auth)/welcome');
    }, 'Sair');
  }

  async function handleMenuItem(id: string) {
    if (id === 'info') {
      setModalInfo(true);
    } else if (id === 'pacientes') {
      const total = (await getAlunos()).length;
      avisar(
        'Meus pacientes',
        `${total} aluno(s) cadastrado(s) no app. Monte os treinos e as dietas de cada um nas abas Treinos e Dieta.`,
      );
    } else if (id === 'idioma') {
      avisar('Idioma', 'Português (Brasil)');
    } else if (id === 'privacidade') {
      avisar('Privacidade', 'Seus dados são armazenados localmente com segurança.');
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
      <Cabecalho titulo="Perfil" />

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
              <Text style={styles.especialistaTxt}>{user?.especialidade || 'Especialista'}</Text>
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

        {/* Espaço para a barra de abas não cobrir o último botão */}
        <View style={{ height: 130 }} />
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
        {/* O modal cobre a tela, então os avisos precisam ser desenhados aqui dentro também */}
        <AvisosNaTela ativo={modalInfo} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: {
    width: '100%', maxWidth: LARGURA_MAXIMA + 40, alignSelf: 'center', // não estica no navegador
    paddingHorizontal: 20, paddingTop: 8, gap: 16,
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
    maxWidth: 480,
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
