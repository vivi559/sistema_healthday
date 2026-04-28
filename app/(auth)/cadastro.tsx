/**
 * app/(auth)/cadastro.tsx
 * Tela de criação de conta.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { cadastrarUsuario } from '@/constants/Storage';
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

export default function CadastroScreen() {
  const [nome,    setNome]    = useState('');
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await cadastrarUsuario({ nome, email, senha });
      router.replace('/(auth)/imc');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" backgroundColor={HD.background} />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <LogoHealthDay size={80} showName />
      </View>

      {/* Card do formulário */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Criar Conta</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor={HD.placeholder}
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={HD.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={HD.placeholder}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleCadastro}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={HD.white} />
            : <Text style={styles.btnText}>Criar Conta</Text>
          }
        </TouchableOpacity>

        <Text style={styles.aviso}>
          Seus dados são armazenados com segurança. Nunca envie senhas para terceiros.
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.linkText}>
          Já tem uma conta?{' '}
          <Text style={styles.linkBold}>Fazer login</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.tagline}>A chave para a saúde</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: HD.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: HD.cardLight,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: HD.secondary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: HD.secondary,
    marginBottom: 6,
    fontWeight: '500',
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
    marginBottom: 16,
  },
  btn: {
    backgroundColor: HD.secondary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  btnText: {
    color: HD.white,
    fontSize: 16,
    fontWeight: '700',
  },
  aviso: {
    fontSize: 11,
    color: HD.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    fontSize: 14,
    color: HD.textMedium,
    marginBottom: 32,
  },
  linkBold: {
    color: HD.primary,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 15,
    color: HD.secondary,
    fontStyle: 'italic',
  },
});