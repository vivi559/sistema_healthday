/**
 * app/(auth)/welcome.tsx
 * Tela "Rumo à saúde" — escolha entre cadastro e login.
 */

import LogoHealthDay from '@/components/LogoHealthDay';
import { HD } from '@/constants/theme';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoY        = useRef(new Animated.Value(-30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(20)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;
  const taglineOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(logoY,       { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnsOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineOp,    { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={HD.background} />

      <Animated.View style={[
        styles.logoContainer,
        { opacity: logoOpacity, transform: [{ translateY: logoY }] },
      ]}>
        <LogoHealthDay size={110} showName />
      </Animated.View>

      <Animated.Text style={[
        styles.title,
        { opacity: titleOpacity, transform: [{ translateY: titleY }] },
      ]}>
        Rumo a saúde
      </Animated.Text>

      <Animated.View style={[styles.btnsContainer, { opacity: btnsOpacity }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/cadastro')}
        >
          <Text style={styles.btnPrimaryText}>Eu sou novo usuário</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnSecondaryText}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOp }]}>
        A chave para a saúde
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HD.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: HD.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  btnsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  btnPrimary: {
    backgroundColor: HD.secondaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: HD.textDark,
  },
  btnSecondary: {
    backgroundColor: HD.secondaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: HD.textDark,
  },
  tagline: {
    position: 'absolute',
    bottom: 48,
    fontSize: 15,
    color: HD.secondary,
    fontStyle: 'italic',
  },
});