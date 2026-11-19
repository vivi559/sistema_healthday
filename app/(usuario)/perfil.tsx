/**
 * app/(usuario)/perfil.tsx
 * Perfil do usuário: foto, dados do questionário, histórico de peso,
 * idioma, privacidade (trocar senha), tema escuro e logout.
 */

import LogoHealthDay from "@/components/LogoHealthDay";
import SinoLembretes from "@/components/SinoLembretes";
import {
  atualizarUsuario,
  calcularIMC,
  classificarIMC,
  getHistoricoPeso,
  getQuestionario,
  getUserAtual,
  logout,
  registrarPeso,
  salvarTema,
  type RegistroPeso,
  type RespostasQuestionario,
  type User,
} from "@/constants/Storage";
import { HD, darkTheme, lightTheme } from "@/constants/theme";
import { useTema } from "@/context/TemaContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = ComponentProps<typeof MaterialIcons>["name"];
type Tema = typeof lightTheme;

type MenuItem = { id: string; icone: IconName; label: string };

const MENU_ITEMS: MenuItem[] = [
  { id: "info", icone: "person-outline", label: "Informações do perfil" },
  { id: "historico", icone: "history", label: "Histórico de progressão" },
  { id: "idioma", icone: "language", label: "Idioma" },
  { id: "privacidade", icone: "lock-outline", label: "Privacidade e Segurança" },
];

// Rótulos legíveis para os dados do questionário
const ROT_OBJETIVO: Record<string, string> = {
  perda: "Perder peso",
  ganho: "Ganhar massa",
  manutencao: "Manter o peso",
};
const ROT_ATIVIDADE: Record<string, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
};
const ROT_RESTRICAO: Record<string, string> = {
  nenhuma: "Nenhuma",
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  semGluten: "Sem glúten",
  semLactose: "Sem lactose",
};
const ROT_NIVEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};
const ROT_LOCAL: Record<string, string> = {
  academia: "Academia",
  casa: "Em casa",
  ar_livre: "Ao ar livre",
};

function formatarData(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// Diálogo simples (Alert.alert não funciona no navegador)
type Dialogo = {
  titulo: string;
  texto: string;
  confirmar?: { rotulo: string; perigo?: boolean; onPress: () => void };
} | null;

// ─── Modal padrão com título e botão de fechar ────────────────────────────────
function ModalCard({
  visible,
  titulo,
  onClose,
  tema,
  children,
}: {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  tema: Tema;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitulo, { color: tema.text }]}>{titulo}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={tema.subtext} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DadoLinha({ rotulo, valor, tema }: { rotulo: string; valor: string; tema: Tema }) {
  return (
    <View style={styles.dadoLinha}>
      <Text style={[styles.dadoRotulo, { color: tema.subtext }]}>{rotulo}</Text>
      <Text style={[styles.dadoValor, { color: tema.text }]}>{valor}</Text>
    </View>
  );
}

export default function PerfilScreen() {
  const { temaDark, setTemaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [user, setUser] = useState<User | null>(null);
  const [quest, setQuest] = useState<RespostasQuestionario | null>(null);
  const [historico, setHistorico] = useState<RegistroPeso[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalInfo, setModalInfo] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [modalIdioma, setModalIdioma] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [dialogo, setDialogo] = useState<Dialogo>(null);

  // Editar informações
  const [nomeEdit, setNomeEdit] = useState("");
  const [cidadeEdit, setCidadeEdit] = useState("");
  const [estadoEdit, setEstadoEdit] = useState("");
  const [saving, setSaving] = useState(false);

  // Registrar peso
  const [pesoNovo, setPesoNovo] = useState("");
  const [erroPeso, setErroPeso] = useState("");

  // Trocar senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirma, setSenhaConfirma] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  // Recarrega sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregar() {
        const u = await getUserAtual();
        if (!ativo) return;
        setUser(u);
        if (u) {
          setQuest(await getQuestionario(u.id));
          setHistorico(await getHistoricoPeso(u.id));
        }
        setLoading(false);
      }
      carregar();
      return () => {
        ativo = false;
      };
    }, []),
  );

  function aviso(titulo: string, texto: string) {
    setDialogo({ titulo, texto });
  }

  // ─── Foto de perfil ─────────────────────────────────────────────────────────
  async function escolherFoto() {
    if (!user) return;
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        aviso("Permissão necessária", "Permita o acesso às fotos para escolher uma imagem.");
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // baixa qualidade: a foto fica salva dentro do usuário
      base64: true,
    });
    if (res.canceled) return;

    const asset = res.assets[0];
    const foto = asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;
    const atualizado = { ...user, foto };
    await atualizarUsuario(atualizado);
    setUser(atualizado);
  }

  // ─── Tema ───────────────────────────────────────────────────────────────────
  async function handleTema(valor: boolean) {
    setTemaDark(valor);
    await salvarTema(valor);
    if (user) await atualizarUsuario({ ...user, temaDark: valor });
  }

  // ─── Editar informações ─────────────────────────────────────────────────────
  function abrirInfo() {
    if (!user) return;
    setNomeEdit(user.nome);
    setCidadeEdit(user.cidade || "");
    setEstadoEdit(user.estado || "");
    setModalInfo(true);
  }

  async function handleSalvarInfo() {
    if (!user) return;
    if (!nomeEdit.trim()) {
      aviso("Atenção", "O nome não pode ficar vazio.");
      return;
    }
    setSaving(true);
    try {
      const atualizado = {
        ...user,
        nome: nomeEdit.trim(),
        cidade: cidadeEdit,
        estado: estadoEdit,
      };
      await atualizarUsuario(atualizado);
      setUser(atualizado);
      setModalInfo(false);
      aviso("Salvo!", "Informações atualizadas com sucesso.");
    } catch {
      setModalInfo(false);
      aviso("Erro", "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Histórico de peso ──────────────────────────────────────────────────────
  async function handleRegistrarPeso() {
    if (!user) return;
    const p = parseFloat(pesoNovo.replace(",", "."));
    if (isNaN(p) || p < 20 || p > 300) {
      setErroPeso("Digite um peso válido (20–300 kg).");
      return;
    }
    await registrarPeso(user.id, p, user.altura);
    const atualizado: User = {
      ...user,
      peso: p,
      imc: user.altura ? calcularIMC(p, user.altura) : user.imc,
    };
    await atualizarUsuario(atualizado);
    setUser(atualizado);
    setHistorico(await getHistoricoPeso(user.id));
    setPesoNovo("");
    setErroPeso("");
  }

  // ─── Trocar senha ───────────────────────────────────────────────────────────
  function abrirSenha() {
    setSenhaAtual("");
    setSenhaNova("");
    setSenhaConfirma("");
    setErroSenha("");
    setModalSenha(true);
  }

  async function handleTrocarSenha() {
    if (!user) return;
    if (senhaAtual !== user.senha) return setErroSenha("A senha atual está incorreta.");
    if (senhaNova.length < 6) return setErroSenha("A nova senha precisa ter pelo menos 6 caracteres.");
    if (senhaNova !== senhaConfirma) return setErroSenha("A confirmação não confere com a nova senha.");

    const atualizado = { ...user, senha: senhaNova };
    await atualizarUsuario(atualizado);
    setUser(atualizado);
    setModalSenha(false);
    aviso("Senha alterada!", "Use a nova senha no próximo login.");
  }

  // ─── Menu ───────────────────────────────────────────────────────────────────
  function handleMenuItem(id: string) {
    if (id === "info") abrirInfo();
    else if (id === "historico") {
      setPesoNovo("");
      setErroPeso("");
      setModalHistorico(true);
    } else if (id === "idioma") setModalIdioma(true);
    else if (id === "privacidade") abrirSenha();
  }

  // ─── Questionário / profissional / logout ───────────────────────────────────
  function handleRefazerQuestionario() {
    setDialogo({
      titulo: "Refazer questionário",
      texto:
        "Será gerada uma nova dieta e um novo treino automáticos, substituindo os atuais (inclusive os alimentos extras que você adicionou). Deseja continuar?",
      confirmar: {
        rotulo: "Refazer",
        onPress: () => router.push("/(auth)/questionario"),
      },
    });
  }

  // Abre o questionário de pré-seleção para quem quer ser especialista
  function handleSerProfissional() {
    router.push("/seja-profissional");
  }

  function handleLogout() {
    setDialogo({
      titulo: "Sair da conta",
      texto: "Deseja realmente sair da sua conta?",
      confirmar: {
        rotulo: "Sair",
        perigo: true,
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    });
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tema.background }]}>
        <ActivityIndicator size="large" color={HD.primary} />
      </View>
    );
  }

  const inputStyle = [
    styles.input,
    { color: tema.text, borderColor: tema.border, backgroundColor: tema.background },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? "light-content" : "dark-content"}
        backgroundColor={tema.background}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Sino: próximos lembretes da Agenda */}
        <SinoLembretes />

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <LogoHealthDay size={32} />
        </View>

        <View style={styles.menuBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Card do perfil ── */}
        <View style={[styles.perfilCard, { backgroundColor: tema.card }]}>
          <TouchableOpacity style={styles.avatarWrap} onPress={escolherFoto} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {user?.foto ? (
                <Image source={{ uri: user.foto }} style={styles.avatarImg} />
              ) : (
                <MaterialIcons name="person" size={52} color={HD.textLight} />
              )}
            </View>
            <View style={styles.cameraBadge}>
              <MaterialIcons name="photo-camera" size={16} color={HD.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.fotoDica, { color: tema.subtext }]}>
            {user?.foto ? "Toque para trocar a foto" : "Toque para adicionar uma foto"}
          </Text>

          <Text style={[styles.userId, { color: tema.subtext }]}>id:{user?.id}</Text>
          <Text style={[styles.userName, { color: tema.text }]}>{user?.nome}</Text>
          <Text style={[styles.userLocal, { color: tema.subtext }]}>
            {[user?.cidade, user?.estado, user?.pais].filter(Boolean).join(", ")}
          </Text>

          {user?.imc ? (
            <View style={styles.imcBadge}>
              <Text style={styles.imcTxt}>
                IMC: {user.imc} · {classificarIMC(user.imc)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Meus dados (questionário) ── */}
        <View style={[styles.dadosCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.dadosTitulo, { color: tema.text }]}>Meus dados</Text>

          {quest ? (
            <>
              <DadoLinha tema={tema} rotulo="Peso atual" valor={`${user?.peso ?? quest.peso} kg`} />
              <DadoLinha tema={tema} rotulo="Altura" valor={`${user?.altura ?? quest.altura} cm`} />
              <DadoLinha tema={tema} rotulo="Idade" valor={`${quest.idade} anos`} />
              <DadoLinha tema={tema} rotulo="Objetivo" valor={ROT_OBJETIVO[quest.objetivo] ?? "—"} />
              <DadoLinha tema={tema} rotulo="Atividade física" valor={ROT_ATIVIDADE[quest.nivelAtividade] ?? "—"} />
              <DadoLinha tema={tema} rotulo="Restrição alimentar" valor={ROT_RESTRICAO[quest.restricao] ?? "—"} />
              <DadoLinha tema={tema} rotulo="Refeições por dia" valor={`${quest.refeicoesPorDia}`} />
              <DadoLinha
                tema={tema}
                rotulo="Treino"
                valor={`${ROT_NIVEL[quest.nivelTreino] ?? "—"} · ${ROT_LOCAL[quest.localTreino] ?? "—"} · ${quest.diasTreino}x/sem`}
              />
            </>
          ) : (
            <Text style={[styles.dadosVazio, { color: tema.subtext }]}>
              Você ainda não respondeu o questionário.
            </Text>
          )}

          <TouchableOpacity style={styles.btnRefazer} onPress={handleRefazerQuestionario} activeOpacity={0.8}>
            <MaterialIcons name="refresh" size={18} color={HD.primary} />
            <Text style={styles.btnRefazerTxt}>
              {quest ? "Refazer questionário" : "Responder questionário"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Menu de opções ── */}
        <View style={[styles.menuCard, { backgroundColor: tema.card }]}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.border },
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
              <Text style={[styles.temaLabel, { color: tema.text }]}>Tema{"\n"}Escuro</Text>
            </View>

            <TouchableOpacity style={styles.profBtn} onPress={handleSerProfissional} activeOpacity={0.8}>
              <View style={styles.profIcone}>
                <MaterialIcons name="add" size={26} color={HD.white} />
              </View>
              <Text style={[styles.profLabel, { color: tema.text }]}>Seja um{"\n"}Profissional</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Botão logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutTxt}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: editar informações ── */}
      <ModalCard visible={modalInfo} titulo="Informações do Perfil" onClose={() => setModalInfo(false)} tema={tema}>
        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Nome</Text>
        <TextInput style={inputStyle} value={nomeEdit} onChangeText={setNomeEdit} placeholder="Seu nome" placeholderTextColor={HD.placeholder} />

        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Cidade</Text>
        <TextInput style={inputStyle} value={cidadeEdit} onChangeText={setCidadeEdit} placeholder="Sua cidade" placeholderTextColor={HD.placeholder} />

        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Estado</Text>
        <TextInput style={inputStyle} value={estadoEdit} onChangeText={setEstadoEdit} placeholder="Seu estado" placeholderTextColor={HD.placeholder} />

        <TouchableOpacity style={styles.btnPrimario} onPress={handleSalvarInfo} activeOpacity={0.8} disabled={saving}>
          {saving ? <ActivityIndicator color={HD.white} /> : <Text style={styles.btnPrimarioTxt}>Salvar</Text>}
        </TouchableOpacity>
      </ModalCard>

      {/* ── Modal: histórico de progressão ── */}
      <ModalCard visible={modalHistorico} titulo="Histórico de progressão" onClose={() => setModalHistorico(false)} tema={tema}>
        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Registrar peso de hoje (kg)</Text>
        <View style={styles.pesoRow}>
          <TextInput
            style={[inputStyle, { flex: 1, marginBottom: 0 }]}
            value={pesoNovo}
            onChangeText={(v) => {
              setPesoNovo(v);
              setErroPeso("");
            }}
            placeholder="Ex: 72.5"
            placeholderTextColor={HD.placeholder}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.btnRegistrar} onPress={handleRegistrarPeso} activeOpacity={0.8}>
            <Text style={styles.btnPrimarioTxt}>Registrar</Text>
          </TouchableOpacity>
        </View>
        {erroPeso ? <Text style={styles.erro}>{erroPeso}</Text> : null}

        <Text style={[styles.histTitulo, { color: tema.text }]}>Registros</Text>
        {historico.length === 0 ? (
          <Text style={[styles.dadosVazio, { color: tema.subtext }]}>
            Nenhum registro ainda.{user?.peso ? ` Seu peso atual cadastrado é ${user.peso} kg.` : ""} Registre seu peso para acompanhar sua evolução.
          </Text>
        ) : (
          historico.map((r, i) => {
            const anterior = historico[i + 1]; // lista vem do mais recente para o mais antigo
            const dif = anterior ? Math.round((r.peso - anterior.peso) * 10) / 10 : null;
            return (
              <View key={`${r.data}-${i}`} style={[styles.histLinha, { borderBottomColor: tema.border }]}>
                <View>
                  <Text style={[styles.histPeso, { color: tema.text }]}>{r.peso} kg</Text>
                  <Text style={[styles.histData, { color: tema.subtext }]}>
                    {formatarData(r.data)}
                    {r.imc ? ` · IMC ${r.imc}` : ""}
                  </Text>
                </View>
                {dif !== null && dif !== 0 && (
                  <View style={styles.difWrap}>
                    <MaterialIcons
                      name={dif > 0 ? "arrow-upward" : "arrow-downward"}
                      size={16}
                      color={dif > 0 ? HD.accent : "#16A34A"}
                    />
                    <Text style={{ color: dif > 0 ? HD.accent : "#16A34A", fontWeight: "700" }}>
                      {Math.abs(dif)} kg
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ModalCard>

      {/* ── Modal: idioma ── */}
      <ModalCard visible={modalIdioma} titulo="Idioma" onClose={() => setModalIdioma(false)} tema={tema}>
        <View style={[styles.idiomaLinha, { borderBottomColor: tema.border }]}>
          <Text style={[styles.menuItemLabel, { color: tema.text }]}>Português (Brasil)</Text>
          <MaterialIcons name="check-circle" size={22} color={HD.primary} />
        </View>
        <View style={styles.idiomaLinha}>
          <Text style={[styles.menuItemLabel, { color: tema.subtext }]}>English</Text>
          <Text style={[styles.emBreve, { color: tema.subtext }]}>em breve</Text>
        </View>
      </ModalCard>

      {/* ── Modal: privacidade e segurança (trocar senha) ── */}
      <ModalCard visible={modalSenha} titulo="Privacidade e Segurança" onClose={() => setModalSenha(false)} tema={tema}>
        <Text style={[styles.dadosVazio, { color: tema.subtext, marginBottom: 16 }]}>
          Seus dados ficam armazenados neste aparelho. Aqui você pode alterar a sua senha.
        </Text>

        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Senha atual</Text>
        <TextInput style={inputStyle} value={senhaAtual} onChangeText={(v) => { setSenhaAtual(v); setErroSenha(""); }} secureTextEntry placeholder="Senha atual" placeholderTextColor={HD.placeholder} />

        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Nova senha</Text>
        <TextInput style={inputStyle} value={senhaNova} onChangeText={(v) => { setSenhaNova(v); setErroSenha(""); }} secureTextEntry placeholder="Mínimo 6 caracteres" placeholderTextColor={HD.placeholder} />

        <Text style={[styles.inputLabel, { color: tema.subtext }]}>Confirmar nova senha</Text>
        <TextInput style={inputStyle} value={senhaConfirma} onChangeText={(v) => { setSenhaConfirma(v); setErroSenha(""); }} secureTextEntry placeholder="Repita a nova senha" placeholderTextColor={HD.placeholder} />

        {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}

        <TouchableOpacity style={styles.btnPrimario} onPress={handleTrocarSenha} activeOpacity={0.8}>
          <Text style={styles.btnPrimarioTxt}>Alterar senha</Text>
        </TouchableOpacity>
      </ModalCard>

      {/* ── Diálogo de aviso / confirmação ── */}
      <Modal visible={!!dialogo} animationType="fade" transparent onRequestClose={() => setDialogo(null)}>
        <View style={styles.dialogoOverlay}>
          <View style={[styles.dialogoCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.dialogoTitulo, { color: tema.text }]}>{dialogo?.titulo}</Text>
            <Text style={[styles.dialogoTexto, { color: tema.subtext }]}>{dialogo?.texto}</Text>

            <View style={styles.dialogoBotoes}>
              {dialogo?.confirmar ? (
                <>
                  <TouchableOpacity
                    style={[styles.dialogoBtn, styles.dialogoBtnCancelar, { borderColor: tema.border }]}
                    onPress={() => setDialogo(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dialogoBtnTxt, { color: tema.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dialogoBtn,
                      { backgroundColor: dialogo.confirmar.perigo ? HD.accent : HD.primary },
                    ]}
                    onPress={() => {
                      const acao = dialogo.confirmar!.onPress;
                      setDialogo(null);
                      acao();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dialogoBtnTxt, { color: HD.white }]}>{dialogo.confirmar.rotulo}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.dialogoBtn, { backgroundColor: HD.primary }]}
                  onPress={() => setDialogo(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dialogoBtnTxt, { color: HD.white }]}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  notifBtn: { position: "relative", width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notifBadge: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: HD.accent },
  headerCenter: { alignItems: "center", gap: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: HD.primary },
  menuBtn: { width: 40, height: 40 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 16 },

  // Card perfil
  perfilCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarWrap: { marginBottom: 6 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: HD.divider,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: HD.primary,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: HD.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: HD.white,
  },
  fotoDica: { fontSize: 11, marginBottom: 10 },
  userId: { fontSize: 12, marginBottom: 4 },
  userName: { fontSize: 24, fontWeight: "800", marginBottom: 4, textAlign: "center" },
  userLocal: { fontSize: 14, marginBottom: 12 },
  imcBadge: { backgroundColor: HD.primaryLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  imcTxt: { fontSize: 13, fontWeight: "700", color: HD.primaryDark },

  // Meus dados
  dadosCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dadosTitulo: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  dadosVazio: { fontSize: 14, lineHeight: 20 },
  dadoLinha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, gap: 12 },
  dadoRotulo: { fontSize: 13 },
  dadoValor: { fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  btnRefazer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: HD.primary,
    borderRadius: 30,
    paddingVertical: 11,
    marginTop: 14,
  },
  btnRefazerTxt: { fontSize: 14, fontWeight: "700", color: HD.primary },

  // Menu card
  menuCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuItemLabel: { fontSize: 15, fontWeight: "500" },

  // Tema + profissional
  bottomCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  temaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  temaLeft: { alignItems: "center", gap: 6 },
  temaLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  profBtn: { alignItems: "center", gap: 6 },
  profIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HD.textDark,
    alignItems: "center",
    justifyContent: "center",
  },
  profLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  // Logout
  logoutBtn: { backgroundColor: "#FEE2E2", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  logoutTxt: { fontSize: 15, fontWeight: "700", color: HD.accent },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxHeight: "88%",
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitulo: { fontSize: 18, fontWeight: "800" },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  btnPrimario: {
    backgroundColor: HD.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimarioTxt: { fontSize: 16, fontWeight: "700", color: HD.white },
  erro: { color: HD.accent, fontSize: 13, fontWeight: "600", marginBottom: 12 },

  // Histórico
  pesoRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 },
  btnRegistrar: {
    backgroundColor: HD.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  histTitulo: { fontSize: 15, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  histLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  histPeso: { fontSize: 16, fontWeight: "800" },
  histData: { fontSize: 12, marginTop: 2 },
  difWrap: { flexDirection: "row", alignItems: "center", gap: 2 },

  // Idioma
  idiomaLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  emBreve: { fontSize: 12, fontStyle: "italic" },

  // Diálogo
  dialogoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogoCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dialogoTitulo: { fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  dialogoTexto: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  dialogoBotoes: { flexDirection: "row", gap: 12 },
  dialogoBtn: { flex: 1, borderRadius: 30, paddingVertical: 13, alignItems: "center" },
  dialogoBtnCancelar: { borderWidth: 1.5 },
  dialogoBtnTxt: { fontSize: 15, fontWeight: "700" },
});