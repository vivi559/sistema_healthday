import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, StatusBar, TextInput, Modal,
} from 'react-native';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import LogoHealthDay from '@/components/LogoHealthDay';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

type Solicitacao = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: 'treino' | 'dieta';
  grupoMuscular?: string;
  mensagem: string;
  status: 'pendente' | 'respondida';
  resposta?: string;
  dataCriacao: string;
};

export default function EspecialistaSolicitacoes() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'pendente' | 'respondida'>('todas');
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<Solicitacao | null>(null);
  const [resposta, setResposta] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarSolicitacoes();
    }, [])
  );

  const carregarSolicitacoes = async () => {
    try {
      const dados = await AsyncStorage.getItem('@solicitacoes');
      if (dados) {
        setSolicitacoes(JSON.parse(dados));
      } else {
        // Mock inicial
        const mock: Solicitacao[] = [
          {
            id: '1', usuarioId: '001', usuarioNome: 'Jonas Duzzo',
            tipo: 'treino', grupoMuscular: 'Inferior',
            mensagem: 'Preciso de um treino focado em pernas para 3x por semana.',
            status: 'pendente', dataCriacao: new Date().toLocaleDateString('pt-BR'),
          },
          {
            id: '2', usuarioId: '002', usuarioNome: 'Maria Silva',
            tipo: 'dieta',
            mensagem: 'Gostaria de uma dieta para perda de peso, sou vegetariana.',
            status: 'pendente', dataCriacao: new Date().toLocaleDateString('pt-BR'),
          },
          {
            id: '3', usuarioId: '003', usuarioNome: 'Pedro Santos',
            tipo: 'treino', grupoMuscular: 'Peito',
            mensagem: 'Quero focar em ganho de massa no peito.',
            status: 'respondida',
            resposta: 'Preparei um treino específico para você, acesse a aba Treinos!',
            dataCriacao: new Date().toLocaleDateString('pt-BR'),
          },
        ];
        await AsyncStorage.setItem('@solicitacoes', JSON.stringify(mock));
        setSolicitacoes(mock);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const abrirModal = (solicitacao: Solicitacao) => {
    setSolicitacaoAtiva(solicitacao);
    setResposta(solicitacao.resposta || '');
    setModalVisible(true);
  };

  const responderSolicitacao = async () => {
    if (!resposta.trim()) return Alert.alert('Atenção', 'Digite uma resposta antes de confirmar.');
    if (!solicitacaoAtiva) return;

    try {
      const atualizadas = solicitacoes.map(s =>
        s.id === solicitacaoAtiva.id
          ? { ...s, status: 'respondida' as const, resposta }
          : s
      );
      await AsyncStorage.setItem('@solicitacoes', JSON.stringify(atualizadas));
      setSolicitacoes(atualizadas);
      setModalVisible(false);
      Alert.alert('✅ Respondido!', `Solicitação de ${solicitacaoAtiva.usuarioNome} respondida com sucesso.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a resposta.');
    }
  };

  const solicitacoesFiltradas = solicitacoes.filter(s => {
    if (filtro === 'todas') return true;
    return s.status === filtro;
  });

  const pendentes = solicitacoes.filter(s => s.status === 'pendente').length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.notifBadge}>
          <Ionicons name="notifications-outline" size={24} color={HD.accent} />
          {pendentes > 0 && (
            <View style={s.badge}><Text style={s.badgeTxt}>{pendentes}</Text></View>
          )}
        </View>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Solicitações</Text>
          <LogoHealthDay size={28} />
        </View>
        <Ionicons name="menu-outline" size={28} color={HD.primary} />
      </View>

      {/* Filtros */}
      <View style={s.filtrosRow}>
        {(['todas', 'pendente', 'respondida'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filtroBtn, filtro === f && s.filtroBtnAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[s.filtroTxt, filtro === f && s.filtroTxtAtivo]}>
              {f === 'todas' ? 'Todas' : f === 'pendente' ? 'Pendentes' : 'Respondidas'}
            </Text>
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
            <Ionicons name="checkmark-circle-outline" size={60} color={HD.primary} />
            <Text style={s.vazioTxt}>Nenhuma solicitação aqui!</Text>
          </View>
        ) : (
          solicitacoesFiltradas.map(sol => (
            <TouchableOpacity key={sol.id} style={s.card} onPress={() => abrirModal(sol)}>
              <View style={s.cardHeader}>
                <View style={s.cardLeft}>
                  <View style={[s.tipoBadge, sol.tipo === 'treino' ? s.tipoBadgeTreino : s.tipoBadgeDieta]}>
                    <Text style={s.tipoBadgeTxt}>{sol.tipo === 'treino' ? '💪 Treino' : '🥗 Dieta'}</Text>
                  </View>
                  <Text style={s.cardNome}>{sol.usuarioNome}</Text>
                  <Text style={s.cardId}>ID: {sol.usuarioId}</Text>
                </View>
                <View style={[s.statusBadge, sol.status === 'pendente' ? s.statusPendente : s.statusRespondido]}>
                  <Text style={s.statusTxt}>{sol.status === 'pendente' ? '⏳ Pendente' : '✅ Respondida'}</Text>
                </View>
              </View>

              {sol.grupoMuscular && (
                <Text style={s.grupoMuscular}>Grupo Muscular: {sol.grupoMuscular}</Text>
              )}

              <Text style={s.cardMensagem} numberOfLines={2}>{sol.mensagem}</Text>

              {sol.resposta && (
                <View style={s.respostaBox}>
                  <Text style={s.respostaTitulo}>Sua resposta:</Text>
                  <Text style={s.respostaTxt} numberOfLines={2}>{sol.resposta}</Text>
                </View>
              )}

              <View style={s.cardFooter}>
                <Text style={s.cardData}>{sol.dataCriacao}</Text>
                <Text style={s.cardAcao}>
                  {sol.status === 'pendente' ? 'Toque para responder →' : 'Toque para editar →'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal resposta */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Responder Solicitação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>

            {solicitacaoAtiva && (
              <>
                <Text style={s.modalAluno}>👤 {solicitacaoAtiva.usuarioNome}</Text>
                <View style={s.modalMensagemBox}>
                  <Text style={s.modalMensagemLabel}>Mensagem do aluno:</Text>
                  <Text style={s.modalMensagem}>{solicitacaoAtiva.mensagem}</Text>
                  {solicitacaoAtiva.grupoMuscular && (
                    <Text style={s.modalGrupo}>Grupo: {solicitacaoAtiva.grupoMuscular}</Text>
                  )}
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

                <TouchableOpacity style={s.modalBtn} onPress={responderSolicitacao}>
                  <Text style={s.modalBtnTxt}>Confirmar Resposta</Text>
                  <View style={s.checkCircle}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
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
  filtroTxt: { fontSize: 12, color: temaDark ? '#aaa' : '#555', fontWeight: '600' },
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
  modalBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  modalBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
});
