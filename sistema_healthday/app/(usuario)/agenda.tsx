/**
 * app/(usuario)/agenda.tsx
 * Calendário com lembretes — seletor estilo alarme para hora/minuto/dia/mês/ano.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import {
  adicionarLembrete,
  getLembretes,
  getUserAtual,
  removerLembrete,
  type Lembrete,
} from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function getDiasDoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}
function getPrimeiroDia(ano: number, mes: number): number {
  return new Date(ano, mes, 1).getDay();
}

// ── WheelColumn ──────────────────────────────────────────────────────────────
function WheelColumn({
  items, selected, onSelect, label, temaDark,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  label: string;
  temaDark: boolean;
}) {
  const tema = temaDark ? darkTheme : lightTheme;
  const idx = items.indexOf(selected);
  function prev() { onSelect(items[(idx - 1 + items.length) % items.length]); }
  function next() { onSelect(items[(idx + 1) % items.length]); }
  const prevItem = items[(idx - 1 + items.length) % items.length];
  const nextItem = items[(idx + 1) % items.length];

  return (
    <View style={wStyles.col}>
      <Text style={[wStyles.colLabel, { color: tema.subtext }]}>{label}</Text>
      <View style={wStyles.drum}>
        <TouchableOpacity onPress={prev}>
          <Text style={[wStyles.itemFade, { color: tema.subtext }]}>{prevItem}</Text>
        </TouchableOpacity>
        <View style={[wStyles.selectedWrap, { backgroundColor: tema.background, borderColor: HD.primary }]}>
          <Text style={wStyles.itemSelected}>{selected}</Text>
        </View>
        <TouchableOpacity onPress={next}>
          <Text style={[wStyles.itemFade, { color: tema.subtext }]}>{nextItem}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={prev} style={wStyles.arrow}>
        <Text style={[wStyles.arrowTxt, { color: tema.subtext }]}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={next} style={wStyles.arrowBottom}>
        <Text style={[wStyles.arrowTxt, { color: tema.subtext }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const wStyles = StyleSheet.create({
  col:       { alignItems: 'center', flex: 1 },
  colLabel:  { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  drum:      { alignItems: 'center', gap: 2, paddingVertical: 4 },
  selectedWrap: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 52, alignItems: 'center', borderWidth: 1.5 },
  itemSelected: { fontSize: 22, fontWeight: '800', color: HD.primary },
  itemFade:     { fontSize: 16, paddingVertical: 4, paddingHorizontal: 8 },
  arrow:        { marginTop: 6 },
  arrowBottom:  { marginTop: 2 },
  arrowTxt:     { fontSize: 22, fontWeight: '700', transform: [{ rotate: '90deg' }] },
});

// ── Tela principal ───────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const { temaDark } = useTema();
  const tema = temaDark ? darkTheme : lightTheme;

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [userId,    setUserId]    = useState('');
  const [modalVisible,  setModalVisible]  = useState(false);
  const [textoLembrete, setTextoLembrete] = useState('');

  const HORAS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0'));
  const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2,'0'));
  const ANOS    = Array.from({ length: 10 }, (_, i) => String(hoje.getFullYear() + i));
  const getDias = (m: string, a: string) =>
    Array.from({ length: getDiasDoMes(Number(a), MESES_CURTO.indexOf(m)) }, (_, i) => String(i + 1).padStart(2,'0'));

  const [selHora, setSelHora] = useState(String(hoje.getHours()).padStart(2,'0'));
  const [selMin,  setSelMin]  = useState(String(hoje.getMinutes()).padStart(2,'0'));
  const [selDia,  setSelDia]  = useState(String(hoje.getDate()).padStart(2,'0'));
  const [selMes,  setSelMes]  = useState(MESES_CURTO[hoje.getMonth()]);
  const [selAno,  setSelAno]  = useState(String(hoje.getFullYear()));

  const diasDoMesSel = getDias(selMes, selAno);

  useEffect(() => {
    async function carregar() {
      const user = await getUserAtual();
      if (user) {
        setUserId(user.id);
        const data = await getLembretes(user.id);
        setLembretes(data);
      }
    }
    carregar();
  }, []);

  function abrirModal(dia?: number) {
    if (dia) {
      setSelDia(String(dia).padStart(2,'0'));
      setSelMes(MESES_CURTO[mes]);
      setSelAno(String(ano));
    }
    setTextoLembrete('');
    setModalVisible(true);
  }

  async function handleSalvar() {
    if (!textoLembrete.trim()) {
      Alert.alert('Atenção', 'Digite o texto do lembrete.');
      return;
    }
    const mesIdx = MESES_CURTO.indexOf(selMes) + 1;
    const dataStr = `${selAno}-${String(mesIdx).padStart(2,'0')}-${selDia}`;
    await adicionarLembrete({ usuarioId: userId, texto: textoLembrete, data: dataStr, hora: `${selHora}:${selMin}` });
    const atualizados = await getLembretes(userId);
    setLembretes(atualizados);
    setTextoLembrete('');
    setModalVisible(false);
    Alert.alert('✅ Lembrete salvo!', `${textoLembrete}\n${dataStr} às ${selHora}:${selMin}`);
  }

  async function handleRemover(id: string) {
    Alert.alert('Remover', 'Deseja remover este lembrete?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await removerLembrete(id);
          const atualizados = await getLembretes(userId);
          setLembretes(atualizados);
        },
      },
    ]);
  }

  function temLembrete(dia: number): boolean {
    const dataStr = `${ano}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return lembretes.some(l => l.data === dataStr);
  }

  function mudarMes(dir: number) {
    let nm = mes + dir, na = ano;
    if (nm < 0)  { nm = 11; na--; }
    if (nm > 11) { nm = 0;  na++; }
    setMes(nm); setAno(na);
  }

  const totalDias   = getDiasDoMes(ano, mes);
  const primeiroDia = getPrimeiroDia(ano, mes);
  const lembretesDoMes = lembretes.filter(l => {
    const [lA, lM] = l.data.split('-').map(Number);
    return lA === ano && lM === mes + 1;
  });

  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar
        barStyle={temaDark ? 'light-content' : 'dark-content'}
        backgroundColor={tema.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <LogoHealthDay size={32} />
        </View>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Botão adicionar */}
        <TouchableOpacity style={styles.btnAdicionar} onPress={() => abrirModal()} activeOpacity={0.8}>
          <Text style={styles.btnAdicionarTxt}>Adicionar Lembrete</Text>
          <View style={styles.btnAdicionarIcone}>
            <Text style={styles.btnAdicionarIconeTxt}>＋</Text>
          </View>
        </TouchableOpacity>

        {/* Navegação mês */}
        <View style={styles.mesNavRow}>
          <TouchableOpacity onPress={() => mudarMes(-1)}>
            <Text style={[styles.mesNavBtn, { color: tema.subtext }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.mesAtual, { color: tema.text }]}>{MESES[mes]} {ano}</Text>
          <TouchableOpacity onPress={() => mudarMes(1)}>
            <Text style={[styles.mesNavBtn, { color: tema.subtext }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dias da semana */}
        <View style={styles.diasSemanaRow}>
          {DIAS_SEMANA.map(d => (
            <Text key={d} style={[styles.diaSemanaLabel, { color: tema.subtext }]}>{d}</Text>
          ))}
        </View>

        {/* Grade calendário */}
        <View style={styles.grade}>
          {celulas.map((dia, idx) => {
            const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
            const marcado = dia ? temLembrete(dia) : false;
            return (
              <View key={idx} style={styles.celulaWrap}>
                {dia ? (
                  <TouchableOpacity
                    style={[styles.celula, isHoje && { backgroundColor: temaDark ? '#2a2a2a' : HD.divider }]}
                    onPress={() => abrirModal(dia)}
                  >
                    <Text style={[styles.celulaTxt, { color: tema.text }, isHoje && { fontWeight: '800' }]}>{dia}</Text>
                    {marcado && <View style={styles.pontinho} />}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.celulaVazia} />
                )}
              </View>
            );
          })}
        </View>

        {/* Lembretes do mês */}
        {lembretesDoMes.length > 0 && (
          <View style={styles.lembretesSection}>
            <Text style={[styles.lembretesTitle, { color: tema.text }]}>Lembretes de {MESES[mes]}</Text>
            {lembretesDoMes.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[styles.lembreteCard, { backgroundColor: tema.card }]}
                onLongPress={() => handleRemover(l.id)}
                activeOpacity={0.8}
              >
                <View style={styles.lembreteIcone}>
                  <Text style={{ fontSize: 16 }}>🔔</Text>
                </View>
                <View style={styles.lembreteInfo}>
                  <Text style={[styles.lembreteTxt, { color: tema.text }]}>{l.texto}</Text>
                  <Text style={[styles.lembreteData, { color: tema.subtext }]}>
                    {l.data.split('-').reverse().join('/')} às {l.hora}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemover(l.id)}>
                  <Text style={styles.removerBtn}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tema.card }]}>

            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>Novo Lembrete</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalFechar, { color: tema.subtext }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Rodas */}
            <View style={[styles.rodasContainer, { backgroundColor: temaDark ? '#1a1a1a' : HD.cardLight }]}>
              <WheelColumn label="Hora" items={HORAS}      selected={selHora} onSelect={setSelHora} temaDark={temaDark} />
              <Text style={[styles.separador, { color: HD.primary }]}>:</Text>
              <WheelColumn label="Min"  items={MINUTOS}    selected={selMin}  onSelect={setSelMin}  temaDark={temaDark} />
              <View style={[styles.separadorV, { backgroundColor: tema.border }]} />
              <WheelColumn label="Dia"  items={diasDoMesSel} selected={selDia} onSelect={setSelDia} temaDark={temaDark} />
              <WheelColumn label="Mês"  items={MESES_CURTO}  selected={selMes} onSelect={(v) => {
                setSelMes(v);
                const maxDia = getDiasDoMes(Number(selAno), MESES_CURTO.indexOf(v));
                if (Number(selDia) > maxDia) setSelDia(String(maxDia).padStart(2,'0'));
              }} temaDark={temaDark} />
              <WheelColumn label="Ano"  items={ANOS}       selected={selAno}  onSelect={setSelAno}  temaDark={temaDark} />
            </View>

            {/* Preview */}
            <View style={styles.previewRow}>
              <Text style={[styles.previewTxt, { color: tema.subtext }]}>
                📅 {selDia}/{MESES_CURTO.indexOf(selMes) + 1}/{selAno}  ⏰ {selHora}:{selMin}
              </Text>
            </View>

            {/* Input */}
            <TextInput
              style={[styles.lembreteInput, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              placeholder="Digite seu Lembrete!"
              placeholderTextColor={HD.placeholder}
              value={textoLembrete}
              onChangeText={setTextoLembrete}
              multiline
            />

            <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar} activeOpacity={0.8}>
              <Text style={styles.btnSalvarTxt}>Salvar Lembrete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  notifBtn:     { position: 'relative', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notifIcon:    { fontSize: 22 },
  notifBadge:   { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: HD.accent },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: HD.primary },
  menuBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuIcon:     { fontSize: 22, color: HD.primary },

  scrollContent: { paddingHorizontal: 20 },

  btnAdicionar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: HD.accent, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 20,
  },
  btnAdicionarTxt:      { fontSize: 16, fontWeight: '700', color: HD.white },
  btnAdicionarIcone:    { width: 32, height: 32, borderRadius: 16, backgroundColor: HD.textDark, alignItems: 'center', justifyContent: 'center' },
  btnAdicionarIconeTxt: { color: HD.white, fontSize: 20, fontWeight: '700', lineHeight: 26 },

  mesNavRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 },
  mesNavBtn:      { fontSize: 28, fontWeight: '700', paddingHorizontal: 8 },
  mesAtual:       { fontSize: 18, fontWeight: '700' },

  diasSemanaRow:  { flexDirection: 'row', marginBottom: 8 },
  diaSemanaLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },

  grade:      { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  celulaWrap: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  celula:     { width: '100%', height: '100%', borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  celulaVazia:{ width: '100%', height: '100%' },
  celulaTxt:  { fontSize: 15, fontWeight: '500' },
  pontinho:   { position: 'absolute', bottom: 4, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: HD.accent },

  lembretesSection: { marginBottom: 16 },
  lembretesTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  lembreteCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  lembreteIcone: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  lembreteInfo:  { flex: 1 },
  lembreteTxt:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  lembreteData:  { fontSize: 12 },
  removerBtn:    { fontSize: 16, color: HD.accent, fontWeight: '700', padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:  { fontSize: 18, fontWeight: '800' },
  modalFechar:  { fontSize: 20, fontWeight: '700' },

  rodasContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 16, marginBottom: 16, gap: 4 },
  separador:      { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  separadorV:     { width: 1, height: 60, marginHorizontal: 4 },

  previewRow: { alignItems: 'center', marginBottom: 14 },
  previewTxt: { fontSize: 14, fontWeight: '600' },

  lembreteInput: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 15, minHeight: 70, textAlignVertical: 'top', marginBottom: 16,
  },
  btnSalvar:    { backgroundColor: HD.accent, borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  btnSalvarTxt: { fontSize: 16, fontWeight: '700', color: HD.white },
});