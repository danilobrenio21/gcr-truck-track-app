import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function Header() {
  const callDispatcher = () => Linking.openURL('tel:86347097');

  return (
    <LinearGradient
      colors={[COLORS.primary, '#6FD0FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View>
        <Text style={styles.brandTitle}>GCR FOOD</Text>
        <Text style={styles.brandSubtitle}>Products Trading • Live Logistics</Text>
      </View>
      <TouchableOpacity style={styles.iconButton} onPress={callDispatcher}>
        <Ionicons name="call" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: 1.1 },
  brandSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
