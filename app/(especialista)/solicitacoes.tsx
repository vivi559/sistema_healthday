/**
 * app/(especialista)/solicitacoes.tsx
 * Solicitações de treino/dieta enviadas pelos alunos (as mesmas criadas nas telas do usuário).
 */

import {
  Botao, Cabecalho, Campo, Chips, Folha, LARGURA_MAXIMA, Vazio, avisar, useCores, useEstilos,
} from '@/components/EspecialistaUI';
import { getRespostas, salvarResposta } from '@/constants/EspecialistaStorage';
import {
  atualizarStatusSolicitacao, getSolicitacoes,
  type SolicitacaoEspecialista, type StatusSolicitacao,
} from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Filtro = 'todas' | StatusSolicitacao;

const FILTROS: Filtro[] = ['todas', 'pendente', 'em_andamento', 'concluida'];
const ROTULO_FILTRO: Record<Filtro, string> = {
  todas: 'Todas', pendente: 'Pendentes', em_andamento: 'Em andamento', concluida: 'Concluídas',
};

const STATUS: StatusSolicitacao[] = ['pendente', 'em_andamento', 'concluida'];
const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída',
};
const ORDEM_STATUS: Record<StatusSolicitacao, number> = { pendente: 0, em_andamento: 1, concluida: 2 };

const ROTULO_TIPO: Record<SolicitacaoEspecialista['tipo'], string> = {
  treino: 'Treino', dieta: 'Dieta', ambos: 'Treino e dieta',
};

function formatarData(iso: string) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR');
}

export default function EspecialistaSolicitacoes() {
  const c = useCores();
  const ui = useEstilos();
  const s = useMemo(() => estilos(c.temaDark), [c.temaDark]);

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEspecialista[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const [ativa, setAtiva] = useState<SolicitacaoEspecialista | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [statusEdit, setStatusEdit] = useState<StatusSolicitacao>('pendente');
  const [respostaEdit, setRespostaEdit] = useState('');

  const carregar = useCallback(async () => {
    const [todas, textos] = await Promise.all([getSolicitacoes(), getRespostas()]);
    setSolicitacoes(todas);
    setRespostas(textos);
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  // Pendentes primeiro; dentro do mesmo status, as mais recentes primeiro
  const lista = solicitacoes
    .filter(sol => filtro === 'todas' || sol.status === filtro)
    .sort((a, b) =>
      ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || (a.criadoEm < b.criadoEm ? 1 : -1),
    );
  const pendentes = solicitacoes.filter(sol => sol.status === 'pendente').length;

  function abrir(sol: SolicitacaoEspecialista) {
    setAtiva(sol);
    setStatusEdit(sol.status);
    setRespostaEdit(respostas[sol.id] ?? '');
    setModalAberto(true);
  }

  async function salvar() {
    if (!ativa) return;
    try {
      await atualizarStatusSolicitacao(ativa.id, statusEdit);
      await salvarResposta(ativa.id, respostaEdit);
      await carregar();
      setModalAberto(false);
      avisar('Solicitação atualizada', `${ativa.usuarioNome}: ${ROTULO_STATUS[statusEdit].toLowerCase()}.`);
    } catch {
      avisar('Erro', 'Não foi possível salvar a solicitação.');
    }
  }

  const estiloStatus = (status: StatusSolicitacao) =>
    status === 'pendente' ? s.statusPendente : status === 'em_andamento' ? s.statusAndamento : s.statusConcluida;

  return (
    <View style={ui.container}>
      <Cabecalho titulo="Solicitações" pendentes={pendentes} />

      <View style={s.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtrosConteudo}>
          <Chips
            opcoes={FILTROS}
            valor={filtro}
            onChange={v => setFiltro(v as Filtro)}
            rotulo={v => ROTULO_FILTRO[v as Filtro]}
          />
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ui.scroll}>
        <Text style={ui.subtexto}>
          {lista.length === 1 ? '1 solicitação' : `${lista.length} solicitações`}
        </Text>

        {lista.length === 0 ? (
          <Vazio
            icone="check-circle-outline"
            texto={
              filtro === 'todas'
                ? 'Nenhuma solicitação por enquanto. Quando um aluno pedir um treino ou dieta personalizados, o pedido aparece aqui.'
                : 'Nenhuma solicitação com esse status.'
            }
          />
        ) : (
          lista.map(sol => (
            <TouchableOpacity key={sol.id} style={ui.card} onPress={() => abrir(sol)} activeOpacity={0.8}>
              <View style={s.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardNome} numberOfLines={1}>{sol.usuarioNome}</Text>
                  <Text style={ui.subtexto}>ID {sol.usuarioId}  ·  {ROTULO_TIPO[sol.tipo] ?? sol.tipo}</Text>
                </View>
                <View style={[s.status, estiloStatus(sol.status)]}>
                  <Text style={s.statusTxt}>{ROTULO_STATUS[sol.status] ?? sol.status}</Text>
                </View>
              </View>

              {!!sol.mensagem && <Text style={[ui.texto, s.mensagem]} numberOfLines={2}>{sol.mensagem}</Text>}

              {!!respostas[sol.id] && (
                <View style={s.respostaBox}>
                  <Text style={s.respostaTitulo}>Sua resposta</Text>
                  <Text style={ui.subtexto} numberOfLines={2}>{respostas[sol.id]}</Text>
                </View>
              )}

              <View style={s.cardRodape}>
                <Text style={ui.subtexto}>{formatarData(sol.criadoEm)}</Text>
                <Text style={s.cardAcao}>
                  {sol.status === 'pendente' ? 'Toque para responder' : 'Toque para editar'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ── Modal: responder / atualizar status ── */}
      <Folha visivel={modalAberto} titulo="Responder solicitação" onFechar={() => setModalAberto(false)}>
        {ativa && (
          <>
            <View>
              <Text style={s.modalAluno}>{ativa.usuarioNome}</Text>
              <Text style={ui.subtexto}>
                ID {ativa.usuarioId}  ·  {ROTULO_TIPO[ativa.tipo] ?? ativa.tipo}  ·  {formatarData(ativa.criadoEm)}
              </Text>
            </View>

            {!!ativa.mensagem && (
              <View style={s.mensagemBox}>
                <Text style={ui.campoLabel}>Mensagem do aluno</Text>
                <Text style={ui.texto}>{ativa.mensagem}</Text>
              </View>
            )}

            <View>
              <Text style={ui.campoLabel}>Status</Text>
              <Chips
                opcoes={STATUS}
                valor={statusEdit}
                onChange={v => setStatusEdit(v as StatusSolicitacao)}
                rotulo={v => ROTULO_STATUS[v as StatusSolicitacao]}
              />
              <Text style={[ui.subtexto, { marginTop: 8 }]}>
                Enquanto não estiver concluída, o aluno não consegue enviar outra solicitação do mesmo tipo.
              </Text>
            </View>

            <Campo
              label="Sua resposta (opcional)"
              placeholder="Escreva uma resposta ou anotação sobre este pedido..."
              value={respostaEdit}
              onChangeText={setRespostaEdit}
              multiline
              maxLength={400}
            />

            <Botao texto="Salvar" onPress={salvar} />
          </>
        )}
      </Folha>
    </View>
  );
}

const estilos = (temaDark: boolean) => StyleSheet.create({
  filtros: { marginBottom: 12, width: '100%', maxWidth: LARGURA_MAXIMA + 32, alignSelf: 'center' },
  filtrosConteudo: { paddingHorizontal: 16 },

  cardNome: { fontSize: 15, fontWeight: '700', color: temaDark ? HD.white : HD.textDark, marginBottom: 2 },
  cardTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPendente: { backgroundColor: HD.secondaryLight },
  statusAndamento: { backgroundColor: '#DBEAFE' },
  statusConcluida: { backgroundColor: HD.primaryLight },
  statusTxt: { fontSize: 11, fontWeight: '700', color: HD.textDark },
  mensagem: { marginTop: 10, lineHeight: 20 },
  respostaBox: {
    backgroundColor: temaDark ? '#1F2937' : HD.white, borderRadius: 12, padding: 10, marginTop: 10,
  },
  respostaTitulo: { fontSize: 11, fontWeight: '700', color: temaDark ? HD.primary : HD.primaryDark, marginBottom: 2 },
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardAcao: { fontSize: 12, fontWeight: '700', color: temaDark ? HD.primary : HD.primaryDark },

  modalAluno: { fontSize: 16, fontWeight: '700', color: temaDark ? HD.primary : HD.primaryDark },
  mensagemBox: { backgroundColor: temaDark ? '#111827' : '#F3F4F6', borderRadius: 12, padding: 12 },
});
