/**
 * app/seja-profissional.tsx
 * "Seja um Profissional": questionário curto de pré-seleção para quem quer
 * atuar como especialista no Health Day (dados de contato, formação,
 * experiência, objetivos na empresa, disponibilidade e currículo).
 *
 * Aberta pelo botão "Seja um Profissional" do Perfil do usuário.
 * Fica fora das abas, então abre por cima da tela e tem botão de voltar.
 */

import {
  AvisosNaTela, Botao, BotaoSecundario, Campo, Chips,
  avisar, confirmar, useCores, useEstilos,
} from '@/components/EspecialistaUI';
import LogoHealthDay from '@/components/LogoHealthDay';
import {
  AREAS_ATUACAO, DISPONIBILIDADES, ROTULO_STATUS_CANDIDATURA, TAMANHO_MAXIMO_CURRICULO, TEMPOS_EXPERIENCIA,
  cancelarCandidatura, emailValido, enviarCandidatura, formatarDataCandidatura, formatarTamanho,
  getCandidaturaUsuario, linkValido, mascaraTelefone, telefoneValido,
  type ArquivoCurriculo, type Candidatura,
} from '@/constants/CandidaturaStorage';
import { getUserAtual, type User } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TIPOS_CURRICULO = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MINIMO_OBJETIVOS = 50;

interface Form {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  area: string;
  outraArea: string;
  registro: string;
  formacao: string;
  experiencia: string;
  objetivos: string;
  disponibilidade: string[];
  linkedin: string;
  curriculo: ArquivoCurriculo | null;
  aceiteDados: boolean;
}

function formVazio(user: User | null): Form {
  return {
    nome: user?.nome ?? '',
    email: user?.email ?? '',
    telefone: '',
    cidade: [user?.cidade, user?.estado].filter(Boolean).join(' - '),
    area: '', outraArea: '', registro: '', formacao: '', experiencia: '',
    objetivos: '', disponibilidade: [], linkedin: '', curriculo: null, aceiteDados: false,
  };
}

function formDaCandidatura(c: Candidatura): Form {
  const areaPadrao = AREAS_ATUACAO.includes(c.area);
  return {
    nome: c.nome, email: c.email, telefone: c.telefone, cidade: c.cidade ?? '',
    area: areaPadrao ? c.area : 'Outra', outraArea: areaPadrao ? '' : c.area,
    registro: c.registro ?? '', formacao: c.formacao, experiencia: c.experiencia,
    objetivos: c.objetivos, disponibilidade: c.disponibilidade, linkedin: c.linkedin ?? '',
    curriculo: c.curriculo, aceiteDados: false, // a autorização é pedida de novo a cada envio
  };
}

export default function SejaProfissional() {
  const c = useCores();
  const ui = useEstilos();
  const s = useMemo(() => estilos(c.temaDark), [c.temaDark]);
  const rolagem = useRef<ScrollView>(null);

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [candidatura, setCandidatura] = useState<Candidatura | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Form>(formVazio(null));

  useEffect(() => {
    let ativo = true;
    (async () => {
      const u = await getUserAtual();
      const existente = u ? await getCandidaturaUsuario(u.id) : null;
      if (!ativo) return;
      setUser(u);
      setCandidatura(existente);
      setForm(formVazio(u));
      setCarregando(false);
    })();
    return () => { ativo = false; };
  }, []);

  const mudar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }));

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/(usuario)/perfil');
  }

  function alternarDisponibilidade(opcao: string) {
    setForm(f => ({
      ...f,
      disponibilidade: f.disponibilidade.includes(opcao)
        ? f.disponibilidade.filter(d => d !== opcao)
        : [...f.disponibilidade, opcao],
    }));
  }

  // ── Currículo ──

  async function escolherCurriculo() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: TIPOS_CURRICULO,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (resultado.canceled || !resultado.assets?.length) return;
      const arquivo = resultado.assets[0];
      const tamanho = arquivo.size ?? 0;
      if (tamanho > TAMANHO_MAXIMO_CURRICULO) {
        avisar('Arquivo muito grande', `O currículo pode ter no máximo ${formatarTamanho(TAMANHO_MAXIMO_CURRICULO)}. Este tem ${formatarTamanho(tamanho)}.`);
        return;
      }
      const tipo = arquivo.mimeType ?? '';
      const extensaoOk = /\.(pdf|docx?)$/i.test(arquivo.name);
      if (!TIPOS_CURRICULO.includes(tipo) && !extensaoOk) {
        avisar('Formato não aceito', 'Envie o currículo em PDF ou Word (.doc ou .docx).');
        return;
      }
      // No navegador o endereço do arquivo some ao recarregar a página, então guardamos o conteúdo
      const uri = Platform.OS === 'web' && arquivo.base64 ? arquivo.base64 : arquivo.uri;
      mudar('curriculo', { nome: arquivo.name, tipo, tamanho, uri });
    } catch {
      avisar('Erro', 'Não foi possível abrir os arquivos do aparelho.');
    }
  }

  // ── Envio ──

  /** Confere o formulário e mostra o primeiro problema encontrado. */
  function validar(): string | null {
    if (form.nome.trim().length < 3) return 'Informe seu nome completo.';
    if (!emailValido(form.email)) return 'Informe um e-mail válido.';
    if (!telefoneValido(form.telefone)) return 'Informe um telefone com DDD, ex: (11) 98765-4321.';
    if (!form.area) return 'Selecione sua área de atuação.';
    if (form.area === 'Outra' && form.outraArea.trim().length < 3) return 'Escreva qual é a sua área de atuação.';
    if (form.formacao.trim().length < 5) return 'Conte qual é a sua formação.';
    if (!form.experiencia) return 'Selecione seu tempo de experiência.';
    if (form.objetivos.trim().length < MINIMO_OBJETIVOS) {
      return `Conte seus objetivos no Health Day (pelo menos ${MINIMO_OBJETIVOS} caracteres).`;
    }
    if (form.disponibilidade.length === 0) return 'Marque pelo menos um período de disponibilidade.';
    if (form.linkedin.trim() && !linkValido(form.linkedin)) return 'O link do LinkedIn ou portfólio precisa começar com https://';
    if (!form.curriculo) return 'Anexe seu currículo em PDF ou Word.';
    if (!form.aceiteDados) return 'Para enviar, autorize o uso dos seus dados no processo de seleção.';
    return null;
  }

  async function enviar() {
    if (!user || enviando) return;
    const problema = validar();
    if (problema) return avisar('Atenção', problema);
    setEnviando(true);
    try {
      const opcional = (t: string) => t.trim() || undefined;
      const salva = await enviarCandidatura({
        usuarioId: user.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone,
        cidade: opcional(form.cidade),
        area: form.area === 'Outra' ? form.outraArea.trim() : form.area,
        registro: opcional(form.registro),
        formacao: form.formacao.trim(),
        experiencia: form.experiencia,
        objetivos: form.objetivos.trim(),
        disponibilidade: form.disponibilidade,
        linkedin: opcional(form.linkedin),
        curriculo: form.curriculo!,
        aceiteDados: true,
      });
      setCandidatura(salva);
      setEditando(false);
      rolagem.current?.scrollTo({ y: 0, animated: false });
      avisar('Candidatura enviada!', 'Vamos analisar seus dados e entrar em contato.');
    } catch {
      avisar('Erro', 'Não foi possível enviar. Se o currículo for grande, tente um arquivo menor.');
    } finally {
      setEnviando(false);
    }
  }

  function atualizar() {
    if (!candidatura) return;
    setForm(formDaCandidatura(candidatura));
    setEditando(true);
    rolagem.current?.scrollTo({ y: 0, animated: false });
  }

  function cancelar() {
    if (!user) return;
    confirmar(
      'Cancelar candidatura',
      'Seus dados e o currículo enviados serão apagados. Você pode se candidatar de novo quando quiser.',
      async () => {
        await cancelarCandidatura(user.id);
        setCandidatura(null);
        setForm(formVazio(user));
        avisar('Candidatura cancelada', 'Seus dados foram apagados.', 'info');
      },
      'Cancelar candidatura',
    );
  }

  const mostrarFormulario = !candidatura || editando;

  // ── Pedaços de tela ──

  const cabecalho = (
    <View style={ui.header}>
      <TouchableOpacity style={ui.headerLado} onPress={voltar} accessibilityLabel="Voltar">
        <MaterialIcons name="arrow-back" size={24} color={HD.primary} />
      </TouchableOpacity>
      <View style={ui.headerCentro}>
        <Text style={[ui.headerTitulo, s.titulo]} numberOfLines={1}>Seja Profissional</Text>
        <LogoHealthDay size={32} />
      </View>
      <View style={ui.headerLado} />
    </View>
  );

  if (carregando) {
    return (
      <View style={[ui.container, s.centro]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={HD.primary} />
      </View>
    );
  }

  return (
    <View style={ui.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={c.temaDark ? 'light-content' : 'dark-content'} backgroundColor={c.fundo} />
      {cabecalho}

      <ScrollView
        ref={rolagem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[ui.scroll, s.scroll]}
      >
        {/* ── Candidatura já enviada ── */}
        {!mostrarFormulario && candidatura && (
          <>
            <View style={[ui.card, s.statusCard]}>
              <View style={s.statusIcone}>
                <MaterialIcons
                  name={candidatura.status === 'aprovada' ? 'verified' : candidatura.status === 'recusada' ? 'info-outline' : 'hourglass-top'}
                  size={34}
                  color={HD.primaryDark}
                />
              </View>
              <Text style={s.statusTitulo}>
                {candidatura.status === 'em_analise' ? 'Candidatura em análise' : `Candidatura ${ROTULO_STATUS_CANDIDATURA[candidatura.status].toLowerCase()}`}
              </Text>
              <Text style={[ui.subtexto, s.centroTexto]}>
                Enviada em {formatarDataCandidatura(candidatura.criadoEm)}
                {candidatura.atualizadoEm ? ` · atualizada em ${formatarDataCandidatura(candidatura.atualizadoEm)}` : ''}
              </Text>
              <Text style={[ui.texto, s.centroTexto, { marginTop: 10 }]}>
                Vamos entrar em contato pelo e-mail {candidatura.email} ou pelo telefone {candidatura.telefone}.
              </Text>
            </View>

            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Resumo</Text>
              {[
                ['Área', candidatura.area],
                ['Registro profissional', candidatura.registro || 'Não informado'],
                ['Experiência', candidatura.experiencia],
                ['Disponibilidade', candidatura.disponibilidade.join(', ')],
                ['Currículo', `${candidatura.curriculo.nome} (${formatarTamanho(candidatura.curriculo.tamanho)})`],
              ].map(([rotulo, valor], i) => (
                <View key={rotulo} style={[ui.linha, i === 0 && ui.linhaPrimeira]}>
                  <Text style={[ui.subtexto, s.resumoRotulo]}>{rotulo}</Text>
                  <Text style={[ui.texto, s.resumoValor]}>{valor}</Text>
                </View>
              ))}
            </View>

            <BotaoSecundario texto="Atualizar candidatura" icone="edit" onPress={atualizar} />
            <Botao texto="Voltar ao perfil" icone="arrow-back" onPress={voltar} />
            <TouchableOpacity style={s.linkPerigo} onPress={cancelar}>
              <Text style={s.linkPerigoTxt}>Cancelar candidatura</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Formulário ── */}
        {mostrarFormulario && (
          <>
            <View style={s.intro}>
              <MaterialIcons name="workspace-premium" size={28} color={HD.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={s.introTitulo}>
                  {editando ? 'Atualize sua candidatura' : 'Quer atender pelo Health Day?'}
                </Text>
                <Text style={ui.subtexto}>
                  Responda este questionário rápido de pré-seleção. Leva uns 3 minutos.
                </Text>
              </View>
            </View>

            {/* Contato */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Seus dados</Text>
              <View style={s.campos}>
                <Campo label="Nome completo *" icone="person-outline" placeholder="Seu nome" value={form.nome} onChangeText={v => mudar('nome', v)} maxLength={80} />
                <Campo label="E-mail *" icone="mail-outline" placeholder="seu@email.com" value={form.email} onChangeText={v => mudar('email', v)} keyboardType="email-address" autoCapitalize="none" maxLength={80} />
                <Campo label="Telefone / WhatsApp *" icone="phone" placeholder="(11) 98765-4321" value={form.telefone} onChangeText={v => mudar('telefone', mascaraTelefone(v))} keyboardType="phone-pad" maxLength={15} />
                <Campo label="Cidade" icone="place" placeholder="Ex: Itapira - SP" value={form.cidade} onChangeText={v => mudar('cidade', v)} maxLength={60} />
              </View>
            </View>

            {/* Formação */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Formação e experiência</Text>
              <Text style={ui.campoLabel}>Área de atuação *</Text>
              <Chips opcoes={AREAS_ATUACAO} valor={form.area} onChange={v => mudar('area', v)} />
              <View style={[s.campos, s.espaco]}>
                {form.area === 'Outra' && (
                  <Campo label="Qual área? *" placeholder="Ex: Educação em saúde" value={form.outraArea} onChangeText={v => mudar('outraArea', v)} maxLength={60} />
                )}
                <Campo
                  label="Registro profissional"
                  icone="badge"
                  placeholder="Ex: CRN-3 12345, CREF 012345-G/SP"
                  value={form.registro}
                  onChangeText={v => mudar('registro', v)}
                  maxLength={40}
                />
                <Campo
                  label="Formação *"
                  icone="school"
                  placeholder="Ex: Bacharel em Nutrição - USP, 2020"
                  value={form.formacao}
                  onChangeText={v => mudar('formacao', v)}
                  maxLength={120}
                />
              </View>
              <Text style={[ui.campoLabel, s.espaco]}>Tempo de experiência *</Text>
              <Chips opcoes={TEMPOS_EXPERIENCIA} valor={form.experiencia} onChange={v => mudar('experiencia', v)} />
            </View>

            {/* Objetivos */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Objetivos no Health Day *</Text>
              <Campo
                placeholder="Por que você quer fazer parte do Health Day? Como pretende ajudar os usuários?"
                value={form.objetivos}
                onChangeText={v => mudar('objetivos', v)}
                multiline
                maxLength={800}
              />
              <Text style={[ui.subtexto, s.contador]}>
                {form.objetivos.trim().length < MINIMO_OBJETIVOS
                  ? `Mínimo de ${MINIMO_OBJETIVOS} caracteres · ${form.objetivos.trim().length}/${MINIMO_OBJETIVOS}`
                  : `${form.objetivos.length}/800`}
              </Text>

              <Text style={[ui.campoLabel, s.espaco]}>Disponibilidade * (marque quantas quiser)</Text>
              <View style={ui.chips}>
                {DISPONIBILIDADES.map(opcao => {
                  const marcada = form.disponibilidade.includes(opcao);
                  return (
                    <TouchableOpacity
                      key={opcao}
                      style={[ui.chip, marcada && ui.chipAtivo, s.chipMulti]}
                      onPress={() => alternarDisponibilidade(opcao)}
                      accessibilityRole="checkbox"
                      aria-checked={marcada}
                    >
                      {marcada && <MaterialIcons name="check" size={14} color={HD.white} />}
                      <Text style={[ui.chipTxt, marcada && ui.chipTxtAtivo]}>{opcao}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Currículo */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Currículo *</Text>
              {form.curriculo ? (
                <View style={s.arquivo}>
                  <MaterialIcons
                    name={/pdf/i.test(form.curriculo.tipo) || /\.pdf$/i.test(form.curriculo.nome) ? 'picture-as-pdf' : 'description'}
                    size={30}
                    color={HD.accent}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={ui.linhaTitulo} numberOfLines={1}>{form.curriculo.nome}</Text>
                    <Text style={ui.subtexto}>{formatarTamanho(form.curriculo.tamanho)}</Text>
                  </View>
                  <TouchableOpacity style={ui.acao} onPress={escolherCurriculo} accessibilityLabel="Trocar currículo">
                    <MaterialIcons name="swap-horiz" size={22} color={HD.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={ui.acao} onPress={() => mudar('curriculo', null)} accessibilityLabel="Remover currículo">
                    <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.anexar} onPress={escolherCurriculo} activeOpacity={0.85}>
                  <MaterialIcons name="upload-file" size={34} color={HD.primary} />
                  <Text style={s.anexarTitulo}>Toque para anexar seu currículo</Text>
                  <Text style={ui.subtexto}>PDF ou Word, até {formatarTamanho(TAMANHO_MAXIMO_CURRICULO)}</Text>
                </TouchableOpacity>
              )}
              <Campo
                style={s.espaco}
                label="LinkedIn ou portfólio"
                icone="link"
                placeholder="https://linkedin.com/in/seu-perfil"
                value={form.linkedin}
                onChangeText={v => mudar('linkedin', v)}
                autoCapitalize="none"
                keyboardType="url"
                maxLength={150}
              />
            </View>

            {/* Autorização */}
            <TouchableOpacity
              style={s.aceite}
              onPress={() => mudar('aceiteDados', !form.aceiteDados)}
              accessibilityRole="checkbox"
              aria-checked={form.aceiteDados}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={form.aceiteDados ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={form.aceiteDados ? HD.primary : c.subtexto}
              />
              <Text style={[ui.texto, { flex: 1 }]}>
                Autorizo o Health Day a usar estes dados e o meu currículo apenas para o processo de seleção.
              </Text>
            </TouchableOpacity>

            <Botao
              texto={enviando ? 'Enviando...' : editando ? 'Enviar atualização' : 'Enviar candidatura'}
              icone="send"
              onPress={enviar}
              desabilitado={enviando}
            />
            {editando && (
              <TouchableOpacity style={s.linkPerigo} onPress={() => setEditando(false)}>
                <Text style={[s.linkPerigoTxt, { color: c.subtexto }]}>Descartar alterações</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Avisos e confirmações desta tela */}
      <AvisosNaTela />
    </View>
  );
}

const estilos = (temaDark: boolean) => StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  centroTexto: { textAlign: 'center' },
  titulo: { fontSize: 20 },
  scroll: { paddingBottom: 48 }, // tela sem barra de abas: não precisa do espaço extra

  intro: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: temaDark ? '#115E59' : '#CCFBF1', borderRadius: 16, padding: 14,
  },
  introTitulo: { fontSize: 15, fontWeight: '800', color: temaDark ? HD.white : HD.textDark, marginBottom: 2 },
  campos: { gap: 12 },
  espaco: { marginTop: 14 },
  contador: { textAlign: 'right', marginTop: 4 },
  chipMulti: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  anexar: {
    alignItems: 'center', justifyContent: 'center', gap: 4, padding: 20, borderRadius: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: HD.primary,
    backgroundColor: temaDark ? '#111827' : HD.white,
  },
  anexarTitulo: { fontSize: 14, fontWeight: '700', color: temaDark ? HD.white : HD.textDark },
  arquivo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
    backgroundColor: temaDark ? '#111827' : HD.white,
  },

  aceite: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },

  statusCard: { alignItems: 'center' },
  statusIcone: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: HD.primary + '33', marginBottom: 10,
  },
  statusTitulo: { fontSize: 18, fontWeight: '800', color: temaDark ? HD.white : HD.textDark, textAlign: 'center' },
  resumoRotulo: { width: 120 },
  resumoValor: { flex: 1, fontWeight: '600' },
  linkPerigo: { alignItems: 'center', paddingVertical: 8 },
  linkPerigoTxt: { fontSize: 14, fontWeight: '700', color: HD.accent },
});
