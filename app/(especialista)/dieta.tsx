/**
 * app/(especialista)/dieta.tsx
 * Montagem das dietas dos alunos e catálogo de alimentos do especialista.
 */

import {
  Abas, Botao, BotaoSecundario, Cabecalho, Campo, Chips, Folha, SeletorAluno, SeletorDias, Vazio,
  avisar, confirmar, semContornoWeb, useCores, useEstilos,
} from '@/components/EspecialistaUI';
import {
  CATEGORIAS_ALIMENTO, DIAS, REFEICOES, ROTULO_DIA,
  formatar, getAlimentos, getAlunos, getDietaAluno, paraNumero, removerAlimento, salvarAlimento,
  salvarDietaAluno, somarNutrientes,
  type AlimentoCatalogo, type AlimentoDieta, type Dia, type DietaAluno,
} from '@/constants/EspecialistaStorage';
import type { User } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Aba = 'criar' | 'gerenciar' | 'alimentos';

const ABAS: { id: Aba; label: string }[] = [
  { id: 'criar', label: 'Criar dieta' },
  { id: 'gerenciar', label: 'Gerenciar' },
  { id: 'alimentos', label: 'Alimentos' },
];

const FORM_VAZIO = {
  nome: '', categoria: '',
  kcal: '', carboidrato: '', proteina: '', gordura: '',
  fibra: '', sodio: '', calcio: '', ferro: '',
};
type Form = typeof FORM_VAZIO;

function resumoMacros(a: { carboidrato: number; proteina: number; gordura: number }) {
  return `C ${formatar(a.carboidrato)}g  ·  P ${formatar(a.proteina)}g  ·  G ${formatar(a.gordura)}g`;
}

export default function EspecialistaDieta() {
  const c = useCores();
  const ui = useEstilos();
  const s = useMemo(() => estilos(c.temaDark), [c.temaDark]);

  const [aba, setAba] = useState<Aba>('criar');
  const [alunos, setAlunos] = useState<User[]>([]);
  const [aluno, setAluno] = useState<User | null>(null);
  const [dia, setDia] = useState<Dia>('Seg');
  const [refeicao, setRefeicao] = useState('');
  const [catalogo, setCatalogo] = useState<AlimentoCatalogo[]>([]);
  const [plano, setPlano] = useState<DietaAluno>({});
  const [selecionados, setSelecionados] = useState<AlimentoDieta[]>([]);

  // Busca no catálogo
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');

  // Modal: quantidade do alimento ou cadastro/edição de alimento
  // (o modo fica guardado ao fechar, para o conteúdo não trocar durante a animação)
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [modoFolha, setModoFolha] = useState<'quantidade' | 'form'>('quantidade');
  const [alimentoModal, setAlimentoModal] = useState<AlimentoCatalogo | null>(null);
  const [quantidade, setQuantidade] = useState('100');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      Promise.all([getAlunos(), getAlimentos()]).then(([listaAlunos, listaAlimentos]) => {
        if (!ativo) return;
        setAlunos(listaAlunos);
        setCatalogo(listaAlimentos);
      });
      return () => { ativo = false; };
    }, []),
  );

  useEffect(() => {
    if (!aluno) { setPlano({}); return; }
    let ativo = true;
    getDietaAluno(aluno.id).then(p => { if (ativo) setPlano(p); });
    return () => { ativo = false; };
  }, [aluno]);

  const catalogoFiltrado = catalogo.filter(a =>
    (categoriaFiltro === 'Todos' || a.categoria === categoriaFiltro) &&
    a.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  const diasComDieta = DIAS.filter(d => Object.keys(plano[d] ?? {}).length > 0);
  const totalSelecionados = somarNutrientes(selecionados);
  const jaSalvos = refeicao ? plano[dia]?.[refeicao]?.length ?? 0 : 0;

  // ── Quantidade do alimento ──

  function abrirQuantidade(alimento: AlimentoCatalogo) {
    const existente = selecionados.find(a => a.id === alimento.id);
    setAlimentoModal(alimento);
    setQuantidade(existente ? String(existente.quantidade) : '100');
    setModoFolha('quantidade');
    setFolhaAberta(true);
  }

  function ajustarQuantidade(delta: number) {
    setQuantidade(atual => String(Math.max(0, (parseInt(atual, 10) || 0) + delta)));
  }

  // Valor de um nutriente (base por 100g) proporcional à quantidade digitada
  function proporcional(base: number) {
    return formatar((base ?? 0) * ((parseInt(quantidade, 10) || 0) / 100));
  }

  function confirmarQuantidade() {
    if (!alimentoModal) return;
    const gramas = parseInt(quantidade, 10) || 0;
    if (gramas <= 0) return avisar('Atenção', 'Informe uma quantidade válida em gramas.');
    setSelecionados(prev =>
      prev.some(a => a.id === alimentoModal.id)
        ? prev.map(a => (a.id === alimentoModal.id ? { ...a, quantidade: gramas } : a))
        : [...prev, { ...alimentoModal, quantidade: gramas }],
    );
    setFolhaAberta(false);
  }

  function removerSelecionado(id: string) {
    setSelecionados(prev => prev.filter(a => a.id !== id));
  }

  const modalJaSelecionado = !!alimentoModal && selecionados.some(a => a.id === alimentoModal.id);

  // ── Salvar / gerenciar dieta ──

  async function salvarRefeicao() {
    if (!aluno) return avisar('Atenção', 'Selecione um aluno.');
    if (!refeicao) return avisar('Atenção', 'Selecione a refeição.');
    if (selecionados.length === 0) return avisar('Atenção', 'Adicione pelo menos um alimento.');
    try {
      const atual = await getDietaAluno(aluno.id);
      // Soma aos alimentos já salvos na refeição; se o alimento se repete, vale a nova quantidade
      const anteriores = (atual[dia]?.[refeicao] ?? []).filter(a => !selecionados.some(n => n.id === a.id));
      const novo: DietaAluno = {
        ...atual,
        [dia]: { ...(atual[dia] ?? {}), [refeicao]: [...anteriores, ...selecionados] },
      };
      await salvarDietaAluno(aluno.id, novo);
      setPlano(novo);
      setSelecionados([]);
      setBusca('');
      avisar('Dieta salva!', `${refeicao} de ${ROTULO_DIA[dia]} salvo para ${aluno.nome}.`);
    } catch {
      avisar('Erro', 'Não foi possível salvar a dieta.');
    }
  }

  async function gravarPlano(novo: DietaAluno) {
    if (!aluno) return;
    await salvarDietaAluno(aluno.id, novo);
    setPlano(novo);
  }

  function removerRefeicao(d: Dia, nomeRefeicao: string) {
    confirmar('Remover refeição', `Remover "${nomeRefeicao}" de ${ROTULO_DIA[d]}?`, async () => {
      const doDia = { ...(plano[d] ?? {}) };
      delete doDia[nomeRefeicao];
      const novo: DietaAluno = { ...plano, [d]: doDia };
      if (Object.keys(doDia).length === 0) delete novo[d];
      await gravarPlano(novo);
    }, 'Remover');
  }

  function removerAlimentoDaRefeicao(d: Dia, nomeRefeicao: string, alimento: AlimentoDieta) {
    confirmar('Remover alimento', `Remover "${alimento.nome}" de ${nomeRefeicao}?`, async () => {
      const doDia = { ...(plano[d] ?? {}) };
      const restantes = (doDia[nomeRefeicao] ?? []).filter(a => a.id !== alimento.id);
      if (restantes.length > 0) doDia[nomeRefeicao] = restantes;
      else delete doDia[nomeRefeicao];
      const novo: DietaAluno = { ...plano, [d]: doDia };
      if (Object.keys(doDia).length === 0) delete novo[d];
      await gravarPlano(novo);
    }, 'Remover');
  }

  // ── Catálogo de alimentos ──

  function abrirForm(a?: AlimentoCatalogo) {
    setEditandoId(a?.id ?? null);
    setForm(a ? {
      nome: a.nome,
      categoria: a.categoria ?? '',
      kcal: formatar(a.kcal),
      carboidrato: formatar(a.carboidrato),
      proteina: formatar(a.proteina),
      gordura: formatar(a.gordura),
      fibra: a.fibra ? formatar(a.fibra) : '',
      sodio: a.sodio ? formatar(a.sodio) : '',
      calcio: a.calcio ? formatar(a.calcio) : '',
      ferro: a.ferro ? formatar(a.ferro) : '',
    } : { ...FORM_VAZIO, nome: aba === 'criar' ? busca.trim() : '' });
    setModoFolha('form');
    setFolhaAberta(true);
  }

  // Estimativa de kcal pelos macros (4 kcal/g de carboidrato e proteína, 9 kcal/g de gordura)
  const kcalEstimada = (() => {
    const carbo = paraNumero(form.carboidrato);
    const prot = paraNumero(form.proteina);
    const gord = paraNumero(form.gordura);
    if ([carbo, prot, gord].some(n => Number.isNaN(n))) return null;
    return Math.round(carbo * 4 + prot * 4 + gord * 9);
  })();

  async function salvarForm() {
    const nome = form.nome.trim();
    if (nome.length < 2) return avisar('Atenção', 'Informe o nome do alimento.');
    if (!form.categoria) return avisar('Atenção', 'Selecione a categoria.');
    const repetido = catalogo.some(a => a.id !== editandoId && a.nome.toLowerCase() === nome.toLowerCase());
    if (repetido) return avisar('Atenção', `Já existe um alimento chamado "${nome}".`);

    const obrigatorios: [keyof Form, string][] = [
      ['kcal', 'Calorias'], ['carboidrato', 'Carboidratos'], ['proteina', 'Proteínas'], ['gordura', 'Gorduras'],
    ];
    const opcionais: [keyof Form, string][] = [
      ['fibra', 'Fibras'], ['sodio', 'Sódio'], ['calcio', 'Cálcio'], ['ferro', 'Ferro'],
    ];
    const valores: Record<string, number> = {};
    for (const [campo, rotulo] of obrigatorios) {
      const n = paraNumero(form[campo]);
      if (Number.isNaN(n) || n < 0) return avisar('Atenção', `Informe um valor válido para ${rotulo} (por 100g).`);
      valores[campo] = n;
    }
    for (const [campo, rotulo] of opcionais) {
      const n = form[campo].trim() === '' ? 0 : paraNumero(form[campo]);
      if (Number.isNaN(n) || n < 0) return avisar('Atenção', `Informe um valor válido para ${rotulo} ou deixe em branco.`);
      valores[campo] = n;
    }
    if (valores.carboidrato + valores.proteina + valores.gordura + valores.fibra > 100) {
      return avisar('Atenção', 'A soma de carboidratos, proteínas, gorduras e fibras não pode passar de 100g em 100g de alimento.');
    }

    try {
      await salvarAlimento({
        nome,
        categoria: form.categoria,
        kcal: valores.kcal,
        carboidrato: valores.carboidrato,
        proteina: valores.proteina,
        gordura: valores.gordura,
        fibra: valores.fibra,
        sodio: valores.sodio,
        calcio: valores.calcio,
        ferro: valores.ferro,
      }, editandoId ?? undefined);
      setCatalogo(await getAlimentos());
      setBusca('');
      setFolhaAberta(false);
    } catch {
      avisar('Erro', 'Não foi possível salvar o alimento.');
    }
  }

  function excluirAlimento(a: AlimentoCatalogo) {
    confirmar(
      'Excluir alimento',
      `Excluir "${a.nome}" do catálogo? Dietas já salvas com ele não são alteradas.`,
      async () => {
        await removerAlimento(a.id);
        setCatalogo(await getAlimentos());
        removerSelecionado(a.id);
      },
      'Excluir',
    );
  }

  const campoNumero = (campo: keyof Form, label: string, sufixo: string) => (
    <Campo
      style={s.metade}
      label={label}
      sufixo={sufixo}
      placeholder="0"
      keyboardType="decimal-pad"
      value={form[campo]}
      onChangeText={t => setForm(f => ({ ...f, [campo]: t.replace(/[^0-9.,]/g, '') }))}
      maxLength={7}
    />
  );

  const filtrosCatalogo = (
    <>
      <Campo icone="search" placeholder="Pesquise o alimento" value={busca} onChangeText={setBusca} />
      <Chips opcoes={['Todos', ...CATEGORIAS_ALIMENTO]} valor={categoriaFiltro} onChange={setCategoriaFiltro} />
    </>
  );

  const cartoesMacros = (t: { kcal: number; carboidrato: number; proteina: number; gordura: number }) => (
    <View style={s.macroRow}>
      <View style={[s.macroCard, { backgroundColor: HD.kcal + '22' }]}>
        <Text style={[s.macroValor, { color: HD.kcal }]}>{Math.round(t.kcal)}</Text>
        <Text style={s.macroLabel}>Kcal</Text>
      </View>
      <View style={[s.macroCard, { backgroundColor: HD.carbo + '22' }]}>
        <Text style={[s.macroValor, { color: c.temaDark ? HD.carbo : HD.primaryDark }]}>{formatar(t.carboidrato)}g</Text>
        <Text style={s.macroLabel}>Carboidratos</Text>
      </View>
      <View style={[s.macroCard, { backgroundColor: HD.protein + '22' }]}>
        <Text style={[s.macroValor, { color: HD.protein }]}>{formatar(t.proteina)}g</Text>
        <Text style={s.macroLabel}>Proteínas</Text>
      </View>
      <View style={[s.macroCard, { backgroundColor: HD.fat + '22' }]}>
        <Text style={[s.macroValor, { color: HD.fat }]}>{formatar(t.gordura)}g</Text>
        <Text style={s.macroLabel}>Gorduras</Text>
      </View>
    </View>
  );

  return (
    <View style={ui.container}>
      <Cabecalho titulo="Dieta" />
      <Abas opcoes={ABAS} valor={aba} onChange={setAba} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.scroll}
      >
        {/* ── Criar dieta ── */}
        {aba === 'criar' && (
          <>
            <SeletorAluno alunos={alunos} valor={aluno} onChange={setAluno} />
            <SeletorDias valor={dia} onChange={setDia} marcados={diasComDieta} />

            <View style={ui.card}>
              <Text style={ui.cardTitulo}>Refeição</Text>
              <Chips opcoes={REFEICOES} valor={refeicao} onChange={setRefeicao} />
              {aluno && jaSalvos > 0 && (
                <Text style={[ui.subtexto, { marginTop: 10 }]}>
                  {refeicao} de {ROTULO_DIA[dia]} já tem {jaSalvos} alimento(s) salvo(s). Os novos serão somados.
                </Text>
              )}
            </View>

            {selecionados.length > 0 && (
              <View style={ui.card}>
                <Text style={ui.cardTitulo}>{selecionados.length} alimento(s) selecionado(s)</Text>
                {cartoesMacros(totalSelecionados)}
                {selecionados.map((a, i) => (
                  <View key={a.id} style={[ui.linha, i === 0 && ui.linhaPrimeira, i === 0 && { marginTop: 12 }]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirQuantidade(a)}>
                      <Text style={ui.linhaTitulo}>{a.nome}</Text>
                      <Text style={ui.subtexto}>
                        {a.quantidade}g  ·  {Math.round((a.kcal * a.quantidade) / 100)} kcal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={ui.acao} onPress={() => abrirQuantidade(a)} accessibilityLabel="Editar quantidade">
                      <MaterialIcons name="edit" size={20} color={HD.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={ui.acao} onPress={() => removerSelecionado(a.id)} accessibilityLabel="Remover alimento">
                      <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Botao
              texto={refeicao ? `Salvar ${refeicao}` : 'Salvar refeição'}
              onPress={salvarRefeicao}
              desabilitado={selecionados.length === 0}
            />

            <Text style={[ui.secao, { marginTop: 8, marginBottom: 0 }]}>Alimentos</Text>
            {filtrosCatalogo}
            <View style={ui.card}>
              {catalogoFiltrado.length === 0 ? (
                <Vazio icone="search-off" texto="Nenhum alimento encontrado." />
              ) : (
                catalogoFiltrado.map((a, i) => {
                  const selecionado = selecionados.find(sel => sel.id === a.id);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[ui.linha, i === 0 && ui.linhaPrimeira]}
                      onPress={() => abrirQuantidade(a)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={ui.linhaTitulo}>{a.nome}</Text>
                        <Text style={ui.subtexto}>
                          {formatar(a.kcal)} kcal/100g{selecionado ? `  ·  ${selecionado.quantidade}g na lista` : ''}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={selecionado ? 'check-circle' : 'add-circle-outline'}
                        size={22}
                        color={selecionado ? HD.primary : c.subtexto}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
            <BotaoSecundario
              texto={busca.trim() ? `Cadastrar "${busca.trim()}"` : 'Não achou? Cadastre um novo alimento'}
              onPress={() => abrirForm()}
            />
          </>
        )}

        {/* ── Gerenciar dietas salvas ── */}
        {aba === 'gerenciar' && (
          <>
            <SeletorAluno alunos={alunos} valor={aluno} onChange={setAluno} />
            {!aluno ? (
              <Vazio icone="person-search" texto="Selecione um aluno para ver as dietas salvas." />
            ) : diasComDieta.length === 0 ? (
              <Vazio icone="restaurant" texto={`Nenhuma dieta cadastrada para ${aluno.nome}.`} />
            ) : (
              diasComDieta.map(d => {
                const doDia = plano[d] ?? {};
                // Refeições na ordem do dia; nomes fora da lista padrão vão para o fim
                const nomes = [
                  ...REFEICOES.filter(r => doDia[r]),
                  ...Object.keys(doDia).filter(r => !REFEICOES.includes(r)),
                ];
                const totalDia = somarNutrientes(nomes.flatMap(r => doDia[r]));
                return (
                  <View key={d} style={ui.card}>
                    <View style={s.diaHeader}>
                      <Text style={[ui.cardTitulo, { color: HD.primary, marginBottom: 0 }]}>{ROTULO_DIA[d]}</Text>
                      <Text style={ui.subtexto}>{Math.round(totalDia.kcal)} kcal  ·  {resumoMacros(totalDia)}</Text>
                    </View>
                    {nomes.map(nome => (
                      <View key={nome} style={s.refeicaoBox}>
                        <View style={s.refeicaoHeader}>
                          <Text style={[ui.linhaTitulo, { flex: 1 }]}>{nome}</Text>
                          <Text style={s.refeicaoKcal}>{Math.round(somarNutrientes(doDia[nome]).kcal)} kcal</Text>
                          <TouchableOpacity style={ui.acao} onPress={() => removerRefeicao(d, nome)} accessibilityLabel="Remover refeição">
                            <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                          </TouchableOpacity>
                        </View>
                        {doDia[nome].map(a => (
                          <View key={a.id} style={s.alimentoSalvo}>
                            <Text style={[ui.subtexto, { flex: 1 }]}>
                              {a.nome}  ·  {a.quantidade ?? 100}g  ·  {Math.round(((a.kcal ?? 0) * (a.quantidade ?? 100)) / 100)} kcal
                            </Text>
                            <TouchableOpacity
                              style={s.acaoPequena}
                              onPress={() => removerAlimentoDaRefeicao(d, nome, a)}
                              accessibilityLabel="Remover alimento"
                            >
                              <MaterialIcons name="close" size={16} color={c.subtexto} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── Catálogo de alimentos ── */}
        {aba === 'alimentos' && (
          <>
            <BotaoSecundario texto="Novo alimento" onPress={() => abrirForm()} />
            {filtrosCatalogo}
            <View style={ui.card}>
              {catalogoFiltrado.length === 0 ? (
                <Vazio icone="search-off" texto="Nenhum alimento encontrado." />
              ) : (
                catalogoFiltrado.map((a, i) => (
                  <View key={a.id} style={[ui.linha, i === 0 && ui.linhaPrimeira]}>
                    <View style={{ flex: 1 }}>
                      <Text style={ui.linhaTitulo}>{a.nome}</Text>
                      <Text style={ui.subtexto}>
                        {[a.categoria, `${formatar(a.kcal)} kcal/100g`].filter(Boolean).join('  ·  ')}
                      </Text>
                      <Text style={ui.subtexto}>{resumoMacros(a)}</Text>
                      {a.personalizado && (
                        <View style={ui.tag}><Text style={ui.tagTxt}>Cadastrado por você</Text></View>
                      )}
                    </View>
                    {a.personalizado && (
                      <>
                        <TouchableOpacity style={ui.acao} onPress={() => abrirForm(a)} accessibilityLabel="Editar alimento">
                          <MaterialIcons name="edit" size={20} color={HD.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={ui.acao} onPress={() => excluirAlimento(a)} accessibilityLabel="Excluir alimento">
                          <MaterialIcons name="delete-outline" size={22} color={HD.accent} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Modal único: quantidade do alimento ou cadastro/edição de alimento ── */}
      <Folha
        visivel={folhaAberta}
        titulo={
          modoFolha === 'quantidade' ? alimentoModal?.nome ?? '' : editandoId ? 'Editar alimento' : 'Novo alimento'
        }
        onFechar={() => setFolhaAberta(false)}
      >
        {modoFolha === 'quantidade' && alimentoModal && (
          <>
            <View>
              <Text style={ui.campoLabel}>Quantidade</Text>
              <View style={s.qtdRow}>
                <TouchableOpacity style={s.qtdBtn} onPress={() => ajustarQuantidade(-10)} accessibilityLabel="Menos 10 gramas">
                  <MaterialIcons name="remove" size={20} color={HD.white} />
                </TouchableOpacity>
                <TextInput
                  style={s.qtdInput}
                  keyboardType="number-pad"
                  value={quantidade}
                  onChangeText={t => setQuantidade(t.replace(/[^0-9]/g, ''))}
                  maxLength={4}
                />
                <Text style={s.qtdG}>g</Text>
                <TouchableOpacity style={s.qtdBtn} onPress={() => ajustarQuantidade(10)} accessibilityLabel="Mais 10 gramas">
                  <MaterialIcons name="add" size={20} color={HD.white} />
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text style={ui.campoLabel}>Macronutrientes</Text>
              {cartoesMacros(somarNutrientes([{ ...alimentoModal, quantidade: parseInt(quantidade, 10) || 0 }]))}
            </View>

            <View>
              <Text style={ui.campoLabel}>Micronutrientes</Text>
              <View style={s.microBox}>
                <View style={s.microRow}>
                  <Text style={ui.subtexto}>Fibras</Text>
                  <Text style={s.microValor}>{proporcional(alimentoModal.fibra)}g</Text>
                </View>
                <View style={s.microRow}>
                  <Text style={ui.subtexto}>Sódio</Text>
                  <Text style={s.microValor}>{proporcional(alimentoModal.sodio)}mg</Text>
                </View>
                <View style={s.microRow}>
                  <Text style={ui.subtexto}>Cálcio</Text>
                  <Text style={s.microValor}>{proporcional(alimentoModal.calcio)}mg</Text>
                </View>
                <View style={[s.microRow, { borderBottomWidth: 0 }]}>
                  <Text style={ui.subtexto}>Ferro</Text>
                  <Text style={s.microValor}>{proporcional(alimentoModal.ferro)}mg</Text>
                </View>
              </View>
              <Text style={[ui.subtexto, s.nota]}>
                Valores para {quantidade || 0}g (referência: {formatar(alimentoModal.kcal)} kcal por 100g).
              </Text>
            </View>

            <Botao texto={modalJaSelecionado ? 'Atualizar quantidade' : 'Adicionar à dieta'} onPress={confirmarQuantidade} />
            {modalJaSelecionado && (
              <TouchableOpacity
                style={s.removerBtn}
                onPress={() => { removerSelecionado(alimentoModal.id); setFolhaAberta(false); }}
              >
                <MaterialIcons name="delete-outline" size={18} color={HD.accent} />
                <Text style={s.removerTxt}>Remover da lista</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {modoFolha === 'form' && (
          <>
            <Campo
              label="Nome do alimento *"
              placeholder="Ex: Tapioca"
              value={form.nome}
              onChangeText={nome => setForm(f => ({ ...f, nome }))}
              maxLength={40}
            />
            <View>
              <Text style={ui.campoLabel}>Categoria *</Text>
              <Chips
                opcoes={CATEGORIAS_ALIMENTO}
                valor={form.categoria}
                onChange={categoria => setForm(f => ({ ...f, categoria }))}
              />
            </View>

            <View>
              <Text style={ui.secao}>Valores por 100g *</Text>
              <View style={s.grade}>
                {campoNumero('kcal', 'Calorias', 'kcal')}
                {campoNumero('carboidrato', 'Carboidratos', 'g')}
                {campoNumero('proteina', 'Proteínas', 'g')}
                {campoNumero('gordura', 'Gorduras', 'g')}
              </View>
              {kcalEstimada !== null && (
                <TouchableOpacity
                  style={s.estimativa}
                  onPress={() => setForm(f => ({ ...f, kcal: String(kcalEstimada) }))}
                >
                  <MaterialIcons name="calculate" size={16} color={HD.primary} />
                  <Text style={[ui.subtexto, { flex: 1 }]}>
                    Pelos macros seriam cerca de {kcalEstimada} kcal. Toque para usar esse valor.
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View>
              <Text style={ui.secao}>Micronutrientes por 100g (opcional)</Text>
              <View style={s.grade}>
                {campoNumero('fibra', 'Fibras', 'g')}
                {campoNumero('sodio', 'Sódio', 'mg')}
                {campoNumero('calcio', 'Cálcio', 'mg')}
                {campoNumero('ferro', 'Ferro', 'mg')}
              </View>
            </View>

            <Botao texto={editandoId ? 'Salvar alterações' : 'Cadastrar alimento'} onPress={salvarForm} />
          </>
        )}
      </Folha>
    </View>
  );
}

const estilos = (temaDark: boolean) => StyleSheet.create({
  // Macros
  macroRow: { flexDirection: 'row', gap: 8 },
  macroCard: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  macroValor: { fontSize: 15, fontWeight: '700' },
  macroLabel: { fontSize: 10, color: temaDark ? '#D1D5DB' : HD.textLight, marginTop: 2, textAlign: 'center' },

  // Gerenciar
  diaHeader: { gap: 2, marginBottom: 10 },
  refeicaoBox: {
    backgroundColor: temaDark ? '#1F2937' : HD.white, borderRadius: 14,
    paddingLeft: 12, paddingRight: 4, paddingVertical: 6, marginTop: 8,
  },
  refeicaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refeicaoKcal: { fontSize: 12, fontWeight: '700', color: temaDark ? HD.primary : HD.primaryDark },
  alimentoSalvo: { flexDirection: 'row', alignItems: 'center' },
  acaoPequena: { width: 34, height: 28, alignItems: 'center', justifyContent: 'center' },

  // Modal de quantidade
  qtdRow: { flexDirection: 'row', alignItems: 'center' },
  qtdBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: HD.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  qtdInput: {
    flex: 1, minWidth: 0, textAlign: 'center', fontSize: 20, fontWeight: '700',
    color: temaDark ? HD.white : HD.textDark,
    backgroundColor: temaDark ? '#111827' : '#F3F4F6',
    borderRadius: 12, marginHorizontal: 10, paddingVertical: 8, ...semContornoWeb,
  },
  qtdG: { fontSize: 15, fontWeight: '600', color: temaDark ? '#9CA3AF' : HD.textLight, marginRight: 10 },
  microBox: { backgroundColor: temaDark ? '#111827' : '#F3F4F6', borderRadius: 14, paddingHorizontal: 14 },
  microRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: temaDark ? '#374151' : HD.divider,
  },
  microValor: { fontSize: 13, fontWeight: '700', color: temaDark ? HD.white : HD.textDark },
  nota: { marginTop: 8, fontStyle: 'italic' },
  removerBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 6 },
  removerTxt: { color: HD.accent, fontSize: 13, fontWeight: '600' },

  // Formulário de alimento
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metade: { flexBasis: '47%', flexGrow: 1 },
  estimativa: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
});
