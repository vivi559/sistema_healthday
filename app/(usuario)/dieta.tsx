/**
 * app/(usuario)/dieta.tsx
 * Tela de dieta com banner automático, solicitar especialista e adicionar alimento extra.
 */

import LogoHealthDay from "@/components/LogoHealthDay";
import {
  adicionarAlimentoExtra,
  alimentosSeed,
  criarSolicitacao,
  getDietaUsuario,
  getSolicitacoesUsuario,
  getUserAtual,
  inicializarStorage,
  type Alimento,
  type Dieta,
  type RefeicaoDieta,
} from "@/constants/Storage";
import { HD, darkTheme, lightTheme } from "@/constants/theme";
import { useTema } from "@/context/TemaContext";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Tela = "dieta" | "busca";

export default function DietaScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [tela, setTela] = useState<Tela>("dieta");
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState<string[]>(["Janta"]);
  const [busca, setBusca] = useState("");
  const [refeicaoAtual, setRefeicaoAtual] = useState<string>("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [jaSolicitou, setJaSolicitou] = useState(false);

  // Modal de quantidade
  const [modalQtd, setModalQtd] = useState(false);
  const [alimentoSel, setAlimentoSel] = useState<Alimento | null>(null);
  const [gramas, setGramas] = useState("100");

  useEffect(() => {
    async function carregar() {
      await inicializarStorage();
      const user = await getUserAtual();
      if (user) {
        setUserId(user.id);
        setUserName(user.nome);
        const d = await getDietaUsuario(user.id);
        setDieta(d ?? (await getDietaUsuario("0001")));
        // Verifica se já tem solicitação pendente/em andamento
        const sols = await getSolicitacoesUsuario(user.id);
        const ativa = sols.find(
          (s) => s.tipo === "dieta" && s.status !== "concluida",
        );
        setJaSolicitou(!!ativa);
      }
      setLoading(false);
    }
    carregar();
  }, []);

  function toggleRefeicao(tipo: string) {
    setExpandidos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  }

  function calcKcalRefeicao(refeicao: RefeicaoDieta): number {
    return refeicao.alimentos.reduce((acc, item) => {
      return acc + Math.round((item.alimento.kcalPor100g * item.gramas) / 100);
    }, 0);
  }

  function abrirBusca(tipoRefeicao: string) {
    setRefeicaoAtual(tipoRefeicao);
    setBusca("");
    setTela("busca");
  }

  function selecionarAlimento(alimento: Alimento) {
    setAlimentoSel(alimento);
    setGramas("100");
    setModalQtd(true);
  }

  async function confirmarAlimento() {
    if (!alimentoSel || !userId) return;
    const g = parseInt(gramas);
    if (isNaN(g) || g <= 0) {
      Alert.alert("Atenção", "Digite uma quantidade válida em gramas.");
      return;
    }
    await adicionarAlimentoExtra(
      userId,
      refeicaoAtual as RefeicaoDieta["tipo"],
      alimentoSel,
      g,
    );
    const novadieta = await getDietaUsuario(userId);
    setDieta(novadieta);
    setModalQtd(false);
    setTela("dieta");
    Alert.alert(
      "✅ Adicionado!",
      `${g}g de ${alimentoSel.nome} adicionado em ${refeicaoAtual}.`,
    );
  }

  async function handleSolicitarEspecialista() {
    if (jaSolicitou) {
      Alert.alert(
        "Já solicitado",
        "Você já tem uma solicitação de dieta em andamento. Aguarde o especialista.",
      );
      return;
    }
    Alert.alert(
      "🩺 Solicitar Dieta Personalizada",
      "Deseja solicitar uma dieta personalizada feita por um especialista?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            await criarSolicitacao({
              usuarioId: userId,
              usuarioNome: userName,
              tipo: "dieta",
              mensagem: "Usuário solicitou dieta personalizada pelo app.",
            });
            setJaSolicitou(true);
            Alert.alert(
              "✅ Solicitação enviada!",
              "Um especialista irá criar sua dieta personalizada em breve.",
            );
          },
        },
      ],
    );
  }

  const alimentosFiltrados = alimentosSeed.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: tema.background }]}
      >
        <ActivityIndicator size="large" color={HD.primary} />
      </View>
    );
  }

  // ── Tela de busca ──────────────────────────────────────────────────────────
  if (tela === "busca") {
    return (
      <View style={[styles.container, { backgroundColor: tema.background }]}>
        <StatusBar
          barStyle={temaDark ? "light-content" : "dark-content"}
          backgroundColor={tema.background}
        />

        <View style={[styles.header, { backgroundColor: tema.background }]}>
          <TouchableOpacity
            onPress={() => setTela("dieta")}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Dieta</Text>
            <LogoHealthDay size={32} />
          </View>
          <View style={{ width: 70 }} />
        </View>

        <Text style={[styles.buscaInfo, { color: tema.subtext }]}>
          Adicionando em:{" "}
          <Text style={{ fontWeight: "700", color: HD.secondary }}>
            {refeicaoAtual}
          </Text>
        </Text>

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
              <TouchableOpacity
                style={styles.alimentoItem}
                activeOpacity={0.7}
                onPress={() => selecionarAlimento(alimento)}
              >
                <View>
                  <Text style={[styles.alimentoNome, { color: tema.text }]}>
                    {alimento.nome}
                  </Text>
                  <Text style={[styles.alimentoKcal, { color: tema.subtext }]}>
                    {alimento.kcalPor100g}kcal/100g
                  </Text>
                </View>
                <Text style={[styles.alimentoSeta, { color: HD.primary }]}>
                  ＋
                </Text>
              </TouchableOpacity>
              {index < alimentosFiltrados.length - 1 && (
                <View
                  style={[styles.divisor, { backgroundColor: tema.border }]}
                />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Modal de quantidade */}
        <Modal
          visible={modalQtd}
          transparent
          animationType="slide"
          onRequestClose={() => setModalQtd(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: tema.card }]}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>
                Quantidade
              </Text>
              <Text style={[styles.modalSub, { color: tema.subtext }]}>
                {alimentoSel?.nome}
              </Text>
              <Text style={[styles.modalKcal, { color: tema.subtext }]}>
                {alimentoSel
                  ? Math.round(
                      (alimentoSel.kcalPor100g * parseInt(gramas || "0")) / 100,
                    )
                  : 0}{" "}
                kcal
              </Text>
              <TextInput
                style={[
                  styles.qtdInput,
                  {
                    color: tema.text,
                    borderColor: tema.border,
                    backgroundColor: tema.background,
                  },
                ]}
                value={gramas}
                onChangeText={setGramas}
                keyboardType="numeric"
                placeholder="gramas"
                placeholderTextColor={HD.placeholder}
              />
              <Text style={[styles.qtdLabel, { color: tema.subtext }]}>
                gramas
              </Text>
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalBtnCancelar}
                  onPress={() => setModalQtd(false)}
                >
                  <Text style={styles.modalBtnCancelarTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtnAdicionar}
                  onPress={confirmarAlimento}
                >
                  <Text style={styles.modalBtnAdicionarTxt}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Tela principal ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? "light-content" : "dark-content"}
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
            <Text style={[styles.semDietaTitulo, { color: tema.text }]}>
              Nenhuma dieta encontrada
            </Text>
            <Text style={[styles.semDietaSub, { color: tema.subtext }]}>
              Complete o questionário de perfil para receber sua dieta
              personalizada.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Banner automático ── */}
            <View
              style={[
                styles.bannerAutomatico,
                {
                  backgroundColor: jaSolicitou ? "#D1FAE5" : HD.secondaryLight,
                },
              ]}
            >
              <View style={styles.bannerAutoLeft}>
                <Text style={styles.bannerAutoEmoji}>
                  {jaSolicitou ? "⏳" : "🤖"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.bannerAutoTitulo,
                      { color: jaSolicitou ? "#065F46" : HD.primaryDark },
                    ]}
                  >
                    {jaSolicitou
                      ? "Solicitação enviada!"
                      : "Dieta gerada automaticamente"}
                  </Text>
                  <Text
                    style={[
                      styles.bannerAutoSub,
                      { color: jaSolicitou ? "#065F46" : HD.primaryDark },
                    ]}
                  >
                    {jaSolicitou
                      ? "Aguardando o especialista criar sua dieta personalizada."
                      : "Baseada nas suas respostas do questionário."}
                  </Text>
                </View>
              </View>
              {!jaSolicitou && (
                <TouchableOpacity
                  style={styles.bannerAutoBtn}
                  onPress={handleSolicitarEspecialista}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bannerAutoBtnTxt}>
                    Solicitar especialista
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Banner de macros */}
            <View style={[styles.bannerCard, { backgroundColor: tema.card }]}>
              <Text style={styles.bannerEmoji}>🥦🥕🍅</Text>
              <Text style={[styles.bannerTitulo, { color: tema.subtext }]}>
                {dieta.titulo}
              </Text>
              <View style={styles.macrosRow}>
                <View
                  style={[styles.macroItem, { backgroundColor: HD.primary }]}
                >
                  <Text style={styles.macroLabel}>Carbo{"\n"}Total</Text>
                  <Text style={styles.macroValor}>{dieta.carboTotal}g</Text>
                </View>
                <View
                  style={[styles.macroItem, { backgroundColor: HD.secondary }]}
                >
                  <Text style={styles.macroLabel}>Proteínas{"\n"}Total</Text>
                  <Text style={styles.macroValor}>{dieta.proteinasTotal}g</Text>
                </View>
                <View
                  style={[styles.macroItem, { backgroundColor: HD.accent }]}
                >
                  <Text style={styles.macroLabel}>Gorduras{"\n"}Total</Text>
                  <Text style={styles.macroValor}>{dieta.gordurasTotal}g</Text>
                </View>
                <View
                  style={[styles.macroItem, { backgroundColor: "#8B5CF6" }]}
                >
                  <Text style={styles.macroLabel}>Kcal{"\n"}Total</Text>
                  <Text style={styles.macroValor}>{dieta.kcalTotal}</Text>
                </View>
              </View>
            </View>

            {/* Refeições */}
            {dieta.refeicoes.map((refeicao) => {
              const isExpanded = expandidos.includes(refeicao.tipo);
              const kcal = calcKcalRefeicao(refeicao);
              return (
                <View
                  key={refeicao.tipo}
                  style={[styles.refeicaoCard, { backgroundColor: tema.card }]}
                >
                  <TouchableOpacity
                    style={styles.refeicaoHeader}
                    onPress={() => toggleRefeicao(refeicao.tipo)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.refeicaoHeaderLeft}>
                      <Text
                        style={[styles.refeicaoTitulo, { color: tema.text }]}
                      >
                        {refeicao.tipo}
                      </Text>
                      <TouchableOpacity
                        onPress={() => abrirBusca(refeicao.tipo)}
                        style={styles.addBtn}
                      >
                        <Text style={styles.addBtnText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.refeicaoHeaderRight}>
                      <Text
                        style={[styles.refeicaoKcal, { color: tema.subtext }]}
                      >
                        {kcal}Kcal
                      </Text>
                      <Text
                        style={[styles.refeicaoSeta, { color: tema.subtext }]}
                      >
                        {isExpanded ? "∧" : "∨"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.alimentosLista}>
                      {refeicao.alimentos.map((item, idx) => {
                        const kcalItem = Math.round(
                          (item.alimento.kcalPor100g * item.gramas) / 100,
                        );
                        return (
                          <View key={idx} style={styles.alimentoRow}>
                            <View style={styles.alimentoRowLeft}>
                              {item.extra && (
                                <Text style={styles.extraTag}>extra</Text>
                              )}
                              <Text
                                style={[
                                  styles.alimentoRowNome,
                                  { color: tema.subtext },
                                ]}
                              >
                                {item.gramas}g de {item.alimento.nome}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.alimentoRowKcal,
                                { color: tema.subtext },
                              ]}
                            >
                              {kcalItem}Kcal
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <View
                    style={[styles.divisor, { backgroundColor: tema.border }]}
                  />
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  notifBtn: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HD.accent,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: HD.primary },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: { fontSize: 22, color: HD.primary },
  backBtn: { paddingVertical: 8, paddingRight: 8 },
  backText: { fontSize: 15, color: HD.primary, fontWeight: "600" },
  buscaInfo: { fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  semDieta: { alignItems: "center", marginTop: 60, paddingHorizontal: 20 },
  semDietaEmoji: { fontSize: 56, marginBottom: 16 },
  semDietaTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  semDietaSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Banner automático
  bannerAutomatico: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bannerAutoLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  bannerAutoEmoji: { fontSize: 24 },
  bannerAutoTitulo: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  bannerAutoSub: { fontSize: 12, lineHeight: 17 },
  bannerAutoBtn: {
    backgroundColor: HD.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerAutoBtnTxt: { fontSize: 14, fontWeight: "700", color: HD.white },

  bannerCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerEmoji: { fontSize: 40, marginBottom: 6 },
  bannerTitulo: { fontSize: 14, marginBottom: 14 },
  macrosRow: { flexDirection: "row", gap: 6, width: "100%" },
  macroItem: { flex: 1, borderRadius: 10, padding: 8, alignItems: "center" },
  macroLabel: {
    fontSize: 9,
    color: HD.white,
    textAlign: "center",
    lineHeight: 12,
    marginBottom: 4,
  },
  macroValor: { fontSize: 12, fontWeight: "800", color: HD.white },

  refeicaoCard: { borderRadius: 12, marginBottom: 8, overflow: "hidden" },
  refeicaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  refeicaoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  refeicaoTitulo: { fontSize: 16, fontWeight: "700" },
  addBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: HD.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: HD.white, fontSize: 16, lineHeight: 20 },
  refeicaoHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  refeicaoKcal: { fontSize: 14, fontWeight: "500" },
  refeicaoSeta: { fontSize: 16 },
  alimentosLista: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  alimentoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alimentoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  alimentoRowNome: { fontSize: 13, flex: 1 },
  alimentoRowKcal: { fontSize: 13 },
  extraTag: {
    fontSize: 9,
    fontWeight: "700",
    color: HD.secondary,
    backgroundColor: HD.secondaryLight,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buscaIcon: { fontSize: 18 },
  buscaInput: { flex: 1, fontSize: 15 },
  alimentoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  alimentoNome: { fontSize: 15, fontWeight: "600" },
  alimentoKcal: { fontSize: 13, marginTop: 2 },
  alimentoSeta: { fontSize: 22, fontWeight: "700" },
  divisor: { height: 1, marginHorizontal: 16 },

  // Modal quantidade
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitulo: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  modalSub: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  modalKcal: { fontSize: 13, marginBottom: 16 },
  qtdInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    width: 140,
    marginBottom: 4,
  },
  qtdLabel: { fontSize: 13, marginBottom: 20 },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtnCancelar: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: HD.divider,
  },
  modalBtnCancelarTxt: { fontSize: 15, fontWeight: "700", color: HD.textLight },
  modalBtnAdicionar: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: HD.primary,
  },
  modalBtnAdicionarTxt: { fontSize: 15, fontWeight: "700", color: HD.white },
});
