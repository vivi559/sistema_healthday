import { Tabs } from 'expo-router';
import { useTema } from '@/context/TemaContext';
import { HD } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function EspecialistaLayout() {
  const {  temaDark } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: temaDark ? '#2a2a2a' : '#D9D3CC',
          borderTopWidth: 0,
          borderRadius: 30,
          marginHorizontal: 16,
          marginBottom: 12,
          height: 64,
          position: 'absolute',
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: HD.primary,
        tabBarInactiveTintColor: temaDark ? '#888' : '#666',
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'treinos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dieta"
        options={{
          title: 'dieta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="solicitacoes"
        options={{
          title: 'solicit.',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
