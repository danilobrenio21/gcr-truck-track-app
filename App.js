import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Preset GCR Logistics Hubs around Metro Manila
const PRESET_DESTINATIONS = [
  { name: 'Grace Park, Caloocan Hub', latitude: 14.6438, longitude: 120.9858 },
  { name: 'Divisoria Logistics Depot', latitude: 14.6025, longitude: 120.9715 },
  { name: 'Balintawak Cold Storage', latitude: 14.6565, longitude: 120.9950 },
];

export default function App() {
  const [driverMode, setDriverMode] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(PRESET_DESTINATIONS[0]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  // Request iPhone GPS Permissions
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Turn on location permissions in iPhone Settings to broadcast dispatch location.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(initialPos);
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Live Location Watcher (triggers when broadcast or navigation is active)
  useEffect(() => {
    if (isBroadcasting || isNavigating) {
      startLocationTracking();
    } else {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    }
  }, [isBroadcasting, isNavigating]);

  const startLocationTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (newLoc) => {
        const coords = {
          latitude: newLoc.coords.latitude,
          longitude: newLoc.coords.longitude,
        };
        setCurrentLocation(coords);

        if (isNavigating && mapRef.current) {
          mapRef.current.animateCamera({
            center: coords,
            pitch: 45,
            heading: newLoc.coords.heading || 0,
            zoom: 17,
          });
        }
      }
    );
  };

  // Fetch actual turn-by-turn road route
  const startNavigation = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Location Missing', 'Acquiring GPS fix. Please try again.');
      return;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.longitude},${currentLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    fetch(url, { headers: { 'User-Agent': 'GCR-TruckTrack/1.0' } })
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setRouteCoordinates(coords);
          setIsNavigating(true);
          setIsBroadcasting(true);

          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
            animated: true,
          });
        }
      })
      .catch((err) => {
        console.warn('Routing error:', err);
        setRouteCoordinates([currentLocation, destination]);
        setIsNavigating(true);
      });
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRouteCoordinates([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GCR DRIVER TERMINAL</Text>
          <Text style={styles.headerSubtitle}>Unit #GCR-1082 • Fuso Canter 4W</Text>
        </View>
        <View style={styles.broadcastBox}>
          <Text style={styles.broadcastLabel}>
            {isBroadcasting ? 'LIVE GPS ON' : 'OFFLINE'}
          </Text>
          <Switch
            value={isBroadcasting}
            onValueChange={(val) => setIsBroadcasting(val)}
            trackColor={{ false: '#94a3b8', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Interactive Map */}
      <View style={styles.mapWrap}>
        {currentLocation && (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            showsUserLocation={false}
          >
            {/* Real Road Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#0284c7"
                strokeWidth={5}
              />
            )}

            {/* Your Phone's Current GPS Location as Truck */}
            <Marker coordinate={currentLocation} title="Your Vehicle (GCR-1082)">
              <View style={styles.truckPin}>
                <Ionicons name="bus" size={20} color="#ffffff" />
              </View>
            </Marker>

            {/* Target Destination Pin */}
            {destination && (
              <Marker coordinate={destination} title={destination.name}>
                <View style={styles.destPin}>
                  <Ionicons name="location" size={24} color="#dc2626" />
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      {/* Driver Destination Controls */}
      <View style={styles.controlSheet}>
        <Text style={styles.sheetTitle}>Dispatch Target</Text>

        {/* Quick Hub Selectors */}
        <View style={styles.hubContainer}>
          {PRESET_DESTINATIONS.map((hub, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.hubBtn,
                destination?.name === hub.name && styles.hubBtnActive,
              ]}
              onPress={() => setDestination(hub)}
            >
              <Text
                style={[
                  styles.hubBtnText,
                  destination?.name === hub.name && styles.hubBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {hub.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        {!isNavigating ? (
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={startNavigation}
          >
            <Ionicons name="navigate" size={18} color="#ffffff" />
            <Text style={styles.navigateBtnText}>
              Start Navigation & Share Live GPS
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={stopNavigation}
          >
            <Ionicons name="close-circle" size={18} color="#ffffff" />
            <Text style={styles.stopBtnText}>End Navigation</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  broadcastBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  broadcastLabel: { fontSize: 11, fontWeight: '700', color: '#38bdf8' },
  mapWrap: { flex: 1 },
  truckPin: {
    backgroundColor: '#0284c7',
    padding: 7,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  destPin: { padding: 2 },
  controlSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  hubContainer: { flexDirection: 'column', gap: 8, marginBottom: 14 },
  hubBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hubBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  hubBtnText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  hubBtnTextActive: { color: '#0284c7', fontWeight: '700' },
  navigateBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navigateBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  stopBtn: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  stopBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
