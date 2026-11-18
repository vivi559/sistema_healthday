/**
 * app/(especialista)/treinos.tsx
 * Montagem dos treinos dos alunos e catálogo de exercícios do especialista.
 */

import {
  Abas, Botao, BotaoSecundario, Cabecalho, Campo, Chips, Folha, SeletorAluno, SeletorDias, Vazio,
  avisar, confirmar, useCores, useEstilos,
} from '@/components/EspecialistaUI';
import {
  DIAS, EQUIPAMENTOS, GRUPOS_MUSCULARES, INTERVALO_OPTS, REPS_OPTS, ROTULO_DIA, SERIES_OPTS,
  getAlunos, getExercicios, getTreinoAluno, removerExercicio, salvarExercicio, salvarTreinoAluno,
  type Dia, type ExercicioCatalogo, type ItemTreino, type TreinoAluno,
} from '@/constants/EspecialistaStorage';
import type { User } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Aba = 'criar' | 'gerenciar' | 'exercicios';
type ModoFolha = 'escolher' | 'form' | 'item';

/** Item sendo ajustado: da lista ainda não salva ('lista') ou de um dia já salvo. */
interface ItemEmEdicao { origem: 'lista' | Dia; indice: number; item: ItemTreino }

const ABAS: { id: Aba; label: string }[] = [
  { id: 'criar', label: 'Criar treino' },
  { id: 'gerenciar', label: 'Gerenciar' },
  { id: 'exercicios', label: 'Exercícios' },
];

const FORM_VAZIO = {
  nome: '', grupo: '', equipamento: '', series: '3', reps: '12', intervalo: '1 Min', observacoes: '',
};

/** Garante que o valor salvo apareça entre as opções, mesmo que não seja um dos padrões. */
function opcoesCom(opcoes: string[], valor: string) {
  return !valor || opcoes.includes(valor) ? opcoes : [...opcoes, valor];
}

function descricaoExercicio(e: Pick<ExercicioCatalogo, 'grupo' | 'equipamento'>) {
  return [e.grupo, e.equipamento].filter(Boolean).join('  ·  ');
}

export default function EspecialistaTreinos() {
  const c = useCores();
  const ui = useEstilos();

  const [aba, setAba] = useState<Aba>('criar');
  const [alunos, setAlunos] = useState<User[]>([]);
  const [aluno, setAluno] = useState<User | null>(null);
  const [dia, setDia] = useState<Dia>('Seg');
  const [catalogo, setCatalogo] = useState<ExercicioCatalogo[]>([]);
  const [plano, setPlano] = useState<TreinoAluno>({});

  // Exercício sendo configurado e lista ainda não salva
  const [exercicio, setExercicio] = useState<ExercicioCatalogo | null>(null);
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [intervalo, setIntervalo] = useState('');
  const [pendentes, setPendentes] = useState<ItemTreino[]>([]);

  // Busca no catálogo (aba Exercícios e escolha do exercício)
  const [busca, setBusca] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('Todos');

  // Modal: escolher exercício, cadastrar/editar um no catálogo, ou ajustar um item do treino
  // (o modo fica guardado ao fechar, para o conteúdo não trocar durante a animação)
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [modoFolha, setModoFolha] = useState<ModoFolha>('escolher');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [voltarParaCriar, setVoltarParaCriar] = useState(false);

  // Ajuste de séries/repetições/intervalo de um exercício já na lista ou já salvo
  const [itemEditando, setItemEditando] = useState<ItemEmEdicao | null>(null);
  const [editSeries, setEditSeries] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editIntervalo, setEditIntervalo] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      Promise.all([getAlunos(), getExercicios()]).then(([listaAlunos, listaExercicios]) => {
        if (!ativo) return;
        setAlunos(listaAlunos);
        setCatalogo(listaExercicios);
      });
      return () => { ativo = false; };
    }, []),
  );

  useEffect(() => {
    if (!aluno) { setPlano({}); return; }
    let ativo = true;
    getTreinoAluno(aluno.id).then(p => { if (ativo) setPlano(p); });
    return () => { ativo = false; };
  }, [aluno]);

  const catalogoFiltrado = catalogo.filter(e =>
    (grupoFiltro === 'Todos' || e.grupo === grupoFiltro) &&
    e.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  const diasComTreino = DIAS.filter(d => (plano[d]?.length ?? 0) > 0);
  const salvosNoDia = plano[dia]?.length ?? 0;

  function abrirFolha(modo: ModoFolha) {
    setModoFolha(modo);
    setFolhaAberta(true);
  }

  // Fechar o cadastro aberto a partir da escolha volta para a escolha
  function fecharFolha() {
    if (modoFolha === 'form' && voltarParaCriar) setModoFolha('escolher');
    else setFolhaAberta(false);
  }

  // ── Montagem do treino ──

  function escolherExercicio(e: ExercicioCatalogo) {
    setExercicio(e);
    setSeries(e.seriesPadrao ?? '');
    setReps(e.repsPadrao ?? '');
    setIntervalo(e.intervaloPadrao ?? '');
    setFolhaAberta(false);
  }

  function adicionarALista() {
    if (!exercicio) return avisar('Atenção', 'Selecione um exercício.');
    if (!series) return avisar('Atenção', 'Selecione as séries.');
    if (!reps) return avisar('Atenção', 'Selecione as repetições.');
    if (!intervalo) return avisar('Atenção', 'Selecione o intervalo.');

    setPendentes(prev => [...prev, {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      exercicio: {
        id: exercicio.id, nome: exercicio.nome, grupo: exercicio.grupo,
        equipamento: exercicio.equipamento, observacoes: exercicio.observacoes,
      },
      series, reps, intervalo,
    }]);
    setExercicio(null);
    setSeries('');
    setReps('');
    setIntervalo('');
  }

  async function salvarTreino() {
    if (!aluno) return avisar('Atenção', 'Selecione um aluno.');
    if (pendentes.length === 0) return avisar('Atenção', 'Adicione pelo menos um exercício à lista.');
    try {
      const atual = await getTreinoAluno(aluno.id);
      const novo: TreinoAluno = { ...atual, [dia]: [...(atual[dia] ?? []), ...pendentes] };
      await salvarTreinoAluno(aluno.id, novo);
      setPlano(novo);
      setPendentes([]);
      avisar('Treino salvo!', `Treino de ${ROTULO_DIA[dia]} salvo para ${aluno.nome}.`);
    } catch {
      avisar('Erro', 'Não foi possível salvar o treino.');
    }
  }

  function removerDoPlano(d: Dia, itemId: string, nome: string) {
    if (!aluno) return;
    confirmar('Remover exercício', `Remover "${nome}" do treino de ${ROTULO_DIA[d]}?`, async () => {
      const novo: TreinoAluno = { ...plano };
      const restantes = (novo[d] ?? []).filter(i => i.id !== itemId);
      if (restantes.length > 0) novo[d] = restantes;
      else delete novo[d];
      await salvarTreinoAluno(aluno.id, novo);
      setPlano(novo);
    }, 'Remover');
  }

  // ── Ajustar séries / repetições / intervalo ──

  function abrirAjuste(origem: 'lista' | Dia, indice: number, item: ItemTreino) {
    setItemEditando({ origem, indice, item });
    setEditSeries(item.series);
    setEditReps(item.reps);
    setEditIntervalo(item.intervalo);
    abrirFolha('item');
  }

  async function salvarAjuste() {
    if (!itemEditando) return;
    const { origem, indice, item } = itemEditando;
    const ajustado: ItemTreino = { ...item, series: editSeries, reps: editReps, intervalo: editIntervalo };

    if (origem === 'lista') {
      setPendentes(prev => prev.map((p, i) => (i === indice ? ajustado : p)));
      setFolhaAberta(false);
      return;
    }
    if (!aluno) return;
    try {
      const atual = await getTreinoAluno(aluno.id);
      const lista = atual[origem] ?? [];
      if (!lista[indice]) return avisar('Erro', 'Este exercício não está mais no treino.');
      const novo: TreinoAluno = { ...atual, [origem]: lista.map((p, i) => (i === indice ? ajustado : p)) };
      await salvarTreinoAluno(aluno.id, novo);
      setPlano(novo);
      setFolhaAberta(false);
      avisar(
        'Exercício atualizado!',
        `${item.exercicio?.nome} em ${ROTULO_DIA[origem]}: ${editSeries} séries de ${editReps}, intervalo ${editIntervalo}.`,
      );
    } catch {
      avisar('Erro', 'Não foi possível salvar a alteração.');
    }
  }

  // ── Catálogo de exercícios ──

  function abrirForm(e?: ExercicioCatalogo, aPartirDaEscolha = false) {
    setEditandoId(e?.id ?? null);
    setForm(e ? {
      nome: e.nome,
      grupo: e.grupo,
      equipamento: e.equipamento ?? '',
      series: e.seriesPadrao ?? '3',
      reps: e.repsPadrao ?? '12',
      intervalo: e.intervaloPadrao ?? '1 Min',
      observacoes: e.observacoes ?? '',
    } : { ...FORM_VAZIO, nome: aPartirDaEscolha ? busca.trim() : '' });
    setVoltarParaCriar(aPartirDaEscolha);
    abrirFolha('form');
  }

  async function salvarForm() {
    const nome = form.nome.trim();
    if (nome.length < 2) return avisar('Atenção', 'Informe o nome do exercício.');
    if (!form.grupo) return avisar('Atenção', 'Selecione o grupo muscular.');
    const repetido = catalogo.some(e => e.id !== editandoId && e.nome.toLowerCase() === nome.toLowerCase());
    if (repetido) return avisar('Atenção', `Já existe um exercício chamado "${nome}".`);

    try {
      const salvo = await salvarExercicio({
        nome,
        grupo: form.grupo,
        equipamento: form.equipamento || undefined,
        seriesPadrao: form.series,
        repsPadrao: form.reps,
        intervaloPadrao: form.intervalo,
        observacoes: form.observacoes.trim() || undefined,
      }, editandoId ?? undefined);
      setCatalogo(await getExercicios());
      setBusca('');
      if (voltarParaCriar) escolherExercicio(salvo);
      else setFolhaAberta(false);
    } catch {
      avisar('Erro', 'Não foi possível salvar o exercício.');
    }
  }

  function excluirExercicio(e: ExercicioCatalogo) {
    confirmar(
      'Excluir exercício',
      `Excluir "${e.nome}" do catálogo? Treinos já salvos com ele não são alterados.`,
      async () => {
        await removerExercicio(e.id);
        setCatalogo(await getExercicios());
        if (exercicio?.id === e.id) setExercicio(null);
      },
      'Excluir',
    );
  }

  // ── Pedaços de tela ──

  const linhaItem = (item: ItemTreino, indice: number, onEditar: () => void, onRemover: () => void) => (
    <View key={item.id ?? indice} style={[ui.linha, indice === 0 && ui.linhaPrimeira]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onEditar} activeOpacity={0.7}>
        <Text style={ui.linhaTitulo}>{indice + 1}. {item.exercicio?.nome}</Text>
        <View style={s.badges}>
          <View style={s.badge}><Text style={s.badgeTxt}>{item.series} séries</Text></View>
          <View style={s.badge}><Text style={s.badgeTxt}>{item.reps} reps</Text></View>
          <View style={s.badge}><Text style={s.badgeTxt}>{item.intervalo}</Text></View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={ui.acao} onPress={onEditar} accessibilityLabel="Ajustar exercício">
        <MaterialIcons name="edit" size={20} color={HD.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={ui.acao} onPress={onRemover} accessibilityLabel="Remover exercício">
        <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
      </TouchableOpacity>
    </View>
  );

  const filtrosCatalogo = (
    <>
      <Campo
        icone="search"
        placeholder="Pesquise o exercício"
        value={busca}
        onChangeText={setBusca}
      />
      <Chips opcoes={['Todos', ...GRUPOS_MUSCULARES]} valor={grupoFiltro} onChange={setGrupoFiltro} />
    </>
  );

  return (
    <View style={ui.container}>
      <Cabecalho titulo="Treinos" />
      <Abas opcoes={ABAS} valor={aba} onChange={setAba} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.scroll}
      >
        {/* ── Criar treino ── */}
        {aba === 'criar' && (
          <>
            <SeletorAluno alunos={alunos} valor={aluno} onChange={setAluno} />
            <SeletorDias valor={dia} onChange={setDia} marcados={diasComTreino} />
            {aluno && salvosNoDia > 0 && (
              <Text style={[ui.subtexto, { textAlign: 'center' }]}>
                {ROTULO_DIA[dia]} já tem {salvosNoDia} exercício(s) salvo(s). Os novos serão somados.
              </Text>
            )}

            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Exercício</Text>
              <TouchableOpacity style={ui.seletor} onPress={() => abrirFolha('escolher')} activeOpacity={0.8}>
                <MaterialIcons name="fitness-center" size={20} color={HD.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[ui.seletorTxt, !exercicio && ui.seletorVazio]} numberOfLines={1}>
                    {exercicio ? exercicio.nome : 'Selecione o exercício'}
                  </Text>
                  {exercicio && <Text style={ui.subtexto}>{descricaoExercicio(exercicio)}</Text>}
                </View>
                <MaterialIcons name="chevron-right" size={22} color={c.subtexto} />
              </TouchableOpacity>
              {!!exercicio?.observacoes && (
                <Text style={[ui.subtexto, { marginTop: 8 }]}>{exercicio.observacoes}</Text>
              )}

              <Text style={[ui.secao, s.espaco]}>Séries</Text>
              <Chips opcoes={SERIES_OPTS} valor={series} onChange={setSeries} />
              <Text style={[ui.secao, s.espaco]}>Repetições</Text>
              <Chips opcoes={REPS_OPTS} valor={reps} onChange={setReps} />
              <Text style={[ui.secao, s.espaco]}>Intervalo</Text>
              <Chips opcoes={INTERVALO_OPTS} valor={intervalo} onChange={setIntervalo} />

              <View style={s.espaco}>
                <BotaoSecundario texto="Adicionar à lista" onPress={adicionarALista} />
              </View>
            </View>

            {pendentes.length > 0 && (
              <View style={ui.card}>
                <Text style={ui.cardTitulo}>Lista para {ROTULO_DIA[dia]}</Text>
                {pendentes.map((item, i) =>
                  linhaItem(
                    item, i,
                    () => abrirAjuste('lista', i, item),
                    () => setPendentes(prev => prev.filter((_, j) => j !== i)),
                  ),
                )}
              </View>
            )}

            <Botao
              texto={`Salvar treino de ${ROTULO_DIA[dia]}`}
              onPress={salvarTreino}
              desabilitado={pendentes.length === 0}
            />
          </>
        )}

        {/* ── Gerenciar treinos salvos ── */}
        {aba === 'gerenciar' && (
          <>
            <SeletorAluno alunos={alunos} valor={aluno} onChange={setAluno} />
            {!aluno ? (
              <Vazio icone="person-search" texto="Selecione um aluno para ver os treinos salvos." />
            ) : diasComTreino.length === 0 ? (
              <Vazio icone="fitness-center" texto={`Nenhum treino cadastrado para ${aluno.nome}.`} />
            ) : (
              diasComTreino.map(d => (
                <View key={d} style={ui.card}>
                  <Text style={[ui.cardTitulo, { color: HD.primary }]}>{ROTULO_DIA[d]}</Text>
                  {(plano[d] ?? []).map((item, i) =>
                    linhaItem(
                      item, i,
                      () => abrirAjuste(d, i, item),
                      () => removerDoPlano(d, item.id, item.exercicio?.nome ?? 'exercício'),
                    ),
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ── Catálogo de exercícios ── */}
        {aba === 'exercicios' && (
          <>
            <BotaoSecundario texto="Novo exercício" onPress={() => abrirForm()} />
            {filtrosCatalogo}
            <View style={ui.card}>
              {catalogoFiltrado.length === 0 ? (
                <Vazio icone="search-off" texto="Nenhum exercício encontrado." />
              ) : (
                catalogoFiltrado.map((e, i) => (
                  <View key={e.id} style={[ui.linha, i === 0 && ui.linhaPrimeira]}>
                    <View style={{ flex: 1 }}>
                      <Text style={ui.linhaTitulo}>{e.nome}</Text>
                      <Text style={ui.subtexto}>{descricaoExercicio(e)}</Text>
                      {!!e.seriesPadrao && (
                        <Text style={ui.subtexto}>
                          Padrão: {e.seriesPadrao}x{e.repsPadrao}  ·  {e.intervaloPadrao}
                        </Text>
                      )}
                      {e.personalizado && (
                        <View style={ui.tag}><Text style={ui.tagTxt}>Cadastrado por você</Text></View>
                      )}
                    </View>
                    {e.personalizado && (
                      <>
                        <TouchableOpacity style={ui.acao} onPress={() => abrirForm(e)} accessibilityLabel="Editar exercício">
                          <MaterialIcons name="edit" size={20} color={HD.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={ui.acao} onPress={() => excluirExercicio(e)} accessibilityLabel="Excluir exercício">
                          <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Modal único: escolher exercício, cadastrar/editar um, ou ajustar item do treino ── */}
      <Folha
        visivel={folhaAberta}
        titulo={
          modoFolha === 'escolher' ? 'Selecione o exercício'
            : modoFolha === 'item' ? 'Ajustar exercício'
              : editandoId ? 'Editar exercício' : 'Novo exercício'
        }
        onFechar={fecharFolha}
      >
        {modoFolha === 'item' && itemEditando ? (
          <>
            <View>
              <Text style={s.ajusteNome}>{itemEditando.item.exercicio?.nome}</Text>
              <Text style={ui.subtexto}>
                {[
                  descricaoExercicio(itemEditando.item.exercicio ?? { grupo: '' }),
                  itemEditando.origem === 'lista' ? 'Lista ainda não salva' : `Treino de ${ROTULO_DIA[itemEditando.origem]}`,
                ].filter(Boolean).join('  ·  ')}
              </Text>
            </View>
            <View>
              <Text style={ui.campoLabel}>Séries</Text>
              <Chips opcoes={opcoesCom(SERIES_OPTS, itemEditando.item.series)} valor={editSeries} onChange={setEditSeries} />
            </View>
            <View>
              <Text style={ui.campoLabel}>Repetições</Text>
              <Chips opcoes={opcoesCom(REPS_OPTS, itemEditando.item.reps)} valor={editReps} onChange={setEditReps} />
            </View>
            <View>
              <Text style={ui.campoLabel}>Intervalo</Text>
              <Chips opcoes={opcoesCom(INTERVALO_OPTS, itemEditando.item.intervalo)} valor={editIntervalo} onChange={setEditIntervalo} />
            </View>
            <Botao texto="Salvar alterações" onPress={salvarAjuste} />
          </>
        ) : modoFolha === 'escolher' ? (
          <>
            {filtrosCatalogo}
            <BotaoSecundario
              texto={busca.trim() ? `Cadastrar "${busca.trim()}"` : 'Novo exercício'}
              onPress={() => abrirForm(undefined, true)}
            />
            <View>
              {catalogoFiltrado.length === 0 ? (
                <Vazio icone="search-off" texto="Nenhum exercício encontrado. Cadastre um novo acima." />
              ) : (
                catalogoFiltrado.map((e, i) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[ui.linha, i === 0 && ui.linhaPrimeira]}
                    onPress={() => escolherExercicio(e)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={ui.linhaTitulo}>{e.nome}</Text>
                      <Text style={ui.subtexto}>{descricaoExercicio(e)}</Text>
                    </View>
                    <MaterialIcons
                      name={exercicio?.id === e.id ? 'check-circle' : 'add-circle-outline'}
                      size={22}
                      color={exercicio?.id === e.id ? HD.primary : c.subtexto}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            <Campo
              label="Nome do exercício *"
              placeholder="Ex: Agachamento Búlgaro"
              value={form.nome}
              onChangeText={nome => setForm(f => ({ ...f, nome }))}
              maxLength={40}
            />
            <View>
              <Text style={ui.campoLabel}>Grupo muscular *</Text>
              <Chips opcoes={GRUPOS_MUSCULARES} valor={form.grupo} onChange={grupo => setForm(f => ({ ...f, grupo }))} />
            </View>
            <View>
              <Text style={ui.campoLabel}>Equipamento</Text>
              <Chips
                opcoes={EQUIPAMENTOS}
                valor={form.equipamento}
                onChange={eq => setForm(f => ({ ...f, equipamento: f.equipamento === eq ? '' : eq }))}
              />
            </View>
            <View>
              <Text style={ui.campoLabel}>Séries sugeridas</Text>
              <Chips opcoes={SERIES_OPTS} valor={form.series} onChange={v => setForm(f => ({ ...f, series: v }))} />
            </View>
            <View>
              <Text style={ui.campoLabel}>Repetições sugeridas</Text>
              <Chips opcoes={REPS_OPTS} valor={form.reps} onChange={v => setForm(f => ({ ...f, reps: v }))} />
            </View>
            <View>
              <Text style={ui.campoLabel}>Intervalo sugerido</Text>
              <Chips opcoes={INTERVALO_OPTS} valor={form.intervalo} onChange={v => setForm(f => ({ ...f, intervalo: v }))} />
            </View>
            <Campo
              label="Observações (opcional)"
              placeholder="Dicas de execução, postura, cuidados..."
              value={form.observacoes}
              onChangeText={observacoes => setForm(f => ({ ...f, observacoes }))}
              multiline
              maxLength={200}
            />
            <Botao texto={editandoId ? 'Salvar alterações' : 'Cadastrar exercício'} onPress={salvarForm} />
          </>
        )}
      </Folha>
    </View>
  );
}

const s = StyleSheet.create({
  espaco: { marginTop: 14 },
  ajusteNome: { fontSize: 16, fontWeight: '700', color: HD.primary },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { backgroundColor: HD.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt: { color: HD.white, fontSize: 11, fontWeight: '600' },
});
