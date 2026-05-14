/**
 * components/LogoHealthDay.tsx
 */

import { HD } from '@/constants/theme';
import { Image, StyleSheet, Text, View } from 'react-native';

interface Props {
  size?: number;
  showName?: boolean;
}

export default function LogoHealthDay({ size = 80, showName = false }: Props) {
  return (
    <View style={styles.wrapper}>
      <Image
        source={require('../assets/images/Logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showName && (
        <Text style={[styles.name, { fontSize: size * 0.22 }]}>
          Health Day
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  name: {
    fontWeight: '800',
    color: HD.primary,
    marginTop: 6,
    letterSpacing: 1,
  },
});