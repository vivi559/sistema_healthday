/**
 * constants/CandidaturaStorage.ts
 * Candidaturas da tela "Seja um Profissional": dados de pré-seleção que o
 * usuário envia para se tornar especialista no Health Day.
 *
 * Cada usuário tem no máximo uma candidatura; enviar de novo substitui a anterior.
 * Quando o banco de dados entrar, só este arquivo precisa mudar.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@healthday:candidaturas';

export type StatusCandidatura = 'em_analise' | 'aprovada' | 'recusada';

export const ROTULO_STATUS_CANDIDATURA: Record<StatusCandidatura, string> = {
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  recusada: 'Não aprovada',
};

export const AREAS_ATUACAO = ['Nutrição', 'Educação Física', 'Fisioterapia', 'Psicologia', 'Outra'];
export const TEMPOS_EXPERIENCIA = ['Estudante', 'Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'];
export const DISPONIBILIDADES = ['Manhã', 'Tarde', 'Noite', 'Fins de semana'];

/** Tamanho máximo do currículo: 2 MB. */
export const TAMANHO_MAXIMO_CURRICULO = 2 * 1024 * 1024;

export interface ArquivoCurriculo {
  nome: string;
  tipo: string;     // ex: application/pdf
  tamanho: number;  // em bytes
  uri: string;      // no navegador: o arquivo em texto (data URL); no celular: caminho do arquivo
}

export interface Candidatura {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  telefone: string;
  cidade?: string;
  area: string;            // uma das AREAS_ATUACAO, ou o texto digitado em "Outra"
  registro?: string;       // CRN, CREF, CREFITO, CRP...
  formacao: string;
  experiencia: string;     // um dos TEMPOS_EXPERIENCIA
  objetivos: string;       // objetivos na empresa
  disponibilidade: string[];
  linkedin?: string;
  curriculo: ArquivoCurriculo;
  aceiteDados: boolean;    // autorização de uso dos dados (LGPD)
  status: StatusCandidatura;
  criadoEm: string;        // ISO
  atualizadoEm?: string;   // ISO
}

export type DadosCandidatura = Omit<Candidatura, 'id' | 'status' | 'criadoEm' | 'atualizadoEm'>;

async function lerTodas(): Promise<Candidatura[]> {
  try {
    const dados = await AsyncStorage.getItem(CHAVE);
    return dados ? (JSON.parse(dados) as Candidatura[]) : [];
  } catch {
    return [];
  }
}

export async function getCandidaturaUsuario(usuarioId: string): Promise<Candidatura | null> {
  return (await lerTodas()).find(c => c.usuarioId === usuarioId) ?? null;
}

/** Envia a candidatura. Se o usuário já tinha uma, ela é atualizada e volta para "em análise". */
export async function enviarCandidatura(dados: DadosCandidatura): Promise<Candidatura> {
  const todas = await lerTodas();
  const anterior = todas.find(c => c.usuarioId === dados.usuarioId);
  const agora = new Date().toISOString();
  const candidatura: Candidatura = {
    ...dados,
    id: anterior?.id ?? `cand_${Date.now().toString(36)}`,
    status: 'em_analise',
    criadoEm: anterior?.criadoEm ?? agora,
    atualizadoEm: anterior ? agora : undefined,
  };
  const outras = todas.filter(c => c.usuarioId !== dados.usuarioId);
  await AsyncStorage.setItem(CHAVE, JSON.stringify([candidatura, ...outras]));
  return candidatura;
}

export async function cancelarCandidatura(usuarioId: string): Promise<void> {
  const todas = await lerTodas();
  await AsyncStorage.setItem(CHAVE, JSON.stringify(todas.filter(c => c.usuarioId !== usuarioId)));
}

// ─── Validações e formatos ────────────────────────────────────────────────────

/** "11987654321" → "(11) 98765-4321", aplicado enquanto a pessoa digita. */
export function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

export function linkValido(valor: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(valor.trim());
}

/** 1536000 → "1,5 MB" */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** "2026-11-18T13:00:00.000Z" → "18/11/2026" */
export function formatarDataCandidatura(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
