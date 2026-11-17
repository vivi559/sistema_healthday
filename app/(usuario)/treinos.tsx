/**
 * app/(usuario)/treinos.tsx
 * Tela de treinos com os 7 dias da semana, exercícios expansíveis,
 * marcação de treino concluído (por semana) e solicitação ao especialista.
 */

import LogoHealthDay from "@/components/LogoHealthDay";
import {
  criarSolicitacao,
  dataLocalISO,
  desmarcarTreinoConcluido,
  getSolicitacoesUsuario,
  getTreinos,
  getUserAtual,
  marcarTreinoConcluido,
  treinoConcluidoNaSemana,
  type TreinoDia,
} from "@/constants/Storage";
import { HD, darkTheme, lightTheme } from "@/constants/theme";
import { useTema } from "@/context/TemaContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"] as const;
type Dia = (typeof DIAS)[number];

const ROTULO: Record<Dia, string> = {
  Seg: "Seg",
  Ter: "Ter",
  Qua: "Qua",
  Qui: "Qui",
  Sex: "Sex",
  Sab: "Sáb",
  Dom: "Dom",
};

const VERDE = "#16A34A";

// getDay(): 0 = domingo ... 6 = sábado
function diaDeHoje(): Dia {
  const mapa: Dia[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return mapa[new Date().getDay()];
}

// Alert.alert não funciona no navegador, então usamos window.* na web
function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === "web") window.alert(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}

function confirmar(titulo: string, mensagem: string, onOk: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) onOk();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    { text: "Solicitar", onPress: onOk },
  ]);
}

export default function TreinosScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const [treinos, setTreinos] = useState<TreinoDia[]>([]);
  const [diaSelecionado, setDia] = useState<Dia>(diaDeHoje());
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [jaSolicitou, setJaSolicitou] = useState(false);

  // Recarrega sempre que a aba ganha foco (ex.: depois do questionário)
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregar() {
        const user = await getUserAtual();
        if (user && ativo) {
          setUserId(user.id);
          setUserName(user.nome);
          const sols = await getSolicitacoesUsuario(user.id);
          const ativa = sols.find(
            (s) => s.tipo === "treino" && s.status !== "concluida",
          );
          setJaSolicitou(!!ativa);
        }
        const data = await getTreinos();
        if (!ativo) return;
        setTreinos(data);
        setExpandidos((atual) => {
          if (atual.length > 0) return atual;
          const doDia = data.find((t) => t.diaSemana === diaSelecionado);
          return doDia?.grupos[0] ? [doDia.grupos[0].id] : [];
        });
        setLoading(false);
      }
      carregar();
      return () => {
        ativo = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function selecionarDia(dia: Dia) {
    setDia(dia);
    const diaData = treinos.find((t) => t.diaSemana === dia);
    setExpandidos(diaData?.grupos[0] ? [diaData.grupos[0].id] : []);
  }

  function toggleExpandido(grupoId: string) {
    setExpandidos((prev) =>
      prev.includes(grupoId)
        ? prev.filter((id) => id !== grupoId)
        : [...prev, grupoId],
    );
  }

  async function handleConcluirTreino() {
    const atual = treinos.find((t) => t.diaSemana === diaSelecionado);
    if (!atual) return;

    if (treinoConcluidoNaSemana(atual)) {
      await desmarcarTreinoConcluido(diaSelecionado);
    } else {
      await marcarTreinoConcluido(diaSelecionado, dataLocalISO());
      avisar(
        "Parabéns!",
        `Treino de ${ROTULO[diaSelecionado]} marcado como concluído!`,
      );
    }
    setTreinos(await getTreinos());
  }

  function handleSolicitarTreino() {
    if (jaSolicitou) {
      avisar(
        "Já solicitado",
        "Você já tem uma solicitação de treino em andamento. Aguarde o especialista.",
      );
      return;
    }
    confirmar(
      "Solicitar Treino Personalizado",
      "Deseja solicitar um treino personalizado feito por um especialista?",
      async () => {
        await criarSolicitacao({
          usuarioId: userId,
          usuarioNome: userName,
          tipo: "treino",
          mensagem: "Usuário solicitou treino personalizado pelo app.",
        });
        setJaSolicitou(true);
        avisar(
          "Solicitação enviada!",
          "Um especialista irá criar seu treino personalizado em breve.",
        );
      },
    );
  }

  const treinoDia = treinos.find((t) => t.diaSemana === diaSelecionado);
  const temTreino = !!treinoDia && treinoDia.grupos.length > 0;
  const concluidoHoje = !!treinoDia && treinoConcluidoNaSemana(treinoDia);

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
          <MaterialIcons
            name="notifications-none"
            size={24}
            color={HD.primary}
          />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Treino</Text>
          <LogoHealthDay size={32} />
        </View>
        <View style={styles.menuBtn} />
      </View>

      {/* Dias da semana */}
      <View style={styles.diasRow}>
        {DIAS.map((dia) => {
          const treinoDoDia = treinos.find((t) => t.diaSemana === dia);
          const temTreinoNoDia = !!treinoDoDia && treinoDoDia.grupos.length > 0;
          const feito = !!treinoDoDia && treinoConcluidoNaSemana(treinoDoDia);
          const selecionado = diaSelecionado === dia;

          return (
            <TouchableOpacity
              key={dia}
              style={[
                styles.diaBtn,
                !temTreinoNoDia && styles.diaBtnDescanso,
                feito && styles.diaBtnConcluido,
                selecionado && !feito && styles.diaBtnActive,
                selecionado && styles.diaBtnSelecionado,
              ]}
              onPress={() => selecionarDia(dia)}
              activeOpacity={0.8}
            >
              {feito ? (
                <MaterialIcons name="check" size={18} color={HD.white} />
              ) : (
                <Text style={styles.diaTxt}>{ROTULO[dia]}</Text>
              )}
              {feito && <Text style={styles.diaTxtMini}>{ROTULO[dia]}</Text>}
              {temTreinoNoDia && !feito && <View style={styles.diaPonto} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!temTreino ? (
          <View style={styles.semTreino}>
            <MaterialIcons
              name="self-improvement"
              size={56}
              color={tema.subtext}
              style={styles.semTreinoIcone}
            />
            <Text style={[styles.semTreinoTxt, { color: tema.text }]}>
              Dia de descanso!
            </Text>
            <Text style={[styles.semTreinoSub, { color: tema.subtext }]}>
              Nenhum treino cadastrado para {ROTULO[diaSelecionado]}.
            </Text>

            <TouchableOpacity
              style={[
                styles.btnSolicitar,
                styles.btnSolicitarLargo,
                jaSolicitou && styles.btnSolicitarEnviado,
              ]}
              onPress={handleSolicitarTreino}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSolicitarTxt}>
                {jaSolicitou
                  ? "Treino personalizado solicitado"
                  : "Solicitar treino personalizado"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {treinoDia!.grupos.map((grupo) => {
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
                      <MaterialIcons
                        name="fitness-center"
                        size={20}
                        color={HD.primary}
                      />
                      <Text style={[styles.grupoNome, { color: tema.text }]}>
                        {grupo.nome}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={expandido ? "expand-less" : "expand-more"}
                      size={24}
                      color={tema.subtext}
                    />
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
                            <MaterialIcons
                              name="sports-gymnastics"
                              size={24}
                              color={HD.primary}
                            />
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
              style={[styles.btnConcluir, concluidoHoje && styles.btnConcluido]}
              onPress={handleConcluirTreino}
              activeOpacity={0.8}
            >
              {concluidoHoje && (
                <MaterialIcons name="check-circle" size={20} color={HD.white} />
              )}
              <Text style={styles.btnConcluirTxt}>
                {concluidoHoje
                  ? "Treino concluído (toque para desfazer)"
                  : "Marcar treino como concluído"}
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

  // 7 botões que dividem a largura da tela
  diasRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  diaBtn: {
    flex: 1,
    maxWidth: 50,
    aspectRatio: 1,
    borderRadius: 25,
    backgroundColor: HD.dayInactive,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  diaBtnDescanso: { opacity: 0.5 },
  diaBtnActive: { backgroundColor: HD.primary },
  diaBtnConcluido: { backgroundColor: VERDE },
  diaBtnSelecionado: { opacity: 1, borderColor: HD.primaryDark },
  diaTxt: { fontSize: 12, fontWeight: "700", color: HD.white },
  diaTxtMini: { fontSize: 8, fontWeight: "700", color: HD.white },
  diaPonto: {
    position: "absolute",
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: HD.white,
  },

  scrollContent: { paddingHorizontal: 20 },

  semTreino: { alignItems: "center", marginTop: 40 },
  semTreinoIcone: { marginBottom: 16 },
  semTreinoTxt: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  semTreinoSub: { fontSize: 14, textAlign: "center", marginBottom: 24 },

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
  grupoNome: { fontSize: 15, fontWeight: "700" },

  exerciciosContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  exercicioCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  exercicioIconeWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
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
  btnConcluido: { backgroundColor: VERDE },
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
  btnSolicitarLargo: { alignSelf: "stretch" },
  btnSolicitarEnviado: { backgroundColor: "#9CA3AF" },
  btnSolicitarTxt: { fontSize: 15, fontWeight: "700", color: HD.white },
});