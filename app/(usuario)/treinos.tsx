/**
 * app/(usuario)/treinos.tsx
 * Tela de treinos com dias da semana, exercícios expansíveis e solicitar treino ao especialista.
 */

import LogoHealthDay from "@/components/LogoHealthDay";
import {
  criarSolicitacao,
  getSolicitacoesUsuario,
  getTreinos,
  getUserAtual,
  marcarTreinoConcluido,
  type TreinoDia,
} from "@/constants/Storage";
import { HD, darkTheme, lightTheme } from "@/constants/theme";
import { useTema } from "@/context/TemaContext";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;
type Dia = (typeof DIAS)[number];

export default function TreinosScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [treinos, setTreinos] = useState<TreinoDia[]>([]);
  const [diaSelecionado, setDia] = useState<Dia>("Qua");
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [jaSolicitou, setJaSolicitou] = useState(false);

  useEffect(() => {
    async function carregar() {
      const user = await getUserAtual();
      if (user) {
        setUserId(user.id);
        setUserName(user.nome);
        const sols = await getSolicitacoesUsuario(user.id);
        const ativa = sols.find(
          (s) => s.tipo === "treino" && s.status !== "concluida",
        );
        setJaSolicitou(!!ativa);
      }
      const data = await getTreinos();
      setTreinos(data);
      const diaAtual = data.find((t) => t.diaSemana === "Qua");
      if (diaAtual?.grupos[0]) setExpandidos([diaAtual.grupos[0].id]);
      setLoading(false);
    }
    carregar();
  }, []);

  function toggleExpandido(grupoId: string) {
    setExpandidos((prev) =>
      prev.includes(grupoId)
        ? prev.filter((id) => id !== grupoId)
        : [...prev, grupoId],
    );
  }

  async function handleConcluirTreino() {
    const hoje = new Date().toISOString().split("T")[0];
    await marcarTreinoConcluido(diaSelecionado, hoje);
    Alert.alert(
      "🎉 Parabéns!",
      `Treino de ${diaSelecionado} marcado como concluído!`,
    );
  }

  async function handleSolicitarTreino() {
    if (jaSolicitou) {
      Alert.alert(
        "Já solicitado",
        "Você já tem uma solicitação de treino em andamento. Aguarde o especialista.",
      );
      return;
    }
    Alert.alert(
      "🏋️ Solicitar Treino Personalizado",
      "Deseja solicitar um treino personalizado feito por um especialista?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            await criarSolicitacao({
              usuarioId: userId,
              usuarioNome: userName,
              tipo: "treino",
              mensagem: "Usuário solicitou treino personalizado pelo app.",
            });
            setJaSolicitou(true);
            Alert.alert(
              "✅ Solicitação enviada!",
              "Um especialista irá criar seu treino personalizado em breve.",
            );
          },
        },
      ],
    );
  }

  const treinoDia = treinos.find((t) => t.diaSemana === diaSelecionado);
  const temTreino = treinoDia && treinoDia.grupos.length > 0;

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: tema.background }]}
      >
        <ActivityIndicator size="large" color={HD.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? "light-content" : "dark-content"}
        backgroundColor={tema.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Treino</Text>
          <LogoHealthDay size={32} />
        </View>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Dias da semana */}
      <View style={styles.diasRow}>
        {DIAS.map((dia) => (
          <TouchableOpacity
            key={dia}
            style={[
              styles.diaBtn,
              diaSelecionado === dia && styles.diaBtnActive,
            ]}
            onPress={() => {
              setDia(dia);
              const diaData = treinos.find((t) => t.diaSemana === dia);
              if (diaData?.grupos[0]) setExpandidos([diaData.grupos[0].id]);
              else setExpandidos([]);
            }}
          >
            <Text
              style={[
                styles.diaTxt,
                diaSelecionado === dia && styles.diaTxtActive,
              ]}
            >
              {dia}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!temTreino ? (
          <View style={styles.semTreino}>
            <Text style={styles.semTreinoEmoji}>😴</Text>
            <Text style={[styles.semTreinoTxt, { color: tema.text }]}>
              Dia de descanso!
            </Text>
            <Text style={[styles.semTreinoSub, { color: tema.subtext }]}>
              Nenhum treino cadastrado para {diaSelecionado}.
            </Text>
          </View>
        ) : (
          <>
            {treinoDia.grupos.map((grupo) => {
              const expandido = expandidos.includes(grupo.id);
              return (
                <View
                  key={grupo.id}
                  style={[
                    styles.grupoContainer,
                    { backgroundColor: tema.card },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.grupoHeader}
                    onPress={() => toggleExpandido(grupo.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.grupoHeaderLeft}>
                      <Text style={styles.grupoIcone}>🏋️</Text>
                      <Text style={[styles.grupoNome, { color: tema.text }]}>
                        {grupo.nome}
                      </Text>
                    </View>
                    <Text
                      style={[styles.grupoChevron, { color: tema.subtext }]}
                    >
                      {expandido ? "∧" : "∨"}
                    </Text>
                  </TouchableOpacity>

                  {expandido && (
                    <View style={styles.exerciciosContainer}>
                      {grupo.exercicios.map((exercicio) => (
                        <View key={exercicio.id} style={styles.exercicioCard}>
                          <View
                            style={[
                              styles.exercicioIconeWrap,
                              {
                                backgroundColor: temaDark
                                  ? "#2a2a2a"
                                  : HD.cardLight,
                              },
                            ]}
                          >
                            <Text style={styles.exercicioIcone}>🤸</Text>
                          </View>
                          <View style={styles.exercicioInfo}>
                            <Text
                              style={[
                                styles.exercicioNome,
                                { color: tema.text },
                              ]}
                            >
                              {exercicio.nome}
                            </Text>
                            <View style={styles.badgesRow}>
                              <View style={styles.badge}>
                                <Text style={styles.badgeLabel}>Series</Text>
                                <Text style={styles.badgeValue}>
                                  {exercicio.series}
                                </Text>
                              </View>
                              <View style={styles.badge}>
                                <Text style={styles.badgeLabel}>Reps</Text>
                                <Text style={styles.badgeValue}>
                                  {exercicio.reps}
                                </Text>
                              </View>
                              <View style={styles.badge}>
                                <Text style={styles.badgeLabel}>Intervalo</Text>
                                <Text style={styles.badgeValue}>
                                  {exercicio.intervalo}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Botões de ação */}
            <TouchableOpacity
              style={styles.btnConcluir}
              onPress={handleConcluirTreino}
              activeOpacity={0.8}
            >
              <Text style={styles.btnConcluirIcone}>✅</Text>
              <Text style={styles.btnConcluirTxt}>
                Marcar treino como concluído
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnSolicitar,
                jaSolicitou && styles.btnSolicitarEnviado,
              ]}
              onPress={handleSolicitarTreino}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSolicitarIcone}>
                {jaSolicitou ? "⏳" : "🩺"}
              </Text>
              <Text style={styles.btnSolicitarTxt}>
                {jaSolicitou
                  ? "Treino personalizado solicitado"
                  : "Solicitar treino personalizado"}
              </Text>
            </TouchableOpacity>
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

  diasRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  diaBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: HD.dayInactive,
    alignItems: "center",
    justifyContent: "center",
  },
  diaBtnActive: { backgroundColor: HD.primary },
  diaTxt: { fontSize: 13, fontWeight: "700", color: HD.white },
  diaTxtActive: { color: HD.white },

  scrollContent: { paddingHorizontal: 20 },

  semTreino: { alignItems: "center", marginTop: 60 },
  semTreinoEmoji: { fontSize: 56, marginBottom: 16 },
  semTreinoTxt: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  semTreinoSub: { fontSize: 14, textAlign: "center" },

  grupoContainer: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  grupoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  grupoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  grupoIcone: { fontSize: 20 },
  grupoNome: { fontSize: 15, fontWeight: "700" },
  grupoChevron: { fontSize: 16, fontWeight: "700" },

  exerciciosContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  exercicioCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  exercicioIconeWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  exercicioIcone: { fontSize: 24 },
  exercicioInfo: { flex: 1 },
  exercicioNome: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  badgesRow: { flexDirection: "row", gap: 8 },
  badge: {
    backgroundColor: HD.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: "center",
  },
  badgeLabel: { fontSize: 9, color: HD.white, fontWeight: "600" },
  badgeValue: { fontSize: 13, color: HD.white, fontWeight: "800" },

  btnConcluir: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HD.primary,
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 10,
    gap: 8,
  },
  btnConcluirIcone: { fontSize: 18 },
  btnConcluirTxt: { fontSize: 15, fontWeight: "700", color: HD.white },

  btnSolicitar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HD.secondary,
    borderRadius: 30,
    paddingVertical: 16,
    gap: 8,
  },
  btnSolicitarEnviado: { backgroundColor: "#9CA3AF" },
  btnSolicitarIcone: { fontSize: 18 },
  btnSolicitarTxt: { fontSize: 15, fontWeight: "700", color: HD.white },
});
