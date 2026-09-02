import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { COLORS } from '../constants/theme';

export default function LiveMapScreen({ delivery, onBack }) {
  const routePoints = [
    delivery.currentLocation,
    { latitude: 14.6530, longitude: 120.9650 },
    delivery.destinationLocation,
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: delivery.currentLocation.latitude,
          longitude: delivery.currentLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <Polyline coordinates={routePoints} strokeColor={COLORS.primary} strokeWidth={4} />

        <Marker coordinate={delivery.currentLocation} title={delivery.id}>
          <View style={styles.markerContainer}>
            <Ionicons name="bus" size={20} color={COLORS.white} />
          </View>
        </Marker>

        <Marker coordinate={delivery.destinationLocation} title="Destination">
          <Ionicons name="location" size={32} color={COLORS.slateDark} />
        </Marker>
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={COLORS.slateDark} />
      </TouchableOpacity>

      <GlassCard style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.orderTitle}>Delivery Route: {delivery.id}</Text>
            <Text style={styles.destinationText}>{delivery.destination}</Text>
          </View>
          <View style={styles.timeWrapper}>
            <Text style={styles.etaText}>{delivery.etaMinutes}</Text>
            <Text style={styles.minText}>min</Text>
          </View>
        </View>
        <Text style={styles.driverInfo}>Driver: {delivery.driverName} • Contact: 8634-7097</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  markerContainer: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slateDark },
  destinationText: { fontSize: 12, color: COLORS.slateLight, width: 200, marginTop: 2 },
  timeWrapper: { alignItems: 'center', backgroundColor: '#E5F6FF', borderRadius: 12, padding: 8 },
  etaText: { fontSize: 20, fontWeight: '800', color: COLORS.primaryDark },
  minText: { fontSize: 10, color: COLORS.primaryDark, textTransform: 'uppercase' },
  driverInfo: { marginTop: 10, fontSize: 12, color: COLORS.slateDark, fontWeight: '500' },
});
