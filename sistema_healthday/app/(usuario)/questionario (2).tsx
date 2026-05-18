/**
 * app/(usuario)/questionario.tsx
 * Questionário de perfil — 4 etapas para gerar dieta e treino automaticamente.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import {
    atualizarUsuario,
    gerarDietaAutomatica,
    gerarTreinoAutomatico,
    getUserAtual,
    salvarDieta,
    salvarQuestionario,
    salvarTreinos,
    type LocalTreino,
    type NivelAtividade,
    type NivelTreino,
    type RespostasQuestionario,
    type RestricaoAlimentar,
} from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type Sexo = 'masculino' | 'feminino';
type Objetivo = 'perda' | 'ganho' | 'manutencao';

// ─── Componente de opção selecionável ─────────────────────────────────────────

function Opcao({
  label,
  selecionado,
  onPress,
}: {
  label: string;
  selecionado: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoSelecionado]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function QuestionarioScreen() {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);

  // Etapa 1 — Dados físicos
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<Sexo | ''>('');

  // Etapa 2 — Objetivos
  const [objetivo, setObjetivo] = useState<Objetivo | ''>('');
  const [nivelAtividade, setNivelAtividade] = useState<NivelAtividade | ''>('');

  // Etapa 3 — Alimentação
  const [restricao, setRestricao] = useState<RestricaoAlimentar | ''>('');
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<3 | 4 | 5 | 0>(0);

  // Etapa 4 — Treino
  const [nivelTreino, setNivelTreino] = useState<NivelTreino | ''>('');
  const [localTreino, setLocalTreino] = useState<LocalTreino | ''>('');
  const [diasTreino, setDiasTreino] = useState<number>(0);

  // ─── Validações por etapa ─────────────────────────────────────────────────

  function validarEtapa(): boolean {
    if (etapa === 1) {
      if (!peso || !altura || !idade || !sexo) {
        Alert.alert('Atenção', 'Preencha todos os campos.');
        return false;
      }
      const p = parseFloat(peso);
      const a = parseFloat(altura);
      const i = parseInt(idade);
      if (isNaN(p) || p < 20 || p > 300) {
        Alert.alert('Atenção', 'Peso inválido (20–300 kg).');
        return false;
      }
      if (isNaN(a) || a < 100 || a > 250) {
        Alert.alert('Atenção', 'Altura inválida (100–250 cm).');
        return false;
      }
      if (isNaN(i) || i < 10 || i > 100) {
        Alert.alert('Atenção', 'Idade inválida (10–100 anos).');
        return false;
      }
    }
    if (etapa === 2) {
      if (!objetivo || !nivelAtividade) {
        Alert.alert('Atenção', 'Selecione objetivo e nível de atividade.');
        return false;
      }
    }
    if (etapa === 3) {
      if (!restricao || !refeicoesPorDia) {
        Alert.alert('Atenção', 'Selecione restrição e número de refeições.');
        return false;
      }
    }
    if (etapa === 4) {
      if (!nivelTreino || !localTreino || !diasTreino) {
        Alert.alert('Atenção', 'Preencha todas as informações de treino.');
        return false;
      }
    }
    return true;
  }

  function avancar() {
    if (!validarEtapa()) return;
    if (etapa < 4) setEtapa(etapa + 1);
    else handleFinalizar();
  }

  // ─── Finalizar questionário ───────────────────────────────────────────────

  async function handleFinalizar() {
    setLoading(true);
    try {
      const user = await getUserAtual();
      if (!user) {
        Alert.alert('Erro', 'Usuário não encontrado.');
        return;
      }

      const respostas: RespostasQuestionario = {
        usuarioId: user.id,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        idade: parseInt(idade),
        sexo: sexo as Sexo,
        objetivo: objetivo as Objetivo,
        nivelAtividade: nivelAtividade as NivelAtividade,
        restricao: restricao as RestricaoAlimentar,
        refeicoesPorDia: refeicoesPorDia as 3 | 4 | 5,
        nivelTreino: nivelTreino as NivelTreino,
        localTreino: localTreino as LocalTreino,
        diasTreino,
      };

      // Salva questionário
      await salvarQuestionario(respostas);

      // Gera dieta e treino automáticos
      const dieta = gerarDietaAutomatica(respostas, user.id);
      const treinos = gerarTreinoAutomatico(respostas);
      await salvarDieta(dieta);
      await salvarTreinos(treinos);

      // Marca questionário como feito e atualiza dados físicos
      await atualizarUsuario({
        ...user,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        objetivo: objetivo as Objetivo,
        questionarioFeito: true,
      });

      router.replace('/(usuario)/home');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as respostas.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Render das etapas ────────────────────────────────────────────────────

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" backgroundColor={HD.background} />

      {/* Header */}
      <View style={styles.header}>
        <LogoHealthDay size={48} />
        <Text style={styles.headerTitulo}>Questionário de Perfil</Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressoContainer}>
        {[1, 2, 3, 4].map(n => (
          <View
            key={n}
            style={[
              styles.progressoPasso,
              n <= etapa && styles.progressoPassoAtivo,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressoLabel}>Etapa {etapa} de 4</Text>

      {/* ── Etapa 1: Dados físicos ── */}
      {etapa === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>📏 Seus dados físicos</Text>

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 70"
            placeholderTextColor={HD.placeholder}
            value={peso}
            onChangeText={setPeso}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 175"
            placeholderTextColor={HD.placeholder}
            value={altura}
            onChangeText={setAltura}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Idade</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 25"
            placeholderTextColor={HD.placeholder}
            value={idade}
            onChangeText={setIdade}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Sexo</Text>
          <View style={styles.opcoesRow}>
            <Opcao label="Masculino" selecionado={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
            <Opcao label="Feminino"  selecionado={sexo === 'feminino'}  onPress={() => setSexo('feminino')}  />
          </View>
        </View>
      )}

      {/* ── Etapa 2: Objetivos ── */}
      {etapa === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🎯 Seus objetivos</Text>

          <Text style={styles.label}>Objetivo principal</Text>
          <View style={styles.opcoesCol}>
            <Opcao label="🔥 Perder peso"       selecionado={objetivo === 'perda'}      onPress={() => setObjetivo('perda')}      />
            <Opcao label="💪 Ganhar massa"       selecionado={objetivo === 'ganho'}      onPress={() => setObjetivo('ganho')}      />
            <Opcao label="⚖️ Manter o peso"     selecionado={objetivo === 'manutencao'} onPress={() => setObjetivo('manutencao')} />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Nível de atividade física</Text>
          <View style={styles.opcoesCol}>
            <Opcao label="🛋️ Sedentário (pouco ou nenhum exercício)"  selecionado={nivelAtividade === 'sedentario'} onPress={() => setNivelAtividade('sedentario')} />
            <Opcao label="🚶 Leve (1–3 dias por semana)"              selecionado={nivelAtividade === 'leve'}       onPress={() => setNivelAtividade('leve')}       />
            <Opcao label="🏃 Moderado (3–5 dias por semana)"          selecionado={nivelAtividade === 'moderado'}   onPress={() => setNivelAtividade('moderado')}   />
            <Opcao label="⚡ Intenso (6–7 dias por semana)"           selecionado={nivelAtividade === 'intenso'}    onPress={() => setNivelAtividade('intenso')}    />
          </View>
        </View>
      )}

      {/* ── Etapa 3: Alimentação ── */}
      {etapa === 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🥗 Sua alimentação</Text>

          <Text style={styles.label}>Restrição alimentar</Text>
          <View style={styles.opcoesCol}>
            <Opcao label="✅ Nenhuma"            selecionado={restricao === 'nenhuma'}     onPress={() => setRestricao('nenhuma')}     />
            <Opcao label="🥦 Vegetariano"        selecionado={restricao === 'vegetariano'} onPress={() => setRestricao('vegetariano')} />
            <Opcao label="🌱 Vegano"             selecionado={restricao === 'vegano'}      onPress={() => setRestricao('vegano')}      />
            <Opcao label="🌾 Sem glúten"         selecionado={restricao === 'semGluten'}   onPress={() => setRestricao('semGluten')}   />
            <Opcao label="🥛 Sem lactose"        selecionado={restricao === 'semLactose'}  onPress={() => setRestricao('semLactose')}  />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Refeições por dia</Text>
          <View style={styles.opcoesRow}>
            <Opcao label="3 refeições" selecionado={refeicoesPorDia === 3} onPress={() => setRefeicoesPorDia(3)} />
            <Opcao label="4 refeições" selecionado={refeicoesPorDia === 4} onPress={() => setRefeicoesPorDia(4)} />
            <Opcao label="5 refeições" selecionado={refeicoesPorDia === 5} onPress={() => setRefeicoesPorDia(5)} />
          </View>
        </View>
      )}

      {/* ── Etapa 4: Treino ── */}
      {etapa === 4 && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🏋️ Seu treino</Text>

          <Text style={styles.label}>Nível de experiência</Text>
          <View style={styles.opcoesCol}>
            <Opcao label="🌱 Iniciante"      selecionado={nivelTreino === 'iniciante'}     onPress={() => setNivelTreino('iniciante')}     />
            <Opcao label="💪 Intermediário"  selecionado={nivelTreino === 'intermediario'} onPress={() => setNivelTreino('intermediario')} />
            <Opcao label="⚡ Avançado"       selecionado={nivelTreino === 'avancado'}      onPress={() => setNivelTreino('avancado')}      />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Local de treino</Text>
          <View style={styles.opcoesCol}>
            <Opcao label="🏋️ Academia"    selecionado={localTreino === 'academia'}  onPress={() => setLocalTreino('academia')}  />
            <Opcao label="🏠 Em casa"     selecionado={localTreino === 'casa'}      onPress={() => setLocalTreino('casa')}      />
            <Opcao label="🌳 Ao ar livre" selecionado={localTreino === 'ar_livre'}  onPress={() => setLocalTreino('ar_livre')}  />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Dias de treino por semana</Text>
          <View style={styles.opcoesRow}>
            {[2, 3, 4, 5].map(d => (
              <Opcao key={d} label={`${d}x`} selecionado={diasTreino === d} onPress={() => setDiasTreino(d)} />
            ))}
          </View>
        </View>
      )}

      {/* Botões de navegação */}
      <View style={styles.botoesRow}>
        {etapa > 1 && (
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={() => setEtapa(etapa - 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnVoltarTexto}>← Voltar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnAvancar, etapa === 1 && { flex: 1 }]}
          onPress={avancar}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={HD.white} />
          ) : (
            <Text style={styles.btnAvancarTexto}>
              {etapa === 4 ? '✓ Gerar meu plano' : 'Próximo →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.tagline}>A chave para a saúde</Text>
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: HD.background,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: HD.secondary,
  },

  // Progresso
  progressoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  progressoPasso: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: HD.divider,
  },
  progressoPassoAtivo: {
    backgroundColor: HD.primary,
  },
  progressoLabel: {
    fontSize: 13,
    color: HD.textLight,
    marginBottom: 20,
  },

  // Card
  card: {
    backgroundColor: HD.cardLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: HD.secondary,
    marginBottom: 16,
  },

  // Inputs
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HD.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: HD.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: HD.textDark,
    backgroundColor: HD.inputBg,
    marginBottom: 14,
  },

  // Opções
  opcoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  opcoesCol: {
    gap: 8,
    marginBottom: 4,
  },
  opcao: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: HD.inputBorder,
    backgroundColor: HD.inputBg,
  },
  opcaoSelecionada: {
    backgroundColor: HD.primary,
    borderColor: HD.primary,
  },
  opcaoTexto: {
    fontSize: 14,
    color: HD.textMedium,
    fontWeight: '500',
  },
  opcaoTextoSelecionado: {
    color: HD.white,
    fontWeight: '700',
  },

  // Botões
  botoesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  btnVoltar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: HD.inputBorder,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnVoltarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: HD.textMedium,
  },
  btnAvancar: {
    flex: 2,
    backgroundColor: HD.secondary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnAvancarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: HD.white,
  },

  tagline: {
    textAlign: 'center',
    fontSize: 14,
    color: HD.secondary,
    fontStyle: 'italic',
  },
});