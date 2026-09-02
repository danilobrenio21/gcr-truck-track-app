import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const DISPATCHES = [
  {
    id: 'GCR-1082',
    driver: 'Danilo B.',
    vehicle: 'Fuso Canter 4W',
    destinationName: 'Grace Park, Caloocan City',
    contact: '8634-7097',
    eta: '14 MINS',
    // Moved to actual road: NLEX Balintawak
    origin: { latitude: 14.6565, longitude: 120.9950 },
    destination: { latitude: 14.6438, longitude: 120.9858 },
  },
  {
    id: 'GCR-1090',
    driver: 'Ricardo M.',
    vehicle: 'Isuzu Elf Chiller',
    destinationName: 'Divisoria Market, Manila',
    contact: '8634-7098',
    eta: '38 MINS',
    // Moved to actual road: Manila North Harbor
    origin: { latitude: 14.6065, longitude: 120.9630 },
    destination: { latitude: 14.6025, longitude: 120.9715 },
  },
];

export default function App() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [truckCoordIndex, setTruckCoordIndex] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!selectedTruck) return;

    const { origin, destination } = selectedTruck;
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    // Added User-Agent header so the API returns the full high-resolution street curve
    fetch(url, { headers: { 'User-Agent': 'GCR-TruckTrack/1.0' } })
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setRouteCoordinates(coords);
          setTruckCoordIndex(0);

          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
            animated: true,
          });
        }
      })
      .catch((err) => {
        console.warn('Routing error:', err);
        setRouteCoordinates([origin, destination]);
      });
  }, [selectedTruck]);

  // Sped up to 800ms for smoother truck animation along the route
  useEffect(() => {
    if (!routeCoordinates.length) return;

    const interval = setInterval(() => {
      setTruckCoordIndex((prev) => {
        if (prev + 1 < routeCoordinates.length) {
          return prev + 1;
        }
        return prev; // Stop when destination is reached
      });
    }, 800);

    return () => clearInterval(interval);
  }, [routeCoordinates]);

  if (!selectedTruck) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>GCR FOOD</Text>
            <Text style={styles.headerSubtitle}>Products Trading • Live Logistics</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL('tel:8634-7097')}
          >
            <Ionicons name="call" size={22} color="#0284c7" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Active Fleet Dispatches</Text>

          {DISPATCHES.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardId}>#{item.id}</Text>
                  <Text style={styles.cardDriver}>
                    {item.driver} • {item.vehicle}
                  </Text>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaText}>{item.eta}</Text>
                </View>
              </View>

              <View style={styles.destRow}>
                <Ionicons name="location-outline" size={18} color="#0284c7" />
                <Text style={styles.destText}>{item.destinationName}</Text>
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setSelectedTruck(item)}
              >
                <Text style={styles.actionBtnText}>View Live Map →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const currentTruckPos =
    routeCoordinates.length > 0
      ? routeCoordinates[truckCoordIndex]
      : selectedTruck.origin;

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: selectedTruck.origin.latitude,
          longitude: selectedTruck.origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0284c7"
            strokeWidth={5}
          />
        )}

        <Marker coordinate={currentTruckPos} title={`Truck #${selectedTruck.id}`}>
          <View style={styles.truckMarker}>
            <Ionicons name="bus" size={20} color="#ffffff" />
          </View>
        </Marker>

        <Marker
          coordinate={selectedTruck.destination}
          title={selectedTruck.destinationName}
        >
          <View style={styles.destMarker}>
            <Ionicons name="location" size={22} color="#0f172a" />
          </View>
        </Marker>
      </MapView>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setSelectedTruck(null)}
      >
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
      </TouchableOpacity>

      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.bottomCardTitle}>
              Delivery Route: {selectedTruck.id}
            </Text>
            <Text style={styles.bottomCardDest}>
              {selectedTruck.destinationName}
            </Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{selectedTruck.eta}</Text>
          </View>
        </View>

        <Text style={styles.driverInfo}>
          Driver: {selectedTruck.driver} • Contact: {selectedTruck.contact}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#38bdf8', paddingHorizontal: 20, paddingVertical: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: '#e0f2fe', marginTop: 2 },
  callButton: { backgroundColor: '#ffffff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardId: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  cardDriver: { fontSize: 13, color: '#64748b', marginTop: 2 },
  etaBadge: { backgroundColor: '#e0f2fe', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  etaText: { color: '#0284c7', fontWeight: '700', fontSize: 12 },
  destRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 6 },
  destText: { fontSize: 14, color: '#334155' },
  actionBtn: { backgroundColor: '#38bdf8', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  mapContainer: { flex: 1 },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: '#ffffff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  truckMarker: { backgroundColor: '#38bdf8', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff' },
  destMarker: { padding: 4 },
  bottomCard: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#ffffff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  bottomCardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  bottomCardDest: { fontSize: 13, color: '#64748b', marginTop: 2 },
  driverInfo: { marginTop: 12, fontSize: 12, color: '#475569' },
});
