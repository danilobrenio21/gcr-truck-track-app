import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { COLORS } from '../constants/theme';

export default function DeliveryCard({ delivery, onSelect }) {
  return (
    <GlassCard style={styles.cardSpacing}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.truckId}>#{delivery.id}</Text>
          <Text style={styles.driverName}>{delivery.driverName} • {delivery.vehicle}</Text>
        </View>
        <View style={styles.etaBadge}>
          <Text style={styles.etaNumber}>{delivery.etaMinutes}</Text>
          <Text style={styles.etaUnit}>mins</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.routeRow}>
        <Ionicons name="location-outline" size={18} color={COLORS.primary} />
        <Text style={styles.destination} numberOfLines={1}>
          {delivery.destination}
        </Text>
      </View>

      <TouchableOpacity style={styles.trackButton} onPress={() => onSelect(delivery)}>
        <Text style={styles.buttonText}>View Live Map</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardSpacing: { marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  truckId: { fontSize: 18, fontWeight: '700', color: COLORS.slateDark },
  driverName: { fontSize: 13, color: COLORS.slateLight, marginTop: 2 },
  etaBadge: {
    backgroundColor: '#E5F6FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  etaNumber: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  etaUnit: { fontSize: 10, color: COLORS.primaryDark, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  destination: { fontSize: 13, color: COLORS.slateDark, marginLeft: 8, flex: 1 },
  trackButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
});
