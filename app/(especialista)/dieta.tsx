/**
 * app/(especialista)/dieta.tsx
 * Criação e gerenciamento de dieta pelo especialista.
 *
 * Persistência: usa getDietaUsuario / salvarDieta de constants/Storage.ts — a mesma
 * Dieta (uma por aluno) que a tela de dieta do usuário exibe. A Dieta do Storage não tem
 * dimensão "dia da semana", então o especialista monta o plano diário por refeição.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert, StatusBar, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import HeaderEspecialista from '@/components/HeaderEspecialista';
import { MaterialIcons } from '@expo/vector-icons';
import {
  atualizarStatusSolicitacao,
  getDietaUsuario,
  getSolicitacoes,
  getUserAtual,
  getUsuarios,
  salvarDieta,
  type Alimento,
  type Dieta,
  type ItemRefeicao,
  type RefeicaoDieta,
  type User,
} from '@/constants/Storage';
import {
  getAlimentosCatalogo,
  permissoesCatalogo,
  restaurarAlimentosPadrao,
  salvarAlimentosCatalogo,
  type AlimentoCatalogo,
} from '@/constants/CatalogoEspecialista';

const REFEICOES: RefeicaoDieta['tipo'][] = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Janta', 'Outros'];

type AlimentoSelecionado = AlimentoCatalogo & { quantidade: number };

// Alimento do Storage + macros por 100g (campos extras são preservados no JSON)
type AlimentoComMacros = Alimento & { carboidrato?: number; proteina?: number; gordura?: number };

// Soma kcal e macros de todas as refeições da dieta (macros via campos salvos ou tabela por nome)
function calcularTotais(refeicoes: RefeicaoDieta[], catalogo: AlimentoCatalogo[]) {
  let kcal = 0, carbo = 0, prot = 0, gord = 0;
  refeicoes.forEach(r => r.alimentos.forEach(item => {
    const a = item.alimento as AlimentoComMacros;
    const ref = catalogo.find(b => b.nome === a.nome);
    const f = item.gramas / 100;
    kcal += a.kcalPor100g * f;
    carbo += (a.carboidrato ?? ref?.carboidrato ?? 0) * f;
    prot += (a.proteina ?? ref?.proteina ?? 0) * f;
    gord += (a.gordura ?? ref?.gordura ?? 0) * f;
  }));
  return {
    kcalTotal: Math.round(kcal),
    carboTotal: Math.round(carbo),
    proteinasTotal: Math.round(prot),
    gordurasTotal: Math.round(gord),
  };
}

type CampoNutri = 'kcal' | 'carboidrato' | 'proteina' | 'gordura' | 'fibra' | 'sodio' | 'calcio' | 'ferro';
const CAMPOS_NUTRI: { id: CampoNutri; label: string; unidade: string }[] = [
  { id: 'kcal', label: 'Calorias', unidade: 'kcal' },
  { id: 'carboidrato', label: 'Carboidratos', unidade: 'g' },
  { id: 'proteina', label: 'Proteínas', unidade: 'g' },
  { id: 'gordura', label: 'Gorduras', unidade: 'g' },
  { id: 'fibra', label: 'Fibras', unidade: 'g' },
  { id: 'sodio', label: 'Sódio', unidade: 'mg' },
  { id: 'calcio', label: 'Cálcio', unidade: 'mg' },
  { id: 'ferro', label: 'Ferro', unidade: 'mg' },
];

function formVazio(): Record<CampoNutri | 'nome', string> {
  return { nome: '', kcal: '', carboidrato: '', proteina: '', gordura: '', fibra: '', sodio: '', calcio: '', ferro: '' };
}

// aceita vírgula ou ponto; vazio vira 0
function paraNumero(v: string) {
  const n = parseFloat((v || '0').replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

export default function EspecialistaDieta() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [alunos, setAlunos] = useState<User[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<User | null>(null);
  const [showAlunos, setShowAlunos] = useState(false);
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState<RefeicaoDieta['tipo'] | ''>('');
  const [showRefeicoes, setShowRefeicoes] = useState(false);
  const [busca, setBusca] = useState('');
  const [alimentosSelecionados, setAlimentosSelecionados] = useState<AlimentoSelecionado[]>([]);
  const [aba, setAba] = useState<'criar' | 'gerenciar' | 'alimentos'>('criar');

  // ── Catálogo de alimentos (nutricionistas) ──
  const [catalogo, setCatalogo] = useState<AlimentoCatalogo[]>([]);
  const [podeEditarCatalogo, setPodeEditarCatalogo] = useState(true);
  const [buscaCat, setBuscaCat] = useState('');
  const [modalAl, setModalAl] = useState(false);
  const [alEditando, setAlEditando] = useState<AlimentoCatalogo | null>(null);
  const [form, setForm] = useState<Record<CampoNutri | 'nome', string>>(formVazio());
  const [dietaSalva, setDietaSalva] = useState<Dieta | null>(null);

  // ── Modal de quantidade / macros / micros ──
  const [modalAlimento, setModalAlimento] = useState<any>(null);
  const [showModalAlimento, setShowModalAlimento] = useState(false);
  const [quantidadeModal, setQuantidadeModal] = useState('100');

  useFocusEffect(
    useCallback(() => {
      getUsuarios()
        .then(todos => setAlunos(todos.filter(u => u.role === 'usuario')))
        .catch(() => setAlunos([]));
      getAlimentosCatalogo().then(setCatalogo);
      getUserAtual().then(u => setPodeEditarCatalogo(permissoesCatalogo((u as any)?.especialidade).alimentos));
    }, [])
  );

  // Recarrega a dieta do aluno ao trocar de aluno ou de aba
  React.useEffect(() => {
    if (alunoSelecionado) carregarDietaSalva(alunoSelecionado.id);
    else setDietaSalva(null);
  }, [alunoSelecionado, aba]);

  const carregarDietaSalva = async (alunoId: string) => {
    try {
      setDietaSalva(await getDietaUsuario(alunoId));
    } catch {
      setDietaSalva(null);
    }
  };

  const removerRefeicaoSalva = (tipo: string) => {
    if (!alunoSelecionado || !dietaSalva) return;
    Alert.alert('Remover', `Remover "${tipo}" da dieta de ${alunoSelecionado.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            const refeicoes = dietaSalva.refeicoes.filter(r => r.tipo !== tipo);
            const atualizada: Dieta = { ...dietaSalva, refeicoes, ...calcularTotais(refeicoes, catalogo) };
            await salvarDieta(atualizada);
            setDietaSalva(atualizada);
          } catch {
            Alert.alert('Erro', 'Não foi possível remover a refeição.');
          }
        },
      },
    ]);
  };

  // ── CRUD do catálogo de alimentos ──
  const abrirNovoAlimento = () => {
    setAlEditando(null);
    setForm(formVazio());
    setModalAl(true);
  };

  const abrirEdicaoAlimento = (a: AlimentoCatalogo) => {
    setAlEditando(a);
    setForm({
      nome: a.nome,
      kcal: String(a.kcal), carboidrato: String(a.carboidrato), proteina: String(a.proteina),
      gordura: String(a.gordura), fibra: String(a.fibra), sodio: String(a.sodio),
      calcio: String(a.calcio), ferro: String(a.ferro),
    });
    setModalAl(true);
  };

  const salvarAlimentoCatalogo = async () => {
    const nome = form.nome.trim();
    if (!nome) return Alert.alert('Atenção', 'Informe o nome do alimento.');
    if (catalogo.some(a => a.nome.toLowerCase() === nome.toLowerCase() && a.id !== alEditando?.id)) {
      return Alert.alert('Atenção', 'Já existe um alimento com esse nome.');
    }
    const nums = {} as Record<CampoNutri, number>;
    for (const c of CAMPOS_NUTRI) {
      const n = paraNumero(form[c.id]);
      if (isNaN(n) || n < 0) return Alert.alert('Atenção', `Valor inválido em "${c.label}".`);
      nums[c.id] = n;
    }
    if (nums.kcal <= 0) return Alert.alert('Atenção', 'Informe as calorias por 100g.');
    try {
      const nova = alEditando
        ? catalogo.map(a => a.id === alEditando.id ? { ...a, nome, ...nums } : a)
        : [...catalogo, { id: `al_${Date.now()}`, nome, ...nums }];
      await salvarAlimentosCatalogo(nova);
      setCatalogo(nova);
      setModalAl(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o alimento.');
    }
  };

  const excluirAlimentoCatalogo = (a: AlimentoCatalogo) => {
    Alert.alert('Excluir', `Excluir "${a.nome}" da lista? Dietas já criadas não são alteradas.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            const nova = catalogo.filter(x => x.id !== a.id);
            await salvarAlimentosCatalogo(nova);
            setCatalogo(nova);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o alimento.');
          }
        },
      },
    ]);
  };

  const restaurarCatalogo = () => {
    Alert.alert('Restaurar lista', 'Voltar para a lista padrão de alimentos? Os alimentos que você criou serão removidos da lista.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: async () => {
          await restaurarAlimentosPadrao();
          setCatalogo(await getAlimentosCatalogo());
        },
      },
    ]);
  };

  const alimentosFiltrados = catalogo.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Abre o modal de detalhes/quantidade para um alimento (já selecionado ou não)
  const abrirModalAlimento = (alimento: any) => {
    const existente = alimentosSelecionados.find(a => a.id === alimento.id);
    setModalAlimento(alimento);
    setQuantidadeModal(existente ? String(existente.quantidade) : '100');
    setShowModalAlimento(true);
  };

  const ajustarQuantidade = (delta: number) => {
    setQuantidadeModal(prev => {
      const atual = parseInt(prev, 10) || 0;
      const novo = Math.max(0, atual + delta);
      return String(novo);
    });
  };

  // Calcula o valor de um nutriente (base por 100g) proporcional à quantidade digitada
  const valorProporcional = (base: number) => {
    const qtd = parseFloat(quantidadeModal) || 0;
    return Math.round(base * (qtd / 100) * 10) / 10;
  };

  const removerAlimentoSelecionado = (id: string) => {
    setAlimentosSelecionados(prev => prev.filter(a => a.id !== id));
  };

  const confirmarAlimento = () => {
    const qtd = parseInt(quantidadeModal, 10) || 0;
    if (qtd <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida em gramas.');
      return;
    }
    setAlimentosSelecionados(prev => {
      const existe = prev.find(a => a.id === modalAlimento.id);
      if (existe) {
        return prev.map(a => (a.id === modalAlimento.id ? { ...a, quantidade: qtd } : a));
      }
      return [...prev, { ...modalAlimento, quantidade: qtd }];
    });
    setShowModalAlimento(false);
  };

  const jaSelecionado = !!(modalAlimento && alimentosSelecionados.find(a => a.id === modalAlimento.id));

  // Fecha a(s) solicitação(ões) em aberto do aluno
  const atualizarSolicitacoesDoAluno = async (alunoId: string) => {
    try {
      const todas = await getSolicitacoes();
      const abertas = todas.filter(
        sol => sol.usuarioId === alunoId && sol.status !== 'concluida' && (sol.tipo === 'dieta' || sol.tipo === 'ambos')
      );
      for (const sol of abertas) {
        // 'ambos' só fica concluída quando dieta e treino forem entregues → mantém em andamento
        await atualizarStatusSolicitacao(sol.id, sol.tipo === 'ambos' ? 'em_andamento' : 'concluida');
      }
    } catch {
      // não bloqueia o salvamento da dieta
    }
  };

  const finalizarDieta = async () => {
    if (!alunoSelecionado) return Alert.alert('Atenção', 'Selecione um aluno!');
    if (!refeicaoSelecionada) return Alert.alert('Atenção', 'Selecione a refeição!');
    if (alimentosSelecionados.length === 0) return Alert.alert('Atenção', 'Adicione pelo menos um alimento!');

    try {
      const especialista = await getUserAtual();
      const existente = await getDietaUsuario(alunoSelecionado.id);

      const itens: ItemRefeicao[] = alimentosSelecionados.map(a => {
        const alimento: AlimentoComMacros = {
          id: `cat_${a.id}`,
          nome: a.nome,
          kcalPor100g: a.kcal,
          carboidrato: a.carboidrato,
          proteina: a.proteina,
          gordura: a.gordura,
        };
        return { alimento, gramas: a.quantidade };
      });

      // Substitui a refeição escolhida, preservando as demais, e mantém a ordem do dia
      const outras = (existente?.refeicoes ?? []).filter(r => r.tipo !== refeicaoSelecionada);
      const refeicoes = [...outras, { tipo: refeicaoSelecionada, alimentos: itens }]
        .sort((a, b) => REFEICOES.indexOf(a.tipo) - REFEICOES.indexOf(b.tipo));

      const dieta: Dieta = {
        id: existente?.id ?? `dieta_${alunoSelecionado.id}_${Date.now()}`,
        usuarioId: alunoSelecionado.id,
        titulo: existente && !existente.automatica ? existente.titulo : 'Dieta personalizada',
        automatica: false,
        especialistaId: especialista?.id,
        refeicoes,
        ...calcularTotais(refeicoes, catalogo),
      };

      await salvarDieta(dieta);
      await atualizarSolicitacoesDoAluno(alunoSelecionado.id);

      setDietaSalva(dieta);
      Alert.alert('Dieta salva!', `${refeicaoSelecionada} salva para ${alunoSelecionado.nome}.`);
      setAlimentosSelecionados([]);
      setRefeicaoSelecionada('');
      setBusca('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a dieta.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      <HeaderEspecialista titulo="Especialista" />

      {/* Abas */}
      <View style={s.abasRow}>
        <TouchableOpacity style={[s.abaBtn, aba === 'criar' && s.abaBtnAtivo]} onPress={() => setAba('criar')}>
          <Text style={[s.abaTxt, aba === 'criar' && s.abaTxtAtivo]}>Criar Dieta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.abaBtn, aba === 'gerenciar' && s.abaBtnAtivo]} onPress={() => setAba('gerenciar')}>
          <Text style={[s.abaTxt, aba === 'gerenciar' && s.abaTxtAtivo]}>Gerenciar</Text>
        </TouchableOpacity>
        {podeEditarCatalogo && (
          <TouchableOpacity style={[s.abaBtn, aba === 'alimentos' && s.abaBtnAtivo]} onPress={() => setAba('alimentos')}>
            <Text style={[s.abaTxt, aba === 'alimentos' && s.abaTxtAtivo]}>Alimentos</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Aluno — fora das abas para valer tanto em Criar quanto em Gerenciar */}
        {aba !== 'alimentos' && (<>
        <TouchableOpacity style={[s.dropdown, { marginTop: 12 }]} onPress={() => { setShowAlunos(!showAlunos); setShowRefeicoes(false); }}>
          <Text style={s.dropdownTxt}>{alunoSelecionado ? `ID:${alunoSelecionado.id} - ${alunoSelecionado.nome}` : 'Selecione o aluno'}</Text>
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
        </>)}

        {aba === 'criar' && (
        <View>
        {/* Dropdown Refeição */}
        <TouchableOpacity style={s.dropdown} onPress={() => { setShowRefeicoes(!showRefeicoes); setShowAlunos(false); }}>
          <Text style={s.dropdownTxt}>{refeicaoSelecionada || 'Selecione a Refeição'}</Text>
          <MaterialIcons name={showRefeicoes ? 'expand-less' : 'expand-more'} size={22} color={temaDark ? '#ccc' : '#555'} />
        </TouchableOpacity>
        {showRefeicoes && (
          <View style={s.dropdownList}>
            {REFEICOES.map(r => (
              <TouchableOpacity key={r} style={s.dropdownItem} onPress={() => { setRefeicaoSelecionada(r); setShowRefeicoes(false); }}>
                <Text style={s.dropdownItemTxt}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Busca */}
        <View style={s.buscaRow}>
          <MaterialIcons name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={s.buscaInput}
            placeholder="Pesquise o Alimento"
            placeholderTextColor="#aaa"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Lista de alimentos — toque abre o modal de quantidade/macros/micros */}
        {alimentosFiltrados.map(a => {
          const selecionado = alimentosSelecionados.find(al => al.id === a.id);
          return (
            <TouchableOpacity key={a.id} style={[s.alimentoItem, selecionado && s.alimentoSelecionado]} onPress={() => abrirModalAlimento(a)}>
              <View style={{ flex: 1 }}>
                <Text style={s.alimentoNome}>{a.nome}</Text>
                <Text style={s.alimentoKcal}>
                  {a.kcal}kcal/100g{selecionado ? `  •  ${selecionado.quantidade}g adicionado(s)` : ''}
                </Text>
              </View>
              <MaterialIcons
                name={selecionado ? 'check-circle' : 'add-circle-outline'}
                size={22}
                color={selecionado ? HD.primary : (temaDark ? '#888' : '#555')}
              />
            </TouchableOpacity>
          );
        })}

        {/* Selecionados */}
        {alimentosSelecionados.length > 0 && (
          <View style={s.selecionadosBox}>
            <Text style={s.selecionadosTitle}>{alimentosSelecionados.length} alimento(s) selecionado(s)</Text>
            {alimentosSelecionados.map(al => (
              <View key={al.id} style={s.selecionadoItem}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirModalAlimento(al)}>
                  <Text style={s.selecionadoNome}>{al.nome}</Text>
                  <Text style={s.selecionadoInfo}>{al.quantidade}g  •  {Math.round((al.kcal * al.quantidade) / 100)}kcal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.selecionadoAcao} onPress={() => abrirModalAlimento(al)}>
                  <MaterialIcons name="edit" size={18} color={HD.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={s.selecionadoAcao} onPress={() => removerAlimentoSelecionado(al.id)}>
                  <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        </View>)}

        {/* ── Seção Gerenciar ── */}
        {aba === 'gerenciar' && (
          <View style={{ marginTop: 4 }}>
            {!alunoSelecionado ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Selecione um aluno acima para ver a dieta.</Text>
              </View>
            ) : !dietaSalva || dietaSalva.refeicoes.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Nenhuma dieta cadastrada para {alunoSelecionado.nome}.</Text>
              </View>
            ) : (
              <View style={s.diaBox}>
                <Text style={s.diaTituloGerenciar}>
                  {dietaSalva.titulo}{dietaSalva.automatica ? ' (automática)' : ''}
                </Text>
                <Text style={s.alimentoSalvoKcal}>
                  {dietaSalva.kcalTotal} kcal · C {dietaSalva.carboTotal}g · P {dietaSalva.proteinasTotal}g · G {dietaSalva.gordurasTotal}g
                </Text>
                <View style={{ height: 10 }} />
                {dietaSalva.refeicoes.map(ref => (
                  <View key={ref.tipo} style={s.refeicaoCard}>
                    <View style={s.refeicaoHeader}>
                      <Text style={s.refeicaoNome}>{ref.tipo}</Text>
                      <TouchableOpacity onPress={() => removerRefeicaoSalva(ref.tipo)}>
                        <MaterialIcons name="delete-outline" size={20} color={HD.accent} />
                      </TouchableOpacity>
                    </View>
                    {ref.alimentos.map((item, idx) => (
                      <View key={`${item.alimento.id}_${idx}`} style={s.alimentoSalvoRow}>
                        <Text style={s.alimentoSalvoNome}>
                          • {item.alimento.nome} ({item.gramas}g){item.extra ? ' ' : ''}
                          {item.extra && <Text style={s.extraTag}>EXTRA DO ALUNO</Text>}
                        </Text>
                        <Text style={s.alimentoSalvoKcal}>{Math.round((item.alimento.kcalPor100g * item.gramas) / 100)}kcal</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Catálogo de alimentos ── */}
        {aba === 'alimentos' && podeEditarCatalogo && (
          <View style={{ marginTop: 12 }}>
            <View style={s.buscaRow}>
              <MaterialIcons name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
              <TextInput
                style={s.buscaInput}
                placeholder="Buscar alimento"
                placeholderTextColor="#aaa"
                value={buscaCat}
                onChangeText={setBuscaCat}
              />
            </View>

            <TouchableOpacity style={[s.dropdown, { justifyContent: 'center', gap: 8, backgroundColor: temaDark ? '#1a3a35' : '#e0faf5' }]} onPress={abrirNovoAlimento}>
              <MaterialIcons name="add-circle-outline" size={20} color={HD.primary} />
              <Text style={{ color: HD.primary, fontWeight: '600', fontSize: 14 }}>Novo Alimento</Text>
            </TouchableOpacity>

            {(() => {
              const lista = catalogo.filter(a => a.nome.toLowerCase().includes(buscaCat.trim().toLowerCase()));
              return (
                <View style={s.diaBox}>
                  <Text style={s.diaTituloGerenciar}>{lista.length} alimento(s) na lista do app</Text>
                  {lista.length === 0 && <Text style={s.emptyTxt}>Nenhum alimento encontrado.</Text>}
                  {lista.map(a => (
                    <View key={a.id} style={s.refeicaoCard}>
                      <View style={s.refeicaoHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.refeicaoNome}>{a.nome}</Text>
                          <Text style={s.alimentoKcal}>
                            {a.kcal}kcal · C {a.carboidrato}g · P {a.proteina}g · G {a.gordura}g (por 100g)
                          </Text>
                        </View>
                        <TouchableOpacity style={{ padding: 6 }} onPress={() => abrirEdicaoAlimento(a)}>
                          <MaterialIcons name="edit" size={20} color={HD.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 6 }} onPress={() => excluirAlimentoCatalogo(a)}>
                          <MaterialIcons name="delete-outline" size={20} color={HD.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}

            <TouchableOpacity onPress={restaurarCatalogo} style={{ alignItems: 'center', padding: 12 }}>
              <Text style={{ color: HD.textLight, fontSize: 12, textDecorationLine: 'underline' }}>Restaurar lista padrão</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal novo/editar alimento */}
      <Modal visible={modalAl} animationType="slide" transparent onRequestClose={() => setModalAl(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{alEditando ? 'Editar Alimento' : 'Novo Alimento'}</Text>
              <TouchableOpacity onPress={() => setModalAl(false)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.modalLabel}>Nome</Text>
              <TextInput
                style={s.campoInput}
                value={form.nome}
                onChangeText={t => setForm(f => ({ ...f, nome: t }))}
                placeholder="Ex: Tapioca"
                placeholderTextColor="#aaa"
              />
              <Text style={s.modalInfoBase}>Informe os valores por 100g do alimento.</Text>
              {CAMPOS_NUTRI.map(c => (
                <View key={c.id} style={s.campoRow}>
                  <Text style={s.campoLabel}>{c.label} ({c.unidade})</Text>
                  <TextInput
                    style={[s.campoInput, { flex: 1, marginBottom: 0, textAlign: 'right' }]}
                    value={form[c.id]}
                    onChangeText={t => setForm(f => ({ ...f, [c.id]: t.replace(/[^0-9.,]/g, '') }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#aaa"
                  />
                </View>
              ))}
              <TouchableOpacity style={[s.modalBtn, { marginTop: 14 }]} onPress={salvarAlimentoCatalogo}>
                <Text style={s.modalBtnTxt}>Salvar</Text>
              </TouchableOpacity>
              <View style={{ height: 12 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Botão Finalizar */}
      {aba === 'criar' && (
        <View style={s.footer}>
          <TouchableOpacity style={s.finalizarBtn} onPress={finalizarDieta}>
            <Text style={s.finalizarTxt}>Finalizar Dieta</Text>
            <View style={s.checkCircle}>
              <MaterialIcons name="check" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal de quantidade / macros / micros do alimento ── */}
      <Modal
        visible={showModalAlimento}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModalAlimento(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{modalAlimento?.nome}</Text>
              <TouchableOpacity onPress={() => setShowModalAlimento(false)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>

            {modalAlimento && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Quantidade em gramas */}
                <Text style={s.modalLabel}>Quantidade</Text>
                <View style={s.qtdRow}>
                  <TouchableOpacity style={s.qtdBtn} onPress={() => ajustarQuantidade(-10)}>
                    <MaterialIcons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TextInput
                    style={s.qtdInput}
                    keyboardType="numeric"
                    value={quantidadeModal}
                    onChangeText={t => setQuantidadeModal(t.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={s.qtdG}>g</Text>
                  <TouchableOpacity style={s.qtdBtn} onPress={() => ajustarQuantidade(10)}>
                    <MaterialIcons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Macronutrientes */}
                <Text style={s.modalLabel}>Macronutrientes</Text>
                <View style={s.macroRow}>
                  <View style={[s.macroCard, { backgroundColor: HD.kcal + '22' }]}>
                    <Text style={[s.macroValor, { color: HD.kcal }]}>{valorProporcional(modalAlimento.kcal)}</Text>
                    <Text style={s.macroLabel}>Kcal</Text>
                  </View>
                  <View style={[s.macroCard, { backgroundColor: HD.carbo + '22' }]}>
                    <Text style={[s.macroValor, { color: HD.carbo }]}>{valorProporcional(modalAlimento.carboidrato)}g</Text>
                    <Text style={s.macroLabel}>Carboidratos</Text>
                  </View>
                  <View style={[s.macroCard, { backgroundColor: HD.protein + '22' }]}>
                    <Text style={[s.macroValor, { color: HD.protein }]}>{valorProporcional(modalAlimento.proteina)}g</Text>
                    <Text style={s.macroLabel}>Proteínas</Text>
                  </View>
                  <View style={[s.macroCard, { backgroundColor: HD.fat + '22' }]}>
                    <Text style={[s.macroValor, { color: HD.fat }]}>{valorProporcional(modalAlimento.gordura)}g</Text>
                    <Text style={s.macroLabel}>Gorduras</Text>
                  </View>
                </View>

                {/* Micronutrientes */}
                <Text style={s.modalLabel}>Micronutrientes</Text>
                <View style={s.microBox}>
                  <View style={s.microRow}>
                    <Text style={s.microNome}>Fibras</Text>
                    <Text style={s.microValor}>{valorProporcional(modalAlimento.fibra)}g</Text>
                  </View>
                  <View style={s.microRow}>
                    <Text style={s.microNome}>Sódio</Text>
                    <Text style={s.microValor}>{valorProporcional(modalAlimento.sodio)}mg</Text>
                  </View>
                  <View style={s.microRow}>
                    <Text style={s.microNome}>Cálcio</Text>
                    <Text style={s.microValor}>{valorProporcional(modalAlimento.calcio)}mg</Text>
                  </View>
                  <View style={[s.microRow, { borderBottomWidth: 0 }]}>
                    <Text style={s.microNome}>Ferro</Text>
                    <Text style={s.microValor}>{valorProporcional(modalAlimento.ferro)}mg</Text>
                  </View>
                </View>

                <Text style={s.modalInfoBase}>
                  *Valores calculados para {quantidadeModal || 0}g (referência: {modalAlimento.kcal}kcal por 100g)
                </Text>

                <TouchableOpacity style={s.modalBtn} onPress={confirmarAlimento}>
                  <Text style={s.modalBtnTxt}>{jaSelecionado ? 'Atualizar Quantidade' : 'Adicionar à Dieta'}</Text>
                  <View style={s.checkCircle}>
                    <MaterialIcons name="check" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>

                {jaSelecionado && (
                  <TouchableOpacity
                    style={s.modalRemoverBtn}
                    onPress={() => { removerAlimentoSelecionado(modalAlimento.id); setShowModalAlimento(false); }}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                    <Text style={s.modalRemoverTxt}>Remover da dieta</Text>
                  </TouchableOpacity>
                )}

                <View style={{ height: 12 }} />
              </ScrollView>
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
  buscaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  buscaInput: { flex: 1, fontSize: 14, color: temaDark ? '#ddd' : '#333' },
  alimentoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: temaDark ? '#333' : '#eee' },
  alimentoSelecionado: { backgroundColor: temaDark ? '#1a3a35' : '#e0faf5', borderRadius: 8, paddingHorizontal: 8 },
  alimentoNome: { fontSize: 15, color: temaDark ? '#eee' : '#222', fontWeight: '500' },
  alimentoKcal: { fontSize: 12, color: '#999', marginTop: 2 },
  selecionadosBox: { backgroundColor: temaDark ? '#1a3a35' : '#e0faf5', borderRadius: 12, padding: 12, marginTop: 8 },
  selecionadosTitle: { color: HD.primary, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  selecionadoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: temaDark ? '#22403a' : '#fff', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 6 },
  selecionadoNome: { fontSize: 13, fontWeight: '600', color: temaDark ? '#eee' : '#222' },
  selecionadoInfo: { fontSize: 12, color: temaDark ? '#aaa' : '#777', marginTop: 2 },
  selecionadoAcao: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4 },
  footer: { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 8 },
  finalizarBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  finalizarTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  abasRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, padding: 4 },
  abaBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  abaBtnAtivo: { backgroundColor: HD.primary },
  abaTxt: { fontSize: 14, fontWeight: '600', color: temaDark ? '#aaa' : '#666' },
  abaTxtAtivo: { color: '#fff' },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyTxt: { color: temaDark ? '#aaa' : '#888', fontSize: 14, textAlign: 'center' },
  diaBox: { backgroundColor: temaDark ? '#2a2a2a' : '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  campoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  campoLabel: { width: 130, fontSize: 13, color: temaDark ? '#ccc' : '#555' },
  campoInput: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: temaDark ? '#eee' : '#222', marginBottom: 6 },
  extraTag: { fontSize: 10, color: HD.secondary, fontWeight: '700' },
  diaTituloGerenciar: { fontSize: 14, fontWeight: '700', color: HD.primary, marginBottom: 10 },
  refeicaoCard: { backgroundColor: temaDark ? '#333' : '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 8 },
  refeicaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  refeicaoNome: { fontSize: 13, fontWeight: '700', color: temaDark ? '#eee' : '#333' },
  alimentoSalvoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  alimentoSalvoNome: { fontSize: 13, color: temaDark ? '#ccc' : '#555' },
  alimentoSalvoKcal: { fontSize: 12, color: HD.primary, fontWeight: '600' },

  // ── Modal alimento (quantidade / macros / micros) ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: temaDark ? '#222' : '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: temaDark ? '#eee' : '#222', flex: 1, marginRight: 12 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: temaDark ? '#ccc' : '#333', marginBottom: 8, marginTop: 4 },
  modalInfoBase: { fontSize: 11, color: temaDark ? '#888' : '#999', marginTop: 10, marginBottom: 18, fontStyle: 'italic' },

  qtdRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  qtdBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: HD.primary, justifyContent: 'center', alignItems: 'center' },
  qtdInput: {
    flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700',
    color: temaDark ? '#fff' : HD.textDark, backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5',
    borderRadius: 12, marginHorizontal: 10, paddingVertical: 8,
  },
  qtdG: { fontSize: 15, fontWeight: '600', color: temaDark ? '#aaa' : '#777', marginRight: 10 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 18 },
  macroCard: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  macroValor: { fontSize: 15, fontWeight: '700' },
  macroLabel: { fontSize: 10, color: temaDark ? '#bbb' : '#666', marginTop: 4, textAlign: 'center' },

  microBox: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 14, paddingHorizontal: 14 },
  microRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: temaDark ? '#3a3a3a' : '#e8e8e8' },
  microNome: { fontSize: 13, color: temaDark ? '#ccc' : '#555' },
  microValor: { fontSize: 13, fontWeight: '700', color: temaDark ? '#eee' : '#333' },

  modalBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  modalBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalRemoverBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14 },
  modalRemoverTxt: { color: HD.accent, fontSize: 13, fontWeight: '600' },
});
