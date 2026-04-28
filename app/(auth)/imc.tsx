/**
 * app/(auth)/imc.tsx
 * Tela de cálculo de IMC após o cadastro.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import {
  atualizarUsuario,
  calcularIMC,
  classificarIMC,
  getUserAtual,
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

export default function ImcScreen() {
  const [altura,    setAltura]    = useState('');
  const [peso,      setPeso]      = useState('');
  const [resultado, setResultado] = useState<number | null>(null);
  const [classe,    setClasse]    = useState('');
  const [loading,   setLoading]   = useState(false);

  function handleCalcular() {
    const alturaNum = parseFloat(altura.replace(',', '.'));
    const pesoNum   = parseFloat(peso.replace(',', '.'));

    if (!alturaNum || !pesoNum) {
      Alert.alert('Atenção', 'Preencha altura e peso corretamente.');
      return;
    }
    if (alturaNum < 50 || alturaNum > 250) {
      Alert.alert('Atenção', 'Altura inválida. Digite em centímetros (ex: 175).');
      return;
    }
    if (pesoNum < 20 || pesoNum > 300) {
      Alert.alert('Atenção', 'Peso inválido. Digite em quilogramas (ex: 70).');
      return;
    }

    const imc = calcularIMC(pesoNum, alturaNum);
    setResultado(imc);
    setClasse(classificarIMC(imc));
  }

  async function handleEnviar() {
    if (!resultado) {
      Alert.alert('Atenção', 'Calcule seu IMC primeiro.');
      return;
    }

    setLoading(true);
    try {
      const user = await getUserAtual();
      if (user) {
        await atualizarUsuario({
          ...user,
          altura: parseFloat(altura),
          peso:   parseFloat(peso),
          imc:    resultado,
        });
      }
      // ✅ Após IMC → vai para o questionário de perfil
      router.replace('/(usuario)/questionario' as any);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    } finally {
      setLoading(false);
    }
  }

  function getImcColor(): string {
    if (!resultado) return HD.primary;
    if (resultado < 18.5) return '#3B82F6';
    if (resultado < 25)   return HD.primary;
    if (resultado < 30)   return HD.secondary;
    return HD.accent;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" backgroundColor={HD.background} />

      <Text style={styles.title}>VAMOS CALCULAR SEU IMC</Text>

      {/* Card altura */}
      <TouchableOpacity activeOpacity={1} style={[styles.card, styles.cardPrimary]}>
        <Text style={styles.cardLabel}>QUAL A SUA ALTURA?</Text>
        <TextInput
          style={styles.cardInput}
          placeholder="Ex: 175 (em cm)"
          placeholderTextColor={HD.placeholder}
          value={altura}
          onChangeText={setAltura}
          keyboardType="numeric"
        />
        {altura !== '' && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Card peso */}
      <TouchableOpacity activeOpacity={1} style={[styles.card, styles.cardSecondary]}>
        <Text style={styles.cardLabelOrange}>QUAL O SEU PESO?</Text>
        <TextInput
          style={styles.cardInput}
          placeholder="Ex: 70 (em kg)"
          placeholderTextColor={HD.placeholder}
          value={peso}
          onChangeText={setPeso}
          keyboardType="numeric"
        />
      </TouchableOpacity>

      {/* Resultado */}
      {resultado !== null && (
        <View style={[styles.resultCard, { borderColor: getImcColor() }]}>
          <Text style={styles.resultLabel}>Seu IMC</Text>
          <Text style={[styles.resultValue, { color: getImcColor() }]}>{resultado}</Text>
          <Text style={[styles.resultClasse, { color: getImcColor() }]}>{classe}</Text>
        </View>
      )}

      {/* Botões */}
      {resultado === null ? (
        <TouchableOpacity style={styles.btnCalcular} onPress={handleCalcular} activeOpacity={0.8}>
          <Text style={styles.btnText}>Calcular</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnEnviar} onPress={handleEnviar} activeOpacity={0.8} disabled={loading}>
          {loading
            ? <ActivityIndicator color={HD.textDark} />
            : <Text style={styles.btnEnviarText}>Enviar</Text>
          }
        </TouchableOpacity>
      )}

      {resultado !== null && (
        <TouchableOpacity onPress={() => { setResultado(null); setClasse(''); }} style={styles.recalcularBtn}>
          <Text style={styles.recalcularText}>Recalcular</Text>
        </TouchableOpacity>
      )}

      {/* Footer com logo */}
      <View style={styles.footer}>
        <LogoHealthDay size={64} showName />
        <Text style={styles.tagline}>A chave para a saúde</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: HD.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: HD.secondary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  cardPrimary:   { backgroundColor: HD.cardLight },
  cardSecondary: { backgroundColor: HD.secondaryLight },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: HD.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardLabelOrange: {
    fontSize: 13,
    fontWeight: '700',
    color: HD.secondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardInput: {
    fontSize: 16,
    color: HD.textDark,
    borderBottomWidth: 1,
    borderBottomColor: HD.divider,
    paddingVertical: 4,
  },
  checkBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: HD.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: HD.white, fontWeight: '700', fontSize: 14 },
  resultCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: HD.white,
  },
  resultLabel:  { fontSize: 14, color: HD.textLight, marginBottom: 4 },
  resultValue:  { fontSize: 48, fontWeight: '800' },
  resultClasse: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  btnCalcular: {
    width: '100%',
    backgroundColor: '#C8E26A',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: HD.textDark },
  btnEnviar: {
    width: '100%',
    backgroundColor: '#C8E26A',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnEnviarText: { fontSize: 16, fontWeight: '700', color: HD.textDark },
  recalcularBtn:  { marginBottom: 24 },
  recalcularText: { fontSize: 14, color: HD.primary, fontWeight: '600' },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  tagline: {
    fontSize: 14,
    color: HD.secondary,
    fontStyle: 'italic',
  },
});