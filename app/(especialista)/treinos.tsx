import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, StatusBar,
} from 'react-native';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import LogoHealthDay from '@/components/LogoHealthDay';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

const EXERCICIOS = [
  { id: 'e1', nome: 'Leg Press', grupo: 'Inferior' },
  { id: 'e2', nome: 'Agachamento', grupo: 'Inferior' },
  { id: 'e3', nome: 'Cadeira Extensora', grupo: 'Inferior' },
  { id: 'e4', nome: 'Stiff', grupo: 'Inferior' },
  { id: 'e5', nome: 'Supino Reto', grupo: 'Peito' },
  { id: 'e6', nome: 'Supino Inclinado', grupo: 'Peito' },
  { id: 'e7', nome: 'Crucifixo', grupo: 'Peito' },
  { id: 'e8', nome: 'Puxada Frontal', grupo: 'Costas' },
  { id: 'e9', nome: 'Remada Curvada', grupo: 'Costas' },
  { id: 'e10', nome: 'Rosca Direta', grupo: 'Bíceps' },
  { id: 'e11', nome: 'Rosca Martelo', grupo: 'Bíceps' },
  { id: 'e12', nome: 'Tríceps Corda', grupo: 'Tríceps' },
  { id: 'e13', nome: 'Desenvolvimento', grupo: 'Ombro' },
  { id: 'e14', nome: 'Elevação Lateral', grupo: 'Ombro' },
  { id: 'e15', nome: 'Prancha', grupo: 'Abdômen' },
];

const SERIES_OPTS = ['2', '3', '4', '5', '6'];
const REPS_OPTS = ['8', '10', '12', '15', '20'];
const INTERVALO_OPTS = ['30s', '45s', '1 Min', '1.5 Min', '2 Min', '3 Min'];

export default function EspecialistaTreinos() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [diaSelecionado, setDiaSelecionado] = useState('Seg');
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [showAlunos, setShowAlunos] = useState(false);

  const [exercicioSelecionado, setExercicioSelecionado] = useState<any>(null);
  const [showExercicios, setShowExercicios] = useState(false);

  const [series, setSeries] = useState('');
  const [showSeries, setShowSeries] = useState(false);

  const [reps, setReps] = useState('');
  const [showReps, setShowReps] = useState(false);

  const [intervalo, setIntervalo] = useState('');
  const [showIntervalo, setShowIntervalo] = useState(false);

  const [exerciciosAdicionados, setExerciciosAdicionados] = useState<any[]>([]);

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      const dados = await AsyncStorage.getItem('@usuarios');
      if (dados) {
        const todos = JSON.parse(dados);
        setAlunos(todos.filter((u: any) => u.tipo === 'usuario'));
      } else {
        setAlunos([
          { id: '003', nome: 'Jonas Duzzo' },
          { id: '004', nome: 'Maria Silva' },
          { id: '005', nome: 'Pedro Santos' },
        ]);
      }
    } catch {
      setAlunos([
        { id: '003', nome: 'Jonas Duzzo' },
        { id: '004', nome: 'Maria Silva' },
        { id: '005', nome: 'Pedro Santos' },
      ]);
    }
  };

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

    setExerciciosAdicionados(prev => [...prev, {
      id: Date.now().toString(),
      exercicio: exercicioSelecionado,
      series, reps, intervalo,
    }]);
    setExercicioSelecionado(null);
    setSeries('');
    setReps('');
    setIntervalo('');
  };

  const removerExercicio = (id: string) => {
    setExerciciosAdicionados(prev => prev.filter(e => e.id !== id));
  };

  const concluirTreino = async () => {
    if (!alunoSelecionado) return Alert.alert('Atenção', 'Selecione um aluno!');
    if (exerciciosAdicionados.length === 0) return Alert.alert('Atenção', 'Adicione pelo menos um exercício!');

    try {
      const chave = `@treino_especialista_${alunoSelecionado.id}`;
      const existente = await AsyncStorage.getItem(chave);
      const treinos = existente ? JSON.parse(existente) : {};

      if (!treinos[diaSelecionado]) treinos[diaSelecionado] = [];
      treinos[diaSelecionado] = [...treinos[diaSelecionado], ...exerciciosAdicionados];

      await AsyncStorage.setItem(chave, JSON.stringify(treinos));
      Alert.alert('✅ Treino salvo!', `Treino de ${diaSelecionado} salvo para ${alunoSelecionado.nome}!`);
      setExerciciosAdicionados([]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o treino.');
    }
  };

  const DropdownSimples = ({
    label, valor, show, onToggle, opcoes, onSelect,
  }: { label: string; valor: string; show: boolean; onToggle: () => void; opcoes: string[]; onSelect: (v: string) => void }) => (
    <>
      <TouchableOpacity style={s.dropdown} onPress={onToggle}>
        <Text style={s.dropdownTxt}>{valor || label}</Text>
        <Ionicons name={show ? 'chevron-up' : 'chevron-down'} size={20} color={temaDark ? '#ccc' : '#555'} />
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

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      <View style={s.header}>
        <Ionicons name="notifications-outline" size={24} color={HD.accent} />
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Especialista</Text>
          <LogoHealthDay size={28} />
        </View>
        <Ionicons name="menu-outline" size={28} color={HD.primary} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Dias */}
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
        <TouchableOpacity style={s.dropdown} onPress={() => { fecharTodos(); setShowAlunos(!showAlunos); }}>
          <Text style={s.dropdownTxt}>{alunoSelecionado ? `ID:${alunoSelecionado.id}_${alunoSelecionado.nome}` : 'Selecione o aluno'}</Text>
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

        {/* Exercício */}
        <TouchableOpacity style={s.dropdown} onPress={() => { fecharTodos(); setShowExercicios(!showExercicios); }}>
          <Text style={s.dropdownTxt}>{exercicioSelecionado ? exercicioSelecionado.nome : 'Selecione o exercicio'}</Text>
          <Ionicons name={showExercicios ? 'chevron-up' : 'chevron-down'} size={20} color={temaDark ? '#ccc' : '#555'} />
        </TouchableOpacity>
        {showExercicios && (
          <View style={s.dropdownList}>
            {EXERCICIOS.map(e => (
              <TouchableOpacity key={e.id} style={s.dropdownItem} onPress={() => { setExercicioSelecionado(e); setShowExercicios(false); }}>
                <Text style={s.dropdownItemTxt}>{e.nome}</Text>
                <Text style={s.dropdownItemSub}>{e.grupo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Intervalo */}
        <DropdownSimples
          label="Intervalo" valor={intervalo} show={showIntervalo}
          onToggle={() => { fecharTodos(); setShowIntervalo(!showIntervalo); }}
          opcoes={INTERVALO_OPTS} onSelect={v => { setIntervalo(v); setShowIntervalo(false); }}
        />

        {/* Séries */}
        <DropdownSimples
          label="Series" valor={series ? `${series} Séries` : ''} show={showSeries}
          onToggle={() => { fecharTodos(); setShowSeries(!showSeries); }}
          opcoes={SERIES_OPTS} onSelect={v => { setSeries(v); setShowSeries(false); }}
        />

        {/* Repetições */}
        <DropdownSimples
          label="Repetições" valor={reps ? `${reps} Reps` : ''} show={showReps}
          onToggle={() => { fecharTodos(); setShowReps(!showReps); }}
          opcoes={REPS_OPTS} onSelect={v => { setReps(v); setShowReps(false); }}
        />

        {/* Botão adicionar exercício */}
        <TouchableOpacity style={s.adicionarBtn} onPress={adicionarExercicio}>
          <Ionicons name="add-circle-outline" size={20} color={HD.primary} />
          <Text style={s.adicionarTxt}>Adicionar Exercício à Lista</Text>
        </TouchableOpacity>

        {/* Lista de exercícios adicionados */}
        {exerciciosAdicionados.length > 0 && (
          <View style={s.listaBox}>
            <Text style={s.listaTitulo}>Exercícios para {diaSelecionado}:</Text>
            {exerciciosAdicionados.map((item, idx) => (
              <View key={item.id} style={s.exercicioCard}>
                <View style={s.exercicioInfo}>
                  <Text style={s.exercicioNome}>{idx + 1}. {item.exercicio.nome}</Text>
                  <View style={s.badgesRow}>
                    <View style={s.badge}><Text style={s.badgeTxt}>Séries {item.series}</Text></View>
                    <View style={s.badge}><Text style={s.badgeTxt}>Reps {item.reps}</Text></View>
                    <View style={s.badge}><Text style={s.badgeTxt}>{item.intervalo}</Text></View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removerExercicio(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={HD.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão Concluir */}
      <View style={s.footer}>
        <TouchableOpacity style={s.concluirBtn} onPress={concluirTreino}>
          <Text style={s.concluirTxt}>Concluir Treino</Text>
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
});
