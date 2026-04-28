/**
 * constants/Storage.ts
 * Mock de dados e funções de persistência com AsyncStorage.
 * Substitui um backend real — fácil de migrar para MongoDB/Firebase depois.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'usuario' | 'especialista' | 'admin';

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  cidade?: string;
  estado?: string;
  pais?: string;
  altura?: number;   // em cm
  peso?: number;     // em kg
  imc?: number;
  objetivo?: 'perda' | 'ganho' | 'manutencao';
  temaDark?: boolean;
  questionarioFeito?: boolean; // ← se já respondeu o questionário
  createdAt: string;
}

// ─── Questionário ─────────────────────────────────────────────────────────────

export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso';
export type RestricaoAlimentar = 'nenhuma' | 'vegetariano' | 'vegano' | 'semGluten' | 'semLactose';
export type NivelTreino = 'iniciante' | 'intermediario' | 'avancado';
export type LocalTreino = 'academia' | 'casa' | 'ar_livre';

export interface RespostasQuestionario {
  usuarioId: string;
  // Dados físicos
  peso: number;
  altura: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  // Objetivos
  objetivo: 'perda' | 'ganho' | 'manutencao';
  nivelAtividade: NivelAtividade;
  // Alimentação
  restricao: RestricaoAlimentar;
  refeicoesPorDia: 3 | 4 | 5;
  // Treino
  nivelTreino: NivelTreino;
  localTreino: LocalTreino;
  diasTreino: number; // 2, 3, 4 ou 5 dias
}

// ─── Solicitação ao especialista ──────────────────────────────────────────────

export type StatusSolicitacao = 'pendente' | 'em_andamento' | 'concluida';

export interface SolicitacaoEspecialista {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: 'dieta' | 'treino' | 'ambos';
  mensagem?: string;
  status: StatusSolicitacao;
  criadoEm: string;
}

export interface Exercicio {
  id: string;
  nome: string;
  series: number;
  reps: number;
  intervalo: string;
  icone?: string;
}

export interface GrupoTreino {
  id: string;
  nome: string;
  exercicios: Exercicio[];
}

export interface TreinoDia {
  diaSemana: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab' | 'Dom';
  grupos: GrupoTreino[];
  concluido?: boolean;
  data?: string;
}

export interface Alimento {
  id: string;
  nome: string;
  kcalPor100g: number;
  quantidade?: number;
}

export interface ItemRefeicao {
  alimento: Alimento;
  gramas: number;
  extra?: boolean; // ← true se foi adicionado pelo usuário fora do plano
}

export interface RefeicaoDieta {
  tipo: 'Café da Manhã' | 'Almoço' | 'Lanche da Tarde' | 'Janta' | 'Outros';
  alimentos: ItemRefeicao[];
}

export interface Dieta {
  id: string;
  usuarioId: string;
  titulo: string;
  carboTotal: number;
  proteinasTotal: number;
  gordurasTotal: number;
  kcalTotal: number;
  refeicoes: RefeicaoDieta[];
  automatica?: boolean;       // ← true = gerada pelo questionário
  especialistaId?: string;    // ← preenchido quando especialista cria/edita
}

export interface Lembrete {
  id: string;
  usuarioId: string;
  texto: string;
  data: string;
  hora: string;
}

export interface Noticia {
  id: string;
  titulo: string;
  imagem: string;
  categoria: 'alimentacao' | 'exercicio' | 'saude';
}

// ─── Chaves do AsyncStorage ───────────────────────────────────────────────────

const KEYS = {
  USUARIOS:        '@healthday:usuarios',
  USER_ATUAL:      '@healthday:userAtual',
  TREINOS:         '@healthday:treinos',
  DIETAS:          '@healthday:dietas',
  LEMBRETES:       '@healthday:lembretes',
  TEMA:            '@healthday:tema',
  QUESTIONARIOS:   '@healthday:questionarios',
  SOLICITACOES:    '@healthday:solicitacoes',
};

// ─── Dados iniciais (seed) ────────────────────────────────────────────────────

const usuariosSeed: User[] = [
  {
    id: '0001',
    nome: 'Jonas Duzzo',
    email: 'jonas@email.com',
    senha: '123456',
    role: 'usuario',
    cidade: 'Itapira',
    estado: 'São Paulo',
    pais: 'Brasil',
    altura: 175,
    peso: 75,
    imc: 24.5,
    objetivo: 'manutencao',
    temaDark: false,
    questionarioFeito: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '0002',
    nome: 'Dr. Silva',
    email: 'especialista@email.com',
    senha: '123456',
    role: 'especialista',
    createdAt: new Date().toISOString(),
  },
  {
    id: '0003',
    nome: 'Admin',
    email: 'admin@email.com',
    senha: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

export const alimentosSeed: Alimento[] = [
  { id: 'a1',  nome: 'Uva Verde sem semente',    kcalPor100g: 70  },
  { id: 'a2',  nome: 'Banana Prata',              kcalPor100g: 90  },
  { id: 'a3',  nome: 'Maçã Gala',                 kcalPor100g: 55  },
  { id: 'a4',  nome: 'Pera Williams',             kcalPor100g: 60  },
  { id: 'a5',  nome: 'Laranja-Pera',              kcalPor100g: 50  },
  { id: 'a6',  nome: 'Batata Inglesa Cozida',     kcalPor100g: 85  },
  { id: 'a7',  nome: 'Peito de Frango Grelhado',  kcalPor100g: 160 },
  { id: 'a8',  nome: 'Arroz Branco',              kcalPor100g: 130 },
  { id: 'a9',  nome: 'Feijão Carioca',            kcalPor100g: 80  },
  { id: 'a10', nome: 'Ovo Cozido',                kcalPor100g: 155 },
  { id: 'a11', nome: 'Aveia em Flocos',           kcalPor100g: 389 },
  { id: 'a12', nome: 'Pão Integral',              kcalPor100g: 247 },
  { id: 'a13', nome: 'Leite Desnatado',           kcalPor100g: 35  },
  { id: 'a14', nome: 'Iogurte Natural',           kcalPor100g: 59  },
  { id: 'a15', nome: 'Atum em Lata',              kcalPor100g: 130 },
  { id: 'a16', nome: 'Batata Doce Cozida',        kcalPor100g: 76  },
  { id: 'a17', nome: 'Brócolis Cozido',           kcalPor100g: 35  },
  { id: 'a18', nome: 'Azeite de Oliva',           kcalPor100g: 884 },
];

const dietaSeed: Dieta = {
  id: 'd1',
  usuarioId: '0001',
  titulo: '2700Kcal Rica em vegetais',
  carboTotal: 187.8,
  proteinasTotal: 150,
  gordurasTotal: 30,
  kcalTotal: 2100,
  automatica: true,
  refeicoes: [
    {
      tipo: 'Café da Manhã',
      alimentos: [
        { alimento: alimentosSeed[2], gramas: 150 },
        { alimento: alimentosSeed[1], gramas: 100 },
      ],
    },
    {
      tipo: 'Almoço',
      alimentos: [
        { alimento: alimentosSeed[7], gramas: 150 },
        { alimento: alimentosSeed[8], gramas: 100 },
        { alimento: alimentosSeed[6], gramas: 150 },
      ],
    },
    {
      tipo: 'Lanche da Tarde',
      alimentos: [
        { alimento: alimentosSeed[0], gramas: 100 },
        { alimento: alimentosSeed[3], gramas: 150 },
      ],
    },
    {
      tipo: 'Janta',
      alimentos: [
        { alimento: alimentosSeed[7], gramas: 150 },
        { alimento: alimentosSeed[6], gramas: 150 },
        { alimento: alimentosSeed[8], gramas: 100 },
        { alimento: alimentosSeed[1], gramas: 80  },
      ],
    },
    {
      tipo: 'Outros',
      alimentos: [
        { alimento: alimentosSeed[4], gramas: 100 },
      ],
    },
  ],
};

const treinosSeed: TreinoDia[] = [
  {
    diaSemana: 'Seg',
    grupos: [
      {
        id: 'g1',
        nome: 'Treino A - Superiores',
        exercicios: [
          { id: 'e1', nome: 'Supino Reto',    series: 4, reps: 12, intervalo: '1 Min' },
          { id: 'e2', nome: 'Puxada Frontal', series: 4, reps: 12, intervalo: '1 Min' },
        ],
      },
    ],
  },
  {
    diaSemana: 'Qua',
    grupos: [
      {
        id: 'g2',
        nome: 'Treino A - Inferiores',
        exercicios: [
          { id: 'e3', nome: 'Leg Press',   series: 4, reps: 12, intervalo: '1 Min' },
          { id: 'e4', nome: 'Agachamento', series: 4, reps: 12, intervalo: '1 Min' },
        ],
      },
      {
        id: 'g3',
        nome: 'Treino B - Inferiores',
        exercicios: [
          { id: 'e5', nome: 'Cadeira Extensora', series: 3, reps: 15, intervalo: '45 Seg' },
          { id: 'e6', nome: 'Mesa Flexora',      series: 3, reps: 15, intervalo: '45 Seg' },
        ],
      },
    ],
  },
  {
    diaSemana: 'Sex',
    grupos: [
      {
        id: 'g4',
        nome: 'Treino C - Ombros e Braços',
        exercicios: [
          { id: 'e7', nome: 'Desenvolvimento', series: 4, reps: 10, intervalo: '1 Min'  },
          { id: 'e8', nome: 'Rosca Direta',    series: 3, reps: 12, intervalo: '45 Seg' },
          { id: 'e9', nome: 'Tríceps Corda',   series: 3, reps: 12, intervalo: '45 Seg' },
        ],
      },
    ],
  },
];

const noticiasSeed: Noticia[] = [
  {
    id: 'n1',
    titulo: 'Ultraprocessados induzem jovens a comer mesmo sem sentir fome, aponta estudo.',
    imagem: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    categoria: 'alimentacao',
  },
  {
    id: 'n2',
    titulo: 'OMS indica até 300 minutos de atividade física semanal; relembre benefícios do exercício.',
    imagem: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    categoria: 'exercicio',
  },
  {
    id: 'n3',
    titulo: 'Alerta nutricional em embalagens pode prevenir obesidade, aponta estudo.',
    imagem: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=400',
    categoria: 'saude',
  },
];

// ─── Inicialização ────────────────────────────────────────────────────────────

export async function inicializarStorage(): Promise<void> {
  try {
    const usuariosExistentes = await AsyncStorage.getItem(KEYS.USUARIOS);
    if (!usuariosExistentes)
      await AsyncStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuariosSeed));

    const dietasExistentes = await AsyncStorage.getItem(KEYS.DIETAS);
    if (!dietasExistentes)
      await AsyncStorage.setItem(KEYS.DIETAS, JSON.stringify([dietaSeed]));

    const treinosExistentes = await AsyncStorage.getItem(KEYS.TREINOS);
    if (!treinosExistentes)
      await AsyncStorage.setItem(KEYS.TREINOS, JSON.stringify(treinosSeed));
  } catch (e) {
    console.error('Erro ao inicializar storage:', e);
  }
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export async function getUsuarios(): Promise<User[]> {
  const data = await AsyncStorage.getItem(KEYS.USUARIOS);
  return data ? JSON.parse(data) : [];
}

export async function getUserAtual(): Promise<User | null> {
  const data = await AsyncStorage.getItem(KEYS.USER_ATUAL);
  return data ? JSON.parse(data) : null;
}

export async function setUserAtual(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_ATUAL, JSON.stringify(user));
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER_ATUAL);
}

export async function login(email: string, senha: string): Promise<User | null> {
  const usuarios = await getUsuarios();
  const user = usuarios.find(u => u.email === email && u.senha === senha);
  if (user) await setUserAtual(user);
  return user || null;
}

export async function cadastrarUsuario(
  dados: Omit<User, 'id' | 'createdAt' | 'role'>
): Promise<User> {
  const usuarios = await getUsuarios();
  const novoId = String(usuarios.length + 1).padStart(4, '0');
  const novoUsuario: User = {
    ...dados,
    id: novoId,
    role: 'usuario',
    questionarioFeito: false,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEYS.USUARIOS, JSON.stringify([...usuarios, novoUsuario]));
  await setUserAtual(novoUsuario);
  return novoUsuario;
}

export async function atualizarUsuario(usuarioAtualizado: User): Promise<void> {
  const usuarios = await getUsuarios();
  const novos = usuarios.map(u =>
    u.id === usuarioAtualizado.id ? usuarioAtualizado : u
  );
  await AsyncStorage.setItem(KEYS.USUARIOS, JSON.stringify(novos));
  await setUserAtual(usuarioAtualizado);
}

// ─── Questionário ─────────────────────────────────────────────────────────────

export async function salvarQuestionario(
  respostas: RespostasQuestionario
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.QUESTIONARIOS);
  const todos: RespostasQuestionario[] = data ? JSON.parse(data) : [];
  const index = todos.findIndex(q => q.usuarioId === respostas.usuarioId);
  if (index >= 0) todos[index] = respostas;
  else todos.push(respostas);
  await AsyncStorage.setItem(KEYS.QUESTIONARIOS, JSON.stringify(todos));
}

export async function getQuestionario(
  usuarioId: string
): Promise<RespostasQuestionario | null> {
  const data = await AsyncStorage.getItem(KEYS.QUESTIONARIOS);
  const todos: RespostasQuestionario[] = data ? JSON.parse(data) : [];
  return todos.find(q => q.usuarioId === usuarioId) || null;
}

// ─── Gerador automático de dieta ──────────────────────────────────────────────

export function gerarDietaAutomatica(
  r: RespostasQuestionario,
  usuarioId: string
): Dieta {
  // Calcula TMB (Harris-Benedict)
  let tmb =
    r.sexo === 'masculino'
      ? 88.36 + 13.4 * r.peso + 4.8 * r.altura - 5.7 * r.idade
      : 447.6 + 9.2 * r.peso + 3.1 * r.altura - 4.3 * r.idade;

  const fatores: Record<NivelAtividade, number> = {
    sedentario: 1.2,
    leve:       1.375,
    moderado:   1.55,
    intenso:    1.725,
  };
  let kcal = Math.round(tmb * fatores[r.nivelAtividade]);
  if (r.objetivo === 'perda')  kcal -= 400;
  if (r.objetivo === 'ganho')  kcal += 400;

  const proteinas = Math.round(r.peso * 1.8);
  const gorduras  = Math.round((kcal * 0.25) / 9);
  const carbo     = Math.round((kcal - proteinas * 4 - gorduras * 9) / 4);

  // Seleciona alimentos respeitando restrições
  const permitidos = alimentosSeed.filter(a => {
    if (r.restricao === 'vegetariano' || r.restricao === 'vegano') {
      return !['Peito de Frango Grelhado', 'Atum em Lata', 'Ovo Cozido'].includes(a.nome);
    }
    if (r.restricao === 'semLactose') {
      return !['Leite Desnatado', 'Iogurte Natural'].includes(a.nome);
    }
    return true;
  });

  function pick(ids: string[]): Alimento {
    const found = permitidos.find(a => ids.includes(a.id));
    return found || permitidos[0];
  }

  const refeicoes: RefeicaoDieta[] = [];

  // Café da manhã — sempre
  refeicoes.push({
    tipo: 'Café da Manhã',
    alimentos: [
      { alimento: pick(['a11', 'a12']), gramas: 80 },
      { alimento: pick(['a2',  'a3']),  gramas: 100 },
      { alimento: pick(['a13', 'a14']), gramas: 200 },
    ],
  });

  // Lanche da manhã — se ≥ 4 refeições
  if (r.refeicoesPorDia >= 4) {
    refeicoes.push({
      tipo: 'Outros',
      alimentos: [
        { alimento: pick(['a3', 'a4']),  gramas: 150 },
        { alimento: pick(['a10', 'a2']), gramas: 60  },
      ],
    });
  }

  // Almoço
  refeicoes.push({
    tipo: 'Almoço',
    alimentos: [
      { alimento: pick(['a7', 'a15']), gramas: 150 },
      { alimento: pick(['a8', 'a16']), gramas: 150 },
      { alimento: pick(['a9']),        gramas: 100 },
      { alimento: pick(['a17']),       gramas: 80  },
    ],
  });

  // Lanche da tarde — se ≥ 4 refeições
  if (r.refeicoesPorDia >= 4) {
    refeicoes.push({
      tipo: 'Lanche da Tarde',
      alimentos: [
        { alimento: pick(['a14', 'a13']), gramas: 150 },
        { alimento: pick(['a1',  'a5']),  gramas: 100 },
      ],
    });
  }

  // Janta
  refeicoes.push({
    tipo: 'Janta',
    alimentos: [
      { alimento: pick(['a7', 'a15']), gramas: 150 },
      { alimento: pick(['a16', 'a6']), gramas: 150 },
      { alimento: pick(['a17']),       gramas: 80  },
    ],
  });

  // Ceia — se 5 refeições
  if (r.refeicoesPorDia === 5) {
    refeicoes.push({
      tipo: 'Outros',
      alimentos: [
        { alimento: pick(['a14', 'a13']), gramas: 200 },
      ],
    });
  }

  const objetivoLabel: Record<string, string> = {
    perda:      'Emagrecimento',
    ganho:      'Ganho de Massa',
    manutencao: 'Manutenção',
  };

  return {
    id: `dieta_${usuarioId}_${Date.now()}`,
    usuarioId,
    titulo: `${kcal}Kcal — ${objetivoLabel[r.objetivo]}`,
    carboTotal: carbo,
    proteinasTotal: proteinas,
    gordurasTotal: gorduras,
    kcalTotal: kcal,
    automatica: true,
    refeicoes,
  };
}

// ─── Gerador automático de treino ─────────────────────────────────────────────

export function gerarTreinoAutomatico(
  r: RespostasQuestionario
): TreinoDia[] {
  const diasPossiveis: TreinoDia['diaSemana'][] =
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const diasSelecionados = diasPossiveis.slice(0, r.diasTreino);

  // Banco de exercícios por local
  const exerciciosAcademia: Record<string, Exercicio[]> = {
    superior: [
      { id: 'e1', nome: 'Supino Reto',       series: 4, reps: 12, intervalo: '1 Min' },
      { id: 'e2', nome: 'Puxada Frontal',    series: 4, reps: 12, intervalo: '1 Min' },
      { id: 'e3', nome: 'Remada Curvada',    series: 3, reps: 12, intervalo: '1 Min' },
      { id: 'e4', nome: 'Desenvolvimento',   series: 3, reps: 12, intervalo: '1 Min' },
    ],
    inferior: [
      { id: 'e5', nome: 'Agachamento',          series: 4, reps: 12, intervalo: '1 Min'  },
      { id: 'e6', nome: 'Leg Press',            series: 4, reps: 12, intervalo: '1 Min'  },
      { id: 'e7', nome: 'Cadeira Extensora',    series: 3, reps: 15, intervalo: '45 Seg' },
      { id: 'e8', nome: 'Mesa Flexora',         series: 3, reps: 15, intervalo: '45 Seg' },
    ],
    braco: [
      { id: 'e9',  nome: 'Rosca Direta',   series: 3, reps: 12, intervalo: '45 Seg' },
      { id: 'e10', nome: 'Tríceps Corda',  series: 3, reps: 12, intervalo: '45 Seg' },
      { id: 'e11', nome: 'Rosca Martelo',  series: 3, reps: 12, intervalo: '45 Seg' },
    ],
  };

  const exerciciosCasa: Record<string, Exercicio[]> = {
    superior: [
      { id: 'c1', nome: 'Flexão de Braço',    series: 4, reps: 15, intervalo: '1 Min'  },
      { id: 'c2', nome: 'Flexão Diamante',    series: 3, reps: 12, intervalo: '45 Seg' },
      { id: 'c3', nome: 'Flexão Aberta',      series: 3, reps: 12, intervalo: '45 Seg' },
    ],
    inferior: [
      { id: 'c4', nome: 'Agachamento Livre',  series: 4, reps: 20, intervalo: '1 Min'  },
      { id: 'c5', nome: 'Avanço',             series: 3, reps: 15, intervalo: '45 Seg' },
      { id: 'c6', nome: 'Ponte de Glúteo',    series: 3, reps: 20, intervalo: '45 Seg' },
    ],
    cardio: [
      { id: 'c7', nome: 'Polichinelo',        series: 3, reps: 30, intervalo: '30 Seg' },
      { id: 'c8', nome: 'Burpee',             series: 3, reps: 10, intervalo: '1 Min'  },
    ],
  };

  const exerciciosAr: Record<string, Exercicio[]> = {
    cardio: [
      { id: 'ar1', nome: 'Corrida Leve',       series: 1, reps: 1,  intervalo: '20 Min' },
      { id: 'ar2', nome: 'Caminhada Rápida',   series: 1, reps: 1,  intervalo: '30 Min' },
    ],
    funcional: [
      { id: 'ar3', nome: 'Agachamento',        series: 4, reps: 20, intervalo: '45 Seg' },
      { id: 'ar4', nome: 'Avanço Alternado',   series: 3, reps: 15, intervalo: '45 Seg' },
      { id: 'ar5', nome: 'Flexão de Braço',    series: 3, reps: 12, intervalo: '1 Min'  },
    ],
  };

  const banco =
    r.localTreino === 'academia' ? exerciciosAcademia :
    r.localTreino === 'casa'     ? exerciciosCasa     : exerciciosAr;

  // Ajusta séries/reps por nível
  function ajustar(exs: Exercicio[]): Exercicio[] {
    return exs.map(e => ({
      ...e,
      series: r.nivelTreino === 'iniciante'     ? Math.max(2, e.series - 1) :
              r.nivelTreino === 'avancado'       ? e.series + 1 : e.series,
      reps:   r.nivelTreino === 'iniciante'     ? Math.max(8, e.reps - 2)  :
              r.nivelTreino === 'avancado'       ? e.reps + 2 : e.reps,
    }));
  }

  const gruposRotacao = Object.entries(banco);

  return diasSelecionados.map((dia, idx) => {
    const [nomeGrupo, exercicios] = gruposRotacao[idx % gruposRotacao.length];
    return {
      diaSemana: dia,
      grupos: [
        {
          id: `g_${dia}_${idx}`,
          nome: `Treino ${String.fromCharCode(65 + idx)} — ${nomeGrupo.charAt(0).toUpperCase() + nomeGrupo.slice(1)}`,
          exercicios: ajustar(exercicios),
        },
      ],
    };
  });
}

// ─── Dieta ────────────────────────────────────────────────────────────────────

export async function getDietaUsuario(usuarioId: string): Promise<Dieta | null> {
  const data = await AsyncStorage.getItem(KEYS.DIETAS);
  const dietas: Dieta[] = data ? JSON.parse(data) : [];
  return dietas.find(d => d.usuarioId === usuarioId) || null;
}

export async function salvarDieta(dieta: Dieta): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.DIETAS);
  const dietas: Dieta[] = data ? JSON.parse(data) : [];
  const index = dietas.findIndex(d => d.id === dieta.id);
  if (index >= 0) dietas[index] = dieta;
  else dietas.push(dieta);
  await AsyncStorage.setItem(KEYS.DIETAS, JSON.stringify(dietas));
}

// Adiciona alimento extra em uma refeição
export async function adicionarAlimentoExtra(
  usuarioId: string,
  tipoRefeicao: RefeicaoDieta['tipo'],
  alimento: Alimento,
  gramas: number
): Promise<void> {
  const dieta = await getDietaUsuario(usuarioId);
  if (!dieta) return;

  const refeicaoIdx = dieta.refeicoes.findIndex(r => r.tipo === tipoRefeicao);
  if (refeicaoIdx < 0) {
    // Cria a refeição se não existir
    dieta.refeicoes.push({
      tipo: tipoRefeicao,
      alimentos: [{ alimento, gramas, extra: true }],
    });
  } else {
    dieta.refeicoes[refeicaoIdx].alimentos.push({
      alimento,
      gramas,
      extra: true,
    });
  }
  await salvarDieta(dieta);
}

// ─── Treino ───────────────────────────────────────────────────────────────────

export async function getTreinos(): Promise<TreinoDia[]> {
  const data = await AsyncStorage.getItem(KEYS.TREINOS);
  return data ? JSON.parse(data) : treinosSeed;
}

export async function salvarTreinos(treinos: TreinoDia[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TREINOS, JSON.stringify(treinos));
}

export async function marcarTreinoConcluido(
  diaSemana: string,
  data: string
): Promise<void> {
  const treinos = await getTreinos();
  const novos = treinos.map(t =>
    t.diaSemana === diaSemana ? { ...t, concluido: true, data } : t
  );
  await salvarTreinos(novos);
}

// ─── Solicitações ao especialista ─────────────────────────────────────────────

export async function criarSolicitacao(
  solicitacao: Omit<SolicitacaoEspecialista, 'id' | 'criadoEm' | 'status'>
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.SOLICITACOES);
  const todas: SolicitacaoEspecialista[] = data ? JSON.parse(data) : [];
  const nova: SolicitacaoEspecialista = {
    ...solicitacao,
    id: Date.now().toString(),
    status: 'pendente',
    criadoEm: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEYS.SOLICITACOES, JSON.stringify([...todas, nova]));
}

export async function getSolicitacoes(): Promise<SolicitacaoEspecialista[]> {
  const data = await AsyncStorage.getItem(KEYS.SOLICITACOES);
  return data ? JSON.parse(data) : [];
}

export async function getSolicitacoesUsuario(
  usuarioId: string
): Promise<SolicitacaoEspecialista[]> {
  const todas = await getSolicitacoes();
  return todas.filter(s => s.usuarioId === usuarioId);
}

export async function atualizarStatusSolicitacao(
  id: string,
  status: StatusSolicitacao
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.SOLICITACOES);
  const todas: SolicitacaoEspecialista[] = data ? JSON.parse(data) : [];
  const novos = todas.map(s => s.id === id ? { ...s, status } : s);
  await AsyncStorage.setItem(KEYS.SOLICITACOES, JSON.stringify(novos));
}

// ─── Lembretes ────────────────────────────────────────────────────────────────

export async function getLembretes(usuarioId: string): Promise<Lembrete[]> {
  const data = await AsyncStorage.getItem(KEYS.LEMBRETES);
  const todos: Lembrete[] = data ? JSON.parse(data) : [];
  return todos.filter(l => l.usuarioId === usuarioId);
}

export async function adicionarLembrete(
  lembrete: Omit<Lembrete, 'id'>
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.LEMBRETES);
  const todos: Lembrete[] = data ? JSON.parse(data) : [];
  const novo: Lembrete = { ...lembrete, id: Date.now().toString() };
  await AsyncStorage.setItem(KEYS.LEMBRETES, JSON.stringify([...todos, novo]));
}

export async function removerLembrete(id: string): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.LEMBRETES);
  const todos: Lembrete[] = data ? JSON.parse(data) : [];
  await AsyncStorage.setItem(
    KEYS.LEMBRETES,
    JSON.stringify(todos.filter(l => l.id !== id))
  );
}

// ─── IMC ──────────────────────────────────────────────────────────────────────

export function calcularIMC(peso: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return parseFloat((peso / (alturaM * alturaM)).toFixed(1));
}

export function classificarIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25)   return 'Peso normal';
  if (imc < 30)   return 'Sobrepeso';
  if (imc < 35)   return 'Obesidade grau I';
  if (imc < 40)   return 'Obesidade grau II';
  return 'Obesidade grau III';
}

// ─── Notícias ─────────────────────────────────────────────────────────────────

export function getNoticias(): Noticia[] {
  return noticiasSeed;
}

// ─── Tema ─────────────────────────────────────────────────────────────────────

export async function getTema(): Promise<boolean> {
  const data = await AsyncStorage.getItem(KEYS.TEMA);
  return data === 'dark';
}

export async function salvarTema(isDark: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.TEMA, isDark ? 'dark' : 'light');
}