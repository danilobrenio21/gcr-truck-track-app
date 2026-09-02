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
  FlatList,
  Keyboard,
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

  // Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [trafficCondition, setTrafficCondition] = useState(null);

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const debounceTimer = useRef(null);

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
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
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

  // Live Suggestion Search locked to Philippines locations & landmarks
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(text.trim());
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=ph&addressdetails=1&limit=6`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'GCR-TruckTrack-App/1.0 (dispatch@gcrtrucktrack.ph)',
          },
        });
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.warn('Search autocomplete failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select place from suggestions
  const selectSuggestion = (item) => {
    Keyboard.dismiss();
    setSuggestions([]);
    const title = item.name || item.display_name.split(',')[0];
    setSearchQuery(title);

    const target = {
      name: title,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };

    setDestination(target);
    calculateRoute(target);
  };

  // Turn-by-Turn Route + Traffic Flow Calculation
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

          const durationMins = Math.round(route.duration / 60);
          const distanceVal = (route.distance / 1000).toFixed(1);
          setEtaMinutes(durationMins);
          setDistanceKm(distanceVal);

          const avgSpeedKmh = (route.distance / 1000) / (route.duration / 3600);
          if (avgSpeedKmh < 18) {
            setTrafficCondition({ label: 'Heavy Traffic Flow', color: '#ef4444', polyColor: '#dc2626' });
          } else if (avgSpeedKmh < 35) {
            setTrafficCondition({ label: 'Moderate Traffic Flow', color: '#f59e0b', polyColor: '#d97706' });
          } else {
            setTrafficCondition({ label: 'Light / Free Flowing Traffic', color: '#22c55e', polyColor: '#0284c7' });
          }

          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 180, right: 60, bottom: 280, left: 60 },
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
      Alert.alert('Target Missing', 'Please select a destination from suggestions first.');
      return;
    }
    setIsNavigating(true);
    setIsBroadcasting(true);
  };

  // 1. DRIVER LOGIN SCREEN
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

  // 2. ACTIVE DRIVER NAVIGATION INTERFACE
  return (
    <SafeAreaView style={styles.container}>
      {/* Terminal Header Bar */}
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

      {/* Live Broadcast Bar */}
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

      {/* Dynamic Search Box & Autocomplete Suggestions List */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, SM Mall, warehouse, street in PH..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearchTextChange}
            clearButtonMode="while-editing"
          />
          {isSearching && <ActivityIndicator size="small" color="#0284c7" />}
        </View>

        {/* Live Auto-Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.place_id || index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={18} color="#0284c7" style={{ marginTop: 2 }} />
                  <View style={styles.suggestionTextWrapper}>
                    <Text style={styles.suggestionPrimary} numberOfLines={1}>
                      {item.name || item.display_name.split(',')[0]}
                    </Text>
                    <Text style={styles.suggestionSecondary} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
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

      {/* Bottom Dispatch Panel */}
      <View style={styles.actionSheet}>
        {destination ? (
          <View style={styles.metricsBox}>
            <View style={styles.metricsRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.destLabel}>DESTINATION</Text>
                <Text style={styles.destHeading} numberOfLines={1}>{destination.name}</Text>
              </View>
              {etaMinutes !== null && (
                <View style={styles.etaContainer}>
                  <Text style={styles.etaValue}>{etaMinutes}</Text>
                  <Text style={styles.etaUnit}>MINS</Text>
                </View>
              )}
            </View>

            {trafficCondition && (
              <View style={styles.trafficBanner}>
                <Ionicons name="speedometer" size={16} color={trafficCondition.color} />
                <Text style={[styles.trafficText, { color: trafficCondition.color }]}>
                  {trafficCondition.label} • {distanceKm} km
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
                  setSearchQuery('');
                }}
              >
                <Ionicons name="stop-circle" size={18} color="#ffffff" />
                <Text style={styles.btnText}>Complete / Cancel Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noRouteState}>
            <Ionicons name="search-outline" size={22} color="#64748b" />
            <Text style={styles.noRouteText}>Type any Philippine address or landmark above to see suggestions.</Text>
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

  searchSection: {
    position: 'absolute',
    top: 115,
    left: 14,
    right: 14,
    zIndex: 99,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionTextWrapper: { flex: 1 },
  suggestionPrimary: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  suggestionSecondary: { fontSize: 11, color: '#64748b', marginTop: 1 },

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
  destHeading: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
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
