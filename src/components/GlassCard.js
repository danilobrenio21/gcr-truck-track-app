import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';

export default function GlassCard({ children, style }) {
  return <View style={[styles.card, SHADOWS.soft, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
});
