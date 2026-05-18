/**
 * app/(auth)/login.tsx
 * Tela de login com email e senha.
 * ATUALIZADO: adicionada seção "Acesso Restrito" para Admin e Especialista.
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
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Habilita animação de layout no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LoginScreen() {
  const [email,   setEmail]   = useState('');
  const [senha,   setSenha]   = useState('');
  const [loading, setLoading] = useState(false);
  const [acessoRestrito, setAcessoRestrito] = useState(false);
  const [loadingRole, setLoadingRole] = useState<'admin' | 'especialista' | null>(null);

  // ─── Login padrão ──────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), senha);
      if (!user) {
        Alert.alert('Erro', 'Email ou senha incorretos.');
        return;
      }
      redirecionar(user.role, user.questionarioFeito);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível fazer login.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Login direto por role (acesso restrito) ────────────────────────────────

  async function handleLoginRole(role: 'admin' | 'especialista') {
    setLoadingRole(role);
    try {
      const credenciais = {
        admin:        { email: 'admin@email.com',        senha: 'admin123' },
        especialista: { email: 'especialista@email.com', senha: '123456'   },
      };
      const { email: e, senha: s } = credenciais[role];
      const user = await login(e, s);
      if (!user) {
        Alert.alert('Erro', 'Credenciais inválidas. Verifique o Storage.');
        return;
      }
      redirecionar(user.role, user.questionarioFeito);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível fazer login.');
    } finally {
      setLoadingRole(null);
    }
  }

  function redirecionar(role: string, questionarioFeito?: boolean) {
    if (role === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (role === 'especialista') {
      router.replace('/(especialista)/home');
    } else {
      if (!questionarioFeito) {
        router.replace('/(usuario)/questionario' as any);
      } else {
        router.replace('/(usuario)/home');
      }
    }
  }

  function toggleAcessoRestrito() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAcessoRestrito(v => !v);
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

      {/* Card principal de login */}
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
            : <Text style={styles.btnText}>Entrar</Text>
          }
        </TouchableOpacity>

        <Text style={styles.aviso}>
          Seus dados são armazenados com segurança. Nunca envie senhas para terceiros.
        </Text>
      </View>

      {/* ─── Área de Acesso Restrito ─────────────────────────────────── */}
      <View style={styles.restricoCard}>

        {/* Cabeçalho clicável */}
        <TouchableOpacity
          style={styles.restricoHeader}
          onPress={toggleAcessoRestrito}
          activeOpacity={0.7}
        >
          <View style={styles.restricoHeaderLeft}>
            <View style={styles.lockIconWrap}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>
            <Text style={styles.restricoTitle}>Acesso Restrito</Text>
          </View>
          <Text style={[styles.restricoChevron, acessoRestrito && styles.restricoChevronOpen]}>
            ›
          </Text>
        </TouchableOpacity>

        {/* Conteúdo expansível */}
        {acessoRestrito && (
          <View style={styles.restricoBody}>
            <Text style={styles.restricoSub}>
              Acesso exclusivo para equipe interna do Health Day.
            </Text>

            {/* Botão Admin */}
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => handleLoginRole('admin')}
              activeOpacity={0.85}
              disabled={loadingRole !== null}
            >
              <View style={styles.roleBtnInner}>
                <View style={styles.roleBtnIconWrap}>
                  <Text style={styles.roleBtnIcon}>🛡️</Text>
                </View>
                <View style={styles.roleBtnInfo}>
                  <Text style={styles.roleBtnTitle}>Administrador</Text>
                  <Text style={styles.roleBtnSub}>Gestão total do sistema</Text>
                </View>
                {loadingRole === 'admin'
                  ? <ActivityIndicator color={HD.white} size="small" />
                  : <Text style={styles.roleBtnArrow}>→</Text>
                }
              </View>
            </TouchableOpacity>

            {/* Botão Especialista */}
            <TouchableOpacity
              style={styles.especialistaBtn}
              onPress={() => handleLoginRole('especialista')}
              activeOpacity={0.85}
              disabled={loadingRole !== null}
            >
              <View style={styles.roleBtnInner}>
                <View style={[styles.roleBtnIconWrap, styles.roleBtnIconWrapEsp]}>
                  <Text style={styles.roleBtnIcon}>🩺</Text>
                </View>
                <View style={styles.roleBtnInfo}>
                  <Text style={[styles.roleBtnTitle, styles.roleBtnTitleEsp]}>Especialista</Text>
                  <Text style={[styles.roleBtnSub, styles.roleBtnSubEsp]}>Dietas e treinos de pacientes</Text>
                </View>
                {loadingRole === 'especialista'
                  ? <ActivityIndicator color={HD.secondary} size="small" />
                  : <Text style={[styles.roleBtnArrow, styles.roleBtnArrowEsp]}>→</Text>
                }
              </View>
            </TouchableOpacity>

            <Text style={styles.restricoAviso}>
              ⚠️ Acesso monitorado. Apenas para colaboradores autorizados.
            </Text>
          </View>
        )}
      </View>

      {/* Link cadastro */}
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

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 24 },

  // Card login
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
  btnText: { color: HD.white, fontSize: 16, fontWeight: '700' },
  aviso: {
    fontSize: 11,
    color: HD.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Acesso Restrito ──────────────────────────────────────────────────────
  restricoCard: {
    width: '100%',
    backgroundColor: HD.cardLight,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: HD.divider,
  },

  restricoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  restricoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: HD.secondaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  lockIcon:     { fontSize: 16 },
  restricoTitle:{ fontSize: 15, fontWeight: '700', color: HD.textDark },
  restricoChevron: {
    fontSize: 24,
    color: HD.textLight,
    fontWeight: '600',
    transform: [{ rotate: '0deg' }],
  },
  restricoChevronOpen: {
    transform: [{ rotate: '90deg' }],
    color: HD.secondary,
  },

  restricoBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  restricoSub: {
    fontSize: 12,
    color: HD.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },

  // Botão Admin
  adminBtn: {
    backgroundColor: HD.secondary,
    borderRadius: 16,
    padding: 14,
  },
  // Botão Especialista
  especialistaBtn: {
    backgroundColor: HD.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: HD.secondary,
  },

  roleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBtnIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  roleBtnIconWrapEsp: { backgroundColor: HD.secondaryLight },
  roleBtnIcon: { fontSize: 20 },

  roleBtnInfo:     { flex: 1 },
  roleBtnTitle:    { fontSize: 15, fontWeight: '700', color: HD.white },
  roleBtnTitleEsp: { color: HD.secondary },
  roleBtnSub:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  roleBtnSubEsp:   { color: HD.textLight },
  roleBtnArrow:    { fontSize: 18, fontWeight: '700', color: HD.white },
  roleBtnArrowEsp: { color: HD.secondary },

  restricoAviso: {
    fontSize: 11,
    color: HD.textLight,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },

  // Rodapé
  linkText: { fontSize: 14, color: HD.textMedium, marginBottom: 32 },
  linkBold: { color: HD.primary, fontWeight: '700' },
  tagline:  { fontSize: 15, color: HD.secondary, fontStyle: 'italic' },
});
