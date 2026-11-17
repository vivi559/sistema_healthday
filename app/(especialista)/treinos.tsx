/**
 * app/(especialista)/treinos.tsx
 * Criação e gerenciamento de treinos pelo especialista.
 *
 * Persistência: usa as funções oficiais de constants/Storage.ts (getTreinos / salvarTreinos),
 * que é o que a tela de treinos do usuário lê. Atenção: no Storage atual os treinos são
 * GLOBAIS (TreinoDia não tem usuarioId), então o treino salvo vale para o app inteiro.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, StatusBar, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import HeaderEspecialista from '@/components/HeaderEspecialista';
import { MaterialIcons } from '@expo/vector-icons';
import {
  atualizarStatusSolicitacao,
  getSolicitacoes,
  getTreinos,
  getUserAtual,
  getUsuarios,
  salvarTreinos,
  type Exercicio,
  type GrupoTreino,
  type TreinoDia,
  type User,
} from '@/constants/Storage';
import {
  GRUPOS_MUSCULARES,
  getExerciciosCatalogo,
  permissoesCatalogo,
  restaurarExerciciosPadrao,
  salvarExerciciosCatalogo,
  type ExercicioCatalogo,
} from '@/constants/CatalogoEspecialista';

type Dia = 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex';
const DIAS: Dia[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

const SERIES_OPTS = ['2', '3', '4', '5', '6'];
const REPS_OPTS = ['8', '10', '12', '15', '20'];
// Mesmo padrão de texto usado nos treinos do Storage ('45 Seg', '1 Min')
const INTERVALO_OPTS = ['30 Seg', '45 Seg', '1 Min', '1.5 Min', '2 Min', '3 Min'];

type ExercicioLista = {
  uid: string;
  exercicio: ExercicioCatalogo;
  series: string;
  reps: string;
  intervalo: string;
};

// Dropdown simples (fora do componente principal para não ser recriado a cada render)
function DropdownSimples({
  label, valor, show, onToggle, opcoes, onSelect, s, temaDark,
}: {
  label: string; valor: string; show: boolean; onToggle: () => void;
  opcoes: string[]; onSelect: (v: string) => void; s: any; temaDark: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={s.dropdown} onPress={onToggle}>
        <Text style={s.dropdownTxt}>{valor || label}</Text>
        <MaterialIcons name={show ? 'expand-less' : 'expand-more'} size={22} color={temaDark ? '#ccc' : '#555'} />
      </TouchableOpacity>
      {show && (
        <View style={s.dropdownList}>
          {opcoes.map(o => (
            <TouchableOpacity key={o} style={s.dropdownItem} onPress={() => onSelect(o)}>
              <Text style={s.dropdownItemTxt}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

export default function EspecialistaTreinos() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [diaSelecionado, setDiaSelecionado] = useState<Dia>('Seg');
  const [alunos, setAlunos] = useState<User[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<User | null>(null);
  const [showAlunos, setShowAlunos] = useState(false);

  const [exercicioSelecionado, setExercicioSelecionado] = useState<ExercicioCatalogo | null>(null);
  const [showExercicios, setShowExercicios] = useState(false);

  const [series, setSeries] = useState('');
  const [showSeries, setShowSeries] = useState(false);

  const [reps, setReps] = useState('');
  const [showReps, setShowReps] = useState(false);

  const [intervalo, setIntervalo] = useState('');
  const [showIntervalo, setShowIntervalo] = useState(false);

  const [exerciciosAdicionados, setExerciciosAdicionados] = useState<ExercicioLista[]>([]);
  const [aba, setAba] = useState<'criar' | 'gerenciar' | 'exercicios'>('criar');

  // ── Catálogo de exercícios (personal trainers) ──
  const [catalogo, setCatalogo] = useState<ExercicioCatalogo[]>([]);
  const [podeEditarCatalogo, setPodeEditarCatalogo] = useState(true);
  const [buscaCat, setBuscaCat] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('Todos');
  const [modalEx, setModalEx] = useState(false);
  const [exEditando, setExEditando] = useState<ExercicioCatalogo | null>(null);
  const [exNome, setExNome] = useState('');
  const [exGrupo, setExGrupo] = useState(GRUPOS_MUSCULARES[0]);
  const [exGrupoNovo, setExGrupoNovo] = useState('');
  const [treinosSalvos, setTreinosSalvos] = useState<TreinoDia[]>([]);

  // Alunos (role === 'usuario') e treinos sempre atualizados ao focar a tela
  useFocusEffect(
    useCallback(() => {
      getUsuarios()
        .then(todos => setAlunos(todos.filter(u => u.role === 'usuario')))
        .catch(() => setAlunos([]));
      carregarTreinosSalvos();
      getExerciciosCatalogo().then(setCatalogo);
      getUserAtual().then(u => setPodeEditarCatalogo(permissoesCatalogo((u as any)?.especialidade).exercicios));
    }, [])
  );

  useEffect(() => {
    if (aba === 'gerenciar') carregarTreinosSalvos();
  }, [aba]);

  const carregarTreinosSalvos = async () => {
    try {
      setTreinosSalvos(await getTreinos());
    } catch {
      setTreinosSalvos([]);
    }
  };

  const removerExercicioSalvo = (dia: string, grupoId: string, exId: string) => {
    Alert.alert('Remover', 'Deseja remover este exercício?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            const atuais = await getTreinos();
            const novos = atuais.map(t => {
              if (t.diaSemana !== dia) return t;
              const grupos = t.grupos
                .map(g => g.id === grupoId ? { ...g, exercicios: g.exercicios.filter(e => e.id !== exId) } : g)
                .filter(g => g.exercicios.length > 0);
              return { ...t, grupos };
            });
            await salvarTreinos(novos);
            setTreinosSalvos(novos);
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o exercício.');
          }
        },
      },
    ]);
  };

  // ── CRUD do catálogo de exercícios ──
  const gruposDisponiveis = Array.from(new Set([...GRUPOS_MUSCULARES, ...catalogo.map(e => e.grupo)]));

  const abrirNovoExercicio = () => {
    setExEditando(null);
    setExNome('');
    setExGrupo(GRUPOS_MUSCULARES[0]);
    setExGrupoNovo('');
    setModalEx(true);
  };

  const abrirEdicaoExercicio = (e: ExercicioCatalogo) => {
    setExEditando(e);
    setExNome(e.nome);
    setExGrupo(e.grupo);
    setExGrupoNovo('');
    setModalEx(true);
  };

  const salvarExercicioCatalogo = async () => {
    const nome = exNome.trim();
    const grupo = exGrupoNovo.trim() || exGrupo;
    if (!nome) return Alert.alert('Atenção', 'Informe o nome do exercício.');
    if (catalogo.some(e => e.nome.toLowerCase() === nome.toLowerCase() && e.id !== exEditando?.id)) {
      return Alert.alert('Atenção', 'Já existe um exercício com esse nome.');
    }
    try {
      const nova = exEditando
        ? catalogo.map(e => e.id === exEditando.id ? { ...e, nome, grupo } : e)
        : [...catalogo, { id: `ex_${Date.now()}`, nome, grupo }];
      await salvarExerciciosCatalogo(nova);
      setCatalogo(nova);
      setModalEx(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o exercício.');
    }
  };

  const excluirExercicioCatalogo = (e: ExercicioCatalogo) => {
    Alert.alert('Excluir', `Excluir "${e.nome}" da lista? Treinos já criados não são alterados.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            const nova = catalogo.filter(x => x.id !== e.id);
            await salvarExerciciosCatalogo(nova);
            setCatalogo(nova);
            if (exercicioSelecionado?.id === e.id) setExercicioSelecionado(null);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o exercício.');
          }
        },
      },
    ]);
  };

  const restaurarCatalogo = () => {
    Alert.alert('Restaurar lista', 'Voltar para a lista padrão de exercícios? Os exercícios que você criou serão removidos da lista.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: async () => {
          await restaurarExerciciosPadrao();
          setCatalogo(await getExerciciosCatalogo());
        },
      },
    ]);
  };

  const catalogoFiltrado = catalogo.filter(e =>
    (grupoFiltro === 'Todos' || e.grupo === grupoFiltro) &&
    e.nome.toLowerCase().includes(buscaCat.trim().toLowerCase())
  );

  const fecharTodos = () => {
    setShowAlunos(false);
    setShowExercicios(false);
    setShowSeries(false);
    setShowReps(false);
    setShowIntervalo(false);
  };

  const adicionarExercicio = () => {
    if (!exercicioSelecionado) return Alert.alert('Atenção', 'Selecione um exercício!');
    if (!series) return Alert.alert('Atenção', 'Selecione as séries!');
    if (!reps) return Alert.alert('Atenção', 'Selecione as repetições!');
    if (!intervalo) return Alert.alert('Atenção', 'Selecione o intervalo!');
    if (exerciciosAdicionados.some(e => e.exercicio.id === exercicioSelecionado.id)) {
      return Alert.alert('Atenção', 'Esse exercício já está na lista.');
    }

    setExerciciosAdicionados(prev => [...prev, {
      uid: Date.now().toString(),
      exercicio: exercicioSelecionado,
      series, reps, intervalo,
    }]);
    setExercicioSelecionado(null);
    setSeries('');
    setReps('');
    setIntervalo('');
  };

  const removerExercicio = (uid: string) => {
    setExerciciosAdicionados(prev => prev.filter(e => e.uid !== uid));
  };

  // Fecha a(s) solicitação(ões) em aberto do aluno para o tipo salvo
  const atualizarSolicitacoesDoAluno = async (alunoId: string, tipo: 'treino') => {
    try {
      const todas = await getSolicitacoes();
      const abertas = todas.filter(
        sol => sol.usuarioId === alunoId && sol.status !== 'concluida' && (sol.tipo === tipo || sol.tipo === 'ambos')
      );
      for (const sol of abertas) {
        // 'ambos' só fica concluída quando dieta e treino forem entregues → mantém em andamento
        await atualizarStatusSolicitacao(sol.id, sol.tipo === 'ambos' ? 'em_andamento' : 'concluida');
      }
    } catch {
      // não bloqueia o salvamento do treino
    }
  };

  const concluirTreino = async () => {
    if (!alunoSelecionado) return Alert.alert('Atenção', 'Selecione um aluno!');
    if (exerciciosAdicionados.length === 0) return Alert.alert('Atenção', 'Adicione pelo menos um exercício!');

    try {
      // Agrupa os exercícios pelo grupo muscular → GrupoTreino[]
      const porGrupo = new Map<string, Exercicio[]>();
      exerciciosAdicionados.forEach(item => {
        const ex: Exercicio = {
          id: `${item.exercicio.id}_${item.uid}`,
          nome: item.exercicio.nome,
          series: parseInt(item.series, 10),
          reps: parseInt(item.reps, 10),
          intervalo: item.intervalo,
        };
        const lista = porGrupo.get(item.exercicio.grupo) ?? [];
        lista.push(ex);
        porGrupo.set(item.exercicio.grupo, lista);
      });

      const novosGrupos: GrupoTreino[] = Array.from(porGrupo.entries()).map(([grupo, exercicios]) => ({
        id: `esp_${diaSelecionado}_${grupo}_${Date.now()}`,
        nome: `Treino - ${grupo}`,
        exercicios,
      }));

      const atuais = await getTreinos();
      const existe = atuais.some(t => t.diaSemana === diaSelecionado);
      const atualizados: TreinoDia[] = existe
        ? atuais.map(t => t.diaSemana === diaSelecionado ? { ...t, grupos: [...t.grupos, ...novosGrupos] } : t)
        : [...atuais, { diaSemana: diaSelecionado, grupos: novosGrupos }];

      await salvarTreinos(atualizados);
      await atualizarSolicitacoesDoAluno(alunoSelecionado.id, 'treino');

      setTreinosSalvos(atualizados);
      setExerciciosAdicionados([]);
      Alert.alert('Treino salvo!', `Treino de ${diaSelecionado} salvo para ${alunoSelecionado.nome}!`);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o treino.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      <HeaderEspecialista titulo="Especialista" />

      {/* Abas */}
      <View style={s.abasRow}>
        <TouchableOpacity style={[s.abaBtn, aba === 'criar' && s.abaBtnAtivo]} onPress={() => setAba('criar')}>
          <Text style={[s.abaTxt, aba === 'criar' && s.abaTxtAtivo]}>Criar Treino</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.abaBtn, aba === 'gerenciar' && s.abaBtnAtivo]} onPress={() => setAba('gerenciar')}>
          <Text style={[s.abaTxt, aba === 'gerenciar' && s.abaTxtAtivo]}>Gerenciar</Text>
        </TouchableOpacity>
        {podeEditarCatalogo && (
          <TouchableOpacity style={[s.abaBtn, aba === 'exercicios' && s.abaBtnAtivo]} onPress={() => setAba('exercicios')}>
            <Text style={[s.abaTxt, aba === 'exercicios' && s.abaTxtAtivo]}>Exercícios</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Formulário de criação */}
        {aba === 'criar' && (
        <View>
        <View style={s.diasRow}>
          {DIAS.map(dia => (
            <TouchableOpacity
              key={dia}
              style={[s.diaBtn, diaSelecionado === dia && s.diaBtnAtivo]}
              onPress={() => setDiaSelecionado(dia)}
            >
              <Text style={[s.diaTxt, diaSelecionado === dia && s.diaTxtAtivo]}>{dia}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Aluno */}
        <TouchableOpacity style={s.dropdown} onPress={() => { const abrir = !showAlunos; fecharTodos(); setShowAlunos(abrir); }}>
          <Text style={s.dropdownTxt}>{alunoSelecionado ? `ID:${alunoSelecionado.id}_${alunoSelecionado.nome}` : 'Selecione o aluno'}</Text>
          <MaterialIcons name={showAlunos ? 'expand-less' : 'expand-more'} size={22} color={temaDark ? '#ccc' : '#555'} />
        </TouchableOpacity>
        {showAlunos && (
          <View style={s.dropdownList}>
            {alunos.length === 0 ? (
              <View style={s.dropdownItem}><Text style={s.dropdownItemTxt}>Nenhum aluno cadastrado.</Text></View>
            ) : alunos.map(a => (
              <TouchableOpacity key={a.id} style={s.dropdownItem} onPress={() => { setAlunoSelecionado(a); setShowAlunos(false); }}>
                <Text style={s.dropdownItemTxt}>ID:{a.id}_{a.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Exercício */}
        <TouchableOpacity style={s.dropdown} onPress={() => { const abrir = !showExercicios; fecharTodos(); setShowExercicios(abrir); }}>
          <Text style={s.dropdownTxt}>{exercicioSelecionado ? exercicioSelecionado.nome : 'Selecione o exercício'}</Text>
          <MaterialIcons name={showExercicios ? 'expand-less' : 'expand-more'} size={22} color={temaDark ? '#ccc' : '#555'} />
        </TouchableOpacity>
        {showExercicios && (
          <View style={s.dropdownList}>
            {catalogo.map(e => (
              <TouchableOpacity key={e.id} style={s.dropdownItem} onPress={() => { setExercicioSelecionado(e); setShowExercicios(false); }}>
                <Text style={s.dropdownItemTxt}>{e.nome}</Text>
                <Text style={s.dropdownItemSub}>{e.grupo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Intervalo */}
        <DropdownSimples
          s={s} temaDark={temaDark}
          label="Intervalo" valor={intervalo} show={showIntervalo}
          onToggle={() => { const abrir = !showIntervalo; fecharTodos(); setShowIntervalo(abrir); }}
          opcoes={INTERVALO_OPTS} onSelect={v => { setIntervalo(v); setShowIntervalo(false); }}
        />

        {/* Séries */}
        <DropdownSimples
          s={s} temaDark={temaDark}
          label="Séries" valor={series ? `${series} Séries` : ''} show={showSeries}
          onToggle={() => { const abrir = !showSeries; fecharTodos(); setShowSeries(abrir); }}
          opcoes={SERIES_OPTS} onSelect={v => { setSeries(v); setShowSeries(false); }}
        />

        {/* Repetições */}
        <DropdownSimples
          s={s} temaDark={temaDark}
          label="Repetições" valor={reps ? `${reps} Reps` : ''} show={showReps}
          onToggle={() => { const abrir = !showReps; fecharTodos(); setShowReps(abrir); }}
          opcoes={REPS_OPTS} onSelect={v => { setReps(v); setShowReps(false); }}
        />

        {/* Botão adicionar exercício */}
        <TouchableOpacity style={s.adicionarBtn} onPress={adicionarExercicio}>
          <MaterialIcons name="add-circle-outline" size={20} color={HD.primary} />
          <Text style={s.adicionarTxt}>Adicionar Exercício à Lista</Text>
        </TouchableOpacity>

        {/* Lista de exercícios adicionados */}
        {exerciciosAdicionados.length > 0 && (
          <View style={s.listaBox}>
            <Text style={s.listaTitulo}>Exercícios para {diaSelecionado}:</Text>
            {exerciciosAdicionados.map((item, idx) => (
              <View key={item.uid} style={s.exercicioCard}>
                <View style={s.exercicioInfo}>
                  <Text style={s.exercicioNome}>{idx + 1}. {item.exercicio.nome}</Text>
                  <View style={s.badgesRow}>
                    <View style={s.badge}><Text style={s.badgeTxt}>Séries {item.series}</Text></View>
                    <View style={s.badge}><Text style={s.badgeTxt}>Reps {item.reps}</Text></View>
                    <View style={s.badge}><Text style={s.badgeTxt}>{item.intervalo}</Text></View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removerExercicio(item.uid)}>
                  <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        </View>)}

        {/* ── Seção Gerenciar ── */}
        {aba === 'gerenciar' && (
          <View>
            <Text style={s.avisoGlobal}>
              Os treinos são compartilhados por todo o app (não há treino individual por aluno).
            </Text>
            {DIAS.every(d => !treinosSalvos.find(t => t.diaSemana === d)?.grupos.length) ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Nenhum treino cadastrado.</Text>
              </View>
            ) : (
              DIAS.map(dia => {
                const grupos = treinosSalvos.find(t => t.diaSemana === dia)?.grupos ?? [];
                if (grupos.length === 0) return null;
                return (
                  <View key={dia} style={s.listaBox}>
                    <Text style={s.listaTitulo}>{dia}</Text>
                    {grupos.map(g => (
                      <View key={g.id}>
                        <Text style={s.grupoTitulo}>{g.nome}</Text>
                        {g.exercicios.map((item, idx) => (
                          <View key={item.id} style={s.exercicioCard}>
                            <View style={s.exercicioInfo}>
                              <Text style={s.exercicioNome}>{idx + 1}. {item.nome}</Text>
                              <View style={s.badgesRow}>
                                <View style={s.badge}><Text style={s.badgeTxt}>Séries {item.series}</Text></View>
                                <View style={s.badge}><Text style={s.badgeTxt}>Reps {item.reps}</Text></View>
                                <View style={s.badge}><Text style={s.badgeTxt}>{item.intervalo}</Text></View>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => removerExercicioSalvo(dia, g.id, item.id)}>
                              <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Catálogo de exercícios ── */}
        {aba === 'exercicios' && podeEditarCatalogo && (
          <View style={{ marginTop: 12 }}>
            <View style={s.buscaRow}>
              <MaterialIcons name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                style={s.buscaInput}
                placeholder="Buscar exercício"
                placeholderTextColor="#aaa"
                value={buscaCat}
                onChangeText={setBuscaCat}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {['Todos', ...gruposDisponiveis].map(g => (
                <TouchableOpacity key={g} style={[s.chip, grupoFiltro === g && s.chipAtivo]} onPress={() => setGrupoFiltro(g)}>
                  <Text style={[s.chipTxt, grupoFiltro === g && s.chipTxtAtivo]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={s.adicionarBtn} onPress={abrirNovoExercicio}>
              <MaterialIcons name="add-circle-outline" size={20} color={HD.primary} />
              <Text style={s.adicionarTxt}>Novo Exercício</Text>
            </TouchableOpacity>

            <View style={s.listaBox}>
              <Text style={s.listaTitulo}>{catalogoFiltrado.length} exercício(s) na lista do app</Text>
              {catalogoFiltrado.length === 0 && <Text style={s.emptyTxt}>Nenhum exercício encontrado.</Text>}
              {catalogoFiltrado.map(e => (
                <View key={e.id} style={s.exercicioCard}>
                  <View style={s.exercicioInfo}>
                    <Text style={[s.exercicioNome, { marginBottom: 2 }]}>{e.nome}</Text>
                    <Text style={s.dropdownItemSub}>{e.grupo}</Text>
                  </View>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => abrirEdicaoExercicio(e)}>
                    <MaterialIcons name="edit" size={20} color={HD.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => excluirExercicioCatalogo(e)}>
                    <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={restaurarCatalogo} style={{ alignItems: 'center', padding: 12 }}>
              <Text style={s.restaurarTxt}>Restaurar lista padrão</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal novo/editar exercício */}
      <Modal visible={modalEx} animationType="slide" transparent onRequestClose={() => setModalEx(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{exEditando ? 'Editar Exercício' : 'Novo Exercício'}</Text>
              <TouchableOpacity onPress={() => setModalEx(false)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalLabel}>Nome</Text>
            <TextInput
              style={s.modalInput}
              value={exNome}
              onChangeText={setExNome}
              placeholder="Ex: Remada Baixa"
              placeholderTextColor="#aaa"
            />

            <Text style={s.modalLabel}>Grupo muscular</Text>
            <View style={s.chipsWrap}>
              {gruposDisponiveis.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[s.chip, exGrupo === g && !exGrupoNovo.trim() && s.chipAtivo]}
                  onPress={() => { setExGrupo(g); setExGrupoNovo(''); }}
                >
                  <Text style={[s.chipTxt, exGrupo === g && !exGrupoNovo.trim() && s.chipTxtAtivo]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.modalInput}
              value={exGrupoNovo}
              onChangeText={setExGrupoNovo}
              placeholder="Ou digite um novo grupo (opcional)"
              placeholderTextColor="#aaa"
            />

            <TouchableOpacity style={s.concluirBtn} onPress={salvarExercicioCatalogo}>
              <Text style={s.concluirTxt}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Botão Concluir (somente na aba de criação) */}
      {aba === 'criar' && (
        <View style={s.footer}>
          <TouchableOpacity style={s.concluirBtn} onPress={concluirTreino}>
            <Text style={s.concluirTxt}>Concluir Treino</Text>
            <View style={s.checkCircle}>
              <MaterialIcons name="check" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = (temaDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: temaDark ? '#1a1a1a' : HD.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: HD.primary },
  scroll: { flex: 1, paddingHorizontal: 16 },
  diasRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  diaBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: temaDark ? '#333' : '#555', justifyContent: 'center', alignItems: 'center' },
  diaBtnAtivo: { backgroundColor: HD.primary },
  diaTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  diaTxtAtivo: { color: '#fff' },
  dropdown: { backgroundColor: temaDark ? '#2a2a2a' : '#fff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  dropdownTxt: { fontSize: 15, color: temaDark ? '#ccc' : '#555' },
  dropdownList: { backgroundColor: temaDark ? '#333' : '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 4 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: temaDark ? '#444' : '#eee' },
  dropdownItemTxt: { fontSize: 14, color: temaDark ? '#ddd' : '#333' },
  dropdownItemSub: { fontSize: 11, color: HD.primary, marginTop: 2 },
  adicionarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: temaDark ? '#1a3a35' : '#e0faf5', borderRadius: 12, marginBottom: 16 },
  adicionarTxt: { color: HD.primary, fontWeight: '600', fontSize: 14 },
  listaBox: { backgroundColor: temaDark ? '#2a2a2a' : '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  listaTitulo: { fontSize: 14, fontWeight: '700', color: temaDark ? '#ccc' : '#333', marginBottom: 12 },
  exercicioCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: temaDark ? '#444' : '#eee' },
  exercicioInfo: { flex: 1 },
  exercicioNome: { fontSize: 14, fontWeight: '600', color: temaDark ? '#eee' : '#222', marginBottom: 6 },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: HD.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  footer: { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 8 },
  concluirBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  concluirTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  abasRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, padding: 4 },
  abaBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  abaBtnAtivo: { backgroundColor: HD.primary },
  abaTxt: { fontSize: 14, fontWeight: '600', color: temaDark ? '#aaa' : '#666' },
  abaTxtAtivo: { color: '#fff' },
  emptyBox: { padding: 32, alignItems: 'center' },
  buscaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  buscaInput: { flex: 1, fontSize: 14, color: temaDark ? '#ddd' : '#333' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: temaDark ? '#2a2a2a' : '#ddd', marginRight: 8, marginBottom: 8 },
  chipAtivo: { backgroundColor: HD.primary },
  chipTxt: { fontSize: 12, fontWeight: '600', color: temaDark ? '#aaa' : '#555' },
  chipTxtAtivo: { color: '#fff' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  restaurarTxt: { color: HD.textLight, fontSize: 12, textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: temaDark ? '#222' : '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: temaDark ? '#eee' : '#222' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: temaDark ? '#ccc' : '#333', marginBottom: 8 },
  modalInput: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: temaDark ? '#eee' : '#222', marginBottom: 14 },
  avisoGlobal: { fontSize: 12, color: temaDark ? '#aaa' : '#888', textAlign: 'center', marginVertical: 12, paddingHorizontal: 12 },
  grupoTitulo: { fontSize: 13, fontWeight: '700', color: HD.secondary, marginTop: 6, marginBottom: 2 },
  emptyTxt: { color: temaDark ? '#aaa' : '#888', fontSize: 14, textAlign: 'center' },
});
