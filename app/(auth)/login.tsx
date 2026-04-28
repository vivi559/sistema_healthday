/**
 * app/(auth)/login.tsx
 * Tela de login com email e senha.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { login } from '@/constants/Storage';
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

export default function LoginScreen() {
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), senha);
      if (!user) {
        Alert.alert('Error', 'Email ou senha incorretos.');
        return;
      }
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'especialista') {
        router.replace('/(especialista)');
      } else {
        router.replace('/(usuario)/home');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível fazer login.');
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
        <Text style={styles.cardTitle}>Login</Text>

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
          placeholder="Sua senha"
          placeholderTextColor={HD.placeholder}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={HD.white} />
            : <Text style={styles.btnText}>Login</Text>
          }
        </TouchableOpacity>

        <Text style={styles.aviso}>
          Seus dados são armazenados com segurança. Nunca envie senhas para terceiros.
        </Text>
      </View>

      {/* Contas de teste */}
      <View style={styles.testBox}>
        <Text style={styles.testTitle}>Contas de teste:</Text>
        <Text style={styles.testItem}>👤 jonas@email.com — 123456</Text>
        <Text style={styles.testItem}>🩺 especialista@email.com — 123456</Text>
        <Text style={styles.testItem}>🔧 admin@email.com — admin123</Text>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')}>
        <Text style={styles.linkText}>
          Não tem conta?{' '}
          <Text style={styles.linkBold}>Criar agora</Text>
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
    marginBottom: 16,
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
  testBox: {
    width: '100%',
    backgroundColor: HD.secondaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: HD.textDark,
    marginBottom: 6,
  },
  testItem: {
    fontSize: 12,
    color: HD.textMedium,
    marginBottom: 3,
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