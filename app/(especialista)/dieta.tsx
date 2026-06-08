import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert, StatusBar, FlatList,
} from 'react-native';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import LogoHealthDay from '@/components/LogoHealthDay';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const REFEICOES = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Janta', 'Outros'];

const ALIMENTOS_BASE = [
  { id: '1', nome: 'Uva Verde sem semente', kcal: 70 },
  { id: '2', nome: 'Banana Prata', kcal: 90 },
  { id: '3', nome: 'Maçã Gala', kcal: 55 },
  { id: '4', nome: 'Pera Williams', kcal: 60 },
  { id: '5', nome: 'Laranja-Pera', kcal: 50 },
  { id: '6', nome: 'Batata Inglesa Cozida', kcal: 85 },
  { id: '7', nome: 'Peito de Frango Grelhado', kcal: 160 },
  { id: '8', nome: 'Arroz Branco', kcal: 130 },
  { id: '9', nome: 'Feijão Cozido', kcal: 77 },
  { id: '10', nome: 'Ovo Cozido', kcal: 155 },
  { id: '11', nome: 'Aveia em Flocos', kcal: 389 },
  { id: '12', nome: 'Iogurte Natural', kcal: 61 },
  { id: '13', nome: 'Salmão Grelhado', kcal: 208 },
  { id: '14', nome: 'Brócolis Cozido', kcal: 35 },
  { id: '15', nome: 'Batata Doce', kcal: 86 },
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
        // Mock
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

  const toggleAlimento = (alimento: any) => {
    const existe = alimentosSelecionados.find(a => a.id === alimento.id);
    if (existe) {
      setAlimentosSelecionados(prev => prev.filter(a => a.id !== alimento.id));
    } else {
      setAlimentosSelecionados(prev => [...prev, { ...alimento, quantidade: 100 }]);
    }
  };

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
      Alert.alert('✅ Dieta salva!', `Dieta de ${refeicaoSelecionada} salva para ${alunoSelecionado.nome} na ${diaSelecionado}.`);
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
        <Ionicons name="notifications-outline" size={24} color={HD.accent} />
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Especialista</Text>
          <LogoHealthDay size={28} />
        </View>
        <Ionicons name="menu-outline" size={28} color={HD.primary} />
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
          <Ionicons name={showAlunos ? 'chevron-up' : 'chevron-down'} size={20} color={temaDark ? '#ccc' : '#555'} />
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
          <Ionicons name={showRefeicoes ? 'chevron-up' : 'chevron-down'} size={20} color={temaDark ? '#ccc' : '#555'} />
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
          <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={s.buscaInput}
            placeholder="Pesquise o Alimento"
            placeholderTextColor="#aaa"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Lista de alimentos */}
        {alimentosFiltrados.map(a => {
          const selecionado = !!alimentosSelecionados.find(al => al.id === a.id);
          return (
            <TouchableOpacity key={a.id} style={[s.alimentoItem, selecionado && s.alimentoSelecionado]} onPress={() => toggleAlimento(a)}>
              <View>
                <Text style={s.alimentoNome}>{a.nome}</Text>
                <Text style={s.alimentoKcal}>{a.kcal}kcal/100g</Text>
              </View>
              <Ionicons
                name={selecionado ? 'checkmark-circle' : 'chevron-forward'}
                size={20}
                color={selecionado ? HD.primary : (temaDark ? '#888' : '#555')}
              />
            </TouchableOpacity>
          );
        })}

        {/* Selecionados */}
        {alimentosSelecionados.length > 0 && (
          <View style={s.selecionadosBox}>
            <Text style={s.selecionadosTitle}>✅ {alimentosSelecionados.length} alimento(s) selecionado(s)</Text>
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
                  <Text style={s.diaTituloGerenciar}>📅 {dia}</Text>
                  {Object.entries(dietasSalvas[dia]).map(([refeicao, alimentos]: [string, any]) => (
                    <View key={refeicao} style={s.refeicaoCard}>
                      <View style={s.refeicaoHeader}>
                        <Text style={s.refeicaoNome}>{refeicao}</Text>
                        <TouchableOpacity onPress={() => removerRefeicaoSalva(dia, refeicao)}>
                          <Ionicons name="trash-outline" size={18} color={HD.accent} />
                        </TouchableOpacity>
                      </View>
                      {alimentos.map((al: any) => (
                        <View key={al.id} style={s.alimentoSalvoRow}>
                          <Text style={s.alimentoSalvoNome}>• {al.nome}</Text>
                          <Text style={s.alimentoSalvoKcal}>{al.kcal}kcal</Text>
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
            <Ionicons name="checkmark" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
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
  selecionadosTitle: { color: HD.primary, fontWeight: '600', fontSize: 13 },
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
});
