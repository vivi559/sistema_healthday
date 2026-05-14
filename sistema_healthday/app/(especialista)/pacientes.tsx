/**
 * app/(especialista)/pacientes.tsx
 * Lista de pacientes do especialista.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { HD, darkTheme, lightTheme } from '@/constants/theme';
import { getTema, getUsuarios, type User } from '@/constants/Storage';

export default function PacientesScreen() {
  const [temaDark, setTemaDark] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [pacientes, setPacientes] = useState<User[]>([]);
  const tema = temaDark ? darkTheme : lightTheme;

  useEffect(() => {
    async function carregar() {
      const dark  = await getTema();
      const users = await getUsuarios();
      setTemaDark(dark);
      setPacientes(users.filter(u => u.role === 'usuario'));
      setLoading(false);
    }
    carregar();
  }, []);

  if (loading) return <View style={[styles.loading, { backgroundColor: tema.background }]}><ActivityIndicator size="large" color={HD.secondary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <StatusBar barStyle={temaDark ? 'light-content' : 'dark-content'} backgroundColor={tema.background} />
      <View style={styles.header}><Text style={styles.title}>Pacientes</Text></View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {pacientes.map(p => (
          <TouchableOpacity key={p.id} style={[styles.card, { backgroundColor: tema.card }]}
            onPress={() => Alert.alert(p.nome, `Email: ${p.email}\nIMC: ${p.imc ?? '—'}\nObjetivo: ${p.objetivo ?? '—'}`)}>
            <View style={styles.avatar}><Text style={styles.avatarEmoji}>👤</Text></View>
            <View style={styles.info}>
              <Text style={[styles.nome, { color: tema.text }]}>{p.nome}</Text>
              <Text style={[styles.email, { color: tema.subtext }]}>{p.email}</Text>
            </View>
            <Text style={[styles.chevron, { color: tema.subtext }]}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:    { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, alignItems: 'center' },
  title:     { fontSize: 22, fontWeight: '800', color: HD.secondary },
  scroll:    { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card:      { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: HD.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 20 },
  info:      { flex: 1 },
  nome:      { fontSize: 15, fontWeight: '700' },
  email:     { fontSize: 12, marginTop: 2 },
  chevron:   { fontSize: 22, fontWeight: '600' },
});
