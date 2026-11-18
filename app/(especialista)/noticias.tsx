/**
 * app/(especialista)/noticias.tsx
 * Gerenciamento das notícias que aparecem na tela inicial dos usuários:
 * escrever, pré-visualizar, publicar, editar e excluir.
 */

import {
  Abas, Botao, BotaoSecundario, Cabecalho, Campo, Chips, Folha, Vazio,
  avisar, confirmar, semContornoWeb, useCores, useEstilos, type Cores,
} from '@/components/EspecialistaUI';
import {
  CATEGORIAS_NOTICIA, COR_CATEGORIA, MAX_FOTOS_EXTRAS, ROTULO_CATEGORIA,
  formatarDataBR, getNoticiasCompletas, linkValido, removerNoticia, salvarNoticia, tempoLeitura,
  type CategoriaNoticia, type DadosNoticia, type FonteNoticia, type FotoNoticia, type NoticiaCompleta,
} from '@/constants/EspecialistaStorage';
import { getUserAtual, type User } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Aba = 'publicadas' | 'escrever';

interface Form {
  imagem: string;
  creditoImagem: string;
  titulo: string;
  subtitulo: string;
  categoria: CategoriaNoticia | '';
  descricao: string;
  fontes: FonteNoticia[];
  fotos: FotoNoticia[];
  autorNome: string;
}

const FORM_VAZIO: Form = {
  imagem: '', creditoImagem: '', titulo: '', subtitulo: '', categoria: '',
  descricao: '', fontes: [], fotos: [], autorNome: '',
};

const LIMITE = { titulo: 140, subtitulo: 220, texto: 6000, minimoTitulo: 10, minimoTexto: 80 };

const hoje = () => new Date().toISOString().split('T')[0];

// ─── Fotos ────────────────────────────────────────────────────────────────────

/** No navegador a foto é reduzida e guardada como texto (data URL), para continuar
 *  disponível depois de recarregar a página e não lotar o armazenamento. */
function reduzirImagemWeb(uri: string, ladoMaximo = 1280, qualidade = 0.78): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(uri);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}

async function escolherDaGaleria(capa: boolean): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        avisar('Permissão necessária', 'Permita o acesso às fotos do aparelho para escolher uma imagem.', 'alerta');
        return null;
      }
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: capa && Platform.OS !== 'web', // a capa é recortada no formato horizontal
      aspect: [16, 9],
      quality: 0.7,
    });
    if (resultado.canceled || !resultado.assets?.length) return null;
    const uri = resultado.assets[0].uri;
    return Platform.OS === 'web' ? await reduzirImagemWeb(uri) : uri;
  } catch {
    avisar('Erro', 'Não foi possível abrir as fotos do aparelho.');
    return null;
  }
}

/** Identificador curto da foto para o React. A foto pode ser um texto enorme (data URL),
 *  então usamos só o tamanho e o final dele em vez do texto inteiro. */
function chaveFoto(uri: string) {
  return `${uri.length}-${uri.slice(-32)}`;
}

function abrirLink(url: string) {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}

/** Imagem que mostra um aviso no lugar quando o arquivo ou o link não carrega. */
function Foto({ uri, style }: { uri: string; style: StyleProp<ImageStyle> }) {
  const c = useCores();
  const [falhou, setFalhou] = useState(false);
  if (!uri || falhou) {
    return (
      <View style={[style as StyleProp<ViewStyle>, estilosFixos.fotoFalha, { backgroundColor: c.campo }]}>
        <MaterialIcons name="broken-image" size={28} color={c.subtexto} />
        <Text style={[estilosFixos.fotoFalhaTxt, { color: c.subtexto }]}>Imagem indisponível</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFalhou(true)} />;
}

function Categoria({ categoria }: { categoria?: string }) {
  const cat = (CATEGORIAS_NOTICIA as string[]).includes(categoria ?? '') ? (categoria as CategoriaNoticia) : 'saude';
  return (
    <View style={[estilosFixos.badge, { backgroundColor: COR_CATEGORIA[cat] }]}>
      <Text style={estilosFixos.badgeTxt}>{ROTULO_CATEGORIA[cat]}</Text>
    </View>
  );
}

// ─── Notícia como o usuário vai ver ───────────────────────────────────────────

function PreviaNoticia({ noticia, c }: { noticia: NoticiaCompleta; c: Cores }) {
  const s = estilosFixos;
  const data = formatarDataBR(noticia.criadaEm);
  return (
    <View style={{ gap: 14 }}>
      <Text style={[s.previaRotulo, { color: c.subtexto }]}>NA TELA INICIAL</Text>
      <View style={[s.previaLista, { backgroundColor: c.card }]}>
        <Foto key={chaveFoto(noticia.imagem)} uri={noticia.imagem} style={s.previaListaFoto} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[s.previaListaTitulo, { color: c.texto }]}>{noticia.titulo || 'Título da notícia'}</Text>
          <Categoria categoria={noticia.categoria} />
          <Text style={{ fontSize: 11, color: c.subtexto }}>Por {noticia.autorNome} · {data}</Text>
        </View>
      </View>

      <Text style={[s.previaRotulo, { color: c.subtexto }]}>AO ABRIR A NOTÍCIA</Text>
      <View>
        <Foto key={chaveFoto(noticia.imagem)} uri={noticia.imagem} style={s.previaCapa} />
        {!!noticia.creditoImagem && (
          <Text style={[s.credito, { color: c.subtexto }]}>{noticia.creditoImagem}</Text>
        )}
        <View style={{ marginTop: 12 }}><Categoria categoria={noticia.categoria} /></View>
        <Text style={[s.previaTitulo, { color: c.texto }]}>{noticia.titulo || 'Título da notícia'}</Text>
        {!!noticia.subtitulo && (
          <Text style={[s.previaSubtitulo, { color: c.subtexto }]}>{noticia.subtitulo}</Text>
        )}
        <Text style={[s.previaMeta, { color: c.subtexto }]}>
          Por {noticia.autorNome} · {data} · {tempoLeitura(noticia.descricao)}
        </Text>
        <Text style={[s.previaTexto, { color: c.texto }]}>{noticia.descricao || 'Texto da notícia.'}</Text>

        {(noticia.fotos ?? []).map((foto, i) => (
          <View key={`${i}-${chaveFoto(foto.uri)}`} style={{ marginTop: 16 }}>
            <Foto key={chaveFoto(foto.uri)} uri={foto.uri} style={s.previaFotoExtra} />
            {!!foto.legenda && <Text style={[s.credito, { color: c.subtexto }]}>{foto.legenda}</Text>}
          </View>
        ))}

        {(noticia.fontes ?? []).length > 0 && (
          <View style={[s.fontesBox, { backgroundColor: c.campo, borderColor: c.borda }]}>
            <View style={s.fontesTitulo}>
              <MaterialIcons name="fact-check" size={18} color={HD.primaryDark} />
              <Text style={[s.fontesTituloTxt, { color: c.texto }]}>Fontes</Text>
            </View>
            {(noticia.fontes ?? []).map((fonte, i) => (
              <TouchableOpacity
                key={`${i}-${fonte.nome}`}
                disabled={!fonte.url}
                onPress={() => fonte.url && abrirLink(fonte.url)}
                style={s.fonteLinha}
              >
                <Text style={[s.fonteNome, { color: c.texto }]}>• {fonte.nome}</Text>
                {!!fonte.url && (
                  <Text style={s.fonteUrl} numberOfLines={1}>{fonte.url}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function EspecialistaNoticias() {
  const c = useCores();
  const ui = useEstilos();
  const s = useMemo(() => estilos(c), [c]);
  const rolagem = useRef<ScrollView>(null);

  const [aba, setAba] = useState<Aba>('publicadas');
  const [noticias, setNoticias] = useState<NoticiaCompleta[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todas' | CategoriaNoticia>('todas');

  // Formulário
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [editando, setEditando] = useState<NoticiaCompleta | null>(null);
  const [mostrarLinkCapa, setMostrarLinkCapa] = useState(false);
  const [linkCapa, setLinkCapa] = useState('');
  const [novaFonte, setNovaFonte] = useState<FonteNoticia>({ nome: '', url: '' });
  const [linkFoto, setLinkFoto] = useState('');

  // Pré-visualização
  const [previa, setPrevia] = useState<NoticiaCompleta | null>(null);
  const [previaAberta, setPreviaAberta] = useState(false);

  const carregar = useCallback(async () => {
    const [lista, u] = await Promise.all([getNoticiasCompletas(), getUserAtual()]);
    setNoticias(lista);
    setUser(u);
    setForm(f => (f.autorNome ? f : { ...f, autorNome: u?.nome ?? '' }));
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const lista = noticias.filter(n =>
    (filtro === 'todas' || n.categoria === filtro) &&
    `${n.titulo} ${n.subtitulo ?? ''} ${n.autorNome}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  const mudar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }));

  function limparFormulario() {
    setForm({ ...FORM_VAZIO, autorNome: user?.nome ?? '' });
    setEditando(null);
    setMostrarLinkCapa(false);
    setLinkCapa('');
    setNovaFonte({ nome: '', url: '' });
    setLinkFoto('');
  }

  // ── Capa ──

  async function escolherCapa() {
    const uri = await escolherDaGaleria(true);
    if (uri) { mudar('imagem', uri); setMostrarLinkCapa(false); }
  }

  function usarLinkCapa() {
    if (!linkValido(linkCapa)) return avisar('Atenção', 'Cole um link de imagem válido, começando com https://');
    mudar('imagem', linkCapa.trim());
    setLinkCapa('');
    setMostrarLinkCapa(false);
  }

  // ── Fontes ──

  /** Valida a fonte digitada. Devolve a fonte pronta, null se estiver vazia, ou false se for inválida. */
  function fonteDigitada(): FonteNoticia | null | false {
    const nome = novaFonte.nome.trim();
    const url = (novaFonte.url ?? '').trim();
    if (!nome && !url) return null;
    if (nome.length < 2) { avisar('Atenção', 'Informe o nome da fonte (ex: Organização Mundial da Saúde).'); return false; }
    if (url && !linkValido(url)) { avisar('Atenção', 'O link da fonte precisa começar com https://'); return false; }
    if (form.fontes.some(f => f.nome.toLowerCase() === nome.toLowerCase())) {
      avisar('Atenção', `A fonte "${nome}" já foi adicionada.`); return false;
    }
    return { nome, url: url || undefined };
  }

  function adicionarFonte() {
    const fonte = fonteDigitada();
    if (fonte === null) return avisar('Atenção', 'Informe o nome da fonte.');
    if (!fonte) return;
    mudar('fontes', [...form.fontes, fonte]);
    setNovaFonte({ nome: '', url: '' });
  }

  // ── Fotos extras ──

  async function adicionarFotoGaleria() {
    if (form.fotos.length >= MAX_FOTOS_EXTRAS) return avisar('Atenção', `Use no máximo ${MAX_FOTOS_EXTRAS} fotos extras.`);
    const uri = await escolherDaGaleria(false);
    if (uri) setForm(f => ({ ...f, fotos: [...f.fotos, { uri, legenda: '' }] }));
  }

  function adicionarFotoLink() {
    if (form.fotos.length >= MAX_FOTOS_EXTRAS) return avisar('Atenção', `Use no máximo ${MAX_FOTOS_EXTRAS} fotos extras.`);
    if (!linkValido(linkFoto)) return avisar('Atenção', 'Cole um link de imagem válido, começando com https://');
    mudar('fotos', [...form.fotos, { uri: linkFoto.trim(), legenda: '' }]);
    setLinkFoto('');
  }

  function mudarLegenda(indice: number, legenda: string) {
    mudar('fotos', form.fotos.map((f, i) => (i === indice ? { ...f, legenda } : f)));
  }

  // ── Montar, publicar e pré-visualizar ──

  function dadosDoFormulario(fontes: FonteNoticia[]): DadosNoticia {
    const opcional = (texto: string) => texto.trim() || undefined;
    return {
      titulo: form.titulo.trim(),
      subtitulo: opcional(form.subtitulo),
      descricao: form.descricao.trim(),
      imagem: form.imagem,
      creditoImagem: opcional(form.creditoImagem),
      categoria: (form.categoria || 'saude') as CategoriaNoticia,
      fontes,
      fotos: form.fotos.map(f => ({ uri: f.uri, legenda: opcional(f.legenda ?? '') })),
      autorId: editando?.autorId ?? user?.id ?? 'especialista',
      autorNome: form.autorNome.trim(),
    };
  }

  /** Confere tudo o que uma notícia confiável precisa. Mostra o primeiro problema encontrado. */
  function validar(): DadosNoticia | null {
    // Fonte digitada e não adicionada entra junto, para não se perder
    const pendente = fonteDigitada();
    if (pendente === false) return null;
    const fontes = pendente ? [...form.fontes, pendente] : form.fontes;

    let imagem = form.imagem;
    if (!imagem && linkValido(linkCapa)) imagem = linkCapa.trim();

    if (!imagem) { avisar('Atenção', 'Escolha a foto de capa da notícia.'); return null; }
    if (form.titulo.trim().length < LIMITE.minimoTitulo) {
      avisar('Atenção', `O título precisa ter pelo menos ${LIMITE.minimoTitulo} caracteres.`); return null;
    }
    if (!form.categoria) { avisar('Atenção', 'Selecione a categoria da notícia.'); return null; }
    if (form.descricao.trim().length < LIMITE.minimoTexto) {
      avisar('Atenção', `Escreva o texto da notícia (pelo menos ${LIMITE.minimoTexto} caracteres).`); return null;
    }
    if (fontes.length === 0) {
      avisar('Atenção', 'Adicione pelo menos uma fonte. Notícias confiáveis sempre dizem de onde vêm as informações.');
      return null;
    }
    if (!form.autorNome.trim()) { avisar('Atenção', 'Informe quem assina a notícia.'); return null; }

    if (pendente) { setNovaFonte({ nome: '', url: '' }); mudar('fontes', fontes); }
    if (imagem !== form.imagem) { mudar('imagem', imagem); setLinkCapa(''); setMostrarLinkCapa(false); }
    return { ...dadosDoFormulario(fontes), imagem };
  }

  async function publicar() {
    const dados = validar();
    if (!dados) return;
    try {
      await salvarNoticia(dados, editando?.id);
      await carregar();
      const editou = !!editando;
      limparFormulario();
      setAba('publicadas');
      avisar(
        editou ? 'Notícia atualizada!' : 'Notícia publicada!',
        'Ela já aparece na tela inicial dos usuários.',
      );
    } catch {
      avisar('Erro', 'Não foi possível salvar a notícia. Se ela tiver muitas fotos, remova alguma ou use links de imagem.');
    }
  }

  function previsualizar() {
    setPrevia({
      ...dadosDoFormulario(form.fontes),
      autorNome: form.autorNome.trim() || 'Autor',
      id: 'previa',
      criadaEm: editando?.criadaEm ?? hoje(),
    });
    setPreviaAberta(true);
  }

  function verPublicada(n: NoticiaCompleta) {
    setPrevia(n);
    setPreviaAberta(true);
  }

  function editar(n: NoticiaCompleta) {
    setEditando(n);
    setForm({
      imagem: n.imagem ?? '',
      creditoImagem: n.creditoImagem ?? '',
      titulo: n.titulo ?? '',
      subtitulo: n.subtitulo ?? '',
      categoria: n.categoria ?? '',
      descricao: n.descricao ?? '',
      fontes: n.fontes ?? [],
      fotos: (n.fotos ?? []).map(f => ({ uri: f.uri, legenda: f.legenda ?? '' })),
      autorNome: n.autorNome ?? '',
    });
    setMostrarLinkCapa(false);
    setLinkCapa('');
    setNovaFonte({ nome: '', url: '' });
    setLinkFoto('');
    setAba('escrever');
    rolagem.current?.scrollTo({ y: 0, animated: false });
  }

  function excluir(n: NoticiaCompleta) {
    confirmar(
      'Excluir notícia',
      `Excluir "${n.titulo}"? Ela deixa de aparecer para os usuários.`,
      async () => {
        try {
          await removerNoticia(n.id);
          if (editando?.id === n.id) limparFormulario();
          await carregar();
          avisar('Notícia excluída', 'Ela não aparece mais na tela inicial dos usuários.', 'info');
        } catch {
          avisar('Erro', 'Não foi possível excluir a notícia.');
        }
      },
      'Excluir',
    );
  }

  function mudarAba(nova: Aba) {
    setAba(nova);
    rolagem.current?.scrollTo({ y: 0, animated: false });
  }

  const abas: { id: Aba; label: string }[] = [
    { id: 'publicadas', label: `Publicadas (${noticias.length})` },
    { id: 'escrever', label: editando ? 'Editar notícia' : 'Nova notícia' },
  ];

  const contador = (atual: number, max: number) => (
    <Text style={[ui.subtexto, s.contador]}>{atual}/{max}</Text>
  );

  return (
    <View style={ui.container}>
      <Cabecalho titulo="Notícias" />
      <Abas opcoes={abas} valor={aba} onChange={mudarAba} />

      <ScrollView
        ref={rolagem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.scroll}
      >
        {/* ── Publicadas ── */}
        {aba === 'publicadas' && (
          <>
            <View style={s.dica}>
              <MaterialIcons name="info-outline" size={18} color={HD.primaryDark} />
              <Text style={[ui.subtexto, { flex: 1 }]}>
                Estas notícias são a primeira coisa que o usuário vê ao abrir o app, da mais recente para a mais antiga.
              </Text>
            </View>
            <BotaoSecundario texto="Escrever nova notícia" icone="edit-note" onPress={() => { limparFormulario(); mudarAba('escrever'); }} />
            <Campo icone="search" placeholder="Pesquise por título ou autor" value={busca} onChangeText={setBusca} />
            <Chips
              opcoes={['todas', ...CATEGORIAS_NOTICIA]}
              valor={filtro}
              onChange={v => setFiltro(v as 'todas' | CategoriaNoticia)}
              rotulo={v => (v === 'todas' ? 'Todas' : ROTULO_CATEGORIA[v as CategoriaNoticia])}
            />

            {lista.length === 0 ? (
              <Vazio
                icone="article"
                texto={noticias.length === 0
                  ? 'Nenhuma notícia publicada ainda. Escreva a primeira para ela aparecer na tela inicial dos usuários.'
                  : 'Nenhuma notícia encontrada.'}
              />
            ) : (
              lista.map(n => (
                <View key={n.id} style={[ui.card, s.cartao]}>
                  <Foto key={chaveFoto(n.imagem)} uri={n.imagem} style={s.cartaoCapa} />
                  <View style={s.cartaoCorpo}>
                    <View style={s.linhaBadges}>
                      <Categoria categoria={n.categoria} />
                      {!!n.atualizadaEm && <Text style={ui.subtexto}>Editada em {formatarDataBR(n.atualizadaEm)}</Text>}
                    </View>
                    <Text style={s.cartaoTitulo} numberOfLines={3}>{n.titulo}</Text>
                    {!!n.subtitulo && <Text style={ui.subtexto} numberOfLines={2}>{n.subtitulo}</Text>}
                    <Text style={[ui.subtexto, { marginTop: 6 }]}>
                      Por {n.autorNome} · {formatarDataBR(n.criadaEm)}
                    </Text>
                    <View style={s.metaLinha}>
                      <View style={s.meta}>
                        <MaterialIcons name="fact-check" size={14} color={(n.fontes?.length ?? 0) > 0 ? HD.primaryDark : HD.accent} />
                        <Text style={ui.subtexto}>
                          {(n.fontes?.length ?? 0) === 0 ? 'Sem fontes' : `${n.fontes!.length} fonte(s)`}
                        </Text>
                      </View>
                      {(n.fotos?.length ?? 0) > 0 && (
                        <View style={s.meta}>
                          <MaterialIcons name="photo-library" size={14} color={c.subtexto} />
                          <Text style={ui.subtexto}>{n.fotos!.length} foto(s) extra(s)</Text>
                        </View>
                      )}
                      <View style={s.meta}>
                        <MaterialIcons name="schedule" size={14} color={c.subtexto} />
                        <Text style={ui.subtexto}>{tempoLeitura(n.descricao ?? '')}</Text>
                      </View>
                    </View>

                    <View style={s.acoes}>
                      <TouchableOpacity style={s.acao} onPress={() => verPublicada(n)}>
                        <MaterialIcons name="visibility" size={18} color={c.subtexto} />
                        <Text style={s.acaoTxt}>Visualizar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.acao} onPress={() => editar(n)}>
                        <MaterialIcons name="edit" size={18} color={HD.primaryDark} />
                        <Text style={[s.acaoTxt, { color: HD.primaryDark }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.acao} onPress={() => excluir(n)}>
                        <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                        <Text style={[s.acaoTxt, { color: HD.accent }]}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── Escrever / editar ── */}
        {aba === 'escrever' && (
          <>
            {editando && (
              <View style={s.editandoAviso}>
                <MaterialIcons name="edit" size={18} color={HD.primaryDark} />
                <Text style={[ui.subtexto, { flex: 1 }]} numberOfLines={2}>Editando: {editando.titulo}</Text>
                <TouchableOpacity onPress={() => { limparFormulario(); mudarAba('publicadas'); }}>
                  <Text style={s.cancelarTxt}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Capa */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Foto de capa *</Text>
              <TouchableOpacity onPress={escolherCapa} activeOpacity={0.85}>
                {form.imagem ? (
                  <Foto key={chaveFoto(form.imagem)} uri={form.imagem} style={s.capa} />
                ) : (
                  <View style={[s.capa, s.capaVazia]}>
                    <MaterialIcons name="add-photo-alternate" size={40} color={HD.primary} />
                    <Text style={s.capaVaziaTitulo}>Toque para escolher a foto</Text>
                    <Text style={ui.subtexto}>Foto na horizontal fica melhor na tela do usuário</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={s.botoesCapa}>
                <TouchableOpacity style={s.botaoPequeno} onPress={escolherCapa}>
                  <MaterialIcons name="photo-library" size={18} color={HD.primaryDark} />
                  <Text style={s.botaoPequenoTxt}>Galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.botaoPequeno} onPress={() => setMostrarLinkCapa(!mostrarLinkCapa)}>
                  <MaterialIcons name="link" size={18} color={HD.primaryDark} />
                  <Text style={s.botaoPequenoTxt}>Usar link</Text>
                </TouchableOpacity>
                {!!form.imagem && (
                  <TouchableOpacity style={s.botaoPequeno} onPress={() => mudar('imagem', '')}>
                    <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                    <Text style={[s.botaoPequenoTxt, { color: HD.accent }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
              {mostrarLinkCapa && (
                <View style={s.linhaLink}>
                  <Campo
                    style={{ flex: 1 }}
                    icone="link"
                    placeholder="https://site.com/imagem.jpg"
                    value={linkCapa}
                    onChangeText={setLinkCapa}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity style={s.botaoOk} onPress={usarLinkCapa}>
                    <Text style={s.botaoOkTxt}>Usar</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Campo
                style={s.espaco}
                label="Crédito da foto"
                placeholder="Ex: Foto: Agência Brasil / Unsplash"
                value={form.creditoImagem}
                onChangeText={v => mudar('creditoImagem', v)}
                maxLength={80}
              />
            </View>

            {/* Texto */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Conteúdo</Text>
              <Campo
                label="Título *"
                placeholder="Manchete clara e objetiva"
                value={form.titulo}
                onChangeText={v => mudar('titulo', v)}
                maxLength={LIMITE.titulo}
              />
              {contador(form.titulo.length, LIMITE.titulo)}

              <Campo
                label="Subtítulo (linha fina)"
                placeholder="Resumo em uma frase do que a notícia traz"
                value={form.subtitulo}
                onChangeText={v => mudar('subtitulo', v)}
                maxLength={LIMITE.subtitulo}
                multiline
              />
              {contador(form.subtitulo.length, LIMITE.subtitulo)}

              <Text style={ui.campoLabel}>Categoria *</Text>
              <Chips
                opcoes={CATEGORIAS_NOTICIA}
                valor={form.categoria}
                onChange={v => mudar('categoria', v as CategoriaNoticia)}
                rotulo={v => ROTULO_CATEGORIA[v as CategoriaNoticia]}
              />

              <Text style={[ui.campoLabel, s.espaco]}>Texto da notícia *</Text>
              <View style={ui.campoCaixa}>
                <TextInput
                  style={[ui.campoInput, ui.campoMultilinha, s.texto, semContornoWeb]}
                  placeholder={'Escreva a notícia completa.\n\nDeixe uma linha em branco entre os parágrafos.'}
                  placeholderTextColor={HD.placeholder}
                  value={form.descricao}
                  onChangeText={v => mudar('descricao', v)}
                  maxLength={LIMITE.texto}
                  multiline
                />
              </View>
              <Text style={[ui.subtexto, s.contador]}>
                {form.descricao.trim() ? `${tempoLeitura(form.descricao)} · ` : ''}{form.descricao.length}/{LIMITE.texto}
              </Text>
            </View>

            {/* Fontes */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Fontes *</Text>
              <Text style={[ui.subtexto, { marginTop: -6, marginBottom: 10 }]}>
                De onde vêm as informações: estudos, órgãos de saúde, veículos de imprensa.
              </Text>
              {form.fontes.map((f, i) => (
                <View key={`${i}-${f.nome}`} style={[ui.linha, i === 0 && ui.linhaPrimeira]}>
                  <MaterialIcons name={f.url ? 'link' : 'menu-book'} size={20} color={HD.primaryDark} />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.linhaTitulo}>{f.nome}</Text>
                    {!!f.url && <Text style={s.fonteUrl} numberOfLines={1}>{f.url}</Text>}
                  </View>
                  <TouchableOpacity
                    style={ui.acao}
                    onPress={() => mudar('fontes', form.fontes.filter((_, j) => j !== i))}
                    accessibilityLabel="Remover fonte"
                  >
                    <MaterialIcons name="close" size={20} color={c.subtexto} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={[s.novaFonte, form.fontes.length > 0 && s.espaco]}>
                <Campo
                  placeholder="Nome da fonte (ex: Organização Mundial da Saúde)"
                  value={novaFonte.nome}
                  onChangeText={nome => setNovaFonte(f => ({ ...f, nome }))}
                  maxLength={100}
                />
                <Campo
                  icone="link"
                  placeholder="Link da publicação (opcional)"
                  value={novaFonte.url}
                  onChangeText={url => setNovaFonte(f => ({ ...f, url }))}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <BotaoSecundario texto="Adicionar fonte" onPress={adicionarFonte} />
              </View>
            </View>

            {/* Fotos extras */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Fotos extras ({form.fotos.length}/{MAX_FOTOS_EXTRAS})</Text>
              <Text style={[ui.subtexto, { marginTop: -6, marginBottom: 10 }]}>
                Opcional. Aparecem depois do texto, cada uma com sua legenda.
              </Text>
              {form.fotos.map((foto, i) => (
                <View key={`${i}-${chaveFoto(foto.uri)}`} style={[s.fotoExtra, i > 0 && { marginTop: 10 }]}>
                  <Foto key={chaveFoto(foto.uri)} uri={foto.uri} style={s.fotoExtraImg} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Campo
                      placeholder="Legenda da foto"
                      value={foto.legenda}
                      onChangeText={v => mudarLegenda(i, v)}
                      maxLength={120}
                    />
                  </View>
                  <TouchableOpacity
                    style={ui.acao}
                    onPress={() => mudar('fotos', form.fotos.filter((_, j) => j !== i))}
                    accessibilityLabel="Remover foto"
                  >
                    <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                  </TouchableOpacity>
                </View>
              ))}
              {form.fotos.length < MAX_FOTOS_EXTRAS && (
                <View style={[{ gap: 10 }, form.fotos.length > 0 && s.espaco]}>
                  <BotaoSecundario texto="Adicionar foto da galeria" icone="add-photo-alternate" onPress={adicionarFotoGaleria} />
                  <View style={s.linhaLink}>
                    <Campo
                      style={{ flex: 1 }}
                      icone="link"
                      placeholder="Ou cole o link de uma imagem"
                      value={linkFoto}
                      onChangeText={setLinkFoto}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                    <TouchableOpacity style={s.botaoOk} onPress={adicionarFotoLink}>
                      <Text style={s.botaoOkTxt}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Assinatura */}
            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Assinatura</Text>
              <Campo
                label="Autor *"
                icone="person-outline"
                placeholder="Quem assina a notícia"
                value={form.autorNome}
                onChangeText={v => mudar('autorNome', v)}
                maxLength={60}
              />
              <Text style={[ui.subtexto, s.espaco]}>
                {editando
                  ? `Publicada em ${formatarDataBR(editando.criadaEm)}. A data de edição fica registrada.`
                  : `Será publicada hoje, ${formatarDataBR(hoje())}.`}
              </Text>
            </View>

            <BotaoSecundario texto="Pré-visualizar como o usuário vê" icone="visibility" onPress={previsualizar} />
            <Botao
              texto={editando ? 'Salvar alterações' : 'Publicar notícia'}
              icone={editando ? 'check' : 'send'}
              onPress={publicar}
            />
          </>
        )}
      </ScrollView>

      {/* ── Pré-visualização ── */}
      <Folha visivel={previaAberta} titulo="Como o usuário vai ver" onFechar={() => setPreviaAberta(false)}>
        {previa && <PreviaNoticia noticia={previa} c={c} />}
      </Folha>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilosFixos = StyleSheet.create({
  fotoFalha: { alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden' },
  fotoFalhaTxt: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '600', color: HD.textMedium },

  previaRotulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  previaLista: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: 16 },
  previaListaFoto: { width: 90, height: 80, borderRadius: 12 },
  previaListaTitulo: { fontSize: 14, fontWeight: '600', lineHeight: 20, textDecorationLine: 'underline' },
  previaCapa: { width: '100%', height: 200, borderRadius: 16 },
  credito: { fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  previaTitulo: { fontSize: 18, fontWeight: '800', lineHeight: 26, marginTop: 12 },
  previaSubtitulo: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  previaMeta: { fontSize: 12, marginTop: 10, marginBottom: 16 },
  previaTexto: { fontSize: 15, lineHeight: 24 },
  previaFotoExtra: { width: '100%', height: 180, borderRadius: 14 },

  fontesBox: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 20, gap: 8 },
  fontesTitulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fontesTituloTxt: { fontSize: 14, fontWeight: '700' },
  fonteLinha: { gap: 2 },
  fonteNome: { fontSize: 13, fontWeight: '600' },
  fonteUrl: { fontSize: 12, color: '#3B82F6', textDecorationLine: 'underline', marginLeft: 10 },
});

const estilos = (c: Cores) => StyleSheet.create({
  dica: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.realce, borderRadius: 14, padding: 12,
  },

  // Cartão de notícia publicada
  cartao: { padding: 0, overflow: 'hidden' },
  cartaoCapa: { width: '100%', aspectRatio: 2.2 }, // proporção fixa: não estica em tela larga
  cartaoCorpo: { padding: 16, gap: 4 },
  linhaBadges: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cartaoTitulo: { fontSize: 16, fontWeight: '800', color: c.texto, lineHeight: 22 },
  metaLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acoes: {
    flexDirection: 'row', marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: c.borda,
  },
  acao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  acaoTxt: { fontSize: 13, fontWeight: '700', color: c.subtexto },

  // Formulário
  editandoAviso: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.realce, borderRadius: 14, padding: 12,
  },
  cancelarTxt: { fontSize: 13, fontWeight: '700', color: HD.accent },
  capa: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16 },
  capaVazia: {
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: HD.primary, backgroundColor: c.campo,
  },
  capaVaziaTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
  botoesCapa: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  botaoPequeno: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.realce, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  botaoPequenoTxt: { fontSize: 13, fontWeight: '700', color: c.temaDark ? HD.primaryLight : HD.primaryDark },
  linhaLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  botaoOk: { backgroundColor: HD.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  botaoOkTxt: { color: HD.white, fontSize: 13, fontWeight: '700' },
  espaco: { marginTop: 14 },
  contador: { textAlign: 'right', marginTop: 4, marginBottom: 12 },
  texto: { minHeight: 220 },
  novaFonte: { gap: 10 },
  fonteUrl: { fontSize: 12, color: '#3B82F6' },
  fotoExtra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fotoExtraImg: { width: 72, height: 54, borderRadius: 10 },
});
