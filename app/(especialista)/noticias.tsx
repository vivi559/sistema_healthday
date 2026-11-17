/**
 * app/(especialista)/noticias.tsx
 * Publicação e gerenciamento de notícias pelo especialista.
 * As notícias aparecem na Home do usuário (getNoticias em constants/Storage.ts).
 * O especialista gerencia TODAS as notícias exibidas aos usuários: busca, filtra por
 * categoria/autor, pré-visualiza como o aluno vê, edita, exclui e publica novas.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HD } from '@/constants/theme';
import { useTema } from '@/context/TemaContext';
import HeaderEspecialista from '@/components/HeaderEspecialista';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import {
  atualizarNoticia,
  criarNoticia,
  deletarNoticia,
  getNoticias,
  getUserAtual,
  type Noticia,
  type User,
} from '@/constants/Storage';

type Categoria = Noticia['categoria'];

const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'exercicio', label: 'Exercício' },
  { id: 'saude', label: 'Saúde' },
];

// Imagem padrão por categoria (a Home do usuário sempre renderiza a imagem)
const IMAGEM_PADRAO: Record<Categoria, string> = {
  alimentacao: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
  exercicio: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  saude: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=400',
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

export default function EspecialistaNoticias() {
  const { temaDark } = useTema();
  const s = styles(temaDark);

  const [user, setUser] = useState<User | null>(null);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [catFiltro, setCatFiltro] = useState<'todas' | Categoria>('todas');
  const [busca, setBusca] = useState('');
  const [preview, setPreview] = useState<Noticia | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('saude');
  const [imagem, setImagem] = useState('');
  const [saving, setSaving] = useState(false);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const carregar = async () => {
    try {
      const [u, lista] = await Promise.all([getUserAtual(), getNoticias()]);
      setUser(u);
      setNoticias(lista);
    } catch (e) {
      console.log(e);
    }
  };

  // Foto da galeria → redimensiona (800px) e comprime para caber no AsyncStorage como data URI
  const escolherFoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher uma imagem.');
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });
      if (res.canceled || !res.assets?.[0]) return;

      setCarregandoFoto(true);
      const img = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!img.base64) throw new Error('sem base64');
      setImagem(`data:image/jpeg;base64,${img.base64}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a foto.');
    } finally {
      setCarregandoFoto(false);
    }
  };

  const abrirNova = () => {
    setEditando(null);
    setTitulo('');
    setDescricao('');
    setCategoria('saude');
    setImagem('');
    setModalVisible(true);
  };

  const abrirEdicao = (n: Noticia) => {
    setEditando(n);
    setTitulo(n.titulo);
    setDescricao(n.descricao);
    setCategoria(n.categoria);
    // não mostra a imagem padrão como se fosse digitada
    setImagem(n.imagem === IMAGEM_PADRAO[n.categoria] ? '' : n.imagem);
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!user) return;
    if (!titulo.trim()) return Alert.alert('Atenção', 'Informe o título da notícia.');
    if (!descricao.trim()) return Alert.alert('Atenção', 'Informe o texto da notícia.');
    const url = imagem.trim();
    if (url && !url.startsWith('data:image/') && !/^https?:\/\//i.test(url)) {
      return Alert.alert('Atenção', 'A imagem deve ser um link começando com http:// ou https://');
    }

    setSaving(true);
    try {
      const dados = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        imagem: url || IMAGEM_PADRAO[categoria],
      };
      if (editando) {
        await atualizarNoticia({ ...editando, ...dados });
      } else {
        await criarNoticia({ ...dados, autorId: user.id, autorNome: user.nome });
      }
      setModalVisible(false);
      await carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a notícia.');
    } finally {
      setSaving(false);
    }
  };

  const excluir = (n: Noticia) => {
    Alert.alert('Excluir', 'Deseja excluir esta notícia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deletarNoticia(n.id);
            await carregar();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a notícia.');
          }
        },
      },
    ]);
  };

  const termo = busca.trim().toLowerCase();
  const visiveis = noticias.filter(n =>
    (filtro === 'todas' || n.autorId === user?.id) &&
    (catFiltro === 'todas' || n.categoria === catFiltro) &&
    (!termo || n.titulo.toLowerCase().includes(termo) || n.descricao.toLowerCase().includes(termo))
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} />

      <HeaderEspecialista titulo="Notícias" />

      <View style={s.abasRow}>
        <TouchableOpacity style={[s.abaBtn, filtro === 'todas' && s.abaBtnAtivo]} onPress={() => setFiltro('todas')}>
          <Text style={[s.abaTxt, filtro === 'todas' && s.abaTxtAtivo]}>Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.abaBtn, filtro === 'minhas' && s.abaBtnAtivo]} onPress={() => setFiltro('minhas')}>
          <Text style={[s.abaTxt, filtro === 'minhas' && s.abaTxtAtivo]}>Minhas</Text>
        </TouchableOpacity>
      </View>

      <View style={s.buscaRow}>
        <MaterialIcons name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={s.buscaInput}
          placeholder="Buscar notícia"
          placeholderTextColor="#aaa"
          value={busca}
          onChangeText={setBusca}
        />
        {!!busca && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <MaterialIcons name="close" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.chipsRow}>
        {([{ id: 'todas', label: 'Todas' }, ...CATEGORIAS] as { id: 'todas' | Categoria; label: string }[]).map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.catChip, catFiltro === c.id && s.catChipAtivo]}
            onPress={() => setCatFiltro(c.id)}
          >
            <Text style={[s.catChipTxt, catFiltro === c.id && s.catChipTxtAtivo]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.contador}>{visiveis.length} notícia(s) visível(is) para os usuários</Text>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {visiveis.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialIcons name="article" size={56} color={HD.primary} />
            <Text style={s.emptyTxt}>
              {filtro === 'minhas' && !busca && catFiltro === 'todas'
                ? 'Você ainda não publicou nenhuma notícia.'
                : 'Nenhuma notícia encontrada.'}
            </Text>
          </View>
        ) : (
          visiveis.map(n => {
            const minha = n.autorId === user?.id;
            return (
              <TouchableOpacity key={n.id} style={s.card} activeOpacity={0.85} onPress={() => setPreview(n)}>
                {!!n.imagem && <Image source={{ uri: n.imagem }} style={s.thumb} resizeMode="cover" />}
                <View style={s.cardTop}>
                  <View style={s.catBadge}>
                    <Text style={s.catTxt}>{CATEGORIAS.find(c => c.id === n.categoria)?.label}</Text>
                  </View>
                  <View style={s.acoes}>
                    <TouchableOpacity onPress={() => abrirEdicao(n)} style={s.acaoBtn}>
                      <MaterialIcons name="edit" size={20} color={HD.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => excluir(n)} style={s.acaoBtn}>
                      <MaterialIcons name="delete-outline" size={20} color={HD.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={s.cardTitulo}>{n.titulo}</Text>
                <Text style={s.cardDesc} numberOfLines={3}>{n.descricao}</Text>
                <Text style={s.cardMeta}>
                  {n.autorNome} · {formatarData(n.criadaEm)}{minha ? ' · sua' : ''}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.novoBtn} onPress={abrirNova}>
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={s.novoTxt}>Nova Notícia</Text>
        </TouchableOpacity>
      </View>

      {/* Pré-visualização: como a notícia aparece para o usuário */}
      <Modal visible={!!preview} animationType="fade" transparent onRequestClose={() => setPreview(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Visão do usuário</Text>
              <TouchableOpacity onPress={() => setPreview(null)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>
            {preview && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {!!preview.imagem && <Image source={{ uri: preview.imagem }} style={s.previewImg} resizeMode="cover" />}
                <Text style={s.cardTitulo}>{preview.titulo}</Text>
                <Text style={[s.cardDesc, { marginBottom: 12 }]}>{preview.descricao}</Text>
                <Text style={s.cardMeta}>{preview.autorNome} · {formatarData(preview.criadaEm)}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>{editando ? 'Editar Notícia' : 'Nova Notícia'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={temaDark ? '#ccc' : '#333'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.label}>Título</Text>
              <TextInput
                style={s.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Título da notícia"
                placeholderTextColor="#aaa"
              />

              <Text style={s.label}>Categoria</Text>
              <View style={s.catRow}>
                {CATEGORIAS.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.catChip, categoria === c.id && s.catChipAtivo]}
                    onPress={() => setCategoria(c.id)}
                  >
                    <Text style={[s.catChipTxt, categoria === c.id && s.catChipTxtAtivo]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Texto</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                placeholder="Conteúdo da notícia..."
                placeholderTextColor="#aaa"
              />

              <Text style={s.label}>Imagem (opcional)</Text>
              {!!imagem && (
                <Image source={{ uri: imagem }} style={s.previewImg} resizeMode="cover" />
              )}
              <View style={s.fotoRow}>
                <TouchableOpacity style={s.fotoBtn} onPress={escolherFoto} disabled={carregandoFoto}>
                  <MaterialIcons name="photo-library" size={18} color={HD.primary} />
                  <Text style={s.fotoTxt}>{carregandoFoto ? 'Carregando...' : imagem ? 'Trocar foto' : 'Escolher da galeria'}</Text>
                </TouchableOpacity>
                {!!imagem && (
                  <TouchableOpacity style={s.fotoBtn} onPress={() => setImagem('')}>
                    <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                    <Text style={[s.fotoTxt, { color: HD.accent }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!imagem.startsWith('data:') && (
                <TextInput
                  style={s.input}
                  value={imagem}
                  onChangeText={setImagem}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="ou cole o link da imagem (https://...)"
                  placeholderTextColor="#aaa"
                />
              )}

              <TouchableOpacity style={s.salvarBtn} onPress={salvar} disabled={saving}>
                <Text style={s.salvarTxt}>{saving ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Publicar'}</Text>
              </TouchableOpacity>
              <View style={{ height: 12 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (temaDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: temaDark ? '#1a1a1a' : HD.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: HD.primary },
  abasRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, padding: 4 },
  abaBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  abaBtnAtivo: { backgroundColor: HD.primary },
  abaTxt: { fontSize: 14, fontWeight: '600', color: temaDark ? '#aaa' : '#666' },
  abaTxtAtivo: { color: '#fff' },
  buscaRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: temaDark ? '#2a2a2a' : '#eee', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  buscaInput: { flex: 1, fontSize: 14, color: temaDark ? '#ddd' : '#333' },
  chipsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 6 },
  contador: { paddingHorizontal: 20, fontSize: 12, color: '#999', marginBottom: 6 },
  fotoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  fotoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: temaDark ? '#1a3a35' : '#e0faf5' },
  fotoTxt: { color: HD.primary, fontWeight: '600', fontSize: 13 },
  thumb: { width: '100%', height: 120, borderRadius: 12, marginBottom: 10, backgroundColor: temaDark ? '#333' : '#ddd' },
  previewImg: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12, backgroundColor: temaDark ? '#333' : '#ddd' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  emptyBox: { padding: 40, alignItems: 'center', gap: 12 },
  emptyTxt: { color: temaDark ? '#aaa' : '#888', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: temaDark ? '#2a2a2a' : '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { backgroundColor: temaDark ? '#1a3a35' : '#e0faf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTxt: { fontSize: 11, fontWeight: '600', color: HD.primary },
  acoes: { flexDirection: 'row', gap: 4 },
  acaoBtn: { padding: 4 },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: temaDark ? '#eee' : '#222', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: temaDark ? '#ccc' : '#555', lineHeight: 18, marginBottom: 8 },
  cardMeta: { fontSize: 11, color: '#999' },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 100 },
  novoBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  novoTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: temaDark ? '#222' : '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: temaDark ? '#eee' : '#222' },
  label: { fontSize: 13, fontWeight: '600', color: temaDark ? '#ccc' : '#333', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: temaDark ? '#2a2a2a' : '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: temaDark ? '#eee' : '#222', marginBottom: 12 },
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catChip: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: temaDark ? '#2a2a2a' : '#eee', alignItems: 'center' },
  catChipAtivo: { backgroundColor: HD.primary },
  catChipTxt: { fontSize: 12, fontWeight: '600', color: temaDark ? '#aaa' : '#555' },
  catChipTxtAtivo: { color: '#fff' },
  salvarBtn: { backgroundColor: HD.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  salvarTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
