/**
 * constants/CatalogoEspecialista.ts
 * Catálogos de exercícios e alimentos gerenciados por personais e nutricionistas.
 *
 * - Enquanto ninguém altera nada, valem as listas padrão abaixo.
 * - Ao adicionar/editar/excluir, a lista completa passa a ser gravada no AsyncStorage
 *   e é usada pelas telas do especialista (e pela lista de alimentos do usuário).
 * - Planos já salvos (treinos/dietas) guardam uma cópia dos dados, então mudar o catálogo
 *   não altera o que já foi entregue aos alunos.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alimento } from '@/constants/Storage';

const KEY_EXERCICIOS = '@healthday:catalogo_exercicios';
const KEY_ALIMENTOS = '@healthday:catalogo_alimentos';

export interface ExercicioCatalogo {
  id: string;
  nome: string;
  grupo: string;
}

// Valores nutricionais por 100g
export interface AlimentoCatalogo {
  id: string;
  nome: string;
  kcal: number;
  carboidrato: number;
  proteina: number;
  gordura: number;
  fibra: number;
  sodio: number;   // mg
  calcio: number;  // mg
  ferro: number;   // mg
}

export const GRUPOS_MUSCULARES = ['Inferior', 'Peito', 'Costas', 'Bíceps', 'Tríceps', 'Ombro', 'Abdômen'];

// Valores de referência aproximados — confira com a tabela TACO antes de uso clínico
export const ALIMENTOS_PADRAO: AlimentoCatalogo[] = [
  { id: '1', nome: 'Uva Verde sem semente', kcal: 69, carboidrato: 18, proteina: 0.6, gordura: 0.2, fibra: 0.9, sodio: 2, calcio: 10, ferro: 0.3 },
  { id: '2', nome: 'Banana Prata', kcal: 89, carboidrato: 22.8, proteina: 1.1, gordura: 0.3, fibra: 2.6, sodio: 1, calcio: 5, ferro: 0.3 },
  { id: '3', nome: 'Maçã Gala', kcal: 52, carboidrato: 14, proteina: 0.3, gordura: 0.2, fibra: 2.4, sodio: 1, calcio: 6, ferro: 0.1 },
  { id: '4', nome: 'Pera Williams', kcal: 57, carboidrato: 15, proteina: 0.4, gordura: 0.1, fibra: 3.1, sodio: 1, calcio: 9, ferro: 0.2 },
  { id: '5', nome: 'Laranja-Pera', kcal: 47, carboidrato: 11.8, proteina: 0.9, gordura: 0.1, fibra: 2.4, sodio: 0, calcio: 40, ferro: 0.1 },
  { id: '6', nome: 'Batata Inglesa Cozida', kcal: 87, carboidrato: 20.1, proteina: 1.9, gordura: 0.1, fibra: 1.8, sodio: 4, calcio: 5, ferro: 0.3 },
  { id: '7', nome: 'Peito de Frango Grelhado', kcal: 165, carboidrato: 0, proteina: 31, gordura: 3.6, fibra: 0, sodio: 74, calcio: 15, ferro: 1 },
  { id: '8', nome: 'Arroz Branco', kcal: 130, carboidrato: 28.2, proteina: 2.7, gordura: 0.3, fibra: 0.4, sodio: 1, calcio: 10, ferro: 0.2 },
  { id: '9', nome: 'Feijão Cozido', kcal: 76, carboidrato: 13.6, proteina: 4.8, gordura: 0.5, fibra: 8.7, sodio: 2, calcio: 27, ferro: 1.5 },
  { id: '10', nome: 'Ovo Cozido', kcal: 155, carboidrato: 1.1, proteina: 13, gordura: 11, fibra: 0, sodio: 124, calcio: 50, ferro: 1.2 },
  { id: '11', nome: 'Aveia em Flocos', kcal: 389, carboidrato: 66.3, proteina: 16.9, gordura: 6.9, fibra: 10.6, sodio: 2, calcio: 54, ferro: 4.7 },
  { id: '12', nome: 'Iogurte Natural', kcal: 61, carboidrato: 4.7, proteina: 3.5, gordura: 3.3, fibra: 0, sodio: 46, calcio: 121, ferro: 0.1 },
  { id: '13', nome: 'Salmão Grelhado', kcal: 208, carboidrato: 0, proteina: 20, gordura: 13, fibra: 0, sodio: 59, calcio: 9, ferro: 0.3 },
  { id: '14', nome: 'Brócolis Cozido', kcal: 35, carboidrato: 7.2, proteina: 2.4, gordura: 0.4, fibra: 3.3, sodio: 41, calcio: 40, ferro: 0.7 },
  { id: '15', nome: 'Batata Doce', kcal: 86, carboidrato: 20.1, proteina: 1.6, gordura: 0.1, fibra: 3, sodio: 55, calcio: 30, ferro: 0.6 },
  // Alimentos que existem na dieta automática (Storage) — valores aproximados de referência
  { id: '16', nome: 'Pão Integral', kcal: 247, carboidrato: 41, proteina: 13, gordura: 3.4, fibra: 7, sodio: 450, calcio: 160, ferro: 2.5 },
  { id: '17', nome: 'Leite Desnatado', kcal: 35, carboidrato: 5, proteina: 3.4, gordura: 0.1, fibra: 0, sodio: 42, calcio: 125, ferro: 0 },
  { id: '18', nome: 'Atum em Lata', kcal: 130, carboidrato: 0, proteina: 26, gordura: 1, fibra: 0, sodio: 247, calcio: 11, ferro: 1 },
  { id: '19', nome: 'Azeite de Oliva', kcal: 884, carboidrato: 0, proteina: 0, gordura: 100, fibra: 0, sodio: 2, calcio: 1, ferro: 0.6 },
];

export const EXERCICIOS_PADRAO: ExercicioCatalogo[] = [
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

// ─── Permissões por especialidade ─────────────────────────────────────────────

export const ESPECIALIDADES = ['Personal Trainer', 'Nutricionista', 'Personal e Nutricionista'] as const;

/**
 * Personal → exercícios · Nutricionista → alimentos.
 * Especialidade vazia/desconhecida (ex.: conta de teste) libera os dois.
 */
export function permissoesCatalogo(especialidade?: string) {
  const e = (especialidade || '').toLowerCase();
  const nutri = e.includes('nutri');
  const personal = e.includes('personal') || e.includes('treinador') || e.includes('educador');
  if (!nutri && !personal) return { exercicios: true, alimentos: true };
  return { exercicios: personal, alimentos: nutri };
}

// ─── Exercícios ───────────────────────────────────────────────────────────────

export async function getExerciciosCatalogo(): Promise<ExercicioCatalogo[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_EXERCICIOS);
    return raw ? JSON.parse(raw) : EXERCICIOS_PADRAO;
  } catch {
    return EXERCICIOS_PADRAO;
  }
}

export async function salvarExerciciosCatalogo(lista: ExercicioCatalogo[]): Promise<void> {
  await AsyncStorage.setItem(KEY_EXERCICIOS, JSON.stringify(lista));
}

export async function restaurarExerciciosPadrao(): Promise<void> {
  await AsyncStorage.removeItem(KEY_EXERCICIOS);
}

// ─── Alimentos ────────────────────────────────────────────────────────────────

export async function getAlimentosCatalogo(): Promise<AlimentoCatalogo[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ALIMENTOS);
    return raw ? JSON.parse(raw) : ALIMENTOS_PADRAO;
  } catch {
    return ALIMENTOS_PADRAO;
  }
}

export async function salvarAlimentosCatalogo(lista: AlimentoCatalogo[]): Promise<void> {
  await AsyncStorage.setItem(KEY_ALIMENTOS, JSON.stringify(lista));
}

export async function restaurarAlimentosPadrao(): Promise<void> {
  await AsyncStorage.removeItem(KEY_ALIMENTOS);
}

/** Catálogo no formato simples do Storage (usado na lista "adicionar alimento extra" do usuário). */
export async function getAlimentosParaUsuario(): Promise<Alimento[]> {
  const lista = await getAlimentosCatalogo();
  return lista.map(a => ({ id: `cat_${a.id}`, nome: a.nome, kcalPor100g: a.kcal }));
}
