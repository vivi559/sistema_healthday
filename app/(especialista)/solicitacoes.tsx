/**
 * app/(especialista)/solicitacoes.tsx
 * Solicitações enviadas pelos alunos (treino / dieta).
 *
 * Usa getSolicitacoes / atualizarStatusSolicitacao de constants/Storage.ts — as mesmas
 * que as telas do usuário usam para criar a solicitação e checar se ainda está aberta
 * (status !== 'concluida'). O texto da resposta não existe no tipo SolicitacaoEspecialista,
 * por isso é guardado numa chave própria (RESPOSTAS_KEY).
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, StatusBar, TextInput, Modal,
} from 'react-native';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import HeaderEspecialista from '@/components/HeaderEspecialista';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
  atualizarStatusSolicitacao,
  getSolicitacoes,
  getUserAtual,
  type SolicitacaoEspecialista,
  type StatusSolicitacao,
} from '@/constants/Storage';

const RESPOSTAS_KEY = '@healthday:respostas_solicitacoes';

type Resposta = { texto: string; especialistaId?: string; data: string };
type Respostas = Record<string, Resposta>;
type Filtro = 'todas' | StatusSolicitacao;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'em_andamento', label: 'Andamento' },
  { id: 'concluida', label: 'Concluídas' },
];

const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

const TIPO_LABEL: Record<SolicitacaoEspecialista['tipo'], string> = {
  treino: 'Treino',
  dieta: 'Dieta',
  ambos: 'Treino + Dieta',
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

export default function EspecialistaSolicitacoes() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEspecialista[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<SolicitacaoEspecialista | null>(null);
  const [resposta, setResposta] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const carregar = async () => {
    try {
      const [lista, rawResp] = await Promise.all([
        getSolicitacoes(),
        AsyncStorage.getItem(RESPOSTAS_KEY),
      ]);
      // mais recentes primeiro
      setSolicitacoes([...lista].sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '')));
      setRespostas(rawResp ? JSON.parse(rawResp) : {});
    } catch (e) {
      console.log(e);
    }
  };

  const abrirModal = (solicitacao: SolicitacaoEspecialista) => {
    setSolicitacaoAtiva(solicitacao);
    setResposta(respostas[solicitacao.id]?.texto || '');
    setModalVisible(true);
  };

  const salvarResposta = async (sol: SolicitacaoEspecialista, texto: string) => {
    const user = await getUserAtual();
    const novas: Respostas = {
      ...respostas,
      [sol.id]: { texto, especialistaId: user?.id, data: new Date().toISOString() },
    };
    await AsyncStorage.setItem(RESPOSTAS_KEY, JSON.stringify(novas));
    setRespostas(novas);
  };

  // Concluir = responde ao aluno e libera o aluno para fazer uma nova solicitação
  const concluirSolicitacao = async () => {
    if (!solicitacaoAtiva) return;
    if (!resposta.trim()) return Alert.alert('Atenção', 'Digite uma resposta antes de concluir.');

    try {
      await salvarResposta(solicitacaoAtiva, resposta.trim());
      await atualizarStatusSolicitacao(solicitacaoAtiva.id, 'concluida');
      setModalVisible(false);
      await carregar();
      Alert.alert('Concluída!', `Solicitação de ${solicitacaoAtiva.usuarioNome} concluída com sucesso.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a resposta.');
    }
  };

  const iniciarAtendimento = async () => {
    if (!solicitacaoAtiva) return;
    try {
      if (resposta.trim()) await salvarResposta(solicitacaoAtiva, resposta.trim());
      await atualizarStatusSolicitacao(solicitacaoAtiva.id, 'em_andamento');
      setModalVisible(false);
      await carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a solicitação.');
    }
  };

  const solicitacoesFiltradas = solicitacoes.filter(sol => filtro === 'todas' || sol.status === filtro);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      <HeaderEspecialista titulo="Solicitações" />

      {/* Filtros */}
      <View style={s.filtrosRow}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[s.filtroBtn, filtro === f.id && s.filtroBtnAtivo]}
            onPress={() => setFiltro(f.id)}
          >
            <Text style={[s.filtroTxt, filtro === f.id && s.filtroTxtAtivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contador */}
      <Text style={s.contador}>
        {solicitacoesFiltradas.length} solicitação(ões)
      </Text>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {solicitacoesFiltradas.length === 0 ? (
          <View style={s.vazio}>
            <MaterialIcons name="check-circle-outline" size={60} color={HD.primary} />
            <Text style={s.vazioTxt}>Nenhuma solicitação aqui!</Text>
          </View>
        ) : (
          solicitacoesFiltradas.map(sol => {
            const resp = respostas[sol.id];
            return (
              <TouchableOpacity key={sol.id} style={s.card} onPress={() => abrirModal(sol)}>
                <View style={s.cardHeader}>
                  <View style={s.cardLeft}>
                    <View style={[s.tipoBadge, sol.tipo === 'dieta' ? s.tipoBadgeDieta : s.tipoBadgeTreino]}>
                      <Text style={s.tipoBadgeTxt}>{TIPO_LABEL[sol.tipo]}</Text>
                    </View>
                    <Text style={s.cardNome}>{sol.usuarioNome}</Text>
                    <Text style={s.cardId}>ID: {sol.usuarioId}</Text>
                  </View>
                  <View style={[s.statusBadge, sol.status === 'concluida' ? s.statusRespondido : s.statusPendente]}>
                    <Text style={s.statusTxt}>{STATUS_LABEL[sol.status]}</Text>
                  </View>
                </View>

                {!!sol.mensagem && (
                  <Text style={s.cardMensagem} numberOfLines={2}>{sol.mensagem}</Text>
                )}

                {resp && (
                  <View style={s.respostaBox}>
                    <Text style={s.respostaTitulo}>Sua resposta:</Text>
                    <Text style={s.respostaTxt} numberOfLines={2}>{resp.texto}</Text>
                  </View>
                )}

                <View style={s.cardFooter}>
                  <Text style={s.cardData}>{formatarData(sol.criadoEm)}</Text>
                  <Text style={s.cardAcao}>
                    {sol.status === 'concluida' ? 'Toque para editar a resposta' : 'Toque para atender'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal resposta */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Atender Solicitação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>

            {solicitacaoAtiva && (
              <>
                <Text style={s.modalAluno}>
                  {solicitacaoAtiva.usuarioNome} · {TIPO_LABEL[solicitacaoAtiva.tipo]}
                </Text>
                <View style={s.modalMensagemBox}>
                  <Text style={s.modalMensagemLabel}>Mensagem do aluno:</Text>
                  <Text style={s.modalMensagem}>{solicitacaoAtiva.mensagem || 'Sem mensagem.'}</Text>
                </View>

                <Text style={s.modalLabel}>Sua Resposta:</Text>
                <TextInput
                  style={s.modalInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Digite sua resposta ao aluno..."
                  placeholderTextColor="#aaa"
                  value={resposta}
                  onChangeText={setResposta}
                />

                {solicitacaoAtiva.status === 'pendente' && (
                  <TouchableOpacity style={s.modalBtnSec} onPress={iniciarAtendimento}>
                    <Text style={s.modalBtnSecTxt}>Marcar como em andamento</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.modalBtn} onPress={concluirSolicitacao}>
                  <Text style={s.modalBtnTxt}>Concluir e Responder</Text>
                  <View style={s.checkCircle}>
                    <MaterialIcons name="check" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (temaDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: temaDark ? '#1a1a1a' : HD.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: HD.primary },
  notifBadge: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: HD.accent, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  filtrosRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filtroBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: temaDark ? '#2a2a2a' : '#ddd', alignItems: 'center' },
  filtroBtnAtivo: { backgroundColor: HD.primary },
  filtroTxt: { fontSize: 11, color: temaDark ? '#aaa' : '#555', fontWeight: '600' },
  filtroTxtAtivo: { color: '#fff' },
  contador: { paddingHorizontal: 20, fontSize: 12, color: '#999', marginBottom: 8 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  vazio: { alignItems: 'center', marginTop: 80, gap: 12 },
  vazioTxt: { color: HD.primary, fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: temaDark ? '#2a2a2a' : '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1 },
  tipoBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  tipoBadgeTreino: { backgroundColor: temaDark ? '#1a3a35' : '#e0faf5' },
  tipoBadgeDieta: { backgroundColor: temaDark ? '#3a2a1a' : '#fff3e0' },
  tipoBadgeTxt: { fontSize: 12, fontWeight: '600', color: HD.primary },
  cardNome: { fontSize: 15, fontWeight: '700', color: temaDark ? '#eee' : '#222' },
  cardId: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPendente: { backgroundColor: temaDark ? '#3a2a1a' : '#fff3e0' },
  statusRespondido: { backgroundColor: temaDark ? '#1a3a35' : '#e0faf5' },
  statusTxt: { fontSize: 11, fontWeight: '600', color: temaDark ? '#ddd' : '#555' },
  grupoMuscular: { fontSize: 12, color: HD.secondary, fontWeight: '600', marginBottom: 6 },
  cardMensagem: { fontSize: 13, color: temaDark ? '#ccc' : '#555', lineHeight: 18, marginBottom: 8 },
  respostaBox: { backgroundColor: temaDark ? '#1a3a35' : '#e8faf5', borderRadius: 8, padding: 10, marginBottom: 8 },
  respostaTitulo: { fontSize: 11, color: HD.primary, fontWeight: '700', marginBottom: 4 },
  respostaTxt: { fontSize: 12, color: temaDark ? '#bbb' : '#444', lineHeight: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardData: { fontSize: 11, color: '#999' },
  cardAcao: { fontSize: 11, color: HD.primary, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: temaDark ? '#222' : '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: temaDark ? '#eee' : '#222' },
  modalAluno: { fontSize: 15, fontWeight: '600', color: HD.primary, marginBottom: 12 },
  modalMensagemBox: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 12, padding: 12, marginBottom: 16 },
  modalMensagemLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  modalMensagem: { fontSize: 14, color: temaDark ? '#ccc' : '#444', lineHeight: 20 },
  modalGrupo: { marginTop: 6, fontSize: 12, color: HD.secondary, fontWeight: '600' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: temaDark ? '#ccc' : '#333', marginBottom: 8 },
  modalInput: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14, color: temaDark ? '#eee' : '#222', minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  modalBtnSec: { borderRadius: 30, paddingVertical: 12, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: HD.primary },
  modalBtnSecTxt: { color: HD.primary, fontSize: 14, fontWeight: '700' },
  modalBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  modalBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
});
