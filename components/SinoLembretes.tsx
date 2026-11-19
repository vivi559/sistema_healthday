/**
 * components/SinoLembretes.tsx
 * Sino do cabeçalho das telas do usuário.
 *
 * Mostra quantos lembretes da Agenda acontecem nos próximos 7 dias (a bolinha
 * só aparece quando há algum) e, ao tocar, abre a lista desses lembretes
 * agrupados por dia, com atalho para a Agenda.
 *
 * Uso: troque o botão do sino no cabeçalho por <SinoLembretes />.
 * Quando a Agenda criar ou remover um lembrete, ela chama lembretesMudaram()
 * para o sino se atualizar na hora.
 */

import { BotaoSecundario, Folha, Vazio, useCores } from '@/components/EspecialistaUI';
import { getLembretes, getUserAtual, type Lembrete } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DIAS_A_FRENTE = 7;
const DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Avisa os sinos abertos que os lembretes mudaram (chamado pela Agenda)
const ouvintes = new Set<() => void>();
export function lembretesMudaram() {
  ouvintes.forEach(ouvinte => ouvinte());
}

/** Data e hora do lembrete. Lembretes com data inválida voltam null. */
function quando(l: Lembrete): Date | null {
  const d = new Date(`${l.data}T${l.hora || '00:00'}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function rotuloDia(d: Date, agora: Date) {
  const amanha = new Date(agora);
  amanha.setDate(agora.getDate() + 1);
  if (mesmoDia(d, agora)) return 'Hoje';
  if (mesmoDia(d, amanha)) return 'Amanhã';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${DIA_SEMANA[d.getDay()]}, ${dd}/${mm}`;
}

/** Lembretes de agora até daqui a 7 dias, do mais próximo para o mais distante. */
function proximos(lembretes: Lembrete[], agora: Date) {
  const limite = new Date(agora.getTime() + DIAS_A_FRENTE * 24 * 60 * 60 * 1000);
  return lembretes
    .map(l => ({ lembrete: l, data: quando(l) }))
    .filter((x): x is { lembrete: Lembrete; data: Date } => !!x.data && x.data >= agora && x.data <= limite)
    .sort((a, b) => a.data.getTime() - b.data.getTime());
}

export default function SinoLembretes() {
  const c = useCores();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [agora, setAgora] = useState(() => new Date());
  const [aberto, setAberto] = useState(false);

  const carregar = useCallback(async () => {
    const user = await getUserAtual();
    setLembretes(user ? await getLembretes(user.id) : []);
    setAgora(new Date());
  }, []);

  // Recarrega ao entrar na tela e quando a Agenda avisar que algo mudou
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  useEffect(() => {
    ouvintes.add(carregar);
    return () => { ouvintes.delete(carregar); };
  }, [carregar]);

  // Lembretes que já passaram saem da contagem com o tempo
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const lista = proximos(lembretes, agora);
  const total = lista.length;

  // Agrupa por dia para a lista ficar fácil de ler
  const grupos: { dia: string; itens: typeof lista }[] = [];
  lista.forEach(item => {
    const dia = rotuloDia(item.data, agora);
    const grupo = grupos[grupos.length - 1];
    if (grupo?.dia === dia) grupo.itens.push(item);
    else grupos.push({ dia, itens: [item] });
  });

  function abrirAgenda() {
    setAberto(false);
    router.navigate('/(usuario)/agenda');
  }

  return (
    <>
      <TouchableOpacity
        style={s.botao}
        onPress={() => { carregar(); setAberto(true); }}
        accessibilityLabel={total > 0 ? `Lembretes: ${total} nos próximos ${DIAS_A_FRENTE} dias` : 'Lembretes'}
      >
        <MaterialIcons name={total > 0 ? 'notifications' : 'notifications-none'} size={24} color={HD.primary} />
        {total > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{total > 9 ? '9+' : total}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Folha visivel={aberto} titulo="Próximos lembretes" onFechar={() => setAberto(false)}>
        {total === 0 ? (
          <Vazio
            icone="notifications-none"
            texto={`Nenhum lembrete nos próximos ${DIAS_A_FRENTE} dias. Crie lembretes na Agenda para ser avisado aqui.`}
          />
        ) : (
          grupos.map(grupo => (
            <View key={grupo.dia}>
              <Text style={[s.dia, { color: grupo.dia === 'Hoje' ? HD.accent : c.subtexto }]}>{grupo.dia}</Text>
              {grupo.itens.map(({ lembrete }) => (
                <View key={lembrete.id} style={[s.item, { backgroundColor: c.card }]}>
                  <View style={s.hora}>
                    <MaterialIcons name="schedule" size={16} color={HD.primary} />
                    <Text style={s.horaTxt}>{lembrete.hora}</Text>
                  </View>
                  <Text style={[s.texto, { color: c.texto }]}>{lembrete.texto}</Text>
                </View>
              ))}
            </View>
          ))
        )}
        <BotaoSecundario
          texto={total === 0 ? 'Criar lembrete na Agenda' : 'Abrir agenda'}
          icone="event"
          onPress={abrirAgenda}
        />
      </Folha>
    </>
  );
}

const s = StyleSheet.create({
  botao: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 2, right: 0, minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 3, backgroundColor: HD.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { color: HD.white, fontSize: 9, fontWeight: '700' },

  dia: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12, marginBottom: 8 },
  hora: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 64 },
  horaTxt: { fontSize: 14, fontWeight: '800', color: HD.primary },
  texto: { flex: 1, fontSize: 14, lineHeight: 20 },
});
