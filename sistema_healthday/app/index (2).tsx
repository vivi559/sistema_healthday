/**
 * app/index.tsx — Splash Screen
 */
import LogoHealthDay from '@/components/LogoHealthDay';
import { getUserAtual, inicializarStorage } from '@/constants/Storage';
import { HD } from '@/constants/theme';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1, friction: 5,   useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    async function init() {
      await inicializarStorage();
      await new Promise(r => setTimeout(r, 2200));
      const userAtual = await getUserAtual();
      if (!userAtual)                       router.replace('/(auth)/welcome');
      else if (userAtual.role === 'admin')  router.replace('/(admin)/dashboard');
      else if (userAtual.role === 'especialista') router.replace('/(especialista)/home');
      else                                  router.replace('/(usuario)/home');
    }
    init();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={HD.background} />
      <Animated.View style={[styles.logoContainer, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
      }]}>
        <LogoHealthDay size={140} showName />
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        A chave para a saúde
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: HD.background, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  tagline:       { position: 'absolute', bottom: 60, fontSize: 16, color: HD.secondary, fontStyle: 'italic' },
});