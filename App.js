import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Navigation & GPS State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Search & Telemetry State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [trafficCondition, setTrafficCondition] = useState(null);

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission required to broadcast live tracking.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isBroadcasting || isNavigating) {
      startTracking();
    } else if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
  }, [isBroadcasting, isNavigating]);

  const startTracking = async () => {
    if (locationSubscription.current) locationSubscription.current.remove();

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

  const handleLogin = () => {
    if (!driverName.trim() || !phoneNumber.trim() || !plateNumber.trim()) {
      Alert.alert('Required Fields', 'Please enter your Full Name, Phone Number, and Vehicle Plate Number.');
      return;
    }
    setIsAuthenticated(true);
    setIsBroadcasting(true);
  };

  // Search Address via OpenStreetMap Nominatim
  const searchAddress = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Empty', 'Please enter a landmark or street address.');
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`,
        {
          headers: {
            'User-Agent': 'GCR-TruckTrack-App/1.0 (contact@gcrtrucktrack.com)',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const target = {
          name: data[0].display_name.split(',')[0],
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
        setDestination(target);
        calculateRoute(target);
      } else {
        Alert.alert('Location Not Found', 'Could not locate that address. Try entering a clearer street name or landmark.');
      }
    } catch (err) {
      Alert.alert('Search Error', 'Network failure while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate Turn-by-Turn Route + Traffic Density + ETA
  const calculateRoute = (targetDest) => {
    if (!currentLocation || !targetDest) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.longitude},${currentLocation.latitude};${targetDest.longitude},${targetDest.latitude}?overview=full&geometries=geojson&annotations=true`;

    fetch(url, { headers: { 'User-Agent': 'GCR-TruckTrack-App/1.0' } })
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));
          setRouteCoordinates(coords);

          // Calculate ETA & Distance
          const durationMins = Math.round(route.duration / 60);
          const distanceInKm = (route.distance / 1000).toFixed(1);
          setEtaMinutes(durationMins);
          setDistanceKm(distanceInKm);

          // Assess Live Traffic Flow (Average Speed in km/h)
          const avgSpeedKmh = (route.distance / 1000) / (route.duration / 3600);
          if (avgSpeedKmh < 18) {
            setTrafficCondition({ label: 'Heavy Traffic Flow', color: '#ef4444', polyColor: '#dc2626' });
          } else if (avgSpeedKmh < 35) {
            setTrafficCondition({ label: 'Moderate Traffic Flow', color: '#f59e0b', polyColor: '#d97706' });
          } else {
            setTrafficCondition({ label: 'Light / Free Flowing Traffic', color: '#22c55e', polyColor: '#0284c7' });
          }

          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 140, right: 60, bottom: 280, left: 60 },
            animated: true,
          });
        }
      })
      .catch(() => {
        setRouteCoordinates([currentLocation, targetDest]);
      });
  };

  const startNavigation = () => {
    if (!destination || routeCoordinates.length === 0) {
      Alert.alert('Target Missing', 'Please search and select a destination first.');
      return;
    }
    setIsNavigating(true);
    setIsBroadcasting(true);
  };

  // 1. DRIVER AUTHENTICATION PORTAL
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.authKeyboardWrap}
        >
          <ScrollView contentContainerStyle={styles.authScroll}>
            <View style={styles.authHeader}>
              <View style={styles.logoBadge}>
                <Ionicons name="bus" size={32} color="#0284c7" />
              </View>
              <Text style={styles.authTitle}>GCR Food Logistics</Text>
              <Text style={styles.authSubtitle}>Driver Dispatch Terminal Login</Text>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.inputLabel}>DRIVER FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Danilo Brenio"
                value={driverName}
                onChangeText={setDriverName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0917-XXX-XXXX"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>VEHICLE PLATE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. NBD-4892"
                value={plateNumber}
                onChangeText={(val) => setPlateNumber(val.toUpperCase())}
                autoCapitalize="characters"
              />

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Sign In & Connect Terminal</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 2. ACTIVE DRIVER TERMINAL & NAVIGATION
  return (
    <SafeAreaView style={styles.container}>
      {/* Driver Info Header */}
      <View style={styles.terminalHeader}>
        <View>
          <Text style={styles.driverNameDisplay}>{driverName}</Text>
          <Text style={styles.driverSubDisplay}>
            Plate: <Text style={styles.plateHighlight}>{plateNumber}</Text> • {phoneNumber}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBadge}
          onPress={() => {
            setIsNavigating(false);
            setIsBroadcasting(false);
            setIsAuthenticated(false);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Broadcast Status Bar */}
      <View style={styles.broadcastRow}>
        <View style={styles.broadcastLeft}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: isBroadcasting ? '#22c55e' : '#94a3b8' },
            ]}
          />
          <Text style={styles.broadcastText}>
            {isBroadcasting ? 'LIVE GPS BROADCAST ACTIVE' : 'TRACKING OFFLINE'}
          </Text>
        </View>
        <Switch
          value={isBroadcasting}
          onValueChange={setIsBroadcasting}
          trackColor={{ false: '#94a3b8', true: '#22c55e' }}
          thumbColor="#ffffff"
        />
      </View>

      {/* Search Bar Overlay */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search street, market, warehouse..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={searchAddress}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#0284c7" />
          ) : (
            <TouchableOpacity onPress={searchAddress} style={styles.searchActionBtn}>
              <Text style={styles.searchActionBtnText}>Find</Text>
            </TouchableOpacity>
          )}
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
          >
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={trafficCondition ? trafficCondition.polyColor : '#0284c7'}
                strokeWidth={5}
              />
            )}

            <Marker coordinate={currentLocation} title={`${driverName} (${plateNumber})`}>
              <View style={styles.driverPin}>
                <Ionicons name="bus" size={18} color="#ffffff" />
              </View>
            </Marker>

            {destination && (
              <Marker coordinate={destination} title={destination.name}>
                <View style={styles.destPin}>
                  <Ionicons name="location" size={26} color="#dc2626" />
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      {/* Route & Traffic Control Panel */}
      <View style={styles.actionSheet}>
        {destination ? (
          <View style={styles.metricsBox}>
            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.destLabel}>TARGET DESTINATION</Text>
                <Text style={styles.destHeading} numberOfLines={1}>{destination.name}</Text>
              </View>
              {etaMinutes !== null && (
                <View style={styles.etaContainer}>
                  <Text style={styles.etaValue}>{etaMinutes}</Text>
                  <Text style={styles.etaUnit}>MINS</Text>
                </View>
              )}
            </View>

            {/* Live Traffic Indicator */}
            {trafficCondition && (
              <View style={styles.trafficBanner}>
                <Ionicons name="speedometer" size={16} color={trafficCondition.color} />
                <Text style={[styles.trafficText, { color: trafficCondition.color }]}>
                  {trafficCondition.label} • {distanceKm} km away
                </Text>
              </View>
            )}

            {!isNavigating ? (
              <TouchableOpacity style={styles.startNavBtn} onPress={startNavigation}>
                <Ionicons name="navigate" size={18} color="#ffffff" />
                <Text style={styles.btnText}>Start Turn-by-Turn Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopNavBtn}
                onPress={() => {
                  setIsNavigating(false);
                  setRouteCoordinates([]);
                  setDestination(null);
                  setTrafficCondition(null);
                }}
              >
                <Ionicons name="stop-circle" size={18} color="#ffffff" />
                <Text style={styles.btnText}>Complete / Cancel Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noRouteState}>
            <Ionicons name="map-outline" size={24} color="#64748b" />
            <Text style={styles.noRouteText}>Search a destination address above to calculate ETA & traffic.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: '#f8fafc' },
  authKeyboardWrap: { flex: 1 },
  authScroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  authHeader: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    backgroundColor: '#e0f2fe',
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  authTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  authSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  loginBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  container: { flex: 1, backgroundColor: '#0f172a' },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  driverNameDisplay: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  driverSubDisplay: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  plateHighlight: { color: '#38bdf8', fontWeight: '700' },
  logoutBadge: { backgroundColor: '#334155', padding: 8, borderRadius: 10 },
  broadcastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  broadcastLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  broadcastText: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },

  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  searchActionBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchActionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  mapWrap: { flex: 1 },
  driverPin: {
    backgroundColor: '#0284c7',
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  destPin: { padding: 2 },

  actionSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  noRouteState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  noRouteText: { color: '#64748b', fontSize: 13, flexShrink: 1 },
  metricsBox: { gap: 10 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destLabel: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  destHeading: { fontSize: 15, fontWeight: '700', color: '#0f172a', maxWidth: 240 },
  etaContainer: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  etaValue: { fontSize: 18, fontWeight: '800', color: '#0284c7' },
  etaUnit: { fontSize: 10, fontWeight: '700', color: '#0284c7' },
  trafficBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  trafficText: { fontSize: 12, fontWeight: '700' },
  startNavBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  stopNavBtn: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
