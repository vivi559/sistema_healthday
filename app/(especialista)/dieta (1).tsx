import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert, StatusBar, Modal,
} from 'react-native';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import LogoHealthDay from '@/components/LogoHealthDay';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const REFEICOES = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Janta', 'Outros'];

// Valores nutricionais de referência por 100g de alimento
const ALIMENTOS_BASE = [
  { id: '1', nome: 'Uva Verde sem semente', kcal: 69, carboidrato: 18, proteina: 0.6, gordura: 0.2, fibra: 0.9, sodio: 2, calcio: 10, ferro: 0.3 },
  { id: '2', nome: 'Banana Prata', kcal: 89, carboidrato: 22.8, proteina: 1.1, gordura: 0.3, fibra: 2.6, sodio: 1, calcio: 5, ferro: 0.3 },
  { id: '3', nome: 'Maçã Gala', kcal: 52, carboidrato: 14, proteina: 0.3, gordura: 0.2, fibra: 2.4, sodio: 1, calcio: 6, ferro: 0.1 },
  { id: '4', nome: 'Pera Williams', kcal: 57, carboidrato: 15, proteina: 0.4, gordura: 0.1, fibra: 3.1, sodio: 1, calcio: 9, ferro: 0.2 },
  { id: '5', nome: 'Laranja-Pera', kcal: 47, carboidrato: 11.8, proteina: 0.9, gordura: 0.1, fibra: 2.4, sodio: 0, calcio: 40, ferro: 0.1 },
  { id: '6', nome: 'Batata Inglesa Cozida', kcal: 87, carboidrato: 20.1, proteina: 1.9, gordura: 0.1, fibra: 1.8, sodio: 4, calcio: 5, ferro: 0.3 },
  { id: '7', nome: 'Peito de Frango Grelhado', kcal: 165, carboidrato: 0, proteina: 31, gordura: 3.6, fibra: 0, sodio: 74, calcio: 15, ferro: 1 },
  { id: '8', nome: 'Arroz Branco', kcal: 130, carboidrato: 28.2, proteina: 2.7, gordura: 0.3, fibra: 0.4, sodio: 1, calcio: 10, ferro: 0.2 },
  { id: '9', nome: 'Feijão Cozido', kcal: 76, carboidrato: 13.6, proteina: 4.8, gordura: 0.5, fibra: 8.7, sodio: 2, calcio: 27, ferro: 1.5 },
  { id: '10', nome: 'Ovo Cozido', kcal: 155, carboidrato: 1.1, proteina: 13, gordura: 11, fibra: 0, sodio: 124, calcio: 50, ferro: 1.2 },
  { id: '11', nome: 'Aveia em Flocos', kcal: 389, carboidrato: 66.3, proteina: 16.9, gordura: 6.9, fibra: 10.6, sodio: 2, calcio: 54, ferro: 4.7 },
  { id: '12', nome: 'Iogurte Natural', kcal: 61, carboidrato: 4.7, proteina: 3.5, gordura: 3.3, fibra: 0, sodio: 46, calcio: 121, ferro: 0.1 },
  { id: '13', nome: 'Salmão Grelhado', kcal: 208, carboidrato: 0, proteina: 20, gordura: 13, fibra: 0, sodio: 59, calcio: 9, ferro: 0.3 },
  { id: '14', nome: 'Brócolis Cozido', kcal: 35, carboidrato: 7.2, proteina: 2.4, gordura: 0.4, fibra: 3.3, sodio: 41, calcio: 40, ferro: 0.7 },
  { id: '15', nome: 'Batata Doce', kcal: 86, carboidrato: 20.1, proteina: 1.6, gordura: 0.1, fibra: 3, sodio: 55, calcio: 30, ferro: 0.6 },
];

export default function EspecialistaDieta() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [diaSelecionado, setDiaSelecionado] = useState('Seg');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [showAlunos, setShowAlunos] = useState(false);
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState('');
  const [showRefeicoes, setShowRefeicoes] = useState(false);
  const [busca, setBusca] = useState('');
  const [alimentosSelecionados, setAlimentosSelecionados] = useState<any[]>([]);
  const [aba, setAba] = useState<'criar' | 'gerenciar'>('criar');
  const [dietasSalvas, setDietasSalvas] = useState<any>({});

  // ── Modal de quantidade / macros / micros ──
  const [modalAlimento, setModalAlimento] = useState<any>(null);
  const [showModalAlimento, setShowModalAlimento] = useState(false);
  const [quantidadeModal, setQuantidadeModal] = useState('100');

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
    if (alunoSelecionado) carregarDietasSalvas(alunoSelecionado.id);
  }, [alunoSelecionado, aba]);

  const carregarDietasSalvas = async (alunoId: string) => {
    try {
      const chave = `@dieta_especialista_${alunoId}`;
      const existente = await AsyncStorage.getItem(chave);
      setDietasSalvas(existente ? JSON.parse(existente) : {});
    } catch {
      setDietasSalvas({});
    }
  };

  const removerRefeicaoSalva = async (dia: string, refeicao: string) => {
    if (!alunoSelecionado) return;
    Alert.alert('Remover', `Remover "${refeicao}" de ${dia}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          const chave = `@dieta_especialista_${alunoSelecionado.id}`;
          const novas = { ...dietasSalvas };
          if (novas[dia]) {
            delete novas[dia][refeicao];
            if (Object.keys(novas[dia]).length === 0) delete novas[dia];
          }
          await AsyncStorage.setItem(chave, JSON.stringify(novas));
          setDietasSalvas({ ...novas });
        },
      },
    ]);
  };

  const carregarAlunos = async () => {
    try {
      const dados = await AsyncStorage.getItem('@usuarios');
      if (dados) {
        const todos = JSON.parse(dados);
        setAlunos(todos.filter((u: any) => u.tipo === 'usuario'));
      } else {
        setAlunos([
          { id: '001', nome: 'Jonas Duzzo', tipo: 'usuario' },
          { id: '002', nome: 'Maria Silva', tipo: 'usuario' },
          { id: '003', nome: 'Pedro Santos', tipo: 'usuario' },
        ]);
      }
    } catch {
      setAlunos([
        { id: '001', nome: 'Jonas Duzzo', tipo: 'usuario' },
        { id: '002', nome: 'Maria Silva', tipo: 'usuario' },
        { id: '003', nome: 'Pedro Santos', tipo: 'usuario' },
      ]);
    }
  };

  const alimentosFiltrados = ALIMENTOS_BASE.filter(a =>
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

  const finalizarDieta = async () => {
    if (!alunoSelecionado) return Alert.alert('Atenção', 'Selecione um aluno!');
    if (!refeicaoSelecionada) return Alert.alert('Atenção', 'Selecione a refeição!');
    if (alimentosSelecionados.length === 0) return Alert.alert('Atenção', 'Adicione pelo menos um alimento!');

    try {
      const chave = `@dieta_especialista_${alunoSelecionado.id}`;
      const existente = await AsyncStorage.getItem(chave);
      const dieta = existente ? JSON.parse(existente) : {};

      if (!dieta[diaSelecionado]) dieta[diaSelecionado] = {};
      dieta[diaSelecionado][refeicaoSelecionada] = alimentosSelecionados;

      await AsyncStorage.setItem(chave, JSON.stringify(dieta));
      Alert.alert('Dieta salva!', `Dieta de ${refeicaoSelecionada} salva para ${alunoSelecionado.nome} na ${diaSelecionado}.`);
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

      {/* Header */}
      <View style={s.header}>
        <MaterialIcons name="notifications-none" size={24} color={HD.primary} />
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Especialista</Text>
          <LogoHealthDay size={28} />
        </View>
        <MaterialIcons name="menu" size={26} color={HD.primary} />
      </View>

      {/* Abas */}
      <View style={s.abasRow}>
        <TouchableOpacity style={[s.abaBtn, aba === 'criar' && s.abaBtnAtivo]} onPress={() => setAba('criar')}>
          <Text style={[s.abaTxt, aba === 'criar' && s.abaTxtAtivo]}>Criar Dieta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.abaBtn, aba === 'gerenciar' && s.abaBtnAtivo]} onPress={() => setAba('gerenciar')}>
          <Text style={[s.abaTxt, aba === 'gerenciar' && s.abaTxtAtivo]}>Gerenciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {aba === 'criar' && (
        <View>
        {/* Dias da semana */}
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

        {/* Dropdown Aluno */}
        <TouchableOpacity style={s.dropdown} onPress={() => { setShowAlunos(!showAlunos); setShowRefeicoes(false); }}>
          <Text style={s.dropdownTxt}>{alunoSelecionado ? `ID:${alunoSelecionado.id} - ${alunoSelecionado.nome}` : 'Selecione o aluno'}</Text>
          <MaterialIcons name={showAlunos ? 'expand-less' : 'expand-more'} size={22} color={temaDark ? '#ccc' : '#555'} />
        </TouchableOpacity>
        {showAlunos && (
          <View style={s.dropdownList}>
            {alunos.map(a => (
              <TouchableOpacity key={a.id} style={s.dropdownItem} onPress={() => { setAlunoSelecionado(a); setShowAlunos(false); }}>
                <Text style={s.dropdownItemTxt}>ID:{a.id}_{a.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
          <View>
            {!alunoSelecionado ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Selecione um aluno acima para ver as dietas.</Text>
              </View>
            ) : Object.keys(dietasSalvas).length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Nenhuma dieta cadastrada para {alunoSelecionado.nome}.</Text>
              </View>
            ) : (
              DIAS.filter(d => dietasSalvas[d] && Object.keys(dietasSalvas[d]).length > 0).map(dia => (
                <View key={dia} style={s.diaBox}>
                  <Text style={s.diaTituloGerenciar}>{dia}</Text>
                  {Object.entries(dietasSalvas[dia]).map(([refeicao, alimentos]: [string, any]) => (
                    <View key={refeicao} style={s.refeicaoCard}>
                      <View style={s.refeicaoHeader}>
                        <Text style={s.refeicaoNome}>{refeicao}</Text>
                        <TouchableOpacity onPress={() => removerRefeicaoSalva(dia, refeicao)}>
                          <MaterialIcons name="delete-outline" size={20} color={HD.accent} />
                        </TouchableOpacity>
                      </View>
                      {alimentos.map((al: any) => (
                        <View key={al.id} style={s.alimentoSalvoRow}>
                          <Text style={s.alimentoSalvoNome}>• {al.nome} ({al.quantidade ?? 100}g)</Text>
                          <Text style={s.alimentoSalvoKcal}>{Math.round((al.kcal * (al.quantidade ?? 100)) / 100)}kcal</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão Finalizar */}
      <View style={s.footer}>
        <TouchableOpacity style={s.finalizarBtn} onPress={finalizarDieta}>
          <Text style={s.finalizarTxt}>Finalizar Dieta</Text>
          <View style={s.checkCircle}>
            <MaterialIcons name="check" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

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
