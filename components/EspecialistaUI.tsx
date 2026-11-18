/**
 * components/EspecialistaUI.tsx
 * Peças visuais compartilhadas pelas telas do especialista, para que todas
 * tenham o mesmo cabeçalho, abas, seletores, campos, botões e avisos.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { DIAS, ROTULO_DIA, type Dia } from '@/constants/EspecialistaStorage';
import { getSolicitacoes, type User } from '@/constants/Storage';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

// ─── Avisos dentro do app ─────────────────────────────────────────────────────
// avisar() mostra um aviso no topo da tela, que some sozinho.
// confirmar() abre uma caixa de confirmação no meio da tela.
// Os dois aparecem no próprio app (nada de alert/confirm do navegador).
// Quem desenha é o <AvisosNaTela />: há um no _layout do especialista e um dentro
// de cada modal, porque um modal aberto cobre o resto da tela. Só o último
// <AvisosNaTela /> ativo (o que está mais "por cima") aparece.

export type TipoAviso = 'sucesso' | 'erro' | 'alerta' | 'info';

interface Aviso { id: number; titulo: string; mensagem: string; tipo: TipoAviso }
interface Confirmacao {
  titulo: string;
  mensagem: string;
  textoOk: string;
  destrutivo: boolean;
  onOk: () => void;
}
interface EstadoAvisos { aviso: Aviso | null; confirmacao: Confirmacao | null; locais: number[] }

let estadoAvisos: EstadoAvisos = { aviso: null, confirmacao: null, locais: [] };
const ouvintesAvisos = new Set<() => void>();
let proximoAviso = 1;
let proximoLocal = 1;
let timerAviso: ReturnType<typeof setTimeout> | undefined;

function mudarAvisos(parcial: Partial<EstadoAvisos>) {
  estadoAvisos = { ...estadoAvisos, ...parcial };
  ouvintesAvisos.forEach(ouvinte => ouvinte());
}

function ouvirAvisos(ouvinte: () => void) {
  ouvintesAvisos.add(ouvinte);
  return () => { ouvintesAvisos.delete(ouvinte); };
}

const lerAvisos = () => estadoAvisos;

/** Descobre a cor do aviso pelo título usado nas telas ("Atenção", "Erro", "Treino salvo!"...). */
function tipoPeloTitulo(titulo: string): TipoAviso {
  const t = titulo.trim().toLowerCase();
  if (t.startsWith('erro')) return 'erro';
  if (t.startsWith('atenção') || t.startsWith('atencao')) return 'alerta';
  if (t.endsWith('!') || /salv|atualiz|cadastr|conclu/.test(t)) return 'sucesso';
  return 'info';
}

function fecharAviso(id?: number) {
  if (!estadoAvisos.aviso) return;
  if (id !== undefined && estadoAvisos.aviso.id !== id) return;
  mudarAvisos({ aviso: null });
}

export function avisar(titulo: string, mensagem: string, tipo: TipoAviso = tipoPeloTitulo(titulo)) {
  const id = proximoAviso++;
  mudarAvisos({ aviso: { id, titulo, mensagem, tipo } });
  if (timerAviso) clearTimeout(timerAviso);
  // Mensagens maiores ficam mais tempo na tela (entre 2,5s e 6s)
  const duracao = Math.min(6000, 2500 + mensagem.length * 40);
  timerAviso = setTimeout(() => fecharAviso(id), duracao);
}

export function confirmar(
  titulo: string,
  mensagem: string,
  onOk: () => void,
  textoOk = 'Confirmar',
  destrutivo = true,
) {
  mudarAvisos({ confirmacao: { titulo, mensagem, textoOk, destrutivo, onOk } });
}

const ESTILO_AVISO: Record<TipoAviso, { cor: string; icone: IconName }> = {
  sucesso: { cor: HD.primaryDark, icone: 'check-circle' },
  erro:    { cor: HD.accent,      icone: 'error' },
  alerta:  { cor: HD.secondary,   icone: 'warning' },
  info:    { cor: '#3B82F6',      icone: 'info' },
};

/**
 * Desenha os avisos e confirmações. Coloque um no layout e um dentro de cada modal,
 * passando `ativo={visivel}` para o do modal.
 */
export function AvisosNaTela({ ativo = true }: { ativo?: boolean }) {
  const c = useCores();
  const insets = useSafeAreaInsets();
  const [idLocal] = useState(() => proximoLocal++);
  const estado = useSyncExternalStore(ouvirAvisos, lerAvisos, lerAvisos);

  // Entra na fila enquanto estiver ativo; o último da fila é quem mostra os avisos
  useLayoutEffect(() => {
    if (!ativo) return;
    mudarAvisos({ locais: [...estadoAvisos.locais, idLocal] });
    return () => mudarAvisos({ locais: estadoAvisos.locais.filter(l => l !== idLocal) });
  }, [ativo, idLocal]);

  const noTopo = ativo && estado.locais[estado.locais.length - 1] === idLocal;
  const { aviso, confirmacao } = estado;

  // Botão "voltar" do Android fecha a confirmação em vez de sair da tela
  useEffect(() => {
    if (!noTopo || !confirmacao) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      mudarAvisos({ confirmacao: null });
      return true;
    });
    return () => sub.remove();
  }, [noTopo, confirmacao]);

  if (!noTopo || (!aviso && !confirmacao)) return null;

  function responder(ok: boolean) {
    const atual = estadoAvisos.confirmacao;
    mudarAvisos({ confirmacao: null });
    if (ok) atual?.onOk();
  }

  return (
    <View style={[StyleSheet.absoluteFill, estilosAviso.camada]}>
      {confirmacao && (
        <View style={estilosAviso.dialogoFundo}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => responder(false)}
            accessibilityLabel="Cancelar"
          />
          <View
            style={[estilosAviso.dialogo, { backgroundColor: c.folha }]}
            accessibilityRole="alert"
          >
            <View style={[
              estilosAviso.dialogoIcone,
              { backgroundColor: (confirmacao.destrutivo ? HD.accent : HD.primary) + '22' },
            ]}>
              <MaterialIcons
                name={confirmacao.textoOk === 'Sair' ? 'logout' : confirmacao.destrutivo ? 'delete-outline' : 'help-outline'}
                size={26}
                color={confirmacao.destrutivo ? HD.accent : HD.primaryDark}
              />
            </View>
            <Text style={[estilosAviso.dialogoTitulo, { color: c.texto }]}>{confirmacao.titulo}</Text>
            <Text style={[estilosAviso.dialogoMensagem, { color: c.subtexto }]}>{confirmacao.mensagem}</Text>
            <View style={estilosAviso.dialogoBotoes}>
              <TouchableOpacity
                style={[estilosAviso.dialogoBotao, { backgroundColor: c.chip }]}
                onPress={() => responder(false)}
                activeOpacity={0.8}
              >
                <Text style={[estilosAviso.dialogoBotaoTxt, { color: c.chipTexto }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilosAviso.dialogoBotao,
                  { backgroundColor: confirmacao.destrutivo ? HD.accent : HD.primary },
                ]}
                onPress={() => responder(true)}
                activeOpacity={0.8}
              >
                <Text style={[estilosAviso.dialogoBotaoTxt, { color: HD.white }]}>{confirmacao.textoOk}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {aviso && <CartaoAviso key={aviso.id} aviso={aviso} topo={insets.top + 12} />}
    </View>
  );
}

function CartaoAviso({ aviso, topo }: { aviso: Aviso; topo: number }) {
  const c = useCores();
  const entrada = useRef(new Animated.Value(0)).current;
  const { cor, icone } = ESTILO_AVISO[aviso.tipo];

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrada]);

  return (
    <Animated.View
      style={[
        estilosAviso.avisoPosicao,
        {
          top: topo,
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}
    >
      <Pressable
        style={[estilosAviso.aviso, { backgroundColor: c.folha, borderLeftColor: cor }]}
        onPress={() => fecharAviso(aviso.id)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityHint="Toque para fechar"
      >
        <MaterialIcons name={icone} size={24} color={cor} />
        <View style={{ flex: 1 }}>
          <Text style={[estilosAviso.avisoTitulo, { color: c.texto }]}>{aviso.titulo}</Text>
          {!!aviso.mensagem && (
            <Text style={[estilosAviso.avisoMensagem, { color: c.subtexto }]}>{aviso.mensagem}</Text>
          )}
        </View>
        <MaterialIcons name="close" size={18} color={c.subtexto} />
      </Pressable>
    </Animated.View>
  );
}

const estilosAviso = StyleSheet.create({
  camada: { pointerEvents: 'box-none', zIndex: 1000, elevation: 1000 },

  avisoPosicao: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  aviso: {
    width: '100%', maxWidth: 520,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderLeftWidth: 5, paddingVertical: 12, paddingHorizontal: 14,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10,
  },
  avisoTitulo: { fontSize: 14, fontWeight: '700' },
  avisoMensagem: { fontSize: 13, marginTop: 2, lineHeight: 18 },

  dialogoFundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  dialogo: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 22, alignItems: 'center' },
  dialogoIcone: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  dialogoTitulo: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  dialogoMensagem: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  dialogoBotoes: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  dialogoBotao: { flex: 1, borderRadius: 30, paddingVertical: 12, alignItems: 'center' },
  dialogoBotaoTxt: { fontSize: 15, fontWeight: '700' },
});

// ─── Cores e estilos comuns ───────────────────────────────────────────────────

export function useCores() {
  const { temaDark } = useTema();
  return useMemo(() => {
    const tema = temaDark ? darkTheme : lightTheme;
    return {
      temaDark,
      fundo:     tema.background,
      card:      tema.card,
      texto:     tema.text,
      subtexto:  tema.subtext,
      borda:     tema.border,
      campo:     temaDark ? '#111827' : HD.white,     // fundo de inputs
      folha:     temaDark ? HD.bgDark : HD.white,     // fundo dos modais
      realce:    temaDark ? '#115E59' : '#CCFBF1',    // item selecionado
      chip:      temaDark ? '#4B5563' : HD.divider,   // chip inativo
      chipTexto: temaDark ? '#E5E7EB' : HD.textMedium,
    };
  }, [temaDark]);
}

export type Cores = ReturnType<typeof useCores>;

export function useEstilos() {
  const c = useCores();
  return useMemo(() => criarEstilos(c), [c]);
}

const sombra = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
};

/** Largura máxima do conteúdo. No celular não faz diferença; no navegador do computador
 *  evita que campos, cartões e fotos se estiquem pela tela inteira. */
export const LARGURA_MAXIMA = 720;

// No navegador o campo focado ganha um contorno preto por cima da nossa borda
export const semContornoWeb = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const criarEstilos = (c: Cores) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.fundo },
  scroll: {
    width: '100%', maxWidth: LARGURA_MAXIMA + 32, alignSelf: 'center',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120, gap: 12,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', maxWidth: LARGURA_MAXIMA + 40, alignSelf: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  headerLado: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { alignItems: 'center', gap: 4 },
  headerTitulo: { fontSize: 22, fontWeight: '800', color: HD.primary },
  headerBadge: {
    position: 'absolute', top: 2, right: 0, minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 3, backgroundColor: HD.accent, alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeTxt: { color: HD.white, fontSize: 9, fontWeight: '700' },

  // Abas
  abasArea: {
    width: '100%', maxWidth: LARGURA_MAXIMA + 32, alignSelf: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  abas: {
    flexDirection: 'row', padding: 4,
    borderRadius: 14, backgroundColor: c.temaDark ? HD.cardDark : HD.divider,
  },
  aba: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  abaAtiva: { backgroundColor: HD.primary },
  abaTxt: { fontSize: 13, fontWeight: '600', color: c.subtexto },
  abaTxtAtiva: { color: HD.white },

  // Dias
  dias: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dia: {
    flex: 1, maxWidth: 46, aspectRatio: 1, borderRadius: 23,
    backgroundColor: HD.dayInactive, alignItems: 'center', justifyContent: 'center',
  },
  diaAtivo: { backgroundColor: HD.primary },
  diaTxt: { color: HD.white, fontSize: 12, fontWeight: '700' },
  diaPonto: {
    position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: HD.white,
  },

  // Cartões e textos
  card: { backgroundColor: c.card, borderRadius: 20, padding: 16, ...sombra },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: c.texto, marginBottom: 10 },
  secao: { fontSize: 13, fontWeight: '700', color: c.texto, marginBottom: 8 },
  texto: { fontSize: 14, color: c.texto },
  subtexto: { fontSize: 12, color: c.subtexto },
  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: c.borda,
  },
  linhaPrimeira: { borderTopWidth: 0, paddingTop: 0 },
  linhaTitulo: { fontSize: 14, fontWeight: '600', color: c.texto },
  acao: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  tag: {
    alignSelf: 'flex-start', backgroundColor: HD.secondaryLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  tagTxt: { fontSize: 10, fontWeight: '700', color: '#9A3412' },

  // Seletor (dropdown)
  seletor: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: c.campo, borderWidth: 1, borderColor: c.borda,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
  },
  seletorTxt: { flex: 1, fontSize: 14, color: c.texto },
  seletorVazio: { color: HD.placeholder },
  seletorLista: {
    marginTop: 6, borderRadius: 14, overflow: 'hidden',
    backgroundColor: c.campo, borderWidth: 1, borderColor: c.borda,
  },
  seletorItem: { paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: c.borda },
  seletorItemAtivo: { backgroundColor: c.realce },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.chip },
  chipAtivo: { backgroundColor: HD.primary },
  chipTxt: { fontSize: 12, fontWeight: '600', color: c.chipTexto },
  chipTxtAtivo: { color: HD.white },

  // Campos de texto
  campoLabel: { fontSize: 12, fontWeight: '600', color: c.subtexto, marginBottom: 6 },
  campoCaixa: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.campo, borderWidth: 1, borderColor: c.borda, borderRadius: 12, paddingHorizontal: 12,
  },
  campoInput: { flex: 1, minWidth: 0, fontSize: 14, color: c.texto, paddingVertical: 11, ...semContornoWeb },
  campoMultilinha: { minHeight: 84, textAlignVertical: 'top' },
  campoSufixo: { fontSize: 12, fontWeight: '600', color: c.subtexto, marginLeft: 6 },

  // Botões
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 20,
  },
  botaoTxt: { color: HD.white, fontSize: 16, fontWeight: '700' },
  botaoSecundario: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.realce, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
  },
  botaoSecundarioTxt: { color: c.temaDark ? HD.primaryLight : HD.primaryDark, fontSize: 14, fontWeight: '700' },
  desabilitado: { opacity: 0.5 },

  // Estado vazio
  vazio: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  vazioTxt: { fontSize: 14, color: c.subtexto, textAlign: 'center', lineHeight: 20 },

  // Modal em folha (bottom sheet)
  folhaFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  folha: {
    width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '90%',
    backgroundColor: c.folha, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28,
  },
  folhaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  folhaTitulo: { flex: 1, fontSize: 18, fontWeight: '800', color: c.texto, marginRight: 12 },
  folhaConteudo: { gap: 14, paddingBottom: 8 },
});

// ─── Componentes ──────────────────────────────────────────────────────────────

/** Cabeçalho padrão. O sino mostra as solicitações pendentes e leva até elas. */
export function Cabecalho({ titulo, pendentes }: { titulo: string; pendentes?: number }) {
  const c = useCores();
  const ui = useEstilos();
  const [contagem, setContagem] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      getSolicitacoes()
        .then(todas => { if (ativo) setContagem(todas.filter(s => s.status === 'pendente').length); })
        .catch(() => {});
      return () => { ativo = false; };
    }, []),
  );

  const total = pendentes ?? contagem;

  return (
    <>
      <StatusBar barStyle={c.temaDark ? 'light-content' : 'dark-content'} backgroundColor={c.fundo} />
      <View style={ui.header}>
        <TouchableOpacity
          style={ui.headerLado}
          onPress={() => router.navigate('/(especialista)/solicitacoes')}
          accessibilityLabel={`Solicitações pendentes: ${total}`}
        >
          <MaterialIcons name="notifications-none" size={24} color={HD.primary} />
          {total > 0 && (
            <View style={ui.headerBadge}>
              <Text style={ui.headerBadgeTxt}>{total > 9 ? '9+' : total}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={ui.headerCentro}>
          <Text style={ui.headerTitulo}>{titulo}</Text>
          <LogoHealthDay size={32} />
        </View>
        <View style={ui.headerLado} />
      </View>
    </>
  );
}

export function Abas<T extends string>({
  opcoes, valor, onChange,
}: { opcoes: { id: T; label: string }[]; valor: T; onChange: (id: T) => void }) {
  const ui = useEstilos();
  return (
    <View style={ui.abasArea}>
      <View style={ui.abas}>
        {opcoes.map(o => (
          <TouchableOpacity
            key={o.id}
            style={[ui.aba, valor === o.id && ui.abaAtiva]}
            onPress={() => onChange(o.id)}
          >
            <Text style={[ui.abaTxt, valor === o.id && ui.abaTxtAtiva]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** Os 7 dias da semana. `marcados` ganha um ponto (dias que já têm algo salvo). */
export function SeletorDias({
  valor, onChange, marcados = [],
}: { valor: Dia; onChange: (dia: Dia) => void; marcados?: Dia[] }) {
  const ui = useEstilos();
  return (
    <View style={ui.dias}>
      {DIAS.map(dia => (
        <TouchableOpacity
          key={dia}
          style={[ui.dia, valor === dia && ui.diaAtivo]}
          onPress={() => onChange(dia)}
          activeOpacity={0.8}
        >
          <Text style={ui.diaTxt}>{ROTULO_DIA[dia]}</Text>
          {marcados.includes(dia) && <View style={ui.diaPonto} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SeletorAluno({
  alunos, valor, onChange,
}: { alunos: User[]; valor: User | null; onChange: (aluno: User) => void }) {
  const c = useCores();
  const ui = useEstilos();
  const [aberto, setAberto] = useState(false);

  return (
    <View>
      <TouchableOpacity style={ui.seletor} onPress={() => setAberto(!aberto)} activeOpacity={0.8}>
        <MaterialIcons name="person-outline" size={20} color={HD.primary} />
        <Text style={[ui.seletorTxt, !valor && ui.seletorVazio]} numberOfLines={1}>
          {valor ? `${valor.nome}  ·  ID ${valor.id}` : 'Selecione o aluno'}
        </Text>
        <MaterialIcons name={aberto ? 'expand-less' : 'expand-more'} size={22} color={c.subtexto} />
      </TouchableOpacity>
      {aberto && (
        <View style={ui.seletorLista}>
          {alunos.length === 0 ? (
            <Text style={[ui.subtexto, { padding: 14 }]}>Nenhum aluno cadastrado ainda.</Text>
          ) : (
            alunos.map((a, i) => (
              <TouchableOpacity
                key={a.id}
                style={[ui.seletorItem, i === 0 && { borderTopWidth: 0 }, valor?.id === a.id && ui.seletorItemAtivo]}
                onPress={() => { onChange(a); setAberto(false); }}
              >
                <Text style={ui.texto}>{a.nome}</Text>
                <Text style={ui.subtexto}>ID {a.id}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export function Chips({
  opcoes, valor, onChange, rotulo,
}: { opcoes: string[]; valor: string; onChange: (v: string) => void; rotulo?: (v: string) => string }) {
  const ui = useEstilos();
  return (
    <View style={ui.chips}>
      {opcoes.map(o => (
        <TouchableOpacity
          key={o}
          style={[ui.chip, valor === o && ui.chipAtivo]}
          onPress={() => onChange(o)}
        >
          <Text style={[ui.chipTxt, valor === o && ui.chipTxtAtivo]}>{rotulo ? rotulo(o) : o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Campo({
  label, sufixo, icone, style, multiline, ...props
}: TextInputProps & { label?: string; sufixo?: string; icone?: IconName }) {
  const ui = useEstilos();
  return (
    <View style={style}>
      {!!label && <Text style={ui.campoLabel}>{label}</Text>}
      <View style={ui.campoCaixa}>
        {icone && <MaterialIcons name={icone} size={20} color={HD.placeholder} style={{ marginRight: 8 }} />}
        <TextInput
          style={[ui.campoInput, multiline && ui.campoMultilinha]}
          placeholderTextColor={HD.placeholder}
          multiline={multiline}
          {...props}
        />
        {!!sufixo && <Text style={ui.campoSufixo}>{sufixo}</Text>}
      </View>
    </View>
  );
}

export function Botao({
  texto, onPress, icone = 'check', desabilitado,
}: { texto: string; onPress: () => void; icone?: IconName; desabilitado?: boolean }) {
  const ui = useEstilos();
  return (
    <TouchableOpacity
      style={[ui.botao, desabilitado && ui.desabilitado]}
      onPress={onPress}
      disabled={desabilitado}
      activeOpacity={0.8}
    >
      <Text style={ui.botaoTxt}>{texto}</Text>
      <MaterialIcons name={icone} size={20} color={HD.white} />
    </TouchableOpacity>
  );
}

export function BotaoSecundario({
  texto, onPress, icone = 'add-circle-outline',
}: { texto: string; onPress: () => void; icone?: IconName }) {
  const c = useCores();
  const ui = useEstilos();
  return (
    <TouchableOpacity style={ui.botaoSecundario} onPress={onPress} activeOpacity={0.8}>
      <MaterialIcons name={icone} size={20} color={c.temaDark ? HD.primaryLight : HD.primaryDark} />
      <Text style={ui.botaoSecundarioTxt}>{texto}</Text>
    </TouchableOpacity>
  );
}

export function Vazio({ icone, texto }: { icone: IconName; texto: string }) {
  const c = useCores();
  const ui = useEstilos();
  return (
    <View style={ui.vazio}>
      <MaterialIcons name={icone} size={48} color={c.subtexto} />
      <Text style={ui.vazioTxt}>{texto}</Text>
    </View>
  );
}

/** Modal que sobe da parte de baixo da tela, com título, botão de fechar e rolagem. */
export function Folha({
  visivel, titulo, onFechar, children,
}: { visivel: boolean; titulo: string; onFechar: () => void; children: ReactNode }) {
  const c = useCores();
  const ui = useEstilos();
  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={ui.folhaFundo}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={ui.folha}>
            <View style={ui.folhaHeader}>
              <Text style={ui.folhaTitulo} numberOfLines={2}>{titulo}</Text>
              <TouchableOpacity onPress={onFechar} accessibilityLabel="Fechar">
                <MaterialIcons name="close" size={24} color={c.subtexto} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={ui.folhaConteudo}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        {/* O modal cobre a tela, então os avisos precisam ser desenhados aqui dentro também */}
        <AvisosNaTela ativo={visivel} />
      </View>
    </Modal>
  );
}
