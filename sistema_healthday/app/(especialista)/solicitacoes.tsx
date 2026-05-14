/**
 * app/(especialista)/solicitacoes.tsx
 * Solicitações dos pacientes ao especialista.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema, getSolicitacoes, atualizarStatusSolicitacao, type SolicitacaoEspecialista, type StatusSolicitacao } from '@/constants/Storage';

export default function SolicitacoesScreen() {
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [sols,     setSols]     = useState<SolicitacaoEspecialista[]>([]);
  const tema = temaDark ? darkTheme : lightTheme;

  async function carregar() {
    const dark = await getTema();
    const data = await getSolicitacoes();
    setTemaDark(dark);
    setSols(data);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  async function mudarStatus(id: string, status: StatusSolicitacao) {
    await atualizarStatusSolicitacao(id, status);
    carregar();
  }

  const statusColor: Record<StatusSolicitacao, string> = {
    pendente:    HD.secondary,
    em_andamento: HD.primary,
    concluida:   '#10B981',
  };

  if (loading) return <View style={[styles.loading, { backgroundColor: tema.background }]}><ActivityIndicator size="large" color={HD.secondary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} backgroundColor={tema.background} />
      <View style={styles.header}><Text style={styles.title}>Solicitações</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sols.length === 0
          ? <View style={[styles.emptyCard, { backgroundColor: tema.card }]}><Text style={styles.emptyEmoji}>🎉</Text><Text style={[styles.emptyTxt, { color: tema.subtext }]}>Nenhuma solicitação.</Text></View>
          : sols.map(s => (
            <View key={s.id} style={[styles.card, { backgroundColor: tema.card }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.nome, { color: tema.text }]}>{s.usuarioNome}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor[s.status] + '22' }]}>
                  <Text style={[styles.badgeTxt, { color: statusColor[s.status] }]}>{s.status}</Text>
                </View>
              </View>
              <Text style={[styles.tipo, { color: tema.subtext }]}>Tipo: {s.tipo}</Text>
              {s.mensagem && <Text style={[styles.msg, { color: tema.subtext }]}>{s.mensagem}</Text>}
              <View style={styles.actions}>
                {s.status === 'pendente' && (
                  <TouchableOpacity style={styles.btnAceitar} onPress={() => mudarStatus(s.id, 'em_andamento')}>
                    <Text style={styles.btnAceitarTxt}>Aceitar</Text>
                  </TouchableOpacity>
                )}
                {s.status === 'em_andamento' && (
                  <TouchableOpacity style={styles.btnConcluir} onPress={() => mudarStatus(s.id, 'concluida')}>
                    <Text style={styles.btnConcluirTxt}>Concluir</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        }
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:    { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, alignItems: 'center' },
  title:     { fontSize: 22, fontWeight: '800', color: HD.secondary },
  scroll:    { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  card:      { borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nome:      { fontSize: 15, fontWeight: '700' },
  badge:     { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },
  tipo:      { fontSize: 13, marginBottom: 4 },
  msg:       { fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  actions:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnAceitar:  { backgroundColor: HD.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnAceitarTxt: { fontSize: 13, fontWeight: '700', color: HD.primaryDark },
  btnConcluir: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnConcluirTxt: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  emptyCard: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 10 },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { fontSize: 14 },
});
