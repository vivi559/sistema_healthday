/**
 * constants/EspecialistaStorage.ts
 * Dados e persistência usados apenas pelas telas do especialista:
 * catálogo de exercícios e de alimentos (base + cadastrados pelo especialista),
 * treinos e dietas montados para cada aluno, respostas das solicitações
 * e as notícias publicadas para os usuários.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  atualizarNoticia,
  criarNoticia,
  deletarNoticia,
  getNoticias,
  getUsuarios,
  type Noticia,
  type User,
} from '@/constants/Storage';

// ─── Dias da semana ───────────────────────────────────────────────────────────

export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] as const;
export type Dia = (typeof DIAS)[number];

export const ROTULO_DIA: Record<Dia, string> = {
  Seg: 'Seg', Ter: 'Ter', Qua: 'Qua', Qui: 'Qui', Sex: 'Sex', Sab: 'Sáb', Dom: 'Dom',
};

// ─── Chaves ───────────────────────────────────────────────────────────────────

const KEYS = {
  EXERCICIOS: '@healthday:especialista:exercicios',
  ALIMENTOS:  '@healthday:especialista:alimentos',
  RESPOSTAS:  '@healthday:especialista:respostas',
  treino: (alunoId: string) => `@treino_especialista_${alunoId}`,
  dieta:  (alunoId: string) => `@dieta_especialista_${alunoId}`,
};

async function ler<T>(chave: string, padrao: T): Promise<T> {
  try {
    const dados = await AsyncStorage.getItem(chave);
    return dados ? (JSON.parse(dados) as T) : padrao;
  } catch {
    return padrao;
  }
}

async function gravar(chave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

function novoId(prefixo: string): string {
  return `${prefixo}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/** Converte texto digitado em número, aceitando vírgula ("12,5"). Vazio/inválido = NaN. */
export function paraNumero(texto: string): number {
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '') return NaN;
  return Number(limpo);
}

/** Formata número com no máximo 1 casa decimal, no padrão brasileiro. */
export function formatar(valor: number): string {
  return String(Math.round((valor || 0) * 10) / 10).replace('.', ',');
}

// ─── Alunos ───────────────────────────────────────────────────────────────────

export async function getAlunos(): Promise<User[]> {
  const usuarios = await getUsuarios();
  return usuarios.filter(u => u.role === 'usuario');
}

// ─── Catálogo de exercícios ───────────────────────────────────────────────────

export const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Inferior', 'Abdômen', 'Cardio',
];
export const EQUIPAMENTOS = ['Máquina', 'Barra', 'Halteres', 'Polia', 'Peso corporal', 'Outro'];

export const SERIES_OPTS = ['1', '2', '3', '4', '5', '6'];
export const REPS_OPTS = ['8', '10', '12', '15', '20', '30'];
export const INTERVALO_OPTS = ['30s', '45s', '1 Min', '1.5 Min', '2 Min', '3 Min'];

export interface ExercicioCatalogo {
  id: string;
  nome: string;
  grupo: string;
  equipamento?: string;
  seriesPadrao?: string;
  repsPadrao?: string;
  intervaloPadrao?: string;
  observacoes?: string;
  personalizado?: boolean; // true = cadastrado pelo especialista
}

export type DadosExercicio = Omit<ExercicioCatalogo, 'id' | 'personalizado'>;

const EXERCICIOS_BASE: ExercicioCatalogo[] = [
  { id: 'e1',  nome: 'Leg Press',         grupo: 'Inferior', equipamento: 'Máquina',       seriesPadrao: '4', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e2',  nome: 'Agachamento',       grupo: 'Inferior', equipamento: 'Barra',         seriesPadrao: '4', repsPadrao: '12', intervaloPadrao: '1.5 Min' },
  { id: 'e3',  nome: 'Cadeira Extensora', grupo: 'Inferior', equipamento: 'Máquina',       seriesPadrao: '3', repsPadrao: '15', intervaloPadrao: '45s' },
  { id: 'e4',  nome: 'Stiff',             grupo: 'Inferior', equipamento: 'Barra',         seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e5',  nome: 'Supino Reto',       grupo: 'Peito',    equipamento: 'Barra',         seriesPadrao: '4', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e6',  nome: 'Supino Inclinado',  grupo: 'Peito',    equipamento: 'Halteres',      seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e7',  nome: 'Crucifixo',         grupo: 'Peito',    equipamento: 'Halteres',      seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '45s' },
  { id: 'e8',  nome: 'Puxada Frontal',    grupo: 'Costas',   equipamento: 'Polia',         seriesPadrao: '4', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e9',  nome: 'Remada Curvada',    grupo: 'Costas',   equipamento: 'Barra',         seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '1 Min' },
  { id: 'e10', nome: 'Rosca Direta',      grupo: 'Bíceps',   equipamento: 'Barra',         seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '45s' },
  { id: 'e11', nome: 'Rosca Martelo',     grupo: 'Bíceps',   equipamento: 'Halteres',      seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '45s' },
  { id: 'e12', nome: 'Tríceps Corda',     grupo: 'Tríceps',  equipamento: 'Polia',         seriesPadrao: '3', repsPadrao: '12', intervaloPadrao: '45s' },
  { id: 'e13', nome: 'Desenvolvimento',   grupo: 'Ombro',    equipamento: 'Halteres',      seriesPadrao: '4', repsPadrao: '10', intervaloPadrao: '1 Min' },
  { id: 'e14', nome: 'Elevação Lateral',  grupo: 'Ombro',    equipamento: 'Halteres',      seriesPadrao: '3', repsPadrao: '15', intervaloPadrao: '45s' },
  { id: 'e15', nome: 'Prancha',           grupo: 'Abdômen',  equipamento: 'Peso corporal', seriesPadrao: '3', repsPadrao: '30', intervaloPadrao: '45s', observacoes: 'Isometria: as repetições são os segundos de sustentação.' },
];

/** Exercícios base + cadastrados pelo especialista (os cadastrados vêm primeiro). */
export async function getExercicios(): Promise<ExercicioCatalogo[]> {
  const proprios = await ler<ExercicioCatalogo[]>(KEYS.EXERCICIOS, []);
  return [...proprios, ...EXERCICIOS_BASE];
}

/** Cria (sem id) ou atualiza (com id) um exercício cadastrado pelo especialista. */
export async function salvarExercicio(dados: DadosExercicio, id?: string): Promise<ExercicioCatalogo> {
  const proprios = await ler<ExercicioCatalogo[]>(KEYS.EXERCICIOS, []);
  const exercicio: ExercicioCatalogo = { ...dados, id: id ?? novoId('ex'), personalizado: true };
  const novos = id
    ? proprios.map(e => (e.id === id ? exercicio : e))
    : [exercicio, ...proprios];
  await gravar(KEYS.EXERCICIOS, novos);
  return exercicio;
}

export async function removerExercicio(id: string): Promise<void> {
  const proprios = await ler<ExercicioCatalogo[]>(KEYS.EXERCICIOS, []);
  await gravar(KEYS.EXERCICIOS, proprios.filter(e => e.id !== id));
}

// ─── Catálogo de alimentos (valores por 100g) ─────────────────────────────────

export const CATEGORIAS_ALIMENTO = [
  'Frutas', 'Proteínas', 'Carboidratos', 'Vegetais', 'Laticínios', 'Gorduras', 'Outros',
];

export interface AlimentoCatalogo {
  id: string;
  nome: string;
  categoria?: string;
  kcal: number;
  carboidrato: number; // g
  proteina: number;    // g
  gordura: number;     // g
  fibra: number;       // g
  sodio: number;       // mg
  calcio: number;      // mg
  ferro: number;       // mg
  personalizado?: boolean; // true = cadastrado pelo especialista
}

export type DadosAlimento = Omit<AlimentoCatalogo, 'id' | 'personalizado'>;

const ALIMENTOS_BASE: AlimentoCatalogo[] = [
  { id: '1',  nome: 'Uva Verde sem semente',    categoria: 'Frutas',       kcal: 69,  carboidrato: 18,   proteina: 0.6,  gordura: 0.2, fibra: 0.9,  sodio: 2,   calcio: 10,  ferro: 0.3 },
  { id: '2',  nome: 'Banana Prata',             categoria: 'Frutas',       kcal: 89,  carboidrato: 22.8, proteina: 1.1,  gordura: 0.3, fibra: 2.6,  sodio: 1,   calcio: 5,   ferro: 0.3 },
  { id: '3',  nome: 'Maçã Gala',                categoria: 'Frutas',       kcal: 52,  carboidrato: 14,   proteina: 0.3,  gordura: 0.2, fibra: 2.4,  sodio: 1,   calcio: 6,   ferro: 0.1 },
  { id: '4',  nome: 'Pera Williams',            categoria: 'Frutas',       kcal: 57,  carboidrato: 15,   proteina: 0.4,  gordura: 0.1, fibra: 3.1,  sodio: 1,   calcio: 9,   ferro: 0.2 },
  { id: '5',  nome: 'Laranja-Pera',             categoria: 'Frutas',       kcal: 47,  carboidrato: 11.8, proteina: 0.9,  gordura: 0.1, fibra: 2.4,  sodio: 0,   calcio: 40,  ferro: 0.1 },
  { id: '6',  nome: 'Batata Inglesa Cozida',    categoria: 'Carboidratos', kcal: 87,  carboidrato: 20.1, proteina: 1.9,  gordura: 0.1, fibra: 1.8,  sodio: 4,   calcio: 5,   ferro: 0.3 },
  { id: '7',  nome: 'Peito de Frango Grelhado', categoria: 'Proteínas',    kcal: 165, carboidrato: 0,    proteina: 31,   gordura: 3.6, fibra: 0,    sodio: 74,  calcio: 15,  ferro: 1 },
  { id: '8',  nome: 'Arroz Branco',             categoria: 'Carboidratos', kcal: 130, carboidrato: 28.2, proteina: 2.7,  gordura: 0.3, fibra: 0.4,  sodio: 1,   calcio: 10,  ferro: 0.2 },
  { id: '9',  nome: 'Feijão Cozido',            categoria: 'Carboidratos', kcal: 76,  carboidrato: 13.6, proteina: 4.8,  gordura: 0.5, fibra: 8.7,  sodio: 2,   calcio: 27,  ferro: 1.5 },
  { id: '10', nome: 'Ovo Cozido',               categoria: 'Proteínas',    kcal: 155, carboidrato: 1.1,  proteina: 13,   gordura: 11,  fibra: 0,    sodio: 124, calcio: 50,  ferro: 1.2 },
  { id: '11', nome: 'Aveia em Flocos',          categoria: 'Carboidratos', kcal: 389, carboidrato: 66.3, proteina: 16.9, gordura: 6.9, fibra: 10.6, sodio: 2,   calcio: 54,  ferro: 4.7 },
  { id: '12', nome: 'Iogurte Natural',          categoria: 'Laticínios',   kcal: 61,  carboidrato: 4.7,  proteina: 3.5,  gordura: 3.3, fibra: 0,    sodio: 46,  calcio: 121, ferro: 0.1 },
  { id: '13', nome: 'Salmão Grelhado',          categoria: 'Proteínas',    kcal: 208, carboidrato: 0,    proteina: 20,   gordura: 13,  fibra: 0,    sodio: 59,  calcio: 9,   ferro: 0.3 },
  { id: '14', nome: 'Brócolis Cozido',          categoria: 'Vegetais',     kcal: 35,  carboidrato: 7.2,  proteina: 2.4,  gordura: 0.4, fibra: 3.3,  sodio: 41,  calcio: 40,  ferro: 0.7 },
  { id: '15', nome: 'Batata Doce',              categoria: 'Carboidratos', kcal: 86,  carboidrato: 20.1, proteina: 1.6,  gordura: 0.1, fibra: 3,    sodio: 55,  calcio: 30,  ferro: 0.6 },
];

/** Alimentos base + cadastrados pelo especialista (os cadastrados vêm primeiro). */
export async function getAlimentos(): Promise<AlimentoCatalogo[]> {
  const proprios = await ler<AlimentoCatalogo[]>(KEYS.ALIMENTOS, []);
  return [...proprios, ...ALIMENTOS_BASE];
}

/** Cria (sem id) ou atualiza (com id) um alimento cadastrado pelo especialista. */
export async function salvarAlimento(dados: DadosAlimento, id?: string): Promise<AlimentoCatalogo> {
  const proprios = await ler<AlimentoCatalogo[]>(KEYS.ALIMENTOS, []);
  const alimento: AlimentoCatalogo = { ...dados, id: id ?? novoId('al'), personalizado: true };
  const novos = id
    ? proprios.map(a => (a.id === id ? alimento : a))
    : [alimento, ...proprios];
  await gravar(KEYS.ALIMENTOS, novos);
  return alimento;
}

export async function removerAlimento(id: string): Promise<void> {
  const proprios = await ler<AlimentoCatalogo[]>(KEYS.ALIMENTOS, []);
  await gravar(KEYS.ALIMENTOS, proprios.filter(a => a.id !== id));
}

// ─── Treino montado para o aluno ──────────────────────────────────────────────

export interface ItemTreino {
  id: string;
  exercicio: Pick<ExercicioCatalogo, 'id' | 'nome' | 'grupo' | 'equipamento' | 'observacoes'>;
  series: string;
  reps: string;
  intervalo: string;
}

export type TreinoAluno = Partial<Record<Dia, ItemTreino[]>>;

export async function getTreinoAluno(alunoId: string): Promise<TreinoAluno> {
  return ler<TreinoAluno>(KEYS.treino(alunoId), {});
}

export async function salvarTreinoAluno(alunoId: string, treino: TreinoAluno): Promise<void> {
  await gravar(KEYS.treino(alunoId), treino);
}

// ─── Dieta montada para o aluno ───────────────────────────────────────────────

export const REFEICOES = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Janta', 'Outros'];

export type AlimentoDieta = AlimentoCatalogo & { quantidade: number }; // quantidade em gramas

export type DietaAluno = Partial<Record<Dia, Record<string, AlimentoDieta[]>>>;

export async function getDietaAluno(alunoId: string): Promise<DietaAluno> {
  return ler<DietaAluno>(KEYS.dieta(alunoId), {});
}

export async function salvarDietaAluno(alunoId: string, dieta: DietaAluno): Promise<void> {
  await gravar(KEYS.dieta(alunoId), dieta);
}

/** Soma kcal e macros de uma lista de alimentos, proporcional à quantidade de cada um. */
export function somarNutrientes(alimentos: AlimentoDieta[]) {
  return alimentos.reduce(
    (total, a) => {
      const fator = (a.quantidade ?? 100) / 100;
      return {
        kcal:        total.kcal        + (a.kcal ?? 0) * fator,
        carboidrato: total.carboidrato + (a.carboidrato ?? 0) * fator,
        proteina:    total.proteina    + (a.proteina ?? 0) * fator,
        gordura:     total.gordura     + (a.gordura ?? 0) * fator,
      };
    },
    { kcal: 0, carboidrato: 0, proteina: 0, gordura: 0 },
  );
}

// ─── Respostas das solicitações ───────────────────────────────────────────────
// O status fica na própria solicitação (Storage.ts); o texto da resposta fica aqui.

export async function getRespostas(): Promise<Record<string, string>> {
  return ler<Record<string, string>>(KEYS.RESPOSTAS, {});
}

export async function salvarResposta(solicitacaoId: string, texto: string): Promise<void> {
  const respostas = await getRespostas();
  if (texto.trim()) respostas[solicitacaoId] = texto.trim();
  else delete respostas[solicitacaoId];
  await gravar(KEYS.RESPOSTAS, respostas);
}

// ─── Notícias ─────────────────────────────────────────────────────────────────
// As notícias ficam no mesmo lugar que a home do usuário lê (Storage.ts), então
// tudo o que o especialista publica aparece direto para os usuários.
// Os campos extras (subtítulo, fontes, fotos...) são opcionais: notícias antigas
// continuam funcionando e a home mostra os campos básicos mesmo sem conhecê-los.

export type CategoriaNoticia = Noticia['categoria'];

export const CATEGORIAS_NOTICIA: CategoriaNoticia[] = ['alimentacao', 'exercicio', 'saude'];

export const ROTULO_CATEGORIA: Record<CategoriaNoticia, string> = {
  alimentacao: 'Alimentação',
  exercicio: 'Exercício',
  saude: 'Saúde',
};

/** Mesmas cores de categoria usadas na home do usuário. */
export const COR_CATEGORIA: Record<CategoriaNoticia, string> = {
  alimentacao: '#A7F3D0',
  exercicio: '#FED7AA',
  saude: '#E0E7FF',
};

export interface FonteNoticia {
  nome: string; // ex: "Organização Mundial da Saúde (OMS)"
  url?: string; // link para a publicação original
}

export interface FotoNoticia {
  uri: string;
  legenda?: string;
}

export interface NoticiaCompleta extends Noticia {
  subtitulo?: string;
  creditoImagem?: string;
  fontes?: FonteNoticia[];
  fotos?: FotoNoticia[];
  atualizadaEm?: string; // AAAA-MM-DD
}

export type DadosNoticia = Omit<NoticiaCompleta, 'id' | 'criadaEm' | 'atualizadaEm'>;

export const MAX_FOTOS_EXTRAS = 3;

export async function getNoticiasCompletas(): Promise<NoticiaCompleta[]> {
  return (await getNoticias()) as NoticiaCompleta[];
}

/** Publica uma notícia nova (sem id) ou salva a edição de uma existente (com id). */
export async function salvarNoticia(dados: DadosNoticia, id?: string): Promise<void> {
  if (!id) {
    await criarNoticia(dados);
    return;
  }
  const atual = (await getNoticiasCompletas()).find(n => n.id === id);
  if (!atual) throw new Error('Notícia não encontrada');
  const editada: NoticiaCompleta = {
    ...dados,
    id,
    criadaEm: atual.criadaEm,
    atualizadaEm: new Date().toISOString().split('T')[0],
  };
  await atualizarNoticia(editada);
}

export async function removerNoticia(id: string): Promise<void> {
  await deletarNoticia(id);
}

/** "2025-01-10" → "10/01/2025". Outros formatos voltam como vieram. */
export function formatarDataBR(data?: string): string {
  if (!data) return '';
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : data;
}

/** Tempo estimado de leitura, contando ~200 palavras por minuto. */
export function tempoLeitura(texto: string): string {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(palavras / 200))} min de leitura`;
}

export function linkValido(url: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(url.trim());
}
